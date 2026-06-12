'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="clay-panel clay-panel-hover flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white/70 hover:text-white transition-all cursor-pointer border border-white/5"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Sign Out</span>
    </button>
  );
}
