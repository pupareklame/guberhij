import { getAI, runWithRetry, cleanBase64, extractImageFromResponse, getRandomSeed } from "./geminiService";

export const generateHairTransformation = async (
  baseImage: string,
  hairStyle: string,
  hairColor: string,
  gender: string = "unspecified",
  aspectRatio: string = "1:1"
) => {
  return runWithRetry(async (ai) => {
    const prompt = `Change the person's hair in this image. 
    Style: ${hairStyle}. 
    Color: ${hairColor}. 
    Gender focus: ${gender}.
    Keep the person's identity and facial features the same. The result should look natural and professional, like a high-end salon photo or studio portrait. 
    The hair should be perfectly integrated with the original face and environment. Ensure the hair texture and lighting matches the original image.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [
          { inlineData: { data: cleanBase64(baseImage), mimeType: 'image/png' } },
          { text: prompt }
        ]
      }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(response);
  });
};
