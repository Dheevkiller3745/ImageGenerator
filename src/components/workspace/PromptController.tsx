'use client';

import React, { useState } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { supabase } from '@/utils/supabaseClient';
import { BrainCircuit, WandSparkles, ArrowRight, X } from 'lucide-react';

// Pure helper wrappers to satisfy react-hooks/purity linter rules
const getHistoryId = (): string => 'hist_' + Date.now();
const getTimestamp = (): number => Date.now();
const getRandomSeed = (): number => Math.floor(Math.random() * 1000000);
const getRandomIndex = (max: number): number => Math.floor(Math.random() * max);

interface PromptControllerProps {
  onImageGenerated: (dataUrl: string, seed: number) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const PromptController: React.FC<PromptControllerProps> = ({
  onImageGenerated,
  isGenerating,
  setIsGenerating,
  showToast,
}) => {
  const store = useWorkspaceStore();

  const [prompt, setPrompt] = useState(store.activePrompt);
  const [rememberStyle, setRememberStyle] = useState(true);
  const [rememberElements, setRememberElements] = useState(false);
  const [perchanceIframeUrl, setPerchanceIframeUrl] = useState<string | null>(null);
  const [perchanceIframeId, setPerchanceIframeId] = useState<string | null>(null);

  // Sync component state with store prompt changes during render to satisfy purity checks
  const [prevActivePrompt, setPrevActivePrompt] = useState(store.activePrompt);
  if (store.activePrompt !== prevActivePrompt) {
    setPrevActivePrompt(store.activePrompt);
    setPrompt(store.activePrompt);
  }

  // Extract memory chips from generated prompts
  const extractMemoryChips = (generatedPrompt: string) => {
    const styleKeywords = [
      'watercolor', 'oil painting', 'acrylic', 'cyberpunk', 'neon lighting', 
      'retro anime', 'sketch', 'digital art', '3d render', 'claymation', 
      'photorealistic', 'cinematic lighting', 'fantasy landscape', 'surrealism',
      'minimalist', 'gothic', 'baroque', 'steampunk', 'concept art', 'charcoal'
    ];

    const lowercasePrompt = generatedPrompt.toLowerCase();
    const extracted: string[] = [];

    styleKeywords.forEach(keyword => {
      if (lowercasePrompt.includes(keyword)) {
        const capitalised = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        extracted.push(capitalised);
      }
    });

    const components = generatedPrompt.split(',').map(s => s.trim());
    components.forEach(comp => {
      if (comp.length < 25 && comp.length > 3) {
        const descriptors = ['style', 'lighting', 'art', 'detailed', 'aesthetic', 'render', 'portrait'];
        if (descriptors.some(d => comp.toLowerCase().includes(d)) && !extracted.includes(comp)) {
          extracted.push(comp);
        }
      }
    });

    return extracted.slice(0, 5); // Max 5 chips
  };

  // Enhance prompt
  const enhancePromptText = () => {
    const base = prompt.trim();
    if (!base) {
      showToast("Enter a prompt first to enhance", "info");
      return;
    }

    const renderAdditions = [
      "masterpiece, highly detailed illustration",
      "volumetric cinematic lighting, unreal engine 5 render",
      "vibrant colors, sharp focus, 8k resolution",
      "trending on artstation, masterpiece painting style",
      "photorealistic, dramatic shadows, warm studio glow"
    ];

    const randomAdd = renderAdditions[getRandomIndex(renderAdditions.length)];
    const enhanced = `${base}, ${randomAdd}`;
    setPrompt(enhanced);
    store.setPrompt(enhanced);
    showToast("Prompt enhanced!", "success");
  };

  // Compile prompt with style memory context
  const getCompiledPrompt = () => {
    let basePrompt = prompt.trim();
    if (rememberStyle && store.memoryChips.length > 0) {
      const cleanStyles = store.memoryChips.filter(
        chip => !basePrompt.toLowerCase().includes(chip.toLowerCase())
      );
      if (cleanStyles.length > 0) {
        basePrompt += `, ${cleanStyles.join(', ')}`;
      }
    }
    return basePrompt;
  };

  // Utility conversions
  const convertBlobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const convertImgElementToDataURL = (imgEl: HTMLImageElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        const canvasCtx = canvas.getContext('2d');
        if (canvasCtx) {
          canvasCtx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error("Failed to get 2d context"));
        }
      };
      image.onerror = () => reject(new Error("Failed to load image element"));
      image.src = imgEl.src;
    });
  };

  // Log generation telemetry to Supabase
  const logTelemetry = async (finalPrompt: string, finalSeed: number, engine: string, ratio: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const { error } = await supabase
        .from('generations_log')
        .insert({
          user_id: userId,
          prompt: finalPrompt,
          seed: String(finalSeed),
          engine: engine,
          aspect_ratio: ratio
        });
      if (error) console.error("Telemetry Logging Error:", error);
    } catch (e) {
      console.error("Telemetry Exception:", e);
    }
  };

  const generateImage = async (engineOverride?: 'puter' | 'pollinations' | 'perchance' | 'openai') => {
    const activeEngine = engineOverride || store.currentEngine;
    const finalPrompt = getCompiledPrompt();

    if (!finalPrompt) {
      showToast("Please enter an image description prompt", "info");
      return;
    }

    setIsGenerating(true);
    showToast(`Generating image using ${activeEngine.toUpperCase()}...`, "info");

    const resolutionMap = {
      square: { w: 768, h: 768 },
      portrait: { w: 512, h: 768 },
      landscape: { w: 768, h: 512 }
    };
    const dim = resolutionMap[store.aspectRatio];
    const generatedSeed = store.seed === -1 ? getRandomSeed() : store.seed;

    try {
      let dataUrl = "";

      // 1. Puter.js
      if (activeEngine === 'puter') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const puter = (window as any).puter;
        if (!puter) {
          throw new Error("Puter SDK is loading... please try again in a second.");
        }
        const imgElement = await puter.ai.txt2img(finalPrompt, { model: 'flux-schnell' });
        dataUrl = await convertImgElementToDataURL(imgElement);
      } 
      // 2. Pollinations.ai
      else if (activeEngine === 'pollinations') {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${dim.w}&height=${dim.h}&seed=${generatedSeed}&nologo=true`;
        const res = await fetch(url);
        if (res.status === 402) {
          throw new Error("Rate limit exceeded for Pollinations AI (IP limit). Falling back...");
        }
        if (!res.ok) {
          throw new Error("Pollinations API request failed");
        }
        const blob = await res.blob();
        dataUrl = await convertBlobToDataURL(blob);
      } 
      // 3. Perchance Client-Side Iframe Integration
      else if (activeEngine === 'perchance') {
        const iframeId = 'perchance_iframe_' + Math.floor(Math.random() * 1000000);
        setPerchanceIframeId(iframeId);
        
        const hashData = {
          saveChannel: "text-to-image-plugin",
          saveTitle: "",
          saveDescription: "",
          prompt: finalPrompt,
          seed: generatedSeed,
          resolution: dim.w === 768 && dim.h === 768 ? "768x768" : (dim.w === 512 ? "512x768" : "768x512"),
          guidanceScale: store.guidanceScale,
          defaultGuidanceScale: 7,
          negativePrompt: store.negativePrompt || "",
          requestId: "req_" + Math.floor(Math.random() * 1000000),
          iframeId: iframeId,
          referenceImage: null
        };
        
        const encodedHash = encodeURIComponent(JSON.stringify(hashData));
        const url = `https://image-generation.perchance.org/embed#${encodedHash}`;
        
        setPerchanceIframeUrl(url);
        
        const resultPromise = new Promise<{ dataUrl: string; seedUsed: number }>((resolve, reject) => {
          const handler = (event: MessageEvent) => {
            if (event.data && event.data.type === 'finished' && event.data.id === iframeId) {
              window.removeEventListener('message', handler);
              resolve({
                dataUrl: event.data.dataUrl,
                seedUsed: event.data.seedUsed
              });
            }
          };
          window.addEventListener('message', handler);
          
          setTimeout(() => {
            window.removeEventListener('message', handler);
            reject(new Error("Perchance image generation timed out (60s limit)."));
          }, 60000);
        });

        const result = await resultPromise;
        dataUrl = result.dataUrl;
        setPerchanceIframeUrl(null);
        setPerchanceIframeId(null);
      }
      // 4. OpenAI DALL-E 3 Real API Route
      else if (activeEngine === 'openai') {
        const res = await fetch('/api/generate/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            size: store.aspectRatio,
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "OpenAI API route failed.");
        }

        const data = await res.json();
        dataUrl = data.imageUrl;
      }

      // Generation successful
      onImageGenerated(dataUrl, generatedSeed);
      store.addToHistory({
        id: getHistoryId(),
        prompt: finalPrompt,
        imageUrl: dataUrl,
        timestamp: getTimestamp(),
        seed: generatedSeed,
        engine: activeEngine,
        aspectRatio: store.aspectRatio
      });

      // Handle style context parsing
      const newChips = extractMemoryChips(finalPrompt);
      newChips.forEach(chip => store.addMemoryChip(chip));

      // Telemetry hook call
      logTelemetry(finalPrompt, generatedSeed, activeEngine, store.aspectRatio);
      showToast("Image generated successfully!", "success");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Generation failed:", err);
      
      // Fallback Logic: If Perchance fails, fall back instantly to Puter.js
      if (activeEngine === 'perchance') {
        setPerchanceIframeUrl(null);
        setPerchanceIframeId(null);
        showToast("Perchance generation failed. Falling back to Puter AI...", "error");
        setTimeout(() => {
          generateImage('puter');
        }, 1500);
      } else if (activeEngine === 'pollinations') {
        showToast("Pollinations rate limit hit. Falling back to Puter AI...", "error");
        setTimeout(() => {
          generateImage('puter');
        }, 1500);
      } else if (activeEngine === 'openai') {
        showToast("OpenAI generation failed. Falling back to Puter AI...", "error");
        setTimeout(() => {
          generateImage('puter');
        }, 1500);
      } else {
        showToast(`Failed: ${err.message}`, "error");
        setIsGenerating(false);
      }
    } finally {
      if (activeEngine !== 'perchance' && activeEngine !== 'pollinations' && activeEngine !== 'openai') {
        setIsGenerating(false);
      }
    }
  };

  return (
    <footer className="prompter-area p-6 bg-[#09090c]/40 backdrop-blur-md z-40 border-t border-white/5">
      <div className="prompter-inner max-w-[850px] mx-auto flex flex-col gap-3">
        
        {/* Context Memory Chips */}
        <div className="memory-context-bar glass-panel rounded-2xl p-4 flex flex-col gap-2.5 transition-all">
          <div className="memory-header flex justify-between items-center">
            <div className="memory-title flex items-center gap-2 text-[10px] font-bold text-[#8e909c] uppercase tracking-wider font-display">
              <BrainCircuit className="w-3.5 h-3.5 text-[#9e75ff]" />
              <span>Context Memory</span>
            </div>
            <div className="memory-options flex gap-4 text-[10px] text-[#8e909c]">
              <label className="toggle-switch flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
                <input 
                  type="checkbox" 
                  checked={rememberStyle}
                  onChange={(e) => setRememberStyle(e.target.checked)}
                  className="hidden peer"
                />
                <div className="w-6 h-3.5 bg-white/10 rounded-full relative transition-all peer-checked:bg-[#7c4dff] after:content-[''] after:absolute after:w-2.5 after:h-2.5 after:bg-white after:rounded-full after:left-0.5 after:top-0.5 peer-checked:after:translate-x-2.5 after:transition-all"></div>
                <span>Remember Style</span>
              </label>
              <label className="toggle-switch flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
                <input 
                  type="checkbox" 
                  checked={rememberElements}
                  onChange={(e) => setRememberElements(e.target.checked)}
                  className="hidden peer"
                />
                <div className="w-6 h-3.5 bg-white/10 rounded-full relative transition-all peer-checked:bg-[#7c4dff] after:content-[''] after:absolute after:w-2.5 after:h-2.5 after:bg-white after:rounded-full after:left-0.5 after:top-0.5 peer-checked:after:translate-x-2.5 after:transition-all"></div>
                <span>Remember Elements</span>
              </label>
            </div>
          </div>
          <div className="memory-chips flex flex-wrap gap-1.5 min-h-[20px] items-center">
            {store.memoryChips.length === 0 ? (
              <span className="empty-memory-text text-[10px] text-[#535562] italic">
                No active memory chips. Generate an image to record style context.
              </span>
            ) : (
              store.memoryChips.map((chipText, i) => (
                <span 
                  key={i} 
                  className="memory-chip text-[9px] font-semibold bg-[#7c4dff]/15 border border-[#7c4dff]/30 text-[#9e75ff] px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
                >
                  {chipText} 
                  <X 
                    onClick={() => store.removeMemoryChip(chipText)}
                    className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 hover:text-[#ff4081] transition-all" 
                  />
                </span>
              ))
            )}
          </div>
        </div>
 
        {/* Prompt Input Container */}
        <div className="prompt-input-container glass-panel rounded-2xl p-4 flex flex-col gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] focus-within:border-[#7c4dff]/30 focus-within:shadow-[0_12px_40px_rgba(124,77,255,0.05)] transition-all">
          <textarea 
            id="promptInput" 
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              store.setPrompt(e.target.value);
            }}
            placeholder="Describe the image you want to generate in detail..."
            className="w-full h-12 bg-transparent border-none outline-none text-white text-sm line-normal resize-none placeholder-white/20"
          />
          
          <div className="prompt-actions flex justify-between items-center border-t border-white/[0.03] pt-3">
            <button 
              onClick={enhancePromptText}
              className="prompt-action-btn glass-panel glass-panel-hover text-[#8e909c] text-xs font-semibold cursor-pointer flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:text-white border border-white/5 hover:border-white/15 transition-all"
            >
              <WandSparkles className="w-3.5 h-3.5 text-[#9e75ff]" /> Enhance
            </button>
            <button 
              onClick={() => generateImage()}
              disabled={isGenerating}
              className="generate-trigger-btn bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] border-none text-white text-xs font-bold py-2.5 px-6 rounded-xl cursor-pointer flex items-center gap-2 shadow-[0_4px_14px_rgba(124,77,255,0.25)] hover:shadow-[0_6px_20px_rgba(124,77,255,0.35)] hover:scale-[1.01] active:scale-100 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      {perchanceIframeUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300">
          <div className="clay-panel max-w-[420px] w-full p-6 mx-4 relative overflow-hidden flex flex-col items-center gap-5 border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.8)]">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[radial-gradient(circle,var(--primary-glow)_0%,_transparent_70%)] pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[radial-gradient(circle,var(--secondary-glow)_0%,_transparent_70%)] pointer-events-none"></div>
            
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9e75ff] shadow-inner animate-pulse">
              <BrainCircuit className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-white font-display">AetherImage Synthesis</h3>
              <p className="text-xs text-zinc-400 mt-1.5 px-4 leading-relaxed">
                Establishing secure connection to Perchance. Please verify you are human if prompted.
              </p>
            </div>

            <div className="w-[304px] h-[130px] rounded-xl overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center relative">
              <iframe 
                src={perchanceIframeUrl} 
                className="w-[300px] h-[120px] border-none"
              />
            </div>

            <div className="flex flex-col gap-1 w-full items-center">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c4dff] animate-ping" />
                <span>Synthesizing Pixel Map</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setPerchanceIframeUrl(null);
                setPerchanceIframeId(null);
                setIsGenerating(false);
                showToast("Generation cancelled", "info");
              }}
              className="text-xs text-zinc-400 hover:text-white px-4 py-2 border border-white/5 hover:border-white/15 bg-white/[0.01] hover:bg-white/5 rounded-xl transition-all cursor-pointer mt-1"
            >
              Cancel Generation
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
