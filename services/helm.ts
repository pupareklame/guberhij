import { GoogleGenAI } from "@google/genai";
import { cleanBase64, extractImageFromResponse, getAI } from "./geminiService";

export const applyHeadwear = async (image: string, headwearStyle: string, referenceImage: string | null = null) => {
  const ai = getAI();
  const parts: any[] = [
    { inlineData: { data: cleanBase64(image), mimeType: "image/png" } },
    { text: `Add a ${headwearStyle} to the person in the image. Ensure it fits realistically and matches the lighting. Return only the modified image.` }
  ];

  if (referenceImage) {
    parts.push({ inlineData: { data: cleanBase64(referenceImage), mimeType: "image/png" } });
    parts[1].text += " Use the second provided image as the exact model for the headwear.";
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts }
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
