
/**
 * [INTEGRITY-CHECK]: 0x706173666F746F
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, User, Download, RefreshCw, Scissors, Check, X, Sparkles, Shirt, Palette, Maximize, Zap, Eye, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { PasFotoConfig, ProcessingState, FotoSize, Gender } from '../types';
import { generatePasFoto, upscaleImage } from '../services/pasfoto';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const CATEGORIES = [
  { id: 'JAS', name: 'Jas Formal', icon: '🤵' },
  { id: 'PDH_KHAKI', name: 'PDH Khaki (PNS)', icon: '👨‍🏫' },
  { id: 'KEMEJA_PUTIH', name: 'Kemeja Putih', icon: '👔' },
  { id: 'SD', name: 'Seragam SD', icon: '🎒' },
  { id: 'SMP', name: 'Seragam SMP', icon: '📚' },
  { id: 'SMA', name: 'Seragam SMA', icon: '🎓' },
  { id: 'CUSTOM', name: 'Pakai Baju Asli', icon: '📷' },
];

const TIE_STYLES = [
  { id: 'TANPA_DASI', name: 'Tanpa Dasi', icon: '❌' },
  { id: 'SD', name: 'Dasi SD', icon: '🔴' },
  { id: 'SMP', name: 'Dasi SMP', icon: '🔵' },
  { id: 'SMA', name: 'Dasi SMA', icon: '⚪' },
  { id: 'PEJABAT', name: 'Dasi Pejabat', icon: '👔' },
  { id: 'KUPU_KUPU', name: 'Kupu-kupu', icon: '🦋' },
  { id: 'SILANG', name: 'Dasi Silang', icon: '✖️' },
  { id: 'CUSTOM', name: 'Custom', icon: '🎨' },
];

const GuberPasFoto: React.FC = () => {
  const { primaryColor } = useTheme();
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [customOutfit, setCustomOutfit] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResult, setOriginalResult] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [config, setConfig] = useState<PasFotoConfig>({
    category: 'PDH_KHAKI',
    gender: 'LAKI_LAKI', 
    useHijab: false, 
    hijabColor: 'Hitam', 
    hijabStyle: 'SEGI_EPAT', 
    hairStyle: 'ORIGINAL_NEAT', 
    bgColor: 'Merah', 
    size: '4x6', 
    useNameTag: false, 
    nameTagText: '', 
    nameTagMaterial: 'HITAM', 
    useKorpriLogo: true, 
    useSuit: false, 
    useTie: false,
    tieStyle: 'TANPA_DASI'
  });

  const [processing, setProcessing] = useState<ProcessingState>({ 
    isProcessing: false, 
    error: null, 
    progress: '' 
  });

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
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
      canvas.width = width; canvas.height = height;
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      const base64Image = canvas.toDataURL('image/png');
      setResultImage(base64Image);
      setIsCropping(false);
    } catch (e) { 
      console.error(e); 
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto', progress: '' });
    }
  };

  const handleGenerate = async () => {
    if (!faceImage) { 
      setProcessing({ isProcessing: false, error: "Harap unggah foto wajah.", progress: '' }); 
      return; 
    }
    
    setResultImage(null);
    setOriginalResult(null);
    setIsCropping(false);
    setProcessing({ isProcessing: true, error: null, progress: 'Neural Studio sedang menjahit seragam...' });

    try {
      const result = await generatePasFoto(faceImage, { ...config, customOutfitImage: customOutfit || undefined });
      setResultImage(result);
      setOriginalResult(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) { 
      setProcessing({ isProcessing: false, error: err.message || 'Gagal memproses foto', progress: '' }); 
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling Image...' });
    try {
      const sharpenedImage = await upscaleImage(resultImage, config.size === '3x4' ? "3:4" : "2:3");
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `pasfoto-${Date.now()}.png`;
    link.click();
  };

  const currentAspect = config.size === '3x4' ? 3 / 4 : 2 / 3;
  const aspectClass = config.size === '3x4' ? 'aspect-[3/4]' : 'aspect-[2/3]';

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden text-slate-900">
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
                <Camera size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">PAS FOTO PRO</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Guber Studio Official</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* Column 1: Subject & Gender */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              {/* Image Uploader */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <User size={14} className="text-slate-300" /> 1. Foto Wajah
                </label>
                <div className="lg:flex-1 min-h-0">
                  <ImageUploader
                    label="Unggah Foto"
                    image={faceImage}
                    onImageSelect={setFaceImage}
                    aspectRatio="square"
                    labelInside
                  />
                </div>
              </div>

              {/* Gender Selection */}
              <div className="shrink-0 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-slate-300" /> 2. Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                  {(['LAKI_LAKI', 'PEREMPUAN'] as Gender[]).map(g => (
                    <button 
                      key={g} 
                      onClick={() => setConfig({...config, gender: g})} 
                      className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${config.gender === g ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      style={{ color: config.gender === g ? primaryColor : undefined }}
                    >
                      {g === 'LAKI_LAKI' ? 'Pria' : 'Wanita'}
                    </button>
                  ))}
                </div>

                {/* Hijab Options for Perempuan */}
                <AnimatePresence>
                  {config.gender === 'PEREMPUAN' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-2 border-t border-slate-100 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Berhijab?</label>
                        <button
                          onClick={() => setConfig({...config, useHijab: !config.useHijab})}
                          className={`w-9 h-5 rounded-full relative transition-all duration-300 ${config.useHijab ? '' : 'bg-slate-300'}`}
                          style={{ backgroundColor: config.useHijab ? primaryColor : undefined }}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.useHijab ? 'left-5' : 'left-1'}`} />
                        </button>
                      </div>

                      {config.useHijab && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-1">
                            {['Putih', 'Hitam', 'Kustom'].map(color => (
                              <button 
                                key={color} 
                                onClick={() => setConfig({...config, hijabColor: color})}
                                className={`py-1.5 rounded-lg border text-[8px] font-black uppercase transition-all ${config.hijabColor === color ? 'text-white' : 'border-slate-100 bg-white text-slate-400'}`}
                                style={{ 
                                  backgroundColor: config.hijabColor === color ? primaryColor : undefined,
                                  borderColor: config.hijabColor === color ? primaryColor : undefined,
                                }}
                              >
                                {color}
                              </button>
                            ))}
                          </div>
                          {config.hijabColor === 'Kustom' && (
                            <input 
                              type="text" 
                              placeholder="Ketik warna..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none focus:border-slate-400 uppercase"
                              onChange={(e) => setConfig({...config, hijabColor: e.target.value})}
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Column 2: Outfit & Options */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Shirt size={14} className="text-slate-300" /> 3. Pilih Pakaian
                </label>
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar lg:pr-1">
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setConfig({...config, category: cat.id as any})}
                        className={`flex flex-col items-center justify-center p-3 rounded-[24px] border-2 transition-all duration-300 min-h-[60px] group ${
                          config.category === cat.id 
                            ? 'scale-[1.02] shadow-md border-transparent text-white' 
                            : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                        }`}
                        style={{
                          backgroundColor: config.category === cat.id ? primaryColor : undefined,
                        }}
                      >
                        <span className="text-lg mb-1 transition-transform group-hover:scale-110">{cat.icon}</span>
                        <span className={`text-[8px] font-black uppercase tracking-tight text-center leading-tight`}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {config.category === 'CUSTOM' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 overflow-hidden"
                    >
                      <ImageUploader
                        label="Unggah Baju Asli"
                        image={customOutfit}
                        onImageSelect={setCustomOutfit}
                        aspectRatio="square"
                        labelInside
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="shrink-0 space-y-4 pt-2 border-t border-slate-100">
                {/* Tie & Color Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pakai Dasi?</label>
                      <button
                        onClick={() => setConfig({...config, useTie: !config.useTie, tieStyle: !config.useTie ? 'SD' : 'TANPA_DASI'})}
                        className={`w-9 h-5 rounded-full relative transition-all duration-300 ${config.useTie ? '' : 'bg-slate-300'}`}
                        style={{ backgroundColor: config.useTie ? primaryColor : undefined }}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.useTie ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                    {config.useTie && (
                      <select 
                        value={config.tieStyle}
                        onChange={(e) => setConfig({...config, tieStyle: e.target.value as any})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[9px] font-bold text-slate-700 focus:border-slate-400 outline-none"
                      >
                        {TIE_STYLES.filter(t => t.id !== 'TANPA_DASI').map(tie => (
                          <option key={tie.id} value={tie.id}>{tie.icon} {tie.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block">Latar Belakang</label>
                    <div className="flex justify-end gap-1">
                      {['Biru', 'Merah', 'Putih'].map(color => (
                        <button 
                          key={color} 
                          onClick={() => setConfig({...config, bgColor: color})}
                          className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center p-0.5 ${config.bgColor === color ? 'shadow-md scale-110' : 'border-slate-100 bg-white'}`}
                          style={{ borderColor: config.bgColor === color ? primaryColor : undefined }}
                        >
                          <div className={`w-full h-full rounded-md ${color === 'Biru' ? 'bg-blue-600' : color === 'Merah' ? 'bg-red-600' : 'bg-slate-100 border border-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Size & Name Tag Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ukuran</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {(['3x4', '4x6'] as FotoSize[]).map(s => (
                        <button 
                          key={s} 
                          onClick={() => setConfig({...config, size: s})} 
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${config.size === s ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                          style={{ color: config.size === s ? primaryColor : undefined }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Dada</label>
                      <button
                        onClick={() => setConfig({...config, useNameTag: !config.useNameTag})}
                        className={`w-9 h-5 rounded-full relative transition-all duration-300 ${config.useNameTag ? '' : 'bg-slate-300'}`}
                        style={{ backgroundColor: config.useNameTag ? primaryColor : undefined }}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${config.useNameTag ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                    {config.useNameTag && (
                      <input 
                        type="text" 
                        value={config.nameTagText}
                        onChange={(e) => setConfig({...config, nameTagText: e.target.value})}
                        placeholder="Ketik nama..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[9px] font-bold text-slate-700 focus:border-slate-400 outline-none uppercase"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Generate Button */}
              <div className="lg:hidden pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !faceImage}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !faceImage) ? '#cbd5e1' : primaryColor 
                  }}
                >
                  PROSES PAS FOTO
                </button>
              </div>
            </div>

            {/* Column 3: Result Area */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14} className="text-slate-300" /> Hasil Studio
                </label>
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                    Neural Rendering Engine v2
                   </div>
                </div>
              </div>
              
              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className={`bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner ${aspectClass}`}
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: currentAspect.toString()
                  }}
                >
                  <AnimatePresence mode="wait">
                    {processing.isProcessing ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-sm px-6 text-center"
                      >
                        <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                          {processing.progress || 'Neural Studio sedang menjahit...'}
                        </p>
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
                          className="absolute inset-0 overflow-hidden shadow-2xl"
                          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                          <img src={faceImage!} alt="Original" className="w-full h-full object-cover" />
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
                        <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest z-30">
                          Asli
                        </div>
                        <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest z-30">
                          Pas Foto
                        </div>
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
              <div className="grid grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3 w-full mx-auto shrink-0">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !faceImage}
                  title="Generate"
                  className="hidden lg:flex order-5 lg:order-first col-span-1 lg:col-span-2 py-4 rounded-2xl border-2 text-white items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !faceImage) ? '#cbd5e1' : primaryColor, 
                    borderColor: (processing.isProcessing || !faceImage) ? '#cbd5e1' : primaryColor 
                  }}
                >
                  <span className="font-black uppercase tracking-widest text-[10px]">REGENERASI</span>
                </button>

                <button 
                  onClick={() => setShowPreview(true)}
                  disabled={processing.isProcessing || !resultImage}
                  title="Preview"
                  className="order-1 lg:order-2 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Eye size={20} />
                </button>
                <button 
                  onClick={() => setIsCropping(true)}
                  disabled={processing.isProcessing || !resultImage}
                  title="Crop"
                  className="order-2 lg:order-3 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Scissors size={20} />
                </button>
                <button 
                  onClick={handleSharpen}
                  disabled={processing.isProcessing || !resultImage}
                  title="Sharpen"
                  className="order-3 lg:order-4 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Zap size={20} />
                </button>
                <button 
                  onClick={() => setResultImage(originalResult)}
                  disabled={processing.isProcessing || !resultImage || resultImage === originalResult}
                  title="Reset"
                  className="order-4 lg:order-5 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Recycle size={20} />
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={processing.isProcessing || !resultImage}
                  title="Download"
                  className="order-6 lg:order-6 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
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
                    className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest shrink-0"
                  >
                    {processing.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>


      <AnimatePresence>
        {isCropping && resultImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Pas Foto</h2>
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
                aspect={currentAspect}
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

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && resultImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black flex flex-col"
          >
            <div className="absolute top-6 right-6 z-[160]">
              <button
                onClick={() => setShowPreview(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <img 
                src={resultImage} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
                alt="Full Preview" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
};

export default GuberPasFoto;
