import { getAI } from "./geminiService";
import { CitaCitaConfig } from "../types";

export async function generateCitaCita2(image: string, config: CitaCitaConfig, modelId: string = "gemini-2.5-flash-image"): Promise<string> {
  const ai = getAI();
  const model = modelId;
  
  const prompt = `
    Transform the person in the image to look like they have achieved their dream job: ${config.dreamJob}.
    
    CRITICAL INSTRUCTIONS:
    1. OUTFIT SWAP: Change their current clothing to a high-quality, professional ${config.dreamJob} uniform or style-appropriate attire.
    2. POSE SWAP: The person MUST be in a half-body pose (setengah badan) with their ARMS FOLDED across their chest (tangan di lipat di dada). Their body should be slightly angled, but their head and eyes MUST look directly at the camera.
    3. BACKGROUND SWAP: Change the background to a professional and fitting environment for a ${config.dreamJob}.
    4. GENDER CONSISTENCY: The transformed person MUST be a ${config.gender.replace('_', ' ')}.
    5. IDENTITY: Maintain the facial features, skin tone, and overall identity of the person from the original image as much as possible.
    6. VISUAL STYLE: Use a ${config.style.toLowerCase()} art style.
    7. ADDITIONAL: ${config.additionalPrompt}.

    ${config.dreamJob === 'PEMAIN_VOLI' ? `
    Jersey Details:
    - Primary Color: ${config.jerseyColor}
    - Pattern: ${config.jerseyMotif}
    - Sleeves: ${config.sleeveType === 'PANJANG' ? 'Long' : 'Short'}
    ` : ''}

    The final output must be highly realistic, professional, and visually stunning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: image.split(",")[1],
              mimeType: "image/png",
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data returned from Gemini.");
  } catch (error: any) {
    console.error("CitaCita2 Generation Error:", error);
    throw new Error(error.message || "Gagal menggenerate cita-cita.");
  }
}
