
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";
import { KidsModelConfig } from "../types";

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

export const generateKidsModel = async (face: string, config: KidsModelConfig, aspectRatio: string = '9:16') => {
  const ai = getAI();
  const seed = Math.floor(Math.random() * 1000000);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(face), mimeType: 'image/png' } },
        { text: `[KIDS MODEL TASK]: Create a full model character using this face identity. 
        [DETAILS]: Age: ${config.age}. Gender: ${config.gender}. Shirt: ${config.shirtColor}. Pants: ${config.pantsColor}. Pose: ${config.pose}. Shot: ${config.shotType}. Skin radiant: ${config.skinRadiant}%. Face enhance: ${config.faceEnhance}%. 
        [STYLE]: High resolution, professional studio lighting, realistic textures, maintain face identity.` }
      ] 
    }],
    config: { 
      imageConfig: { aspectRatio: aspectRatio as any },
      seed: seed
    }
  });
  return extractImageFromResponse(response);
};

export const upscaleImage = async (image: string, aspectRatio: string = '1:1') => {
  const ai = getAI();
  const seed = Math.floor(Math.random() * 1000000);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
        { text: `Upscale this image to high resolution. Maintain the aspect ratio of ${aspectRatio}. Return only the upscaled image.` }
      ] 
    }],
    config: {
      seed: seed
    }
  });
  return extractImageFromResponse(response);
};
