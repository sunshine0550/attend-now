import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('.env.local 에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요')
}

export const supabase = createClient(url, anonKey)

/** audit 컬럼(created_by / updated_by / deleted_by)에 넣을 선생님 UUID */
export const TEACHER_ID = process.env.TEACHER_ID ?? null
