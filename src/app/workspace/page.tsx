'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorkspaceStore, HistoryItem } from '@/store/useWorkspaceStore';
import { CanvasViewport } from '@/components/workspace/CanvasViewport';
import { PromptController } from '@/components/workspace/PromptController';
import { supabase } from '@/utils/supabaseClient';
import { 
  Sparkles, Plus, Cpu, Maximize, Settings2, ChevronDown, 
  Shuffle, AlertTriangle, Menu, X, Trash2, Send, Info, MessageSquareCode
} from 'lucide-react';

export default function WorkspacePage() {
  const store = useWorkspaceStore();

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'view' | 'draw' | 'crop'>('view');
  
  // Local state for image URLs (since base64 dataUrls can be large, we sync them from the store history or active item)
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sidebar toggles
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Lead Conversion form states
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'info' | 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'info'
  });

  const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ show: true, msg, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((t) => ({ ...t, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Initialise app state
  useEffect(() => {
    // If store history is empty, create a placeholder workspace
    if (store.history.length === 0) {
      // Just waiting for user input
    } else {
      const latest = store.history[0];
      setActiveWorkspaceId(latest.id);
      setActiveImage(latest.imageUrl);
      setEditedImage(null);
      setUndoStack([latest.imageUrl]);
      store.setPrompt(latest.prompt);
      store.setSeed(latest.seed);
      store.setEngine(latest.engine as any);
      store.setAspectRatio(latest.aspectRatio as any);
    }
  }, []);

  // Sync details when an item is selected from history
  const selectHistoryItem = (item: HistoryItem) => {
    setActiveWorkspaceId(item.id);
    setActiveImage(item.imageUrl);
    setEditedImage(null);
    setUndoStack([item.imageUrl]);
    
    // Set parameters
    store.setPrompt(item.prompt);
    store.setSeed(item.seed);
    store.setEngine(item.engine as any);
    store.setAspectRatio(item.aspectRatio as any);
    showToast(`Loaded: ${item.prompt.substring(0, 20)}...`);
  };

  const handleImageGenerated = (dataUrl: string, seed: number) => {
    setActiveImage(dataUrl);
    setEditedImage(null);
    setUndoStack([dataUrl]);
    setIsGenerating(false);
  };

  const handleImageEdit = (dataUrl: string) => {
    setEditedImage(dataUrl);
  };

  // Start a new generation workspace
  const handleResetWorkspace = () => {
    if (confirm("Reset current workspace? This will clear the active canvas.")) {
      setActiveImage(null);
      setEditedImage(null);
      setUndoStack([]);
      store.setPrompt('');
      store.setSeed(-1);
      showToast("Workspace reset complete");
    }
  };

  // Supabase Lead Log insertion and WhatsApp Redirection
  const triggerWhatsAppRedirect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leadName.trim() || !leadEmail.trim()) {
      showToast("Please enter your name and email first", "info");
      return;
    }

    const currentPrompt = store.activePrompt || "No prompt provided";
    const whatsappPhone = "+1234567890"; // Configurable target WhatsApp number
    const chatMessage = `Hello! I generated an image on STATICs.\n\nPrompt: "${currentPrompt}"\nSeed: ${store.seed}\nEngine: ${store.currentEngine}\nAspect Ratio: ${store.aspectRatio}\n\nMy name is ${leadName}. Please help me refine this design!`;
    const whatsappUri = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(chatMessage)}`;

    setLeadSubmitting(true);

    try {
      // 1. Log Lead Conversion in Supabase
      const { error } = await supabase
        .from('leads_log')
        .insert({
          name: leadName.trim(),
          email: leadEmail.trim(),
          target_prompt: currentPrompt,
          whatsapp_uri: whatsappUri
        });

      if (error) {
        console.error("Supabase Log Error:", error);
      }

      showToast("Conversion logged! Redirecting to WhatsApp...", "success");

      // 2. Client-side redirection
      setTimeout(() => {
        window.open(whatsappUri, '_blank');
      }, 1000);

    } catch (err) {
      console.error("WhatsApp Conversion Exception:", err);
      showToast("System error, opening WhatsApp anyway...", "error");
      window.open(whatsappUri, '_blank');
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="app-container grid grid-cols-1 lg:grid-cols-[320px_1fr] h-screen w-screen overflow-hidden bg-[#09090c] text-[#f3f3f6] relative">
      {/* Background glow filters */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[radial-gradient(circle,_rgba(124,77,255,0.04)_0%,_transparent_70%)] pointer-events-none z-10"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(255,64,129,0.02)_0%,_transparent_70%)] pointer-events-none z-10"></div>
      
      {/* Sidebar Controls */}
      <aside className={`app-sidebar glass-panel-heavy border-r border-white/5 flex flex-col h-screen z-50 transition-all duration-300 fixed lg:relative left-0 top-0 bottom-0 w-[320px] lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 shadow-[12px_0_36px_rgba(0,0,0,0.6)]' : '-translate-x-full'
      }`}>
        <div className="sidebar-header p-6 flex justify-between items-center">
          <div className="logo-area flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="spark-icon-container bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] w-8 h-8 rounded-md flex items-center justify-center shadow-[0_4px_12px_rgba(124,77,255,0.35)]">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <h2 className="text-xl font-bold font-display tracking-tight text-white">STATICs<span className="text-zinc-500 font-normal"> Workspace</span></h2>
            </Link>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="icon-btn close-sidebar-btn lg:hidden flex items-center justify-center p-2 rounded-md bg-white/[0.03] border border-white/5 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Workspace button */}
        <button 
          onClick={handleResetWorkspace}
          className="new-session-btn mx-6 mb-4 p-3 bg-white/[0.02] border border-dashed border-white/5 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10 hover:text-[#9e75ff] rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> New Workspace
        </button>

        {/* Scrollable controls */}
        <div className="sidebar-scroll-content flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-6">
          
          {/* History */}
          {store.history.length > 0 && (
            <div className="sidebar-section flex flex-col gap-3">
              <h3 className="section-title text-[11px] uppercase tracking-wider text-[#8e909c] flex items-center gap-2 font-bold">
                <MessageSquareCode className="w-3.5 h-3.5 text-[#7c4dff]" /> History
              </h3>
              <ul className="session-list flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                {store.history.map((item) => (
                  <li 
                    key={item.id}
                    onClick={() => selectHistoryItem(item)}
                    className={`session-item p-2.5 rounded-lg text-xs border cursor-pointer flex justify-between items-center transition-all ${
                      item.id === activeWorkspaceId 
                        ? 'bg-[#7c4dff]/10 border-[#7c4dff] text-white font-medium' 
                        : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/5 text-[#8e909c] hover:text-white'
                    }`}
                  >
                    <span className="session-name truncate w-48">{item.prompt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Engine Select */}
          <div className="sidebar-section flex flex-col gap-3">
            <h3 className="section-title text-[11px] uppercase tracking-wider text-[#8e909c] flex items-center gap-2 font-bold">
              <Cpu className="w-3.5 h-3.5 text-[#7c4dff]" /> AI Engine
            </h3>
            <select 
              value={store.currentEngine}
              onChange={(e) => store.setEngine(e.target.value as any)}
              className="w-full glass-input rounded-xl p-3 outline-none text-xs cursor-pointer text-white"
            >
              <option value="puter" className="bg-[#09090c]">Puter AI (Fast, Free & Stable)</option>
              <option value="pollinations" className="bg-[#09090c]">Pollinations AI (No-key & Rapid)</option>
              <option value="openai" className="bg-[#09090c]">OpenAI DALL-E 3 (Real API)</option>
              <option value="perchance" className="bg-[#09090c]">Perchance Engine (Serverless)</option>
            </select>
            {store.currentEngine === 'perchance' && (
              <div className="warning-box mt-2.5 p-3 rounded-xl bg-[#7c4dff]/5 border border-[#7c4dff]/15 text-[#9e75ff] text-[10px] flex gap-2.5 items-start leading-relaxed">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Runs securely on the cloud serverless endpoint.</span>
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="sidebar-section flex flex-col gap-3">
            <h3 className="section-title text-[11px] uppercase tracking-wider text-[#8e909c] flex items-center gap-2 font-bold">
              <Maximize className="w-3.5 h-3.5 text-[#7c4dff]" /> Aspect Ratio
            </h3>
            <div className="ratio-selectors grid grid-cols-3 gap-2">
              {[
                { name: 'Square (1:1)', val: 'square', boxClass: 'w-4 h-4' },
                { name: 'Portrait (2:3)', val: 'portrait', boxClass: 'w-3 h-5' },
                { name: 'Landscape (3:2)', val: 'landscape', boxClass: 'w-5.5 h-3.5' }
              ].map((r) => (
                <button 
                  key={r.val}
                  onClick={() => store.setAspectRatio(r.val as any)}
                  className={`ratio-btn flex flex-col items-center gap-2 p-3 border rounded-xl transition-all cursor-pointer ${
                    store.aspectRatio === r.val 
                      ? 'bg-[#7c4dff]/15 border-[#7c4dff]/30 text-white font-bold' 
                      : 'bg-white/[0.02] border-white/5 text-[#8e909c] hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <div className={`border-1.5 border-current bg-transparent opacity-85 ${r.boxClass}`} />
                  <span className="text-[9px] font-semibold">{r.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Accordion */}
          <div className="sidebar-section advanced-settings border-t border-white/5 pt-5">
            <div 
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="advanced-header flex justify-between items-center cursor-pointer group"
            >
              <h3 className="section-title text-[11px] uppercase tracking-wider text-[#8e909c] flex items-center gap-2 font-bold group-hover:text-white transition-all">
                <Settings2 className="w-3.5 h-3.5 text-[#7c4dff]" /> Advanced Config
              </h3>
              <ChevronDown className={`w-4 h-4 text-[#8e909c] group-hover:text-white transition-transform ${
                advancedOpen ? 'rotate-180' : ''
              }`} />
            </div>
            
            {advancedOpen && (
              <div className="advanced-content mt-4 flex flex-col gap-4">
                <div className="input-block flex flex-col gap-2">
                  <div className="label-row flex justify-between items-center text-xs text-[#8e909c]">
                    <label>Guidance Scale</label>
                    <span className="font-semibold text-[#9e75ff] bg-[#7c4dff]/10 px-1.5 py-0.5 rounded">{store.guidanceScale.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    step="0.5" 
                    value={store.guidanceScale}
                    onChange={(e) => store.setGuidanceScale(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="input-block flex flex-col gap-2">
                  <label className="text-xs text-[#8e909c]">Custom Seed</label>
                  <div className="seed-input-row flex gap-2">
                    <input 
                      type="number" 
                      value={store.seed}
                      onChange={(e) => store.setSeed(parseInt(e.target.value) || -1)}
                      placeholder="Random seed (-1)"
                      className="flex-1 glass-input rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                    <button 
                      onClick={() => store.setSeed(-1)}
                      className="icon-btn p-2.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] rounded-xl text-[#8e909c] hover:text-white cursor-pointer"
                      title="Randomize Seed"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="input-block flex flex-col gap-2">
                  <label className="text-xs text-[#8e909c]">Negative Prompt</label>
                  <textarea 
                    value={store.negativePrompt}
                    onChange={(e) => store.setNegativePrompt(e.target.value)}
                    placeholder="Things to avoid (e.g. blurry, low quality)"
                    className="w-full h-20 glass-input rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Conversion Panel */}
          <div className="sidebar-section border-t border-white/5 pt-5">
            <h3 className="section-title text-[11px] uppercase tracking-wider text-[#8e909c] flex items-center gap-2 font-bold mb-3">
              <MessageSquareCode className="w-3.5 h-3.5 text-[#ff4081]" /> Refine with Designer
            </h3>
            <form onSubmit={triggerWhatsAppRedirect} className="flex flex-col gap-3 glass-panel rounded-2xl p-4">
              <p className="text-[10px] text-[#8e909c] leading-relaxed">
                Connect with our expert design agency on WhatsApp to tweak, upscale, or vectorise your generated layout.
              </p>
              <input 
                type="text"
                placeholder="Your Name"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                required
                className="glass-input rounded-xl p-2.5 text-xs text-white"
              />
              <input 
                type="email"
                placeholder="Your Email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                required
                className="glass-input rounded-xl p-2.5 text-xs text-white"
              />
              <button 
                type="submit"
                disabled={leadSubmitting}
                className="w-full bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] border-none text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_10px_rgba(255,64,129,0.2)] hover:shadow-[0_6px_14px_rgba(255,64,129,0.3)] transition-all disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{leadSubmitting ? 'Submitting...' : 'Refine on WhatsApp'}</span>
              </button>
            </form>
          </div>

        </div>
      </aside>

      {/* Main Workspace */}
      <main className="app-main flex flex-col h-screen overflow-hidden relative">
        <header className="main-header h-[70px] border-b border-white/5 bg-[#09090c]/40 backdrop-blur-md px-6 flex justify-between items-center z-40">
          <div className="header-left flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="icon-btn toggle-sidebar-btn lg:hidden flex items-center justify-center p-2 rounded-md bg-white/[0.03] border border-white/5 text-white cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="workspace-title-area flex items-center gap-3">
              <h1 id="activeWorkspaceTitle" className="text-base font-bold font-display truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                {store.activePrompt ? store.activePrompt.substring(0, 30) + '...' : 'Untitled Workspace'}
              </h1>
              <span className={`status-indicator text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 bg-green-500/10 text-[#4caf50] before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:shadow-[0_0_6px_currentColor] ${
                isGenerating ? 'generating bg-orange-500/10 text-[#ff9800]' : ''
              }`}>
                {isGenerating ? 'Generating...' : 'Ready'}
              </span>
            </div>
          </div>
          <div className="header-right flex items-center gap-3">
            <Link href="/admin">
              <button className="glass-panel glass-panel-hover flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white/70 hover:text-white transition-all cursor-pointer">
                Admin Panel
              </button>
            </Link>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="glass-panel glass-panel-hover flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white/70 hover:text-white transition-all cursor-pointer"
            >
              Sign Out
            </button>
            <button 
              onClick={handleResetWorkspace}
              className="glass-panel glass-panel-hover flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Reset Workspace
            </button>
          </div>
        </header>

        {/* Viewport canvas */}
        <CanvasViewport
          imageDataUrl={activeImage}
          editedDataUrl={editedImage}
          onImageEdit={handleImageEdit}
          activeTool={activeTool}
          onSetTool={setActiveTool}
          undoStack={undoStack}
          setUndoStack={setUndoStack}
        />

        {/* Prompt Input bar */}
        <PromptController
          onImageGenerated={handleImageGenerated}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          showToast={showToast}
        />
      </main>

      {/* Toast popup */}
      <div className={`toast-notification fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#16161d]/85 backdrop-blur-md border border-white/5 px-5 py-3 rounded-lg flex items-center gap-3 shadow-2xl z-[999] transition-all duration-300 ${
        toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
      }`}>
        <Info className={`w-4 h-4 ${
          toast.type === 'error' ? 'text-red-500' : toast.type === 'success' ? 'text-green-500' : 'text-[#7c4dff]'
        }`} />
        <span className="toast-message text-xs font-medium text-white">{toast.msg}</span>
      </div>

    </div>
  );
}
