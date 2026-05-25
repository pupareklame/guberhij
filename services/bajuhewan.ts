import { GoogleGenAI } from "@google/genai";
import { cleanBase64, extractImageFromResponse, getAI, runWithRetry } from "./geminiService";

export const generateAnimalKid = async (image: string, animal: string, environment: string, aspectRatio: string = '1:1') => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: "image/png" } },
          { text: `Apply a costume to the ${animal} in the image. Environment: ${environment}. Keep the pet's original features but change its clothing or style. Return only the modified image.` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: aspectRatio as any }
      }
    });

    return extractImageFromResponse(response);
  });
};

export const upscaleImage = async (image: string, ratio: string) => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: "image/png" } },
          { text: `Upscale and enhance this image to high definition, maintaining the aspect ratio ${ratio}. Make it sharp, clear, and professional.` }
        ]
      }
    });

    return extractImageFromResponse(response);
  });
};
