
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";

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

export const generate3DRender = async (params: {
  buildingType: string;
  characterType: string;
  mainText: string;
  subText: string;
  topText: string;
  aspectRatio: string;
  modelId?: string;
}) => {
  try {
    const ai = getAI();
    const modelId = 'gemini-2.5-flash-image';
    
    const prompt = `[Gaya dan Tampilan Umum]:
A high-quality 3D rendered isometric illustration, in a bright, vibrant, and playful "kawaii" or "vinyl toy" style, set against a smooth, solid light blue background with soft shadows.
[Objek Utama]:
 * Bangunan: A stylized, friendly-looking ${params.buildingType} with rounded edges, rendered in light beige or pastel colors with small windows. Add playful details like potted plants or a small sign on top with stylized text '${params.topText}'.
 * Karakter: A cute, big-eyed ${params.characterType} in an orange animal hoodie, sitting happily on top of the letters. It should have rosy cheeks and a happy, open-mouthed expression.
 * Dekorasi Sekitar: Playful, winding abstract shapes or vines with leaves, as if growing from or around the building and letters.
[Teks Utama]:
 * Huruf Besar: Large, bold, 3D bubble letters in a playful, cartoon-like font, standing in a row in the foreground. The letters should be '${params.mainText}' and rendered with a soft, gradient color scheme (e.g., orange, pink, light green, orange).
 * Subteks: A small, 3D subtext below the main letters, '${params.subText}' in smaller, simplified letters on a separate base.
[Komposisi dan Pencahayaan]:
 * Komposisi: An isometric view where all elements are arranged neatly on a layered base structure (e.g., a blue platform with colorful stripes).
 * Pencahayaan: Bright, even studio lighting with soft shadows to give depth and a clean, glossy finish to all objects.
[Kata Kunci Kritis]: 3D render, isometric, bright, vibrant, kawaii, playful, rounded edges, bubble letters, soft gradient.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        imageConfig: { 
          aspectRatio: params.aspectRatio as any,
          imageSize: modelId.includes('3') ? '1K' : undefined
        },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("3D Render Service Error:", err);
    throw new Error(err?.message || "Gagal membuat 3D Render. Silakan coba lagi.");
  }
};

export const upscaleImage = async (image: string, aspectRatio: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          inlineData: {
            data: image.split(',')[1],
            mimeType: 'image/png'
          }
        },
        { text: "Upscale this image to 4K resolution, maintaining all details and style perfectly. Make it sharper and cleaner." }
      ],
      config: {
        imageConfig: { aspectRatio: aspectRatio as any }
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Upscale Error:", err);
    throw new Error("Gagal menajamkan foto.");
  }
};
