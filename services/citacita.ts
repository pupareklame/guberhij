import { GoogleGenAI } from "@google/genai";
import { getAI } from "./geminiService";
import { CitaCitaConfig } from "../types";

export async function generateCitaCita(image: string, config: CitaCitaConfig): Promise<string> {
  const ai = getAI();
  const model = "gemini-2.5-flash-image";
  
  const prompt = `
    Transform the person in the image to look like they have achieved their dream job: ${config.dreamJob}.
    
    ${config.dreamJob === 'PEMAIN_VOLI' ? `
    Professional Volleyball Player details:
    - Outfit: Wearing a high-quality volleyball jersey, athletic shorts, and professional volleyball sneakers.
    - Jersey Color: Primary color is ${config.jerseyColor}.
    - Jersey Motif: The jersey has a ${config.jerseyMotif} pattern/design.
    - Sleeve Type: ${config.sleeveType === 'PANJANG' ? 'Long sleeves' : 'Short sleeves'}.
    - Props: They may be holding a professional volleyball.
    - Setting: Typically on a professional indoor volleyball court or athletic arena.
    ` : ''}

    ${config.dreamJob === 'PRESIDEN' ? `
    President of Republic of Indonesia (Presiden RI) details:
    - Outfit: Formal black suit (jas hitam) over a crisp white shirt (kemeja putih).
    - Accessory: A bold solid red tie (dasi merah). 
    - Headwear: ${config.gender === 'PRIA' || config.gender === 'ANAK_LAKI' ? 'Wearing a traditional Indonesian black Peci (songkok).' : 'Professional and elegant formal attire for a female leader.'}
    - Background: An Indonesian Red and White flag (Bendera Merah Putih) must be visible in the background, positioned professionally. DO NOT include any Garuda emblem or icons in the background.
    - Arms Position: Arms must be straight down naturally at the sides (tangan normal ke bawah).
    - Style: Official state portrait style, dignified, professional, and authoritative.
    - Details: May include a small Indonesian flag pin (Lencana Merah Putih) on the lapel.
    ` : ''}

    Requirements:
    1. Change their clothing to a professional and highly detailed ${config.dreamJob} uniform or appropriate attire.
    2. Set the pose to: ${config.pose}.
    3. Set the background/environment to: ${config.environment}.
    4. The person's gender/category is: ${config.gender}.
    5. Visual style: ${config.style}.
    6. Maintain the facial features and identity of the person in the original image as much as possible.
    7. Additional instructions: ${config.additionalPrompt}.
    
    The final image should be high quality, ${config.style.toLowerCase()}, and look natural.
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
    console.error("CitaCita Generation Error:", error);
    throw new Error(error.message || "Gagal menggenerate cita-cita.");
  }
}
