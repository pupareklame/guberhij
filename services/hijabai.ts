import { GoogleGenAI } from "@google/genai";
import { getAI } from "./geminiService";

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const applyHijab = async (
  baseImage: string, // Character, fruit, card, etc. (Face source)
  hijabReferenceImage: string | null, // Optional hijab reference
  poseReferenceImage: string | null, // Optional pose/body reference
  hijabType: string, // bergo, segi empat, pashmina, etc.
  aspectRatio: string = "1:1",
  customPrompt: string = ""
) => {
  try {
    const ai = getAI();

    const parts: any[] = [
      {
        inlineData: {
          data: baseImage.split(',')[1],
          mimeType: 'image/png'
        }
      }
    ];

    if (hijabReferenceImage) {
      parts.push({
        inlineData: {
          data: hijabReferenceImage.split(',')[1],
          mimeType: 'image/png'
        }
      });
    }

    if (poseReferenceImage) {
      parts.push({
        inlineData: {
          data: poseReferenceImage.split(',')[1],
          mimeType: 'image/png'
        }
      });
    }

    const prompt = `[TASK: ADD HIJAB TO OBJECT/CHARACTER]
    1. BASE OBJECT (FACE/IDENTITY SOURCE): The first image shows the character or person whose FACE and IDENTITY must be used. THIS IS THE ONLY FACE THAT SHOULD BE IN THE FINAL IMAGE.
    2. HIJAB TYPE: The user wants a "${hijabType}" style hijab.
    ${hijabReferenceImage ? '3. HIJAB REFERENCE: Use the style and color from this image as a reference for the hijab. IGNORE ANY FACE PRESENT IN THIS IMAGE.' : ''}
    ${poseReferenceImage ? '4. POSE REFERENCE: Use the EXACT POSE, BODY, and OUTFIT from this image. IGNORE THE FACE IN THIS IMAGE.' : ''}
    ${customPrompt ? `5. ADDITIONAL INSTRUCTION: ${customPrompt}` : ''}
    
    GOAL:
    ${poseReferenceImage 
      ? '- Create an image where the person has the EXACT POSE, BODY, and OUTFIT from the POSE REFERENCE.'
      : '- Add a hijab to the character/object in the BASE OBJECT image.'}
    ${poseReferenceImage 
      ? '- SWAP the face in the POSE REFERENCE with the FACE and IDENTITY from the BASE OBJECT. The final face MUST look exactly like the person in the BASE OBJECT.' 
      : '- Maintain the original identity and features of the base object.'}
    - Add a "${hijabType}" hijab that fits naturally and covers the hair and neck properly.
    - Ensure seamless integration between the swapped face and the body.
    - CRITICAL: Do NOT use the face from the Hijab Reference or Pose Reference. Only use the face from the BASE OBJECT.
    
    QUALITY: Masterpiece, high detail, professional studio lighting, realistic textures.
    OUTPUT: ${aspectRatio} aspect ratio image.`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        },
        seed: getRandomSeed()
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

    const part = candidate.content.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) {
      throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
    }

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (err: any) {
    console.error("Hijab AI Service Error:", err);
    throw new Error(err?.message || "Gagal memproses hijab. Silakan coba lagi.");
  }
};
