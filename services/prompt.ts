import { Type } from "@google/genai";
import { runWithRetry, cleanBase64, getAI } from "./geminiService";

export interface ImageToPromptParams {
  cameraMotion: string;
  videoStyle: string;
  motionIntensity: string;
  customGuidance: string;
}

export interface VideoPromptResult {
  primarySubject: string;
  colorScheme: string;
  environment: string;
  cinematographicPrompt: string;
  slowMotionCommercialPrompt: string;
  epicDynamicPrompt: string;
  artisticSurrealPrompt: string;
  timeline: Array<{
    timeRange: string;
    description: string;
  }>;
  expertDirectives: {
    cameraSpeed: string;
    focalLength: string;
    lightingStyle: string;
    vfxKeywords: string[];
  };
}

export interface VideoSuggestions {
  cameraMotions: Array<{ id: string; label: string; description: string }>;
  lightingStyles: Array<{ id: string; label: string; description: string }>;
  visualAesthetics: Array<{ id: string; label: string; description: string }>;
  productAnalysis: string; // Indonesian description
  subjectAndEnvBase: string; // English: [Static Subject & Environment]
  elementAction: string; // English: [Element Action/Motion]
}

export const generateImageToVideoPrompt = async (imageBase64: string, params: ImageToPromptParams): Promise<VideoPromptResult> => {
  return runWithRetry(async (ai) => {
    const parts: any[] = [];

    parts.push({
      inlineData: {
        data: cleanBase64(imageBase64),
        mimeType: 'image/png'
      }
    });

    const promptText = `[TASK]: You are an elite AI Video Director and Creative Lead. Your job is to analyze this input image and generate a set of extremely sophisticated, production-grade 5-second video prompts (optimized for Sora, Runway Gen-3, Luma Dream Machine, and Kling). 
    
    [USER CONFIGURATION OVERRIDES]:
    - Mandated Camera Motion Style: ${params.cameraMotion || 'Cinematic Orbit / Pan'}
    - Mandated Aesthetic/Theme: ${params.videoStyle || 'Cinematic / Photorealistic'}
    - Expected Motion Intensity: ${params.motionIntensity || 'Medium'}
    - Additional Custom Style Guidance: ${params.customGuidance || 'No specific instruction.'}

    [PROMPT REQUIREMENTS]:
    1. Write in English.
    2. Focus on physical realism, volumetric details, lighting transitions, fluid dynamics, particles, and exquisite material textures (e.g., leather, crystal, metal reflections).
    3. Describe a clear, continuous 5-second timeline describing camera pans, object motion, and ambient SFX cues.
    4. Provide FOUR highly distinct style prompts:
       - 'cinematographicPrompt': Classic cinematic masterpiece, high-end production filter, smooth crane or orbital movement.
       - 'slowMotionCommercialPrompt': High-speed phantom flex advertisement style with water drops/splashes, shattering elements, luxury lighting.
       - 'epicDynamicPrompt': Intense motion, fast camera push-in/pull-out, explosive visual FX, vibrant accent lighting.
       - 'artisticSurrealPrompt': Abstract or luxury dreamscape. Floating particles, glowing portals, ethereal flow, gravity-defying items.

    Provide the output in valid, structured JSON format conforming to the requested schema.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primarySubject: { type: Type.STRING, description: "Identified focal product or main subject of the picture." },
            colorScheme: { type: Type.STRING, description: "Color palette description." },
            environment: { type: Type.STRING, description: "Detailed scene environment analysis." },
            
            // Prompts
            cinematographicPrompt: { type: Type.STRING, description: "Cinema master prompt of 5 seconds." },
            slowMotionCommercialPrompt: { type: Type.STRING, description: "Creative commercial display prompt of 5 seconds." },
            epicDynamicPrompt: { type: Type.STRING, description: "Epic fast dynamic movement prompt of 5 seconds." },
            artisticSurrealPrompt: { type: Type.STRING, description: "Luxury, dreamy, surreal float prompt of 5 seconds." },

            // Interactive timeline
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeRange: { type: Type.STRING, description: "Time bracket e.g. 0s-1.5s, 1.5s-3.5s, 3.5s-5.0s" },
                  description: { type: Type.STRING, description: "Precise choreography description during this interval." }
                },
                required: ["timeRange", "description"]
              }
            },

            // Expert settings
            expertDirectives: {
              type: Type.OBJECT,
              properties: {
                cameraSpeed: { type: Type.STRING, description: "Recommended speed parameter (e.g., 'Slow orbital (0.2x)', 'Fast push-in')." },
                focalLength: { type: Type.STRING, description: "Best lens selection (e.g., '35mm anamorphic', '85mm macro')." },
                lightingStyle: { type: Type.STRING, description: "Recommended lighting (e.g., 'Volumetric backlit rays', 'Soft diffuse beauty ring')." },
                vfxKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 or 4 high-value tags to insert as trailing tags." }
              },
              required: ["cameraSpeed", "focalLength", "lightingStyle", "vfxKeywords"]
            }
          },
          required: [
            "primarySubject", "colorScheme", "environment", 
            "cinematographicPrompt", "slowMotionCommercialPrompt", "epicDynamicPrompt", "artisticSurrealPrompt",
            "timeline", "expertDirectives"
          ]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  });
};

export const analyzeImageForVideoSuggestions = async (imageBase64: string): Promise<VideoSuggestions> => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{
        parts: [
          { inlineData: { data: cleanBase64(imageBase64), mimeType: 'image/png' } },
          { text: `Analyze this image and break it down into modular components for a video generation prompt.
          
1. A brief (1 sentence) analysis of the visual in Indonesian.
2. The core "Static Subject & Environment" block in English (e.g. "The rain continues to fall heavily on the green field. A low angle shot focuses on the black school shoes and red shorts.").
3. The "Element Action/Motion" block in English describing what moves in the environment (e.g. "Water splashes dynamically around the shoes.").
4. Provide 4 options for Camera Movement. The description must be in English (e.g. "A slow camera pan upwards").
5. Provide 4 options for Video Lighting Style. The description must be in English.
6. Provide 4 options for Cinematic Style/Speed (Aesthetics). The description must be in English (e.g. "capturing the heavy downpour in slow motion.").

Return valid JSON matching the schema.` }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productAnalysis: { type: Type.STRING, description: "Analisis singkat 1 kalimat dalam Bahasa Indonesia mengenai objek utama atau keseluruhan komposisi gambar." },
            subjectAndEnvBase: { type: Type.STRING, description: "Static Subject & Environment in English (e.g. 'The rain continues to fall heavily on the green field. The focus is on the black school shoes...')" },
            elementAction: { type: Type.STRING, description: "Element Action/Motion in English (e.g. 'Water splashes dynamically around the subject.')" },
            cameraMotions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING, description: "Judul gerakan kamera (In Indonesian, e.g., 'Pan Naik Perlahan')" },
                  description: { type: Type.STRING, description: "Camera movement description in English (e.g., 'A slow camera pan upwards')" }
                },
                required: ["id", "label", "description"]
              }
            },
            lightingStyles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING, description: "Judul gaya pencahayaan (In Indonesian, e.g., 'Pencahayaan Studio Mewah')" },
                  description: { type: Type.STRING, description: "Lighting style in English (e.g., 'high contrast dramatic lighting')" }
                },
                required: ["id", "label", "description"]
              }
            },
            visualAesthetics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING, description: "Judul estetika/tema visual (In Indonesian, e.g., 'Sinematik Gerak Lambat')" },
                  description: { type: Type.STRING, description: "Cinematic style/speed in English (e.g., 'capturing the heavy downpour in slow motion.')" }
                },
                required: ["id", "label", "description"]
              }
            }
          },
          required: ["productAnalysis", "subjectAndEnvBase", "elementAction", "cameraMotions", "lightingStyles", "visualAesthetics"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  });
};
