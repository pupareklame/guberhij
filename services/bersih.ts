
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";

// Inisialisasi AI selalu mengambil API_KEY terbaru dari environment
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
  console.error("Clean Photo Service Error:", err);
  const msg = err?.message || "";
  if (msg.includes("429")) {
    throw new Error("API LIMIT: Kecepatan akses terlalu tinggi. Tunggu sebentar.");
  }
  throw new Error(msg || "Gagal membersihkan foto. Silakan coba lagi.");
};

/**
 * Fungsi khusus untuk mengekstrak foto portrait dari screenshot HP
 * Menghapus UI, bingkai, dan status bar dengan presisi tinggi.
 */
export const extractCleanPhoto = async (screenshot: string, preserveBackground: boolean = false, aspectRatio: string = "9:16") => {
  try {
    const ai = getAI();
    const parts: any[] = [{ inlineData: { data: cleanBase64(screenshot), mimeType: 'image/png' } }];
    
    let instruction = `[PRECISION CLEANING & EXPANSION TASK]: 
    1. ANALYZE: Identify all mobile UI elements (TOP STATUS BAR, BOTTOM NAVIGATION BAR, app icons, battery, frame).
    2. BLACK AREAS: CRITICAL - Detect and REMOVE any black areas or bars at the TOP and BOTTOM of the photo. These are often letterboxing bars from the phone's screen.
    3. UI BARS: CRITICAL - Completely remove the TOP BAR (status bar) and BOTTOM BAR (navigation/home bar) from the image.
    4. EXTRACT & EXPAND: Isolate the central subject. If the original photo area is smaller than the ${aspectRatio} frame, use AI to OUTPAINT and EXPAND the image naturally to fill the entire ${aspectRatio} area.
    5. CLEAN: Ensure 100% removal of all UI elements, frame artifacts, and BLACK BARS. The result must be a clean, full-frame photo.
    6. QUALITY: Enhance the subject's clarity and sharpness to professional portrait standards.
    `;

    if (preserveBackground) {
      instruction += `7. BACKGROUND: CRITICAL - Preserve the original background style but REMOVE the black bars and UI bars. EXPAND the background from the existing photo parts to fill the entire ${aspectRatio} frame naturally. Use AI outpainting to extend textures and lighting. There must be NO BLACK AREAS left.`;
    } else {
      instruction += `7. BACKGROUND: CRITICAL - Remove the background entirely and replace it with a PURE SOLID WHITE (#FFFFFF) background. Fill the entire ${aspectRatio} frame with white. Ensure there is NO BLACK area, no shadows, and no leftover UI pixels.`;
    }
    
    instruction += `\n8. OUTPUT: High resolution ${aspectRatio} portrait, masterpiece quality, sharp focus, NO BLACK BARS, NO UI BARS.`;

    parts.push({ text: instruction });

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
