/**
 * 아이디 규칙 — 소문자·숫자·밑줄, 4~20자.
 *
 * 대문자를 막는 이유: DB 조회는 대소문자를 구분하므로 `Suhyun` 으로 가입하고
 * `suhyun` 으로 로그인하면 실패한다. 입력 단계에서 소문자로 통일해 그 혼란을 없앤다.
 */
export const LOGIN_ID_RULE = /^[a-z0-9_]{4,20}$/

export function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase()
}

export function loginIdError(raw: string): string | null {
  const id = normalizeLoginId(raw)
  if (id.length < 4) return '아이디는 4자 이상이어야 합니다'
  if (id.length > 20) return '아이디는 20자 이하여야 합니다'
  if (!LOGIN_ID_RULE.test(id)) return '아이디는 영문 소문자, 숫자, 밑줄(_)만 쓸 수 있습니다'
  return null
}

export const MIN_PASSWORD = 8

export function passwordError(password: string): string | null {
  if (password.length < MIN_PASSWORD) return `비밀번호는 ${MIN_PASSWORD}자 이상이어야 합니다`
  return null
}
