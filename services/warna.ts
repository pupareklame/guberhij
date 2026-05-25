
/**
 * [INTEGRITY-CHECK]: 0x7761726e61
 * STATUS: PROTECTED-V1
 */

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

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

/**
 * Merubah warna pakaian pada foto model.
 */
export const transformGarment = async (
  image: string, 
  config: { 
    target: 'TOP' | 'BOTTOM' | 'BOTH', 
    colorName?: string, 
    colorImage?: string, 
    intensity: number,
    aspectRatio?: string
  },
  password?: string
) => {
  // Security Gate: Check for password
  const correctPassword = process.env.WARNA_PASSWORD || "anraw";
  if (password !== correctPassword) {
    throw new Error("Akses Ditolak: Kunci Keamanan Tidak Valid.");
  }

  try {
    const ai = getAI();
    const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];
    let instruction = `[CRITICAL TASK]: Change the ${config.target} garment color. `;
    
    if (config.colorImage) {
      parts.push({ inlineData: { data: cleanBase64(config.colorImage), mimeType: 'image/png' } });
      instruction += `Apply the exact color and pattern from the reference image. `;
    } else if (config.colorName) {
      instruction += `Change it to ${config.colorName}. `;
    }
    
    instruction += "Preserve all original textures, shadows, and folds of the fabric. High quality 8K.";
    parts.push({ text: instruction });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: (config.aspectRatio || "9:16") as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Warna Service Error:", err);
    throw new Error(err?.message || "Gagal mengubah warna pakaian.");
  }
};
