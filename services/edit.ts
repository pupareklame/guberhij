
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
      throw new Error("Permintaan ditolak oleh filter keamanan AI. Silakan coba dengan prompt atau gambar lain.");
    }
    if (finishReason === 'RECITATION') {
      throw new Error("Permintaan ditolak karena terdeteksi konten hak cipta. Silakan coba lagi.");
    }
    throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk atau permintaan dibatasi.");
  }
  const part = candidate.content.parts.find((p: any) => p.inlineData);
  if (part?.inlineData?.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

const handleApiError = (err: any) => {
  console.error("API Call Error:", err);
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("429")) {
    throw new Error("API LIMIT: Kecepatan akses terlalu tinggi. Tunggu sebentar.");
  }
  throw new Error(err?.message || "Koneksi terputus. Silakan coba lagi.");
};

export const genericImageEdit = async (image: string, prompt: string, aspectRatio: string = '1:1') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `[EDIT TASK]: ${prompt}. Maintain high quality and realism.` }
        ] 
      }],
      config: {
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const inpaintImage = async (image: string, mask: string, prompt: string, overlayImage?: string | null, aspectRatio: string = '1:1') => {
  try {
    const ai = getAI();
    const parts: any[] = [
      { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
      { inlineData: { data: cleanBase64(mask), mimeType: 'image/png' } }
    ];

    let taskPrompt = `[INPAINT TASK]: The second image is a binary mask where WHITE pixels indicate the area to edit and BLACK is the background. ${prompt}. Seamlessly blend the changes into the original image.`;

    if (overlayImage) {
      parts.push({ inlineData: { data: cleanBase64(overlayImage), mimeType: 'image/png' } });
      taskPrompt = `[INPAINT WITH OBJECT TASK]: The second image is a binary mask (WHITE=edit area, BLACK=background) on the first image. The third image is a custom object. Place the custom object into the area marked by the mask on the first image. ${prompt}. Seamlessly blend and match lighting/perspective.`;
    }

    parts.push({ text: taskPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: {
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const composeImages = async (baseImage: string, overlayImage: string, prompt: string, aspectRatio: string = '1:1') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(baseImage), mimeType: 'image/png' } }, 
          { inlineData: { data: cleanBase64(overlayImage), mimeType: 'image/png' } }, 
          { text: `[COMPOSE TASK]: Compose these two images together. ${prompt}. High resolution, seamless integration.` }
        ] 
      }],
      config: {
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = '1:1') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `[UPSCALE TASK]: Upscale this image to high resolution with extreme detail and clarity. Maintain the aspect ratio of ${aspectRatio}. Enhance textures, edges, and overall sharpness while keeping it realistic. Return only the upscaled image.` }
        ] 
      }],
      config: {
        imageConfig: { 
          aspectRatio: aspectRatio as any
        },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};
