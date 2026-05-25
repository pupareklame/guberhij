
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

export const redesignImage = async (image: string, prompt: string, aspectRatio: string = '1:1') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
        { text: `[REDESIGN TASK]: ${prompt}. Reimagine and redesign the scene while maintaining the core elements. High resolution, professional artistic style.` }
      ] 
    }],
    config: {
      imageConfig: { aspectRatio: aspectRatio as any }
    }
  });
  return extractImageFromResponse(response);
};

export const extractTextOCR = async (image: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
        { text: "Extract all text from this image. Return only the extracted text as a string." }
      ] 
    }],
  });
  return response.text;
};

export const generateTypographyPoster = async (text: string, style: string, aspectRatio: string = '1:1', referenceImage: string | null = null) => {
  const ai = getAI();
  const parts: any[] = [
    { text: `Create a typography poster with the text "${text}". Style: ${style}. Professional design, high resolution.` }
  ];

  if (referenceImage) {
    parts.unshift({ inlineData: { data: cleanBase64(referenceImage), mimeType: 'image/png' } });
    parts[1].text += " Use the provided image as a style or layout reference.";
  }

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
