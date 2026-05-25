
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

export const restorePhoto = async (image: string, mode: string, instruction: string, aspectRatio: string = "9:16") => {
  const ai = getAI();
  const prompt = `[ULTIMATE RESTORATION TASK]: 
  1. Perform a high-end digital restoration of this photo. 
  2. Sharpen all facial features (eyes, lips, nose) to ultra-HD 8K clarity.
  3. Remove all blur, noise, scratches, and artifacts.
  4. Enhance skin texture to be realistic and smooth with professional studio lighting.
  5. ${mode === 'FULL' ? 'Apply vibrant, rich, and realistic colors. Enhance the saturation and contrast of the clothing and background.' : 'Maintain a high-contrast, sharp, and clean black and white aesthetic.'}
  6. Reconstruct missing details with masterpiece quality. 
  7. Final output must look like a professional high-resolution studio portrait.
  ${instruction}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
        { text: prompt }
      ] 
    }],
    config: { 
      imageConfig: { aspectRatio: aspectRatio as any },
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
