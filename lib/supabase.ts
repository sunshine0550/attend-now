// 이 모듈이 클라이언트 번들에 섞이면 빌드가 실패한다.
// service_role 키는 RLS를 전부 우회하므로 절대 브라우저로 나가면 안 된다.
import 'server-only'

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  throw new Error('.env.local 에 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 설정하세요')
}

export const supabase = createClient(url, serviceRoleKey, {
  // 서버에서만 쓰므로 세션을 저장하거나 갱신할 필요가 없다
  auth: { persistSession: false, autoRefreshToken: false },
})
