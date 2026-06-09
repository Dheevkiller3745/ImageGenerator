import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet: any) {
        cookiesToSet.forEach(({ name, value, options }: any) => {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const nextUrl = request.nextUrl.clone();
  const pathname = nextUrl.pathname;

  // Protect /workspace and /admin routes
  if (!user && (pathname.startsWith('/workspace') || pathname.startsWith('/admin'))) {
    nextUrl.pathname = '/login';
    return NextResponse.redirect(nextUrl);
  }

  // Prevent logged-in users from visiting login or signup page
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    nextUrl.pathname = '/workspace';
    return NextResponse.redirect(nextUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/workspace/:path*',
    '/workspace',
    '/admin/:path*',
    '/admin',
    '/login',
    '/signup',
  ],
};
