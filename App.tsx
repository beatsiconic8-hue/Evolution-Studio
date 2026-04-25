import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Step, AppState, VisualVariant, GroundingSource, TextConfig, TextPreset, ImageResolution, EasingType, VideoAspectRatio, FontFamily, TextAlignment, ColorAdjustment } from './types';
import { 
  parseSEOPackage, 
  generateStrategicPrompts, 
  generateSingleVisual, 
  analyzeInspirationImage,
  generateTTS,
  analyzeAudioToSEO,
  chatWithDeepStrategy,
  encodeAudio,
  decodeAudio,
  decodeAudioData,
  setDevMode,
  editVisualWithPrompt,
  analyzeVideoContent
} from './services/gemini';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);
const easeOutCirc = (x: number): number => Math.sqrt(1 - Math.pow(x - 1, 2));
const easeLinear = (x: number): number => x;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const Header: React.FC<{ 
  onOpenKey: () => void; 
  hasKey: boolean; 
  isDev: boolean; 
  onToggleDev: (val: boolean) => void 
}> = ({ onOpenKey, hasKey, isDev, onToggleDev }) => (
  <header className="border-b border-white/10 py-6 px-8 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-md z-50">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <span className="text-white font-bold text-xl italic">Σ</span>
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">Evolution Studio</h1>
        <p className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">IconicClick Neural Strategist v6.0</p>
      </div>
    </div>
    <div className="flex items-center gap-6">
       <div className="flex items-center gap-3 mr-4">
          <span className="text-[10px] font-black uppercase text-zinc-500">Dev Testing</span>
          <button 
            onClick={() => onToggleDev(!isDev)} 
            className={`w-12 h-6 rounded-full transition-all relative ${isDev ? 'bg-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'bg-zinc-800'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDev ? 'left-7' : 'left-1'}`} />
          </button>
       </div>
       <button 
         onClick={onOpenKey} 
         className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${hasKey ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white text-black'}`}
       >
         {hasKey ? 'Production Key Active' : 'Select Production Key'}
       </button>
    </div>
  </header>
);

const CanvasCinematicStage: React.FC<{ 
  imageUrl: string; 
  isPlaying: boolean; 
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  titleText: string;
  subtitleText: string;
  config: TextConfig;
  aspectRatio: VideoAspectRatio;
  colorAdjustments: ColorAdjustment; // New: for visual enhancements
}> = ({ imageUrl, isPlaying, canvasRef, titleText, subtitleText, config, aspectRatio, colorAdjustments }) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => { imageRef.current = img; };
  }, [imageUrl]);

  const getEasing = (p: number, type: EasingType) => {
    if (type === 'circ') return easeOutCirc(p);
    if (type === 'quint') return easeOutQuint(p);
    return easeLinear(p);
  };

  const draw = (time: number) => {
    if (!canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000;

    // Determine canvas dimensions based on aspect ratio
    let w = 1920, h = 1080; // Default to 16:9 for consistent rendering logic
    switch(aspectRatio) {
      case '9:16': h = w / 9 * 16; break;
      case '1:1': h = w; break;
      case '4:5': h = w / 4 * 5; break;
      case '16:9': // Fallthrough
      default: h = w / 16 * 9; // Ensure 16:9 if not explicitly set
    }
    
    // Set actual canvas dimensions for rendering
    if (canvas.width !== w || canvas.height !== h) { 
      canvas.width = w; 
      canvas.height = h; 
    }

    ctx.clearRect(0, 0, w, h);

    // Apply AI-suggested color adjustments globally
    ctx.filter = `hue-rotate(${colorAdjustments.hueRotate}deg) saturate(${colorAdjustments.saturation}%) brightness(${colorAdjustments.brightness}%) contrast(${colorAdjustments.contrast}%)`;

    const camPhase = (elapsed % 60) / 60;
    const scale = 1.05 + Math.sin(camPhase * Math.PI * 2) * 0.08;
    const tx = Math.cos(camPhase * Math.PI * 2 * 0.4) * 40;
    const ty = Math.sin(camPhase * Math.PI * 2 * 0.4) * 20;

    ctx.save();
    ctx.translate(w / 2 + tx, h / 2 + ty);
    ctx.scale(scale, scale);
    ctx.drawImage(imageRef.current, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Reset filter for overlays and text
    ctx.filter = 'none'; 

    const vignette = ctx.createRadialGradient(w/2, h/2, 400, w/2, h/2, h * 0.9);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(0.7, 'rgba(0,0,0,0.3)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    if (titleText || subtitleText) {
      ctx.save();
      
      // Title rendering
      const titleProgress = Math.min(Math.max((elapsed - config.titleDelay) / config.titleDuration, 0), 1);
      const titleAlpha = getEasing(titleProgress, config.titleEasing);

      if (titleText && titleAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = titleAlpha;
        const blur = (1 - titleAlpha) * 50;
        if (blur > 0.5) ctx.filter = `blur(${blur}px)`;
        
        ctx.font = `bold ${config.titleSize}px "${config.titleFontFamily}", serif`;
        ctx.fillStyle = config.titleColor;
        ctx.textAlign = config.titleAlignment;
        
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = config.shadowIntensity;
        ctx.shadowOffsetY = 20;

        if (config.titleStrokeWidth > 0) {
          ctx.strokeStyle = config.titleStrokeColor;
          ctx.lineWidth = config.titleStrokeWidth;
          ctx.strokeText(titleText.toUpperCase(), w / 2, (h * config.titleY) / 100);
        }
        ctx.fillText(titleText.toUpperCase(), w / 2, (h * config.titleY) / 100);
        ctx.restore();
      }

      // Subtitle rendering
      const subProgress = Math.min(Math.max((elapsed - config.subDelay) / config.subDuration, 0), 1);
      const subAlpha = getEasing(subProgress, config.subEasing);

      if (subtitleText && subAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = subAlpha;
        const subBlur = (1 - subAlpha) * 30;
        if (subBlur > 0.5) ctx.filter = `blur(${subBlur}px)`;
        ctx.font = `bold ${config.subSize}px "${config.subFontFamily}", sans-serif`;
        ctx.fillStyle = config.subColor;
        ctx.textAlign = config.subAlignment;
        
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = config.shadowIntensity * 0.7;
        ctx.shadowOffsetY = 12;

        if (config.subStrokeWidth > 0) {
          ctx.strokeStyle = config.subStrokeColor;
          ctx.lineWidth = config.subStrokeWidth;
          ctx.strokeText(subtitleText.toUpperCase(), w / 2, (h * config.subY) / 100);
        }
        ctx.fillText(subtitleText.toUpperCase(), w / 2, (h * config.subY) / 100);
        ctx.restore();
      }
      ctx.restore();
    }
    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    startTimeRef.current = null;
    requestRef.current = requestAnimationFrame(draw);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [imageUrl, titleText, subtitleText, config, aspectRatio, colorAdjustments]);

  return (
    <div className={`relative w-full overflow-hidden bg-black border border-white/10 shadow-4xl group transition-all duration-700
      ${aspectRatio === '16:9' ? 'aspect-video' : ''}
      ${aspectRatio === '9:16' ? 'aspect-[9/16]' : ''}
      ${aspectRatio === '1:1' ? 'aspect-square' : ''}
      ${aspectRatio === '4:5' ? 'aspect-[4/5]' : ''}
    `}>
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      <div className="grain-overlay" />
      <div className="light-leak-overlay" />
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    rawInput: '',
    parsedData: null,
    audioFile: null,
    audioUrl: null,
    inspirationImageUrl: null,
    inspirationAnalysis: null,
    variants: [],
    overlayTitle: '',
    overlaySubtitle: '',
    textConfig: {
      titleY: 45,
      titleSize: 140,
      titleTracking: 15,
      subY: 65,
      subSize: 45,
      subTracking: 20,
      preset: 'elegant',
      titleColor: '#ffffff',
      subColor: 'rgba(255,255,255,0.85)',
      glowIntensity: 0,
      shadowIntensity: 50,
      titleDuration: 3,
      titleDelay: 0.5,
      titleEasing: 'circ',
      subDuration: 2.5,
      subDelay: 1.8,
      subEasing: 'circ',
      // New text controls
      titleFontFamily: 'Playfair Display',
      subFontFamily: 'Inter',
      titleAlignment: 'center',
      subAlignment: 'center',
      titleStrokeColor: '#000000',
      titleStrokeWidth: 0,
      subStrokeColor: '#000000',
      subStrokeWidth: 0,
    },
    ttsAudioUrl: null,
    isParsing: false,
    isGenerating: false,
    isExporting: false,
    isAnalyzingInspiration: false,
    isGeneratingTTS: false,
    exportProgress: 0,
    exportedVideoUrl: null,
    error: null,
    generationProgress: '',
    searchSources: [],
    chatHistory: [],
    isChatLoading: false,
    isLiveActive: false,
    liveTranscription: '',
    imageResolution: '1K',
    useProImage: false,
    hasApiKey: false,
    isDevMode: false,
    isEditingImage: false,
    isVideoAnalyzing: false,
    videoAnalysisResult: null,
    // New features state
    isProStorylineMode: false,
    selectedOutputAspectRatio: '16:9', // Default to cinematic wide
    currentVisualEnhancements: { hueRotate: 0, saturation: 100, brightness: 100, contrast: 100 },
  });

  const [currentStep, setCurrentStep] = useState<Step>(Step.INPUT);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isManualSEO, setIsManualSEO] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveSessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const liveSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextLiveStartTimeRef = useRef(0);

  useEffect(() => {
    const checkKey = async () => {
      const has = await (window as any).aistudio.hasSelectedApiKey();
      setState(prev => ({ ...prev, hasApiKey: has }));
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setState(prev => ({ ...prev, hasApiKey: true }));
  };

  const handleToggleDev = (val: boolean) => {
    setDevMode(val);
    setState(prev => ({ ...prev, isDevMode: val }));
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setState(prev => ({ ...prev, audioFile: file, audioUrl: URL.createObjectURL(file) }));
  };

  const startPipeline = async () => {
    if (!state.audioFile && !state.isDevMode && !isManualSEO) {
      setState(prev => ({ ...prev, error: "Please upload an audio file or enable Dev Mode / Manual SEO." }));
      return;
    }
    setState(prev => ({ ...prev, isParsing: true, error: null }));
    try {
      let packageData: any;
      if (isManualSEO && state.rawInput.trim()) {
        packageData = await parseSEOPackage(state.rawInput);
      } else {
        const base64Audio = state.audioFile ? await fileToBase64(state.audioFile) : "";
        packageData = await analyzeAudioToSEO(base64Audio, state.audioFile?.type || "audio/mpeg");
      }
      setState(prev => ({ 
        ...prev, 
        parsedData: packageData, 
        isParsing: false, 
        overlayTitle: packageData.trackTitle, 
        overlaySubtitle: "Neural Visual Master" 
      }));
      setCurrentStep(Step.PREVIEW);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: `Critical Synthesis Error: ${err.message}`, isParsing: false }));
    }
  };

  const handleGenerate = async () => {
    if (!state.parsedData) return;
    if (!state.hasApiKey && !state.isDevMode) {
      setState(prev => ({ ...prev, error: "Please select a production API key to generate assets." }));
      return;
    }

    try {
      setCurrentStep(Step.GENERATING);
      setState(prev => ({ ...prev, isGenerating: true, error: null }));
      setState(prev => ({ ...prev, generationProgress: 'Consulting Global Attention Markets...' }));
      const { strategies, sources } = await generateStrategicPrompts(state.parsedData, state.inspirationAnalysis, state.isProStorylineMode);
      const variants: VisualVariant[] = [];
      for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        setState(prev => ({ ...prev, generationProgress: `Synthesizing Neural Asset: ${strategy.name}...` }));
        const url = await generateSingleVisual(strategy.prompt, state.useProImage, state.imageResolution, state.selectedOutputAspectRatio);
        variants.push({ ...strategy, url });
      }
      setState(prev => ({ 
        ...prev, 
        variants, 
        searchSources: sources, 
        isGenerating: false,
        currentVisualEnhancements: strategies[0]?.suggestedColorAdjustment || { hueRotate: 0, saturation: 100, brightness: 100, contrast: 100 }
      }));
      setCurrentStep(Step.COMPLETE);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isGenerating: false }));
      setCurrentStep(Step.PREVIEW);
    }
  };

  const handleImageEdit = async () => {
    if (!editPrompt.trim() || !state.variants[selectedVariant]) {
      setState(prev => ({ ...prev, error: "Please enter an edit prompt and select a visual variant." }));
      return;
    }
    if (!state.hasApiKey && !state.isDevMode) {
      setState(prev => ({ ...prev, error: "Please select a production API key to edit images." }));
      return;
    }
    setState(prev => ({ ...prev, isEditingImage: true, error: null }));
    try {
      const currentUrl = state.variants[selectedVariant].url;
      const editedUrl = await editVisualWithPrompt(currentUrl, editPrompt);
      const newVariants = [...state.variants];
      newVariants[selectedVariant] = { ...newVariants[selectedVariant], url: editedUrl };
      setState(prev => ({ ...prev, variants: newVariants, isEditingImage: false }));
      setEditPrompt('');
    } catch (err: any) {
      setState(prev => ({ ...prev, error: `Image Morph failure: ${err.message}`, isEditingImage: false }));
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!state.hasApiKey && !state.isDevMode) {
      setState(prev => ({ ...prev, error: "Please select a production API key to analyze videos." }));
      return;
    }
    setState(prev => ({ ...prev, isVideoAnalyzing: true, videoAnalysisResult: null, error: null }));
    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeVideoContent(base64, "Analyze this video for its primary color story, emotional arc, and visual pacing. Provide a detailed studio report.");
      setState(prev => ({ ...prev, isVideoAnalyzing: false, videoAnalysisResult: result }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: `Video Lab error: ${err.message}`, isVideoAnalyzing: false }));
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    if (!state.hasApiKey && !state.isDevMode) {
      setState(prev => ({ ...prev, error: "Please select a production API key to use the neural advisor." }));
      return;
    }
    const userMsg = chatInput;
    setChatInput('');
    setState(prev => ({ 
      ...prev, 
      isChatLoading: true, 
      chatHistory: [...prev.chatHistory, { role: 'user', text: userMsg }] 
    }));
    try {
      const historyForApi = state.chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const { text, sources } = await chatWithDeepStrategy(userMsg, historyForApi);
      const modelResponse: any = { role: 'model', text: text || 'Strategy mapping complete.' };
      if (sources && sources.length > 0) {
        modelResponse.text += `\n\n**Sources:**\n${sources.map((s: GroundingSource) => `- [${s.title}](${s.uri})`).join('\n')}`;
      }
      setState(prev => ({ 
        ...prev, 
        isChatLoading: false, 
        chatHistory: [...prev.chatHistory, modelResponse] 
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isChatLoading: false, error: `Neural Advisor failure: ${err.message}` }));
    }
  };

  const toggleLiveAPI = async () => {
    if (state.isLiveActive) {
      liveSessionRef.current?.close();
      setState(prev => ({ ...prev, isLiveActive: false, liveTranscription: '' }));
      if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
      if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
      return;
    }
    if (!state.hasApiKey && !state.isDevMode) {
      setState(prev => ({ ...prev, error: "Please select a production API key to enter the voice lab." }));
      return;
    }

    if (state.isDevMode) {
      setState(prev => ({ ...prev, isLiveActive: true, liveTranscription: "Dev Mode Active: Simulated Voice Strategist." }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null); // Ref for scriptProcessorNode

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setState(prev => ({ ...prev, isLiveActive: true, liveTranscription: 'Strategic frequency linked. Speak to define your vision...' }));
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorNodeRef.current = scriptProcessor; // Store reference

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`, **do not** add other condition checks.
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setState(prev => ({ ...prev, liveTranscription: prev.liveTranscription + msg.serverContent!.outputTranscription!.text }));
            }
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputAudioCtxRef.current!;
              nextLiveStartTimeRef.current = Math.max(nextLiveStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeAudio(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextLiveStartTimeRef.current);
              nextLiveStartTimeRef.current += buffer.duration;
              liveSourcesRef.current.add(source);
              source.onended = () => liveSourcesRef.current.delete(source);
            }
            if (msg.serverContent?.interrupted) {
              liveSourcesRef.current.forEach(s => s.stop());
              liveSourcesRef.current.clear();
            }
          },
          onclose: () => {
            setState(prev => ({ ...prev, isLiveActive: false, liveTranscription: '' }));
            if (scriptProcessorNodeRef.current) scriptProcessorNodeRef.current.disconnect();
            if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
            if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
          },
          onerror: (e) => {
            setState(prev => ({ ...prev, error: `Live API error: ${e}`, isLiveActive: false, liveTranscription: '' }));
            if (scriptProcessorNodeRef.current) scriptProcessorNodeRef.current.disconnect();
            if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
            if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "Creative strategist session."
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err: any) { setState(prev => ({ ...prev, error: `Voice lab failed: ${err.message}` })); }
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    if (!state.hasApiKey && !state.isDevMode) {
      setState(prev => ({ ...prev, error: "Please select a production API key to render the master video." }));
      return;
    }
    setState(prev => ({ ...prev, isExporting: true, exportProgress: 0, error: null }));
    try {
      const canvas = canvasRef.current;
      const videoStream = canvas.captureStream(30);
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      
      let exportAudioPromise: Promise<void> = Promise.resolve();

      if (state.audioUrl) {
        const exportAudio = new Audio(state.audioUrl);
        exportAudio.crossOrigin = "anonymous";
        const exportSource = audioCtx.createMediaElementSource(exportAudio);
        exportSource.connect(dest);
        exportAudio.currentTime = 0;
        exportAudioPromise = exportAudio.play().catch(e => console.error("Audio playback error:", e)); // Catch audio playback errors
      }

      // Pro Iconic-Click Storyline Export Logic
      const exportDurationPerImage = 5000; // 5 seconds per image for storyline
      const totalStorylineDuration = state.isProStorylineMode ? state.variants.length * exportDurationPerImage : 10000;
      let currentImageIndex = 0;

      await exportAudioPromise; 
      
      const mediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 15000000 };
      const recorder = new MediaRecorder(new MediaStream([...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()]), mediaRecorderOptions);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: 'video/webm' });
        setState(prev => ({ ...prev, exportedVideoUrl: URL.createObjectURL(finalBlob), isExporting: false }));
        audioCtx.close();
      };
      recorder.start();

      // Fix: Initialize exportStartTime within handleExport
      const exportStartTime = performance.now(); 

      const animationLoop = () => {
        if (!recorder.state || recorder.state === 'inactive') return; // Stop if recorder is inactive
        // This is where we would update the `selectedVariant` if we wanted to change the image during recording
        // For now, we capture current selected image or cycle through storyline images if enabled
        if (state.isProStorylineMode) {
          // Fix: Use the locally defined exportStartTime
          const newIndex = Math.floor((performance.now() - exportStartTime) / exportDurationPerImage) % state.variants.length;
          if (newIndex !== currentImageIndex) {
            currentImageIndex = newIndex;
            setSelectedVariant(currentImageIndex); // Update the displayed variant to trigger Canvas re-render
          }
        }
        requestAnimationFrame(animationLoop);
      }
      requestAnimationFrame(animationLoop); // Start the animation loop for storyline transitions

      let elapsed = 0;
      const timer = setInterval(() => {
        elapsed += 100;
        setState(prev => ({ ...prev, exportProgress: (elapsed / totalStorylineDuration) * 100 }));
        if (elapsed >= totalStorylineDuration) { clearInterval(timer); recorder.stop(); }
      }, 100);

    } catch (err: any) { setState(prev => ({ ...prev, error: `Export Failed: ${err.message}`, isExporting: false })); }
  };

  const updateTextConfig = (updates: Partial<TextConfig>) => {
    setState(prev => ({ ...prev, textConfig: { ...prev.textConfig, ...updates } }));
  };

  const updateColorAdjustments = (updates: Partial<ColorAdjustment>) => {
    setState(prev => ({ ...prev, currentVisualEnhancements: { ...prev.currentVisualEnhancements, ...updates } }));
  };

  useEffect(() => {
    // When selectedVariant changes, apply its suggested color adjustments if available
    if (state.variants[selectedVariant]?.suggestedColorAdjustment) {
      setState(prev => ({ ...prev, currentVisualEnhancements: state.variants[selectedVariant].suggestedColorAdjustment! }));
    }
  }, [selectedVariant, state.variants]);


  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white">
      <Header onOpenKey={handleOpenKey} hasKey={state.hasApiKey} isDev={state.isDevMode} onToggleDev={handleToggleDev} />
      <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-16">
        {state.error && <div className="mb-12 p-8 bg-red-950/40 border border-red-500/50 rounded-[2rem] text-red-200">{state.error}</div>}

        {currentStep === Step.INPUT && (
          <div className="space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="text-center space-y-10 mb-24">
              <h2 className="text-[10rem] font-brand italic tracking-tighter opacity-90">Evolution</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-20">
              <div className="md:col-span-7 space-y-12">
                <div className="border-2 border-dashed border-white/5 rounded-[4rem] p-32 bg-zinc-900/10 flex flex-col items-center justify-center relative">
                  <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAudioUpload}/>
                  {state.audioFile ? <p className="text-white text-3xl font-black">{state.audioFile.name}</p> : <p className="text-zinc-700 text-[12px] font-black uppercase tracking-[0.7em]">Drop Master Frequency</p>}
                </div>
                <div className="flex items-center gap-10">
                  <button onClick={() => setIsManualSEO(!isManualSEO)} className={`text-[11px] font-black uppercase tracking-[0.5em] px-10 py-4 rounded-full border transition-all ${isManualSEO ? 'bg-zinc-800 border-white/10 text-white' : 'border-white/5 text-zinc-700'}`}>
                    {isManualSEO ? 'Disable Advanced Manifest' : 'Enable Advanced Override'}
                  </button>
                  <div className="flex-grow h-px bg-white/5" />
                </div>
                {isManualSEO && (
                  <textarea className="w-full h-80 bg-zinc-900/40 border border-white/5 rounded-[3rem] p-12 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-xs leading-loose custom-scroll shadow-inner" placeholder="Inject specific SEO metadata..." value={state.rawInput} onChange={(e) => setState(prev => ({ ...prev, rawInput: e.target.value }))} />
                )}
                <button disabled={(!state.audioFile && !state.isDevMode && !isManualSEO) || state.isParsing} onClick={startPipeline} className="w-full py-14 bg-indigo-600 rounded-[4rem] font-black tracking-widest text-[12px] uppercase disabled:opacity-50">Execute Manifest</button>
              </div>
              <div className="md:col-span-5 space-y-8">
                <div className="glass-card p-12 rounded-[3rem] space-y-6">
                  <span className="text-[10px] font-black uppercase text-indigo-400">Video Intelligence Lab</span>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer" />
                  {state.isVideoAnalyzing && <p className="text-[10px] text-indigo-400 animate-pulse uppercase">Deconstructing Video Timeline...</p>}
                  {state.videoAnalysisResult && <div className="text-[10px] text-zinc-400 leading-relaxed italic border-t border-white/5 pt-4 custom-scroll max-h-40 overflow-y-auto">{state.videoAnalysisResult}</div>}
                </div>
                 <div className="glass-card p-10 rounded-[3rem] space-y-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Synthesis Engine Config</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-zinc-500">Pro-Grade Image Gen</span>
                    <button onClick={() => setState(prev => ({ ...prev, useProImage: !prev.useProImage }))} className={`w-14 h-8 rounded-full transition-all relative ${state.useProImage ? 'bg-indigo-600' : 'bg-zinc-800'}`}>
                       <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${state.useProImage ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  {state.useProImage && (
                    <div className="flex gap-4 mt-4">
                      {(['1K', '2K', '4K'] as ImageResolution[]).map(res => (
                        <button key={res} onClick={() => setState(prev => ({ ...prev, imageResolution: res }))} className={`flex-grow py-3 rounded-xl text-[10px] font-black tracking-widest border transition-all ${state.imageResolution === res ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}>{res}</button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-[12px] font-bold text-zinc-500">Pro Iconic-Click Storyline</span>
                    <button onClick={() => setState(prev => ({ ...prev, isProStorylineMode: !prev.isProStorylineMode }))} className={`w-14 h-8 rounded-full transition-all relative ${state.isProStorylineMode ? 'bg-indigo-600' : 'bg-zinc-800'}`}>
                       <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${state.isProStorylineMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="mt-6">
                    <span className="text-[12px] font-bold text-zinc-500 block mb-2">Output Aspect Ratio</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['16:9', '9:16', '1:1', '4:5'] as VideoAspectRatio[]).map(ratio => (
                        <button key={ratio} onClick={() => setState(prev => ({ ...prev, selectedOutputAspectRatio: ratio }))} className={`py-3 rounded-xl text-[10px] font-black tracking-widest border transition-all ${state.selectedOutputAspectRatio === ratio ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}>{ratio}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === Step.COMPLETE && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              <CanvasCinematicStage 
                imageUrl={state.variants[selectedVariant].url} 
                isPlaying={isPlaying} 
                canvasRef={canvasRef} 
                titleText={state.overlayTitle} 
                subtitleText={state.overlaySubtitle} 
                config={state.textConfig} 
                aspectRatio={state.selectedOutputAspectRatio}
                colorAdjustments={state.currentVisualEnhancements}
              />
              
              <div className="glass-card p-16 rounded-[4rem] space-y-12">
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Precision Neural Editor</span>
                  <button onClick={toggleLiveAPI} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${state.isLiveActive ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-black'}`}>Voice Strategist</button>
                </div>

                {state.isLiveActive && (
                   <div className="p-8 bg-indigo-600/10 rounded-[2.5rem] border border-indigo-500/20 text-indigo-400 italic text-xl animate-in fade-in zoom-in-95">
                     {state.liveTranscription || 'Strategic frequency linked. Speak to define your vision...'}
                   </div>
                 )}

                {/* Text Editing Controls */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                    <div className="space-y-8">
                       <label className="text-[12px] font-black uppercase text-zinc-700">Headline Manifest</label>
                       <input type="text" value={state.overlayTitle} onChange={(e) => setState(prev => ({ ...prev, overlayTitle: e.target.value }))} className="w-full bg-zinc-900/40 border border-white/5 rounded-[2rem] px-10 py-7 text-4xl font-brand italic" />
                       <div className="grid grid-cols-2 gap-4">
                         <select value={state.textConfig.titleFontFamily} onChange={(e) => updateTextConfig({ titleFontFamily: e.target.value as FontFamily })} className="w-full bg-zinc-900/40 border border-white/5 rounded-full px-6 py-3 text-sm">
                           {(['Playfair Display', 'Inter', 'Bebas Neue', 'Oswald'] as FontFamily[]).map(font => <option key={font} value={font}>{font}</option>)}
                         </select>
                         <select value={state.textConfig.titleAlignment} onChange={(e) => updateTextConfig({ titleAlignment: e.target.value as TextAlignment })} className="w-full bg-zinc-900/40 border border-white/5 rounded-full px-6 py-3 text-sm">
                           {(['left', 'center', 'right'] as TextAlignment[]).map(align => <option key={align} value={align}>{align}</option>)}
                         </select>
                       </div>
                       <div className="flex items-center gap-4">
                         <input type="color" value={state.textConfig.titleStrokeColor} onChange={(e) => updateTextConfig({ titleStrokeColor: e.target.value })} className="w-12 h-12 bg-transparent border-none cursor-pointer p-0" />
                         <input type="range" min="0" max="10" step="0.5" value={state.textConfig.titleStrokeWidth} onChange={(e) => updateTextConfig({ titleStrokeWidth: parseFloat(e.target.value) })} className="flex-grow accent-indigo-600" />
                         <span className="text-zinc-500 text-xs">{state.textConfig.titleStrokeWidth.toFixed(1)}px</span>
                       </div>
                    </div>
                    <div className="space-y-8">
                       <label className="text-[12px] font-black uppercase text-zinc-700">Subtitle Echo</label>
                       <input type="text" value={state.overlaySubtitle} onChange={(e) => setState(prev => ({ ...prev, overlaySubtitle: e.target.value }))} className="w-full bg-zinc-900/40 border border-white/5 rounded-[2rem] px-10 py-7 text-xl font-black tracking-[0.5em] uppercase" />
                       <div className="grid grid-cols-2 gap-4">
                         <select value={state.textConfig.subFontFamily} onChange={(e) => updateTextConfig({ subFontFamily: e.target.value as FontFamily })} className="w-full bg-zinc-900/40 border border-white/5 rounded-full px-6 py-3 text-sm">
                           {(['Playfair Display', 'Inter', 'Bebas Neue', 'Oswald'] as FontFamily[]).map(font => <option key={font} value={font}>{font}</option>)}
                         </select>
                         <select value={state.textConfig.subAlignment} onChange={(e) => updateTextConfig({ subAlignment: e.target.value as TextAlignment })} className="w-full bg-zinc-900/40 border border-white/5 rounded-full px-6 py-3 text-sm">
                           {(['left', 'center', 'right'] as TextAlignment[]).map(align => <option key={align} value={align}>{align}</option>)}
                         </select>
                       </div>
                       <div className="flex items-center gap-4">
                         <input type="color" value={state.textConfig.subStrokeColor} onChange={(e) => updateTextConfig({ subStrokeColor: e.target.value })} className="w-12 h-12 bg-transparent border-none cursor-pointer p-0" />
                         <input type="range" min="0" max="10" step="0.5" value={state.textConfig.subStrokeWidth} onChange={(e) => updateTextConfig({ subStrokeWidth: parseFloat(e.target.value) })} className="flex-grow accent-indigo-600" />
                         <span className="text-zinc-500 text-xs">{state.textConfig.subStrokeWidth.toFixed(1)}px</span>
                       </div>
                    </div>
                 </div>

                {/* Animation Precision Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                  <div className="space-y-8 p-8 bg-zinc-900/40 rounded-[2.5rem]">
                    <span className="text-[11px] font-black uppercase text-zinc-700 block mb-4">Title Motion Pipeline</span>
                    <div className="space-y-6">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500"><span>Duration: {state.textConfig.titleDuration.toFixed(1)}s</span></div>
                      <input type="range" min="0.5" max="10" step="0.1" value={state.textConfig.titleDuration} onChange={(e) => updateTextConfig({ titleDuration: parseFloat(e.target.value) })} className="w-full accent-indigo-600" />
                      <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500"><span>Entry Delay: {state.textConfig.titleDelay.toFixed(1)}s</span></div>
                      <input type="range" min="0" max="5" step="0.1" value={state.textConfig.titleDelay} onChange={(e) => updateTextConfig({ titleDelay: parseFloat(e.target.value) })} className="w-full accent-indigo-600" />
                      <div className="flex gap-2 justify-between">
                        {(['circ', 'quint', 'linear'] as EasingType[]).map(e => (
                          <button key={e} onClick={() => updateTextConfig({ titleEasing: e })} className={`flex-grow px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${state.textConfig.titleEasing === e ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-white/5 text-zinc-600 hover:text-white/80'}`}>{e}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8 p-8 bg-zinc-900/40 rounded-[2.5rem]">
                    <span className="text-[11px] font-black uppercase text-zinc-700 block mb-4">Subtitle Echo Pipeline</span>
                    <div className="space-y-6">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500"><span>Duration: {state.textConfig.subDuration.toFixed(1)}s</span></div>
                      <input type="range" min="0.5" max="10" step="0.1" value={state.textConfig.subDuration} onChange={(e) => updateTextConfig({ subDuration: parseFloat(e.target.value) })} className="w-full accent-zinc-500" />
                      <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500"><span>Entry Delay: {state.textConfig.subDelay.toFixed(1)}s</span></div>
                      <input type="range" min="0" max="5" step="0.1" value={state.textConfig.subDelay} onChange={(e) => updateTextConfig({ subDelay: parseFloat(e.target.value) })} className="w-full accent-zinc-500" />
                      <div className="flex gap-2 justify-between">
                        {(['circ', 'quint', 'linear'] as EasingType[]).map(e => (
                          <button key={e} onClick={() => updateTextConfig({ subEasing: e })} className={`flex-grow px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${state.textConfig.subEasing === e ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-white/5 text-zinc-600 hover:text-white/80'}`}>{e}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Visual Enhancements */}
                <div className="space-y-8 p-8 bg-zinc-900/40 rounded-[2.5rem] pt-8 border-t border-white/5">
                  <span className="text-[11px] font-black uppercase text-indigo-400 block mb-4">AI Visual Enhancements</span>
                  <p className="text-zinc-500 text-xs italic mb-6">Suggestions based on neural mood analysis of the selected variant.</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block">Hue Rotate: {state.currentVisualEnhancements.hueRotate}°</label>
                          <input type="range" min="0" max="360" value={state.currentVisualEnhancements.hueRotate} onChange={(e) => updateColorAdjustments({ hueRotate: parseInt(e.target.value) })} className="w-full accent-indigo-600 h-1.5 rounded-full" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block">Saturation: {state.currentVisualEnhancements.saturation}%</label>
                          <input type="range" min="0" max="200" value={state.currentVisualEnhancements.saturation} onChange={(e) => updateColorAdjustments({ saturation: parseInt(e.target.value) })} className="w-full accent-indigo-600 h-1.5 rounded-full" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block">Brightness: {state.currentVisualEnhancements.brightness}%</label>
                          <input type="range" min="0" max="200" value={state.currentVisualEnhancements.brightness} onChange={(e) => updateColorAdjustments({ brightness: parseInt(e.target.value) })} className="w-full accent-indigo-600 h-1.5 rounded-full" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block">Contrast: {state.currentVisualEnhancements.contrast}%</label>
                          <input type="range" min="0" max="200" value={state.currentVisualEnhancements.contrast} onChange={(e) => updateColorAdjustments({ contrast: parseInt(e.target.value) })} className="w-full accent-indigo-600 h-1.5 rounded-full" />
                      </div>
                  </div>
                </div>


                <div className="flex gap-4 items-center pt-4 border-t border-white/5">
                  <input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Neural Image Edit: 'Add a retro glitch filter' or 'Convert to watercolor'..." className="flex-grow bg-zinc-900 border border-white/5 rounded-full px-8 py-4 text-sm" />
                  <button onClick={handleImageEdit} disabled={state.isEditingImage} className="px-10 py-4 bg-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest disabled:opacity-50">{state.isEditingImage ? 'Morphing...' : 'Morph DNA'}</button>
                </div>
                 <div className="pt-4 border-t border-white/5 flex justify-end gap-10">
                   <button onClick={() => { if (audioRef.current) { if (isPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsPlaying(!isPlaying); } }} className={`w-28 h-28 rounded-full flex items-center justify-center shadow-4xl transition-all ${isPlaying ? 'bg-indigo-600 text-white' : 'bg-white text-black'}`}>
                     {isPlaying ? <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-12 h-12 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                   </button>
                   <button onClick={handleExport} disabled={state.isExporting} className="h-28 px-20 bg-indigo-600 rounded-full text-white font-black text-[14px] uppercase tracking-[0.8em] disabled:opacity-50">
                     {state.isExporting ? `RENDERING ${Math.round(state.exportProgress)}%` : 'RENDER MASTER'}
                   </button>
                 </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-12">
              <div className="glass-card p-10 rounded-[3rem] h-[600px] flex flex-col">
                <span className="text-[10px] font-black uppercase text-indigo-400 border-b border-white/5 pb-4 mb-4">Strategic Advisor</span>
                <div className="flex-grow overflow-y-auto space-y-6 custom-scroll pr-2">
                  {state.chatHistory.map((m, i) => (
                    <div key={i} className={`flex flex-col gap-4 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl text-xs ${m.role === 'user' ? 'bg-indigo-600/10 text-indigo-400 ml-6' : 'bg-zinc-900 text-zinc-400 mr-6'}`}>
                        {m.text.split('\n').map((line, idx) => {
                          // Basic markdown for links from sources
                          if (line.startsWith('- [')) {
                            const match = line.match(/- \[(.*?)\]\((.*?)\)/);
                            if (match) {
                              return <a key={idx} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{match[1]}</a>;
                            }
                          }
                          return <p key={idx}>{line}</p>;
                        })}
                      </div>
                    </div>
                  ))}
                  {state.isChatLoading && <div className="text-[9px] font-black text-indigo-400 animate-pulse">Deep Reasoning Active...</div>}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChat()} className="flex-grow bg-zinc-900 border border-white/5 rounded-full px-6 py-3 text-xs" placeholder="Deep Strategy Q&A..." />
                  <button onClick={handleChat} className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center disabled:opacity-50"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
                </div>
              </div>
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase text-zinc-600 block mb-4">Neural Asset Library {state.isProStorylineMode && "(Storyline Sequence)"}</span>
                {state.variants.map((v, i) => (
                  <button key={i} onClick={() => setSelectedVariant(i)} className={`w-full p-4 rounded-3xl border transition-all ${selectedVariant === i ? 'border-indigo-600 bg-indigo-600/5' : 'border-white/5 hover:border-white/10'}`}>
                    <div className="flex gap-4 p-4 items-center">
                      <div className="w-24 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800"><img src={v.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={v.name} /></div>
                      <div className="flex-grow space-y-1">
                        {state.isProStorylineMode && <p className="text-[8px] font-black uppercase text-indigo-400">Part {i + 1}/{state.variants.length}</p>}
                        <h4 className="font-bold text-white text-[10px] uppercase tracking-widest">{v.name}</h4>
                        <p className="text-zinc-500 text-[10px] line-clamp-1 italic">{v.trigger}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      {state.audioUrl && <audio ref={audioRef} src={state.audioUrl} className="hidden" crossOrigin="anonymous" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />}
      <footer className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-[1em]">Evolution Studio | Santiago Green x IconicClick</footer>
    </div>
  );
};

export default App;