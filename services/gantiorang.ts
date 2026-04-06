import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

export const swapPerson = async (
  poseBaseImage: string,
  faceReferenceImage: string,
  aspectRatio: string = "1:1",
  similarity: number = 100,
  style: string = 'PHOTOREALISTIC'
) => {
  try {
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: poseBaseImage.split(',')[1],
              mimeType: 'image/png'
            }
          },
          {
            inlineData: {
              data: faceReferenceImage.split(',')[1],
              mimeType: 'image/png'
            }
          },
          {
            text: `[CRITICAL TASK: ${style} IDENTITY REPLACEMENT]
            You are an expert digital compositor. Your goal is to perform a perfect identity transfer.

            INPUTS:
            - IMAGE 1: The target scene. Contains the body, clothing, hair, pose, and background.
            - IMAGE 2: The identity reference. Contains the face of the person to be transferred.

            INSTRUCTION:
            1. Analyze the facial features of the person in IMAGE 2 (eyes, nose, mouth, unique identifiers).
            2. Map these features onto the person in IMAGE 1.
            3. RETAIN the hair, ears, and neck from IMAGE 1 to ensure the head fits perfectly with the body and clothing.
            4. Match the skin tone of the result to the lighting and environment of IMAGE 1.
            5. Preserve the exact pose, clothing details, and background of IMAGE 1.
            6. The final output must look like a real, unedited photograph of the person from IMAGE 2 in the setting of IMAGE 1.
            7. IDENTITY STRENGTH: ${similarity}%. Ensure the facial features are an exact match to IMAGE 2.

            QUALITY: Hyper-realistic, 8k, sharp focus, professional color grading, ${aspectRatio} aspect ratio.`
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
    if (part?.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }

    throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
  } catch (err: any) {
    console.error("Swap Person Service Error:", err);
    throw new Error(err?.message || "Gagal mengganti orang. Silakan coba lagi.");
  }
};
