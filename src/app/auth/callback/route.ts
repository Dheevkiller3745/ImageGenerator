import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/serverSupabaseClient';
import { supabaseAdmin } from '@/utils/supabaseClient';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/workspace';

  const nextUrl = request.nextUrl.clone();

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session?.user) {
      const user = data.session.user;
      const userAgent = request.headers.get('user-agent') || 'OAuth Session';
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';

      // Record device session inside public.user_sessions
      try {
        await supabaseAdmin.from('user_sessions').insert({
          user_id: user.id,
          device_info: userAgent,
          ip_address: ipAddress,
        });
      } catch (dbErr) {
        console.error("Failed to insert OAuth device session log:", dbErr);
      }

      nextUrl.pathname = next;
      return NextResponse.redirect(nextUrl);
    }
  }

  // Fallback to error route
  nextUrl.pathname = '/login';
  nextUrl.searchParams.set('error', 'auth_failed');
  return NextResponse.redirect(nextUrl);
}
