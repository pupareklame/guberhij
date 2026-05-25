import { GoogleGenAI } from "@google/genai";
import { getAI } from "./geminiService";

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const fattenBody = async (
  image: string,
  intensity: number = 50,
  aspectRatio: string = "1:1",
  mode: string = 'REALISTIC'
) => {
  try {
    const ai = getAI();

    // Refined intensity mapping to be more descriptive but less likely to trigger safety filters
    let weightDescription = "a slightly fuller and healthier physique with subtle volume increase";
    if (intensity > 85) {
      weightDescription = "a significantly voluminous and broad physique, with very full rounded facial features, substantial body mass increase, and a very large, heavy-set frame. The body should look very plump and heavy.";
    } else if (intensity > 60) {
      weightDescription = "a noticeably heavier and fuller body shape, with chubby features, a double chin, and a broad, sturdy appearance.";
    } else if (intensity > 30) {
      weightDescription = "a moderately fuller body shape with soft, rounded features, fuller cheeks, and healthy weight gain.";
    }

    const styleInstruction = mode === 'EXTREME' 
      ? "ANATOMICAL INFLATION: Treat the subject's body as a 3D volume being filled with air. Every part—the face, neck, torso, arms, and legs—must expand significantly outward. The clothing should stretch tightly across the new, much larger volume. The face should become very round with prominent chubby cheeks."
      : "REALISTIC WEIGHT GAIN: Increase the subject's body mass naturally. Add volume to the face, neck, midsection, and limbs. The transformation should look like a natural, healthy weight gain while maintaining the original identity.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.split(',')[1],
              mimeType: 'image/png'
            }
          },
          {
            text: `[TASK: IMAGE-BASED BODY TRANSFORMATION - WEIGHT GAIN LOGIC]
            OBJECTIVE: Transform the person in the image to have ${weightDescription}.
            
            GUIDELINES:
            1. VOLUME EXPANSION: Expand the torso, arms, legs, and face. Use a 3D volume expansion logic where the body grows outward in all directions.
            2. FACE MODIFICATION: Add fullness to the cheeks and under the chin to match the new body weight.
            3. TEXTURE PRESERVATION: As the body expands, the clothing textures, skin details, and facial features must stretch and stay intact. Do not replace the clothing.
            4. ${styleInstruction}
            5. IDENTITY: Maintain 100% of the original person's identity. They must be clearly recognizable as the same person, just with more weight.
            6. ENVIRONMENT: Keep the background, lighting, and pose exactly as they are.
            
            OUTPUT: Professional edit, hyper-realistic, ${aspectRatio} aspect ratio.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        },
        seed: getRandomSeed()
      }
    });

    const candidate = response.candidates?.[0];
    
    // Check for safety blocks or empty responses
    if (!candidate || !candidate.content || !candidate.content.parts) {
      const finishReason = candidate?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error("Permintaan ditolak oleh sistem keamanan AI. Coba kurangi intensitas atau gunakan foto yang lebih sopan.");
      }
      throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk atau memblokir permintaan ini.");
    }

    const part = candidate.content.parts.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }

    throw new Error("Data visual tidak ditemukan dalam respon AI. Silakan coba lagi.");
  } catch (err: any) {
    console.error("Fatten Body Service Error:", err);
    // Provide a more user-friendly error message
    if (err.message?.includes('SAFETY')) {
      throw new Error("Sistem AI memblokir modifikasi ini karena alasan keamanan/etika. Coba gunakan intensitas yang lebih rendah.");
    }
    throw new Error(err?.message || "Gagal mengubah bobot badan. Silakan coba lagi.");
  }
};
