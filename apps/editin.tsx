
/**
 * [INTEGRITY-CHECK]: 0x65646974696e
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, RefreshCw, Image as ImageIcon, Zap, X, Check, Scissors, Send, MessageSquare, Trash2, Eye, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { generateEditinResult, upscaleImage } from '../services/editin';
import { enhancePrompt } from '../services/buat';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberEditin: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [userRequest, setUserRequest] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('9:16');
  const [showPreview, setShowPreview] = useState(false);
  
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
    { label: '16:9', value: '16:9' as const },
    { label: '9:16', value: '9:16' as const },
    { label: '4:3', value: '4:3' as const },
    { label: '3:4', value: '3:4' as const },
    { label: '1:1', value: '1:1' as const },
  ];

  const handleImageUpload = (base64: string) => {
    setSourceImage(base64);
    setBeforeImage(base64);
    setResultImage(null);
  };

  const handleGenerate = async () => {
    if (!sourceImage || !userRequest.trim()) {
      setProcessing(prev => ({ ...prev, error: "Harap unggah foto dan masukkan permintaan." }));
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Mengolah Editin...' });
    setResultImage(null);
    setInitialResultImage(null);

    try {
      // Auto-enhance if the prompt is short
      let finalPrompt = userRequest;
      if (userRequest.split(' ').length < 5) {
        finalPrompt = await enhancePrompt(userRequest);
        setUserRequest(finalPrompt);
      }

      const result = await generateEditinResult(sourceImage, finalPrompt, aspectRatio);
      setResultImage(result);
      setInitialResultImage(result);
      setBeforeImage(sourceImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal mengedit foto.", progress: '' });
    }
  };

  const handleEnhancePrompt = async () => {
    if (!userRequest.trim()) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menyempurnakan Prompt...' });
    try {
      const enhanced = await enhancePrompt(userRequest);
      setUserRequest(enhanced);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: "Gagal menyempurnakan prompt.", progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `editin-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
      setSliderPos(50);
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
    if (!resultImage || !croppedAreaPixels) {
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
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar.', progress: '' });
      setIsCropping(false);
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling Image...' });
    try {
      const sharpenedImage = await upscaleImage(resultImage, aspectRatio);
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      console.error(e);
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
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
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">EDIT APA AJA</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Creative Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            {/* Column 1: Image Upload */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={12} className="text-slate-300" /> 1. Foto Sumber
                </label>
                <div className="lg:flex-1 min-h-0">
                  <ImageUploader 
                    label="Pilih Foto" 
                    image={sourceImage} 
                    onImageSelect={handleImageUpload} 
                    onClear={() => { setSourceImage(null); setBeforeImage(null); setResultImage(null); }} 
                    aspectRatio="9-16" 
                    labelInside 
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Prompt and Settings */}
            <div className="lg:col-span-3 flex flex-col gap-6 lg:h-full lg:overflow-y-auto lg:px-4 lg:border-r lg:border-slate-200 custom-scrollbar pt-6 lg:pt-0">
              {/* Prompt Input */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Send size={12} className="text-slate-300" /> 2. Permintaan Edit
                </label>
                <div className="relative h-32 lg:h-24 shrink-0">
                  <textarea 
                    value={userRequest}
                    onChange={(e) => setUserRequest(e.target.value)}
                    placeholder="Contoh: Tambahkan kacamata hitam, ubah latar belakang jadi pantai, atau ganti warna baju..."
                    className="w-full h-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-200 transition-all resize-none placeholder:text-slate-300"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={() => setUserRequest('')}
                      disabled={!userRequest.trim() || processing.isProcessing}
                      className="p-2 bg-white shadow-lg border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={!userRequest.trim() || processing.isProcessing}
                      className="p-2 bg-white shadow-lg border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={16} style={{ color: userRequest.trim() ? primaryColor : undefined }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={12} className="text-slate-300" /> 3. Aspek Rasio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all aspect-square ${
                        aspectRatio === r.value 
                          ? 'scale-105 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                        color: aspectRatio === r.value ? 'white' : undefined,
                        borderColor: aspectRatio === r.value ? primaryColor : undefined,
                      }}
                    >
                      <span className="text-[8px] font-black">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button (Desktop) */}
              <div className="pt-2 hidden lg:block">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !sourceImage || !userRequest.trim()}
                  className="w-full py-4 rounded-2xl border-2 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !sourceImage || !userRequest.trim()) ? '#cbd5e1' : primaryColor, 
                    borderColor: (processing.isProcessing || !sourceImage || !userRequest.trim()) ? '#cbd5e1' : primaryColor 
                  }}
                >
                  <span className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <Sparkles size={16} /> HASILKAN
                  </span>
                </button>
              </div>

              {/* Mobile Generate Button */}
              <div className="lg:hidden pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !sourceImage || !userRequest.trim()}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ backgroundColor: (processing.isProcessing || !sourceImage || !userRequest.trim()) ? '#cbd5e1' : primaryColor }}
                >
                  HASILKAN
                </button>
              </div>
            </div>

            {/* Column 3: Result Section */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={12} className="text-slate-300" /> Hasil Edit Apa Aja
                </label>
              </div>

              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                   className={`bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner ${
                    aspectRatio === '1:1' ? 'aspect-square' :
                    aspectRatio === '3:4' ? 'aspect-[3/4]' :
                    aspectRatio === '4:3' ? 'aspect-[4/3]' :
                    aspectRatio === '9:16' ? 'aspect-[9/16]' :
                    'aspect-[16/9]'
                  }`}
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
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
                        <div className="absolute inset-0 text-white flex items-center justify-center">
                          <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                        </div>
                        {beforeImage && (
                          <>
                            <div 
                              className="absolute inset-0 overflow-hidden"
                              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                            >
                              <img src={beforeImage} alt="Original" className="w-full h-full object-cover" />
                            </div>
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
                            <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest z-30">
                              Original
                            </div>
                            <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest z-30">
                              Editin Result
                            </div>
                          </>
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
              </div>

               <div className="grid grid-cols-5 lg:grid-cols-6 gap-2 lg:gap-3 w-full mx-auto">
                  <button onClick={() => setShowPreview(true)} disabled={processing.isProcessing || !resultImage} className="order-1 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"><Eye size={20} /></button>
                  <button onClick={() => setIsCropping(true)} disabled={processing.isProcessing || !resultImage} className="order-2 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"><Scissors size={20} /></button>
                  <button onClick={handleSharpen} disabled={processing.isProcessing || !resultImage} className="order-3 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"><Zap size={20} /></button>
                  <button onClick={handleReset} disabled={processing.isProcessing || !resultImage || resultImage === initialResultImage} className="order-4 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"><Recycle size={20} /></button>
                  <button onClick={handleDownload} disabled={processing.isProcessing || !resultImage} className="order-6 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"><Download size={20} /></button>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {processing.error && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest">
                      {processing.error}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Full Screen Preview Modal */}
        <AnimatePresence>
          {showPreview && resultImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-12" onClick={() => setShowPreview(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img src={resultImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" alt="Full Preview" />
                <button onClick={() => setShowPreview(false)} className="absolute -top-4 -right-4 lg:top-0 lg:-right-12 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"><X size={24} /></button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                  <button onClick={handleDownload} className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-2"><Download size={16} /> Download HD</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crop Modal */}
        <AnimatePresence>
          {isCropping && resultImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Editin</h2>
                <div className="flex gap-3">
                  <button onClick={() => setIsCropping(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Batal</button>
                  <button onClick={handleCropSave} className="px-6 py-2 text-black rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2" style={{ backgroundColor: 'white' }}><Check size={14} /> Simpan Crop</button>
                </div>
              </div>
              <div className="flex-1 relative">
                <Cropper image={resultImage} crop={crop} zoom={zoom} aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '3:4' ? 3/4 : aspectRatio === '4:3' ? 4/3 : aspectRatio === '9:16' ? 9/16 : 16/9} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
              </div>
              <div className="p-8 bg-black/50 backdrop-blur-md flex flex-col items-center gap-4">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-white/60 uppercase tracking-widest"><span>Zoom</span><span>{Math.round(zoom * 100)}%</span></div>
                  <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuberEditin;
