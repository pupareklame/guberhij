
import { GoogleGenAI } from "@google/genai";
import { getAI } from "./geminiService";

export type HijabOption = 'LANTAI' | 'MANEKIN' | 'FLAT_LAY' | 'HANGER' | 'TABLE_TOP';

const OPTION_PROMPTS: Record<HijabOption, string> = {
  LANTAI: "placed aesthetically on a clean, modern floor with soft natural lighting and subtle shadows.",
  MANEKIN: "worn by a professional female mannequin, showing the drape and fit clearly.",
  FLAT_LAY: "arranged in a professional flat lay composition with complementary accessories.",
  HANGER: "hanging neatly on a high-quality wooden hanger against a neutral background.",
  TABLE_TOP: "folded elegantly on a minimalist wooden table top."
};

export const extractHijab = async (
  image: string,
  option: HijabOption,
  additionalPrompt: string = "",
  aspectRatio: string = "3:4"
): Promise<string> => {
  const ai = getAI();
  const model = "gemini-2.5-flash-image";

  const prompt = `
    Extract the hijab from the provided image. 
    The resulting image should show ONLY the hijab ${OPTION_PROMPTS[option]}.
    Ensure the texture, color, and pattern of the original hijab are perfectly preserved.
    The background should be clean and professional.
    ${additionalPrompt}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: image.split(',')[1], mimeType: "image/png" } },
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any
      }
    }
  });

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

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};

export const upscaleImage = async (image: string, aspectRatio: string = "3:4") => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [
        { inlineData: { data: image.split(',')[1], mimeType: 'image/png' } }, 
        { text: `Upscale and enhance this image to ultra HD 8K detail. Sharp and clear.` }
      ] 
    }],
    config: { 
      imageConfig: { aspectRatio: aspectRatio as any }
    }
  });

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

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};
