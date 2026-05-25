
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";

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

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const processBerpola = async (
  image: string, 
  reference: string | null, 
  instruction: string, 
  aspectRatio: string = "9:16"
) => {
  const ai = getAI();
  const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];
  if (reference) parts.push({ inlineData: { data: cleanBase64(reference), mimeType: 'image/png' } });
  
  parts.push({ 
    text: `[BERPOLA 3-IN-1 TASK]: 
    1. CLEANING: Remove any UI elements, overlays, or distracting text from the source image.
    2. IDENTITY LOCK: Maintain 100% facial and physical identity of the person.
    3. TRANSFORMATION: ${instruction}.
    4. QUALITY: Professional 8K advertising quality.
    5. ASPECT RATIO: Use ${aspectRatio}.`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts }],
    config: { 
      imageConfig: { aspectRatio: aspectRatio as any },
      seed: Math.floor(Math.random() * 1000000)
    }
  });

  const result = extractImageFromResponse(response);
  if (!result) throw new Error("Gagal memproses gambar Berpola.");
  return result;
};
