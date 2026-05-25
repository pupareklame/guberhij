import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getAI, runWithRetry } from "./geminiService";

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const getMimeType = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/png';
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

  const textPart = candidate.content.parts.find((p: any) => p.text);
  if (textPart?.text) {
    // Jika AI memberikan alasan teks (misalnya penolakan keamanan atau ketidakmampuan)
    throw new Error(`AI Refusal: ${textPart.text}`);
  }

  return null;
};

const handleApiError = (err: any) => {
  console.error("Upscale API Error Detail:", err);
  const msg = err?.message || "";
  
  if (msg.includes("429")) {
    return "Limit tercapai. Tunggu sebentar sebelum mencoba lagi.";
  }
  if (msg.includes("quota")) {
    return "Kuota harian habis. Silakan coba lagi besok atau gunakan akun lain.";
  }
  if (msg.includes("403") || msg.includes("permission") || msg.includes("PERMISSION_DENIED")) {
    return "Akses Ditolak (403): Model Nano Banana 2 mungkin dibatasi untuk kunci API ini. Silakan gunakan Nano Banana 1 atau ganti API Key di pengaturan.";
  }
  if (msg.includes("safety") || msg.includes("Safety Block")) {
    return "Gambar ditolak oleh filter keamanan AI. Coba gunakan gambar lain yang lebih jelas.";
  }
  if (msg.includes("AI Refusal")) {
    // Extract the refusal message if possible
    const refusal = msg.replace("AI Refusal: ", "");
    return `AI menolak: ${refusal}`;
  }
  return msg || "Gagal meningkatkan kualitas gambar. Silakan coba lagi.";
};

export const upscaleImage = async (
  image: string, 
  aspectRatio: string = "1:1",
  customPrompt: string = "",
  negativePrompt: string = "",
  modelId: string = 'gemini-2.5-flash-image'
) => {
  try {
    return await runWithRetry(async (ai) => {
      const mimeType = getMimeType(image);
      
      const response = await ai.models.generateContent({
        model: modelId as any,
        contents: [{ 
          parts: [
            { inlineData: { data: cleanBase64(image), mimeType } }, 
            { text: `Ultra-high-resolution 4K enhancement based strictly on the provided reference image. Absolute fidelity to original facial anatomy, proportions, and identity. Preserve expression, gaze, pose, camera angle, framing, and perspective with zero deviation. Clothing, hair, skin, and background elements must remain unchanged in structure, placement, and design.

Recover fine-grain detail with natural realism. Enhance pores, fine lines, hair strands, eyelashes, fabric weave, seams, and material edges without introducing stylization. Maintain original color science, white balance, and tonal relationships exactly as captured. Lighting direction, intensity, contrast, and shadow behavior must match the source image precisely, with only improved clarity and expanded dynamic range. No relighting, no reshaping. Remove any grain.

Apply controlled sharpening and high-frequency detail reconstruction. Remove compression artifacts and noise while retaining authentic texture. No smoothing, no plastic skin, no artificial gloss. Facial features must remain consistent across the entire image with coherent anatomy and clean, stable edges.

[USER DIRECTIVE]: ${customPrompt || 'None'}
[NEGATIVE CONSTRAINTS]: ${negativePrompt || 'None'}

Negative constraints (default): no warping, no facial drift, no added or missing anatomy, no altered hands, no distortions, no perspective shift, no text or graphics, no hallucinated detail, no stylized rendering. Output must read as a true-to-life, photorealistic upscale that matches the reference exactly, only clearer, sharper, and higher resolution.` 
            }
          ] 
        }],
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
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
      if (!result) throw new Error("Data gambar tidak ditemukan dalam respon AI.");
      return result;
    });
  } catch (err: any) {
    throw new Error(handleApiError(err));
  }
};
