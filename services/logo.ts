
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

export type LogoStyle = 
  | 'Minimalist' 
  | 'Vintage' 
  | '3D Modern' 
  | 'Abstrak' 
  | 'Mascot' 
  | 'Geometric' 
  | 'Lettermark' 
  | 'Wordmark' 
  | 'Emblem' 
  | 'Watercolor';

const STYLE_KEYWORDS: Record<LogoStyle, string> = {
  'Minimalist': 'Simple, clean, thin lines, wide negative space, flat design, vector.',
  'Vintage': 'Retro, classic, old paper texture, faded/sepia colors, 20th century typography.',
  '3D Modern': 'Futuristic, depth, glossy lighting, metallic/glass material, Octane render.',
  'Abstrak': 'Unique, artistic, non-representational forms, symbolic, modern composition.',
  'Mascot': 'Character, bold outlines, expressive, high contrast colors.',
  'Geometric': 'Precise geometric shapes, symmetrical, mathematical, clean circles/triangles/squares.',
  'Lettermark': 'Brand initials, focus on modification of one or two letters, custom typography.',
  'Wordmark': 'Text focus, full brand name, unique typography without icons, high readability.',
  'Emblem': 'Classic badge, seal, shield, school or sports club badge style, decorative.',
  'Watercolor': 'Watercolor brush strokes, wet paper texture, natural color gradients, manual artistic style.'
};

export interface LogoConfig {
  mode: 'SCRIBBLE' | 'TEXT';
  scribbleImage?: string;
  description: string;
  style: LogoStyle;
  additionalInstructions: string;
  aspectRatio: '1:1' | '4:3' | '16:9';
  count: number;
}

export interface LogoResult {
  image: string;
  description: string;
}

export const generateLogo = async (config: LogoConfig): Promise<LogoResult[]> => {
  const ai = getAI();
  const results: LogoResult[] = [];

  for (let i = 0; i < config.count; i++) {
    const parts: any[] = [];
    
    if (config.mode === 'SCRIBBLE' && config.scribbleImage) {
      parts.push({
        inlineData: {
          data: cleanBase64(config.scribbleImage),
          mimeType: 'image/png'
        }
      });
    }

    const stylePrompt = STYLE_KEYWORDS[config.style];
    const prompt = `
      [LOGO DESIGN TASK]
      Create a professional logo based on the following:
      - Style: ${config.style} (${stylePrompt})
      - Core Description: ${config.description}
      - Additional Details: ${config.additionalInstructions}
      - Variation: ${i + 1} of ${config.count}
      
      Requirements:
      - High resolution, professional quality.
      - If a scribble is provided, use its composition and structure as a primary reference.
      - Ensure the logo is centered and well-composed.
      - Avoid messy or cluttered designs.
      - Make this variation unique from others.
    `;

    parts.push({ text: prompt });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts }],
        config: {
          imageConfig: {
            aspectRatio: config.aspectRatio as any,
          },
          // Use a different seed for each variation to ensure diversity
          seed: Math.floor(Math.random() * 1000000) + i
        }
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        const finishReason = candidate?.finishReason;
        if (finishReason === 'SAFETY') {
          throw new Error("Gagal menghasilkan logo. Konten diblokir oleh filter keamanan AI (mungkin mengandung unsur yang tidak diperbolehkan).");
        } else if (finishReason === 'RECITATION') {
          throw new Error("Gagal menghasilkan logo. Konten diblokir karena masalah hak cipta (copyright).");
        }
        throw new Error("Gagal menghasilkan logo. Server AI mungkin sedang sibuk atau menolak permintaan.");
      }

      let imageBase64 = '';
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageBase64) {
        // Generate a visual description for the logo
        const descResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { parts: [{ inlineData: { data: cleanBase64(imageBase64), mimeType: 'image/png' } }, { text: "Provide a deep visual description of this logo design, explaining the design choices based on the requested style: " + config.style }] }
          ]
        });

        results.push({
          image: imageBase64,
          description: descResponse.text || "Professional logo design reflecting the requested style and elements."
        });
      }
    } catch (error) {
      console.error("Error generating logo variation:", error);
      throw error;
    }
  }

  return results;
};
