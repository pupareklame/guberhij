
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Zap, 
  Eye, 
  X, 
  Layout, 
  Palette, 
  Sun, 
  Box, 
  Type,
  Maximize,
  Check,
  Recycle,
  Scissors
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState, EstetikConfig } from '../types';
import { generateAestheticProduct } from '../services/produkestetik';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberProdukEstetik: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  
  // Crop States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const [config, setConfig] = useState<EstetikConfig>({
    style: 'MINIMALIST LUXURY',
    environment: 'STUDIO WITH SOFT SHADOWS',
    decoration: 'ELEGANT GRAPHIC ELEMENTS',
    lighting: 'CINEMATIC GLOW',
    aspectRatio: '1:1',
    additionalPrompt: '',
    text: '',
    textStyle: 'ELEGANT SERIF'
  });

  const [customStyle, setCustomStyle] = useState('');
  const [customEnvironment, setCustomEnvironment] = useState('');

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const styles = [
    { id: 'MINIMALIST LUXURY', name: 'Mewah Minimalis', icon: <Box size={14} /> },
    { id: 'VIBRANT POP', name: 'Vibrant Pop', icon: <Palette size={14} /> },
    { id: 'DARK ELEGANCE', name: 'Elegan Gelap', icon: <Sun size={14} /> },
    { id: 'NATURE FRESH', name: 'Segar Alam', icon: <Box size={14} /> },
    { id: 'FUTURISTIC GLOW', name: 'Futuristik', icon: <Zap size={14} /> },
    { id: 'EDITORIAL', name: 'Editorial', icon: <Layout size={14} /> },
    { id: 'CUSTOM', name: 'Kustom', icon: <Scissors size={14} /> },
  ];

  const environments = [
    { id: 'STUDIO WITH SOFT SHADOWS', name: 'Studio Lembut' },
    { id: 'MARBLE PLATFORM', name: 'Platform Marmer' },
    { id: 'WOODEN TABLETOP', name: 'Meja Kayu' },
    { id: 'WATER REFLECTION', name: 'Pantulan Air' },
    { id: 'ABSTRACT GRADIENT', name: 'Gradasi Abstrak' },
    { id: 'LUXURY SHOWROOM', name: 'Showroom Mewah' },
    { id: 'CUSTOM', name: 'Kustom' },
  ];

  const ratios = [
    { label: '1:1', value: '1:1' },
    { label: '3:4', value: '3:4' },
    { label: '4:3', value: '4:3' },
    { label: '9:16', value: '9:16' },
    { label: '16:9', value: '16:9' },
  ];

  const textStyles = [
    { id: 'ELEGANT SERIF', name: 'Serif Elegan' },
    { id: 'MODERN SANS STROKE', name: 'Sans Stroke' },
    { id: 'NEON GLOW', name: 'Neon Glow' },
    { id: 'SOFT SHADOW', name: 'Soft Shadow' },
    { id: 'BOLD 3D', name: 'Bold 3D' },
    { id: 'MINIMALIST OUTLINE', name: 'Outline' },
  ];

  const handleGenerate = async (isAuto: boolean = false) => {
    if (!sourceImage) {
      setProcessing({ isProcessing: false, error: "Harap unggah foto produk terlebih dahulu.", progress: '' });
      return;
    }

    setResultImage(null);
    setOriginalResultImage(null);
    setProcessing({ isProcessing: true, error: null, progress: isAuto ? 'AI Menentukan Gaya Terbaik...' : 'Menciptakan Tampilan Estetik...' });
    
    try {
      const finalConfig = {
        ...config,
        style: config.style === 'CUSTOM' ? customStyle || 'MINIMALIST LUXURY' : config.style,
        environment: config.environment === 'CUSTOM' ? customEnvironment || 'STUDIO WITH SOFT SHADOWS' : config.environment
      };
      const result = await generateAestheticProduct(sourceImage, finalConfig, isAuto);
      setResultImage(result);
      setOriginalResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Proses AI gagal. Coba lagi.", progress: '' });
    }
  };

  const handleResetResult = () => {
    setResultImage(originalResultImage);
    setSliderPos(50);
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
      if (!url.startsWith('data:')) {
        image.crossOrigin = 'anonymous';
      }
      image.src = url;
    });

  const handleApplyCrop = async () => {
    if (!resultImage || !croppedAreaPixels) return;
    
    try {
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;

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

      const base64Image = canvas.toDataURL('image/png');
      setResultImage(base64Image);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto', progress: '' });
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menajamkan Detail...' });
    try {
      const upscaled = await upscaleImage(resultImage, 'ULTRA_HD');
      setResultImage(upscaled);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal menajamkan gambar.", progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `produk-estetik-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        {/* Header */}
        <div 
          className="p-6 border-b border-white/10 rounded-b-[40px] shadow-xl"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-md">
                <Sparkles size={20} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-black text-white tracking-tight leading-none mb-1 uppercase">PRODUK ESTETIK</h1>
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] leading-none text-white/60 text-center">Premium Visual Enhancement</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Image Uploader */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Upload size={14} className="text-slate-300" /> Unggah Foto Produk
            </label>
            <ImageUploader
              label="Klik atau seret foto produk ke sini"
              image={sourceImage}
              onImageSelect={setSourceImage}
              onClear={() => setSourceImage(null)}
              aspectRatio="1-1"
              labelInside
            />
          </div>

          {/* Controls */}
          <div className="space-y-8">
            {/* Style Selection */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={14} className="text-slate-300" /> Pilih Gaya Estetik
              </label>
              <div className="grid grid-cols-2 gap-3">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setConfig({ ...config, style: s.id })}
                    className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-3 ${
                      config.style === s.id 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-[1.02]' 
                        : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={config.style === s.id ? 'text-white' : 'text-slate-300'}>{s.icon}</span>
                    {s.name}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {config.style === 'CUSTOM' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      value={customStyle}
                      onChange={(e) => setCustomStyle(e.target.value)}
                      placeholder="Tulis gaya estetik kustom kamu (misal: Cyberpunk Pink, Vintage 90s...)"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-medium focus:border-slate-300 focus:outline-none transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Environment Selection */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Box size={14} className="text-slate-300" /> Lingkungan / Latar
              </label>
              <div className="grid grid-cols-2 gap-3">
                {environments.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setConfig({ ...config, environment: e.id })}
                    className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${
                      config.environment === e.id 
                        ? 'border-slate-900 bg-slate-900 text-white' 
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {config.environment === 'CUSTOM' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      value={customEnvironment}
                      onChange={(e) => setCustomEnvironment(e.target.value)}
                      placeholder="Tulis lingkungan latar kustom (misal: Di bawah salju, Hutan neon...)"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-medium focus:border-slate-300 focus:outline-none transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Additional Prompt */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Type size={14} className="text-slate-300" /> Instruksi Tambahan (Opsional)
              </label>
              <textarea
                value={config.additionalPrompt}
                onChange={(e) => setConfig({ ...config, additionalPrompt: e.target.value })}
                placeholder="Contoh: Tambahkan efek asap, tulisan 'SALE' di pojok, atau bunga mawar..."
                className="w-full h-24 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-medium focus:border-slate-300 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Aspect Ratio moved here */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Maximize size={14} className="text-slate-300" /> Pilih Aspek Rasio
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ratios.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setConfig({ ...config, aspectRatio: r.value as any })}
                    className={`py-3 rounded-xl text-[10px] font-black border-2 transition-all ${
                      config.aspectRatio === r.value 
                        ? 'border-slate-900 bg-slate-900 text-white' 
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleGenerate(false)}
              disabled={processing.isProcessing || !sourceImage}
              className="flex-1 disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ 
                backgroundColor: processing.isProcessing || !sourceImage ? undefined : primaryColor,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processing.isProcessing ? (
                <span className="relative z-10 uppercase">Mengolah...</span>
              ) : (
                <span className="text-lg relative z-10 font-black uppercase">
                  Hasilkan
                </span>
              )}
            </button>
            <button
              onClick={() => handleGenerate(true)}
              disabled={processing.isProcessing || !sourceImage}
              className="px-8 disabled:bg-slate-300 text-white rounded-[28px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ 
                backgroundColor: processing.isProcessing || !sourceImage ? undefined : '#000',
              }}
              title="Auto Mode"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <span className="text-[10px] relative z-10">AUTO</span>
            </button>
          </div>

          {/* Result Section */}
          <div className="space-y-6 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Eye size={14} className="text-slate-300" /> Hasil Visual Produk
              </label>
            </div>
            
            <div 
              className={`w-full max-w-[400px] mx-auto bg-slate-50 border-2 border-dashed rounded-[40px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 ${
                config.aspectRatio === '1:1' ? 'aspect-square' :
                config.aspectRatio === '3:4' ? 'aspect-[3/4]' :
                config.aspectRatio === '4:3' ? 'aspect-[4/3]' :
                config.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                'aspect-[16/9]'
              }`}
              style={{ 
                borderColor: resultImage ? 'white' : `${primaryColor}40`,
                backgroundColor: resultImage ? 'white' : undefined
              }}
            >
              <AnimatePresence mode="wait">
                {processing.isProcessing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-sm"
                  >
                    <div className="relative">
                      <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                    </div>
                    <p className="mt-4 text-[10px] font-black text-slate-900 uppercase tracking-widest animate-pulse">{processing.progress}</p>
                  </motion.div>
                ) : resultImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full relative select-none touch-none"
                  >
                    <img src={sourceImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
                    <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                      <img src={resultImage} className="absolute inset-0 w-full h-full object-cover" alt="Result" />
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPos} 
                      onChange={(e) => setSliderPos(Number(e.target.value))} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" 
                    />
                    <div className="absolute top-0 bottom-0 w-[2px] bg-white z-10 pointer-events-none" style={{ left: `${sliderPos}%` }}>
                      <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:scale-110 shadow-lg"
                        style={{ borderColor: primaryColor }}
                      >
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                          <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[6px] font-black text-white uppercase tracking-widest pointer-events-none">Asli</div>
                    <div className="absolute bottom-4 right-4 px-2 py-0.5 bg-white/40 backdrop-blur-md rounded-full text-[6px] font-black text-black uppercase tracking-widest pointer-events-none">Estetik</div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-6 relative overflow-hidden group-hover:scale-105 transition-transform duration-500 border-2 border-slate-100 border-dashed">
                      <img 
                        src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
                        className="w-16 h-16 object-contain opacity-20 blur-[2px]" 
                        alt="Logo Placeholder" 
                      />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Visual Produk Akan Muncul Di Sini</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons - Always Visible */}
            <div className="grid grid-cols-5 gap-2 w-full">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!resultImage || processing.isProcessing}
                className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                title="Lihat Fullscreen"
              >
                <Maximize size={20} />
              </button>
              <button
                onClick={() => setIsCropping(true)}
                disabled={!resultImage || processing.isProcessing}
                className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                title="Potong Gambar"
              >
                <Scissors size={20} />
              </button>
              <button
                onClick={handleSharpen}
                disabled={!resultImage || processing.isProcessing}
                className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                title="Tajamkan Detail"
              >
                <Zap size={20} />
              </button>
              <button
                onClick={handleResetResult}
                disabled={!resultImage || processing.isProcessing || resultImage === originalResultImage}
                className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                title="Kembali ke Awal"
              >
                <Recycle size={20} />
              </button>
              <button
                onClick={handleDownload}
                disabled={!resultImage || processing.isProcessing}
                className="p-4 bg-slate-900 text-white rounded-2xl transition-all shadow-lg flex items-center justify-center disabled:bg-slate-300 disabled:cursor-not-allowed"
                title="Simpan Gambar"
              >
                <Download size={20} />
              </button>
            </div>
          </div>

          {/* Crop Modal */}
          <AnimatePresence>
            {isCropping && resultImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
              >
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                  <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Estetik</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsCropping(false)}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleApplyCrop}
                      className="px-6 py-2 text-black rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                      style={{ backgroundColor: 'white' }}
                    >
                      <Check size={14} /> Simpan Crop
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 relative">
                  <Cropper
                    image={resultImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={config.aspectRatio === '1:1' ? 1 : config.aspectRatio === '3:4' ? 3/4 : config.aspectRatio === '4:3' ? 4/3 : config.aspectRatio === '9:16' ? 9/16 : 16/9}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                <div className="p-8 bg-black/50 backdrop-blur-md flex flex-col items-center gap-4">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-white/60 uppercase tracking-widest">
                      <span>Zoom</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {processing.error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest"
              >
                {processing.error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {showPreview && resultImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-12"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={resultImage} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
                alt="Full Preview" 
              />
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-4 -right-4 lg:top-0 lg:-right-12 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
              >
                <X size={24} />
              </button>
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <button
                  onClick={handleDownload}
                  className="bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Download size={18} /> Download HD
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuberProdukEstetik;
