import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Calendar, 
  User, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Image as ImageIcon, 
  Eye, 
  Scissors, 
  X, 
  Check, 
  Zap, 
  Maximize,
  Cake,
  Clock
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { generateMemoryArt, upscaleImage } from '../services/memoryService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const MemoryApp: React.FC = () => {
  const { primaryColor } = useTheme();
  
  // App States
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [yearOld, setYearOld] = useState('1998');
  const [yearNow, setYearNow] = useState('2026');
  const [dateMonth, setDateMonth] = useState('12 Januari');
  const [cakeNumber, setCakeNumber] = useState('28');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [seating, setSeating] = useState<'facing' | 'parallel'>('facing');
  const [seatingCustom, setSeatingCustom] = useState('');
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResult, setInitialResult] = useState<string | null>(null);
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

  const handleGenerate = async () => {
    if (!baseImage) {
      setProcessing({ isProcessing: false, error: "Harap unggah Foto Anda.", progress: '' });
      return;
    }

    setResultImage(null);
    setInitialResult(null);
    setIsCropping(false);
    setProcessing({ isProcessing: true, error: null, progress: 'Menciptakan Kenangan...' });

    try {
      const result = await generateMemoryArt(
        baseImage, 
        yearOld, 
        yearNow, 
        dateMonth, 
        cakeNumber, 
        seating,
        aspectRatio,
        seatingCustom
      );
      
      setResultImage(result);
      setInitialResult(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal membuat gambar memori.", progress: '' });
    }
  };

  const handleUpscale = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menajamkan Gambar...' });
    try {
      const sharpened = await upscaleImage(resultImage, aspectRatio);
      setResultImage(sharpened);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `memori-${Date.now()}.png`;
    link.click();
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!resultImage || !croppedAreaPixels) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Memotong Gambar...' });
    try {
      const image = new Image();
      image.src = resultImage;
      await new Promise(resolve => image.onload = resolve);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error();

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
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err) {
      setProcessing({ isProcessing: false, error: "Gagal memotong gambar.", progress: '' });
      setIsCropping(false);
    }
  };

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden">
      <div className="max-w-2xl lg:max-w-full mx-auto lg:h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        {/* Header Mobile */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))` }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Heart size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">MEMORI AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Emotional Art Generator</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* COLUMN 1: Inputs */}
            <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
               {/* Foto Upload */}
               <div className="flex-1 flex flex-col min-h-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <User size={14} className="text-slate-300" /> 1. Foto Wajah
                  </label>
                  <div className="lg:flex-1 min-h-0">
                    <ImageUploader
                      label="Pilih Foto Anda"
                      image={baseImage}
                      onImageSelect={setBaseImage}
                      onClear={() => { setBaseImage(null); setResultImage(null); }}
                      aspectRatio="9-16"
                      labelInside
                    />
                  </div>
               </div>

               {/* Form Inputs */}
               <div className="shrink-0 space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <Clock size={12} className="text-slate-300" /> Tahun Kecil
                      </label>
                      <input 
                        type="text" 
                        value={yearOld}
                        onChange={(e) => setYearOld(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-[11px] font-bold focus:border-slate-300 outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <Clock size={12} className="text-slate-300" /> Tahun Sekarang
                      </label>
                      <input 
                        type="text" 
                        value={yearNow}
                        onChange={(e) => setYearNow(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-[11px] font-bold focus:border-slate-300 outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <Calendar size={12} className="text-slate-300" /> Tanggal
                      </label>
                      <input 
                        type="text" 
                        value={dateMonth}
                        onChange={(e) => setDateMonth(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-[11px] font-bold focus:border-slate-300 outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <Cake size={12} className="text-slate-300" /> Kuetart
                      </label>
                      <input 
                        type="text" 
                        value={cakeNumber}
                        onChange={(e) => setCakeNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-[11px] font-bold focus:border-slate-300 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Generate Button Mobile */}
                  <div className="lg:hidden">
                    <button 
                      onClick={handleGenerate}
                      disabled={processing.isProcessing || !baseImage}
                      className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-95 disabled:opacity-30"
                      style={{ backgroundColor: primaryColor }}
                    >
                      HASILKAN KENANGAN
                    </button>
                  </div>
               </div>

               {/* Seating Arrangement */}
               <div className="space-y-3 pt-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <User size={14} className="text-slate-300" /> Posisi Duduk
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSeating('facing')}
                      className={`px-3 py-2 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${
                        seating === 'facing' 
                          ? 'text-white border-transparent' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 shadow-sm'
                      }`}
                      style={{ backgroundColor: seating === 'facing' ? primaryColor : undefined }}
                    >
                      Berhadapan
                    </button>
                    <button
                      onClick={() => setSeating('parallel')}
                      className={`px-3 py-2 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-tight ${
                        seating === 'parallel' 
                          ? 'text-white border-transparent' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 shadow-sm'
                      }`}
                      style={{ backgroundColor: seating === 'parallel' ? primaryColor : undefined }}
                    >
                      Sejajar
                    </button>
                  </div>

                  {/* Kolom Prompt Kustom Posisi Duduk */}
                  <div className="pt-1">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none block mb-1.5">Instruksi Posisi Duduk Kustom (Opsional)</label>
                    <input 
                      type="text" 
                      value={seatingCustom}
                      onChange={(e) => setSeatingCustom(e.target.value)}
                      placeholder="Contoh: Duduk bersila di atas karpet kayu hangat..."
                      className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-[11px] font-bold focus:border-slate-300 outline-none transition-all shadow-inner placeholder-slate-300"
                    />
                  </div>
               </div>
            </div>

            {/* COLUMN 2: Result & Preview */}
            <div className="lg:col-span-8 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Rasio
                </label>
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar justify-end ml-4">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`px-3 py-1.5 lg:px-2 lg:py-1 rounded-lg border transition-all text-[10px] lg:text-[9px] font-black shrink-0 ${
                        aspectRatio === r.value 
                          ? 'shadow-sm text-white' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 shadow-sm'
                      }`}
                      style={{ 
                        backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                        borderColor: aspectRatio === r.value ? primaryColor : undefined
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className="bg-slate-50 border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner"
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}30`,
                    aspectRatio: aspectRatio.replace(':', '/'),
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%'
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
                        <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Loading" />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">{processing.progress}</p>
                      </motion.div>
                    ) : resultImage ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative p-4"
                      >
                         <img src={resultImage} alt="Result" className="w-full h-full object-contain rounded-[24px] shadow-2xl" />
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                           <Heart size={32} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Belum Ada Hasil</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ACTION BAR */}
              <div className="grid grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3 shrink-0">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !baseImage}
                  className="hidden lg:flex col-span-2 py-4 rounded-2xl text-white items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles size={18} className="mr-2" />
                  <span className="font-black uppercase tracking-widest text-[10px]">HASILKAN</span>
                </button>

                <button 
                  onClick={() => setShowPreview(true)}
                  disabled={!resultImage}
                  className="order-1 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all bg-white shadow-sm disabled:opacity-30"
                >
                  <Eye size={20} />
                </button>

                <button 
                  onClick={() => setIsCropping(true)}
                  disabled={!resultImage}
                  className="order-2 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all bg-white shadow-sm disabled:opacity-30"
                >
                  <Scissors size={20} />
                </button>

                <button 
                  onClick={handleUpscale}
                  disabled={!resultImage || processing.isProcessing}
                  className="order-3 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-rose-500 transition-all bg-white shadow-sm disabled:opacity-30"
                >
                  <Zap size={20} />
                </button>

                <button 
                  onClick={() => { if (initialResult) setResultImage(initialResult); }}
                  disabled={!initialResult || resultImage === initialResult}
                  className="order-4 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all bg-white shadow-sm disabled:opacity-30"
                >
                  <RefreshCw size={20} />
                </button>

                <button 
                  onClick={handleDownload}
                  disabled={!resultImage}
                  className="order-5 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all bg-white shadow-sm disabled:opacity-30"
                >
                  <Download size={20} />
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {processing.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest"
                  >
                    {processing.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
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
              <img src={resultImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" alt="Full Preview" />
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-4 -right-4 lg:top-0 lg:-right-12 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all font-black"
              >
                <X size={24} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <button
                  onClick={handleDownload}
                  className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2"
                >
                  <Download size={16} /> Download HD
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Kenangan</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-6 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  onClick={handleCropSave}
                  className="px-6 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase flex items-center gap-2 tracking-widest"
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
                aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '3:4' ? 3/4 : aspectRatio === '4:3' ? 4/3 : aspectRatio === '9:16' ? 9/16 : 16/9}
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
                   onChange={(e) => setZoom(Number(e.target.value))}
                   className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                 />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryApp;
