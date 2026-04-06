import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Shirt, Maximize, Send, Sparkles, User, Users, Download, RefreshCw, Scissors, Check, X, Zap, Image as ImageIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import ImageUploader from '../components/ImageUploader';
import { WeddingConfig, ProcessingState } from '../types';
import { generateWeddingPhoto, upscaleImage } from '../services/wedding';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberWedding: React.FC = () => {
  const { primaryColor } = useTheme();
  const [mode, setMode] = useState<'SINGLE' | 'COUPLE'>('SINGLE');
  const [images, setImages] = useState<{ man: string | null, woman: string | null, couple: string | null }>({
    man: null,
    woman: null,
    couple: null
  });
  const [config, setConfig] = useState<WeddingConfig>({
    mode: 'SINGLE',
    camera: 'Canon EOS R5 (Sharp & Detailed)',
    style: 'Adat Jawa Tradisional',
    location: 'Pantai saat Sunset',
    aspectRatio: '9:16',
    additionalPrompt: ''
  });
  const [customStyle, setCustomStyle] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResult, setOriginalResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: ''
  });

  // Cropper States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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

  const handleGenerate = async () => {
    if (mode === 'SINGLE' && (!images.man || !images.woman)) {
      setProcessing({ isProcessing: false, error: 'Harap unggah foto pria dan wanita', progress: '' });
      return;
    }
    if (mode === 'COUPLE' && !images.couple) {
      setProcessing({ isProcessing: false, error: 'Harap unggah foto pasangan', progress: '' });
      return;
    }

    setResultImage(null);
    setOriginalResult(null);
    setIsCropping(false);
    setProcessing({ isProcessing: true, error: null, progress: 'Sedang proses...' });
    
    try {
      const finalConfig = {
        ...config,
        mode,
        style: config.style === 'Kustom (Ketik/Upload Sendiri)' ? customStyle : config.style,
        location: config.location === 'Kustom (Ketik/Upload Sendiri)' ? customLocation : config.location
      };

      const result = await generateWeddingPhoto(finalConfig, images);
      setResultImage(result);
      setOriginalResult(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || 'Gagal memproses foto', progress: '' });
    }
  };

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
    } catch (e: any) {
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto', progress: '' });
    }
  };

  const handleUpscale = async () => {
    if (!resultImage) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Meningkatkan kualitas...' });
    try {
      const sharpenedImage = await upscaleImage(resultImage, config.aspectRatio);
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal menajamkan foto', progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `wedding-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100 pb-20">
        {/* Header */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl"
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Wedding AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Guber Studio Prestige</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} className="text-slate-300" /> 1. Pilih Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setMode('SINGLE')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'SINGLE' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                style={mode === 'SINGLE' ? { color: primaryColor } : {}}
              >
                <User size={14} /> Satuan
              </button>
              <button
                onClick={() => setMode('COUPLE')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'COUPLE' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                style={mode === 'COUPLE' ? { color: primaryColor } : {}}
              >
                <Users size={14} /> Sepasang
              </button>
            </div>
          </div>

          {/* Image Uploaders */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 2. Unggah Foto
            </label>
            <AnimatePresence mode="wait">
              {mode === 'SINGLE' ? (
                <motion.div 
                  key="single-upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <ImageUploader
                    label="Foto Pria"
                    image={images.man}
                    onImageSelect={(img) => setImages({ ...images, man: img })}
                    onClear={() => setImages({ ...images, man: null })}
                    aspectRatio="square"
                    labelInside
                  />
                  <ImageUploader
                    label="Foto Wanita"
                    image={images.woman}
                    onImageSelect={(img) => setImages({ ...images, woman: img })}
                    onClear={() => setImages({ ...images, woman: null })}
                    aspectRatio="square"
                    labelInside
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="couple-upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ImageUploader
                    label="Foto Pasangan"
                    image={images.couple}
                    onImageSelect={(img) => setImages({ ...images, couple: img })}
                    onClear={() => setImages({ ...images, couple: null })}
                    aspectRatio="square"
                    labelInside
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera Settings */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} className="text-slate-300" /> Kamera
              </label>
              <select
                value={config.camera}
                onChange={(e) => setConfig({ ...config, camera: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 focus:ring-0 transition-all outline-none appearance-none"
              >
                <option>Canon EOS R5 (Sharp & Detailed)</option>
                <option>Sony A7R IV (High Dynamic Range)</option>
                <option>Nikon Z9 (Vibrant Colors)</option>
                <option>Fujifilm GFX 100 (Cinematic Look)</option>
                <option>Leica M11 (Classic & Soft)</option>
              </select>
            </div>

            {/* Style Settings */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shirt size={14} className="text-slate-300" /> Style Pakaian
              </label>
              <select
                value={config.style}
                onChange={(e) => setConfig({ ...config, style: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 focus:ring-0 transition-all outline-none appearance-none"
              >
                <option>Adat Jawa Tradisional</option>
                <option>Jas & Gaun Modern</option>
                <option>Casual Serba Putih</option>
                <option>Vintage 90an</option>
                <option>Korean Wedding Style</option>
                <option>Bohemian / Rustic</option>
                <option>Pakaian Pantai Santai</option>
                <option>Garden Party (Semi-Formal)</option>
                <option>Black Tie (Tuxedo & Evening Gown)</option>
                <option>Fairy Tale / Kerajaan</option>
                <option>Kustom (Ketik/Upload Sendiri)</option>
              </select>
            </div>
          </div>

          {config.style === 'Kustom (Ketik/Upload Sendiri)' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <input
                type="text"
                placeholder="Misal: Baju Adat Bali Payas Agung..."
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                className="w-full bg-teal-50 border-2 border-teal-100 rounded-2xl px-4 py-3 text-sm font-bold text-teal-700 focus:border-teal-500 outline-none"
                style={{ borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}05`, color: primaryColor }}
              />
            </motion.div>
          )}

          {/* Location Settings */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} className="text-slate-300" /> Lokasi Pemotretan
            </label>
            <select
              value={config.location}
              onChange={(e) => setConfig({ ...config, location: e.target.value })}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 focus:ring-0 transition-all outline-none appearance-none"
            >
              <option>Pantai saat Sunset</option>
              <option>Pemandangan Gunung</option>
              <option>Taman Bunga</option>
              <option>Taman Kota</option>
              <option>Hotel Mewah (Indoor)</option>
              <option>Gudang Rustic / Barn</option>
              <option>Hutan Pinus</option>
              <option>Studio Minimalis</option>
              <option>Gedung Bersejarah</option>
              <option>Rooftop Gedung Tinggi</option>
              <option>Kustom (Ketik/Upload Sendiri)</option>
            </select>
            {config.location === 'Kustom (Ketik/Upload Sendiri)' && (
              <input
                type="text"
                placeholder="Misal: Di depan Menara Eiffel..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full bg-teal-50 border-2 border-teal-100 rounded-2xl px-4 py-3 text-sm font-bold text-teal-700 focus:border-teal-500 outline-none mt-2"
                style={{ borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}05`, color: primaryColor }}
              />
            )}
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 3. Pilih Aspek Rasio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ratios.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setConfig({ ...config, aspectRatio: r.value })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                    config.aspectRatio === r.value 
                      ? 'scale-105 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                  style={config.aspectRatio === r.value ? {
                    backgroundColor: primaryColor,
                    color: 'white',
                    borderColor: primaryColor,
                  } : {}}
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

          {/* Additional Instructions */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Send size={14} className="text-slate-300" /> Instruksi Tambahan
            </label>
            <textarea
              value={config.additionalPrompt}
              onChange={(e) => setConfig({ ...config, additionalPrompt: e.target.value })}
              placeholder="Misal: Tambahkan efek kelopak bunga berjatuhan..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none min-h-[100px] resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={processing.isProcessing}
            className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
            style={{ backgroundColor: processing.isProcessing ? undefined : primaryColor }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            {processing.isProcessing ? (
              <span className="relative z-10">SEDANG PROSES...</span>
            ) : (
              <span className="text-lg relative z-10">PROSES FOTO</span>
            )}
          </button>

          {/* Result Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Foto
              </label>
            </div>
            
            <div 
              className={`w-full max-w-[280px] mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 ${
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
                    className="absolute inset-0 flex flex-col items-center justify-center z-30"
                  >
                    <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                  </motion.div>
                ) : isCropping && resultImage ? (
                  <motion.div
                    key="cropping"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40"
                  >
                    <Cropper
                      image={resultImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={config.aspectRatio === '1:1' ? 1 : config.aspectRatio === '3:4' ? 3/4 : config.aspectRatio === '4:3' ? 4/3 : config.aspectRatio === '9:16' ? 9/16 : 16/9}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-50">
                      <button
                        onClick={() => setIsCropping(false)}
                        className="bg-white/90 backdrop-blur-md text-slate-600 p-3 rounded-full shadow-lg hover:bg-white transition-all"
                      >
                        <X size={20} />
                      </button>
                      <button
                        onClick={handleApplyCrop}
                        className="text-white p-3 rounded-full shadow-lg transition-all"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  </motion.div>
                ) : resultImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative select-none touch-none"
                  >
                    <img src={resultImage} className="absolute inset-0 w-full h-full object-cover" alt="Result" />
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
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
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
                onClick={handleUpscale}
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
    </div>
  );
};

export default GuberWedding;
