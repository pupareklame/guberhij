
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Download, 
  RefreshCw, 
  Scissors, 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  Maximize, 
  Camera, 
  Image as ImageIcon, 
  Eye, 
  Recycle,
  Coffee,
  Pizza,
  Cake,
  Palette,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { generateAestheticFood } from '../services/makanan';
import { upscaleImage } from '../services/food';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const FOOD_PRESETS = [
  { id: 'CAFE', name: 'Minimalist Cafe', icon: <Coffee size={18} />, prompt: 'Place the food on a white marble cafe table, soft sunlight from a window, minimalist aesthetic, warm tones, high-end cafe vibes.' },
  { id: 'WOODEN', name: 'Rustic Wooden', icon: <Pizza size={18} />, prompt: 'Place the food on a dark rustic wooden table, cozy restaurant lighting, professional food photography, warm and homey atmosphere.' },
  { id: 'LUXURY', name: 'Fine Dining', icon: <Utensils size={18} />, prompt: 'Fine dining dark aesthetic, black slate table, elegant plating background, moody lighting, luxury restaurant atmosphere, 8K professional shot.' },
  { id: 'OUTDOOR', name: 'Garden Brunch', icon: <Sparkles size={18} />, prompt: 'Outdoor garden brunch setting, glass table, blurred green leaves background, bright natural sunlight, refreshing and breezy aesthetic.' },
  { id: 'PASTEL', name: 'Sweet Pastel', icon: <Cake size={18} />, prompt: 'Dreamy pastel theme, light pink and mint background, cute aesthetic, soft focus, bright and joyful lighting, perfect for desserts.' },
];

