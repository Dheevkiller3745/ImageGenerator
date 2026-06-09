'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Move, Brush, Crop, Undo2, Download, RefreshCw } from 'lucide-react';

interface CanvasViewportProps {
  imageDataUrl: string | null;
  editedDataUrl: string | null;
  onImageEdit: (dataUrl: string) => void;
  activeTool: 'view' | 'draw' | 'crop';
  onSetTool: (tool: 'view' | 'draw' | 'crop') => void;
  undoStack: string[];
  setUndoStack: React.Dispatch<React.SetStateAction<string[]>>;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  imageDataUrl,
  editedDataUrl,
  onImageEdit,
  activeTool,
  onSetTool,
  undoStack,
  setUndoStack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasConfig = useWorkspaceStore((state) => state.canvasConfig);
  const updateCanvasConfig = useWorkspaceStore((state) => state.updateCanvasConfig);

  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [brushSize, setBrushSize] = useState(canvasConfig.brushSize);
  const [brushColor, setBrushColor] = useState(canvasConfig.brushColor);

  const currentFilter = canvasConfig.currentFilter;
  const activePrompt = useWorkspaceStore((state) => state.activePrompt);
  const activeSeed = useWorkspaceStore((state) => state.seed);

  // Sync brush state from store
  useEffect(() => {
    setBrushSize(canvasConfig.brushSize);
    setBrushColor(canvasConfig.brushColor);
  }, [canvasConfig.brushSize, canvasConfig.brushColor]);

