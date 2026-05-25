import { runWithRetry, cleanBase64, extractImageFromResponse, getRandomSeed } from "./geminiService";

export const generateMemoryArt = async (
  presentPhoto: string,
  yearOld: string,
  yearNow: string,
  dateMonth: string,
  cakeNumber: string,
  seating: "facing" | "parallel" = "facing",
  aspectRatio: string = "9:16",
  seatingCustom?: string
) => {
  return runWithRetry(async (ai) => {
    const prompt = `Create a high-end emotional composite art piece using the provided photo.
    
    Formation & Color Style:
    - Left side: Generate an AI version of this person as a young child (based on their features in the photo). This childhood version MUST be in CLASSIC BLACK AND WHITE. The child should be proportionally smaller than the adult, sitting and looking with a natural, innocent smile towards the adult on the right. Elegantly overlay the text "${yearOld}" above the child.
    - Right side: Use the original photo features of the person as they appear now. This present version MUST be in FULL VIBRANT COLOR. The adult should be sitting, looking directly at their younger self with a warm, nostalgic, and "alive" gaze. Elegantly overlay the text "${yearNow}" above the adult.
      
    Setting & Composition:
    - Seating Arrangement: ${seatingCustom && seatingCustom.trim() ? seatingCustom.trim() : (seating === 'facing' ? 'The child and the adult should be sitting directly opposite each other (facing each other) across a table.' : 'The child and the adult should be sitting side-by-side but both turned slightly inward to look at each other across a table.')}
    - On the table directly between them, place a beautiful birthday cake (kue tart) with the number "${cakeNumber}" on it.
    - The date "${dateMonth}" should be subtly integrated or written near the cake.
    - Background: A unified, seamless professional studio background. The background colors should blend naturally across the entire image WITHOUT any sharp vertical lines or color splits. The lighting should bridge the B&W and Color subjects organically.
    - Lighting: Cinematic and warm, making the interaction feel alive and natural throughout the whole scene.
    
    Style & Realism:
    - Professional photography style with a shallow depth of field if appropriate.
    - The child must look significantly smaller than the adult to maintain realistic proportions.
    - The transition from B&W to Color should feel like an artistic aura around the child rather than a divided screen.
    - The picture must look extremely real, like a professional high-end photoshoot.
    
    Fidelity:
    - Keep the person's features very recognizable and consistent across both the child and adult versions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [
          { inlineData: { data: cleanBase64(presentPhoto), mimeType: 'image/png' } },
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

export const upscaleImage = async (image: string, aspectRatio: string = "9:16") => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: "Upscale and enhance this image. Improve sharpness, details, and clarity while maintaining all original features and the emotional black and white aesthetic." }
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
