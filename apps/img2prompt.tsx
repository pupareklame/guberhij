import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  RotateCcw, 
  Image as ImageIcon, 
  Code, 
  Compass, 
  Target, 
  Heart, 
  Clipboard, 
  Terminal, 
  Settings2, 
  HelpCircle,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../src/contexts/ThemeContext';
import ImageUploader from '../components/ImageUploader';
import { generatePromptFromImage, Img2PromptConfig } from '../services/img2prompt';
import Markdown from 'react-markdown';

interface PresetOption {
  label: string;
  value: string;
}

const PRESETS_TAB1: PresetOption[] = [
  { label: '🔍 Fokus Semua Detail', value: 'fokuskan ke seluruh detail dari objek utama, background, serta estetika seninya secara seimbang.' },
  { label: '🎨 Gaya & Estetika', value: 'fokuskan detail ke gaya ilustrasi/fotografi, palet warna, goresan seni, dan nuansa artistiknya.' },
  { label: '👤 Objek / Karakter Utama', value: 'fokuskan penjelasan detail hanya pada karakter/manusia/objek utama di tengah beserta pakaian dan ekspresinya.' },
  { label: '💡 Pencahayaan & Warna', value: 'fokuskan penjelasan pada arah datangnya cahaya, bayangan, volumetrik, temperatur warna, dan saturasi.' },
  { label: '📷 Sudut Kamera & Lensa', value: 'fokuskan pada zoom lensa, sudut pengambilan gambar (closeup/aerial/POV/wide), bokeh, dan kedalaman bidang.' }
];

const PRESETS_TAB2: PresetOption[] = [
  { label: '🧩 Semua Bagian Aplikasi', value: 'rekonstruksi seluruh struktur visual, input, sidebar, workspace utama, dan layout navigasi aplikasi.' },
  { label: '📐 Layout & Tata Letak', value: 'fokuskan pada susunan grid, letak navbar, sidebar, footer, pembagian panel kiri-kanan, dan fleksibilitas responsifnya.' },
  { label: '🎨 Palette & Tema Warna', value: 'fokuskan pada kode warna HEX, gradien, kontras, serta gaya elemen UI (seperti border tipis, efek glassmorphism, bayangan halus).' },
  { label: '📝 Form Input & Tombol', value: 'fokuskan detail pada bentuk field input, tombol submit, checkbox, selektor dropdown, slider, dan status interaksinya.' },
  { label: '⚡ Interaktivitas & Animasi', value: 'fokuskan deskripsi spesifikasi pada pergerakan animasi (tab switching, overlay modal, hover feedback, loading skeleton, transisi halaman).' }
];

