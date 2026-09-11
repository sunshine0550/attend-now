import 'server-only'

import { INVITE_TTL_DAYS, type Invite } from '@/lib/invites-shared'
import { supabase } from '@/lib/supabase'

export { INVITE_TTL_DAYS, type Invite }

/**
 * 일회용 초대 코드.
 *
 * 환경변수에 코드 하나를 두는 방식은 한 번 새면 영구히 유효하고 누가 썼는지
 * 알 수 없다. 그래서 코드를 DB 에 발급하고 쓰는 즉시 소진시킨다.
 */

/** 헷갈리는 글자(0/O, 1/I/L) 를 뺀 알파벳 — 코드를 사람이 받아 적기 때문 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** XXXX-XXXX-XXXX */
function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length])
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)].map((g) => g.join('')).join('-')
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s/g, '')
}

export async function createInvite(teacherId: string, note?: string): Promise<Invite> {
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000)

  const { data, error } = await supabase
    .from('invites')
    .insert({
      code: generateCode(),
      note: note?.trim() || null,
      expires_at: expiresAt.toISOString(),
      created_by: teacherId,
    })
    .select('code, note, expires_at, used_at, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data as Invite
}

export async function listInvites(teacherId: string): Promise<Invite[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('code, note, expires_at, used_at, created_at')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data ?? []) as Invite[]
}

/**
 * 코드를 원자적으로 소진한다.
 *
 * 읽고 나서 쓰면 두 사람이 같은 코드로 동시에 가입할 수 있다.
 * `used_at is null` 조건이 붙은 UPDATE 는 한쪽만 성공하므로 그걸로 잠근다.
 * 계정 생성이 실패하면 releaseInvite 로 되돌린다.
 */
export async function claimInvite(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeCode(code)
  if (!normalized) return { ok: false, error: '초대 코드를 입력하세요' }

  const { data, error } = await supabase
    .from('invites')
    .update({ used_at: new Date().toISOString() })
    .eq('code', normalized)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('code')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }

  if (!data) {
    // 없는 코드인지, 이미 썼는지, 만료됐는지 구분해 알려준다.
    // 초대 코드는 비밀번호와 달라 존재 여부가 새어도 위험하지 않고,
    // 안내가 구체적이어야 사용자가 다음 행동을 알 수 있다.
    const { data: existing } = await supabase
      .from('invites')
      .select('used_at, expires_at')
      .eq('code', normalized)
      .maybeSingle()

    if (!existing) return { ok: false, error: '존재하지 않는 초대 코드입니다' }
    if (existing.used_at) return { ok: false, error: '이미 사용된 초대 코드입니다' }
    return { ok: false, error: '만료된 초대 코드입니다' }
  }

  return { ok: true }
}

/** 코드를 소진한 뒤 계정 생성이 실패했을 때 되돌린다 */
export async function releaseInvite(code: string) {
  await supabase.from('invites').update({ used_at: null }).eq('code', normalizeCode(code))
}

/** 누가 썼는지 기록 (소진 성공 후) */
export async function markInviteUsedBy(code: string, teacherId: string) {
  await supabase.from('invites').update({ used_by: teacherId }).eq('code', normalizeCode(code))
}
