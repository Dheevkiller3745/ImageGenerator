import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/serverSupabaseClient';
import { supabaseAdmin } from '@/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { userAgent } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';

    // Insert user session details inside database
    const { error } = await supabaseAdmin.from('user_sessions').insert({
      user_id: user.id,
      device_info: userAgent || 'Unknown Device',
      ip_address: ipAddress,
    });

    if (error) {
      console.error("Supabase Error logging user session:", error);
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "success" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Session logger endpoint exception:", err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
