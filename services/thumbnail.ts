import { GoogleGenAI } from "@google/genai";
import { cleanBase64, extractImageFromResponse, getAI, runWithRetry } from "./geminiService";

export const generateThumbnail = async (image: string, title: string, effects: string[]) => {
  return runWithRetry(async (ai) => {
    const effectText = effects.join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: "image/png" } },
          { text: `Create a YouTube thumbnail using this image. Add the title "${title}" in a bold, catchy font. Apply these effects: ${effectText}. Make it high-contrast and eye-catching. Return only the modified image.` }
        ]
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
