
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

export const changeBackground = async (image: string, prompt: string, aspectRatio: string = "9:16") => {
  const ai = getAI();
  const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];
  
  parts.push({
    text: `[TASK]: PROFESSIONAL BACKGROUND REMOVAL & REPLACEMENT.
    [OBJECTIVE]: Remove the existing background from the source image, clean the subject (usually a person), and place them into a new environment.
    [INSTRUCTION]: ${prompt}.
    [RULES]: 
    1. BACKGROUND REMOVAL: Completely remove and clean the original background from the source image.
    2. IDENTITY LOCK: The person or subject in the source image must remain 100% IDENTICAL in terms of features, face, and clothing.
    3. MAINTAIN POSE: Do NOT change the subject's pose or body position. Keep it exactly as in the source image.
    4. SEAMLESS BLENDING: Apply "Global Illumination" matching. The lighting on the subject must be adjusted to match the new environment perfectly.
    5. CONTACT SHADOWS: Generate realistic contact shadows and ambient occlusion where the subject meets the ground or surfaces in the new environment.
    6. COLOR GRADING: Apply professional cinematic color grading to the entire image to ensure the subject and new background share a unified color palette.
    7. DEPTH OF FIELD: Professional cinematic blur (bokeh) for the new background, with a natural transition from the subject.
    8. OUTPUT: Professional 8K advertising quality, photorealistic, ultra-detailed textures.
    9. NO DISTORTION: Do not change the subject's shape, proportions, or facial features.
    10. ASPECT RATIO: Use ${aspectRatio}.`
  });

  const model = ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ parts }],
    config: {
      imageConfig: { aspectRatio: aspectRatio as any },
      seed: Math.floor(Math.random() * 1000000)
    }
  });

  const response = await model;
  const result = extractImageFromResponse(response);
  if (!result) throw new Error("Gagal menghasilkan gambar latar belakang baru.");
  return result;
};
