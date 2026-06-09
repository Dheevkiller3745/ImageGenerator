import React from 'react';
import Link from 'next/navigation';
import { createServerClient } from '@/utils/serverSupabaseClient';
import { 
  Sparkles, ShieldCheck, ShieldAlert, Image as ImageIcon, 
  Users, MessageSquare, Landmark, RefreshCw 
} from 'lucide-react';
import SignOutButton from './SignOutButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();
  
  // Get current session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return renderAccessDenied("Please sign in to access the administrator panel.");
  }

  // Domain gate validation: user email must end with @statics.agency
  if (!user.email.endsWith('@statics.agency')) {
    return renderAccessDenied(`Access Denied. Your account (${user.email}) does not have administrative privileges.`);
  }

  // 1. Fetch Stats
  const { count: totalGenerations } = await supabase
    .from('generations_log')
    .select('*', { count: 'exact', head: true });

  const { count: totalLeads } = await supabase
    .from('leads_log')
    .select('*', { count: 'exact', head: true });

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get active sessions inside 24 hours
  const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: activeSessionsToday } = await supabase
    .from('user_sessions')
    .select('*', { count: 'exact', head: true })
    .gt('logged_in_at', past24Hours);

  // 2. Fetch Lists
  // Recent Generations (last 20 rows, ordered by created_at DESC)
  const { data: generations } = await supabase
    .from('generations_log')
    .select(`
      id,
      prompt,
      engine,
      aspect_ratio,
      created_at,
      profiles (
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  // Recent Leads (last 20 rows)
  const { data: leads } = await supabase
    .from('leads_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // Active Sessions (last 7 days)
  const past7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: sessions } = await supabase
    .from('user_sessions')
    .select(`
      id,
      device_info,
      ip_address,
      logged_in_at,
      profiles (
        email
      )
    `)
    .gt('logged_in_at', past7Days)
    .order('logged_in_at', { ascending: false })
    .limit(20);

  return (
    <div className="relative min-h-screen bg-[#09090c] text-[#f3f3f6] flex flex-col font-sans overflow-y-auto">
      {/* Background orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,_rgba(124,77,255,0.06)_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,_rgba(255,64,129,0.03)_0%,_transparent_70%)] pointer-events-none"></div>

      {/* Header bar */}
      <header className="w-full h-[70px] px-6 lg:px-12 flex justify-between items-center z-40 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0">
        <div className="logo-area flex items-center gap-3">
          <div className="spark-icon-container bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(124,77,255,0.25)]">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <h2 className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
            Aether<span className="text-[#7c4dff] font-normal">Image</span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#7c4dff]/15 border border-[#7c4dff]/30 text-[#9e75ff] rounded-md uppercase tracking-wider">Admin</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/50 hidden sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full flex flex-col gap-8 z-30">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Total Generations</span>
              <ImageIcon className="w-4.5 h-4.5 text-[#7c4dff]" />
            </div>
            <p className="text-3xl font-extrabold text-white">{totalGenerations ?? 0}</p>
            <p className="text-[10px] text-white/30 mt-1">Telemetry log index</p>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Captured Leads</span>
              <MessageSquare className="w-4.5 h-4.5 text-[#ff4081]" />
            </div>
            <p className="text-3xl font-extrabold text-white">{totalLeads ?? 0}</p>
            <p className="text-[10px] text-white/30 mt-1">WhatsApp integrations</p>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Registered Users</span>
              <Users className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{totalUsers ?? 0}</p>
            <p className="text-[10px] text-white/30 mt-1">Synchronized accounts</p>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Active Sessions</span>
              <Landmark className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{activeSessionsToday ?? 0}</p>
            <p className="text-[10px] text-white/30 mt-1">Inside past 24 hours</p>
          </div>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Generations list */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#7c4dff]" /> Recent Generations
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-white/30 font-bold">
                    <th className="py-2.5 px-3">Prompt</th>
                    <th className="py-2.5 px-3">Engine</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {generations && generations.length > 0 ? (
                    generations.map((gen: any) => (
                      <tr key={gen.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors text-white/80">
                        <td className="py-3 px-3 max-w-[200px] truncate" title={gen.prompt}>{gen.prompt}</td>
                        <td className="py-3 px-3 uppercase text-[10px] font-mono text-white/40">{gen.engine}</td>
                        <td className="py-3 px-3 text-white/50 font-mono text-[10px]">{gen.profiles?.email || 'Anonymous'}</td>
                        <td className="py-3 px-3 text-white/30 text-[10px]">{new Date(gen.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-white/30 italic">No generations logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leads list */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#ff4081]" /> Captured Leads
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-white/30 font-bold">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Target Prompt</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-white/80">
                  {leads && leads.length > 0 ? (
                    leads.map((l: any) => (
                      <tr key={l.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">{l.name}</td>
                        <td className="py-3 px-3 text-white/50 font-mono text-[10px]">{l.email}</td>
                        <td className="py-3 px-3 max-w-[150px] truncate text-white/40" title={l.target_prompt}>{l.target_prompt}</td>
                        <td className="py-3 px-3 text-white/30 text-[10px]">{new Date(l.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-white/30 italic">No leads captured yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 flex flex-col gap-4 lg:col-span-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-400" /> Multi-Device Logged Sessions (7 days)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-white/30 font-bold">
                    <th className="py-2.5 px-3">User Email</th>
                    <th className="py-2.5 px-3">Device User Agent</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Login Time</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-white/80">
                  {sessions && sessions.length > 0 ? (
                    sessions.map((s: any) => (
                      <tr key={s.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">{s.profiles?.email || 'Unknown'}</td>
                        <td className="py-3 px-3 text-white/40 max-w-[320px] truncate" title={s.device_info}>{s.device_info}</td>
                        <td className="py-3 px-3 font-mono text-[10px] text-white/50">{s.ip_address}</td>
                        <td className="py-3 px-3 text-white/30 text-[10px]">{new Date(s.logged_in_at).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-white/30 italic">No sessions logged in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function renderAccessDenied(message: string) {
  return (
    <div className="relative min-h-screen bg-[#09090c] text-[#f3f3f6] flex items-center justify-center p-6 font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(255,64,129,0.08)_0%,_transparent_70%)] pointer-events-none"></div>
      
      <div className="w-full max-w-[440px] z-30 text-center">
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Administrator Restricted Area</h3>
            <p className="text-xs text-white/50 mt-2 leading-relaxed">
              {message}
            </p>
          </div>
          <div className="flex gap-4 w-full mt-2">
            <a href="/login" className="flex-1">
              <button className="w-full bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] text-white text-xs font-bold py-3 rounded-xl cursor-pointer">
                Authentication Portal
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
