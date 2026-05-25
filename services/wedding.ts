
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";
import { WeddingConfig } from "../types";

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

export const generateWeddingPhoto = async (config: WeddingConfig, images: { man?: string | null, woman?: string | null, couple?: string | null }) => {
  const ai = getAI();
  const parts: any[] = [];
  
  if (config.mode === 'SINGLE') {
    if (images.man) parts.push({ inlineData: { data: cleanBase64(images.man), mimeType: 'image/png' } });
    if (images.woman) parts.push({ inlineData: { data: cleanBase64(images.woman), mimeType: 'image/png' } });
  } else {
    if (images.couple) parts.push({ inlineData: { data: cleanBase64(images.couple), mimeType: 'image/png' } });
  }

  const prompt = `[WEDDING PHOTO TASK]: Create a professional wedding photograph.
  Mode: ${config.mode === 'SINGLE' ? 'Create a couple from these two individuals' : 'Enhance this couple photo'}.
  [IDENTITY PRESERVATION]: Maintain 100% facial identity, features, and characteristics of the individuals in the provided photos. The generated faces must be extremely similar to the reference photos.
  Camera Style: ${config.camera}.
  Clothing Style: ${config.style}.
  Location: ${config.location}.
  Additional Instructions: ${config.additionalPrompt}.
  [REQUIREMENTS]: High resolution, professional lighting, realistic skin textures, cinematic composition, seamless blending.`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts }],
    config: { 
      imageConfig: { aspectRatio: config.aspectRatio as any || "9:16" },
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
