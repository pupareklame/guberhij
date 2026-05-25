import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
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
  
  const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
  if (imagePart?.inlineData?.data) {
    return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
  }

  return null;
};

export const generateRealImage = async (prompt: string, aspectRatio: string = "1:1", image?: string) => {
  try {
    const ai = getAI();
    
    const parts: any[] = [];
    
    if (image) {
      parts.push({ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } });
    }
    
    const systemPrompt = `
      [PHOTOREALISTIC IMAGE GENERATION TASK]:
      ${image ? 'Use the uploaded image as a strong visual reference for subject, style, or composition.' : 'Create a highly realistic, photorealistic image from scratch.'}
      
      USER PROMPT: "${prompt}"
      
      [TECHNICAL DIRECTIVES]:
      1. REALISM: The image must look like a real photograph taken with a high-end camera (e.g., Sony A7R IV, 85mm lens).
      2. TEXTURES: Capture extreme details in textures (e.g., skin, fabric, nature elements, lighting reflections).
      3. LIGHTING: Use natural, cinematic lighting. Soft shadows, realistic highlights.
      4. COMPOSITION: Professional photography composition.
      ${image ? '5. MODIFICATION: Apply the changes described in the prompt to the reference image naturally.' : '5. WEIRDNESS: If the prompt is unusual, render it as if it actually exists in the real world with perfect biological/physical integration.'}
      
      OUTPUT: Return ONLY the generated image.
    `;

    parts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ]
      }
    });

    const result = extractImageFromResponse(response);
    if (!result) throw new Error("Gambar tidak ditemukan dalam respon.");
    return result;
  } catch (err: any) {
    console.error("Generate Real Image Error:", err);
    throw new Error(err?.message || "Gagal membuat gambar nyata.");
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = "1:1", modelId: string = 'gemini-2.5-flash-image') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `[ULTRA-HD ENHANCEMENT]:
            Reconstruct this image with 8K clarity. Enhance all textures, sharpen edges naturally, and remove any artifacts. Maintain 100% visual integrity.` 
          }
        ] 
      }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
      }
    });
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts.find((p: any) => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
    }
    throw new Error("Gagal menajamkan gambar.");
  } catch (err: any) {
    throw new Error(err instanceof Error ? err.message : "Gagal menajamkan gambar.");
  }
};

export const enhancePrompt = async (prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        parts: [{ 
          text: `[PROMPT ENHANCER]:
          Tugas Anda adalah mendetailkan prompt sederhana menjadi prompt yang sangat deskriptif, artistik, dan fotorealistik untuk generator gambar AI.
          
          PROMPT SEDERHANA: "${prompt}"
          
          INSTRUKSI:
          1. Tambahkan detail tentang pencahayaan (lighting), tekstur, komposisi kamera, dan suasana (mood).
          2. Gunakan bahasa yang puitis namun teknis (seperti jenis lensa, aperture).
          3. Pastikan hasilnya tetap setia pada ide asli tetapi jauh lebih kaya.
          4. Berikan hasil akhir dalam Bahasa Indonesia yang luar biasa.
          5. Kembalikan HANYA teks prompt yang sudah didetailkan.
          ` 
        }] 
      }],
    });
    return response.text?.trim() || prompt;
  } catch (err: any) {
    console.error("Enhance Prompt Error:", err);
    return prompt;
  }
};
