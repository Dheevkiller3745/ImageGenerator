'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Sparkles, Sun, Moon, User as UserIcon, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { User } from '@supabase/supabase-js';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Don't render theme toggle until mounted to prevent hydration mismatch
  if (!mounted) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-[80px] px-6 lg:px-16 flex justify-between items-center z-50 bg-background/60 backdrop-blur-md border-b border-[var(--panel-border)] transition-colors duration-300">
      <div className="logo-area flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <div className="spark-icon-container bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] w-9 h-9 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight text-foreground hidden sm:block">
            STATICs<span className="text-foreground/60 font-normal"> Workspace</span>
          </h2>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-[var(--panel-bg)] border border-[var(--panel-border)] hover:bg-[var(--primary-glow)] transition-colors text-foreground/80 cursor-pointer"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-2 px-3 rounded-xl bg-[var(--panel-bg)] border border-[var(--panel-border)] hover:bg-[var(--primary-glow)] transition-colors cursor-pointer"
            >
              <UserIcon className="w-5 h-5 text-foreground/80" />
              <span className="text-xs font-semibold text-foreground hidden sm:block">Profile</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-background border border-[var(--panel-border)] rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-[var(--panel-border)] mb-1">
                  <p className="text-xs text-foreground/60 truncate">{user.email}</p>
                </div>
                
                <Link href="/workspace" onClick={() => setDropdownOpen(false)}>
                  <div className="px-4 py-2 text-sm text-foreground hover:bg-[var(--primary-glow)] flex items-center gap-2 cursor-pointer transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Workspace
                  </div>
                </Link>

                {user.email?.endsWith('@statics.agency') && (
                  <Link href="/admin" onClick={() => setDropdownOpen(false)}>
                    <div className="px-4 py-2 text-sm text-foreground hover:bg-[var(--primary-glow)] flex items-center gap-2 cursor-pointer transition-colors">
                      <Settings className="w-4 h-4" /> Admin Console
                    </div>
                  </Link>
                )}

                <div 
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer transition-colors border-t border-[var(--panel-border)] mt-1"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </div>
              </div>
            )}
          </div>
        ) : (
          pathname !== '/login' && (
            <Link href="/login">
              <button className="clay-btn px-5 py-2.5 text-xs font-semibold text-foreground flex items-center gap-2 cursor-pointer">
                Sign In
              </button>
            </Link>
          )
        )}
      </div>
    </header>
  );
}
