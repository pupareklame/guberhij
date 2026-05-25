
import { GoogleGenAI, Modality } from "@google/genai";
import { getAI } from "./geminiService";

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

export const generateSpeech = async (text: string, voiceName: string, isMultiSpeaker: boolean = false, speakers?: {name: string, voice: string}[]) => {
  try {
    const ai = getAI();
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
  } catch (err: any) {
    return handleApiError(err);
  }
};
