'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useTheme } from 'next-themes';
import { 
  Sliders, Eye, Type, Sparkles, ArrowLeft, 
  Check, Sun, Moon, HelpCircle, AlertCircle
} from 'lucide-react';

export default function PersonalizationPage() {
  const { theme, setTheme } = useTheme();
  const store = useWorkspaceStore();
  
  // Local state for toast notification
  const [showToast, setShowToast] = React.useState(false);

  const triggerSaveNotification = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans overflow-y-auto transition-colors duration-300">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[radial-gradient(circle,var(--primary-glow)_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[radial-gradient(circle,var(--secondary-glow)_0%,_transparent_70%)] pointer-events-none"></div>

      <Navbar />

      <main className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full flex flex-col gap-8 z-30 mt-[80px]">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <Link href="/workspace">
            <button className="flex items-center gap-2 text-xs font-semibold text-[#8e909c] hover:text-white transition-all cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
            </button>
          </Link>
          <div className="badge px-3 py-1 rounded-full bg-[#7c4dff]/10 border border-[#7c4dff]/20 text-[10px] uppercase font-bold tracking-widest text-[#9e75ff]">
            Accessibility Dashboard
          </div>
        </div>

        {/* Section Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold font-display text-white flex items-center gap-3">
            <Sliders className="w-7 h-7 text-[#7c4dff]" /> Personalise Interface
          </h1>
          <p className="text-sm text-[#8e909c] max-w-lg leading-relaxed">
            Customize typographic sizes, color contrast grids, and theme structures. Optimized for diverse visual processing capabilities and accessibility defaults.
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] gap-8">
          
          {/* Controls List */}
          <div className="flex flex-col gap-6">
            
            {/* 1. Theme Configuration */}
            <div className="clay-panel p-6 flex flex-col gap-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-2 border-b border-white/5 pb-3">
                <Sun className="w-4 h-4 text-amber-400" /> Theme Mode
              </h3>
              <p className="text-xs text-[#8e909c] leading-relaxed">
                Choose the visual tone of the canvas studio. Dark mode protects eye fatigue in dim lighting; Light mode maximizes absolute contrast in well-lit conditions.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  onClick={() => { setTheme('dark'); triggerSaveNotification(); }}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#7c4dff]/15 border-[#7c4dff] text-white font-bold' 
                      : 'bg-white/[0.02] border-white/5 text-[#8e909c] hover:bg-white/[0.05]'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-[11px]">Dark Mode</span>
                </button>
                <button
                  onClick={() => { setTheme('light'); triggerSaveNotification(); }}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                    theme === 'light' 
                      ? 'bg-[#7c4dff]/15 border-[#7c4dff] text-white font-bold' 
                      : 'bg-white/[0.02] border-white/5 text-[#8e909c] hover:bg-white/[0.05]'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-[11px]">Light Mode</span>
                </button>
              </div>
            </div>

            {/* 2. High Contrast toggle */}
            <div className="clay-panel p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" /> High Contrast Grid
                </h3>
                <label className="toggle-switch flex items-center gap-1.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={store.highContrast}
                    onChange={(e) => { store.setHighContrast(e.target.checked); triggerSaveNotification(); }}
                    className="hidden peer"
                  />
                  <div className="w-8 h-4.5 bg-white/10 rounded-full relative transition-all peer-checked:bg-[#7c4dff] after:content-[''] after:absolute after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:left-0.5 after:top-0.5 peer-checked:after:translate-x-3.5 after:transition-all"></div>
                </label>
              </div>
              <p className="text-xs text-[#8e909c] leading-relaxed">
                Forces a pure black/white background-foreground palette and increases grid border weights. Recommended for users requiring severe contrast boundary definition to navigate sections easily.
              </p>
            </div>

            {/* 3. Typography Adjustments */}
            <div className="clay-panel p-6 flex flex-col gap-5">
              <h3 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-2 border-b border-white/5 pb-3">
                <Type className="w-4 h-4 text-[#ff4081]" /> Typographic Visibility
              </h3>
              
              {/* Font Size select */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-white/70">
                  <label className="font-semibold">Text Scaling Factor</label>
                  <span className="capitalize text-[10px] font-bold text-[#ff4081] bg-[#ff4081]/15 px-2 py-0.5 rounded-full">{store.fontSizeMultiplier}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {(['small', 'normal', 'large', 'huge'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => { store.setFontSizeMultiplier(size); triggerSaveNotification(); }}
                      className={`py-2 px-1 text-center rounded-lg border text-[10px] font-bold capitalize cursor-pointer transition-all ${
                        store.fontSizeMultiplier === size 
                          ? 'bg-[#ff4081]/15 border-[#ff4081] text-white' 
                          : 'bg-white/[0.02] border-white/5 text-[#8e909c] hover:bg-white/[0.04]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dyslexic toggle */}
              <div className="flex justify-between items-center pt-3 border-t border-white/[0.02]">
                <div>
                  <label className="text-xs font-semibold text-white/70 block">Dyslexic-Friendly Typography</label>
                  <span className="text-[10px] text-[#8e909c] block mt-0.5">Increases character tracking and word spacing.</span>
                </div>
                <label className="toggle-switch flex items-center gap-1.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={store.dyslexicFriendlyFont}
                    onChange={(e) => { store.setDyslexicFriendlyFont(e.target.checked); triggerSaveNotification(); }}
                    className="hidden peer"
                  />
                  <div className="w-8 h-4.5 bg-white/10 rounded-full relative transition-all peer-checked:bg-[#7c4dff] after:content-[''] after:absolute after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:left-0.5 after:top-0.5 peer-checked:after:translate-x-3.5 after:transition-all"></div>
                </label>
              </div>

            </div>

          </div>

          {/* Live Preview Sidecard */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] uppercase tracking-wider text-[#8e909c] font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#7c4dff]" /> Live UI Preview
            </h4>
            
            <div className="clay-panel p-5 relative overflow-hidden flex flex-col gap-4 border border-white/5 shadow-2xl">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-[radial-gradient(circle,var(--primary-glow)_0%,_transparent_70%)] pointer-events-none"></div>
              
              {/* Fake App header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono">Workspace View</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              
              {/* Target Preview block */}
              <div className="preview-card bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#7c4dff]/15 flex items-center justify-center text-xs text-[#9e75ff]"><Sparkles className="w-3.5 h-3.5" /></div>
                  <span className="text-[11px] font-bold text-white">Dynamic Preview Card</span>
                </div>
                <p className="text-[10px] text-[#8e909c] leading-relaxed">
                  As you toggle settings on the left, this card changes size, font spacing, and contrast parameters instantly. 
                </p>
                <div className="flex gap-2 mt-1">
                  <button className="clay-panel flex-1 py-1.5 text-[9px] font-bold text-center text-white border border-white/5 cursor-pointer">
                    Cancel Settings
                  </button>
                  <Link href="/workspace" className="flex-1">
                    <button className="w-full bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] text-white text-[9px] font-bold py-1.5 rounded-lg cursor-pointer text-center">
                      Launch Studio
                    </button>
                  </Link>
                </div>
              </div>

              {/* Informative Tip */}
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex gap-2 items-start">
                <AlertCircle className="w-3.5 h-3.5 text-[#7c4dff] shrink-0 mt-0.5" />
                <p className="text-[9px] text-[#8e909c] leading-normal font-medium">
                  Settings are auto-saved to local browser cookies and remain persistent across drawing reload cycles.
                </p>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Auto-save Toast notification */}
      <div className={`toast-notification fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#16161d]/90 border border-white/5 px-5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-2xl z-[9999] transition-all duration-300 ${
        showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
      }`}>
        <Check className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-white">Preferences Saved & Applied</span>
      </div>

    </div>
  );
}
