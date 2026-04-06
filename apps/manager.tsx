/**
 * GUBER STUDIO - STYLE GUIDE & TEMPLATE DEFINITION
 * File: manager.tsx
 * 
 * Aturan Tampilan Standar (Berdasarkan gantibaju.tsx):
 * 
 * 1. HEADER:
 *    - Background: Linear Gradient (135deg, primaryColor, darkMix).
 *    - Border: Bottom border white/10.
 *    - Shape: Rounded-b-[40px].
 *    - Content: Icon (Lucide) + Title (Black, Tracking-tight) + Subtitle (Uppercase, Tracking-[0.3em]).
 * 
 * 2. LAYOUT UTAMA:
 *    - Container: max-w-2xl lg:max-w-7xl mx-auto.
 *    - Background: White with border-x border-slate-100.
 *    - Mobile: h-full overflow-y-auto.
 *    - Desktop (No-Scroll): 
 *      - Container: lg:h-screen lg:overflow-hidden flex flex-col.
 *      - Content Grid: lg:flex-1 lg:grid lg:grid-cols-2 lg:overflow-hidden.
 *      - Columns: lg:h-full lg:overflow-y-auto custom-scrollbar.
 * 
 * 3. KOLOM INPUT (KIRI):
 *    - Space-y-8.
 *    - Label: text-[11px] font-black text-slate-400 uppercase tracking-widest + Icon.
 *    - Input: ImageUploader (labelInside), Selectors (grid gap-2 p-1 bg-slate-100 rounded-2xl).
 *    - Tombol Utama: py-5 rounded-[28px] font-black uppercase tracking-[0.2em] + Gradient hover effect.
 * 
 * 4. KOLOM HASIL (KANAN):
 *    - Sticky: lg:sticky lg:top-8.
 *    - Preview: Border-2 border-dashed rounded-[32px] + Before/After Slider.
 *    - 5 Tombol Aksi (Bawah Hasil):
 *      - Grid: grid-cols-5 gap-2.
 *      - Icons: Eye (Preview), Scissors (Crop), Zap (Sharpen), Recycle (Reset), Download.
 *      - Style: py-4 rounded-2xl border-2.
 * 
 * 5. MODAL & ANIMASI:
 *    - AnimatePresence + motion.div.
 *    - Preview Modal: fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl.
 *    - Crop Modal: fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl + Cropper component.
 * 
 * 6. TIPOGRAFI & WARNA:
 *    - Font: Inter (Sans).
 *    - Primary Color: Diambil dari ThemeContext.
 *    - Text: Slate-900 (Headings), Slate-400 (Labels/Subtitles).
 */

import React from 'react';

const GuberManager: React.FC = () => {
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-black text-slate-900">GUBER STYLE GUIDE</h1>
      <p className="text-slate-500 mt-2">File ini adalah referensi desain untuk semua aplikasi Guber Studio.</p>
      <div className="mt-8 p-6 bg-slate-50 rounded-3xl text-left font-mono text-xs text-slate-600 overflow-auto max-h-[60vh]">
        <pre>{`
// TEMPLATE HEADER
<div className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl" style={{ background: \`linear-gradient(135deg, \${primaryColor}, color-mix(in srgb, \${primaryColor}, black 20%))\` }}>
  <div className="flex items-center justify-center">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
        <Icon size={16} />
      </div>
      <div className="flex flex-col">
        <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">NAMA APLIKASI</h1>
        <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">SUBTITLE DESKRIPSI</p>
      </div>
    </div>
  </div>
</div>

// TEMPLATE 5 TOMBOL AKSI
<div className="grid grid-cols-5 gap-2 w-full mt-8">
  <button onClick={onPreview}><Eye size={20} /></button>
  <button onClick={onCrop}><Scissors size={20} /></button>
  <button onClick={onSharpen}><Zap size={20} /></button>
  <button onClick={onReset}><Recycle size={20} /></button>
  <button onClick={onDownload} style={{ backgroundColor: primaryColor }}><Download size={20} /></button>
</div>
        `}</pre>
      </div>
    </div>
  );
};

export default GuberManager;
