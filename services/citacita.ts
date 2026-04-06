import { GoogleGenAI } from "@google/genai";
import { CitaCitaConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateCitaCita(image: string, config: CitaCitaConfig): Promise<string> {
  const model = "gemini-2.5-flash-image";
  
  const prompt = `
    Transform the person in the image to look like they have achieved their dream job: ${config.dreamJob}.
    
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
