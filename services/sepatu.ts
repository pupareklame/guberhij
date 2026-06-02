import { getAI, cleanBase64, extractImageFromResponse, getRandomSeed, runWithRetry } from "./geminiService";
import { SepatuConfig } from "../types";

export async function generateSepatu(image: string, config: SepatuConfig): Promise<string> {
  return runWithRetry(async (ai) => {
    const modelId = "gemini-2.5-flash-image";
    
    let prompt = "";
    const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];

    if (config.logo) {
      parts.push({ inlineData: { data: cleanBase64(config.logo), mimeType: 'image/png' } });
    }
    if (config.soleMotif && config.mode === 'SHOWROOM') {
      parts.push({ inlineData: { data: cleanBase64(config.soleMotif), mimeType: 'image/png' } });
    }

    if (config.mode === 'SHOWROOM') {
      const ambiancePrompt = config.showroomAmbiance === 'DARK' 
        ? "Dark elegant theme, moody cinematic lighting, deep shadows, black and charcoal surfaces."
        : config.showroomAmbiance === 'BRIGHT'
        ? "Bright white theme, clean minimalist lighting, airy atmosphere, white and light grey surfaces."
        : "Modern luxury showroom theme.";

      const colorPrompt = config.showroomColor 
        ? `Primary color theme for the room and decor: ${config.showroomColor}. Ensure the lighting and ambient reflections catch this color elegantly.`
        : "";

      const compositionPrompt = config.showroomComposition === 'REARRANGE'
        ? "Rearrange the shoes to a more artistic and interesting hero angle that highlights their best features on the premium wooden table."
        : config.showroomComposition === 'STACKED'
        ? "Two shoes arranged in a stacked composition, one shoe upright showing the side profile and the other shoe tilted forward showing the bottom sole, placed on a clean white background, product photography style, studio lighting"
        : config.showroomComposition === 'DIAGONAL'
        ? "Two shoes arranged in a diagonal side-by-side composition, both showing the side profile, one shoe placed slightly behind and elevated higher than the other, overlapping arrangement, white background, product photography style, studio lighting"
        : config.showroomComposition === 'LEANING_BOX'
        ? "Two shoes leaning against a box, both facing the same direction showing side profile, placed on textured floor surface, striped wall background"
        : config.showroomComposition === 'DIAGONAL_OVERLAP'
        ? "Two shoes arranged in diagonal overlapping composition, both showing side profile, one slightly behind the other, minimal clean background"
        : config.showroomComposition === 'UPRIGHT_SOLE'
        ? "Two shoes, one upright showing side profile and one tilted forward showing the bottom sole, studio background"
        : config.showroomComposition === 'FLOATING_GLASS'
        ? "Single shoe floating on a glass surface, front three-quarter angle view, modern retail interior background with multiple shoes on illuminated wall shelves"
        : "Maintain the exact same placement and angle of the shoes as seen in the uploaded product image.";

      const inputResources: string[] = [];
      inputResources.push("- The first image is the shoe product to be showcased.");
      
      let nextIndex = 2;
      if (config.logo) {
        inputResources.push(`- Image ${nextIndex} is the brand logo to be displayed on the wall.`);
        nextIndex++;
      }
      if (config.soleMotif) {
        inputResources.push(`- Image ${nextIndex} is the outsole / bottom sole motif and pattern. You MUST apply this exact motif structure, color, layout, and pattern design to the footwear's bottom sole if displayed in the composition.`);
        nextIndex++;
      }

      prompt = `
        [SHOE SHOWROOM ADVERTISEMENT]:
        Inputs provided:
        ${inputResources.join("\n        ")}
        
        Generate a professional advertisement for this shoe in a high-end showroom.
        
        [ENVIRONMENT]:
        ${ambiancePrompt}
        ${colorPrompt}
        Ultra realistic premium shoe store interior, cinematic lighting, the primary uploaded shoes placed neatly directly on a luxury wooden table, with one single elegant black shoe box placed elegantly to the side or behind them (the box is not used as a base for the shoes), main product in sharp focus, deep depth of field, NO BOKEH, sharp background, shelves filled with stylish shoes in the background, cozy warm ambient lighting strips, realistic shadows and reflections, high-end commercial product photography style.
        
        [BRANDING]:
        ${config.logo ? 'Place the uploaded brand logo large on the wall behind the product, centered and clearly visible like a luxury showroom branding display. The logo MUST be ultra-sharp, high-resolution, and perfectly clear on the wall with realistic perspective and lighting.' : 'Add subtle luxury branding to the scene.'} Add elegant brand details on the box if suitable.
        
        [COMPOSITION]:
        ${compositionPrompt}
        Extreme close-up shot where the shoes are very close to the lens and dominate the foreground, eye-level perspective with the camera perfectly level with the shoes, hero product shot, premium luxury store advertisement style, clean and minimal layout, luxurious atmosphere, ultra detailed texture, realistic stitching, professional studio quality.
        
        [PRODUCT FIDELITY]:
        Keep the uploaded shoe design exactly the same as in the first image, preserve original shape, color, texture, and details. Do not redesign the shoes. Make the shoes look premium, sharp, and elegant.
        ${config.soleMotif ? `Additionally, if the shoe's outsole or bottom sole is visible in the chosen composition (like the STACKED composition showing the bottom sole), you MUST style the under-sole/bottom sole of the shoe to EXACTLY match the uploaded sole motif image, preserving its design, pattern layout, colors, and line details clearly.` : ''}
        
        [CAMERA & STYLE]:
        85mm lens, deep depth of field, f/8.0, everything in sharp focus, cinematic lighting, ultra realistic, HDR, commercial footwear photography, 8K detail.
        ${config.additionalPrompt ? `\n        [ADDITIONAL INSTRUCTION]: ${config.additionalPrompt}` : ''}
        
        [NEGATIVE PROMPT]:
        bokeh, blurry background, blurry logo, blurry product, distorted shoes, extra shoes in foreground, messy composition, warped logo, low quality, oversaturated colors, cartoon style, unrealistic reflections, duplicate products, text artifacts, watermark.
      `;
    } else if (config.mode === 'POV') {
      const isBlackBoxPreset = config.povPreset === 'blackbox_goldlogo';
      const povEnvironment = config.povPreset || "aesthetic room with books, plants, and natural light";
      
      const ambiancePrompt = config.showroomAmbiance === 'DARK' 
        ? "Dark elegant interior theme, moody cinematic lighting, deep shadows, black or charcoal furniture."
        : config.showroomAmbiance === 'BRIGHT'
        ? "Bright white room interior, clean minimalist daylighting, airy atmosphere, white and light grey furniture."
        : "Cozy beautiful interior style with rich textures and balanced warm ambient light.";

      const colorPrompt = config.showroomColor 
        ? `Primary color theme/accents for the room, furniture, and decor: ${config.showroomColor}. Ensure the room's lighting or reflections catch this color accent elegantly.`
        : "";

      if (isBlackBoxPreset) {
        const logoPrompt = config.logo 
          ? "matte black shoe box with the brand logo from Image 2 [ref: your logo] printed in gold on the front center of the box"
          : "matte black shoe box with an elegant gold logo on the front";

        prompt = `
          [POV PRODUCT PHOTOGRAPHY]:
          The first image is a product photo of a piece of footwear [ref: your shoe image].
          ${config.logo ? 'Image 2 is the brand logo [ref: your logo].' : ''}

          Generate an ultra-realistic POV product photography shot.
          
          [PROMPT / SCENE DESCRIPTION]:
          A hand holding the shoe from the first image [ref: your shoe image], product photography style, in front of a ${logoPrompt}, placed on a wooden table surface, small green snake plant in a white pot slightly blurred in the background, soft warm studio lighting, shallow depth of field bokeh, realistic commercial product photography, 8K ultra detailed.
          
          [CRITICAL FIDELITY REQUIREMENTS]:
          - Preserve the EXACT original design, color, texture, shape, logo, stitching, and details of the uploaded footwear from the first image. 
          - The product must remain identical, sharp, and highly recognizable. 
          - Hand should hold the footwear naturally: the shoe is close to the lens and is the main focus of interest.
          - ABSOLUTELY NO BRANDING OR LOGO ON THE WALL. The wall behind in the background is clean and simple. The logo only appears on the shoe box, not on the wall.
          
          [STYLE]:
          Handheld POV shot, 50mm lens, shallow depth of field, soft warm studio lighting, realistic skin tones on the hand, HDR, ultra detailed texture, cinematic product photography, clean minimal aesthetic, high-end Instagram/TikTok shop style, 8K ultra realistic.
          ${config.additionalPrompt ? `\n        [ADDITIONAL INSTRUCTION]: ${config.additionalPrompt}` : ''}
          
          [NEGATIVE PROMPT]:
          logo on the wall, branding on the wall, logo on wall, wall branding, brand logo on wall, wall logo, distorted footwear, changed design, blurry product, extra fingers, deformed hand, floating shoes, messy background, oversaturated colors, cartoon style, unrealistic shadows, duplicate products, low quality, watermark, text artifacts.
        `;
      } else {
        prompt = `
          [POV PRODUCT PHOTOGRAPHY]:
          The first image is a product photo of a piece of footwear.
          ${config.logo ? 'Image 2 is the brand logo to be displayed seamlessly on the background wall behind.' : ''}

          Generate an ultra-realistic POV product photography shot of this EXACT footwear being held naturally in the foreground by one hand.
          
          [CRITICAL REQUIREMENT]:
          - Preserve the EXACT original design, color, texture, shape, logo, stitching, and details of the uploaded footwear. 
          - The product must remain identical, sharp, and highly recognizable. 
          - Hand should hold the footwear naturally: the shoe is close to the lens and is the main focus of interest.
          
          [BACKGROUND SCENE & ENVIRONMENT]:
          - Background Room Style: ${povEnvironment}. Soft minimalist room interior, luxury lifestyle aesthetic.
          - Background Nuance / Ambiance: ${ambiancePrompt}
          - Background Color Accent: ${colorPrompt}
          - Background Props: Directly behind the hand-held shoe, there must be a premium table (meja) and one single elegant shoe box (kotak sepatu) placed neatly on top of the table. This adds a sense of place and luxury.
          - Wall Branding: ${config.logo ? 'The uploaded brand logo must be displayed clearly and sharply on the wall in the background of the room with realistic perspective and lighting.' : ''}
          - Lighting: Natural window lighting or studio ambient lighting, bright soft shadows, cozy modern atmosphere.
          - Focus & Depth of Field: Hand-held POV angle, the footwear is close to the camera and in tack-sharp focus. The background elements (the table, box, and wall) are slightly blurred with realistic, smooth aesthetic cinematic depth of field. Modern social media catalog style.
          
          [STYLE]:
          Handheld POV shot, 50mm lens, shallow depth of field, soft natural lighting, realistic skin tones on the hand, HDR, ultra detailed texture, cinematic product photography, clean minimal aesthetic, high-end Instagram/TikTok shop style, 8K ultra realistic.
          ${config.additionalPrompt ? `\n        [ADDITIONAL INSTRUCTION]: ${config.additionalPrompt}` : ''}
          
          [NEGATIVE PROMPT]:
          distorted footwear, changed design, blurry product, extra fingers, deformed hand, floating shoes, messy background, oversaturated colors, cartoon style, unrealistic shadows, duplicate products, low quality, watermark, text artifacts.
        `;
      }
    } else {
      const targetLabel = {
        'ANAK_LAKI': 'a young boy',
        'ANAK_PEREMPUAN': 'a young girl',
        'DEWASA_LAKI': 'an adult man',
        'DEWASA_PEREMPUAN': 'an adult woman'
      }[config.target];

      prompt = `
        [FOOTWEAR VIRTUAL TRY-ON]:
        The input image is a product photo of a piece of footwear (shoes, sandals, or boots).
        Generate a professional, ultra-realistic lifestyle photography shot of this EXACT footwear being worn by ${targetLabel}.
        
        [CRITICAL REQUIREMENT]: 
        - The model MUST wear the EXACT same footwear from the input image. 
        - Do NOT improvise, do NOT add extra straps, laces, patterns, or logos that are not in the original product photo.
        - Maintain the original colors, materials, and textures precisely.
        - If it is a sandal, ensure the model's toes and feet are visible realistically within the footwear.
        ${config.additionalPrompt ? `\n      [ADDITIONAL INSTRUCTION]: ${config.additionalPrompt}` : ''}
        
        [SCENE]:
        - Focus: Lower legs and feet only.
        - Environment: ${config.environment}.
        ${config.orientation ? `- Camera Perspective/Angle: ${config.orientation}.` : ''}
        - Atmosphere: Professional footwear catalog/commercial style.
        - Lighting: Match the ${config.environment} perfectly with realistic shadows and reflections.
        
        High quality, 8k resolution, ultra-detailed textures, realistic skin, professional fashion photography.
      `;
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio as any },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(response);
  });
}
