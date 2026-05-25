
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
      throw new Error("Gagal mengubah foto. Konten diblokir oleh filter keamanan AI (mungkin mengandung unsur yang tidak diperbolehkan).");
    } else if (finishReason === 'RECITATION') {
      throw new Error("Gagal mengubah foto. Konten diblokir karena masalah hak cipta (copyright).");
    }
    throw new Error("Gagal mengubah foto. Server AI mungkin sedang sibuk atau menolak permintaan.");
  }
  
  const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
  if (imagePart?.inlineData?.data) {
    return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

/**
 * Mengubah foto berdasarkan instruksi teks (Magic Edit).
 */
export const transformImage = async (
  sourceImage: string, 
  prompt: string,
  aspectRatio: string = "9:16"
) => {
  try {
    const ai = getAI();
    
    const parts: any[] = [
      { 
        inlineData: { 
          data: cleanBase64(sourceImage), 
          mimeType: 'image/png' 
        } 
      },
      {
        text: `[MAGIC IMAGE EDIT TASK]:
        1. ANALYZE: Identify the subjects, background, and style of the uploaded image.
        2. INSTRUCTION: Apply the following transformation: "${prompt}".
        3. PRESERVATION: Keep the core identity of the main subject unless the instruction explicitly asks to change it.
        4. REALISM: The result MUST look photorealistic and seamless. No obvious AI artifacts or messy edges.
        5. LIGHTING: Ensure the lighting of the new elements matches the original scene perfectly.
        6. STYLE: Maintain the original photography style (e.g., depth of field, color grading) unless asked otherwise.
        7. QUALITY: Ultra detailed, high resolution, professional photography quality, 8k resolution.
        8. OUTPUT: High resolution ${aspectRatio} image, masterpiece quality.`
      }
    ];

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
    console.error("Transform Service Error:", err);
    throw new Error(err?.message || "Gagal memproses foto. Silakan coba lagi.");
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = '1:1') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ 
      parts: [
        { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
        { text: `Upscale this image to high resolution. Maintain the aspect ratio of ${aspectRatio}. Return only the upscaled image.` }
      ] 
    }],
  });
  return extractImageFromResponse(response);
};
