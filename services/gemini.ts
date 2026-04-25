import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { SEOPackage, VisualVariant, GroundingSource, VisualStrategy, ImageResolution, VideoAspectRatio, ColorAdjustment } from "../types";

const STUDIO_PROMPT_PREFIX = "Studio-grade, high-end commercial photography, 8k resolution, cinematic lighting, professional color grading, sharp focus, octane render. NO TEXT OR LOGOS IN IMAGE. Subject: ";

let isDevMode = false;
export const setDevMode = (val: boolean) => { isDevMode = val; };

export const analyzeAudioToSEO = async (base64Audio: string, mimeType: string): Promise<SEOPackage> => {
  if (isDevMode) {
    return {
      trackTitle: "NEURAL ECHOES",
      description: "A cinematic synthwave journey through a neon-lit cybernetic landscape.",
      hashtags: ["#cyberpunk", "#synthwave", "#evolution"],
      keywords: ["futuristic", "cinematic", "dynamic"],
      thumbnailPrompt: "A high-tech cyberpunk cityscape with violet and teal neon lights, ultra-detailed glass reflections."
    };
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    contents: [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio.split(',')[1] || base64Audio
        }
      },
      { text: "Analyze this audio track. Acting as a world-class music marketer, generate a complete SEO Package including a catchy track title, professional description, relevant hashtags, keywords for discovery, and a detailed 'thumbnailPrompt' that describes a cinematic visual style matching the mood of this music." }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trackTitle: { type: Type.STRING },
          description: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          thumbnailPrompt: { type: Type.STRING }
        },
        required: ["trackTitle", "description", "hashtags", "keywords", "thumbnailPrompt"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const parseSEOPackage = async (rawText: string): Promise<SEOPackage> => {
  if (isDevMode) {
    return {
      trackTitle: "MANUAL OVERRIDE",
      description: "Custom manifest data parsed via developer mock system.",
      hashtags: ["#dev", "#testing"],
      keywords: ["custom", "manual"],
      thumbnailPrompt: "Abstract geometric patterns with golden ratio composition."
    };
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse this SEO package for a high-end music production. Extract core metadata.
    TEXT: ${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trackTitle: { type: Type.STRING },
          description: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          thumbnailPrompt: { type: Type.STRING },
          originalArtists: { type: Type.STRING }
        },
        required: ["trackTitle", "description", "hashtags", "keywords", "thumbnailPrompt"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const editVisualWithPrompt = async (base64Image: string, prompt: string): Promise<string> => {
  if (isDevMode) return base64Image;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Image edit failed.");
};

export const analyzeVideoContent = async (base64Video: string, prompt: string): Promise<string> => {
  if (isDevMode) return "Developer Mode: Simulated video analysis. The video shows high-energy rhythmic patterns and bold color shifts.";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      { inlineData: { data: base64Video.split(',')[1], mimeType: 'video/mp4' } },
      { text: prompt }
    ],
    config: { thinkingConfig: { thinkingBudget: 32768 } }
  });
  return response.text || "No analysis generated.";
};

export const analyzeInspirationImage = async (base64Image: string): Promise<string> => {
  if (isDevMode) return "Developer Mode: Simulated aesthetic DNA analysis focusing on brutalist lighting and organic textures.";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } },
      { text: "Deconstruct this image's viral potential. Analyze lighting, composition, and psychological emotional triggers. Provide a technical style prompt." }
    ]
  });
  return response.text || "Analysis pending.";
};

