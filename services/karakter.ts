
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

/**
 * Membuat karakter lucu berdasarkan input objek/buah.
 */
export const createCharacter = async (
  prompt: string, 
  aspectRatio: string = "1:1",
  style: string = "3D_RENDER",
  pose: string = "standing",
  headwear: string = "none"
) => {
  try {
    const ai = getAI();
    
    let styleDesc = "";
    if (style === "3D_RENDER") {
      styleDesc = "3D Octane render, Unreal Engine 5 style, vibrant saturated colors.";
    } else if (style === "REALISTIC") {
      styleDesc = "Professional studio lighting, 8k resolution, realistic textures.";
    } else if (style === "ANIME") {
      styleDesc = "High-quality 3D anime style, clean lines, expressive features.";
    }

    let headwearDesc = "";
    if (headwear === "none") {
      headwearDesc = "The character has NO hat and NO headwear. The head is bare, showing only the fruit/vegetable surface texture.";
    } else if (headwear === "cowboy") {
      headwearDesc = "The character is wearing a tiny, stylish cowboy hat.";
    } else if (headwear === "farmer") {
      headwearDesc = "The character is wearing a tiny, rustic straw farmer hat.";
    } else if (headwear === "skin") {
      headwearDesc = `The character is wearing a cute matching hat made of "${prompt}" skin or parts.`;
    } else if (headwear === "chef") {
      headwearDesc = "The character is wearing a tiny, professional white chef hat.";
    } else if (headwear === "party") {
      headwearDesc = "The character is wearing a colorful, festive party hat.";
    }

    const finalPrompt = `
      Ultra realistic cute miniature character made from ${prompt}, the entire body formed from the natural texture, flesh, fibers, or skin of ${prompt}. 

      Character design: adorable chibi baby figurine with a big head and small body, short arms and legs, smooth rounded shapes, tiny glossy black eyes, cute neutral facial expression. The character is ${pose}. ${headwearDesc}

      The surface of the character clearly shows authentic ${prompt} texture details such as fibers, segments, pulp, skin patterns, or natural fruit structure integrated naturally into the body.

      Style: photorealistic macro photography, hyper detailed organic texture, juicy fresh appearance, soft cinematic lighting, studio quality light, shallow depth of field, realistic shadows. ${styleDesc}

      Scene: the character standing upright on a kitchen table or clean surface with a blurred fruit bowl in the background containing various fruits.

      Composition: centered subject, full body visible, symmetrical composition, macro lens look, creamy bokeh background.

      Quality: ultra detailed, photorealistic, 8k resolution, professional food photography, highly detailed organic material rendering.

      Negative prompt: cartoon, illustration, plastic toy texture, low detail, blurry, deformed body, extra limbs, distorted face, unrealistic colors, watermark, text, logo
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: finalPrompt }] }],
      config: { 
        imageConfig: { 
          aspectRatio: aspectRatio as any
        },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Character Service Error:", err);
    throw new Error(err?.message || "Gagal membuat karakter. Silakan coba lagi.");
  }
};
