import { GoogleGenAI } from "@google/genai";
import { getAI } from "./geminiService";

export const generateClothesOnCarpet = async (
  theme: string,
  carpetColor: string,
  aspectRatio: string = "9:16",
  images: string[] = [],
  customOrnaments: string = "",
  brandName: string = "",
  clothingScope: string = "Satu Set",
  cameraAngle: string = "Atas (Top-down)"
) => {
  try {
    const ai = getAI();
    
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.split(',')[1],
        mimeType: 'image/png'
      }
    }));

    const themePrompts: Record<string, string> = {
      'AUTO': 'hiasan pot bunga kecil, buku estetik, kaca mata wanita, dan boneka lucu.',
      'OLAHRAGA': 'alat-alat olahraga seperti bola, pemukul baseball, sarung tangan tinju, dan botol minum sport',
      'BAJU_RAPI': 'lipatan-lipatan baju warna-warni yang tertata rapi dan estetik',
      'DEKORASI': 'bunga-bunga cantik dalam berbagai vas mini warna-warni yang tersebar estetik',
      'ALAT_TULIS': 'peralatan tulis seperti buku catatan, pena premium, penggaris kayu, dan klip kertas',
      'NATURAL': 'tema natural berupa daun-daunan hijau segar, bunga-bunga liar, dan elemen kayu'
    };

    let selectedTheme = themePrompts[theme] || themePrompts['AUTO'];
    
    if (theme === 'CUSTOM' && customOrnaments) {
      selectedTheme = `berbagai ornamen yang relevan dengan tema "${customOrnaments}". 
      Misalnya jika temanya Damkar maka berikan tabung APAR, selang, mainan mobil damkar, mainan bentuk api, dll. 
      Jika temanya Batman maka berikan mainan mobil Batman, topeng Batman, emblem Batman, dll. 
      Anda harus pandai memvariasikan ornamen yang sesuai dengan kata kunci tersebut agar terlihat sangat tematik.`;
    }

    const embroideryText = brandName ? `Di atas karpet terdapat bordiran teks bertuliskan "${brandName}" yang terlihat sangat nyata dan estetik.` : '';

    const carpetColorInstruction = carpetColor.toLowerCase().includes('otomatis')
      ? `Pilih warna karpet secara otomatis yang paling cocok, serasi, atau kontras secara estetik dengan warna pakaian di gambar agar hasil foto terlihat sangat menarik dan profesional.`
      : `Gunakan karpet berwarna ${carpetColor}. Pastikan warna karpet ini dominan dan terlihat jelas sebagai latar belakang. JANGAN menggunakan warna lain selain warna yang ditentukan ini. Warna karpet HARUS sesuai dengan instruksi ini.`;

    const cameraAngleInstruction = cameraAngle === 'Saran AI'
      ? `Gunakan sudut kamera yang paling estetik, dramatis, dan profesional secara bebas (bisa miring, perspektif, atau top-down) yang paling menonjolkan keindahan pakaian.`
      : `Sudut kamera dari ${cameraAngle}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          ...imageParts,
          {
            text: `[TASK: FLAT LAY CLOTHING PHOTOGRAPHY]
            PROMPT: Buatkan saya gambar flat lay pakaian TANPA MODEL MANUSIA. 
            
            [PENTING - PEMBERSIHAN SCREENSHOT & BLACK BARS]: Gambar referensi seringkali adalah hasil SCREENSHOT yang memiliki:
            1. Status bar di atas (jam, baterai, sinyal).
            2. Navigasi bar di bawah (tombol home, back, recent).
            3. AREA HITAM (black bars) yang sangat tebal di sisi atas, bawah, kiri, atau kanan.
            Anda WAJIB MEMBUANG SEMUA elemen UI dan AREA HITAM tersebut. JANGAN biarkan elemen-elemen sampah ini muncul di hasil akhir.
            SELURUH AREA GAMBAR HASIL HARUS TERISI OLEH KARPET. TIDAK BOLEH ADA AREA HITAM SAMA SEKALI.
            
            [EKSTRAKSI OBJEK MUTLAK]: Fokus HANYA pada objek PAKAIAN. Abaikan TOTAL latar belakang asli dari gambar yang diunggah. Identifikasi batas (bounding box) pakaian tersebut, lalu potong dan pindahkan HANYA pakaiannya saja ke atas karpet baru. Latar belakang asli HARUS DIGANTI TOTAL dengan karpet. JANGAN SISAKAN AREA HITAM DARI SCREENSHOT ASLI.
            
            [NO ORIGINAL BACKGROUND]: JANGAN gunakan atau meniru latar belakang dari gambar asli. Pakaian harus benar-benar dipindahkan ke atas karpet baru yang TEBAL dan MEWAH. Warna karpet JANGAN terpengaruh oleh warna latar belakang di gambar referensi. SELURUH BACKGROUND ADALAH KARPET TANPA AREA HITAM.
            
            REFERENSI PAKAIAN: Ambil dan ekstrak pakaian dari gambar yang diunggah secara UTUH. 
            PENTING: JANGAN memotong atau menghilangkan bagian pakaian. Jika pakaian memiliki LENGAN PANJANG, pastikan lengan panjang tersebut tetap ada dan tertata rapi. Jika itu adalah DRESS, pastikan seluruh bagian dress dari atas sampai bawah terlihat.
            Jika pakaian di gambar sedang dipakai orang, lepaskan dan letakkan pakaiannya saja di atas karpet.
            
            CAKUPAN PAKAIAN: Ambil bagian "${clothingScope}" saja dari referensi gambar.
            
            POSISI: Pakaian diletakkan secara estetik di atas karpet. ${carpetColorInstruction} Karpet harus menjadi warna latar belakang UTAMA, TUNGGAL, dan SOLID. Karpet harus terlihat sangat TEBAL, EMPUK, dan BERTEKSTUR MEWAH (plush thick carpet texture). ${cameraAngleInstruction} JANGAN biarkan ornamen atau hiasan mengubah warna karpet yang sudah ditentukan. Karpet ini harus menjadi latar belakang tunggal untuk seluruh area gambar dengan warna yang KONSISTEN, SOLID, dan TANPA CAMPURAN warna lain atau MOTIF/POLA lain. Warna karpet HARUS BENAR-BENAR SESUAI dengan instruksi warna di atas.
            
            ${embroideryText}
            
            HIASAN/TEMA: ${selectedTheme}. Jika pada gambar referensi terdapat ornamen atau aksesoris menarik, Anda boleh menggunakannya sebagai referensi tambahan untuk hiasan.
            
            LAYOUT: Susun semua ornamen dan pakaian secara RANDOM namun RAPI dan ESTETIK di sekitar objek utama. Jangan menumpuk secara berantakan, tapi berikan kesan komposisi fotografi profesional.
            
            LIGHTING: Berikan pencahayaan dari jendela yang aesthetic (soft natural window light with shadows). JANGAN biarkan pencahayaan mengubah warna dasar karpet secara drastis.
            
            QUALITY: Jernih, tajam, profesional, 8k resolution, cinematic photography, tekstur kain terlihat nyata. Warna karpet HARUS sesuai dengan instruksi warna di atas.
            
            OUTPUT: Hyper-realistic, professional flat lay photography, ${aspectRatio} aspect ratio. Warna karpet harus sesuai dengan instruksi. JANGAN MENGHASILKAN WARNA KREM JIKA INSTRUKSI ADALAH HIJAU. WARNA KARPET ADALAH PRIORITAS UTAMA. PATUHI WARNA YANG DIPILIH. JANGAN KREATIF DENGAN WARNA KARPET. WARNA KARPET HARUS SESUAI PILIHAN USER. JANGAN MENGABAIKAN WARNA. WARNA KARPET ADALAH MUTLAK. JANGAN MENENTANG INSTRUKSI WARNA. WARNA KARPET ADALAH HARGA MATI. JANGAN BIARKAN ELEMEN SCREENSHOT ATAU AREA HITAM MUNCUL DI HASIL AKHIR.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new Error("Gagal menghasilkan gambar. Server AI mungkin sedang sibuk.");
    }

    const part = candidate.content.parts.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }

    throw new Error("Data visual tidak ditemukan dalam respon AI.");
  } catch (err: any) {
    console.error("Karpet Service Error:", err);
    throw new Error(err?.message || "Gagal menghasilkan gambar karpet. Silakan coba lagi.");
  }
};

export const upscaleImage = async (image: string, aspectRatio: string = "9:16") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ 
        parts: [
          { inlineData: { data: image.split(',')[1], mimeType: 'image/png' } }, 
          { text: `Upscale and enhance this image to ultra HD detail. Sharp and clear. Maintain the thick plush carpet texture.` }
        ] 
      }],
      config: { 
        imageConfig: { aspectRatio: aspectRatio as any }
      }
    });
    
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
    throw new Error("Gagal menajamkan gambar.");
  } catch (err: any) {
    console.error("Upscale Error:", err);
    throw new Error(err?.message || "Gagal menajamkan gambar.");
  }
};
