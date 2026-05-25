import React, { useState, useCallback } from 'react';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Image as ImageIcon,
  Zap,
  Trash2,
  X,
  Maximize,
  Scissors,
  Eye,
  Recycle,
  Wand2,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { generateRealImage, upscaleImage, enhancePrompt } from '../services/buat';
import { useTheme } from '../src/contexts/ThemeContext';
import ImageUploader from '../components/ImageUploader';

// --- Types ---
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const BuatApp: React.FC = () => {
  const { primaryColor } = useTheme();
  
  // --- State ---
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [processing, setProcessing] = useState<{
    isProcessing: boolean;
    error: string | null;
    progress: string;
  }>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const ratios = [
    { label: '1:1', value: '1:1' },
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
    { label: '4:3', value: '4:3' },
    { label: '3:4', value: '3:4' },
  ];
  
  // --- Cropping State ---
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setProcessing(p => ({ ...p, error: "Silakan masukkan deskripsi gambar." }));
      return;
    }

    setResultImage(null);
    setInitialResultImage(null);
    setProcessing({ 
      isProcessing: true, 
      error: null, 
      progress: isEditMode && sourceImage ? 'Sedang Mengedit Gambar...' : 'Imajinasi AI Sedang Berjalan...' 
    });

    try {
      const result = await generateRealImage(prompt, aspectRatio, isEditMode ? (sourceImage || undefined) : undefined);
      setResultImage(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      let errorMessage = err.message || "Gagal membuat gambar.";
      setProcessing({ isProcessing: false, error: errorMessage, progress: '' });
    }
  };

  const handleUpscale = async () => {
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

  const handleEnhance = async () => {
    if (!prompt.trim() || processing.isProcessing) return;
    setProcessing(p => ({ ...p, isProcessing: true, progress: 'Menyempurnakan Prompt...' }));
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
      setProcessing(p => ({ ...p, isProcessing: false, progress: '' }));
    } catch (err: any) {
      setProcessing(p => ({ ...p, isProcessing: false, error: "Gagal memperbagus prompt.", progress: '' }));
    }
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

  const handleCropSave = async () => {
    if (!resultImage || !croppedAreaPixels || croppedAreaPixels.width === 0) {
      setIsCropping(false);
      return;
    }

    setProcessing(p => ({ ...p, isProcessing: true, progress: 'Cropping Image...' }));
    
    try {
      const { width, height, x, y } = croppedAreaPixels;
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      setResultImage(canvas.toDataURL('image/png'));
      setIsCropping(false);
      setProcessing(p => ({ ...p, isProcessing: false, progress: '' }));
    } catch (e: any) {
      setProcessing(p => ({ ...p, isProcessing: false, error: 'Gagal memotong gambar', progress: '' }));
      setIsCropping(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `guber-visual-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    setPrompt('');
    setResultImage(null);
    setInitialResultImage(null);
    setSourceImage(null);
    setProcessing({ isProcessing: false, error: null, progress: '' });
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
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">BUAT VISUAL AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Creative Image Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* Column 1: Mode & Prompt */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              
              {/* Step 1: Edit Image Toggle */}
              <div className="space-y-3 shrink-0">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> 1. Edit Gambar
                  </label>
                  <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="transition-colors duration-300"
                    style={{ color: isEditMode ? primaryColor : '#cbd5e1' }}
                  >
                    {isEditMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {isEditMode && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 bg-slate-50 rounded-[24px] border border-slate-100">
                        <ImageUploader 
                          onImageSelect={setSourceImage} 
                          image={sourceImage}
                          onClear={() => setSourceImage(null)}
                          label="Foto Referensi"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Step 2: Prompt Enhancement */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Zap size={14} className="text-slate-300" /> 2. Deskripsi Gambar
                  </label>
                  <button 
                    onClick={handleReset}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 border border-slate-100"
                  >
                    <RefreshCw size={10} /> Reset
                  </button>
                </div>
                <div className="relative flex-1 group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Bayangkan apapun, Biarkan AI mewujudkannya..."
                    className="w-full h-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[32px] text-sm font-semibold focus:border-slate-200 focus:bg-white outline-none resize-none transition-all shadow-inner placeholder:text-slate-300"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={() => setPrompt('')}
                      className="p-2.5 bg-white shadow-lg border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                      title="Bersihkan Teks"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={handleEnhance}
                      disabled={!prompt.trim() || processing.isProcessing}
                      className="p-2.5 bg-white shadow-lg border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all disabled:opacity-50"
                      title="Sempurnakan dengan AI"
                    >
                      <Wand2 size={16} style={{ color: prompt.trim() ? primaryColor : undefined }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Generate Button */}
              <div className="lg:hidden">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !prompt.trim()}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ backgroundColor: (processing.isProcessing || !prompt.trim()) ? '#cbd5e1' : primaryColor }}
                >
                  HASILKAN
                </button>
              </div>
            </div>

            {/* Column 2: Ratio & Settings */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              
              {/* Step 3: Aspect Ratio */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Maximize size={14} className="text-slate-300" /> 3. Rasio Kanvas
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value as AspectRatio)}
                      className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${
                        aspectRatio === r.value 
                          ? 'shadow-sm' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                      style={aspectRatio === r.value ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}
                    >
                      <span className="text-[8px] font-black">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>



              {/* Desktop Generate Button */}
              <div className="hidden lg:block pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !prompt.trim()}
                  className="w-full py-4 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 relative overflow-hidden group"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  {processing.isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  <span>JALANKAN AI</span>
                </button>
              </div>
            </div>

            {/* Column 3: Result Display */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Visual
                </label>
              </div>

              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className={`bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner w-full h-auto max-w-full max-h-full ${
                    aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '16:9' ? 'aspect-[16/9]' : aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-[3/4]'
                  }`}
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
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
                        <img src={resultImage} alt="Visual Output" className="w-full h-full object-contain bg-slate-50" />
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                          <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-12 h-12 object-contain grayscale opacity-50" alt="Logo" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">Belum Ada Karya</p>
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
                  title="Lihat Full"
                >
                  <Eye size={20} />
                </button>
                <button 
                  onClick={() => setIsCropping(true)}
                  disabled={!resultImage || processing.isProcessing}
                  className="py-4 bg-white border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 shadow-sm"
                  title="Potong"
                >
                  <Scissors size={20} />
                </button>
                <button 
                  onClick={handleUpscale}
                  disabled={!resultImage || processing.isProcessing}
                  className="py-4 bg-white border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 shadow-sm"
                  title="Tajamkan"
                >
                  <Zap size={20} />
                </button>
                <button 
                  onClick={() => setResultImage(initialResultImage)}
                  disabled={!resultImage || processing.isProcessing || resultImage === initialResultImage}
                  className="py-4 bg-white border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 shadow-sm"
                  title="Kembalikan"
                >
                  <Recycle size={20} />
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={!resultImage || processing.isProcessing}
                  className="py-4 text-white rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:bg-slate-200 disabled:hover:scale-100"
                  style={{ backgroundColor: !resultImage || processing.isProcessing ? undefined : primaryColor }}
                  title="Simpan"
                >
                  <Download size={20} />
                </button>
              </div>

              {/* Error Popup */}
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

        {/* Modals: Crop & Preview */}
        <AnimatePresence>
          {isCropping && resultImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Karya AI</h2>
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
                  aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '16:9' ? 16/9 : aspectRatio === '9:16' ? 9/16 : aspectRatio === '4:3' ? 4/3 : 3/4}
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
              className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
              onClick={() => setShowPreview(false)}
            >
              <div className="absolute top-6 right-6 z-[210]">
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
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                  <button
                    onClick={handleDownload}
                    className="bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                  >
                    <Download size={18} /> Simpan Galeri
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

export default BuatApp;
