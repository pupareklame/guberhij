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
    } else if (config.mode === 'POSTER') {
      const subtitle = config.posterSubtitle || "FUTURE OF RUNNING";
      const title = config.posterTitle || "NEO FAST";
      
      const inputResources: string[] = ["- Image 1 is the main shoe product [SHOE_IMAGE] to be showcased in the poster."];
      if (config.logo) {
        inputResources.push("- Image 2 is the brand logo [LOGO_IMAGE] to be placed centered above the text area.");
      }

      let backgroundDesc = "Background should be dark black with depth and bokeh effects. Include abstract futuristic geometric symbols and floating glowing elements in blue and orange colors. Add soft blur and cyber-tech atmosphere.";
      if (config.posterPreset === 'GLITTER') {
        backgroundDesc = "Background should be luxurious with sparkling and shimmering gold and silver glitter particles, beautiful scattering light bokeh effects, luxury deep dark background with high-end vibes.";
      } else if (config.posterPreset === 'LIGHTNING') {
        backgroundDesc = "Background should be a dramatic dark stormy sky with energetic bright electric lightning bolts flashing, neon light blue and magenta contrasting hues, sparking cybernetic energy.";
      } else if (config.posterPreset === 'SMOKE') {
        backgroundDesc = "Background should be filled with thick mysterious cold nitrogen smoke and fog clouds rolling and floating, dark professional product photography studio stage setup with dramatic spotlights.";
      } else if (config.posterPreset === 'LAVA') {
        backgroundDesc = "Background should be deep obsidian volcanic rocks with glowing magma lava cracks, bright orange fire sparks and embers floating upwards, heat distortion and intense dark energy.";
      } else if (config.posterPreset === 'GEOMETRIC') {
        backgroundDesc = "Background should be an abstract 3D geometric art room, clean composition with floating modern minimal 3D geometrical shapes, smooth pastel neon color gradients, luxury product gallery setup.";
      } else if (config.posterPreset === 'STREET_NEON') {
        backgroundDesc = "Background should be a wet urban street pavement at night, reflecting bright neon signs and street lights, cinematic cyberpunk alley environment with beautiful bokeh and deep contrast.";
      } else if (config.posterPreset === 'DARK_MINIMAL') {
        backgroundDesc = "Background should be a professional high-end pitch black minimalist photo studio backdrops, extreme clean dark space, soft spotlight glow, keeping focus entirely on the floating shoe object.";
      } else if (config.posterPreset === 'ROYAL') {
        backgroundDesc = "Background should be a grand majestic royal palace interior out of focus, rich crimson red velvet drapes, elegant gold ornaments, warm glowing chandelier lights, and opulent luxury atmosphere.";
      } else if (config.posterPreset === 'VINTAGE') {
        backgroundDesc = "Background should have a nostalgic classic vintage aesthetic, sepia-toned retro moody lighting, old dusty wooden shelves in the background, classic timeless vibe, and analog film grain texture.";
      } else if (config.posterPreset === 'PREMIUM_LEATHER') {
        backgroundDesc = "Background should be rich dark brown premium leather texture and dark mahogany wood, high-end gentleman club aesthetic, soft warm ambient lighting, elegant and sophisticated artisan vibes.";
      } else if (config.posterPreset === 'STEAMPUNK') {
        backgroundDesc = "Background should be a moody steampunk engine room, antique brass gears and vintage clockwork mechanisms, warm golden hour lighting, steam effects, Victorian industrial aesthetic.";
      } else if (config.posterPreset === 'LUXURY_SPLASH') {
        backgroundDesc = "Background should be a luxury advertisement, dramatic splash, high-speed photography, dynamic composition, premium lighting, glossy reflections, blue ocean tones, crystal-clear water droplets, cinematic atmosphere, shallow depth of field, photorealistic, award-winning commercial poster.";
      }

       let textColorDesc = "CRITICAL: The title font MUST be exactly Times New Roman Bold (heavy, ultra bold classic serif typeface). Every single letter must show the distinctive transitional thick-and-thin Roman stroke weights and elegant prominent bracketed serifs. Absolutely no blocky, sporty, or modern sans-serif fonts are allowed. The first word must be rendered in an orange gradient and the second word in a white/silver gradient with an elegant glow.";
       if (config.posterTitleColor === 'GOLD') {
         textColorDesc = "CRITICAL: The title font MUST be exactly Times New Roman Bold (heavy, ultra bold classic serif typeface). Every single letter must show the distinctive transitional thick-and-thin Roman stroke weights and elegant prominent bracketed serifs. Absolutely no blocky, sporty, or modern sans-serif fonts are allowed. Style the text in a highly polished, luxurious 3D metallic gold gradient with bright highlights and golden glow.";
       } else if (config.posterTitleColor === 'CYAN_BLUE') {
         textColorDesc = "CRITICAL: The title font MUST be exactly Times New Roman Bold (heavy, ultra bold classic serif typeface). Every single letter must show the distinctive transitional thick-and-thin Roman stroke weights and elegant prominent bracketed serifs. Absolutely no blocky, sporty, or modern sans-serif fonts are allowed. Style the text in vibrant neon cyan and futuristic 3D blue glowing letters.";
       } else if (config.posterTitleColor === 'EMERALD') {
         textColorDesc = "CRITICAL: The title font MUST be exactly Times New Roman Bold (heavy, ultra bold classic serif typeface). Every single letter must show the distinctive transitional thick-and-thin Roman stroke weights and elegant prominent bracketed serifs. Absolutely no blocky, sporty, or modern sans-serif fonts are allowed. Style the text in sleek emerald green and white glossy letters with a bright sci-fi glow.";
       } else if (config.posterTitleColor === 'LAVA_RED') {
         textColorDesc = "CRITICAL: The title font MUST be exactly Times New Roman Bold (heavy, ultra bold classic serif typeface). Every single letter must show the distinctive transitional thick-and-thin Roman stroke weights and elegant prominent bracketed serifs. Absolutely no blocky, sporty, or modern sans-serif fonts are allowed. Style the text in an aggressive, bright burning lava-red and flaming magma-orange glowing 3D texture.";
       } else if (config.posterTitleColor === 'SILVER') {
         textColorDesc = "CRITICAL: The title font MUST be exactly Times New Roman Bold (heavy, ultra bold classic serif typeface). Every single letter must show the distinctive transitional thick-and-thin Roman stroke weights and elegant prominent bracketed serifs. Absolutely no blocky, sporty, or modern sans-serif fonts are allowed. Style the text in metallic polished chrome and silver with retro speed highlights.";
       } else if (config.posterTitleColor === 'CUSTOM' && config.posterTitleColorCustom) {
         textColorDesc = `CRITICAL: The title font MUST be exactly Times New Roman Bold (heavy, ultra bold classic serif typeface). Every single letter must show the distinctive transitional thick-and-thin Roman stroke weights and elegant prominent bracketed serifs. Absolutely no blocky, sporty, or modern sans-serif fonts are allowed. Style the text in high-end dynamic gradient typography colored in: "${config.posterTitleColorCustom}" with a premium metallic finish and bright glow.`;
       }

      let shoeDisplayDesc = `Use the uploaded shoe image [ref: Image 1, your shoe image] as the main object. Extract only one shoe and place it in side profile view facing right. Preserve all details, colors, materials, textures, and branding exactly from the original shoe image.
        The shoe should float in the center with dramatic cinematic lighting, glowing edges, soft shadows, and subtle reflections underneath.`;
      
      if (config.posterShoeDisplay === 'PAIR_WITH_BOX') {
        shoeDisplayDesc = `Use the uploaded shoe image [ref: Image 1, your shoe image] as the main object. Showcase a matching PAIR of these shoes (left and right shoes arranged together dynamically) positioned beautifully next to or leaning on their premium custom shoe cardboard box (as seen on store shelf displays). Preserve all details, colors, materials, textures, and branding exactly from the original shoe image.
        The shoe pair and their box should be the center focus of the scene with dramatic cinematic lighting, soft shadows, and subtle reflections underneath.`;
      }

      prompt = `
        [PREMIUM FUTURISTIC SPORTS SHOE ADVERTISING POSTER]:
        Inputs provided:
        ${inputResources.join("\n        ")}

        Create a premium futuristic sports shoe advertising poster in vertical 9:16 aspect ratio.
        ${shoeDisplayDesc}
        
        [BRANDING & TEXT DECORATION]:
        ${config.logo ? 'Place the uploaded logo from Image 2 [ref: your logo] above the text area, centered. Make the logo slightly glowing with neon blue lighting.' : 'Place an elegant futuristic glowing logo above the text area, centered.'}
        
        Below the logo, add a small italic uppercase subtitle:
        "${subtitle}"
        using a modern racing font, white with light blue glow.
        
        Add a large bold title:
        "${title}"
        CRITICAL RULE: This title "${title}" MUST be rendered ONLY, SOLELY, and EXCLUSIVELY using the iconic classic fonts "Times New Roman Bold" (heavy serif, ultra bold Roman typography with highly prominent sharp bracketed serifs). You are STRICTLY FORBIDDEN from using sporty blocky, modern sans-serif, rounded, or sans-serif digital style fonts. Every letter must show traditional thick-and-thin Roman line weight variations and well-defined classic sharp serifs. Only "Times New Roman Bold" typeface is permitted.
        ${textColorDesc}
        
        [BACKGROUND & ENVIRONMENT]:
        ${backgroundDesc}
        
        [STYLE & COMPOSITION]:
        Use cinematic contrast, volumetric lighting, high-end commercial advertising style, luxury sports campaign, ultra realistic rendering, premium product photography, 8k details, sharp focus, dynamic composition.
        No people, no extra shoes, no watermark, no text distortion.
        
        [NEGATIVE PROMPT]:
        low quality, blurry, ${config.posterShoeDisplay === 'PAIR_WITH_BOX' ? 'multiple duplicate random shoes (only one pair of matching shoes is allowed)' : 'duplicate shoes, multiple shoes'}, cropped shoe, distorted text, broken logo, watermark, people, hands, feet, extra objects, oversaturated colors, messy composition, bad anatomy, low resolution, noisy image, unrealistic proportions
      `;
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
