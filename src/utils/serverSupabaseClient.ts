import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export async function createServerClient() {
  const cookieStore = await cookies();
  
  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAll(cookiesToSet: any[]) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookiesToSet.forEach(({ name, value, options }: any) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore
        }
      },
    },
  });
}
