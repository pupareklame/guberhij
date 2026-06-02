
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getAI } from "./geminiService";
import { PasFotoConfig } from "../types";

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

export const generatePasFoto = async (image: string, config: PasFotoConfig) => {
  try {
    const ai = getAI();
    
    let outfitDesc = "";
    if (config.category === 'SD') {
      outfitDesc = "Indonesian elementary school (SD) student wearing a plain, clean white short-sleeve button-up shirt (kemeja putih polos anak sekolah SD) with a neat pointed collar and a left chest pocket. The shirt is completely plain white (polos) without any default pre-printed school badges, emblems, or logos on the saku/pocket, making it perfectly clean unless a custom pocket logo is provided.";
    } else if (config.category === 'SMP') {
      outfitDesc = "Indonesian junior high school (SMP) student wearing a white short-sleeve button-up shirt with a blue tie, left chest pocket with an embroidered school badge, neat formal student appearance";
    } else if (config.category === 'SMA') {
      outfitDesc = "Indonesian senior high school (SMA) student wearing a white short-sleeve button-up shirt with a grey tie, left chest pocket with an embroidered school badge, neat formal student appearance";
    } else if (config.category === 'JAS') {
      outfitDesc = "wearing a formal dark professional suit jacket with a clean white button-up dress shirt underneath";
    } else if (config.category === 'PDH_KHAKI') {
      outfitDesc = "wearing an Indonesian civil servant khaki PDH uniform (PNS) with collar rank insignias, neat professional employee appearance";
    } else if (config.category === 'KEMEJA_PUTIH') {
      outfitDesc = "wearing a plain clean white button-up dress shirt with a neat collar";
    } else {
      outfitDesc = `wearing ${config.category} outfit`;
    }

    const parts: any[] = [{ inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }];
    let imageDescription = "Image references provided:\n- Image 1: The target person/face.";
    let outfitImgIndex = -1;
    let tieImgIndex = -1;
    let logoImgIndex = -1;
    let currentIndex = 1;

    if (config.customOutfitImage) {
      parts.push({ inlineData: { data: cleanBase64(config.customOutfitImage), mimeType: 'image/png' } });
      currentIndex++;
      outfitImgIndex = currentIndex;
      imageDescription += `\n- Image ${currentIndex}: The custom clothing/outfit to dress the person in.`;
    }

    if (config.useTie && config.tieStyle === 'CUSTOM' && config.customTieImage) {
      parts.push({ inlineData: { data: cleanBase64(config.customTieImage), mimeType: 'image/png' } });
      currentIndex++;
      tieImgIndex = currentIndex;
      imageDescription += `\n- Image ${currentIndex}: The custom physical tie style to wear around the collar of the shirt.`;
    }

    if (config.customLogoImage) {
      parts.push({ inlineData: { data: cleanBase64(config.customLogoImage), mimeType: 'image/png' } });
      currentIndex++;
      logoImgIndex = currentIndex;
      imageDescription += `\n- Image ${currentIndex}: The custom brand logo or school emblem to display on the left chest pocket of the outfit.`;
    }

    let prompt = `Formal pass photo. CRITICAL CONTROL: You MUST absolutely preserve the exact facial structure, eyes, nose, mouth, skin tone, facial features, age/youthfulness, expression, hair and head shape of the person in the input image (Image 1). Keep the face perfectly untouched, unchanged, and highly identical to the input image. Only replace the clothing/outfit with the following garments: ${outfitDesc}. Change the background to a clean, solid flat ${config.bgColor} color. Size: ${config.size}. Professional studio lighting, sharp focus, high-resolution portrait.

${imageDescription}
`;
    
    if (config.gender === 'PEREMPUAN') {
      if (config.useHijab) {
        prompt += ` The person is wearing a ${config.hijabColor} hijab in ${config.hijabStyle} style.`;
      } else {
        prompt += ` The person has a neat ${config.hairStyle} hairstyle.`;
      }
    } else {
      prompt += ` The person has a neat ${config.hairStyle} hairstyle.`;
    }

    if (config.useNameTag && config.nameTagText) {
      prompt += ` Include a name tag that says "${config.nameTagText}" in ${config.nameTagMaterial} material.`;
    }

    if (logoImgIndex !== -1) {
      prompt += `\nSUPER IMPORTANT LOGO PLACEMENT: You MUST place the exact custom logo shown in Image ${logoImgIndex} onto the left chest pocket (saku dada) of the white shirt. The logo must be beautifully printed or embroidered so that it merges flat and seamlessly onto the pocket fabric (menyatu dengan rapi di bagian saku), aligned with the shirt's perspective, wrinkles, lighting, and natural fabric texture.`;
    }

    if (config.useTie) {
      if (config.tieStyle === 'CUSTOM' && tieImgIndex !== -1) {
        let customTiePromptText = `\nSUPER IMPORTANT TIE PLACEMENT: Draw and wear the exact custom tie shown in Image ${tieImgIndex} around the collar of the shirt. Wear it neat, tidy, and perfectly centred under the collar. CRITICAL: You MUST absolutely replicate any school emblem, logo, text, colors, stripes, or printed designs present on the custom tie from Image ${tieImgIndex} and render them with high clarity and fidelity onto the tie being worn. Ensure the logo/emblem on the tie is clearly visible, straight, and non-distorted.`;
        if (config.category === 'SD') {
          customTiePromptText += ` Since this is a primary school child's uniform (SD), the tie must NOT have a visible thick fabric knot (simpul) wrapping around the collar. Instead, make the tie hang flat and cleanly from directly beneath the closed shirt collar with no visible knot, representing a tie suspended by a thin hidden elastic cord (tali karet di bawah kerah baju).`;
        }
        prompt += customTiePromptText;
      } else if (config.tieStyle === 'CUSTOM' && config.customTiePrompt) {
        let customTiePromptText = `\nThe person is wearing a custom tie: ${config.customTiePrompt}.`;
        if (config.category === 'SD') {
          customTiePromptText += ` Make the tie hang neatly and flat from directly beneath the closed shirt collar with no thick fabric neck knot (tanpa simpul leher melingkar), simulating a child-friendly elastic strap (tali karet) hanging tie.`;
        }
        prompt += customTiePromptText;
      } else {
        const tieMap: Record<string, string> = {
          'SD': 'red primary school tie (dasi SD) with a golden circular crown emblem (tut wuri handayani) near the top. Note that this elementary school tie MUST hang flat and neat directly from under the closed pointed shirt collar with NO thick fabric knot wrapping around the neck, styled as a child tie with a hidden elastic strap (tali karet)',
          'SMP': 'blue junior high school tie (dasi SMP)',
          'SMA': 'grey/white senior high school tie (dasi SMA)',
          'PEJABAT': 'formal professional silk tie',
          'KUPU_KUPU': 'bow tie (dasi kupu-kupu)',
          'SILANG': 'cross tie (dasi silang)',
        };
        prompt += ` The person is wearing a ${tieMap[config.tieStyle] || 'formal tie'}.`;
      }
    }

    parts.push({ text: prompt });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { 
        imageConfig: { aspectRatio: config.size === '3x4' ? "3:4" : "2:3" },
        seed: getRandomSeed()
      }
    });
    return extractImageFromResponse(response);
  } catch (err: any) {
    return handleApiError(err);
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = "2:3") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }, 
          { text: `Upscale and enhance this image to ultra HD 8K detail. Sharp and clear.` }
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
