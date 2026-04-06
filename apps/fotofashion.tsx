
/**
 * [INTEGRITY-CHECK]: 0x6E6F69687361666F746F66
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shirt, 
  Users, 
  User, 
  MapPin, 
  Sparkles, 
  Maximize, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  Send,
  Plus,
  Trash2,
  Check,
  X,
  Camera,
  Clock,
  Scissors,
  Zap,
  ToggleRight,
  Lock,
  ShieldAlert,
  Eye,
  Recycle
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { FotoFashionConfig, ProcessingState } from '../types';
import { generateFashionPhoto, upscaleImage } from '../services/fotofashion';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const FotoFashion: React.FC = () => {
  const { primaryColor } = useTheme();
  const [images, setImages] = useState<{ clothing: string | null; customModel: string | null; logo: string | null }>({
    clothing: null,
    customModel: null,
    logo: null
  });

  const [config, setConfig] = useState<FotoFashionConfig>({
    modelType: 'MANUSIA',
    mannequinType: 'FULL_BODY',
    gender: 'PRIA',
    age: 'DEWASA',
    clothingType: 'KEMEJA_PENDEK',
    location: 'INDOOR',
    visualStyle: 'MINIMALIS',
    additionalInstruction: '',
    aspectRatio: '1:1'
  });

  const [customClothing, setCustomClothing] = useState('');
  const [customAge, setCustomAge] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  const [showLogoUploader, setShowLogoUploader] = useState(false);
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
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
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const handleGenerate = async () => {
    if (!images.clothing) {
      setProcessing(prev => ({ ...prev, error: "Unggah foto pakaian terlebih dahulu." }));
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Neural Fashion Stitching...' });
    setResultImage(null);

    try {
      const finalConfig = {
        ...config,
        customAge: config.age === 'KUSTOM' ? (customAge || '25') : undefined,
        customVisualStyle: config.visualStyle === 'KUSTOM' ? customStyle : undefined,
        customClothingType: config.clothingType === 'KUSTOM' ? customClothing : undefined
      };

      const result = await generateFashionPhoto(finalConfig, images, 'noihsafotof');
      setResultImage(result);
      setOriginalResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memproses foto fashion.", progress: '' });
    }
  };

  const handleReset = () => {
    setImages({ clothing: null, customModel: null, logo: null });
    setResultImage(null);
    setOriginalResultImage(null);
    setSliderPos(50);
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleResetResult = () => {
    if (originalResultImage) {
      setResultImage(originalResultImage);
    }
  };

  const handleRestore = () => {
    if (originalResultImage) {
      setResultImage(originalResultImage);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `fashion-${Date.now()}.png`;
    link.click();
  };

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

  const handleCropSave = async () => {
    if (!resultImage || !croppedAreaPixels) return;
    try {
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsCropping(false);
        return;
      }

      // Use the pixel dimensions from the cropper
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

      const croppedImage = canvas.toDataURL('image/png');
      setResultImage(croppedImage);
      setIsCropping(false);
    } catch (e) {
      console.error('Error cropping image:', e);
      setIsCropping(false);
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar.', progress: '' });
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling Image...' });
    
    try {
      const sharpenedImage = await upscaleImage(resultImage, 'ULTRA_HD');
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      console.error(e);
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  return (
    <div 
      className="h-full lg:h-screen lg:overflow-hidden bg-slate-50/50 flex flex-col custom-scrollbar"
      style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 60%, white)` }}
    >
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
              <Shirt size={16} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">FOTO FASHION AI</h1>
              <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Professional AI Studio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:grid lg:grid-cols-12 lg:gap-6 lg:p-6 lg:overflow-hidden max-w-2xl lg:max-w-[1600px] mx-auto w-full bg-white lg:bg-transparent border-x border-slate-100 lg:border-none shadow-sm lg:shadow-none">
        {/* Column 1: Config (Desktop) */}
        <div className="w-full lg:col-span-4 lg:h-full lg:overflow-y-auto p-4 lg:p-8 space-y-10 custom-scrollbar bg-white lg:rounded-[32px] lg:shadow-sm border border-slate-100">
          {/* 1. Unggah Pakaian */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shirt size={14} className="text-slate-300" /> 1. Unggah Aset Fashion
            </label>
            <ImageUploader 
              label="Pilih Pakaian/Kain" 
              image={images.clothing} 
              onImageSelect={(img) => { setImages({ ...images, clothing: img }); setResultImage(null); }} 
              aspectRatio="9-16" 
              labelInside
            />
          </div>

          {/* 2. Jenis Kelamin */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-slate-300" /> 2. Jenis Kelamin
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['PRIA', 'WANITA'] as const).map((g) => (
                <button
                  id={`gender-btn-${g}`}
                  key={g}
                  onClick={() => setConfig({ ...config, gender: g })}
                  className={`py-3 rounded-xl text-[9px] font-black transition-all border-2 uppercase tracking-widest ${config.gender === g ? 'text-white' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                  style={config.gender === g ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Mau dibuat apa? */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shirt size={14} className="text-slate-300" /> 3. Mau dibuat apa?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {config.gender === 'PRIA' ? (
                <>
                  {(['KEMEJA_PENDEK', 'KEMEJA_PANJANG', 'KAOS', 'JAKET_HOODIE', 'JAS', 'KUSTOM'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setConfig({ ...config, clothingType: c })}
                      className={`py-2.5 rounded-xl text-[9px] font-black transition-all border-2 uppercase tracking-widest ${config.clothingType === c ? 'text-white' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      style={config.clothingType === c ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    >
                      {c.replace('_', ' ')}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {(['KEMEJA_WANITA', 'GAMIS', 'BLAZER', 'KAOS_PENDEK', 'KAOS_PANJANG', 'KUSTOM'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setConfig({ ...config, clothingType: c })}
                      className={`py-2.5 rounded-xl text-[9px] font-black transition-all border-2 uppercase tracking-widest ${config.clothingType === c ? 'text-white' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      style={config.clothingType === c ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    >
                      {c.replace('_', ' ')}
                    </button>
                  ))}
                </>
              )}
            </div>
            {config.clothingType === 'KUSTOM' && (
              <input
                type="text"
                placeholder="Misal: Jaket Denim, Hoodie..."
                value={customClothing}
                onChange={(e) => setCustomClothing(e.target.value)}
                className="w-full border-2 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}20`, color: primaryColor }}
              />
            )}
          </div>

          {/* 4. Jenis Model */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} className="text-slate-300" /> 4. Pilih Jenis Model
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['MANUSIA', 'MANEKIN', 'KUSTOM'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setConfig({ ...config, modelType: type })}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-300 min-h-[60px] ${
                    config.modelType === type 
                      ? 'scale-105' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                  style={{
                    backgroundColor: config.modelType === type ? primaryColor : undefined,
                    color: config.modelType === type ? 'white' : undefined,
                    borderColor: config.modelType === type ? primaryColor : undefined,
                  }}
                >
                  <span className={`text-[8px] font-black uppercase tracking-tight text-center leading-tight ${config.modelType === type ? 'text-white' : 'text-slate-500'}`}>
                    {type.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
            
            {config.modelType === 'MANEKIN' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw size={14} className="text-slate-300" /> Jenis Manekin
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FULL_BODY', 'CHILD', 'TABLETOP'] as const).map((mType) => (
                    <button
                      key={mType}
                      onClick={() => setConfig({ ...config, mannequinType: mType })}
                      className={`py-3 rounded-xl text-[8px] font-black transition-all border-2 uppercase tracking-widest ${config.mannequinType === mType ? 'text-white' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      style={config.mannequinType === mType ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    >
                      {mType === 'TABLETOP' ? 'TANPA KAKI' : mType.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {config.modelType === 'KUSTOM' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                <ImageUploader
                  label="Unggah Model Kustom"
                  image={images.customModel}
                  onImageSelect={(img) => setImages({ ...images, customModel: img })}
                  onClear={() => setImages({ ...images, customModel: null })}
                  aspectRatio="square"
                  labelInside
                />
              </motion.div>
            )}
          </div>

          {/* 5. Detail Model (If Manusia) */}
          {config.modelType === 'MANUSIA' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} className="text-slate-300" /> 5. Usia Model
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ANAK', 'DEWASA', 'KUSTOM'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setConfig({ ...config, age: a })}
                      className={`py-3 rounded-xl text-[9px] font-black transition-all border-2 uppercase tracking-widest ${config.age === a ? 'text-white' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      style={config.age === a ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                {config.age === 'KUSTOM' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Umur Model</span>
                      <span className="text-xs font-black px-3 py-1 rounded-lg bg-slate-100" style={{ color: primaryColor }}>{customAge || 25} Tahun</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="70"
                      value={customAge || 25}
                      onChange={(e) => setCustomAge(e.target.value)}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: primaryColor }}
                    />
                    <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest">
                      <span>1 Thn</span>
                      <span>70 Thn</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* 5. Lokasi & Gaya */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-slate-300" /> 6. Lokasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['INDOOR', 'OUTDOOR'] as const).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setConfig({ ...config, location: loc })}
                    className={`py-3 rounded-xl text-[9px] font-black transition-all border-2 uppercase tracking-widest ${config.location === loc ? 'text-white' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                    style={config.location === loc ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-slate-300" /> 7. Gaya Visual
              </label>
              <select
                value={config.visualStyle}
                onChange={(e) => setConfig({ ...config, visualStyle: e.target.value as any })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/50"
                style={{ color: primaryColor }}
              >
                {(['MINIMALIS', 'NATURAL', 'SUNSET', 'URBAN', 'ELEGAN', 'KUSTOM'] as const).map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 8. Instruksi Tambahan */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Send size={14} className="text-slate-300" /> 8. Instruksi Tambahan
            </label>
            <textarea
              value={config.additionalInstruction}
              onChange={(e) => setConfig({ ...config, additionalInstruction: e.target.value })}
              placeholder="Contoh: Model berpose candid, fokus pada detail kain..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none min-h-[80px] resize-none focus:border-primary/50"
              style={{ color: primaryColor }}
            />
          </div>

          {/* 9. Aspek Rasio */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Maximize size={14} className="text-slate-300" /> 9. Pilih Aspek Rasio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ratios.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setConfig({ ...config, aspectRatio: r.value as any })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                    config.aspectRatio === r.value 
                      ? 'scale-105' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                  style={{
                    backgroundColor: config.aspectRatio === r.value ? primaryColor : undefined,
                    color: config.aspectRatio === r.value ? 'white' : undefined,
                    borderColor: config.aspectRatio === r.value ? primaryColor : undefined,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={`${r.class} border-2 border-current rounded-[2px] flex items-center justify-center text-[6px] font-black leading-none ${
                      ['9:16', '3:4'].includes(r.value) ? 'h-full w-auto' : 'w-full h-auto'
                    }`}>
                      <span className={['9:16', '3:4'].includes(r.value) ? '-rotate-90' : ''}>
                        {r.label}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Process Button */}
          <button
            id="generate-fashion-btn"
            onClick={handleGenerate}
            disabled={processing.isProcessing || !images.clothing}
            className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
            style={{ 
              backgroundColor: processing.isProcessing || !images.clothing ? undefined : primaryColor,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            {processing.isProcessing ? (
              <span className="relative z-10">SEDANG PROSES...</span>
            ) : (
              <span className="text-lg relative z-10 uppercase">HASILKAN FOTO</span>
            )}
          </button>
        </div>

        {/* Column 2: Results (Desktop) */}
        <div className="w-full lg:col-span-8 lg:h-full lg:flex lg:flex-col lg:justify-between lg:overflow-hidden p-4 lg:p-8 bg-white lg:rounded-[32px] lg:shadow-sm border border-slate-100 custom-scrollbar mt-6 lg:mt-0">
          <div className="space-y-4 lg:h-full lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} className="text-slate-300" /> Hasil Foto Fashion
              </label>
              {processing.progress && (
                <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest animate-pulse">
                  {processing.progress}
                </span>
              )}
            </div>
            
            <div className="flex-1 flex items-center justify-center min-h-[300px] lg:min-h-0 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 overflow-hidden relative group">
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full flex items-center justify-center p-4 lg:p-8"
                  >
                    <img 
                      src={resultImage} 
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
                      alt="Result" 
                    />
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

            {/* Action Buttons - Icon Only */}
            <div className="grid grid-cols-5 gap-2 max-w-[360px] mx-auto">
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
                onClick={handleRestore}
                disabled={!resultImage || processing.isProcessing || resultImage === originalResultImage}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing || resultImage === originalResultImage
                    ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                style={{ color: primaryColor }}
                title="Restore"
              >
                <Recycle size={20} />
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

          {/* Error Message */}
          <AnimatePresence>
            {processing.error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest"
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
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <button
                  onClick={handleDownload}
                  className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-2"
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Fashion</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleCropSave}
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
    </div>
  );
};

export default FotoFashion;
