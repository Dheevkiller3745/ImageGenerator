/* ==========================================================================
   AetherImage Core Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // UI Elements
    // ----------------------------------------------------------------------
    const el = {
        sidebar: document.getElementById('appSidebar'),
        toggleSidebar: document.getElementById('toggleSidebarBtn'),
        closeSidebar: document.getElementById('closeSidebarBtn'),
        newSession: document.getElementById('newSessionBtn'),
        sessionList: document.getElementById('sessionList'),
        engineSelect: document.getElementById('engineSelect'),
        perchanceWarning: document.getElementById('perchanceWarning'),
        ratioBtns: document.querySelectorAll('.ratio-btn'),
        toggleAdvanced: document.getElementById('toggleAdvanced'),
        advancedContent: document.getElementById('advancedContent'),
        guidanceScale: document.getElementById('guidanceScale'),
        guidanceVal: document.getElementById('guidanceVal'),
        seedInput: document.getElementById('seedInput'),
        randomizeSeed: document.getElementById('randomizeSeedBtn'),
        negativePrompt: document.getElementById('negativePrompt'),
        
        activeTitle: document.getElementById('activeWorkspaceTitle'),
        statusIndicator: document.getElementById('statusIndicator'),
        clearWorkspace: document.getElementById('clearWorkspaceBtn'),
        
        workspacePlaceholder: document.getElementById('workspacePlaceholder'),
        canvasInnerContainer: document.getElementById('canvasInnerContainer'),
        currentImgDetails: document.getElementById('currentImgDetails'),
        canvasViewport: document.getElementById('canvasViewport'),
        imageCanvas: document.getElementById('imageCanvas'),
        
        editorToolbox: document.getElementById('canvasEditorToolbox'),
        toolView: document.getElementById('toolViewBtn'),
        toolDraw: document.getElementById('toolDrawBtn'),
        toolCrop: document.getElementById('toolCropBtn'),
        activeToolIndicator: document.getElementById('activeToolIndicator'),
        activeToolIcon: document.getElementById('activeToolIcon'),
        
        brushConfigPanel: document.getElementById('brushConfigPanel'),
        brushSize: document.getElementById('brushSize'),
        brushSizeVal: document.getElementById('brushSizeVal'),
        colorDots: document.querySelectorAll('.color-dot'),
        customColorPicker: document.getElementById('customColorPicker'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        undoBtn: document.getElementById('undoBtn'),
        saveCanvas: document.getElementById('saveCanvasBtn'),
        refinePrompt: document.getElementById('refinePromptBtn'),
        
        rememberStyle: document.getElementById('rememberStyleToggle'),
        rememberElements: document.getElementById('rememberElementsToggle'),
        memoryChips: document.getElementById('memoryChips'),
        promptInput: document.getElementById('promptInput'),
        enhancePrompt: document.getElementById('enhancePromptBtn'),
        generateBtn: document.getElementById('generateBtn'),
        
        toast: document.getElementById('toastNotification'),
        toastMessage: document.getElementById('toastMessage'),
        toastIcon: document.getElementById('toastIcon'),
        suggestionCards: document.querySelectorAll('.suggestion-card')
    };

    // ----------------------------------------------------------------------
    // State Manager
    // ----------------------------------------------------------------------
    let state = {
        workspaces: [],
        activeWorkspaceId: null,
        activeTool: 'view', // 'view', 'draw', 'crop'
        brush: {
            size: 8,
            color: '#ffffff'
        },
        zoom: 1.0,
        panX: 0,
        panY: 0,
        isDrawing: false,
        isPanning: false,
        lastMouseX: 0,
        lastMouseY: 0,
        
        // Canvas Editing History (Undo Stack)
        undoStack: [],
        maxStackSize: 10,
        
        // Canvas Crop box helper
        cropBox: null // {x, y, w, h}
    };

    // Canvas rendering context
    const ctx = el.imageCanvas.getContext('2d');
    let originalImage = null; // Store base image to re-apply filters clean

    // ----------------------------------------------------------------------
    // Local Storage Persistence
    // ----------------------------------------------------------------------
    function loadSavedState() {
        const saved = localStorage.getItem('aether_image_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state.workspaces = parsed.workspaces || [];
                state.activeWorkspaceId = parsed.activeWorkspaceId || null;
            } catch (e) {
                console.error("Failed to parse saved state", e);
            }
        }
        
        // Create initial session if empty
        if (state.workspaces.length === 0) {
            createNewWorkspace("Cyberpunk Street");
        } else {
            renderSessionList();
            loadWorkspace(state.activeWorkspaceId || state.workspaces[0].id);
        }
    }

    function saveState() {
        const payload = {
            workspaces: state.workspaces.map(w => {
                // Remove raw image tags if too heavy, but dataUrls are fine in localStorage up to 5MB
                return {
                    id: w.id,
                    title: w.title,
                    prompt: w.prompt,
                    negativePrompt: w.negativePrompt,
                    seed: w.seed,
                    guidanceScale: w.guidanceScale,
                    ratio: w.ratio,
                    engine: w.engine,
                    imageDataUrl: w.imageDataUrl,
                    editedDataUrl: w.editedDataUrl,
                    memoryChips: w.memoryChips
                };
            }),
            activeWorkspaceId: state.activeWorkspaceId
        };
        try {
            localStorage.setItem('aether_image_state', JSON.stringify(payload));
        } catch (e) {
            // If quota exceeded, clear older workspaces' images
            console.warn("Storage full, cleaning image cache...");
            if (state.workspaces.length > 2) {
                for (let i = 0; i < state.workspaces.length - 2; i++) {
                    state.workspaces[i].imageDataUrl = "";
                    state.workspaces[i].editedDataUrl = "";
                }
                localStorage.setItem('aether_image_state', JSON.stringify(payload));
            }
        }
    }

    // ----------------------------------------------------------------------
    // Session / Workspace Actions
    // ----------------------------------------------------------------------
    function createNewWorkspace(initialTitle = "New Workspace") {
        const id = 'ws_' + Date.now();
        const newWs = {
            id: id,
            title: initialTitle,
            prompt: "",
            negativePrompt: "",
            seed: -1,
            guidanceScale: 7.0,
            ratio: "square",
            engine: "puter",
            imageDataUrl: "",
            editedDataUrl: "",
            memoryChips: []
        };
        state.workspaces.unshift(newWs);
        state.activeWorkspaceId = id;
        
        renderSessionList();
        loadWorkspace(id);
        saveState();
        showToast("New workspace created");
    }

    function deleteWorkspace(id, event) {
        if (event) event.stopPropagation();
        
        const index = state.workspaces.findIndex(w => w.id === id);
        if (index === -1) return;
        
        state.workspaces.splice(index, 1);
        
        // Handle active selection change
        if (state.activeWorkspaceId === id) {
            if (state.workspaces.length > 0) {
                state.activeWorkspaceId = state.workspaces[0].id;
            } else {
                createNewWorkspace();
                return;
            }
        }
        
        renderSessionList();
        loadWorkspace(state.activeWorkspaceId);
        saveState();
        showToast("Workspace deleted");
    }

    function renderSessionList() {
        el.sessionList.innerHTML = '';
        state.workspaces.forEach(w => {
            const li = document.createElement('li');
            li.className = `session-item ${w.id === state.activeWorkspaceId ? 'active' : ''}`;
            li.dataset.id = w.id;
            li.addEventListener('click', () => loadWorkspace(w.id));
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'session-name';
            nameSpan.textContent = w.title;
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-session-btn';
            delBtn.innerHTML = '<i data-lucide="x"></i>';
            delBtn.addEventListener('click', (e) => deleteWorkspace(w.id, e));
            
            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            el.sessionList.appendChild(li);
        });
        lucide.createIcons(); // Initialize icons
    }

    function loadWorkspace(id) {
        state.activeWorkspaceId = id;
        const w = state.workspaces.find(ws => ws.id === id);
        if (!w) return;
        
        // Highlight active item in sidebar list
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === id);
        });
        
        // Load Form Values
        el.activeTitle.textContent = w.title;
        el.promptInput.value = w.prompt;
        el.negativePrompt.value = w.negativePrompt;
        el.guidanceScale.value = w.guidanceScale;
        el.guidanceVal.textContent = parseFloat(w.guidanceScale).toFixed(1);
        el.seedInput.value = w.seed;
        
        // Setup engine select
        el.engineSelect.value = w.engine;
        toggleEngineWarnings(w.engine);
        
        // Setup Aspect Ratio buttons
        el.ratioBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === w.ratio);
        });
        
        // Load Memory chips
        renderMemoryChips(w.memoryChips);
        
        // Load canvas state
        state.undoStack = [];
        state.zoom = 1.0;
        state.panX = 0;
        state.panY = 0;
        
        const activeImgUrl = w.editedDataUrl || w.imageDataUrl;
        if (activeImgUrl) {
            el.workspacePlaceholder.classList.add('hidden');
            el.canvasInnerContainer.classList.remove('hidden');
            el.editorToolbox.classList.remove('hidden');
            
            loadImageToCanvas(activeImgUrl, () => {
                el.currentImgDetails.textContent = `Dimensions: ${el.imageCanvas.width} x ${el.imageCanvas.height}px | Seed: ${w.seed}`;
                updateCanvasTransform();
            });
        } else {
            el.workspacePlaceholder.classList.remove('hidden');
            el.canvasInnerContainer.classList.add('hidden');
            el.editorToolbox.classList.add('hidden');
            clearCanvas();
        }
        
        // Set View tool as default
        setTool('view');
        updateStatus("Ready", "ready");
    }

    function updateWorkspaceDetails(ws) {
        ws.prompt = el.promptInput.value;
        ws.negativePrompt = el.negativePrompt.value;
        ws.seed = parseInt(el.seedInput.value) || -1;
        ws.guidanceScale = parseFloat(el.guidanceScale.value) || 7.0;
        ws.engine = el.engineSelect.value;
        
        const activeRatioBtn = document.querySelector('.ratio-btn.active');
        ws.ratio = activeRatioBtn ? activeRatioBtn.dataset.ratio : "square";
    }

    // ----------------------------------------------------------------------
    // Canvas Base Draw and Zoom Operations
    // ----------------------------------------------------------------------
    function clearCanvas() {
        ctx.clearRect(0, 0, el.imageCanvas.width, el.imageCanvas.height);
        originalImage = null;
    }

    function loadImageToCanvas(dataUrl, callback) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            el.imageCanvas.width = img.width;
            el.imageCanvas.height = img.height;
            ctx.clearRect(0, 0, img.width, img.height);
            ctx.drawImage(img, 0, 0);
            
            // Retain original image clean copy for canvas filtering
            originalImage = img;
            
            // Save state to Undo Stack on first load
            saveCanvasState();
            
            if (callback) callback();
        };
        img.src = dataUrl;
    }

    function updateCanvasTransform() {
        el.imageCanvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
    }

    function saveCanvasState() {
        if (state.undoStack.length >= state.maxStackSize) {
            state.undoStack.shift();
        }
        state.undoStack.push(el.imageCanvas.toDataURL());
    }

    function undoLastAction() {
        if (state.undoStack.length <= 1) {
            showToast("Nothing to undo");
            return;
        }
        
        state.undoStack.pop(); // Pop current state
        const prevState = state.undoStack[state.undoStack.length - 1];
        
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, el.imageCanvas.width, el.imageCanvas.height);
            ctx.drawImage(img, 0, 0);
            showToast("Action undone");
            
            // Update active edited data
            const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
            if (activeWs) {
                activeWs.editedDataUrl = prevState;
                saveState();
            }
        };
        img.src = prevState;
    }

    // ----------------------------------------------------------------------
    // Canvas Mouse Operations (Pan, Draw & Crop)
    // ----------------------------------------------------------------------
    el.canvasViewport.addEventListener('mousedown', (e) => {
        const rect = el.imageCanvas.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        // Tool Draw
        if (state.activeTool === 'draw') {
            state.isDrawing = true;
            // Get coordinates on the canvas itself (taking account of translation & zoom)
            const canvasX = (clientX - rect.left) * (el.imageCanvas.width / rect.width);
            const canvasY = (clientY - rect.top) * (el.imageCanvas.height / rect.height);
            
            ctx.beginPath();
            ctx.moveTo(canvasX, canvasY);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = state.brush.color;
            ctx.lineWidth = state.brush.size;
        } 
        // Tool View (Pan)
        else if (state.activeTool === 'view') {
            state.isPanning = true;
            state.lastMouseX = clientX;
            state.lastMouseY = clientY;
        }
        // Tool Crop Box initiation
        else if (state.activeTool === 'crop') {
            state.isDrawing = true; // Drawing crop box
            const startX = (clientX - rect.left) * (el.imageCanvas.width / rect.width);
            const startY = (clientY - rect.top) * (el.imageCanvas.height / rect.height);
            state.cropBox = { x: startX, y: startY, w: 0, h: 0 };
        }
    });

    el.canvasViewport.addEventListener('mousemove', (e) => {
        const rect = el.imageCanvas.getBoundingClientRect();
        
        if (state.isDrawing && state.activeTool === 'draw') {
            const canvasX = (e.clientX - rect.left) * (el.imageCanvas.width / rect.width);
            const canvasY = (e.clientY - rect.top) * (el.imageCanvas.height / rect.height);
            
            ctx.lineTo(canvasX, canvasY);
            ctx.stroke();
        } 
        else if (state.isPanning && state.activeTool === 'view') {
            const dx = e.clientX - state.lastMouseX;
            const dy = e.clientY - state.lastMouseY;
            state.panX += dx;
            state.panY += dy;
            state.lastMouseX = e.clientX;
            state.lastMouseY = e.clientY;
            updateCanvasTransform();
        }
        else if (state.isDrawing && state.activeTool === 'crop') {
            // Update crop box rectangle coords
            const currentX = (e.clientX - rect.left) * (el.imageCanvas.width / rect.width);
            const currentY = (e.clientY - rect.top) * (el.imageCanvas.height / rect.height);
            
            state.cropBox.w = currentX - state.cropBox.x;
            state.cropBox.h = currentY - state.cropBox.y;
            
            // Draw crop box overlay on viewport (visual help)
            drawCropBoxOverlay();
        }
    });

    el.canvasViewport.addEventListener('mouseup', () => {
        if (state.isDrawing && state.activeTool === 'draw') {
            state.isDrawing = false;
            saveCanvasState();
            
            // Update active edited data
            const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
            if (activeWs) {
                activeWs.editedDataUrl = el.imageCanvas.toDataURL();
                saveState();
            }
        } 
        else if (state.isDrawing && state.activeTool === 'crop') {
            state.isDrawing = false;
            applyCrop();
        }
        state.isPanning = false;
    });

    // Zoom mousewheel listener
    el.canvasViewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        if (e.deltaY < 0) {
            state.zoom += zoomIntensity;
        } else {
            state.zoom = Math.max(0.2, state.zoom - zoomIntensity);
        }
        updateCanvasTransform();
    });

    // Visual helper to draw crop rectangle overlay
    function drawCropBoxOverlay() {
        if (!state.cropBox) return;
        
        // Redraw canvas state, then draw crop bounding box on top temporarily
        const tempImg = new Image();
        tempImg.onload = () => {
            ctx.clearRect(0, 0, el.imageCanvas.width, el.imageCanvas.height);
            ctx.drawImage(tempImg, 0, 0);
            
            // Draw overlay rect
            ctx.save();
            ctx.strokeStyle = '#ff4081';
            ctx.lineWidth = 2 / state.zoom;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(state.cropBox.x, state.cropBox.y, state.cropBox.w, state.cropBox.h);
            
            // Shade outer area
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            // Top
            ctx.fillRect(0, 0, el.imageCanvas.width, state.cropBox.y);
            // Bottom
            ctx.fillRect(0, state.cropBox.y + state.cropBox.h, el.imageCanvas.width, el.imageCanvas.height - (state.cropBox.y + state.cropBox.h));
            // Left
            ctx.fillRect(0, state.cropBox.y, state.cropBox.x, state.cropBox.h);
            // Right
            ctx.fillRect(state.cropBox.x + state.cropBox.w, state.cropBox.y, el.imageCanvas.width - (state.cropBox.x + state.cropBox.w), state.cropBox.h);
            
            ctx.restore();
        };
        // Load from last state in stack (which doesn't have the temporary overlay lines)
        tempImg.src = state.undoStack[state.undoStack.length - 1];
    }

    function applyCrop() {
        if (!state.cropBox || Math.abs(state.cropBox.w) < 10 || Math.abs(state.cropBox.h) < 10) {
            state.cropBox = null;
            return;
        }
        
        // Normalise dimensions in case of dragging backwards
        const x = state.cropBox.w < 0 ? state.cropBox.x + state.cropBox.w : state.cropBox.x;
        const y = state.cropBox.h < 0 ? state.cropBox.y + state.cropBox.h : state.cropBox.y;
        const w = Math.abs(state.cropBox.w);
        const h = Math.abs(state.cropBox.h);

        // Copy cropped area from last stack image
        const tempImg = new Image();
        tempImg.onload = () => {
            // Resize canvas to crop size
            el.imageCanvas.width = w;
            el.imageCanvas.height = h;
            
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(tempImg, x, y, w, h, 0, 0, w, h);
            
            // Save state & clean
            saveCanvasState();
            state.cropBox = null;
            setTool('view'); // Revert tool
            
            // Update active edited data
            const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
            if (activeWs) {
                activeWs.editedDataUrl = el.imageCanvas.toDataURL();
                saveState();
            }
            showToast("Image cropped successfully");
        };
        tempImg.src = state.undoStack[state.undoStack.length - 1];
    }

    // ----------------------------------------------------------------------
    // Canvas Editor: Pixel-level Filter Functions
    // ----------------------------------------------------------------------
    function applyPixelFilter(filterType) {
        if (!originalImage) return;

        // Reset to original image pixels first
        ctx.clearRect(0, 0, el.imageCanvas.width, el.imageCanvas.height);
        ctx.drawImage(originalImage, 0, 0);

        if (filterType === 'reset') {
            saveCanvasState();
            showToast("Filter reset");
            return;
        }

        const imgData = ctx.getImageData(0, 0, el.imageCanvas.width, el.imageCanvas.height);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i+1];
            const b = d[i+2];

            if (filterType === 'grayscale') {
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                d[i] = d[i+1] = d[i+2] = gray;
            } 
            else if (filterType === 'sepia') {
                d[i]   = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                d[i+1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                d[i+2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            } 
            else if (filterType === 'vintage') {
                // High contrast warm filter
                d[i]   = Math.min(255, r * 1.15);
                d[i+1] = Math.min(255, g * 0.95);
                d[i+2] = Math.min(255, b * 0.82);
            } 
            else if (filterType === 'saturate') {
                // Boost primary color components slightly
                d[i]   = Math.min(255, r * 1.3);
                d[i+1] = Math.min(255, g * 1.3);
                d[i+2] = Math.min(255, b * 1.3);
            }
            else if (filterType === 'highcontrast') {
                // simple contrast adjustment
                const factor = (259 * (100 + 255)) / (255 * (259 - 100));
                d[i]   = Math.min(255, Math.max(0, factor * (r - 128) + 128));
                d[i+1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
                d[i+2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // Simple box blur using CSS canvas operations
        if (filterType === 'blur') {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.drawImage(el.imageCanvas, -2, -2);
            ctx.drawImage(el.imageCanvas, 2, 2);
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        saveCanvasState();
        showToast(`Applied ${filterType} filter`);
        
        // Save to active workspace
        const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
        if (activeWs) {
            activeWs.editedDataUrl = el.imageCanvas.toDataURL();
            saveState();
        }
    }

    // ----------------------------------------------------------------------
    // Context Memory & Prompt Enhancer
    // ----------------------------------------------------------------------
    function extractMemoryContext(prompt) {
        // Find typical style tokens
        const styleKeywords = [
            'watercolor', 'oil painting', 'acrylic', 'cyberpunk', 'neon lighting', 
            'retro anime', 'sketch', 'digital art', '3d render', 'claymation', 
            'photorealistic', 'cinematic lighting', 'fantasy landscape', 'surrealism',
            'minimalist', 'gothic', 'baroque', 'steampunk', 'concept art', 'charcoal'
        ];

        const lowercasePrompt = prompt.toLowerCase();
        let extracted = [];

        styleKeywords.forEach(keyword => {
            if (lowercasePrompt.includes(keyword)) {
                // Capitalise keyword
                const capitalised = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                extracted.push(capitalised);
            }
        });

        // Split on commas, grab the last few words if they describe style
        const components = prompt.split(',').map(s => s.trim());
        components.forEach(comp => {
            if (comp.length < 25 && comp.length > 3) {
                // check if it's descriptive
                const descriptors = ['style', 'lighting', 'art', 'detailed', 'aesthetic', 'render', 'portrait'];
                if (descriptors.some(d => comp.toLowerCase().includes(d)) && !extracted.includes(comp)) {
                    extracted.push(comp);
                }
            }
        });

        return extracted.slice(0, 5); // Max 5 chips
    }

    function renderMemoryChips(chips) {
        el.memoryChips.innerHTML = '';
        if (!chips || chips.length === 0) {
            const span = document.createElement('span');
            span.className = 'empty-memory-text';
            span.textContent = 'No active memory chips. Generate an image to record style context.';
            el.memoryChips.appendChild(span);
            return;
        }

        chips.forEach(chipText => {
            const chip = document.createElement('span');
            chip.className = 'memory-chip';
            chip.innerHTML = `${chipText} <i data-lucide="x" class="close-chip"></i>`;
            
            // Remove specific chip on click
            chip.querySelector('.close-chip').addEventListener('click', () => {
                const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
                if (activeWs) {
                    activeWs.memoryChips = activeWs.memoryChips.filter(c => c !== chipText);
                    renderMemoryChips(activeWs.memoryChips);
                    saveState();
                }
            });

            el.memoryChips.appendChild(chip);
        });
        lucide.createIcons();
    }

    function getRefinedPrompt() {
        let basePrompt = el.promptInput.value.trim();
        const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
        if (!activeWs) return basePrompt;

        // Append styles from memory context if enabled
        if (el.rememberStyle.checked && activeWs.memoryChips && activeWs.memoryChips.length > 0) {
            const styleContext = activeWs.memoryChips.join(', ');
            // Make sure style context isn't already directly in the prompt
            const cleanStyles = activeWs.memoryChips.filter(chip => !basePrompt.toLowerCase().includes(chip.toLowerCase()));
            if (cleanStyles.length > 0) {
                basePrompt += `, ${cleanStyles.join(', ')}`;
            }
        }

        return basePrompt;
    }

    function enhanceCurrentPrompt() {
        const base = el.promptInput.value.trim();
        if (!base) {
            showToast("Enter a prompt first to enhance");
            return;
        }

        // Add artistic details to make it stand out
        const renderAdditions = [
            "masterpiece, highly detailed illustration",
            "volumetric cinematic lighting, unreal engine 5 render",
            "vibrant colors, sharp focus, 8k resolution",
            "trending on artstation, masterpiece painting style",
            "photorealistic, dramatic shadows, warm studio glow"
        ];

        const randomAdd = renderAdditions[Math.floor(Math.random() * renderAdditions.length)];
        el.promptInput.value = `${base}, ${randomAdd}`;
        showToast("Prompt enhanced!");
    }

    // ----------------------------------------------------------------------
    // Core Generation Handlers (Puter, Pollinations & Perchance API Proxy)
    // ----------------------------------------------------------------------
    async function triggerImageGeneration() {
        const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
        if (!activeWs) return;

        updateWorkspaceDetails(activeWs);

        const promptToSend = getRefinedPrompt();
        if (!promptToSend) {
            showToast("Please enter an image description prompt");
            return;
        }

        updateStatus("Generating...", "generating");
        showToast("AI is drawing your image...");
        el.generateBtn.disabled = true;

        const resolutionMap = {
            square: { w: 768, h: 768 },
            portrait: { w: 512, h: 768 },
            landscape: { w: 768, h: 512 }
        };
        const dim = resolutionMap[activeWs.ratio];
        const seedVal = activeWs.seed === -1 ? Math.floor(Math.random() * 1000000) : activeWs.seed;

        try {
            let finalImgDataUrl = "";
            let generatedSeed = seedVal;

            // 1. Puter.js Generation
            if (activeWs.engine === 'puter') {
                console.log("Calling Puter.js txt2img...");
                // Note: We run txt2img. testMode=false to run actual models.
                const imgElement = await puter.ai.txt2img(promptToSend);
                
                // Convert browser Blob URL to base64 dataUrl so we can store/edit it
                finalImgDataUrl = await convertImgElementToDataURL(imgElement);
            } 
            // 2. Pollinations.ai Generation
            else if (activeWs.engine === 'pollinations') {
                console.log("Calling Pollinations.ai direct endpoint...");
                const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptToSend)}?width=${dim.w}&height=${dim.h}&seed=${seedVal}&nologo=true`;
                
                const response = await fetch(url);
                if (response.status === 402) {
                    throw new Error("Rate limit exceeded for Pollinations AI (IP limit). Please try again in a moment or use Puter AI.");
                }
                if (!response.ok) {
                    throw new Error(`Failed to generate via Pollinations: ${response.statusText}`);
                }
                
                const blob = await response.blob();
                finalImgDataUrl = await readBlobAsDataURL(blob);
            } 
            // 3. Perchance Backend Proxy Generation
            else if (activeWs.engine === 'perchance') {
                console.log("Calling local Perchance backend endpoint...");
                const response = await fetch('/api/generate/perchance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: promptToSend,
                        negative_prompt: activeWs.negativePrompt,
                        seed: seedVal,
                        shape: activeWs.ratio,
                        guidance_scale: activeWs.guidanceScale
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || "Server error occurred during Perchance API proxy call.");
                }

                const data = await response.json();
                finalImgDataUrl = data.imageUrl;
                generatedSeed = data.seed;
            }

            // Save result to Workspace
            activeWs.imageDataUrl = finalImgDataUrl;
            activeWs.editedDataUrl = ""; // Reset edits on new generation
            activeWs.seed = generatedSeed;
            activeWs.title = promptToSend.substring(0, 24) + (promptToSend.length > 24 ? "..." : "");

            // Extract prompt memory style chips
            const styleChips = extractMemoryContext(promptToSend);
            activeWs.memoryChips = [...new Set([...activeWs.memoryChips, ...styleChips])].slice(0, 5);

            // Load to view
            renderSessionList();
            loadWorkspace(activeWs.id);
            showToast("Image generated successfully!");
            updateStatus("Ready", "ready");

        } catch (err) {
            console.error(err);
            updateStatus("Error", "error");
            showToast(`Error: ${err.message}`);
        } finally {
            el.generateBtn.disabled = false;
            saveState();
        }
    }

    // ----------------------------------------------------------------------
    // Utility Conversions
    // ----------------------------------------------------------------------
    function convertImgElementToDataURL(imgEl) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                const canvasCtx = canvas.getContext('2d');
                canvasCtx.drawImage(image, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            image.onerror = (e) => reject(new Error("Failed to load image element for data conversion"));
            image.src = imgEl.src;
        });
    }

    function readBlobAsDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // ----------------------------------------------------------------------
    // UI Helpers (Sidebar toggles, status, tool setters, toasts)
    // ----------------------------------------------------------------------
    function setTool(toolName) {
        state.activeTool = toolName;
        
        // Remove class states from elements
        el.toolView.classList.toggle('active', toolName === 'view');
        el.toolDraw.classList.toggle('active', toolName === 'draw');
        el.toolCrop.classList.toggle('active', toolName === 'crop');
        
        // Adjust cursor state in viewport
        el.canvasViewport.className = 'canvas-viewport';
        if (toolName === 'view') {
            el.canvasViewport.classList.add('drag-tool');
            el.activeToolIcon.setAttribute('data-lucide', 'move');
            el.activeToolIndicator.title = "Active Tool: Pan & View";
        } else if (toolName === 'draw') {
            el.canvasViewport.classList.add('draw-tool');
            el.activeToolIcon.setAttribute('data-lucide', 'brush');
            el.activeToolIndicator.title = "Active Tool: Brush Painting";
        } else if (toolName === 'crop') {
            el.activeToolIcon.setAttribute('data-lucide', 'crop');
            el.activeToolIndicator.title = "Active Tool: Crop Rectangle";
            showToast("Drag a rectangle on the image to crop it");
        }
        
        lucide.createIcons();

        // Show/hide brush configs
        el.brushConfigPanel.classList.toggle('hidden', toolName !== 'draw');
    }

    function toggleEngineWarnings(engine) {
        el.perchanceWarning.classList.toggle('hidden', engine !== 'perchance');
    }

    function updateStatus(text, typeClass) {
        el.statusIndicator.textContent = text;
        el.statusIndicator.className = `status-indicator ${typeClass}`;
    }

    function showToast(message) {
        el.toastMessage.textContent = message;
        el.toast.classList.remove('hidden');
        
        // Clear previous timeouts
        if (window.toastTimeout) clearTimeout(window.toastTimeout);
        
        window.toastTimeout = setTimeout(() => {
            el.toast.classList.add('hidden');
        }, 3500);
    }

    // ----------------------------------------------------------------------
    // Event Listeners Configuration
    // ----------------------------------------------------------------------
    
    // Sidebar visibility toggle
    el.toggleSidebar.addEventListener('click', () => {
        el.sidebar.classList.add('sidebar-open');
    });
    
    el.closeSidebar.addEventListener('click', () => {
        el.sidebar.classList.remove('sidebar-open');
    });

    el.newSession.addEventListener('click', () => {
        createNewWorkspace();
    });

    el.clearWorkspace.addEventListener('click', () => {
        if (confirm("Reset current workspace? This will delete the active image and history.")) {
            const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
            if (activeWs) {
                activeWs.imageDataUrl = "";
                activeWs.editedDataUrl = "";
                activeWs.prompt = "";
                activeWs.seed = -1;
                activeWs.memoryChips = [];
                
                loadWorkspace(activeWs.id);
                saveState();
            }
        }
    });

    el.engineSelect.addEventListener('change', (e) => {
        toggleEngineWarnings(e.target.value);
        const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
        if (activeWs) {
            activeWs.engine = e.target.value;
            saveState();
        }
    });

    // Aspect ratio button selection
    el.ratioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            el.ratioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
            if (activeWs) {
                activeWs.ratio = btn.dataset.ratio;
                saveState();
            }
        });
    });

    // Advanced setting accordion toggle
    el.toggleAdvanced.addEventListener('click', () => {
        const icon = el.toggleAdvanced.querySelector('.chevron-icon');
        icon.classList.toggle('rotated');
        el.advancedContent.classList.toggle('collapsed');
    });

    el.guidanceScale.addEventListener('input', (e) => {
        el.guidanceVal.textContent = parseFloat(e.target.value).toFixed(1);
    });

    el.randomizeSeed.addEventListener('click', () => {
        el.seedInput.value = -1;
        showToast("Seed set to random (-1)");
    });

    // Tool config changes
    el.toolView.addEventListener('click', () => setTool('view'));
    el.toolDraw.addEventListener('click', () => setTool('draw'));
    el.toolCrop.addEventListener('click', () => setTool('crop'));

    el.brushSize.addEventListener('input', (e) => {
        state.brush.size = parseInt(e.target.value);
        el.brushSizeVal.textContent = `${e.target.value}px`;
    });

    el.colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            el.colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            state.brush.color = dot.dataset.color;
        });
    });

    el.customColorPicker.addEventListener('input', (e) => {
        el.colorDots.forEach(d => d.classList.remove('active'));
        state.brush.color = e.target.value;
    });

    // Filters application
    el.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyPixelFilter(btn.dataset.filter);
        });
    });

    el.undoBtn.addEventListener('click', undoLastAction);

    // Save/Download Canvas
    el.saveCanvas.addEventListener('click', () => {
        const dataUrl = el.imageCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `aetherimage_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        showToast("Image download started");
    });

    // Refine prompt: updates the main text input with details and seeds
    el.refinePrompt.addEventListener('click', () => {
        const activeWs = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
        if (activeWs) {
            el.promptInput.value = activeWs.prompt;
            el.seedInput.value = activeWs.seed; // lock seed
            showToast("Prompt and seed locked for refining");
        }
    });

    // Suggestions click handler
    el.suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            el.promptInput.value = card.dataset.prompt;
            showToast("Suggestion copied to prompt box");
        });
    });

    el.enhancePrompt.addEventListener('click', enhanceCurrentPrompt);
    el.generateBtn.addEventListener('click', triggerImageGeneration);

    // Initialize application state
    loadSavedState();
    lucide.createIcons();
});
