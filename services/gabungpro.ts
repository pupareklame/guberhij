import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const extractImageFromResponse = (response: GenerateContentResponse) => {
  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("Gagal menggabungkan gambar. Server AI mungkin sedang sibuk.");
  }
  const part = response.candidates[0].content.parts.find((p: any) => p.inlineData);
  if (part?.inlineData?.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Data visual tidak ditemukan. Coba lagi dalam beberapa saat.");
};

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

const handleApiError = (err: any) => {
  console.error("API Call Error:", err);
  const msg = err?.message || "";
  if (msg.includes("429")) {
    throw new Error("API LIMIT: Kecepatan akses terlalu tinggi. Tunggu 30-60 detik.");
  }
  if (msg.includes("quota")) {
    throw new Error("KUOTA HABIS: Limit harian akun ini telah tercapai.");
  }
  throw new Error(msg || "Koneksi terputus. Silakan klik proses sekali lagi.");
};

export const mergeImages = async (images: string[], prompt: string, aspectRatio: string = "1:1") => {
  try {
    const ai = getAI();
    const parts: any[] = [];
    
    images.forEach((img, index) => {
      parts.push({
        inlineData: {
          data: cleanBase64(img),
          mimeType: 'image/png'
        }
      });
      parts.push({ text: `[IDENTITAS GAMBAR ${index + 1}]: Ini adalah sumber gambar ke-${index + 1}.` });
    });

    parts.push({
      text: `[MERGE TASK]: Harap gabungkan semua gambar di atas menjadi satu kesatuan yang kohesif, realistis, dan menyatu secara visual. Perintah khusus: "${prompt}". Pastikan pencahayaan, bayangan, dan perspektif setiap elemen dari gambar sumber disesuaikan agar terlihat seperti satu foto asli yang utuh. Gunakan identitas gambar (Gambar 1, Gambar 2, dst) untuk memahami penempatan objek sesuai instruksi.`
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

export const upscaleMergedImage = async (image: string, aspectRatio: string = "1:1") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Upscale and enhance this composite image to ultra HD detail. Ensure the edges of merged objects are smooth and blended perfectly. Sharp and clear.` }
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
