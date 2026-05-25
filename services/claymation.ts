
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";
import { ClaymationConfig } from "../types";

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

export const generateClaymation = async (sourceImage: string | null, config: ClaymationConfig) => {
  try {
    const ai = getAI();
    const prompt = `[CLAYMATION TRANSFORMATION TASK]:
    1. [MATERIAL]: Transform the subject into a high-quality claymation figure, plastiline model, or handcrafted clay sculpture. The material must look like colorful plastiline clay with a soft, matte, and slightly waxy finish.
    2. [TEXTURE & IMPERFECTIONS]: The surface must be authentic and imperfect. Include visible fingerprints, slight surface imperfections, soft dents, and handcrafted finish. Show visible seams where parts (like arms and body) are joined with soft edges.
    3. [STYLIZATION]: Simplify the forms. Use stylized, exaggerated features and simplified geometry. NO human skin pores or fabric fibers. Hair must be a sculpted mass (sculpted hair mass), not individual strands. Clothing should look like pieces of clay molded and attached to the body.
    4. [CINEMATOGRAPHY]: Use soft studio lighting with dramatic shadows that highlight the clay textures. The shot should have a natural depth of field and a clean background.
    5. [CHARACTER]: ${config.characterPrompt || 'A character based on the category'}.
    7. [CATEGORY]: ${config.category}.
    8. [STYLE]: ${config.style}.
    9. [SCENE/ENVIRONMENT]: ${config.scene}.
    10. [TOTAL TRANSFORMATION]: ${sourceImage ? 'Use the source image ONLY as a reference for pose and general theme. This is a 100% clay sculpture, NOT a photorealistic human.' : 'Create a new clay sculpture from scratch based on the character description.'}
    11. [ADDITIONAL]: ${config.customInstruction || 'None'}.`;

    const parts: any[] = [{ text: prompt }];
    if (sourceImage) {
      parts.unshift({ inlineData: { data: cleanBase64(sourceImage), mimeType: 'image/png' } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Claymation API Error:", err);
    throw new Error(err.message || "Gagal memproses Claymation AI.");
  }
};
