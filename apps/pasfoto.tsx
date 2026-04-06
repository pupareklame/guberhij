
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
    <div className="h-full bg-slate-50/50 overflow-y-auto lg:overflow-hidden custom-scrollbar">
      <div className="max-w-2xl lg:max-w-7xl mx-auto min-h-full lg:h-screen bg-white flex flex-col border-x border-slate-100 shadow-sm">
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

        <div className="p-4 lg:p-6 lg:flex-1 lg:overflow-hidden">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:h-full lg:overflow-hidden">
            {/* Column 1: Face & Gender (Desktop) */}
            <div className="lg:col-span-3 space-y-6 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar">
          {/* Image Uploader */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-slate-300" /> 1. Foto Wajah
            </label>
            <ImageUploader
              label="Unggah Foto"
              image={faceImage}
              onImageSelect={setFaceImage}
              aspectRatio="square"
              labelInside
            />
          </div>

          {/* Gender Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-slate-300" /> 2. Pilih Jenis Kelamin
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              {(['LAKI_LAKI', 'PEREMPUAN'] as Gender[]).map(g => (
                <button 
                  key={g} 
                  onClick={() => setConfig({...config, gender: g})} 
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${config.gender === g ? 'bg-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  style={{ color: config.gender === g ? primaryColor : undefined }}
                >
                  {g === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                </button>
              ))}
            </div>
          </div>

          {/* Hijab Options for Perempuan */}
          {config.gender === 'PEREMPUAN' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-2 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Gunakan Hijab</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={config.useHijab} onChange={() => setConfig({...config, useHijab: !config.useHijab})} />
                  <div 
                    className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"
                    style={{ backgroundColor: config.useHijab ? primaryColor : undefined }}
                  ></div>
                </label>
              </div>

              {config.useHijab && (
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={14} className="text-slate-300" /> Warna Hijab
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['Khaki', 'Putih', 'Hitam', 'Pink', 'Kustom'].map(color => (
                      <button 
                        key={color} 
                        onClick={() => setConfig({...config, hijabColor: color})}
                        className={`py-2 rounded-xl border-2 text-[8px] font-black uppercase transition-all ${config.hijabColor === color ? 'scale-105 shadow-md' : 'border-slate-100 bg-white text-slate-400'}`}
                        style={{ 
                          borderColor: config.hijabColor === color ? primaryColor : undefined,
                          backgroundColor: config.hijabColor === color ? primaryColor : undefined,
                          color: config.hijabColor === color ? 'white' : undefined
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  {config.hijabColor === 'Kustom' && (
                    <input 
                      type="text" 
                      placeholder="Warna Hijab Kustom..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none uppercase"
                      style={{ borderColor: primaryColor }}
                      onChange={(e) => setConfig({...config, hijabColor: e.target.value})}
                    />
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Column 2: Outfit & Config (Desktop) */}
        <div className="lg:col-span-3 space-y-6 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar pt-6 lg:pt-0">
          {/* Outfit Categories */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shirt size={14} className="text-slate-300" /> 3. Pilih Pakaian
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setConfig({...config, category: cat.id as any})}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-300 min-h-[50px] ${
                    config.category === cat.id 
                      ? 'scale-105' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                  style={{
                    backgroundColor: config.category === cat.id ? primaryColor : undefined,
                    color: config.category === cat.id ? 'white' : undefined,
                    borderColor: config.category === cat.id ? primaryColor : undefined,
                  }}
                >
                  <span className="text-base mb-1">{cat.icon}</span>
                  <span className={`text-[7px] font-black uppercase tracking-tight text-center leading-tight ${config.category === cat.id ? 'text-white' : 'text-slate-500'}`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {config.category === 'CUSTOM' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 overflow-hidden"
            >
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shirt size={14} className="text-slate-300" /> Baju Kustom
              </label>
              <ImageUploader
                label="Unggah Baju"
                image={customOutfit}
                onImageSelect={setCustomOutfit}
                aspectRatio="square"
                labelInside
              />
            </motion.div>
          )}

          {/* Tie Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shirt size={14} className="text-slate-300" /> 4. Opsi Dasi
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.useTie} onChange={() => setConfig({...config, useTie: !config.useTie, tieStyle: !config.useTie ? 'SD' : 'TANPA_DASI'})} />
                <div 
                  className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"
                  style={{ backgroundColor: config.useTie ? primaryColor : undefined }}
                ></div>
              </label>
            </div>

            {config.useTie && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2">
                  {TIE_STYLES.filter(t => t.id !== 'TANPA_DASI').map(tie => (
                    <button 
                      key={tie.id} 
                      onClick={() => setConfig({...config, tieStyle: tie.id as any})}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-300 min-h-[50px] ${
                        config.tieStyle === tie.id 
                          ? 'scale-105' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                      }`}
                      style={{
                        backgroundColor: config.tieStyle === tie.id ? primaryColor : undefined,
                        color: config.tieStyle === tie.id ? 'white' : undefined,
                        borderColor: config.tieStyle === tie.id ? primaryColor : undefined,
                      }}
                    >
                      <span className="text-base mb-1">{tie.icon}</span>
                      <span className={`text-[7px] font-black uppercase tracking-tight text-center leading-tight ${config.tieStyle === tie.id ? 'text-white' : 'text-slate-500'}`}>
                        {tie.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Background Color */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} className="text-slate-300" /> 5. Warna Background
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Biru', 'Merah', 'Putih', 'Kuning'].map(color => (
                <button 
                  key={color} 
                  onClick={() => setConfig({...config, bgColor: color})}
                  className={`h-10 rounded-xl border-2 transition-all flex items-center justify-center ${config.bgColor === color ? 'scale-105 shadow-md' : 'border-slate-100 bg-white'}`}
                  style={{ borderColor: config.bgColor === color ? primaryColor : undefined }}
                >
                  <div className={`w-5 h-5 rounded-full shadow-inner ${color === 'Biru' ? 'bg-blue-600' : color === 'Merah' ? 'bg-red-600' : color === 'Putih' ? 'bg-white border border-slate-200' : 'bg-yellow-400'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Maximize size={14} className="text-slate-300" /> 6. Ukuran Cetak
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              {(['3x4', '4x6'] as FotoSize[]).map(s => (
                <button 
                  key={s} 
                  onClick={() => setConfig({...config, size: s})} 
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${config.size === s ? 'bg-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  style={{ color: config.size === s ? primaryColor : undefined }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Name Tag Toggle */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nama Dada</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.useNameTag} onChange={() => setConfig({...config, useNameTag: !config.useNameTag})} />
                <div 
                  className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"
                  style={{ backgroundColor: config.useNameTag ? primaryColor : undefined }}
                ></div>
              </label>
            </div>

            {config.useNameTag && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 overflow-hidden"
              >
                <input 
                  type="text" 
                  value={config.nameTagText}
                  onChange={(e) => setConfig({...config, nameTagText: e.target.value})}
                  placeholder="NAMA LENGKAP"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-2 text-[10px] font-bold text-slate-700 focus:border-teal-500 outline-none uppercase"
                  style={{ borderColor: primaryColor }}
                />
                <div className="flex bg-slate-100 p-1 rounded-xl gap-2">
                  <button onClick={() => setConfig({...config, nameTagMaterial: 'HITAM'})} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${config.nameTagMaterial === 'HITAM' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Hitam</button>
                  <button onClick={() => setConfig({...config, nameTagMaterial: 'EMAS'})} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${config.nameTagMaterial === 'EMAS' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400'}`}>Emas</button>
                </div>
              </motion.div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={processing.isProcessing || !faceImage}
            className="w-full disabled:bg-slate-300 text-white py-4 rounded-[24px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg"
            style={{ 
              backgroundColor: processing.isProcessing || !faceImage ? undefined : primaryColor,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            {processing.isProcessing ? (
              <span className="relative z-10 text-xs">SEDANG PROSES...</span>
            ) : (
              <span className="text-sm relative z-10">PROSES PAS FOTO</span>
            )}
          </button>
        </div>

        {/* Column 3: Results (Desktop) */}
        <div className="lg:col-span-6 space-y-4 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:flex lg:flex-col lg:justify-between lg:overflow-hidden">
          <div className="space-y-4 lg:h-full lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} className="text-slate-300" /> Hasil Pas Foto
              </label>
            </div>
            
            <div 
              className={`w-full max-w-[280px] mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 lg:h-full lg:max-h-[calc(100vh-200px)] lg:w-auto ${aspectClass}`}
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
                    className="absolute inset-0 flex flex-col items-center justify-center z-30"
                  >
                    <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                  </motion.div>
                ) : resultImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative select-none touch-none"
                  >
                    <img src={faceImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
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
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:scale-110"
                        style={{ borderColor: primaryColor }}
                      >
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                          <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[6px] font-black text-white uppercase tracking-widest pointer-events-none">Before</div>
                    <div className="absolute bottom-4 right-4 px-2 py-0.5 bg-white/40 backdrop-blur-md rounded-full text-[6px] font-black text-black uppercase tracking-widest pointer-events-none">After</div>
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
            <div className="grid grid-cols-5 gap-3 max-w-[280px] mx-auto w-full">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!resultImage || processing.isProcessing}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing 
                    ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                style={{ color: primaryColor }}
                title="Preview"
              >
                <Eye size={20} />
              </button>
              <button
                onClick={() => setResultImage(originalResult)}
                disabled={!resultImage || processing.isProcessing || resultImage === originalResult}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing || resultImage === originalResult
                    ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                style={{ color: primaryColor }}
                title="Restore"
              >
                <Recycle size={20} />
              </button>
              <button
                onClick={() => setIsCropping(true)}
                disabled={!resultImage || processing.isProcessing}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing 
                    ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                style={{ color: primaryColor }}
                title="Crop"
              >
                <Scissors size={20} />
              </button>
              <button
                onClick={handleSharpen}
                disabled={!resultImage || processing.isProcessing}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing 
                    ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                style={{ color: primaryColor }}
                title="Tajamkan"
              >
                <Zap size={20} />
              </button>
              <button
                onClick={handleDownload}
                disabled={!resultImage || processing.isProcessing}
                className={`flex items-center justify-center py-4 text-white rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing 
                    ? 'bg-slate-300 opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                style={{ backgroundColor: !resultImage || processing.isProcessing ? undefined : primaryColor }}
                title="Download"
              >
                <Download size={20} />
              </button>
            </div>
          </div>
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
    </div>
  );
};

export default GuberPasFoto;
