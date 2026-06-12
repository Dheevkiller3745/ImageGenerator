'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Paintbrush, Layers, MessageSquare, ShieldCheck, Heart, Activity, Terminal, Database, Clock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/utils/supabaseClient';

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simulated Live System Log Feed for Product Verification
  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: 'success' | 'info' | 'warn' }>>([
    { time: '14:09:41', text: 'System started. Connected to database.', type: 'info' },
    { time: '14:10:02', text: 'New image requested via AI model.', type: 'info' },
    { time: '14:10:04', text: 'Image created successfully in 1.76s.', type: 'success' },
    { time: '14:10:15', text: 'Support request created for WhatsApp help.', type: 'success' }
  ]);

  useEffect(() => {
    const logTemplates: Array<{ text: string; type: 'success' | 'info' | 'warn' }> = [
      { text: 'User session started.', type: 'info' },
      { text: 'Description improved by smart assistant.', type: 'success' },
      { text: 'Primary model busy. Fallback model used.', type: 'warn' },
      { text: 'AI took over: Image finished in 1.94s.', type: 'success' },
      { text: 'Database saved the record successfully.', type: 'success' },
      { text: 'Interactive canvas saved as image.', type: 'info' },
      { text: 'System status check completed.', type: 'info' },
      { text: 'Active user connection verified.', type: 'info' }
    ];

    const timer = setInterval(() => {
      const randomTemplate = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setLogs((prev) => [
        { time: timeStr, text: randomTemplate.text, type: randomTemplate.type },
        ...prev.slice(0, 3) // keep last 4 logs
      ]);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Auto transition steps in the storytelling section
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const storySteps = [
    {
      title: "1. The Incantation (Prompt)",
      desc: "Type your vision. Our Context Memory store captures and refines style descriptors across generations, creating cohesive thematic continuity.",
      icon: <MessageSquare className="w-5 h-5 text-[#7c4dff]" />,
      mockup: (
        <div className="flex flex-col gap-2 p-4 w-full">
          <div className="flex gap-2">
            <span className="text-[10px] font-bold text-white/40 uppercase">Memory active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 font-mono">
            &quot;A serene medieval wizard cottage hidden in a glowing mushroom forest, <span className="text-[#9e75ff] font-semibold">watercolor fantasy style, cinematic lighting</span>&quot;
          </div>
          <div className="flex gap-1.5 mt-1">
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#7c4dff]/15 border border-[#7c4dff]/30 text-[#9e75ff]">Watercolor</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#7c4dff]/15 border border-[#7c4dff]/30 text-[#9e75ff]">Cinematic</span>
          </div>
        </div>
      )
    },
    {
      title: "2. The Vessel (Interactive Sketch)",
      desc: "Draw layout structures directly onto our studio canvas. Guide the composition structure and define color regions with zero friction.",
      icon: <Paintbrush className="w-5 h-5 text-[#ff4081]" />,
      mockup: (
        <div className="relative w-full h-[140px] flex items-center justify-center bg-black/40 border border-white/5 rounded-xl overflow-hidden">
          <svg className="w-full h-full stroke-current text-[#ff4081]/70" viewBox="0 0 300 140" fill="none">
            {/* Simulated paintbrush path animation */}
            <motion.path 
              d="M 50 100 Q 150 20 L 250 100" 
              strokeWidth="4" 
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
            <motion.circle 
              cx="50" cy="100" r="6" fill="#ff4081"
              animate={{ 
                cx: [50, 150, 250, 150, 50],
                cy: [100, 48, 100, 48, 100]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
          <span className="absolute bottom-2 right-2 text-[8px] font-mono text-white/30 uppercase tracking-widest">Design Studio Active</span>
        </div>
      )
    },
    {
      title: "3. The Synthesis (Visual Render)",
      desc: "Our design engine merges your visual sketch and description to render your high-fidelity brand asset instantly.",
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      mockup: (
        <div className="relative w-full h-[140px] flex items-center justify-center bg-black/40 border border-white/5 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(124,77,255,0.1)_0%,_transparent_80%)]"></div>
          
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-20 h-20 rounded-full border border-cyan-400/30 flex items-center justify-center bg-cyan-400/5 relative">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin"></div>
            </div>
          </motion.div>
          
          <motion.div 
            className="absolute inset-4 rounded-lg bg-[linear-gradient(to_bottom_right,_rgba(124,77,255,0.2),_rgba(255,64,129,0.2))] border border-white/10 flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 0.8, 1, 1], opacity: [0, 0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="text-center">
              <span className="text-[10px] font-mono font-bold text-white tracking-wider uppercase block">Synthesis Complete</span>
              <span className="text-[8px] font-mono text-white/50 block mt-1">Creative Render Baked</span>
            </div>
          </motion.div>
        </div>
      )
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      
      {/* Mesh gradients for background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-[radial-gradient(circle,_rgba(124,77,255,0.08)_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-[radial-gradient(circle,_rgba(255,64,129,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
      
      {/* Global animated floating orbs */}
      <div className="absolute top-[25%] right-[15%] w-72 h-72 rounded-full bg-[var(--primary-glow)] blur-[80px] animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-[30%] left-[10%] w-96 h-96 rounded-full bg-[var(--secondary-glow)] blur-[100px] animate-float-slower pointer-events-none"></div>

      <Navbar />

      {/* Hero Content */}
      <main className="flex-1 flex flex-col z-30">
        
        {/* Hero Section */}
        <section className="px-6 lg:px-16 pt-16 pb-24 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          
          <div className="hero-text flex flex-col gap-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="badge w-fit mx-auto lg:mx-0 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/5 text-[10px] uppercase font-bold tracking-widest text-[#9e75ff] flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Canvas Synthesis</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.15] text-gradient tracking-tight"
            >
              Sketched by Hand.<br />
              <span className="text-gradient-neon">Born of the Aether.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base text-foreground/60 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              STATICs makes it easy to bring your ideas to life. Draw simple shapes on a digital canvas, describe what you want, and let our smart systems create a high-quality image instantly.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="cta-group flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
            >
              <Link href="/workspace/">
                <button className="bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] border-none text-white text-sm font-bold py-3.5 px-8 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(124,77,255,0.35)] hover:shadow-[0_8px_24px_rgba(124,77,255,0.45)] hover:scale-[1.01] active:scale-100 transition-all w-full sm:w-auto">
                  <span>{user ? 'Open Workspace' : 'Enter the Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a href="#story-section" className="w-full sm:w-auto">
                <button className="clay-panel clay-panel-hover text-white text-sm font-bold py-3.5 px-8 rounded-xl cursor-pointer border border-white/5 hover:border-white/15 transition-all w-full">
                  Explore The Story
                </button>
              </a>
            </motion.div>
          </div>

          {/* Interactive mockup preview (visual demo) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-mockup w-full flex justify-center"
          >
            <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-3xl clay-panel p-4 shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col justify-between">
              
              {/* Header inside card mockup */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
                </div>
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">STATICs Workspace Preview</span>
              </div>

              {/* Main inner canvas animation simulation */}
              <div className="flex-1 my-4 bg-[#0c0c10] border border-white/5 rounded-2xl relative overflow-hidden flex items-center justify-center">
                
                {/* 1. Animated background grid */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>

                {/* 2. Drawing lines stroke */}
                <motion.svg className="absolute inset-0 stroke-current text-[#7c4dff]" viewBox="0 0 350 250">
                  <motion.path 
                    d="M 60 180 C 100 60, 200 40, 280 180" 
                    fill="none" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 1, 0] }}
                    transition={{ duration: 5, repeat: Infinity, times: [0, 0.4, 0.8, 1], ease: "easeInOut" }}
                  />
                  <motion.path 
                    d="M 100 130 C 130 90, 220 90, 250 130" 
                    fill="none" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 1, 0] }}
                    transition={{ duration: 5, repeat: Infinity, times: [0.1, 0.45, 0.8, 1], ease: "easeInOut" }}
                  />
                </motion.svg>

                {/* 3. Result Image fading in underneath */}
                <motion.div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop')` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.85, 0.85, 0] }}
                  transition={{ duration: 5, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1], ease: "easeInOut" }}
                />

                {/* Processing Overlay message */}
                <motion.div 
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl clay-panel border border-[#7c4dff]/20 text-[9px] font-mono font-bold tracking-widest text-[#9e75ff] uppercase flex items-center gap-2"
                  animate={{ 
                    y: [10, 0, 0, 10],
                    opacity: [0, 1, 1, 0] 
                  }}
                  transition={{ duration: 5, repeat: Infinity, times: [0.35, 0.42, 0.85, 0.95], ease: "easeInOut" }}
                >
                  <span className="w-1.5 h-1.5 bg-[#7c4dff] rounded-full animate-ping"></span>
                  <span>Synthesizing neural seed...</span>
                </motion.div>
              </div>

              {/* Bottom footer inside mockup */}
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center"><Paintbrush className="w-3.5 h-3.5 text-[#ff4081]" /></div>
                <div className="flex-1 p-2 bg-white/5 border border-white/5 rounded text-[8px] text-white/50 font-mono flex items-center justify-between">
                  <span>Engine: Creative Studio Engine (Cloud)</span>
                  <span className="text-green-400">Ready</span>
                </div>
              </div>

            </div>
          </motion.div>
        </section>

        {/* Storytelling Section */}
        <section id="story-section" className="w-full bg-[#0b0b0e] py-24 border-t border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 lg:px-16 flex flex-col gap-12">
            
            <div className="text-center flex flex-col gap-3">
              <span className="text-[10px] font-bold text-[#ff4081] tracking-widest uppercase uppercase">Interactive Journey</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display text-white">Three Steps to Synthesis</h2>
              <p className="text-sm text-[#8e909c] max-w-lg mx-auto">
                Discover the simple, elegant structure designed to make AI creation feel intuitive and structured.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side: Step selectors */}
              <div className="flex flex-col gap-4">
                {storySteps.map((step, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`p-6 rounded-2xl border cursor-pointer text-left transition-all duration-300 ${
                      activeStep === idx 
                        ? 'clay-card-neon bg-[#7c4dff]/5 border-[#7c4dff]/20 translate-x-2' 
                        : 'bg-white/[0.01] border-transparent hover:bg-white/[0.03] text-[#8e909c]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 mb-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activeStep === idx ? 'bg-[#7c4dff]/15' : 'bg-white/5'
                      }`}>
                        {step.icon}
                      </div>
                      <h4 className="font-bold text-sm text-white">{step.title}</h4>
                    </div>
                    <p className="text-xs text-[#8e909c] leading-relaxed ml-11">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right Side: Step Preview Screen */}
              <div className="preview-screen-wrapper">
                <div className="clay-panel rounded-3xl p-6 border border-white/5 shadow-[0_16px_36px_rgba(0,0,0,0.5)]">
                  <div className="preview-screen bg-black/50 aspect-video rounded-xl border border-white/5 flex items-center justify-center p-4">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeStep}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex items-center justify-center"
                      >
                        {storySteps[activeStep].mockup}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="mt-4 flex justify-between items-center text-[10px] text-white/30 font-mono uppercase tracking-wider">
                    <span>Active Chapter</span>
                    <span>Step {activeStep + 1} of 3</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Live Performance & Telemetry (Proof of Product Section) */}
        <section className="px-6 lg:px-16 py-24 max-w-5xl mx-auto w-full flex flex-col gap-12">
          
          <div className="text-center flex flex-col gap-3">
            <div className="badge w-fit mx-auto px-3.5 py-1.5 rounded-full bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[10px] uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Real-Time System Health & Proof</span>
            </div>
            <h2 className="text-3xl font-bold font-display text-foreground">Live System Status</h2>
            <p className="text-sm text-foreground/60 max-w-md mx-auto">
              Our servers are fully operational. Here is the current system activity and performance metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8">
            
            {/* Left Column: Live Stats */}
            <div className="flex flex-col gap-4">
              
              {/* Stat 1 */}
              <div className="clay-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-display text-white">43,184</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Rendered Assets Logged</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="clay-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#7c4dff]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#9e75ff]" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-display text-white">1.82s</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Median Render Latency</div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="clay-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#ff4081]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#ff4081]" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-display text-white">99.98%</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Failover Router Uptime</div>
                </div>
              </div>

            </div>

            {/* Right Column: Live Telemetry Terminal */}
            <div className="clay-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-4 font-mono shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <Terminal className="w-4 h-4 text-[#7c4dff]" />
                  <span>Interactive Engine Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">Live Feed</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2.5 min-h-[160px] justify-end">
                {logs.map((log, index) => (
                  <div 
                    key={index}
                    className={`text-xs flex gap-3 transition-all duration-500 ${
                      index === 0 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-65'
                    }`}
                  >
                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                    <span className={
                      log.type === 'success' ? 'text-green-400' : log.type === 'warn' ? 'text-amber-400' : 'text-cyan-400'
                    }>
                      {log.type === 'success' ? '✔' : log.type === 'warn' ? '⚠' : 'ℹ'}
                    </span>
                    <span className="text-zinc-300 break-all">{log.text}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[9px] text-zinc-500 uppercase font-semibold">
                <span>Cluster Node: public-api-west</span>
                <span>Active Channels: 4</span>
              </div>
            </div>

          </div>

        </section>

        {/* CTA section */}
        <section className="px-6 lg:px-16 pb-32 max-w-5xl mx-auto w-full">
          <div className="relative clay-card-neon rounded-3xl p-12 overflow-hidden text-center flex flex-col items-center gap-6 border border-[#7c4dff]/15">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#7c4dff]/5 blur-[70px] pointer-events-none"></div>
            
            <Sparkles className="w-10 h-10 text-[#7c4dff] animate-pulse" />
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">Enter the Drawing Arena</h2>
            <p className="text-xs sm:text-sm text-[#8e909c] max-w-md leading-relaxed">
              Launch your personal image generator. Tweak parameters, unlock context memory, sketch structures, and bring ideas to life.
            </p>
            
            <Link href="/workspace/">
              <button className="bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] border-none text-white text-sm font-bold py-3.5 px-8 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(255,64,129,0.25)] hover:shadow-[0_8px_24px_rgba(255,64,129,0.35)] transition-all">
                <span>Start Free Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer bar */}
      <footer className="w-full h-[80px] px-6 lg:px-16 flex justify-between items-center border-t border-white/5 bg-black/40 z-30">
        <span className="text-[10px] text-[#535562] font-mono uppercase tracking-wider">
          © {new Date().getFullYear()} STATICs Agency. All rights reserved.
        </span>
        <span className="text-[10px] text-[#535562] flex items-center gap-1 font-mono uppercase tracking-wider">
          Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" /> for Autonomy
        </span>
      </footer>

    </div>
  );
}
