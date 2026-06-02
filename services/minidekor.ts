import { GoogleGenAI } from "@google/genai";
import { getAI, runWithRetry, extractImageFromResponse, cleanBase64 } from "./geminiService";
import { MiniDekorConfig } from "../types";

// Generate interior design from prompt
export const generateDekor = async (prompt: string, aspectRatio: string = "4:3") => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: { aspectRatio: aspectRatio as any }
      }
    });

    return extractImageFromResponse(response);
  });
};

// Upscale interior image
export const upscaleDekorImage = async (image: string) => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: "image/png" } },
          { text: "Upscale and enhance this interior photography to ultra high-definition 8K quality, making the details sharp, clean, bright, and professional." }
        ]
      }
    });

    return extractImageFromResponse(response);
  });
};
