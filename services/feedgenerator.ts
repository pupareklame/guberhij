import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { getAI } from "./geminiService";

export const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

export const extractImageFromResponse = (response: GenerateContentResponse) => {
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

export const generateFeedText = async (config: any) => {
  try {
    const ai = getAI();
    const parts: any[] = [];

    if (config.customImage) {
      parts.push({ inlineData: { data: cleanBase64(config.customImage), mimeType: 'image/png' } });
    }

    parts.push({
      text: `Create a professional social media infographic content strategy for topic: "${config.topic}". 
      Description: "${config.description}".
      Goal: ${config.goal}. 
      Structure: ${config.structure}. 
      Visual Style: ${config.visualStyle}. 
      Brand Colors: Primary ${config.primaryColor}, Secondary ${config.secondaryColor}.
      ${config.customImage ? "I have uploaded a reference image. Analyze its content, style, and elements to incorporate them into the strategy and the image generation prompt." : ""}
      
      Return a JSON object with:
      1. "headline": A catchy, bold title for the infographic.
      2. "hook": A short engaging introductory sentence.
      3. "points": An array of 3-7 objects, each with "title", "content", and "visual_element" (description of icon/illustration for this point).
      4. "cta": A strong call to action text for the bottom of the image.
      5. "caption": A compelling Indonesian caption for the post with emojis.
      6. "hashtags": An array of 10 relevant hashtags.
      7. "imagePrompt": A MASTER English prompt for an AI image generator. It MUST describe a high-quality INFOGRAPHIC layout, with a large title, numbered sections, illustrative style, and professional composition. Mention the brand colors ${config.primaryColor} and ${config.secondaryColor}. ${config.customImage ? "Ensure the prompt describes the visual elements from the uploaded reference image so other AI generators (like ChatGPT/DALL-E) can recreate a similar vibe." : ""}
      8. "visualAdvice": Expert advice on how to layout this specific content.
      `
    });
    
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            hook: { type: Type.STRING },
            points: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  visual_element: { type: Type.STRING }
                },
                required: ["title", "content", "visual_element"]
              } 
            },
            cta: { type: Type.STRING },
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            imagePrompt: { type: Type.STRING },
            visualAdvice: { type: Type.STRING }
          },
          required: ["headline", "hook", "points", "cta", "caption", "hashtags", "imagePrompt", "visualAdvice"]
        }
      }
    });

    return JSON.parse(textResponse.text || '{}');
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const generateFeedImage = async (imagePrompt: string, config: any, modelId: string = 'gemini-2.5-flash-image') => {
  try {
    const ai = getAI();
    const parts: any[] = [];

    if (config.customImage) {
      parts.push({ inlineData: { data: cleanBase64(config.customImage), mimeType: 'image/png' } });
    }

    parts.push({
      text: `[INFOGRAPHIC DESIGN]: ${imagePrompt}. Ensure text areas are clean. Style: ${config.visualStyle}. Layout: ${config.typographyPlacement}. High resolution, 8k, professional graphic design. ${config.customImage ? "Use the uploaded image as a reference for style and content." : ""}`
    });

    const imageResponse = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts }],
      config: {
        imageConfig: { 
          aspectRatio: config.dimensions,
          imageSize: modelId.includes('gemini-3') ? '1K' : undefined
        },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(imageResponse);
  } catch (err: any) {
    return handleApiError(err);
  }
};
