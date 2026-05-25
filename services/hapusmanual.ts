import { GoogleGenAI } from "@google/genai";
import { cleanBase64, extractImageFromResponse, getAI } from "./geminiService";

export const magicEraser = async (image: string, mask: string, aspectRatio: string = '1:1') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { data: cleanBase64(image), mimeType: "image/png" } },
        { inlineData: { data: cleanBase64(mask), mimeType: "image/png" } },
        { text: "Remove the object highlighted in the mask from the first image. Fill the area naturally with the background. Return only the modified image." }
      ]
    },
    config: {
      imageConfig: { aspectRatio: aspectRatio as any }
    }
  });

  return extractImageFromResponse(response);
};

export const upscaleImage = async (image: string, ratio: string) => {
  const ai = getAI();
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
};
