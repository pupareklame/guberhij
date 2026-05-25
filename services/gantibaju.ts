// @ais-lock: DO NOT MODIFY - FILE IS FINAL
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

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

const handleApiError = (err: any) => {
  console.error("API Call Error:", err);
  const msg = err?.message || "";
  if (msg.includes("429")) {
    throw new Error("API LIMIT: Kecepatan akses terlalu tinggi. Tunggu 30-60 detik sebelum menekan tombol lagi.");
  }
  if (msg.includes("quota")) {
    throw new Error("KUOTA HABIS: Limit harian akun ini telah tercapai. Silakan ganti akun di sidebar.");
  }
  throw new Error(msg || "Koneksi terputus. Silakan klik proses sekali lagi.");
};

export const applyGarment = async (model: string, garment: string, target: string, instruction: string = '', aspectRatio: string = "9:16") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(model), mimeType: 'image/png' } },
          { inlineData: { data: cleanBase64(garment), mimeType: 'image/png' } },
          { text: `[FITTING TASK]: MANDATORY: Replace the person's current clothes with the garment from the reference image. Target area: ${target}. ${instruction}. The new garment must completely replace the old one with perfect fit and realistic textures.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const applyMultiGarments = async (model: string, shirt: string | null, pants: string | null, instruction: string, aspectRatio: string = "9:16") => {
  try {
    const ai = getAI();
    const parts: any[] = [{ inlineData: { data: cleanBase64(model), mimeType: 'image/png' } }];
    if (shirt) parts.push({ inlineData: { data: cleanBase64(shirt), mimeType: 'image/png' } });
    if (pants) parts.push({ inlineData: { data: cleanBase64(pants), mimeType: 'image/png' } });
    parts.push({ text: `[WARDROBE TASK]: MANDATORY: Replace the person's current clothes with these specific items. ${instruction}. Fit the items realistically to the body, ensuring they completely replace the original clothing.` });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const applyPromptGarment = async (model: string, prompt: string, aspectRatio: string = "9:16") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(model), mimeType: 'image/png' } },
          { text: `[PROMPT-BASED FITTING]: MANDATORY: Replace the person's current clothes with the following description: "${prompt}". The new outfit must completely replace the old one with perfect fit and realistic textures. Maintain the person's identity and posture.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = "9:16") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Upscale and enhance this image to ultra HD detail. Sharp and clear.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};
