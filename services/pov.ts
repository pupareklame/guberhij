
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";
import { POVConfig } from "../types";

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

const handleApiError = (err: any) => {
  console.error("API Call Error:", err);
  const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err) || "");
  
  if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("KUOTA GEMINI HABIS / LIMIT AKUN (429): Limit/kuota harian API bawaan telah tercapai atau kecepatan akses terlalu tinggi (RESOURCE_EXHAUSTED). Anda dapat terus menggunakan aplikasi ini dengan lancar tanpa hambatan dengan memasukkan API Key Gemini Anda sendiri di menu 'Settings' -> 'Secrets' (ikon roda gigi di pojok kanan bawah/atas) pada platform Google AI Studio (masukkan kunci dengan nama GEMINI_API_KEY). Silakan coba lagi setelah memasang API Key.");
  }
  throw new Error(msg || "Koneksi terputus. Silakan klik proses sekali lagi.");
};

export const generatePOV = async (product: string, config: POVConfig, aspectRatio: string = "9:16") => {
  try {
    const ai = getAI();
    const parts: any[] = [{ inlineData: { data: cleanBase64(product), mimeType: 'image/png' } }];
    
    let bgInstructions = `Background Style: ${config.bgPreset}. Color nuance: ${config.colorNuance}.`;
    
    if (config.customBgImage) {
      parts.push({ inlineData: { data: cleanBase64(config.customBgImage), mimeType: 'image/png' } });
      bgInstructions = `CRITICAL: You are provided with TWO images. The 1st image is the product. The 2nd image is a custom background. You MUST use the 2nd image (custom background) as the entire backdrop/background scenery of this photograph. Place the product from the 1st image in the foreground, being naturally held by the user's hand (${config.handType} hand, size description: ${config.productSize}), superimposed perfectly over that 2nd image background. Preserve the exact aesthetic and visual content of the 2nd image background as the backdrop of the scene. Make sure this custom background is slightly soft-focused or blurred (subtle camera lens focus blur) while the product and the hand in the foreground remain razor-sharp, ultra-clear, and perfectly detailed with high fidelity.`;
    }

    parts.push({ 
      text: `[POV TASK]: Create a high-quality, professional POV (point of view) photo shoot.
Product to hold: The product shown in the 1st image.
Hand type holding the product: ${config.handType} Hand.
Product size representation: ${config.productSize}.
${bgInstructions}
${config.aiBgPrompt || ''}
Ensure realistic shadows, accurate depth of field (the background should have a subtle realistic camera focus bokeh blur), and natural integration. The hand should gracefully hold the product.`
    });

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
    return handleApiError(err);
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = "9:16") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Upscale and enhance this image to ultra HD 8K detail. Sharp and clear.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};
