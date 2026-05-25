
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";

// Inisialisasi AI selalu mengambil API_KEY terbaru dari environment
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

const handleApiError = (err: any) => {
  console.error("3D Service Error:", err);
  const msg = err?.message || "";
  if (msg.includes("429")) {
    throw new Error("API LIMIT: Kecepatan akses terlalu tinggi. Tunggu sebentar.");
  }
  throw new Error(msg || "Gagal merender 3D. Silakan coba lagi.");
};

export const generate3DImage = async (image: string, config: any) => {
  try {
    const ai = getAI();
    const styleMap: Record<string, string> = {
      'PIXAR': 'Pixar animation style, high-end 3D CGI render, subsurface scattering, expressive eyes, vibrant colors, soft shadows.',
      'DISNEY': 'Modern Disney 3D animation style, magical lighting, highly detailed textures, whimsical atmosphere.',
      'ANIME_3D': '3D Anime style (like Gantz:O or Stand By Me Doraemon), cel-shaded 3D, sharp features, dynamic lighting.',
      'REALISTIC_3D': 'Hyper-realistic 3D render, Unreal Engine 5 style, cinematic lighting, ray-tracing, PBR textures.',
      'CLAYMATION': 'Stop-motion claymation style, handcrafted texture, fingerprints on clay, charmingly imperfect, physical material feel.',
      'TOY_STORY': 'Toy-like 3D style, plastic and fabric textures, miniature scale feel, studio product lighting.',
      'KIDS_REAL': "Realistic version of a child's drawing. CRITICAL: Treat the drawing as a literal blueprint for a real-world physical entity. DO NOT FIX or tidy up the architecture. If eyes are tilted or crooked, keep them tilted. If limbs are as thin as sticks, keep them as thin as sticks. Strictly follow the exact silhouette, geometry, and non-proportional shapes. If a fish is drawn as a square, it MUST be rendered as a realistic, physical square creature. Do not fix anatomy. Apply hyper-realistic real-life textures (skin pores, wet scales, realistic eyes, hair) to these weird shapes. The goal is to show what it would look like if this specific distorted creature actually existed in the real world. Cinematic lighting, surreal and uncanny photorealism.",
      'CUSTOM': config.customStyle || 'Unique 3D artistic style.'
    };

    const prompt = config.style === 'KIDS_REAL' 
      ? `[PHOTOREALISTIC CHILD DRAWING INTERPRETATION]
      1. MAIN INSTRUCTION: Create a high-resolution, photorealistic interpretation of this child's hand-drawn sketch. This applies to ANYTHING drawn: creatures, monsters, vehicles, buildings, or everyday objects. The key is to EXACTLY PRESERVE the anatomically "wrong", non-proportional, and bizarre basic shapes of the drawing, but render them as if they were real living entities or physical objects in a natural environment.
      2. PRESERVE FORM: Mimic the rough lines, irregular geometric shapes, and exaggerated proportions perfectly. If a car has five square wheels or a house is shaped like a lopsided triangle, keep those shapes exactly as they are in the realistic version. DO NOT "FIX" the geometry or anatomy.
      3. APPLY TEXTURES: Apply realistic textures based on the subject (fur, skin, metal, glass, stone, fabric, wood, water, etc.). Use high-detail textures like rusted metal, skin pores, or realistic fabric weaves.
      4. LIGHTING & DEPTH: Use natural, detailed lighting (soft sunlight or directed studio lighting) to provide volume and depth to the bizarre shapes. Add realistic shadows and reflections to make it look solid and 3D.
      5. ENVIRONMENTAL CONTEXT: Place the strange object/creature in a matching photorealistic environment (green meadow, city street, space, or textured background like wood/cement). Use a shallow depth of field to highlight the main subject.
      6. REFERENCE PAPER: Include a small representation of the original sketch paper in the frame (e.g., in a corner or foreground) as a visual reference to contrast the input and output.
      7. ADDITIONAL DETAILS: Interpret weird or unidentifiable elements realistically (e.g., human-like hands on a car or irregular spots on a building). Make these look like natural features of the object.
      8. ASPECT RATIO: ${config.aspectRatio}.`
      : `[ULTIMATE 3D TRANSFORMATION MASTERPIECE]: 
      1. TASK: Completely re-render this 2D image into a professional 3D CGI masterpiece.
      2. MEDIUM: Digital 3D Sculpting, ZBrush modeling, and Octane/Redshift Render quality.
      3. STYLE: ${styleMap[config.style] || styleMap['PIXAR']}
      4. LIGHTING: Volumetric lighting, global illumination, rim lighting, and cinematic depth of field.
      5. TEXTURES: High-end Physically Based Rendering (PBR) textures (realistic skin pores, fabric weave, hair strands) rendered with immense 3D volume.
      6. CHARACTER/GEOMETRY: Maintain the recognizable likeness and soul of the subject but fully translate them into a high-fidelity 3D character model.
      7. DEPTH: Ensure extreme 3D depth perception. The subject must pop out from the background.
      8. INTENSITY: ${config.intensity}% transformation depth (Total 3D overhaul).
      9. ASPECT RATIO: ${config.aspectRatio}.
      CRITICAL: The final output must look like a high-budget 3D animated movie frame or a professional 3D character portfolio render. ABSOLUTELY NO 2D remnants.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: prompt }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio || "1:1" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = "1:1") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Upscale and enhance this 3D render to ultra HD 8K detail. Sharp, clear, and professional cinematic quality.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};
