
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
  
  const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
  if (imagePart?.inlineData?.data) {
    return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};

export const extractClothing = async (image: string, target: 'TOP' | 'BOTTOM' | 'FULL', aspectRatio: string = '1:1', view: 'FRONT' | 'BACK' = 'FRONT') => {
  const ai = getAI();
  const targetDesc = target === 'FULL' ? 'full-body garment (like a dress, gamis, or robe)' : target === 'TOP' ? 'top garment' : 'bottom garment';
  const viewDesc = view === 'BACK' ? 'the BACK VIEW of' : '';
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
        { text: `[EXTRACT TASK]: Extract ${viewDesc} the ${targetDesc} and display it on a pure white background. Remove the person. High resolution, 8k, professional product photography.` }
      ] 
    }],
    config: { 
      imageConfig: { aspectRatio: aspectRatio as any }
    }
  });
  return extractImageFromResponse(response);
};

export const upscaleImage = async (image: string, aspectRatio: string = '1:1') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
        { text: `Upscale this image to high resolution. Maintain the aspect ratio of ${aspectRatio}. Return only the upscaled image.` }
      ] 
    }],
  });
  return extractImageFromResponse(response);
};
