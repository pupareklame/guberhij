
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI, runWithRetry } from "./geminiService";

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const extractImageFromResponse = (response: GenerateContentResponse) => {
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    const finishReason = candidate?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error("Konten diblokir oleh filter keamanan AI (mungkin mengandung unsur yang tidak diperbolehkan).");
    } else if (finishReason === 'RECITATION') {
      throw new Error("Konten diblokir karena masalah hak cipta (copyright).");
    }
    throw new Error("Server AI sedang sibuk atau menolak permintaan.");
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateAestheticFood = async (image: string, prompt: string, aspectRatio: string = "1:1", tableTexture?: string) => {
  try {
    return await runWithRetry(async (ai) => {
      const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];
      
      if (tableTexture) {
        parts.push({ inlineData: { data: cleanBase64(tableTexture), mimeType: 'image/png' } });
      }

      parts.push({
        text: `[TASK]: AESTHETIC FOOD PHOTOGRAPHY - FULL SCENE COMPOSITION.
        [WORKFLOW]:
        1. OBJECT DETECTION: Identify the food/drink item in the first image.
        2. EXTRACTION: Carefully extract the food/drink and its immediate plate/glass.
        3. FULL CANVAS REPLACEMENT: Place the extracted food item onto a high-end aesthetic table setting that FILLS THE ENTIRE CANVAS.
        4. ${tableTexture ? 'CUSTOM TABLE: Use the texture/vibe from the second image as the table surface for the ENTIRE background area.' : 'PRESET ENVIRONMENT: Create a professional cafe/fine-dining environment that COMPLETELY replaces the original background.'}
        
        [OBJECTIVE]: Create a "Pinterest-worthy" food photo. 100% of the image area must be filled with the new aesthetic scene. No remnants of the original background or empty/black areas allowed.
        [INSTRUCTION]: ${prompt}.
        
        [RULES]: 
        1. NO EMPTY SPACE: The entire aspect ratio area must be filled with a coherent table setting and environment.
        2. PERSPECTIVE: Match the camera angle of the original food item (Top-down or Eye-level).
        3. LIGHTING: Adjust lighting on the food to match the new aesthetic environment.
        4. DECORATION: Add subtle aesthetic elements like utensils, napkins, or soft-focus background props if fitting.
        5. QUALITY: Professional 8K food advertising quality, sharp focus on food, creamy bokeh on background.
        6. ASPECT RATIO: Strictly use ${aspectRatio}.`
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts }],
        config: {
          imageConfig: { aspectRatio: aspectRatio as any },
          seed: Math.floor(Math.random() * 1000000)
        }
      });

      const result = extractImageFromResponse(response);
      if (!result) throw new Error("Gagal menghasilkan gambar makanan estetik.");
      return result;
    });
  } catch (error: any) {
    console.error("Food Aesthetic Error:", error);
    if (error.message?.includes("PERMISSION_DENIED")) {
       throw new Error("Izin Gagal: Silakan gunakan API Key pribadi di Settings.");
    }
    throw error;
  }
};
