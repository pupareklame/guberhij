
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const extractImageFromResponse = (response: GenerateContentResponse) => {
  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk.");
  }
  const part = response.candidates[0].content.parts.find((p: any) => p.inlineData);
  if (part?.inlineData?.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Data visual tidak ditemukan. Coba lagi dalam beberapa saat.");
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
