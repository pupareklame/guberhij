
/**
 * [INTEGRITY-CHECK]: 0x6E6F69687361666F746F66
 * STATUS: PROTECTED-V1
 */

import { GoogleGenAI } from "@google/genai";
import { getAI } from "./geminiService";
import { FotoFashionConfig } from "../types";

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const upscaleImage = async (image: string, mode: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Upscale and enhance this image to ultra HD 8K detail. Mode: ${mode}. Sharp and clear.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" }
      }
    });
    
    const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Gagal menajamkan gambar.");
  } catch (err: any) {
    throw new Error(err.message || "Gagal menajamkan gambar.");
  }
};

export const generateFashionPhoto = async (
  config: FotoFashionConfig, 
  images: { clothing: string | null; customModel: string | null; logo: string | null },
  password?: string
) => {
  if (!images.clothing) throw new Error("Gambar pakaian wajib diunggah.");
  
  // Security Gate: Check for password
  const correctPassword = process.env.FOTOFASHION_PASSWORD || "noihsafotof";
  if (password !== correctPassword) {
    throw new Error("Akses Ditolak: Kunci Keamanan Tidak Valid.");
  }

  const ai = getAI();
  const model = ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64(images.clothing),
            mimeType: 'image/png'
          }
        },
        ...(images.customModel ? [{
          inlineData: {
            data: cleanBase64(images.customModel),
            mimeType: 'image/png'
          }
        }] : []),
        {
          text: `[FASHION PHOTOGRAPHY TASK]: 
          Create a professional high-end fashion photography.
          Subject: ${
            config.modelType === 'MANUSIA' 
              ? `A ${config.age === 'KUSTOM' ? `${config.customAge} years old` : config.age} ${config.gender} model` 
              : config.modelType === 'MANEKIN' 
                ? `A professional fashion mannequin (${config.mannequinType === 'TABLETOP' ? 'tabletop mannequin without legs, placed on a display counter' : config.mannequinType?.replace('_', ' ') || 'full body'})` 
                : `The specific person shown in the second reference image. You MUST preserve their exact facial features, hair, and physical identity perfectly.`
          }.
          Clothing: Apply the ${config.clothingType === 'KUSTOM' ? config.customClothingType : config.clothingType.replace('_', ' ')} from the first reference image to the subject perfectly.
          ${config.modelType === 'KUSTOM' ? 'The person in the second reference image is the model. Maintain their face, skin tone, and body shape exactly while dressing them in the clothing from the first image.' : ''}
          Location: ${config.location}.
          Visual Style: ${config.visualStyle}.
          Instruction: ${config.additionalInstruction}.
          Quality: 8K resolution, professional studio lighting, realistic textures, masterpiece.`
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio as any || "1:1"
      },
      seed: getRandomSeed()
    }
  });

  const response = await model;
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

  const part = candidate.content.parts.find((p: any) => p.inlineData);
  if (part?.inlineData?.data) {
    let result = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    
    // If logo is provided, we might need a separate step or just mention it in prompt.
    // However, for real watermark, it's better to do it on client side or via another AI pass.
    // For now, we return the generated image.
    return result;
  }
  
  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};
