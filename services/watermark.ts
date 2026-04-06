
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  // Mencoba mengambil key dari berbagai kemungkinan lingkungan (AI Studio vs Vercel/Local)
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key tidak ditemukan. Pastikan Anda telah mengatur GEMINI_API_KEY atau VITE_GEMINI_API_KEY di pengaturan Vercel.");
  }
  
  return new GoogleGenAI({ apiKey });
};

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

export const removeWatermark = async (image: string, mask: string | null, instruction: string, ratio: string = "1:1") => {
  try {
    const ai = getAI();
    const parts: any[] = [
      { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }
    ];

    if (mask) {
      parts.push({ inlineData: { data: cleanBase64(mask), mimeType: 'image/png' } });
    }

    parts.push({ 
      text: `[IMAGE RESTORATION TASK]: ${instruction}. 
      OBJECTIVE: Clean the image by removing only the watermarks, logos, or text overlays.
      RETAIN: Keep all other parts of the original image (people, objects, background) exactly as they are.
      REPAIR: Synthesize the pixels behind the watermark to match the surrounding environment seamlessly.
      STRICT RULES:
      - DO NOT erase the whole image.
      - DO NOT add new watermarks or text.
      - DO NOT change the overall composition of the photo.
      - The result must be a clean version of the original photo.` 
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: ratio as any },
        seed: Math.floor(Math.random() * 1000000)
      }
    });

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

    const part = candidate.content.parts.find((p: any) => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }

    throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
  } catch (err: any) {
    console.error("Watermark Removal Error:", err);
    throw new Error(err.message || "Koneksi terputus. Silakan klik proses sekali lagi.");
  }
};