export const generateStrategicPrompts = async (
  packageData: SEOPackage, 
  inspirationAnalysis?: string | null,
  isProStorylineMode: boolean = false // New parameter
): Promise<{ strategies: VisualStrategy[], sources: GroundingSource[] }> => {
  if (isDevMode) {
    const baseStrategies: VisualStrategy[] = [
      {
        name: "The Obsidian Pulse",
        prompt: "Deep black background with pulsating violet energy waves, macro shot of liquid glass.",
        trigger: "High contrast evokes mystery and luxury.",
        colorPalette: ["#000000", "#7c3aed", "#1e1b4b"],
        ctrEstimation: "+45% based on visual depth",
        psychologicalHook: "Taps into the subconscious curiosity for the unknown.",
        abSimulation: "Outperforms standard nature shots by 3x in tech demographics.",
        suggestedColorAdjustment: { hueRotate: 0, saturation: 120, brightness: 90, contrast: 130 }
      },
      {
        name: "Vibrant Velocity",
        prompt: "Speed-blurred cityscape with streaks of golden light, anamorphic lens flare.",
        trigger: "Implies energy and forward momentum.",
        colorPalette: ["#fbbf24", "#dc2626", "#0f172a"],
        ctrEstimation: "+32% for energetic listeners",
        psychologicalHook: "Creates a sense of urgency and progress.",
        abSimulation: "Superior retention in short-form content feeds.",
        suggestedColorAdjustment: { hueRotate: 10, saturation: 150, brightness: 110, contrast: 110 }
      }
    ];

    if (isProStorylineMode) {
      return {
        strategies: [
          { ...baseStrategies[0], name: "Storyline: Incubation" },
          { ...baseStrategies[0], name: "Storyline: Emergence", prompt: baseStrategies[0].prompt + " A single, abstract entity forms in the center." },
          { ...baseStrategies[0], name: "Storyline: Expansion", prompt: baseStrategies[0].prompt + " The entity expands, interacting with the energy waves, showing dynamic growth." },
          { ...baseStrategies[0], name: "Storyline: Zenith", prompt: baseStrategies[0].prompt + " The entity reaches its peak, dominating the frame, with intense light interaction." },
        ],
        sources: [{ title: "Mock Market Trend", uri: "https://example.com" }]
      };
    }
    
    return { strategies: baseStrategies, sources: [{ title: "Mock Market Trend", uri: "https://example.com" }] };
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const basePrompt = `Acting as the world-class IconicClick SEO Strategist, analyze the track: "${packageData.trackTitle}".
  Use the provided SEO context and search trends to craft visual strategies.
  
  Context: ${packageData.thumbnailPrompt}
  ${inspirationAnalysis ? `Ref Analysis: ${inspirationAnalysis}` : ''}
  
  For each strategy, provide:
  1. 'name': Strategic name (e.g., The Midnight Void)
  2. 'prompt': Detailed visual description for high-end AI generation (no text).
  3. 'trigger': The specific psychological reason this works for CTR.
  4. 'colorPalette': Hex codes for key colors.
  5. 'ctrEstimation': Predicted CTR boost reason.
  6. 'psychologicalHook': Deep analysis of the viewer's subconscious reaction.
  7. 'abSimulation': A data-driven comparison of how this variant performs against standard industry tropes.
  8. 'suggestedColorAdjustment': An object with properties 'hueRotate' (0-360), 'saturation' (0-200), 'brightness' (0-200), 'contrast' (0-200) for subtle cinematic grading.`;

  let fullPrompt;
  let schemaItems;

  if (isProStorylineMode) {
    fullPrompt = `${basePrompt}
    Generate 1 initial core concept and then 3 sequential visual concepts that build a compelling, cinematic storyline or narrative arc from the first concept for the track "${packageData.trackTitle}". The sequence should represent progression, transformation, or a narrative journey, always adhering to the high-end studio photography style. Provide 4 strategies in total, clearly distinct but narratively connected.`;
    schemaItems = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          prompt: { type: Type.STRING },
          trigger: { type: Type.STRING },
          colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
          ctrEstimation: { type: Type.STRING },
          psychologicalHook: { type: Type.STRING },
          abSimulation: { type: Type.STRING },
          suggestedColorAdjustment: {
            type: Type.OBJECT,
            properties: {
              hueRotate: { type: Type.NUMBER },
              saturation: { type: Type.NUMBER },
              brightness: { type: Type.NUMBER },
              // Fix: Changed 'Type:NUMBER' to 'Type.NUMBER'
              contrast: { type: Type.NUMBER }
            },
            required: ["hueRotate", "saturation", "brightness", "contrast"]
          }
        },
        required: ["name", "prompt", "trigger", "colorPalette", "ctrEstimation", "psychologicalHook", "abSimulation", "suggestedColorAdjustment"]
      }
    };
  } else {
    fullPrompt = `${basePrompt}
    Generate 3 distinct, high-CTR studio-grade visual strategies.`;
    schemaItems = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          prompt: { type: Type.STRING },
          trigger: { type: Type.STRING },
          colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
          ctrEstimation: { type: Type.STRING },
          psychologicalHook: { type: Type.STRING },
          abSimulation: { type: Type.STRING },
          suggestedColorAdjustment: {
            type: Type.OBJECT,
            properties: {
              hueRotate: { type: Type.NUMBER },
              saturation: { type: Type.NUMBER },
              brightness: { type: Type.NUMBER },
              contrast: { type: Type.NUMBER }
            },
            required: ["hueRotate", "saturation", "brightness", "contrast"]
          }
        },
        required: ["name", "prompt", "trigger", "colorPalette", "ctrEstimation", "psychologicalHook", "abSimulation", "suggestedColorAdjustment"]
      }
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: fullPrompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: schemaItems
    }
  });

  const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter(chunk => chunk.web)
    ?.map(chunk => ({
      title: chunk.web.title || "Market Trend Source",
      uri: chunk.web.uri
    })) || [];

  return { strategies: JSON.parse(response.text), sources };
};

export const generateSingleVisual = async (prompt: string, usePro: boolean = false, resolution: ImageResolution = '1K', aspectRatio: VideoAspectRatio = '16:9'): Promise<string> => {
  if (isDevMode) {
    return "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1920&h=1080";
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: STUDIO_PROMPT_PREFIX + prompt }] },
    config: { 
      imageConfig: { 
        aspectRatio: aspectRatio, // Use the selected aspect ratio
        ...(usePro ? { imageSize: resolution } : {})
      },
      ...(usePro ? { tools: [{ google_search: {} }] } : {})
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Synthesis aborted.");
};

export const chatWithDeepStrategy = async (message: string, history: any[]) => {
  if (isDevMode) return { text: "Dev Mode: Deep strategy simulated. I suggest leaning into dark, textured visuals with a focus on gold accents.", sources: [] };
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      tools: [{ googleSearch: {} }]
    }
  });
  return { 
    text: response.text, 
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
  };
};

export const generateTTS = async (text: string): Promise<string> => {
  if (isDevMode) return "";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Dramatic voiceover: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
    },
  });
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) throw new Error("Voice synthesis failed.");
  return `data:audio/pcm;base66,${data}`;
};

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}