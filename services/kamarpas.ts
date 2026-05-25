
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

export const applyGarment = async (model: string, garment: string, target: string, instruction: string = '', aspectRatio: string = "9:16") => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(model), mimeType: 'image/png' } },
        { inlineData: { data: cleanBase64(garment), mimeType: 'image/png' } },
        { text: `[FITTING TASK]: Apply the garment from the reference to the person. Target area: ${target}. ${instruction}. High resolution, realistic blending.` }
      ] 
    }],
    config: { 
      imageConfig: { aspectRatio: aspectRatio as any }
    }
  });
  return extractImageFromResponse(response);
};

export const applyMultiGarments = async (model: string, shirt: string | null, pants: string | null, instruction: string, aspectRatio: string = "9:16") => {
  const ai = getAI();
  const parts: any[] = [{ inlineData: { data: cleanBase64(model), mimeType: 'image/png' } }];
  if (shirt) parts.push({ inlineData: { data: cleanBase64(shirt), mimeType: 'image/png' } });
  if (pants) parts.push({ inlineData: { data: cleanBase64(pants), mimeType: 'image/png' } });
  parts.push({ text: `[WARDROBE TASK]: ${instruction}. Fit the items realistically to the body. High resolution, 8k detail.` });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts }],
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
