
/**
 * [INTEGRITY-CHECK]: 0x72757461696E696D
 * STATUS: PROTECTED-V1
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

const extractImageFromResponse = (response: GenerateContentResponse) => {
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    const finishReason = candidate?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error("Gagal menghasilkan gambar. Konten diblokir oleh filter keamanan AI (mungkin mengandung unsur yang tidak diperbolehkan).");
    } else if (finishReason === 'RECITATION') {
      throw new Error("Gagal menghasilkan gambar. Konten diblokir karena masalah hak cipta (copyright).");
    }
    throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk atau menolak permintaan.");
  }
  
  const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
  if (imagePart?.inlineData?.data) {
    return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
  }

  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

/**
 * Merubah orang biasa menjadi miniatur kecil di atas telapak tangan manusia.
 */
export const createMiniature = async (
  personImage: string, 
  aspectRatio: string = "9:16", 
  pose: string = "standing",
  headType: 'large' | 'normal' = 'large',
  password?: string
) => {
  // Security Gate: Check for password
  const correctPassword = process.env.MINIATUR_PASSWORD || "rutainim";
  if (password !== correctPassword) {
    throw new Error("Akses Ditolak: Kunci Keamanan Tidak Valid.");
  }

  try {
    const ai = getAI();
    
    // Pose description
    let poseDesc = "standing upright";
    if (pose === "sitting") poseDesc = "sitting comfortably on a tiny miniature chair";
    else if (pose === "motorcycle") poseDesc = "riding a detailed tiny miniature motorcycle";
    else if (pose === "sleeping") poseDesc = "sleeping curled up peacefully";
    else if (pose === "dancing") poseDesc = "in a dynamic, energetic dancing pose";

    // Scale description (relative to human palm)
    let sizeDesc = "Impressive scale: about 30-35 cm tall, standing firmly in the center of the palm. The character has a significant physical presence, appearing as a large, solid figure relative to the hand.";
    let lensDesc = "extreme macro photography, 100mm macro lens, very shallow depth of field, focus sharply on the character's face";
    let interactionDesc = "A real human finger and thumb gently pinch the miniature character's cheek, causing a realistic skin squish effect, emphasizing the size comparison and the soft, realistic skin texture.";

    const headProp = headType === 'large' 
      ? "4.5x (SUPER GIANT HEAD style: The head MUST be the most dominant feature, taking up more than 50% of the total character height. It is a massive, hyper-realistic bobblehead. The body MUST be tiny, short, and miniature. This is a STRICT MANDATORY REQUIREMENT.)" 
      : "2.5x (Big Head style: The head MUST be clearly and significantly larger than the body, creating a distinct caricature look)";

    const parts: any[] = [
      { 
        inlineData: { 
          data: cleanBase64(personImage), 
          mimeType: 'image/png' 
        } 
      },
      {
        text: `[MINIATURE TRANSFORMATION TASK]:
        1. ANALYZE & EXTRACT: Identify the EXACT person/character in the uploaded image. The facial features, bone structure, and identity MUST be 100% preserved and recognizable. Keep their hair and clothing identical. Strictly preserve the gender (women remain women, men remain men).
        CRITICAL COUNT RULE: The output MUST contain ONLY ONE person. Do NOT add any other people, babies, or animals. 
        2. TRANSFORM: Create a hyper-realistic miniature human version of this exact person.
        3. SCENE: The miniature human is ${poseDesc} on a real human palm. The palm acts as the ground.
        4. CHARACTER: The character MUST have a head proportion of ${headProp}. 
        MANDATORY RULE: The head MUST be MASSIVE and take up at least half of the total character height. If the head is not clearly giant, the generation is a FAILURE. The body MUST be extremely small, shortened, and cute (toddler-like proportions) to emphasize the giant head. The facial features and skin MUST remain hyper-realistic and photorealistic, NOT cartoonish.
        5. SKIN TEXTURE: AVOID any plastic, synthetic, or toy-like appearance. The skin MUST look like real human skin with natural pores, subtle imperfections, and realistic subsurface scattering. 
        6. DETAILS: Highly detailed facial features, expressive face, realistic hair strands, and natural clothing fabric folds.
        7. INTERACTION: ${interactionDesc}
        8. SCALE: ${sizeDesc}. The scale comparison between the human hand and the miniature human is the main focus. The character should look very large and detailed on the hand, dominating the palm area.
        9. STYLE: Macro realism, high-end professional photography, cute but photorealistic miniature human. NO plastic textures.
        10. CAMERA: ${lensDesc}.
        11. CAMERA ANGLE: Eye level with the miniature character or slightly low angle to emphasize scale difference relative to the hand.
        12. LIGHTING: Soft natural indoor lighting, warm tone, cinematic shadows, natural highlights on skin.
        13. BACKGROUND: Soft blurred environment with strong bokeh to emphasize macro scale.
        14. DETAIL LEVEL: Ultra detailed, photorealistic skin texture, visible skin pores, realistic hair strands, detailed cloth folds, high texture fidelity, professional photography quality, 8k resolution.
        15. OUTPUT: High resolution ${aspectRatio} image, masterpiece quality, absolute facial resemblance.`
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Miniature Service Error:", err);
    throw new Error(err?.message || "Gagal membuat miniatur. Silakan coba lagi.");
  }
};

/**
 * Merubah grup orang (berdua, bertiga, dll) menjadi miniatur sesuai pose asli di foto.
 */
export const createGroupMiniature = async (
  groupImage: string, 
  aspectRatio: string = "9:16", 
  poseDescription: string = "",
  headType: 'large' | 'normal' = 'large',
  password?: string
) => {
  const correctPassword = process.env.MINIATUR_PASSWORD || "rutainim";
  if (password !== correctPassword) {
    throw new Error("Akses Ditolak: Kunci Keamanan Tidak Valid.");
  }

    try {
    const ai = getAI();
    
    let sizeDesc = "Impressive scale: about 30-35 cm tall, standing firmly in the center of the palm. The characters have a significant physical presence, appearing as large, solid figures relative to the hand.";

    const headProp = headType === 'large' 
      ? "4.5x (SUPER GIANT HEAD style: Every single person in the group MUST have a head that takes up more than 50% of their total height. Massive, hyper-realistic bobbleheads. The bodies MUST be tiny and short. This is a STRICT MANDATORY REQUIREMENT for ALL characters.)" 
      : "2.5x (Big Head style: Every person's head MUST be clearly and significantly larger than their body)";

    const parts: any[] = [
      { 
        inlineData: { 
          data: cleanBase64(groupImage), 
          mimeType: 'image/png' 
        } 
      },
      {
        text: `[GROUP MINIATURE TRANSFORMATION TASK]:
        1. ANALYZE & EXTRACT: Identify ALL people/characters in the uploaded image. Preserve their identities, faces, hair, and clothing EXACTLY. Strictly preserve the gender of each person (women remain women, men remain men).
        CRITICAL COUNT RULE: The number of people in the output MUST match the EXACT number of people in the input image. If there are 2 people in the photo, generate EXACTLY 2 people. If there are 3, generate EXACTLY 3. Do NOT add or remove any people.
        2. POSE REPLICATION: The miniature versions MUST maintain the EXACT SAME POSE and relative positions as seen in the uploaded image. This includes complex interactions like carrying a child, hugging, or sitting. REPLICATE THE POSE PERFECTLY, do not force them to stand if they are not standing in the photo. ${poseDescription ? `Additional pose context: ${poseDescription}.` : ""}
        3. TRANSFORM: Create hyper-realistic miniature human versions of these people.
        4. SCENE: The entire group is placed on a real human palm. The palm acts as the ground.
        5. CHARACTER: Every single character in the group MUST have a head proportion of ${headProp}. 
        MANDATORY RULE: Every person's head, whether in the foreground or background, MUST be MASSIVE and take up at least half of their total height. If the heads are not clearly giant, the generation is a FAILURE. Their bodies MUST be extremely small, shortened, and cute. Ensure ALL characters in the scene follow this proportion consistently. The facial features and skin MUST remain hyper-realistic and photorealistic, NOT cartoonish.
        6. SCALE: ${sizeDesc}. The scale comparison between the human hand and the miniature group is the main focus. The characters should look large and detailed on the hand, dominating the palm area.
        7. STYLE: Macro realism, high-end professional photography. NO plastic textures.
        8. CAMERA: extreme macro photography, focus sharply on the characters.
        9. LIGHTING: Soft natural indoor lighting, warm tone.
        10. BACKGROUND: Soft blurred environment with strong bokeh.
        11. OUTPUT: High resolution ${aspectRatio} image, masterpiece quality, absolute facial resemblance for all characters.`
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(response);
  } catch (err: any) {
    console.error("Group Miniature Service Error:", err);
    throw new Error(err?.message || "Gagal membuat miniatur grup. Silakan coba lagi.");
  }
};

/**
 * Menganalisis pose dari gambar dan mengembangkan deskripsi pose.
 */
export const analyzePoseFromImage = async (image: string, currentDescription: string = "") => {
  try {
    const ai = getAI();
    const parts: any[] = [
      { 
        inlineData: { 
          data: cleanBase64(image), 
          mimeType: 'image/png' 
        } 
      },
      {
        text: `Analyze the pose and relative positions of the people in this image. 
        Then, create a highly descriptive and detailed English prompt that describes this exact pose for an AI image generator.
        The description should be concise but capture the essence of the interaction (e.g., "sitting on a bench with legs crossed", "hugging from behind", "standing side-by-side with arms around shoulders").
        If the user provided some context: "${currentDescription}", incorporate and expand upon it.
        Return ONLY the descriptive text, nothing else.`
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
    });

    return response.text?.trim() || currentDescription;
  } catch (err: any) {
    console.error("Analyze Pose Error:", err);
    throw new Error("Gagal menganalisis pose gambar.");
  }
};
