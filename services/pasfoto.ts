
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PasFotoConfig } from "../types";

/**
 * [INTEGRITY-CHECK]: 0x706173666F746F
 * STATUS: PROTECTED-V1
 */

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  const msg = err?.message || "";
  if (msg.includes("429")) {
    throw new Error("API LIMIT: Kecepatan akses terlalu tinggi. Tunggu 30-60 detik sebelum menekan tombol lagi.");
  }
  if (msg.includes("quota")) {
    throw new Error("KUOTA HABIS: Limit harian akun ini telah tercapai. Silakan ganti akun di sidebar.");
  }
  throw new Error(msg || "Koneksi terputus. Silakan klik proses sekali lagi.");
};

export const generatePasFoto = async (image: string, config: PasFotoConfig) => {
  try {
    const ai = getAI();
    let prompt = `Formal pass photo. Category: ${config.category}, Gender: ${config.gender}, Background color: ${config.bgColor}, Size: ${config.size}. Professional lighting. High resolution.`;
    
    if (config.gender === 'PEREMPUAN') {
      if (config.useHijab) {
        prompt += ` The person is wearing a ${config.hijabColor} hijab in ${config.hijabStyle} style.`;
      } else {
        prompt += ` The person has a neat ${config.hairStyle} hairstyle.`;
      }
    } else {
      prompt += ` The person has a neat ${config.hairStyle} hairstyle.`;
    }

    if (config.useNameTag && config.nameTagText) {
      prompt += ` Include a name tag that says "${config.nameTagText}" in ${config.nameTagMaterial} material.`;
    }

    if (config.useTie) {
      if (config.tieStyle === 'CUSTOM' && config.customTiePrompt) {
        prompt += ` The person is wearing a custom tie: ${config.customTiePrompt}.`;
      } else {
        const tieMap: Record<string, string> = {
          'SD': 'red primary school tie (dasi SD)',
          'SMP': 'blue junior high school tie (dasi SMP)',
          'SMA': 'grey/white senior high school tie (dasi SMA)',
          'PEJABAT': 'formal professional silk tie',
          'KUPU_KUPU': 'bow tie (dasi kupu-kupu)',
          'SILANG': 'cross tie (dasi silang)',
        };
        prompt += ` The person is wearing a ${tieMap[config.tieStyle] || 'formal tie'}.`;
      }
    }

    const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];
    if (config.customOutfitImage) parts.push({ inlineData: { data: cleanBase64(config.customOutfitImage), mimeType: 'image/png' } });
    parts.push({ text: prompt });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: config.size === '3x4' ? "3:4" : "2:3" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = "2:3") => {
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
