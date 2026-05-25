
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";
import { EstetikConfig } from "../types";

/**
 * [INTEGRITY-CHECK]: 0x6573746574696B
 * STATUS: PROTECTED-V1
 */

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

export const generateAestheticScene = async (image: string, config: EstetikConfig) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: `[AESTHETIC SCENE TASK]: Place the main object from this image into a highly aesthetic environment. 
          
          CRITICAL INSTRUCTION: 
          1. The main object MUST be the center of attention, captured in a CLOSE-UP or MEDIUM-CLOSE shot. 
          2. The object must be LARGE, CLEAR, and SHARP in the frame. 
          3. Do NOT make the object look small or far away. 
          4. The background and decorations should be subtle and complementary, not overpowering the main object.
          
          Style: ${config.style}. 
          Environment: ${config.environment}. 
          Decoration: ${config.decoration}. 
          Lighting: ${config.lighting}. 
          Additional: ${config.additionalPrompt}.
          
          The result should look like a professional product photography set. Ensure the object blends naturally with the aesthetic background while remaining the dominant element.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const upscaleAestheticImage = async (image: string, aspectRatio: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: `[UPSCALE TASK]: Upscale this image to 4K resolution with maximum detail. 
          Enhance textures, sharpen edges, and remove any artifacts. 
          Maintain the exact composition and colors. 
          The output must be a high-definition, professional-grade version of the original.` }
        ] 
      }],
      config: { 
        imageConfig: { 
          aspectRatio: aspectRatio as any,
          imageSize: '4K'
        },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};
