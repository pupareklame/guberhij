
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

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const transformPose = async (model: string, reference: string | null, instruction: string, aspectRatio: string = "9:16", modelId: string = 'gemini-2.5-flash-image') => {
  const ai = getAI();
  const parts: any[] = [{ inlineData: { data: cleanBase64(model), mimeType: 'image/png' } }];
  if (reference) parts.push({ inlineData: { data: cleanBase64(reference), mimeType: 'image/png' } });
  
  parts.push({ 
    text: `[POSE TRANSFORMATION TASK]: 
    1. IDENTITY SOURCE: Use the person from the FIRST image as the model. Maintain 100% of their facial features, skin tone, and identity.
    2. POSE SOURCE: ${reference ? 'Use the EXACT POSE, body posture, and limb positions from the SECOND image.' : `Follow this instruction: ${instruction}`}
    3. INTEGRATION: Seamlessly blend the identity from the first image onto the pose from the ${reference ? 'second' : 'first'} image.
    4. QUALITY: Professional 8K studio quality, hyper-realistic textures.
    5. ASPECT RATIO: Use ${aspectRatio}.
    ${reference ? 'CRITICAL: The final image must have the same body posture as the second image but with the face of the first image.' : ''}`
  });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ parts }],
    config: { 
      imageConfig: { 
        aspectRatio: aspectRatio as any,
        imageSize: modelId.includes('3') ? '1K' : undefined
      },
      seed: Math.floor(Math.random() * 1000000)
    }
  });

  const result = extractImageFromResponse(response);
  if (!result) throw new Error("Gagal mentransformasi pose. Coba lagi.");
  return result;
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
