
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const upscaleImage = async (image: string, aspectRatio: string = "1:1") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `[IMAGE ENHANCEMENT TASK]:
            1. UPSCALE: Increase resolution to high-definition (1K).
            2. SHARPEN: Identify and fix any blurred areas, especially around the face, eyes, and clothing textures.
            3. DETAIL: Enhance fine details like skin texture, fabric weaves, and hair strands.
            4. IDENTITY: Maintain 100% of the original person's identity and features.
            5. OUTPUT: Return only the enhanced and sharpened image.` 
          }
        ] 
      }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });
    const result = extractImageFromResponse(response);
    if (!result) throw new Error("Gagal meningkatkan kualitas gambar.");
    return result;
  } catch (err: any) {
    throw new Error(err.message || "Gagal meningkatkan kualitas gambar.");
  }
};