const GuberImg2Prompt: React.FC = () => {
  const { primaryColor } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PROMPT_SESUAI_GAMBAR' | 'PROMPT_APLIKASI'>('PROMPT_SESUAI_GAMBAR');
  const [focusArea, setFocusArea] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedMaster, setCopiedMaster] = useState<boolean>(false);

  // Fungsi untuk mengekstrak master prompt / coder prompt dari respon markdown (antara triple backtick)
  const extractMasterPrompt = (text: string): string => {
    if (!text) return '';
    const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)```/g;
    const matches: string[] = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    // Jika ada block kode, ambil yang terpanjang atau pertama (biasanya block kode berisi master prompt / coder instructions)
    if (matches.length > 0) {
      // Ambil block kode terpanjang karena biasanya master prompt/AI coder prompt berukuran cukup besar
      return matches.reduce((a, b) => a.length > b.length ? a : b);
    }
    return '';
  };

  const masterPrompt = activeTab === 'PROMPT_APLIKASI' ? result : extractMasterPrompt(result);

  const handleGenerate = async () => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);
    setResult('');
    setCopiedAll(false);
    setCopiedMaster(false);

    try {
      const config: Img2PromptConfig = {
        focusArea: focusArea.trim() || undefined,
        tab: activeTab
      };
      
      const response = await generatePromptFromImage(image, config);
      setResult(response);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal menganalisis gambar dan menggenerate prompt. Coba rasio atau format file lain.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyMasterPrompt = () => {
    if (!masterPrompt) return;
    navigator.clipboard.writeText(masterPrompt);
    setCopiedMaster(true);
    setTimeout(() => setCopiedMaster(false), 2000);
  };

  const handleClear = () => {
    setImage(null);
    setFocusArea('');
    setResult('');
    setError(null);
    setCopiedAll(false);
    setCopiedMaster(false);
  };

  const currentPresets = activeTab === 'PROMPT_SESUAI_GAMBAR' ? PRESETS_TAB1 : PRESETS_TAB2;

  return (
    <div id="img2prompt-root" className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div id="img2prompt-container" className="max-w-4xl lg:max-w-7xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        
        {/* Header */}
        <div 
          id="img2prompt-header"
          className="p-6 border-b border-white/10 rounded-b-[40px] shadow-xl relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 25%))`,
          }}
        >
          {/* Subtle design elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-xl -ml-20 -mb-20 pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-md">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-white tracking-tight leading-none mb-1 uppercase">Img2Prompt Studio</h1>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] leading-none text-white/70">Reverse-Engineering Gambar ke Prompt Kreatif</p>
              </div>
            </div>

            {image && (
              <button 
                id="reset-btn"
                onClick={handleClear}
                className="p-2 bg-white/15 text-white/85 hover:bg-white/25 active:scale-95 text-xs rounded-xl transition-all flex items-center gap-1.5 font-bold uppercase tracking-tight border border-white/10"
              >
                <RotateCcw size={12} /> reset
              </button>
            )}
          </div>
        </div>

        {/* Workspace */}
        <div id="img2prompt-body" className="p-4 lg:p-8 flex-1 flex flex-col gap-6">
          
          {/* Tabs */}
          <div id="tabs-wrapper" className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 max-w-lg self-center w-full">
            <button
              id="tab-prompt-gambar"
              onClick={() => {
                setActiveTab('PROMPT_SESUAI_GAMBAR');
                setResult(''); // Clear result when switching tab
              }}
              className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'PROMPT_SESUAI_GAMBAR' 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass size={14} style={{ color: activeTab === 'PROMPT_SESUAI_GAMBAR' ? primaryColor : undefined }} />
              Prompt Gambar Vibe
            </button>
            <button
              id="tab-prompt-app"
              onClick={() => {
                setActiveTab('PROMPT_APLIKASI');
                setResult(''); // Clear result when switching tab
              }}
              className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'PROMPT_APLIKASI' 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code size={14} style={{ color: activeTab === 'PROMPT_APLIKASI' ? primaryColor : undefined }} />
              Prompt Pembuat Aplikasi
            </button>
          </div>

          {!image ? (
            /* Upload State */
            <div id="upload-panel" className="flex-1 flex flex-col items-center justify-center py-10">
              <div className="w-full max-w-xl">
                <ImageUploader
                  label="Unggah Gambar Acuan"
                  image={image}
                  onImageSelect={setImage}
                  aspectRatio="auto"
                  description={
                    activeTab === 'PROMPT_SESUAI_GAMBAR'
                      ? "Unggah foto, gambar ilustrasi, lukisan, atau aset visual untuk diubah menjadi deskripsi prompt generator gambar."
                      : "Unggah tangkapan layar (screenshot) website, aplikasi, mock-up Figma, atau layout UI untuk mendevelop kode aplikasinya."
                  }
                />
              </div>
            </div>
          ) : (
            /* Work State */
            <div id="work-grid" className="grid lg:grid-cols-[400px,1fr] xl:grid-cols-[450px,1fr] gap-8 items-start">
              
              {/* Left Column - Input Panel */}
              <div id="left-sidebar" className="space-y-6">
                
                {/* Image Preview Container */}
                <div id="preview-box" className="bg-slate-50 rounded-[32px] border border-slate-200 p-4 shadow-inner relative group">
                  <div className="aspect-auto max-h-[220px] rounded-2xl overflow-hidden bg-white border border-slate-250 flex items-center justify-center shadow-sm relative">
                    <img 
                      src={image} 
                      className="max-h-full object-contain pointer-events-none select-none" 
                      alt="Source Input Graphic" 
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gambar Dipilih</span>
                    </div>
                    <button 
                      id="change-img-btn"
                      onClick={() => handleClear()}
                      className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase flex items-center gap-1 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-full transition-all"
                    >
                      <Trash2 size={10} /> hapus
                    </button>
                  </div>
                </div>

                {/* Focus Guidance Inputs */}
                <div id="focus-area-setting" className="bg-white rounded-[32px] border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Target size={15} style={{ color: primaryColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Petunjuk Fokus Visual</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-snug">
                    Spesifikasikan bagian gambar atau fitur mana yang ingin Anda prioritaskan dalam output prompt:
                  </p>

                  <textarea
                    id="focus-area-textarea"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    placeholder={
                      activeTab === 'PROMPT_SESUAI_GAMBAR' 
                        ? 'Contoh: fokus ke pakaian modelnya dan efek cahayanya saja, atau hiraukan background...' 
                        : 'Contoh: fokus ke menu sidebar sebelah kiri dan skema warna gelap minimalis di navbar...'
                    }
                    className="w-full h-24 bg-slate-50 border border-slate-250 rounded-2xl p-4 text-[11px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-350 transition-all resize-none shadow-inner"
                    maxLength={400}
                  />

                  {/* Preset Suggestions Chips */}
                  <div id="presets-container" className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Saran Cepat:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPresets.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          id={`preset-chip-${pIdx}`}
                          type="button"
                          onClick={() => setFocusArea(preset.value)}
                          className={`text-[9px] font-bold px-3 py-1.5 rounded-full transition-all border ${
                            focusArea === preset.value
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Process Action */}
                <button
                  id="process-btn"
                  onClick={handleGenerate}
                  disabled={isProcessing || !image}
                  className="w-full py-5 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 h-14"
                  style={{ 
                    backgroundColor: primaryColor,
                    boxShadow: `0 10px 30px -5px ${primaryColor}40`
                  }}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menganalisis Gambar...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="animate-pulse" />
                      <span>Ekstrak Prompt Sekarang</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column - Results Display */}
              <div id="right-results-display" className="lg:h-full flex flex-col min-h-[400px]">
                {!result && !isProcessing && !error ? (
                  /* Initial Vibe Panel */
                  <div id="empty-state" className="flex-1 flex flex-col items-center justify-center py-16 px-4 border border-dashed border-slate-200 rounded-[40px] bg-slate-50/30">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                      <Compass size={28} />
                    </div>
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Siap Menganalisis</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 text-center max-w-sm leading-relaxed">
                      Atur petunjuk fokus di samping jika diperlukan, lalu klik tombol warna utama untuk merekayasa balik model visual Anda.
                    </p>
                  </div>
                ) : isProcessing ? (
                  /* Processing Loading Panel */
                  <div id="processing-loader" className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-100 rounded-[40px] shadow-inner">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                      <div 
                        className="absolute inset-0 border-4 border-t-transparent rounded-full animate-spin" 
                        style={{ borderTopColor: primaryColor }}
                      />
                      <div className="absolute inset-4 bg-slate-50 rounded-full flex items-center justify-center">
                        <Target size={18} className="text-slate-400 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest animate-pulse">Neural Analyzing Engine</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 text-center max-w-md leading-relaxed animate-pulse">
                      Gemini sedang memindai skema visual, gaya, dan komposisi representasi aset gambar Anda...
                    </p>
                    <div className="grid grid-cols-1 w-full max-w-xs mt-6 gap-2">
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-brand rounded-full" 
                          style={{ backgroundColor: primaryColor }}
                          initial={{ width: "0%" }}
                          animate={{ width: "95%" }}
                          transition={{ duration: 12, ease: "easeInOut" }}
                        />
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  /* Error Alert Container */
                  <div id="error-screen" className="flex-1 flex flex-col items-center justify-center py-16 px-6 border border-rose-100 bg-rose-50/20 rounded-[40px]">
                    <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4 shadow-sm border border-rose-100">
                      <AlertCircle size={24} />
                    </div>
                    <h3 className="text-sm font-black text-rose-800 uppercase tracking-widest">Terjadi Hambatan</h3>
                    <p className="text-[10px] text-rose-500 font-bold mt-2 text-center max-w-sm leading-relaxed">{error}</p>
                    <button 
                      id="retry-btn"
                      onClick={handleGenerate}
                      className="mt-5 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 font-black text-[9px] uppercase tracking-wider text-white rounded-full active:scale-95 transition-all shadow-md shadow-rose-500/10"
                    >
                      Coba Sekali Lagi
                    </button>
                  </div>
                ) : (
                  /* Finished Content Dashboard */
                  <motion.div 
                    id="finished-results-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col space-y-4"
                  >
                    
                    {/* Toolbar Header */}
                    <div id="results-bar" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Prompt Terbuat</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Copy specific master code block if present */}
                        {masterPrompt && (
                          <button
                            id="copy-master-btn"
                            onClick={handleCopyMasterPrompt}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 active:scale-95 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md"
                          >
                            {copiedMaster ? <Check size={11} className="text-emerald-400" /> : <Terminal size={11} />}
                            <span>{copiedMaster ? 'Tersalin!' : activeTab === 'PROMPT_SESUAI_GAMBAR' ? 'Salin Master Prompt' : 'Salin AI Coder Prompt'}</span>
                          </button>
                        )}
                        
                        <button
                          id="copy-all-btn"
                          onClick={handleCopyAll}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 rounded-xl text-[9px] font-black uppercase tracking-wider border border-slate-250 transition-all shadow-sm"
                        >
                          {copiedAll ? <Check size={11} className="text-emerald-500" /> : <Clipboard size={11} />}
                          <span>{copiedAll ? 'Tersalin!' : 'Salin Semua'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Output Terminal / Prose container */}
                    <div id="output-markdown-box" className="flex-1 bg-white border border-slate-200 rounded-[36px] shadow-sm overflow-hidden select-text flex flex-col relative group">
                      <div className="absolute top-4 right-4 text-[8px] font-mono font-bold text-slate-300 pointer-events-none uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                        markdown output
                      </div>
                      
                      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed text-justify">
                        <div id="markdown-viewer" className="markdown-body select-text space-y-4 text-xs md:text-[13px]">
                          <Markdown>{result}</Markdown>
                        </div>
                      </div>
                    </div>

                    {/* Master Prompt quick helper bottom banner if code block found */}
                    {activeTab === 'PROMPT_SESUAI_GAMBAR' && masterPrompt && (
                      <div id="master-shortcut-banner" className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 shadow-inner">
                          <FileCode size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 block">Ditemukan Blok Kode Inti</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-snug block">
                            Model berhasil menyusun Master Prompt satu baris dalam format tag bahasa Inggris.
                          </span>
                        </div>
                        <button
                          id="shortcut-copy-master"
                          onClick={handleCopyMasterPrompt}
                          className="text-[9px] font-black uppercase tracking-wider max-sm:self-center px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-xl shadow-inner shrink-0 transition-all"
                        >
                          {copiedMaster ? 'Tersalin!' : 'Salin Blok Kode'}
                        </button>
                      </div>
                    )}

                  </motion.div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GuberImg2Prompt;
