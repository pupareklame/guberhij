
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";
import { CyborgConfig } from "../types";

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const extractImageFromResponse = (response: GenerateContentResponse) => {
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    const finishReason = candidate?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error("Gagal menghasilkan gambar. Konten diblokir oleh filter keamanan AI (mungkin mengandung unsur yang tidak diperbolehkan).");
    } else if (finishReason === 'RECITATION') {
      throw new Error("Gagal menghasilkan gambar. Konten diblokir karena masalah hak cipta (copyright).");
    }
    throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk atau menolak permintaan.");
  }
  
  const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
  if (imagePart?.inlineData?.data) {
    return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const generateCyborg = async (faceImage: string, config: CyborgConfig) => {
  try {
    const ai = getAI();
    const prompt = `[CYBORG TRANSFORMATION TASK]: 
    1. Transform the person in the provided image into a hyper-realistic human-cyborg hybrid.
    2. [BODY COMPOSITION]: The character must be wearing a UNIFORM FULL-BODY high-tech robotic suit that matches the theme. The body should be 100% mechanical/robotic, not split between human and machine.
    3. [HEAD COMPOSITION]: The head should be a sophisticated blend where 40% to 60% of the head area is replaced with intricate mechanical components, while the remaining part is the original human face. This should NOT be a simple vertical split; the mechanical parts should integrate organically into the facial structure (e.g., mechanical eye, jaw, or cranium).
    4. [CATEGORY]: ${config.category} (Ensure age and gender match).
    5. [THEME/PRESET]: ${config.preset}. If the theme is an animal or creature, the robotic parts must reflect those features mechanically (e.g., robotic dinosaur scales, mechanical beast ears).
    6. [IDENTITY PRESERVATION]: CRITICAL - Maintain the exact facial features, structure, and identity of the person in the photo on the human portion of the face. The person must be 100% recognizable.
    7. [VISUAL STYLE]: ${config.visualEffect}. Cinematic lighting, 8K resolution, hyper-detailed textures (metal, skin, wires), glowing internal components, and a seamless transition between organic and synthetic parts.
    8. [ENVIRONMENT]: Futuristic sci-fi setting that complements the theme.
    9. [ADDITIONAL]: ${config.customInstruction || 'None'}.
    10. [SHOT TYPE]: ${config.shotType === 'FULL_BODY' ? 'Full body shot showing the complete uniform robotic suit from head to toe.' : 'Close-up portrait shot focusing on the head and upper chest robotic integration.'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(faceImage), mimeType: 'image/png' } },
          { text: prompt }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Cyborg API Error:", err);
    throw new Error(err.message || "Gagal memproses Cyborg AI.");
  }
};
