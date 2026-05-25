
import { getAI, cleanBase64, extractImageFromResponse, getRandomSeed } from "./geminiService";
import { EstetikConfig } from "../types";

export const generateAestheticProduct = async (image: string, config: EstetikConfig, isAuto: boolean = false) => {
  try {
    const ai = getAI();
    const prompt = isAuto 
      ? `[AESTHETIC PRODUCT TASK - AUTO MODE]: Analyze this product and transform it into a highly aesthetic professional advertisement.
         
         INSTRUCTIONS:
         1. Automatically determine the best STYLE, ENVIRONMENT, DECORATION, and LIGHTING that perfectly complements this specific product.
         2. Keep the product's original shape, labels, and identity 100% intact.
         3. Place the product in a premium setting with artistic decorations.
         4. Apply professional studio lighting and cinematic graphic effects.
         5. Add elegant typography or brand elements if appropriate.
         6. The final result must be a masterpiece of product photography, filling the entire frame.
         
         QUALITY: 8K resolution, cinematic, sharp focus, professional color grading.`
      : `[AESTHETIC PRODUCT TASK]: Transform this product image into a highly aesthetic and professional advertisement.
          
          STYLE: ${config.style}
          ENVIRONMENT: ${config.environment}
          DECORATION: ${config.decoration}
          LIGHTING: ${config.lighting}
          TEXT TO ADD: ${config.text || 'None'}
          TEXT STYLE: ${config.textStyle || 'None'}
          ADDITIONAL: ${config.additionalPrompt}
          
          INSTRUCTIONS:
          1. Keep the product's original shape, labels, and identity 100% intact.
          2. Place the product in the specified environment with artistic decorations.
          3. Apply professional studio lighting and graphic effects (like glows, particles, or artistic overlays).
          4. Add the specified TEXT with the requested TEXT STYLE. The text should be elegant, readable, and positioned strategically (e.g., as a headline or brand tag) without covering the main product.
          5. The final result must look like a high-end social media ad or a premium catalog photo, filling the entire frame.
          
          QUALITY: 8K resolution, cinematic, sharp focus, professional color grading.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: prompt }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Aesthetic Product Service Error:", err);
    throw new Error(err?.message || "Gagal menghasilkan produk estetik.");
  }
};
