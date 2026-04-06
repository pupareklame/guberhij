import { GoogleGenAI } from "@google/genai";

export const generateWisata = async (
  baseImage: string,
  destinationImage: string | null,
  destinationText: string,
  clothingImage: string | null,
  clothingText: string,
  poseText: string,
  seasonText: string,
  aspectRatio: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
    Create a high-quality, realistic travel photo based on the following inputs:
    - People in the photo: Use the face and identity from the provided base image. If only a face is provided, generate a full body for the person that matches the face.
    - Destination: ${destinationText || 'A beautiful scenic location'}. ${destinationImage ? 'Use the provided destination image as a reference for the background.' : ''}
    - Clothing: ${clothingText || 'Appropriate travel attire'}. ${clothingImage ? 'Use the provided clothing image as a reference for what the people are wearing.' : ''}
    - Pose: ${poseText || 'Natural travel pose'}.
    - Season/Weather: ${seasonText || 'Clear sunny day'}.
    - Style: Professional travel photography, cinematic lighting, sharp details, realistic textures.
    - Aspect Ratio: ${aspectRatio}.

    The output must be a single image where the people from the base image are perfectly integrated into the specified destination, wearing the specified clothing, in the specified pose and season. Ensure the lighting and shadows are consistent across the entire image.
  `;

  const parts: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/png",
        data: baseImage.split(',')[1],
      },
    },
  ];

  if (destinationImage) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: destinationImage.split(',')[1],
      },
    });
  }

  if (clothingImage) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: clothingImage.split(',')[1],
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      },
    },
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

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};
