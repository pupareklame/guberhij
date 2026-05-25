import { getAI, cleanBase64, runWithRetry } from "./geminiService";

export interface Img2PromptConfig {
  focusArea?: string;
  tab: "PROMPT_SESUAI_GAMBAR" | "PROMPT_APLIKASI";
}

export async function generatePromptFromImage(image: string, config: Img2PromptConfig): Promise<string> {
  return runWithRetry(async (ai) => {
    // As per gemini-api SKILL.md guidelines, gemini-3.5-flash is preferred for basic/general text-to-text or image analysis + text output tasks.
    const modelId = "gemini-3.5-flash";
    
    const parts: any[] = [
      { inlineData: { data: cleanBase64(image), mimeType: 'image/png' } }
    ];
    
    let promptInstruction = "";
    if (config.tab === "PROMPT_SESUAI_GAMBAR") {
      promptInstruction = `
        Analyze this image carefully. Create a highly descriptive and extremely detailed image generation prompt (best suited for tools like Midjourney, DALL-E, or Stable Diffusion/Imagen) that would recreate this exact image.
        
        The prompt should be written in English (since image generators expect English), but surround it with a beautifully organized, professional, and readable Indonesian breakdown of the style and components.
        
        Structure your review in these elegant sections:
        1. **📱 Ringkasan Gambar (Image Summary)**: Brief description of what is happening in the image in Indonesian.
        2. **✍️ Master Prompt (English)**: A high-fidelity, single continuous prompt string in a copyable code block format designed to generate a very similar image. Keep it cinematic, with rich styling modifiers (e.g., volumetric lighting, octane render, 50mm, shallow depth of field, 8K, highly detailed texturing).
        3. **⚙️ Analisis Detail Gaya & Estetika (Detailed Breakdown)**:
           - **Subject & Clothing**: Details about characters, their pose, attire, actions.
           - **Vibe & Estetika**: The mood (warm, futuristic, aesthetic, dark, pastel, etc.) and underlying artistic themes.
           - **Pencahayaan (Lighting)**: The light direction, intensity, and colors.
           - **Komposisi Kamera & Lensa**: Angle, focus, lens width, and background blur details.
        
        Keep the language professional, inspiring, and beautiful. Do NOT list any code files or technical logs.
        
        ${config.focusArea ? `FOKUS KHUSUS DARI PENGGUNA: Pengguna meminta Anda untuk memfokuskan perhatian pada area/aspek berikut: "${config.focusArea}". Berikan detail yang sangat mendalam dan sesuaikan Master Prompt agar menekankan elemen ini dengan optimal.` : ""}
      `;
    } else {
      promptInstruction = `
        You are an elite Frontend Developer, UX Architect, and System Analyst.
        Analyze this image, which depicts a User Interface (UI), website mockup, dashboard, app screen, or web design layout.
        
        CRITICAL REQUIREMENT: Generate ONLY the master prompt (instruksi sistem murni) for an AI coder (like Gemini, Cursor, or AI Studio Build) in INDONESIAN to build this entire user interface from scratch.
        
        RULES FOR OUTPUT FORMAT:
        - Output MUST be exactly one single solid paragraph (satu paragraf utuh tanpa line break, tanpa bullet points, tanpa subheadings, tanpa list, dan TANPA tanda kutip backtick atau code block).
        - Start immediately with the instruction (e.g., "Buatkan rancangan aplikasi web interaktif menggunakan React dan Tailwind CSS dengan layout...").
        - Describe the visual hierarchy, color palette, exact layout (like sidebars, headers, cards), buttons, form fields, inputs, typography, and states shown in the image, all tightly packed in that single paragraph.
        - Do not include any introductory words like "Berikut adalah prompt..." or "Ini adalah...". Just output the prompt paragraph itself.
        
        ${config.focusArea ? `FOKUS KHUSUS DARI PENGGUNA: Pastikan paragraf instruksi tersebut menekankan detail mendalam pada bagian ini: "${config.focusArea}".` : ""}
      `;
    }

    parts.push({ text: promptInstruction });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts }],
    });

    return response.text || "Gagal menggenerate prompt dari gambar.";
  });
}