  // Load and draw image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceUrl = editedDataUrl || imageDataUrl;
    if (!sourceUrl) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setUndoStack([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Initialise stack if empty
      if (undoStack.length === 0) {
        setUndoStack([canvas.toDataURL()]);
      }
    };
    img.src = sourceUrl;
  }, [imageDataUrl, editedDataUrl]);

  // Handle Zoom on Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(5, z + zoomIntensity));
    } else {
      setZoom((z) => Math.max(0.2, z - zoomIntensity));
    }
  };

  // Mouse Down handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (activeTool === 'draw') {
      setIsDrawing(true);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (clientY - rect.top) * (canvas.height / rect.height);

      ctx.beginPath();
      ctx.moveTo(canvasX, canvasY);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    } 
    else if (activeTool === 'view') {
      setIsPanning(true);
      setLastMouse({ x: clientX, y: clientY });
    } 
    else if (activeTool === 'crop') {
      setIsDrawing(true);
      const startX = (clientX - rect.left) * (canvas.width / rect.width);
      const startY = (clientY - rect.top) * (canvas.height / rect.height);
      setCropBox({ x: startX, y: startY, w: 0, h: 0 });
    }
  };

  // Mouse Move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDrawing && activeTool === 'draw') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);

      ctx.lineTo(canvasX, canvasY);
      ctx.stroke();
    } 
    else if (isPanning && activeTool === 'view') {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setPanX((px) => px + dx);
      setPanY((py) => py + dy);
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
    else if (isDrawing && activeTool === 'crop' && cropBox) {
      const currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const currentY = (e.clientY - rect.top) * (canvas.height / rect.height);
      setCropBox({
        ...cropBox,
        w: currentX - cropBox.x,
        h: currentY - cropBox.y
      });
    }
  };

  // Mouse Up handler
  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDrawing && activeTool === 'draw') {
      setIsDrawing(false);
      const currentData = canvas.toDataURL();
      setUndoStack((stack) => [...stack.slice(-9), currentData]); // Max size 10
      onImageEdit(currentData);
    } 
    else if (isDrawing && activeTool === 'crop' && cropBox) {
      setIsDrawing(false);
      applyCrop();
    }
    setIsPanning(false);
  };

  // Apply Crop to Canvas
  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cropBox) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (Math.abs(cropBox.w) < 10 || Math.abs(cropBox.h) < 10) {
      setCropBox(null);
      return;
    }

    const x = cropBox.w < 0 ? cropBox.x + cropBox.w : cropBox.x;
    const y = cropBox.h < 0 ? cropBox.y + cropBox.h : cropBox.y;
    const w = Math.abs(cropBox.w);
    const h = Math.abs(cropBox.h);

    const tempImg = new Image();
    tempImg.onload = () => {
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tempImg, x, y, w, h, 0, 0, w, h);

      const croppedData = canvas.toDataURL();
      setUndoStack((stack) => [...stack.slice(-9), croppedData]);
      onImageEdit(croppedData);
      setCropBox(null);
      onSetTool('view');
    };
    // Load from the base state without temporary crop outline
    tempImg.src = undoStack[undoStack.length - 1];
  };

  // Apply visual CSS filter style mapping
  const getFilterStyle = () => {
    switch (currentFilter) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(80%)';
      case 'vintage': return 'contrast(120%) sepia(30%) hue-rotate(-15deg) saturate(140%)';
      case 'saturation': return 'saturate(180%)';
      case 'blur': return 'blur(3px)';
      case 'contrast': return 'contrast(160%)';
      default: return 'none';
    }
  };

  // Apply filter pixel-wise permanently to canvas data on save/refine
  const bakeFiltersAndDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to apply filter permanently
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.filter = getFilterStyle();
    tempCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `aetherimage_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Undo Last Action
  const triggerUndo = () => {
    if (undoStack.length <= 1) return;
    const newStack = [...undoStack];
    newStack.pop(); // Pop current state
    const prevState = newStack[newStack.length - 1];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setUndoStack(newStack);
      onImageEdit(prevState);
    };
    img.src = prevState;
  };

  // Lock seed and refine prompt
  const lockPromptAndSeed = () => {
    const setPrompt = useWorkspaceStore.getState().setPrompt;
    const setSeed = useWorkspaceStore.getState().setSeed;
    setPrompt(activePrompt);
    setSeed(activeSeed);
  };

  return (
    <div className="workspace-view flex flex-1 overflow-hidden relative bg-[#09090c]">
      {/* Outer viewport container */}
      <div 
        ref={viewportRef}
        className="canvas-outer-wrapper flex flex-1 items-center justify-center p-6 overflow-auto relative"
        onWheel={handleWheel}
      >
        {!imageDataUrl ? (
          <div className="workspace-placeholder max-w-[680px] text-center relative z-10">
            <div className="placeholder-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] height-[250px] bg-[radial-gradient(circle,_rgba(124,77,255,0.15)_0%,_transparent_70%)] pointer-events-none"></div>
            <div className="placeholder-content relative z-20">
              <div className="logo-large-spark w-16 h-16 mx-auto mb-6 bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] rounded-[20px] flex items-center justify-center shadow-[0_8px_24px_rgba(124,77,255,0.35)]">
                <Undo2 className="w-8 h-8 text-white rotate-45" />
              </div>
              <h2 className="text-2xl font-bold mb-3">AetherImage Workspace</h2>
              <p className="text-sm text-[#8e909c] mb-8 leading-relaxed">
                Generate high-quality images and edit them directly. Enter a prompt below to launch drawing sessions.
              </p>
              
              <div className="suggestion-grid grid grid-cols-2 gap-4">
                {[
                  { title: "Cyberpunk Street", prompt: "A detailed cyberpunk street at night, neon lights reflection, cinematic lighting, 8k resolution" },
                  { title: "Wizard Cottage", prompt: "A cozy medieval wizard cottage hidden inside a massive glowing mushroom forest, watercolor fantasy art" },
                  { title: "Cosmic Cat Nebula", prompt: "Abstract oil painting of a cosmic nebula shaped like a majestic cat, vibrant swirling colors, heavy impasto texture" },
                  { title: "Crystal Flower", prompt: "Hyper-detailed close up macro photography of a glass butterfly resting on a crystal flower, soft morning dew, fantasy glow" }
                ].map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => useWorkspaceStore.getState().setPrompt(s.prompt)}
                    className="suggestion-card glass-panel glass-panel-hover rounded-2xl p-5 text-left cursor-pointer overflow-hidden relative min-h-[100px] flex items-end group"
                  >
                    <span className="font-semibold text-sm z-10 text-white drop-shadow-md">{s.title}</span>
                    <div className="card-bg absolute inset-0 opacity-20 transition-all duration-200 group-hover:scale-105 group-hover:opacity-35 bg-gradient-to-tr from-[#7c4dff]/20 to-[#ff4081]/20"></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="canvas-inner-container flex flex-col border border-white/5 rounded-2xl bg-[#0c0c10]/40 backdrop-blur-md overflow-hidden max-h-full">
            <div className="canvas-container-header bg-black/20 px-4 py-2.5 flex justify-between items-center border-b border-white/5">
              <span className="canvas-meta text-[11px] text-[#8e909c]">
                Resolution: {canvasRef.current?.width || 768} x {canvasRef.current?.height || 768}px | Active Tool: {activeTool.toUpperCase()}
              </span>
            </div>
            
            <div 
              className={`canvas-viewport bg-[#0b0b0e] min-h-[380px] p-4 flex items-center justify-center relative ${
                activeTool === 'view' ? 'cursor-grab active:cursor-grabbing' : activeTool === 'draw' ? 'cursor-crosshair' : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <canvas 
                ref={canvasRef} 
                id="imageCanvas" 
                style={{ 
                  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                  filter: getFilterStyle(),
                  transformOrigin: 'center center'
                }}
                className="shadow-[0_12px_36px_rgba(0,0,0,0.6)] select-none transition-transform duration-75"
              />
              
              {/* Manual Crop box outline visual helper */}
              {activeTool === 'crop' && cropBox && (
                <div 
                  className="absolute border-2 border-dashed border-[#ff4081] pointer-events-none bg-black/20"
                  style={{
                    left: `calc(50% + ${panX}px + ${(cropBox.w < 0 ? cropBox.x + cropBox.w : cropBox.x) * zoom - (canvasRef.current?.width || 768) / 2 * zoom}px)`,
                    top: `calc(50% + ${panY}px + ${(cropBox.h < 0 ? cropBox.y + cropBox.h : cropBox.y) * zoom - (canvasRef.current?.height || 768) / 2 * zoom}px)`,
                    width: `${Math.abs(cropBox.w) * zoom}px`,
                    height: `${Math.abs(cropBox.h) * zoom}px`,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating glassmorphic editor toolbox (visible when image exists) */}
      {imageDataUrl && (
        <div className="canvas-editor-toolbox w-[250px] bg-[#0c0c10]/75 backdrop-blur-xl border-l border-white/5 p-6 flex flex-col gap-5 z-10 overflow-y-auto">
          <div className="toolbox-header">
            <h4 className="text-xs uppercase tracking-wider flex items-center gap-2 font-bold">
              <Brush className="w-3.5 h-3.5 text-[#7c4dff]" /> Editor Power
            </h4>
          </div>
          
          {/* Tool selector */}
          <div className="tool-section flex flex-col gap-2">
            <span className="tool-title text-[10px] uppercase font-bold text-[#8e909c]">Select Tool</span>
            <div className="tool-buttons-row grid grid-cols-3 gap-1.5">
              <button 
                onClick={() => onSetTool('view')}
                className={`tool-btn flex flex-col items-center gap-1.5 p-2 text-[9px] font-semibold border rounded-md transition-all ${
                  activeTool === 'view' ? 'bg-[#7c4dff]/10 border-[#7c4dff] text-[#9e75ff]' : 'bg-white/[0.02] border-white/5 text-[#8e909c] hover:bg-white/[0.06]'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>Pan/Zoom</span>
              </button>
              <button 
                onClick={() => onSetTool('draw')}
                className={`tool-btn flex flex-col items-center gap-1.5 p-2 text-[9px] font-semibold border rounded-md transition-all ${
                  activeTool === 'draw' ? 'bg-[#7c4dff]/10 border-[#7c4dff] text-[#9e75ff]' : 'bg-white/[0.02] border-white/5 text-[#8e909c] hover:bg-white/[0.06]'
                }`}
              >
                <Brush className="w-3.5 h-3.5" />
                <span>Brush</span>
              </button>
              <button 
                onClick={() => onSetTool('crop')}
                className={`tool-btn flex flex-col items-center gap-1.5 p-2 text-[9px] font-semibold border rounded-md transition-all ${
                  activeTool === 'crop' ? 'bg-[#7c4dff]/10 border-[#7c4dff] text-[#9e75ff]' : 'bg-white/[0.02] border-white/5 text-[#8e909c] hover:bg-white/[0.06]'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Crop</span>
              </button>
            </div>
          </div>

          {/* Brush Config Panel */}
          {activeTool === 'draw' && (
            <div className="tool-config-panel bg-white/[0.02] border border-white/5 rounded-md p-3 flex flex-col gap-3">
              <span className="tool-title text-[9px] uppercase font-bold text-[#8e909c]">Brush Config</span>
              <div className="brush-settings flex flex-col gap-2.5">
                <div className="brush-row flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] text-[#8e909c]">
                    <label>Size</label>
                    <span className="font-bold text-[#9e75ff]">{brushSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={brushSize} 
                    onChange={(e) => updateCanvasConfig({ brushSize: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="brush-row flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#8e909c]">Color</label>
                  <div className="color-picker-row flex flex-wrap gap-1.5">
                    {['#ffffff', '#000000', '#ff4081', '#fdd835', '#4caf50', '#00bcd4', '#7c4dff'].map((c, i) => (
                      <button 
                        key={i} 
                        style={{ backgroundColor: c }}
                        onClick={() => updateCanvasConfig({ brushColor: c })}
                        className={`w-4.5 h-4.5 rounded-full border border-white/20 transition-transform hover:scale-110 ${
                          brushColor === c ? 'ring-2 ring-offset-2 ring-offset-[#121217] ring-[#7c4dff]' : ''
                        }`}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={brushColor} 
                      onChange={(e) => updateCanvasConfig({ brushColor: e.target.value })}
                      className="w-4.5 h-4.5 rounded-full appearance-none border-none bg-transparent cursor-pointer" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters List */}
          <div className="tool-section flex flex-col gap-2">
            <span className="tool-title text-[10px] uppercase font-bold text-[#8e909c]">Filters</span>
            <div className="filters-grid grid grid-cols-2 gap-1.5">
              {[
                { name: 'Normal', value: 'none' },
                { name: 'Grayscale', value: 'grayscale' },
                { name: 'Sepia', value: 'sepia' },
                { name: 'Vintage', value: 'vintage' },
                { name: 'Saturate', value: 'saturation' },
                { name: 'Blur', value: 'blur' },
                { name: 'Contrast', value: 'contrast' }
              ].map((f, i) => (
                <button 
                  key={i}
                  onClick={() => updateCanvasConfig({ currentFilter: f.value as any })}
                  className={`filter-btn p-1.5 text-[10px] font-semibold border rounded-md transition-all ${
                    currentFilter === f.value ? 'bg-[#7c4dff]/10 border-[#7c4dff] text-[#9e75ff]' : 'bg-white/[0.02] border-white/5 text-[#8e909c] hover:bg-white/[0.06]'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="tool-section footer-actions mt-auto border-t border-white/5 pt-4 flex flex-col gap-3">
            <button 
              onClick={lockPromptAndSeed}
              className="action-btn text-btn flex items-center justify-center gap-2 p-2 text-xs font-medium text-[#8e909c] hover:text-white rounded-md hover:bg-white/[0.04] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refine Prompt
            </button>
            <div className="canvas-utility-row flex gap-2">
              <button 
                onClick={triggerUndo}
                disabled={undoStack.length <= 1}
                className="icon-btn p-2 border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none rounded-md transition-all"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button 
                onClick={bakeFiltersAndDownload}
                className="action-btn primary flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs text-white bg-gradient-to-tr from-[#7c4dff] to-[#ff4081] shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-100 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
