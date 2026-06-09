'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Chrome, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

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
          await logSessionAPI();
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
        
        await logSessionAPI();
        router.push('/workspace');
      }
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
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize Google login.");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#09090c] text-[#f3f3f6] flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(124,77,255,0.1)_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(255,64,129,0.05)_0%,_transparent_70%)] pointer-events-none"></div>

      <div className="w-full max-w-[440px] z-30">
        {/* Glassmorphic Auth Box */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-3.5 mb-8">
            <div className="spark-icon-container bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(124,77,255,0.25)]">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display tracking-tight text-white">
                Aether<span className="text-[#7c4dff] font-normal">Image</span>
              </h2>
              <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1">Enterprise Portal</p>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl mb-6 relative">
            <button
              onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors z-10 cursor-pointer ${!isSignUp ? 'text-white' : 'text-white/40'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors z-10 cursor-pointer ${isSignUp ? 'text-white' : 'text-white/40'}`}
            >
              Create Account
            </button>
            <motion.div
              className="absolute top-1 bottom-1 bg-white/5 rounded-lg border border-white/10"
              layout
              initial={false}
              animate={{
                left: isSignUp ? '50%' : '4px',
                right: isSignUp ? '4px' : '50%',
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
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
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:border-[#7c4dff] focus:bg-white/[0.07] focus:outline-none transition-all"
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
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:border-[#7c4dff] focus:bg-white/[0.07] focus:outline-none transition-all"
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
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:border-[#7c4dff] focus:bg-white/[0.07] focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] text-white text-xs font-bold py-3.5 rounded-xl mt-2 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(124,77,255,0.3)] hover:shadow-[0_8px_24px_rgba(124,77,255,0.45)] hover:scale-[1.01] active:scale-100 disabled:opacity-50 transition-all"
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
            className="w-full glass-panel glass-panel-hover border border-white/5 text-white text-xs font-semibold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <Chrome className="w-4 h-4 text-[#ff4081]" />
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
