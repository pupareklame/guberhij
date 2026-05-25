
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const extractImageFromResponse = (response: GenerateContentResponse) => {
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk.");
  }
  
  const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
  if (imagePart?.inlineData?.data) {
    return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI.");
};

export const transformSketchToReal = async (image: string, aspectRatio: string = "1:1") => {
  try {
    const ai = getAI();
    const prompt = `
      [ULTIMATE PHOTOREALISTIC SKETCH INTERPRETATION]
      
      MAIN INSTRUCTION:
      "Buatlah interpretasi fotorealistik dan beresolusi tinggi dari sebuah coretan tangan anak-anak. Kunci utamanya adalah menjaga bentuk dasar yang 'salah' secara anatomis, tidak proporsional, dan seringkali aneh dari gambar anak tersebut, tetapi merendernya seolah-olah itu adalah makhluk hidup, benda nyata, atau pemandangan asli dalam lingkungan alami. Jangan mencoba untuk 'memperbaiki' anatomi atau proporsinya; sebaliknya, terimalah keanehan bentuk tersebut dan berikan tekstur, detail, pencahayaan, dan kedalaman realistis ke dalamnya."

      PARAMETER DETAILS:
      1. Pelestarian Bentuk (Preserve Form):
      "Tirulah coretan garis-garis kasar, bentuk geometris yang tidak beraturan, dan proporsional yang berlebihan dari gambar anak secara persis. Jika seekor kuda memiliki kepala berbentuk persegi panjang raksasa atau angsa memiliki kaki tebal seperti manusia, biarkan bentuk itu tetap seperti itu dalam versi realistisnya."

      2. Penerapan Tekstur (Apply Textures):
      "Berikan tekstur realistis pada setiap elemen berdasarkan apa yang coba digambarkan oleh anak tersebut. Gunakan bulu hewan (fur/feather), kulit (skin), kain (fabric), kayu (wood), air (water), atau bahan lain sesuai dengan konteksnya. Berikan detail tinggi pada tekstur tersebut, seperti bulu yang halus, kerutan kulit, atau tekstur air."

      3. Pencahayaan dan Kedalaman (Lighting and Depth):
      "Gunakan pencahayaan alami dan detail, seperti cahaya matahari lembut atau pencahayaan studio yang terarah, untuk memberikan volume dan kedalaman pada bentuk-bentuk yang aneh tersebut. Berikan bayangan yang realistis dan pantulan cahaya untuk membuatnya terlihat solid dan tiga dimensi."

      ENVIRONMENT:
      Place the subject in a matching photorealistic environment (e.g., a real meadow for animals, a real road for cars, a real sky for birds). Use cinematic depth of field.

      ASPECT RATIO: ${aspectRatio}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: prompt }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: Math.floor(Math.random() * 1000000)
      }
    });

    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Jikanyata Service Error:", err);
    throw new Error(err?.message || "Gagal mentransformasi sketsa.");
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = "1:1") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Upscale and enhance this image to ultra HD detail. Sharp and clear.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: Math.floor(Math.random() * 1000000)
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Upscale Error:", err);
    throw new Error(err?.message || "Gagal menajamkan gambar.");
  }
};
