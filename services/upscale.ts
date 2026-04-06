import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export const upscaleImage = async (image: string, aspectRatio: string = "1:1") => {
  try {
    const ai = getAI();
    const mimeType = getMimeType(image);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType } }, 
          { text: `[ULTRA-HD RECONSTRUCTION TASK]:
            1. ANALYZE: Identify low-resolution artifacts, blur, and missing textures in this image.
            2. RECONSTRUCT: Deeply reconstruct facial features (eyes, skin pores, hair) and clothing textures to 8K-like clarity.
            3. SHARPEN: Apply aggressive but natural sharpening to all edges.
            4. DENOISE: Remove any digital noise or compression artifacts from the source.
            5. IDENTITY: Maintain 100% of the original subject's identity.
            6. OUTPUT: Return only the reconstructed, high-definition, and crystal-clear image.` 
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
  } catch (err: any) {
    throw new Error(handleApiError(err));
  }
};
