
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { PasFotoConfig, KidsModelConfig, AnimeConfig, FusionConfig, GabungConfig, HaluConfig, MockUpConfig, ExpandConfig, GuberProdukConfig, WeddingConfig, SceneConfig, FotoFashionConfig } from "../types";

// Inisialisasi AI dengan dukungan rotasi multiple API Keys untuk menghindari rate limit
let blacklistedKeys: Set<string> = new Set();

// Fungsi internal untuk mengambil kunci dan instance
const getAIInternal = () => {
  const hardcodedKeys = [
    "AIzaSyA4773itrisKLmwTPvlE39gZJObqpq-A3Y",
    "AIzaSyAgmiGa30Iwrx0MafwzYz7Vh0XxyaLfPtk",
    "AIzaSyAjBj_lsDMoxk6h330-Iksy1U_-XlpEvpQ"
  ];
  
  const keys: string[] = [...hardcodedKeys];
  const isValidFormat = (k: string) => k && k.length > 20 && k.startsWith("AIza");

  if (process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY.split(",").forEach(k => {
      const trimmed = k.trim();
      if (isValidFormat(trimmed)) keys.push(trimmed);
    });
  }
  
  if (process.env.MY_EXTRA_KEYS) {
    process.env.MY_EXTRA_KEYS.split(",").forEach(k => {
      const trimmed = k.trim();
      if (isValidFormat(trimmed)) keys.push(trimmed);
    });
  }
  
  for (let i = 1; i <= 10; i++) {
    const key = (process.env as any)[`MY_EXTRA_KEYS_${i}`];
    if (key) {
      const trimmed = key.trim();
      if (isValidFormat(trimmed)) keys.push(trimmed);
    }
  }
  
  const uniqueKeys = Array.from(new Set(keys));
  let availableKeys = uniqueKeys.filter(k => !blacklistedKeys.has(k));
  
  if (availableKeys.length === 0) {
    blacklistedKeys.clear();
    availableKeys = uniqueKeys;
  }
  
  const selectedKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
  return { genAI: new GoogleGenAI({ apiKey: selectedKey }), key: selectedKey };
};

// Export getAI yang lama agar tidak merusak file modular lain
export const getAI = () => {
  const { genAI } = getAIInternal();
  return genAI;
};

// Wrapper untuk menjalankan fungsi AI dengan retry otomatis jika kena limit
export const runWithRetry = async (operation: (ai: any) => Promise<any>, maxRetries = 3) => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    const { genAI, key } = getAIInternal();
    try {
      return await operation(genAI);
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || "";
      
      if (msg.includes("429") || msg.includes("quota")) {
        console.warn(`Key ${key.substring(0, 6)}... kena limit. Mencoba kunci lain (${i + 1}/${maxRetries})`);
        blacklistedKeys.add(key);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw err;
    }
  }
  return handleApiError(lastError);
};

export const cleanBase64 = (base64: string) => {
  return base64.split(',')[1] || base64;
};

export const extractImageFromResponse = (response: GenerateContentResponse) => {
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    const finishReason = candidate?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error("Permintaan ditolak oleh filter keamanan AI. Silakan coba dengan prompt atau gambar lain.");
    }
    if (finishReason === 'RECITATION') {
      throw new Error("Permintaan ditolak karena terdeteksi konten hak cipta. Silakan coba lagi.");
    }
    throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk atau permintaan dibatasi.");
  }
  const part = candidate.content.parts.find((p: any) => p.inlineData);
  if (part?.inlineData?.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Data visual tidak ditemukan dalam respon AI. Coba lagi dalam beberapa saat.");
};

// Fungsi pembantu untuk menghasilkan seed acak agar tidak limit
export const getRandomSeed = () => Math.floor(Math.random() * 1000000);

const handleApiError = (err: any) => {
  console.error("API Call Error:", err);
  const msg = err?.message || "";
  
  if (msg.includes("429")) {
    throw new Error("API LIMIT: Kecepatan akses terlalu tinggi. Tunggu 30-60 detik sebelum menekan tombol lagi.");
  }
  if (msg.includes("quota")) {
    throw new Error("KUOTA HABIS: Limit harian akun ini telah tercapai. Silakan ganti akun di sidebar.");
  }
  throw new Error(msg || "Koneksi terputus. Silakan klik proses sekali lagi.");
};

