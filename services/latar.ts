
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI, runWithRetry } from "./geminiService";

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

export const changeBackground = async (image: string, prompt: string, aspectRatio: string = "9:16", backgroundImage?: string) => {
  try {
    return await runWithRetry(async (ai) => {
      const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];
      
      if (backgroundImage) {
        parts.push({ inlineData: { data: cleanBase64(backgroundImage), mimeType: 'image/png' } });
      }

      parts.push({
        text: `[TASK]: STEP-BY-STEP SUBJECT EXTRACTION & FULL AREA REPLACEMENT.
        [WORKFLOW]:
        1. SUBJECT DETECTION: Identify the main person/character in the first image.
        2. ISOLATION: Extract ONLY the person.
        3. ${backgroundImage ? 'COMPOSITION: Place the extracted person from the first image onto the background seen in the second image.' : 'FULL REPLACEMENT: Apply the new environment preset to the area surrounding the person.'}
        [OBJECTIVE]: ${backgroundImage ? 'Seamlessly blend the person onto the provided custom background.' : '100% of the area outside the person must be replaced by the new scene.'}
        [INSTRUCTION]: ${prompt}.
        [RULES]: 
        1. NO LEAKS: Absolutely zero remnants of the original background.
        2. SUBJECT INTEGRITY: The person must remain 100% IDENTICAL.
        3. SEAMLESS BLENDING: Integrate the person naturally with realistic lighting and shadows.
        4. QUALITY: Professional 8K advertising quality.
        5. ASPECT RATIO: Use ${aspectRatio}.`
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts }],
        config: {
          imageConfig: { aspectRatio: aspectRatio as any },
          seed: Math.floor(Math.random() * 1000000)
        }
      });

      const result = extractImageFromResponse(response);
      if (!result) throw new Error("Gagal menghasilkan gambar latar belakang baru.");
      return result;
    });
  } catch (error: any) {
    console.error("Change Background Error:", error);
    const msg = error.message || "";
    if (msg.includes("403") || msg.includes("permission") || msg.includes("PERMISSION_DENIED")) {
       throw new Error("Izin Gagal (403): Silakan gunakan API Key pribadi di Settings atau coba lagi nanti.");
    }
    throw error;
  }
};
