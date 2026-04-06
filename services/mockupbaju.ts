
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MockupBajuConfig } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const extractImageFromResponse = (response: GenerateContentResponse) => {
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    const finishReason = candidate?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error("Gagal menghasilkan gambar. Konten diblokir oleh filter keamanan AI.");
    }
    throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk.");
  }
  
  const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
  if (imagePart?.inlineData?.data) {
    return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI.");
};

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

const handleApiError = (err: any) => {
  console.error("API Call Error:", err);
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("429")) {
    throw new Error("API LIMIT: Kecepatan akses terlalu tinggi. Tunggu sebentar.");
  }
  if (msg.includes("permission") || msg.includes("403")) {
    throw new Error("Akses ditolak (403). Pastikan API Key valid dan memiliki izin untuk model ini.");
  }
  throw new Error(err?.message || "Gagal memproses mockup baju.");
};

export const generateMockupBaju = async (image: string, config: MockupBajuConfig) => {
  const getItemTypeInstructions = (type: string) => {
    switch (type) {
      case 'ATASAN':
        return "The clothing item is a TOP (shirt, blouse, jacket, etc.). It MUST be hanging neatly on a single hanger.";
      case 'BAWAHAN':
        return "The clothing item is a BOTTOM (pants, skirt, shorts, etc.). It MUST be hanging neatly on a specialized hanger with clips.";
      case 'DRESS':
        return "The clothing item is a DRESS. It MUST be hanging elegantly on a single hanger, showing its full length.";
      case 'SETELAN':
        return "The clothing item is a SET (SETELAN/Outfit). It MUST be a full outfit consisting of a TOP and a BOTTOM (matching set). Both items MUST be hanging together neatly on hangers, presented as a complete set.";
      default:
        return "";
    }
  };

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: `[MOCKUP BAJU TASK]: Transform this clothing item into a professional, high-end boutique mockup.
          
          ITEM TYPE: ${getItemTypeInstructions(config.itemType)}
          
          MANDATORY VISUAL ELEMENTS:
          1. The clothing item from the input image MUST be hanging on a clean, elegant hanger (wooden, velvet, or polished metal).
          2. The clothing MUST appear perfectly neat, ironed, and unwrinkled. It should have a natural, professional drape as if it's a brand-new item in a luxury store.
          3. A human hand MUST be shown holding the top part of the hanger (the hook) naturally.
          4. The setting MUST be a sophisticated clothing boutique with professional studio lighting.
          5. The background should be rich in detail but with a soft bokeh effect: include elements like ambient boutique decor, elegant wall textures, and other high-end garments on racks.
          6. ${config.brandName ? `A stylish, glowing NEON SIGN displaying the text "${config.brandName}" MUST be prominently featured on the back wall as a brand identity.` : ''}
          
          STYLE & ENVIRONMENT:
          - Boutique Theme: ${config.boutiqueStyle} (Ensure the background decor, flooring, and wall textures match this specific aesthetic).
          - Hand Position: ${config.handType === 'TANGAN_KIRI' ? 'Left hand' : 'Right hand'} holding the hanger hook.
          - Lighting: Cinematic, soft-box studio lighting that highlights the fabric texture without creating harsh shadows.
          
          Ensure the original clothing's colors, patterns, and textures are preserved with 100% accuracy. The final image must look like a professional fashion photography shot for a premium catalog.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};
