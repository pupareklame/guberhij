import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Download, RefreshCw, ImageIcon, Eye, Scissors, X, Check, Zap, Trash2, Plus, Image as LucideImage } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { mergeImages, upscaleMergedImage } from '../services/gabungpro';
import { useTheme } from '../src/contexts/ThemeContext';

const GabungPro: React.FC = () => {
  const { primaryColor } = useTheme();
  const [images, setImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showPreview, setShowPreview] = useState(false);
  
  // Crop States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const ratios = [
    { label: '1:1', value: '1:1' },
    { label: '3:4', value: '3:4' },
    { label: '4:3', value: '4:3' },
    { label: '9:16', value: '9:16' },
    { label: '16:9', value: '16:9' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessMerge = async () => {
    if (images.length < 2) {
      setProcessing({ isProcessing: false, error: "Harap unggah minimal 2 gambar.", progress: '' });
      return;
    }

    if (!prompt.trim()) {
      setProcessing({ isProcessing: false, error: "Harap isi perintah penggabungan.", progress: '' });
      return;
    }

    setResultImage(null);
    setInitialResultImage(null);
    setIsCropping(false);
    setProcessing({ isProcessing: true, error: null, progress: 'Merging Images with AI...' });

    try {
      const result = await mergeImages(images, prompt, aspectRatio);
      setResultImage(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal menggabungkan gambar.", progress: '' });
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling Merged Image...' });
    try {
      const sharpenedImage = await upscaleMergedImage(resultImage, aspectRatio);
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `gabungpro-${Date.now()}.png`;
    link.click();
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
      if (!url.startsWith('data:')) image.crossOrigin = 'anonymous';
      image.src = url;
    });

  const handleCropSave = async () => {
    if (!resultImage || !croppedAreaPixels) {
      setIsCropping(false);
      return;
    }
    setProcessing({ isProcessing: true, error: null, progress: 'Cropping...' });
    try {
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas support needed");

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      
      setResultImage(canvas.toDataURL('image/png'));
      setIsCropping(false);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar.', progress: '' });
      setIsCropping(false);
    }
  };

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden">
      <div className="max-w-7xl mx-auto lg:h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        
        {/* Header Mobile Only */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))` }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Layers size={16} />
              </div>
              <div className="flex flex-col text-center">
                <h1 className="text-base font-black text-white tracking-tight uppercase">GABUNG PRO AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/60 text-center">Seamless Image Merger</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* Column 1: Multi Upload */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
               <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                 <LucideImage size={14} className="text-slate-300" /> 1. Gambar Sumber
               </label>
               
               <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-100 rounded-[32px] p-4 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm group">
                        <img src={img} className="w-full h-full object-cover" alt={`Gambar ${idx+1}`} />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[8px] font-black text-white uppercase">
                          Gbr {idx + 1}
                        </div>
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    
                    <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-100/50 hover:border-slate-300 transition-all">
                      <Plus size={20} className="text-slate-300" />
                      <span className="text-[8px] font-black text-slate-400 uppercase">Tambah</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                  
                  {images.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                      <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-3">
                         <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-10 h-10 object-contain grayscale opacity-50" alt="Logo" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Unggah beberapa gambar untuk digabungkan</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Column 2: Prompt */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
               <div className="flex-1 flex flex-col min-h-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-slate-300" /> 2. Perintah AI
                  </label>
                  <div className="relative flex-1">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Contoh: Gabungkan gambar 2 ke dalam HP yang dipegang pria di gambar 1, buat pencahayaannya senada..."
                      className="w-full h-full p-6 bg-slate-50 border-2 border-slate-200 rounded-[32px] text-sm font-medium focus:border-slate-400 focus:outline-none resize-none transition-all shadow-inner"
                    />
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={() => setPrompt('')}
                        disabled={!prompt.trim() || processing.isProcessing}
                        className="p-2 bg-white shadow-lg border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
               </div>

               <button 
                  onClick={handleProcessMerge}
                  disabled={processing.isProcessing || images.length < 2 || !prompt.trim()}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 mt-auto"
                  style={{ backgroundColor: (processing.isProcessing || images.length < 2 || !prompt.trim()) ? '#cbd5e1' : primaryColor }}
                >
                  GABUNGKAN SEKARANG
                </button>
            </div>

            {/* Column 3: Result */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Penggabungan
                </label>
                
                <div className="flex items-center gap-1.5 ml-4 overflow-x-auto no-scrollbar">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black shrink-0 ${aspectRatio === r.value ? 'shadow-sm' : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}
                      style={{
                        backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                        color: aspectRatio === r.value ? 'white' : undefined,
                        borderColor: aspectRatio === r.value ? primaryColor : undefined,
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className="bg-slate-50 border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner w-full h-auto max-w-full max-h-full"
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
                    aspectRatio: aspectRatio.replace(':', '/')
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
                        <img src={resultImage} alt="Merged Result" className="w-full h-full object-contain" />
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                        <div className="w-20 h-20 rounded-[40px] bg-slate-100 flex items-center justify-center mb-4">
                           <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-14 h-14 object-contain grayscale opacity-50" alt="Logo" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">Belum Ada Hasil</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 5 Action Buttons */}
              <div className="grid grid-cols-5 gap-2 lg:gap-3 w-full">
                <button 
                  onClick={() => setShowPreview(true)}
                  disabled={processing.isProcessing || !resultImage}
                  title="Preview"
                  className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Eye size={20} />
                </button>
                <button 
                  onClick={() => setIsCropping(true)}
                  disabled={processing.isProcessing || !resultImage}
                  title="Crop"
                  className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Scissors size={20} />
                </button>
                <button 
                  onClick={handleSharpen}
                  disabled={processing.isProcessing || !resultImage}
                  title="Sharpen"
                  className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Zap size={20} />
                </button>
                <button 
                  onClick={handleReset}
                  disabled={processing.isProcessing || !initialResultImage || resultImage === initialResultImage}
                  title="Reset"
                  className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <RefreshCw size={20} />
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={processing.isProcessing || !resultImage}
                  title="Download"
                  className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

       {/* Modals: Preview & Crop */}
       <AnimatePresence>
        {showPreview && resultImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-12"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={resultImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" alt="Preview Full" />
              <button 
                onClick={() => setShowPreview(false)}
                className="absolute top-0 -right-12 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}

        {isCropping && resultImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil</h2>
              <div className="flex gap-3">
                <button onClick={() => setIsCropping(false)} className="px-6 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase">Batal</button>
                <button onClick={handleCropSave} className="px-6 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase">Simpan</button>
              </div>
            </div>
            <div className="flex-1 relative">
              <Cropper
                image={resultImage}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '3:4' ? 3/4 : aspectRatio === '4:3' ? 4/3 : aspectRatio === '9:16' ? 9/16 : 16/9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-8 flex flex-col items-center gap-2">
               <span className="text-white/60 text-[10px] font-black uppercase">Zoom: {Math.round(zoom * 100)}%</span>
               <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full max-w-xs accent-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GabungPro;
