
/**
 * [INTEGRITY-CHECK]: 0x72757461696E696D
 * STATUS: PROTECTED-V1
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";

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
  useFinger: boolean = true,
  cameraAngle: string = "high_distortion",
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

    // Camera Angle description
    let angleDesc = "A macro close-up photograph taken with an extreme wide-angle, slightly distorted lens, looking down from a front-high angle directly above the head. The camera is positioned dramatically close to the top of the miniature figurine's head, causing the figurine to look almost straight up towards the lens. This angle creates a powerful perspective distortion, where the figurine's head and the sunglasses are comically enlarged, and the body, hands, and barefoot feet recede rapidly, appearing significantly smaller. The small feet are positioned further away from the lens.";
    
    if (cameraAngle === "gulliver") {
      angleDesc = "A low-angle macro photograph, where the camera is positioned on the ground level of a hand-held palm, looking dramatically upward at a standing miniature figurine. From this perspective, the figurine's legs and barefoot feet are prominent and large, towering over the 'terrain' of the hand. The tiny head and torso recede into the upper frame.";
    } else if (cameraAngle === "isometric") {
      angleDesc = "A clean, slightly high-angle isometric view looking down upon a miniature figurine and a detailed diorama scene set within a cupped human hand. The angle is consistent, creating a sense of a structured, to-scale miniature world rather than heavy perspective distortion.";
    } else if (cameraAngle === "profile") {
      angleDesc = "A direct eye-level macro close-up shot, capturing a miniature figurine standing barefoot on a human palm in a pure profile view. The perspective shows the full scale difference.";
    } else if (cameraAngle === "finger_pov") {
      angleDesc = "A close-up, super wide-angle, almost fisheye distorted shot from the perspective of a giant human finger as it approaches a miniature figurine. The camera is aligned with the finger, looking straight at the doll's face. The finger itself is massive and fills much of the frame from the front. The figurine's face is comically large and distorted, directly in front of the lens.";
    }

    const headProp = "significantly and comically enlarged compared to its small, delicate body, forming an EXTREME INVERTED TRIANGLE shape. The head MUST be the widest part, with the torso narrowing sharply, and the legs and feet appearing tiny and receding rapidly into the distance. This is a STRICT MANDATORY REQUIREMENT for the bobblehead effect (head takes up ~60% of total visual height).";
    const interactionDesc = useFinger 
      ? "On the right side of the frame, a large human finger is gently poking or squishing the doll's oversized cheek, which visibly indents to show squishiness and realistic skin texture."
      : "No human fingers are touching the doll; the focus is purely on the miniature figure standing alone on the palm.";

    const parts: any[] = [
      { 
        inlineData: { 
          data: cleanBase64(personImage), 
          mimeType: 'image/png' 
        } 
      },
      {
        text: `[MINIATURE TRANSFORMATION TASK]:
        Create a high-resolution, close-up photograph of a miniature, lifelike bobblehead-style figurine based on the person in the reference photo.
        
        1. IDENTITY: The figurine MUST be modeled after the full-sized person in the reference photo. Maintain their EXACT facial features, identity, gender, and current expression. If they have sunglasses or specific accessories in the photo, include them.
        2. CAMERA ANGLE & PERSPECTIVE: ${angleDesc}
        3. SCENE: The figurine is ${poseDesc} within the open palm of a large, detailed human hand. The hand is cupped to hold the entire miniature figure.
        4. PROPORTIONS: The doll's head is ${headProp}. The body MUST be tiny, short, and delicate to emphasize the oversized head.
        5. CLOTHING: Preserve the EXACT clothing from the reference photo (colors, patterns, and style).
        6. INTERACTION: ${interactionDesc}
        7. STYLE: Macro realism, professional photography. The skin must look like real human skin with pores and natural texture, NOT plastic or toy-like.
        8. BACKGROUND: A highly detailed and heavily depth-of-field blurred (shallow DoF) street scene from a balcony, making the foreground interaction sharp and clear while the world outside is an impressionistic, out-of-focus bokeh of buildings and street activity.
        9. LIGHTING: Natural daylight, soft shadows, cinematic highlights.
        10. OUTPUT: High resolution ${aspectRatio} image, absolute facial resemblance, masterpiece quality.`
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
  useFinger: boolean = true,
  cameraAngle: string = "high_distortion",
  password?: string
) => {
  const correctPassword = process.env.MINIATUR_PASSWORD || "rutainim";
  if (password !== correctPassword) {
    throw new Error("Akses Ditolak: Kunci Keamanan Tidak Valid.");
  }

    try {
    const ai = getAI();
    
    // Camera Angle description
    let angleDesc = "A macro close-up photograph taken with an extreme wide-angle, slightly distorted lens, looking down from a front-high angle directly above the heads. The camera is positioned dramatically close to the miniature figurines' heads, causing them to look almost straight up towards the lens. This angle creates a powerful perspective distortion, where the figurines' heads are comically enlarged, and the bodies recede rapidly, appearing significantly smaller.";
    
    if (cameraAngle === "gulliver") {
      angleDesc = "A low-angle macro photograph, where the camera is positioned on the ground level of a hand-held palm, looking dramatically upward at the miniature figurines. From this perspective, the figurines' legs and barefoot feet are prominent and large, towering over the 'terrain' of the hand.";
    } else if (cameraAngle === "isometric") {
      angleDesc = "A clean, slightly high-angle isometric view looking down upon a group of miniature figurines and a detailed diorama scene set within a cupped human hand. The angle is consistent, creating a sense of a structured, to-scale miniature world.";
    } else if (cameraAngle === "profile") {
      angleDesc = "A direct eye-level macro close-up shot, capturing a group of miniature figurines standing barefoot on a human palm in a pure profile view.";
    } else if (cameraAngle === "finger_pov") {
      angleDesc = "A close-up, super wide-angle, almost fisheye distorted shot from the perspective of a giant human finger as it approaches the miniature figurines. The figurines' faces are comically large and distorted.";
    }

    const headProp = "significantly and comically enlarged compared to their small, delicate bodies, forming EXTREME INVERTED TRIANGLE shapes. For every person, the head MUST be the widest part, with the torso narrowing sharply, and the legs and feet appearing tiny and receding rapidly. This is a STRICT MANDATORY REQUIREMENT for the bobblehead effect (heads take up ~60% of total visual height).";
    const interactionDesc = useFinger 
      ? "On the right side of the frame, a large human finger is gently poking or squishing one of the doll's oversized cheeks, which visibly indents to show squishiness and realistic skin texture."
      : "No human fingers are touching the dolls; the focus is purely on the miniature group standing alone on the palm.";

    const parts: any[] = [
      { 
        inlineData: { 
          data: cleanBase64(groupImage), 
          mimeType: 'image/png' 
        } 
      },
      {
        text: `[GROUP MINIATURE TRANSFORMATION TASK]:
        Create a high-resolution, close-up photograph of a group of miniature, lifelike bobblehead-style figurines based on the people in the reference photo.
        
        1. IDENTITY: Every figurine MUST be modeled after the corresponding person in the reference photo. Maintain their EXACT facial features, identity, gender, and current expression.
        2. COUNT & POSE: The number of people MUST match the input photo exactly. Replicate their exact pose and relative positions. ${poseDescription ? `Additional pose context: ${poseDescription}.` : ""}
        3. CAMERA ANGLE & PERSPECTIVE: ${angleDesc}
        4. SCENE: The group of figurines is standing within the open palm of a large, detailed human hand. The hand is cupped to hold the entire miniature group.
        5. PROPORTIONS: Every doll's head is ${headProp}. The bodies MUST be tiny, short, and delicate to emphasize the oversized heads.
        6. CLOTHING: Preserve the EXACT clothing from the reference photo for every person.
        7. INTERACTION: ${interactionDesc}
        8. STYLE: Macro realism, professional photography. The skin must look like real human skin with pores and natural texture, NOT plastic or toy-like.
        9. BACKGROUND: A highly detailed and heavily depth-of-field blurred (shallow DoF) street scene from a balcony, making the foreground interaction sharp and clear while the world outside is an impressionistic, out-of-focus bokeh of buildings and street activity.
        10. LIGHTING: Natural daylight, soft shadows, cinematic highlights.
        11. OUTPUT: High resolution ${aspectRatio} image, absolute facial resemblance for all characters, masterpiece quality.`
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