export const magicEraser = async (image: string, mask: string) => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { inlineData: { data: cleanBase64(mask), mimeType: 'image/png' } }, 
          { text: "Remove the highlighted object marked in red mask. Fill the background naturally." }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  });
};

export const generateSpeech = async (text: string, voiceName: string, isMultiSpeaker: boolean = false, speakers?: {name: string, voice: string}[]) => {
  return runWithRetry(async (ai) => {
    let config: any = { responseModalities: [Modality.AUDIO] };
    if (isMultiSpeaker && speakers && speakers.length === 2) {
      config.speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakers.map(s => ({
            speaker: s.name,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } }
          }))
        }
      };
    } else {
      config.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName } } };
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config
    });
    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) throw new Error("Gagal menghasilkan suara.");
    return data;
  });
};

export const generateSellingNarration = async (image: string) => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: "Generate a persuasive Indonesian selling script for this product. Max 50 words." }
        ] 
      }],
    });
    return response.text?.trim() || "";
  });
};

export const extractTextOCR = async (image: string) => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: "Extract all text from this image." }
        ]
      }]
    });
    return response.text?.trim() || "";
  });
};

export const generateTypographyPoster = async (text: string, bgStyle: string, typoStyle: string) => {
  return runWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { text: `Design a 3D typography poster. Text: "${text}". Background: ${bgStyle}. Style: ${typoStyle}. Aspect ratio 9:16.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  });
};

export const applyHeadwear = async (image: string, desc: string, customAsset: string | null = null) => {
  try {
    const ai = getAI();
    const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];
    if (customAsset) parts.push({ inlineData: { data: cleanBase64(customAsset), mimeType: 'image/png' } });
    parts.push({ text: `[HEADWEAR TASK]: ${desc}. Place it accurately on the person's head.` });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const composeImages = async (img1: string, img2: string | null, prompt: string) => {
  try {
    const ai = getAI();
    const parts: any[] = [{ inlineData: { data: cleanBase64(img1), mimeType: 'image/png' } }];
    if (img2) parts.push({ inlineData: { data: cleanBase64(img2), mimeType: 'image/png' } });
    parts.push({ text: `[COMPOSITION]: ${prompt}` });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateHalu for GuberHalu.tsx
export const generateHalu = async (user: string, idol: string | null, config: HaluConfig) => {
  try {
    const ai = getAI();
    const parts: any[] = [{ inlineData: { data: cleanBase64(user), mimeType: 'image/png' } }];
    if (idol) parts.push({ inlineData: { data: cleanBase64(idol), mimeType: 'image/png' } });
    parts.push({ text: `[HALU TASK]: Create a composite image of the user with ${config.idolName || 'the idol'}. Atmosphere: ${config.nuance}. Pose: ${config.poseType}. Background: ${config.bgPreset}. ${config.customBg}` });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateMockup for GuberMockUp.tsx
export const expandImage = async (source: string, config: ExpandConfig) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(source), mimeType: 'image/png' } },
          { text: `[EXPAND TASK]: Outpaint and expand this image naturally. ${config.additionalInstruction}` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateProductScene for GuberProduk.tsx
export const generateFusionCharacter = async (config: FusionConfig) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { text: `[FUSION TASK]: Creatively fuse "${config.object1}" and "${config.object2}" into a single unique entity. Style: ${config.style}. High detail.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateGabungScene for GuberGabung.tsx
export const generateGabungScene = async (config: GabungConfig) => {
  try {
    const ai = getAI();
    const parts: any[] = [];
    if (config.subject1Image) parts.push({ inlineData: { data: cleanBase64(config.subject1Image), mimeType: 'image/png' } });
    if (config.subject2Image) parts.push({ inlineData: { data: cleanBase64(config.subject2Image), mimeType: 'image/png' } });
    parts.push({ text: `[COMBINE TASK]: Merge these two subjects into one scene. Interaction: ${config.interaction}. Environment: ${config.environment}. Style: ${config.style}.` });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateKidsAdPrompt for GuberKidsAd.tsx
export const generateKidsAdPrompt = async (image: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: "Analyze this kids fashion product and generate a professional video prompt (6 seconds) for AI video generator. Return result in JSON format with 'prompt' (string) and 'breakdown' (array of 3 strings for 0-2s, 2-4s, 4-6s segments)." }
        ] 
      }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            breakdown: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["prompt", "breakdown"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateEditinResult for GuberEditin.tsx
export const generateEditinResult = async (image: string, request: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: `[EDITIN TASK]: ${request}. Also include a short funny Indonesian joke based on the edit in the text part of the response.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    
    const imageUrl = extractImageFromResponse(response);
    const jokePart = response.candidates?.[0]?.content?.parts.find((p: any) => p.text);
    return { imageUrl, joke: jokePart?.text || "Edit completed!" };
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateAnimeCharacter for GuberAnime.tsx
export const generateAnimeCharacter = async (image: string, config: AnimeConfig) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: `[ANIME TASK]: Transform this person into an anime character. Style: ${config.stylePreset}. Power effect: ${config.powerEffect}. Cyberpunk: ${config.isCyberpunk}. ${config.customStyle}` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added transformHair for GuberBarberShop.tsx
export const transformHair = async (model: string, ref: string | null, instruction: string) => {
  try {
    const ai = getAI();
    const parts: any[] = [{ inlineData: { data: cleanBase64(model), mimeType: 'image/png' } }];
    if (ref) parts.push({ inlineData: { data: cleanBase64(ref), mimeType: 'image/png' } });
    parts.push({ text: instruction });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added neutralizeHair for GuberBarberShop.tsx
export const neutralizeHair = async (image: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: "Make the person in the image completely bald. Realistic skin texture on the scalp." }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added extractClothing for GuberEkstrak.tsx
export const extractClothing = async (image: string, config: { target: 'TOP' | 'BOTTOM' }) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: `[EXTRACT TASK]: Extract the ${config.target} garment and display it on a pure white background. Remove the person.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "1:1" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateKidsModel for GuberKidsModel.tsx
export const generateKidsModel = async (face: string, config: KidsModelConfig) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(face), mimeType: 'image/png' } },
          { text: `[KIDS MODEL TASK]: Create a full model character using this face identity. Age: ${config.age}. Gender: ${config.gender}. Shirt: ${config.shirtColor}. Pants: ${config.pantsColor}. Pose: ${config.pose}. Shot: ${config.shotType}. Skin radiant: ${config.skinRadiant}%. Face enhance: ${config.faceEnhance}%.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const restorePhoto = async (image: string, mode: string, instruction: string) => {
  try {
    const ai = getAI();
    const prompt = `[ULTIMATE RESTORATION TASK]: 
    1. Perform a high-end digital restoration of this photo. 
    2. Sharpen all facial features (eyes, lips, nose) to ultra-HD 8K clarity.
    3. Remove all blur, noise, scratches, and artifacts.
    4. Enhance skin texture to be realistic and smooth with professional studio lighting.
    5. ${mode === 'FULL' ? 'Apply vibrant, rich, and realistic colors. Enhance the saturation and contrast of the clothing and background.' : 'Maintain a high-contrast, sharp, and clean black and white aesthetic.'}
    6. Reconstruct missing details with masterpiece quality. 
    7. Final output must look like a professional high-resolution studio portrait.
    ${instruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: prompt }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateAnimalKid for GuberAnimal.tsx
export const generateAnimalKid = async (image: string, animal: string, env: string, instruction: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: `[ANIMAL COSTUME TASK]: Dress the child in a ${animal} costume. Environment: ${env || 'keep original vibe'}. ${instruction}` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added applyGraphic for GuberSablon.tsx
export const applyGraphic = async (model: string, graphic: string, instruction: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(model), mimeType: 'image/png' } },
          { inlineData: { data: cleanBase64(graphic), mimeType: 'image/png' } },
          { text: `[GRAPHIC APPLICATION]: Apply the graphic/logo from the reference onto the model's garment. ${instruction}` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateVideoPrompt for GuberVPrompt.tsx
export const generateVideoPrompt = async (image: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } },
          { text: "Create a detailed 6-second video prompt for this fashion model. Return in JSON format." }
        ] 
      }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            video_prompt: { type: Type.STRING },
            motion_breakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
            camera_movement: { type: Type.STRING },
            lighting_style: { type: Type.STRING }
          },
          required: ["video_prompt", "motion_breakdown", "camera_movement", "lighting_style"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added harmonizeMosaic for GuberMozaik.tsx
export const harmonizeMosaic = async (mosaic: string, source: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(mosaic), mimeType: 'image/png' } },
          { inlineData: { data: cleanBase64(source), mimeType: 'image/png' } },
          { text: "[HARMONIZE TASK]: Seamlessly blend and harmonize this mosaic with the source pattern. Enhance detail and quality." }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added editPromptWithAI for editprompt.tsx
export const editPromptWithAI = async (description: string, motions: string[], directives: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Design a professional 6s video prompt. Character: ${description}. Motions: ${motions.join(', ')}. Technical directives: ${directives}. Return ONLY the prompt string.`
    });
    return response.text?.trim() || "A professional fashion model video sequence.";
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateThumbnail for thumbnail.tsx (renamed from generateFoodThumbnail style)
export const generateThumbnail = async (image: string, title: string, effects: string[]) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Create a professional viral thumbnail. Title: ${title}. Effects: ${effects.join(', ')}. 8K resolution, high contrast, cinematic.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const generateWeddingPhoto = async (config: WeddingConfig, images: { man?: string | null, woman?: string | null, couple?: string | null }) => {
  try {
    const ai = getAI();
    const parts: any[] = [];
    
    if (config.mode === 'SINGLE') {
      if (images.man) parts.push({ inlineData: { data: cleanBase64(images.man), mimeType: 'image/png' } });
      if (images.woman) parts.push({ inlineData: { data: cleanBase64(images.woman), mimeType: 'image/png' } });
    } else {
      if (images.couple) parts.push({ inlineData: { data: cleanBase64(images.couple), mimeType: 'image/png' } });
    }

    const prompt = `[WEDDING PHOTO TASK]: Create a professional wedding photograph.
    Mode: ${config.mode === 'SINGLE' ? 'Create a couple from these two individuals' : 'Enhance this couple photo'}.
    [IDENTITY PRESERVATION]: Maintain 100% facial identity, features, and characteristics of the individuals in the provided photos. The generated faces must be extremely similar to the reference photos.
    Camera Style: ${config.camera}.
    Clothing Style: ${config.style}.
    Location: ${config.location}.
    Additional Instructions: ${config.additionalPrompt}.
    [REQUIREMENTS]: High resolution, professional lighting, realistic skin textures, cinematic composition, seamless blending.`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio as any || "9:16" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const generateScene = async (config: SceneConfig, images: { reference: string | null, character?: string | null }) => {
  try {
    const ai = getAI();
    const parts: any[] = [];
    
    if (images.reference) {
      parts.push({ inlineData: { data: cleanBase64(images.reference), mimeType: 'image/png' } });
    }
    
    if (images.character) {
      parts.push({ inlineData: { data: cleanBase64(images.character), mimeType: 'image/png' } });
    }

    const prompt = `[SCENE REIMAGINATION TASK]: Create a new scene based on the provided reference image.
    [CAMERA ANGLE/SCENE PROMPT]: ${config.prompt}.
    [CONSISTENCY RULE]: If a character image is provided, maintain 100% of the character's facial features, identity, and clothing.
    [VISUAL STYLE]: Maintain the same visual style, lighting, and mood as the reference image, but change the camera angle or scene composition as requested.
    [REQUIREMENTS]: High resolution, professional cinematic composition, realistic textures, seamless blending.`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: config.aspectRatio as any || "1:1" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateFeedText for GuberFeedGenerator.tsx
export const generateFeedText = async (config: any) => {
  try {
    const ai = getAI();
    const parts: any[] = [];

    if (config.customImage) {
      parts.push({ inlineData: { data: cleanBase64(config.customImage), mimeType: 'image/png' } });
    }

    parts.push({
      text: `Create a professional social media infographic content strategy for topic: "${config.topic}". 
      Description: "${config.description}".
      Goal: ${config.goal}. 
      Structure: ${config.structure}. 
      Visual Style: ${config.visualStyle}. 
      Brand Colors: Primary ${config.primaryColor}, Secondary ${config.secondaryColor}.
      ${config.customImage ? "I have uploaded a reference image. Analyze its content, style, and elements to incorporate them into the strategy and the image generation prompt." : ""}
      
      Return a JSON object with:
      1. "headline": A catchy, bold title for the infographic.
      2. "hook": A short engaging introductory sentence.
      3. "points": An array of 3-7 objects, each with "title", "content", and "visual_element" (description of icon/illustration for this point).
      4. "cta": A strong call to action text for the bottom of the image.
      5. "caption": A compelling Indonesian caption for the post with emojis.
      6. "hashtags": An array of 10 relevant hashtags.
      7. "imagePrompt": A MASTER English prompt for an AI image generator. It MUST describe a high-quality INFOGRAPHIC layout, with a large title, numbered sections, illustrative style, and professional composition. Mention the brand colors ${config.primaryColor} and ${config.secondaryColor}. ${config.customImage ? "Ensure the prompt describes the visual elements from the uploaded reference image so other AI generators (like ChatGPT/DALL-E) can recreate a similar vibe." : ""}
      8. "visualAdvice": Expert advice on how to layout this specific content.
      `
    });
    
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            hook: { type: Type.STRING },
            points: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  visual_element: { type: Type.STRING }
                },
                required: ["title", "content", "visual_element"]
              } 
            },
            cta: { type: Type.STRING },
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            imagePrompt: { type: Type.STRING },
            visualAdvice: { type: Type.STRING }
          },
          required: ["headline", "hook", "points", "cta", "caption", "hashtags", "imagePrompt", "visualAdvice"]
        }
      }
    });

    return JSON.parse(textResponse.text || '{}');
  } catch (err: any) {
    return handleApiError(err);
  }
};

// fix: Added generateFeedImage for GuberFeedGenerator.tsx
export const generateFeedImage = async (imagePrompt: string, config: any) => {
  try {
    const ai = getAI();
    const parts: any[] = [];

    if (config.customImage) {
      parts.push({ inlineData: { data: cleanBase64(config.customImage), mimeType: 'image/png' } });
    }

    parts.push({
      text: `[INFOGRAPHIC DESIGN]: ${imagePrompt}. Ensure text areas are clean. Style: ${config.visualStyle}. Layout: ${config.typographyPlacement}. High resolution, 8k, professional graphic design. ${config.customImage ? "Use the uploaded image as a reference for style and content." : ""}`
    });

    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: {
        imageConfig: { aspectRatio: config.dimensions },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(imageResponse);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = '1:1') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Upscale this image to high resolution. Maintain the original details and the aspect ratio of ${aspectRatio}. Return only the upscaled image.` }
        ] 
      }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const changeBackground = async (image: string, prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Change the background of this image to: ${prompt}. Keep the subject exactly as it is. Return only the new image.` }
        ] 
      }],
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const genericImageEdit = async (image: string, prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: prompt }
        ] 
      }],
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const generateFashionPhoto = async (
  config: FotoFashionConfig,
  images: { clothing: string | null; customModel: string | null; logo: string | null }
) => {
  try {
    const ai = getAI();
    const parts: any[] = [];
    
    if (images.clothing) {
      parts.push({ inlineData: { data: cleanBase64(images.clothing), mimeType: 'image/png' } });
    }

    if (config.modelType === 'KUSTOM' && images.customModel) {
      parts.push({ inlineData: { data: cleanBase64(images.customModel), mimeType: 'image/png' } });
    }

    if (images.logo) {
      parts.push({ inlineData: { data: cleanBase64(images.logo), mimeType: 'image/png' } });
    }

    const prompt = `
      TASK: Generate a high-quality professional fashion photography image.
      
      CLOTHING: The user has provided an image of a piece of clothing. Your goal is to realistically place this clothing on a model or display it as requested.
      
      CONFIGURATION:
      - Model Type: ${config.modelType} ${config.modelType === 'KUSTOM' ? '(Use the provided custom model image)' : ''}
      - Gender: ${config.gender}
      - Age Group: ${config.age === 'KUSTOM' ? config.customAge : config.age}
      - Location: ${config.location}
      - Visual Style: ${config.visualStyle === 'KUSTOM' ? config.customVisualStyle : config.visualStyle}
      - Aspect Ratio: ${config.aspectRatio}
      
      ADDITIONAL INSTRUCTIONS: ${config.additionalInstruction || 'None'}
      
      LOGO HANDLING: ${images.logo ? 'A logo has been provided. Place it subtly in the corner of the final image as a watermark.' : 'No logo provided.'}
      
      TECHNICAL REQUIREMENTS:
      - Maintain the exact colors, patterns, and texture of the provided clothing.
      - The lighting should match the ${config.visualStyle} style.
      - The background should be a realistic ${config.location} setting.
      - Output should be a single, high-resolution fashion photo.
    `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts }],
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio as any
        },
        seed: getRandomSeed()
      }
    });

    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};
