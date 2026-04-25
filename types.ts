
export interface SEOPackage {
  trackTitle: string;
  description: string;
  hashtags: string[];
  keywords: string[];
  thumbnailPrompt: string;
  originalArtists?: string;
}

export interface VisualStrategy {
  name: string;
  prompt: string;
  trigger: string;
  colorPalette: string[];
  ctrEstimation: string;
  psychologicalHook: string;
  abSimulation: string;
  suggestedColorAdjustment?: ColorAdjustment; // New: AI suggested color adjustment
}

export interface VisualVariant extends VisualStrategy {
  url: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export type TextPreset = 'elegant' | 'impact' | 'minimal' | 'cinematic';
export type EasingType = 'circ' | 'quint' | 'linear';
export type ImageResolution = '1K' | '2K' | '4K';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:5'; // New: Video aspect ratios
export type FontFamily = 'Playfair Display' | 'Inter' | 'Bebas Neue' | 'Oswald'; // New: Font options
export type TextAlignment = 'left' | 'center' | 'right'; // New: Text alignment

export interface ColorAdjustment {
  hueRotate: number; // in degrees
  saturation: number; // percentage 0-200
  brightness: number; // percentage 0-200
  contrast: number; // percentage 0-200
}

export interface TextConfig {
  titleY: number;
  titleSize: number;
  titleTracking: number;
  subY: number;
  subSize: number;
  subTracking: number;
  preset: TextPreset;
  titleColor: string;
  subColor: string;
  glowIntensity: number;
  shadowIntensity: number;
  // Animation Controls
  titleDuration: number;
  titleDelay: number;
  titleEasing: EasingType;
  subDuration: number;
  subDelay: number;
  subEasing: EasingType;
  // New Text Editing Controls
  titleFontFamily: FontFamily;
  subFontFamily: FontFamily;
  titleAlignment: TextAlignment;
  subAlignment: TextAlignment;
  titleStrokeColor: string;
  titleStrokeWidth: number;
  subStrokeColor: string;
  subStrokeWidth: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface AppState {
  rawInput: string;
  parsedData: SEOPackage | null;
  audioFile: File | null;
  audioUrl: string | null;
  inspirationImageUrl: string | null;
  inspirationAnalysis: string | null;
  variants: VisualVariant[];
  overlayTitle: string;
  overlaySubtitle: string;
  textConfig: TextConfig;
  ttsAudioUrl: string | null;
  isParsing: boolean;
  isGenerating: boolean;
  isExporting: boolean;
  isAnalyzingInspiration: boolean;
  isGeneratingTTS: boolean;
  exportProgress: number;
  exportedVideoUrl: string | null;
  error: string | null;
  generationProgress: string;
  searchSources: GroundingSource[];
  // Intelligence Features
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  isLiveActive: boolean;
  liveTranscription: string;
  imageResolution: ImageResolution;
  useProImage: boolean;
  hasApiKey: boolean;
  isDevMode: boolean;
  // New: Image/Video Manipulation
  isEditingImage: boolean;
  isVideoAnalyzing: boolean;
  videoAnalysisResult: string | null;
  // New: Pro Iconic-Click and Video Formats
  isProStorylineMode: boolean; // New: Toggle for storyline generation
  selectedOutputAspectRatio: VideoAspectRatio; // New: For video size variations
  currentVisualEnhancements: ColorAdjustment; // New: For dynamic visual enhancements
}

export enum Step {
  INPUT = 'INPUT',
  PREVIEW = 'PREVIEW',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE'
}
