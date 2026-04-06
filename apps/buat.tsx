import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  Maximize2, 
  Crop, 
  RefreshCw, 
  Image as ImageIcon,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Zap,
  Camera,
  Layers,
  Trash2,
  X,
  Send,
  Maximize,
  Scissors,
  Eye,
  Recycle,
  Wand2,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { generateRealImage, upscaleImage, enhancePrompt } from '../services/buat';
import { useTheme } from '../src/contexts/ThemeContext';

// --- Types ---
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface GeneratedImage {
  url: string;
  prompt: string;
  aspectRatio: AspectRatio;
  timestamp: number;
}

// --- Components ---

const Header = ({ primaryColor }: { primaryColor: string }) => (
  <header 
    className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl sticky top-0 z-50 lg:hidden"
    style={{ 
      background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
    }}
  >
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
          <Sparkles size={16} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">GUBER BUAT AI</h1>
          <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Photorealistic Masterpiece</p>
        </div>
      </div>
    </div>
  </header>
);

const SectionTitle = ({ icon: Icon, title, subtitle, primaryColor }: { icon: any, title: string, subtitle?: string, primaryColor: string }) => (
  <div className="mb-3">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
      <Icon size={14} className="text-slate-300" /> {title}
    </label>
    {subtitle && <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
  </div>
);

const BuatApp = () => {
  const { primaryColor } = useTheme();
  // --- State ---
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState('gemini-2.5-flash-image');

  const engines = [
    { id: 'gemini-2.5-flash-image', name: '2.5 Flash', desc: 'Stable', icon: Sparkles },
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4', desc: 'High Quality', icon: Camera }
  ];
  
  // --- Cropping State ---
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // --- Refs ---
  const resultRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Silakan masukkan deskripsi gambar.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateRealImage(prompt, aspectRatio, selectedEngine);
      setResultImage(result);
      // Scroll to result on mobile
      if (window.innerWidth < 768) {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err: any) {
      let errorMessage = err.message || "Gagal membuat gambar.";
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setError("AKSES_DITOLAK");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpscale = async () => {
    if (!resultImage) return;

    setIsUpscaling(true);
    try {
      const upscaled = await upscaleImage(resultImage, aspectRatio, selectedEngine);
      setResultImage(upscaled);
    } catch (err: any) {
      let errorMessage = err.message || "Gagal menajamkan gambar.";
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setError("AKSES_DITOLAK");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsUpscaling(false);
    }
  };
  
  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || "Gagal memperbagus prompt.";
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setError("AKSES_DITOLAK");
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handlePresetClick = async (p: string) => {
    setPrompt(p);
    // We need to use the value directly because setPrompt is async

    // Check for API Key if using Gemini 3.x
    if (selectedEngine.includes('gemini-3')) {
      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }
      } catch (e) {
        console.error("Key selection error:", e);
      }
    }

    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateRealImage(p, aspectRatio, selectedEngine);
      setResultImage(result);
      if (window.innerWidth < 768) {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("Silakan pilih API Key di sidebar untuk menggunakan mesin ini.");
        try { await (window as any).aistudio.openSelectKey(); } catch(e){}
      } else {
        setError(err.message || "Gagal membuat gambar.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImage = async () => {
    if (!resultImage || !croppedAreaPixels) return;
    
    const image = new Image();
    image.src = resultImage;
    await new Promise(resolve => image.onload = resolve);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    setResultImage(canvas.toDataURL('image/png'));
    setIsCropping(false);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `guber-buat-${Date.now()}.png`;
    link.click();
  };

  const clearResult = () => {
    setResultImage(null);
    setError(null);
  };

  const handleReset = () => {
    setResultImage(null);
    setError(null);
    setPrompt('');
    setAspectRatio('1:1');
  };

  // --- Presets ---
  const presets = [
    "Pohon cermai berbuah kacang tanah yang sangat lebat di tengah hutan tropis",
    "Mobil sport futuristik yang terbuat dari kristal transparan di jalanan Tokyo",
    "Seekor kucing raksasa sedang tidur di atas gedung pencakar langit Jakarta",
    "Air terjun yang mengalirkan susu putih di antara tebing cokelat raksasa",
    "Astronot sedang memancing di tepi danau lava di planet Mars"
  ];

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto lg:overflow-hidden custom-scrollbar">
      <div className="max-w-2xl lg:max-w-7xl mx-auto min-h-full lg:h-screen bg-white flex flex-col border-x border-slate-100 shadow-sm">
        <Header primaryColor={primaryColor} />

        <div className="p-4 lg:p-6 lg:flex-1 lg:overflow-hidden">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:h-full lg:overflow-hidden">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-4 space-y-6 md:space-y-8 lg:h-full lg:overflow-y-auto lg:pr-6 custom-scrollbar">
              {/* Prompt Input */}
              <div className="space-y-3">
                <SectionTitle 
                  icon={Zap} 
                  title="1. Deskripsi Gambar" 
                  subtitle="Jelaskan apa yang ingin Anda buat. Imajinasi liar sangat disarankan." 
                  primaryColor={primaryColor}
                />
                
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: Pohon cermai berbuah kacang tanah yang lebat..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-5 pb-14 text-[12px] font-semibold outline-none min-h-[140px] resize-none transition-all placeholder:text-slate-300 focus:bg-white focus:border-slate-200"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                    <button
                      onClick={handleEnhance}
                      disabled={!prompt.trim() || isEnhancing}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm disabled:opacity-50"
                      style={{ color: primaryColor }}
                    >
                      {isEnhancing ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Wand2 size={14} />
                      )}
                      AI Detail
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPrompt('')}
                        className="p-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aspect Ratio Selection */}
              <div className="space-y-3">
                <SectionTitle 
                  icon={Maximize} 
                  title="2. Pilih Aspek Rasio" 
                  subtitle="Sesuaikan dimensi hasil karya Anda." 
                  primaryColor={primaryColor}
                />
                
                <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-xl md:rounded-2xl border-2 transition-all duration-300 aspect-square ${
                        aspectRatio === ratio 
                          ? 'scale-105' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === ratio ? primaryColor : undefined,
                        color: aspectRatio === ratio ? 'white' : undefined,
                        borderColor: aspectRatio === ratio ? primaryColor : undefined,
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <div className={`border-2 border-current rounded-[2px] flex items-center justify-center text-[5px] md:text-[6px] font-black leading-none ${
                          ratio === '1:1' ? 'w-5 h-5 md:w-6 md:h-6' :
                          ratio === '16:9' ? 'w-full h-auto aspect-video' :
                          ratio === '9:16' ? 'h-full w-auto aspect-[9/16]' :
                          ratio === '4:3' ? 'w-full h-auto aspect-[4/3]' : 'h-full w-auto aspect-[3/4]'
                        }`}>
                          <span className={['9:16', '3:4'].includes(ratio) ? '-rotate-90' : ''}>
                            {ratio}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Engine Selection */}
              <div className="space-y-3">
                <SectionTitle 
                  icon={Zap} 
                  title="3. Mesin AI Visual" 
                  subtitle="Pilih mesin AI untuk hasil yang berbeda." 
                  primaryColor={primaryColor}
                />
                <div className="grid grid-cols-3 gap-2">
                  {engines.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => setSelectedEngine(engine.id)}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                        selectedEngine === engine.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                      style={{
                        borderColor: selectedEngine === engine.id ? primaryColor : undefined,
                        backgroundColor: selectedEngine === engine.id ? primaryColor : undefined,
                      }}
                    >
                      <engine.icon size={16} className="mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{engine.name}</span>
                      <span className="text-[8px] font-bold opacity-60">{engine.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg"
                  style={{ 
                    backgroundColor: isGenerating || !prompt.trim() ? undefined : primaryColor,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  {isGenerating ? (
                    <span className="relative z-10 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      SEDANG PROSES...
                    </span>
                  ) : (
                    <span className="text-lg relative z-10 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      HASILKAN KARYA
                    </span>
                  )}
                </button>
              </div>

              {/* Presets (Moved here) */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <SectionTitle 
                  icon={Sparkles} 
                  title="Inspirasi Cepat" 
                  subtitle="Klik untuk langsung menghasilkan karya luar biasa." 
                  primaryColor={primaryColor}
                />
                <div className="grid grid-cols-1 gap-2">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handlePresetClick(p)}
                      disabled={isGenerating}
                      className="w-full text-left text-[10px] px-5 py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-100 hover:border-slate-200 rounded-2xl text-slate-600 font-bold transition-all shadow-sm flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="truncate mr-2">{p}</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Result Section */}
            <div className="lg:col-span-8 space-y-4 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:flex lg:flex-col lg:justify-between lg:overflow-hidden" ref={resultRef}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Karya
                </label>
              </div>
              
              <div 
                className={`w-full mx-auto bg-white border-2 border-dashed rounded-[24px] md:rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 lg:h-full lg:max-h-[calc(100vh-200px)] lg:w-auto ${
                  aspectRatio === '1:1' ? 'max-w-[280px] md:max-w-[320px] lg:max-w-full aspect-square' :
                  aspectRatio === '16:9' ? 'max-w-[400px] md:max-w-[450px] lg:max-w-full aspect-[16/9]' :
                  aspectRatio === '9:16' ? 'max-w-[240px] md:max-w-[280px] lg:max-w-full aspect-[9/16]' :
                  aspectRatio === '4:3' ? 'max-w-[360px] md:max-w-[400px] lg:max-w-full aspect-[4/3]' : 'max-w-[260px] md:max-w-[300px] lg:max-w-full aspect-[3/4]'
                }`}
                style={{ 
                  borderColor: resultImage ? 'white' : `${primaryColor}40`,
                  backgroundColor: resultImage ? 'white' : undefined
                }}
              >
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center z-30"
                    >
                      <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                    </motion.div>
                  ) : resultImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full relative"
                    >
                      {isCropping ? (
                        <div className="relative w-full h-full bg-black">
                          <Cropper
                            image={resultImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '16:9' ? 16/9 : aspectRatio === '9:16' ? 9/16 : aspectRatio === '4:3' ? 4/3 : 3/4}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                          />
                        </div>
                      ) : (
                        <img 
                          src={resultImage} 
                          alt="Generated" 
                          className="w-full h-full object-contain bg-slate-50"
                        />
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                        <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-12 h-12 object-contain grayscale opacity-50" alt="Logo" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest">Belum Ada Hasil</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              {resultImage && !isGenerating && (
                <div className="grid grid-cols-4 gap-2 max-w-[280px] md:max-w-[320px] lg:max-w-full mx-auto mt-4">
                  {isCropping ? (
                    <>
                      <button
                        onClick={getCroppedImage}
                        className="col-span-3 py-3 md:py-4 bg-white border-2 rounded-xl md:rounded-2xl transition-all border-slate-100 hover:border-slate-200 font-bold text-[9px] md:text-[10px] uppercase tracking-widest"
                        style={{ color: primaryColor }}
                      >
                        Terapkan Potongan
                      </button>
                      <button
                        onClick={() => setIsCropping(false)}
                        className="col-span-1 py-3 md:py-4 bg-white border-2 rounded-xl md:rounded-2xl transition-all border-slate-100 hover:border-slate-200 flex items-center justify-center"
                        style={{ color: primaryColor }}
                      >
                        <X size={18} className="md:w-5 md:h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsCropping(true)}
                        className="flex items-center justify-center py-3 md:py-4 bg-white border-2 rounded-xl md:rounded-2xl transition-all border-slate-100 hover:border-slate-200"
                        style={{ color: primaryColor }}
                        title="Crop"
                      >
                        <Scissors size={18} className="md:w-5 md:h-5" />
                      </button>
                      
                      <button
                        onClick={handleUpscale}
                        disabled={isUpscaling}
                        className="flex items-center justify-center py-3 md:py-4 bg-white border-2 rounded-xl md:rounded-2xl transition-all border-slate-100 hover:border-slate-200 disabled:opacity-30"
                        style={{ color: primaryColor }}
                        title="Tajamkan"
                      >
                        {isUpscaling ? (
                          <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                        ) : (
                          <Zap size={18} className="md:w-5 md:h-5" />
                        )}
                      </button>
  
                      <button
                        onClick={handleDownload}
                        className="flex items-center justify-center py-3 md:py-4 text-white rounded-xl md:rounded-2xl transition-all shadow-md"
                        style={{ backgroundColor: primaryColor }}
                        title="Download"
                      >
                        <Download size={18} className="md:w-5 md:h-5" />
                      </button>
  
                      <button
                        onClick={clearResult}
                        className="flex items-center justify-center py-3 md:py-4 bg-white border-2 rounded-xl md:rounded-2xl transition-all border-slate-100 hover:border-red-100 hover:text-red-500 text-slate-400"
                        title="Hapus"
                      >
                        <Trash2 size={18} className="md:w-5 md:h-5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="px-4 md:px-8 pb-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`${error === 'AKSES_DITOLAK' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-600'} border-2 p-5 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest flex flex-col gap-3`}
              >
                {error === 'AKSES_DITOLAK' ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <span>Google Meminta Aktivasi</span>
                    </div>
                    <p className="text-[8px] normal-case font-bold text-amber-800 leading-relaxed">
                      Untuk menggunakan mesin 3.x, Google mewajibkan aktivasi kuota gratis. Klik tombol di bawah (Gratis & Tanpa Input Key).
                    </p>
                    <button 
                      onClick={async () => {
                        try {
                          await (window as any).aistudio.openSelectKey();
                          setError(null);
                        } catch(e) {}
                      }}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-200"
                    >
                      Aktifkan Kuota Gratis Sekarang
                    </button>
                  </>
                ) : (
                  error
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BuatApp;
