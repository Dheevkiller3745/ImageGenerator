'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Chrome, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/utils/supabaseClient';
import { Navbar } from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Render configuration error if keys are not set
  if (!isSupabaseConfigured) {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans overflow-hidden">
        {/* Subtle SaaS grid background */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="w-full max-w-[500px] z-30">
          <div className="clay-panel p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[radial-gradient(circle,var(--secondary-glow)_0%,_transparent_70%)] pointer-events-none"></div>

            <div className="text-center flex flex-col items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display tracking-tight text-white">
                  Configuration Required
                </h2>
                <p className="text-[11px] text-amber-400 uppercase tracking-widest mt-1">Supabase Keys Missing</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-xs text-zinc-300 leading-relaxed bg-[#121216]/60 border border-white/5 rounded-2xl p-5 mb-6">
              <p>
                STATICs requires active connection credentials to persist your generated canvas sessions and user profiles.
              </p>
              <p className="font-semibold text-white">
                Please add these Environment Variables to your local `.env` file or your Vercel Dashboard Settings:
              </p>
              <ul className="list-disc pl-4 flex flex-col gap-2 font-mono text-[11px] text-[#9e75ff]">
                <li><span className="text-white font-semibold">NEXT_PUBLIC_SUPABASE_URL</span> = Your Supabase Project URL</li>
                <li><span className="text-white font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> = Your Anon / Public Key</li>
                <li><span className="text-white font-semibold">SUPABASE_SERVICE_ROLE_KEY</span> = Your Service Role Secret</li>
              </ul>
              <p className="text-[10px] text-zinc-500 border-t border-white/5 pt-3">
                Refer to <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">WALKTHROUGH_SETUP.md</code> in the repository root for detailed table schemas and trigger scripts.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-[#7c4dff] to-[#ff4081] border-none text-white text-xs font-bold py-3.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(124,77,255,0.25)] active:scale-[0.98] transition-all"
            >
              <span>Verify & Re-check Configuration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auto-redirect if user has an active session
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/workspace');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push('/workspace');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Form validator
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              display_name: name.trim(),
            },
          },
        });

        if (error) throw error;
        
        if (data.session) {
          // Instantly logged in (e.g. email verification disabled)
          logSessionAPI();
          router.push('/workspace');
        } else {
          setSuccessMsg("Account created! Please check your email to verify your address.");
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;
        
        logSessionAPI();
        router.push('/workspace');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const logSessionAPI = async () => {
    try {
      await fetch('/api/auth/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser',
        }),
      });
    } catch (e) {
      console.error("Session logger call failed:", e);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize Google login.");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans overflow-hidden transition-colors duration-300">
      <Navbar />
      {/* Subtle SaaS grid background */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="w-full max-w-[440px] z-30 mt-16">
        {/* Claymorphic Auth Box */}
        <div className="clay-panel p-8 sm:p-10 relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display tracking-tight text-white">
                STATICs
              </h2>
              <p className="text-[11px] text-zinc-400 uppercase tracking-widest mt-1">Enterprise Auth</p>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-[#121216] border border-white/5 p-1 rounded-xl mb-6 relative shadow-inner">
            <button
              onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-md transition-colors z-10 cursor-pointer ${!isSignUp ? 'text-white' : 'text-white/40'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-md transition-colors z-10 cursor-pointer ${isSignUp ? 'text-white' : 'text-white/40'}`}
            >
              Create Account
            </button>
            <motion.div
              className="absolute top-1 bottom-1 bg-gradient-to-r from-[#7c4dff] to-[#ff4081] rounded-md shadow-[0_2px_10px_rgba(124,77,255,0.35)] border border-white/10"
              layout
              initial={false}
              animate={{
                left: isSignUp ? '50%' : '4px',
                right: isSignUp ? '4px' : '50%',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-white/50 px-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full clay-input pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-white/50 px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  required
                  placeholder="name@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full clay-input pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-white/50 px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full clay-input pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full clay-panel clay-panel-hover bg-gradient-to-r from-[#7c4dff] to-[#ff4081] border border-white/10 text-white text-xs font-bold py-3.5 mt-2 cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(124,77,255,0.25)] active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/20 px-3">or</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Social login */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs font-semibold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
          >
            <Chrome className="w-4 h-4 text-white" />
            <span>Continue with Google</span>
          </button>

          {/* Security details box */}
          <div className="mt-8 p-3 rounded-xl bg-white/[0.01] border border-white/5 flex gap-2.5 items-start">
            <ShieldCheck className="w-4 h-4 text-[#7c4dff] shrink-0 mt-0.5" />
            <p className="text-[9px] text-[#8e909c] leading-normal font-medium">
              Sessions are tracked per device. You can view active sessions inside the workspace console. Restricted admin features validate email domains automatically.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