const GuberMakanan: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [customTable, setCustomTable] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [prompt, setPrompt] = useState(FOOD_PRESETS[0].prompt);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  // Crop States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const customTableRef = useRef<HTMLInputElement>(null);

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

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

  const handleCropSave = async () => {
    if (!resultImage || !croppedAreaPixels || croppedAreaPixels.width === 0) {
      setIsCropping(false);
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Cropping Image...' });
    
    try {
      const { width, height, x, y } = croppedAreaPixels;
      
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      const croppedResult = canvas.toDataURL('image/png');
      setResultImage(croppedResult);

      if (beforeImage) {
        const bImg = await createImage(beforeImage);
        const bCanvas = document.createElement('canvas');
        const bCtx = bCanvas.getContext('2d');
        if (bCtx) {
          bCanvas.width = width; bCanvas.height = height;
          bCtx.drawImage(bImg, x, y, width, height, 0, 0, width, height);
          setBeforeImage(bCanvas.toDataURL('image/png'));
        }
      }

      setIsCropping(false);
      setTimeout(() => {
        setProcessing({ isProcessing: false, error: null, progress: '' });
      }, 100);
    } catch (e: any) {
      console.error("Crop Error:", e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar', progress: '' });
      setIsCropping(false);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;

    setResultImage(null);
    setInitialResultImage(null);
    setProcessing({ isProcessing: true, error: null, progress: 'Chef AI Sedang Menata Meja...' });

    try {
      const result = await generateAestheticFood(
        sourceImage,
        prompt,
        aspectRatio,
        customTable || undefined
      );

      setResultImage(result);
      setInitialResultImage(result);
      setBeforeImage(sourceImage);
      setSliderPos(50);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || 'Gagal memproses gambar', progress: '' });
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'HD Upscale Image...' });
    try {
      const sharpened = await upscaleImage(resultImage, aspectRatio);
      setResultImage(sharpened);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
      setSliderPos(50);
    }
  };

  const handleGlobalReset = () => {
    setSourceImage(null);
    setBeforeImage(null);
    setCustomTable(null);
    setResultImage(null);
    setInitialResultImage(null);
    setSliderPos(50);
    setPrompt(FOOD_PRESETS[0].prompt);
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `food-aesthetic-${Date.now()}.png`;
    link.click();
  };

  const handleCustomTableUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomTable(reader.result as string);
        setPrompt('');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden">
      <div className="max-w-2xl lg:max-w-full mx-auto lg:h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        {/* Header - Hidden on Desktop */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Utensils size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">MAKANAN ESTETIK</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Photo Food Studio AI</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* Column 1: Source & Presets */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              {/* Step 1: Upload */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 px-1">
                  <Camera size={14} className="text-slate-300" /> 1. Foto Makanan
                </label>
                <div className="lg:flex-1 min-h-0">
                  <ImageUploader
                    label="Pilih Foto Produk"
                    image={sourceImage}
                    onImageSelect={(img) => { setSourceImage(img); setBeforeImage(img); setResultImage(null); }}
                    onClear={() => { setSourceImage(null); setBeforeImage(null); setResultImage(null); }}
                    aspectRatio="9-16"
                    labelInside
                  />
                </div>
              </div>

              {/* Reset All Button */}
              <button 
                onClick={handleGlobalReset}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-100"
              >
                <RefreshCw size={12} /> Reset Semua
              </button>
            </div>

            {/* Column 2: Presets & Aspect Ratio */}
            <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full lg:overflow-y-auto custom-scrollbar pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              
              {/* Step 2: Presets */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Sparkles size={14} className="text-slate-300" /> 2. Pilih Meja / Suasana
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => customTableRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-3 rounded-[24px] border-2 transition-all duration-300 gap-1 group relative overflow-hidden ${
                      customTable 
                        ? 'scale-105 shadow-md ring-2 ring-offset-2' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                    }`}
                    style={customTable ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}
                  >
                    {customTable && (
                      <img src={customTable} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Custom" />
                    )}
                    <div className={`relative z-10 transition-transform group-hover:scale-110 ${customTable ? 'text-white' : 'text-slate-400'}`}>
                      <ImageIcon size={18} />
                    </div>
                    <span className="relative z-10 text-[8px] font-black uppercase text-center leading-tight tracking-tight">Meja Kustom</span>
                    <input type="file" ref={customTableRef} onChange={handleCustomTableUpload} className="hidden" accept="image/*" />
                  </button>

                  {FOOD_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPrompt(p.prompt);
                        setCustomTable(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-[24px] border-2 transition-all duration-300 gap-1 group truncate ${
                        prompt === p.prompt && !customTable
                          ? 'scale-105 shadow-md' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                      }`}
                      style={prompt === p.prompt && !customTable ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}
                    >
                      <div className={`transition-transform group-hover:scale-110 ${prompt === p.prompt && !customTable ? 'text-white' : 'text-slate-400'}`}>
                        {p.icon}
                      </div>
                      <span className="text-[8px] font-black uppercase text-center leading-tight tracking-tight truncate w-full">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Prompt Extension */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Palette size={14} className="text-slate-300" /> 3. Deskripsi Tambahan
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (e.target.value) setCustomTable(null);
                  }}
                  placeholder="Beri detail seperti 'tambahkan mawar kecil'..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-4 text-[12px] font-semibold outline-none h-24 resize-none transition-all placeholder:text-slate-300 focus:bg-white focus:border-teal-500/20"
                  style={{ borderColor: prompt ? `${primaryColor}20` : undefined }}
                />
              </div>

              {/* Step 4: Aspect Ratio */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Maximize size={14} className="text-slate-300" /> 4. Rasio Output
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all duration-300 ${
                        aspectRatio === r.value 
                          ? 'shadow-sm' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                      style={aspectRatio === r.value ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}
                    >
                      <span className="text-[8px] font-black lowercase">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Generate Button */}
              <div className="hidden lg:block pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !sourceImage}
                  className="w-full py-4 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 group relative overflow-hidden"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  {processing.isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  <span>UBAH KE ESTETIK</span>
                </button>
              </div>

              {/* Mobile Generate Button */}
              <div className="lg:hidden pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !sourceImage}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ backgroundColor: (processing.isProcessing || !sourceImage) ? '#cbd5e1' : primaryColor }}
                >
                  HASILKAN
                </button>
              </div>
            </div>

            {/* Column 3: Result Rendering */}
            <div className="lg:col-span-5 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
               <div className="flex items-center justify-between shrink-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <ImageIcon size={14} className="text-slate-300" /> Hasil Estetik
                  </label>
               </div>

               <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className={`bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner w-full h-auto max-w-full max-h-full ${
                    aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-[16/9]' : aspectRatio === '3:4' ? 'aspect-[3/4]' : 'aspect-[4/3]'
                  }`}
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
                    aspectRatio: aspectRatio.replace(':', '/')
                  }}
                >
                  <AnimatePresence mode="wait">
                    {processing.isProcessing ? (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-sm"
                      >
                         <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                         <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">{processing.progress}</p>
                      </motion.div>
                    ) : resultImage ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                      >
                         {/* BEFORE/AFTER SLIDER */}
                         <div className="absolute inset-0">
                            <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                         </div>
                         <div 
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                         >
                            <img src={beforeImage!} alt="Before" className="w-full h-full object-cover" />
                         </div>
                         
                         {/* SLIDER HANDLE */}
                         <div 
                            className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)] cursor-ew-resize z-10"
                            style={{ left: `${sliderPos}%` }}
                         >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-slate-100">
                               <div className="flex gap-0.5">
                                  <div className="w-0.5 h-3 bg-slate-300 rounded-full" />
                                  <div className="w-0.5 h-3 bg-slate-300 rounded-full" />
                               </div>
                            </div>
                         </div>
                         
                         <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={sliderPos} 
                            onChange={(e) => setSliderPos(parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                         />

                         {/* LABELS */}
                         <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest z-30">Original</div>
                         <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest z-30">Estetik</div>
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
               </div>

               {/* Action Buttons */}
               <div className="grid grid-cols-5 gap-2 lg:gap-3 w-full mx-auto">
                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 bg-white border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 shadow-sm"
                    title="Preview"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={!resultImage || processing.isProcessing || resultImage === initialResultImage}
                    className="py-4 bg-white border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 shadow-sm"
                    title="Restore"
                  >
                    <Recycle size={20} />
                  </button>
                  <button
                    onClick={() => setIsCropping(true)}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 bg-white border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 shadow-sm"
                    title="Crop"
                  >
                    <Scissors size={20} />
                  </button>
                  <button
                    onClick={handleSharpen}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 bg-white border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 shadow-sm"
                    title="Sharpen"
                  >
                    <Zap size={20} />
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 text-white rounded-2xl flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:bg-slate-200 disabled:hover:scale-100 shadow-lg"
                    style={{ backgroundColor: !resultImage || processing.isProcessing ? undefined : primaryColor }}
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
               </div>

               {/* Error Message */}
               <AnimatePresence>
                 {processing.error && (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest"
                   >
                     {processing.error}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {isCropping && resultImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Foto Estetik</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCropping(false)}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCropSave}
                    className="px-6 py-2 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    style={{ backgroundColor: 'white' }}
                  >
                    <Check size={14} /> Simpan
                  </button>
                </div>
              </div>
              
              <div className="flex-1 relative">
                <Cropper
                  image={resultImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '9:16' ? 9/16 : aspectRatio === '16:9' ? 16/9 : aspectRatio === '3:4' ? 3/4 : 4/3}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="p-10 bg-black/50 backdrop-blur-md flex flex-col items-center gap-4">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-[11px] font-black text-white uppercase tracking-widest">
                    <span>Zoom Level</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {showPreview && resultImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
              onClick={() => setShowPreview(false)}
            >
              <div className="absolute top-6 right-6 z-[160]">
                 <button
                   onClick={() => setShowPreview(false)}
                   className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/20"
                 >
                   <X size={28} />
                 </button>
              </div>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-5xl w-full h-full flex items-center justify-center"
              >
                <img 
                  src={resultImage} 
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white/10" 
                  alt="Full Preview" 
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                  <button
                    onClick={handleDownload}
                    className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuberMakanan;
