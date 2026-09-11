/**
 * 클라이언트 컴포넌트도 쓰는 타입·상수.
 * lib/invites.ts 는 server-only 라 클라이언트에서 import 할 수 없어 분리했다.
 */

export const INVITE_TTL_DAYS = 7

export type Invite = {
  code: string
  note: string | null
  expires_at: string
  used_at: string | null
  created_at: string
}
