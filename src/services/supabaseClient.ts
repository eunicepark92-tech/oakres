import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

const rawSupabaseUrl = (metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || '').trim();
// Strip trailing /rest/v1 or trailing slashes if accidentally provided
export const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('example.com')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Check if the Supabase database is connected and accessible.
 */
export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다.',
    };
  }

  try {
    const { error } = await supabase.from('public_partners').select('id').limit(1);
    if (error) {
      return {
        ok: false,
        message: `Supabase 조회 실패: ${error.message} (SQL 스키마 실행 확인 필요)`,
      };
    }
    return {
      ok: true,
      message: 'Supabase 영구 데이터베이스에 성공적으로 연결되었습니다.',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Supabase 연결 에러: ${err?.message || '알 수 없는 오류'}`,
    };
  }
}
