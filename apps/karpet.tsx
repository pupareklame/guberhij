import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Check, X, Sparkles, ImageIcon, Zap, Eye, Maximize, Layout, ShoppingBag, Palette, Box, Layers, PenTool, Flower2, Dumbbell, RefreshCcw, Scissors, ToggleLeft, ToggleRight, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { generateClothesOnCarpet, upscaleImage } from '../services/karpet';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberKarpet: React.FC = () => {
  const { primaryColor } = useTheme();
  const [theme, setTheme] = useState('AUTO');
  const [customOrnaments, setCustomOrnaments] = useState('');
  const [brandName, setBrandName] = useState('');
  const [clothingScope, setClothingScope] = useState('Setelan');
  const [carpetColor, setCarpetColor] = useState('Otomatis');
  const [customColor, setCustomColor] = useState('#166534');
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isMultiUpload, setIsMultiUpload] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [uploadAspectRatio, setUploadAspectRatio] = useState('4-3');
  const [cameraAngle, setCameraAngle] = useState('Saran AI');
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

  const carpetColors = [
    { name: 'Otomatis', color: 'linear-gradient(45deg, #f8fafc, #94a3b8, #166534)' },
    { name: 'Hijau Daun', color: '#166534' },
    { name: 'Abu-abu', color: '#94a3b8' },
    { name: 'Putih', color: '#f8fafc' },
    { name: 'Krem', color: '#fef3c7' },
    { name: 'Hitam', color: '#0f172a' },
    { name: 'Biru Navy', color: '#1e3a8a' },
    { name: 'Hijau Sage', color: '#86efac' },
    { name: 'Coklat', color: '#78350f' },
  ];

  const handleGenerate = async () => {
    setResultImage(null);
    setProcessing({ isProcessing: true, error: null, progress: 'Menata Objek di Karpet...' });
    
    try {
      let finalColorDescription = '';
      if (isCustomColor) {
        finalColorDescription = `kustom dengan kode warna HEX ${customColor}`;
      } else if (carpetColor === 'Otomatis') {
        finalColorDescription = 'Otomatis (Pilih warna yang paling estetik)';
      } else {
        const selectedPreset = carpetColors.find(c => c.name === carpetColor);
        finalColorDescription = `${carpetColor} (HEX: ${selectedPreset?.color || ''})`;
      }

      const result = await generateClothesOnCarpet(
        theme, 
        finalColorDescription, 
        aspectRatio, 
        images, 
        customOrnaments, 
        brandName, 
        clothingScope,
        cameraAngle
      );
      setResultImage(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      const errorStr = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      setProcessing({ isProcessing: false, error: errorStr, progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `karpet-${Date.now()}.png`;
    link.click();
  };

  const handleSharpen = async () => {
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

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
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

    setProcessing({ isProcessing: true, error: null, progress: 'Memotong Gambar...' });
    try {
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

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

      const croppedResult = canvas.toDataURL('image/png');
      setResultImage(croppedResult);
      setIsCropping(false);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar.', progress: '' });
      setIsCropping(false);
    }
  };

  const handleAddImage = (img: string) => {
    const image = new Image();
    image.onload = () => {
      const ratio = image.width / image.height;
      if (ratio > 1.5) setUploadAspectRatio('16-9');
      else if (ratio > 1.1) setUploadAspectRatio('4-3');
      else if (ratio > 0.8) setUploadAspectRatio('1-1');
      else if (ratio > 0.6) setUploadAspectRatio('3-4');
      else setUploadAspectRatio('9-16');
    };
    image.src = img;

    if (isMultiUpload) {
      setImages(prev => [...prev, img].slice(0, 4));
    } else {
      setImages([img]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

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
                <Layout size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">BAJU DI KARPET</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Flat Lay Photography AI</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 lg:flex-1 lg:overflow-hidden">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:h-full lg:overflow-hidden">
            {/* Column 1: Upload & Basic Config (Desktop) */}
            <div className="lg:col-span-3 space-y-6 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar">
          {/* Image Upload Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={12} className="text-slate-300" /> 1. Unggah Referensi
              </label>
              <button 
                onClick={() => {
                  setIsMultiUpload(!isMultiUpload);
                  setImages([]);
                }}
                className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
              >
                {isMultiUpload ? <ToggleRight size={14} className="text-emerald-500" /> : <ToggleLeft size={14} />}
                Multi
              </button>
            </div>

            {isMultiUpload ? (
              <div className="grid grid-cols-2 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-100 group">
                    <img src={img} className="w-full h-full object-cover" alt={`Ref ${idx}`} />
                    <button 
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <div className="aspect-square">
                    <ImageUploader
                      label="Tambah"
                      image={null}
                      onImageSelect={handleAddImage}
                      onClear={() => {}}
                      aspectRatio="1-1"
                      labelInside
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full mx-auto">
                <ImageUploader
                  label="Klik/Seret Foto"
                  image={images[0] || null}
                  onImageSelect={handleAddImage}
                  onClear={() => {
                    setImages([]);
                    setUploadAspectRatio('4-3');
                  }}
                  aspectRatio={uploadAspectRatio}
                  labelInside
                />
              </div>
            )}
          </div>

          {/* Clothing Scope Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag size={12} className="text-slate-300" /> 2. Bagian Pakaian
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              {['Atasan', 'Bawahan', 'Setelan', 'Dress'].map((scope) => (
                <button
                  key={scope}
                  onClick={() => setClothingScope(scope)}
                  className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    clothingScope === scope 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection & Custom Ornaments */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={12} className="text-slate-300" /> 3. Tema Ornamen
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-200 transition-all appearance-none cursor-pointer"
              >
                <option value="AUTO">Auto (Mix Default)</option>
                <option value="OLAHRAGA">Olahraga (Alat Sport)</option>
                <option value="BAJU_RAPI">Baju Rapi (Lipatan Baju)</option>
                <option value="DEKORASI">Dekorasi (Bunga & Vas)</option>
                <option value="ALAT_TULIS">Alat Tulis (Buku & Pena)</option>
                <option value="NATURAL">Natural (Daun & Bunga)</option>
                <option value="CUSTOM">Tema Kustom</option>
              </select>
            </div>

            <AnimatePresence>
              {theme === 'CUSTOM' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-slate-300" /> 4. Ornamen Kustom
                  </label>
                  <input 
                    type="text"
                    value={customOrnaments}
                    onChange={(e) => setCustomOrnaments(e.target.value)}
                    placeholder="Contoh: Batman, Hello Kitty..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-200 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Column 2: Advanced Config & Generate (Desktop) */}
        <div className="lg:col-span-3 space-y-6 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar">
          {/* Brand Embroidery Input */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <PenTool size={12} className="text-slate-300" /> 5. Nama Toko / Brand
            </label>
            <input 
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Nama brand untuk dibordir..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-200 transition-all"
            />
          </div>

          {/* Carpet Color Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={12} className="text-slate-300" /> 6. Warna Karpet
            </label>
            <div className="relative">
              <button
                onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-200 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-lg border border-slate-200 shadow-sm"
                    style={{ 
                      background: isCustomColor ? customColor : carpetColors.find(c => c.name === carpetColor)?.color || '#94a3b8'
                    }}
                  />
                  <span className="uppercase tracking-widest text-[10px]">
                    {isCustomColor ? 'Kustom' : carpetColor}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isColorDropdownOpen ? 180 : 0 }}
                  className="text-slate-400"
                >
                  <Maximize size={12} className="rotate-45" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isColorDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-[24px] shadow-2xl overflow-hidden p-2"
                  >
                    <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {carpetColors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => {
                            setCarpetColor(c.name);
                            setIsCustomColor(false);
                            setIsColorDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-slate-50 ${
                            !isCustomColor && carpetColor === c.name ? 'bg-slate-50' : ''
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm"
                            style={{ background: c.color }}
                          />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">{c.name}</span>
                          {!isCustomColor && carpetColor === c.name && (
                            <div className="ml-auto text-slate-900">
                              <Check size={14} />
                            </div>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setIsCustomColor(true);
                          setIsColorDropdownOpen(false);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-slate-50 ${
                          isCustomColor ? 'bg-slate-50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                          <Zap size={14} className="text-slate-400" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Kustom</span>
                        {isCustomColor && (
                          <div className="ml-auto text-slate-900">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {isCustomColor && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-2">
                <input 
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                />
                <input 
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-slate-700 outline-none uppercase flex-1"
                />
              </div>
            </motion.div>
          )}

          {/* Camera Angle Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Maximize size={12} className="text-slate-300" /> 7. Posisi Kamera
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Saran AI', icon: <Sparkles size={14} /> },
                { name: 'Atas', icon: <Layout size={14} /> },
                { name: 'Miring', icon: <ToggleLeft size={14} /> }
              ].map((angle) => (
                <button
                  key={angle.name}
                  onClick={() => setCameraAngle(angle.name)}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all ${
                    cameraAngle === angle.name 
                      ? 'bg-white border-slate-900 text-slate-900 shadow-sm' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {angle.icon}
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">
                    {angle.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Maximize size={14} className="text-slate-300" /> 8. Aspek Rasio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ratios.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setAspectRatio(r.value)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all aspect-square ${
                    aspectRatio === r.value 
                      ? 'scale-105' 
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

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={processing.isProcessing}
              className="w-full disabled:bg-slate-300 text-white py-4 rounded-[24px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg"
              style={{ 
                backgroundColor: processing.isProcessing ? undefined : primaryColor,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processing.isProcessing ? (
                <span className="relative z-10 text-xs">MENATA...</span>
              ) : (
                <span className="text-sm relative z-10 flex items-center gap-2">
                  <Sparkles size={16} /> BUAT GAMBAR
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Column 3: Results (Desktop) */}
        <div className="lg:col-span-6 space-y-4 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:flex lg:flex-col lg:justify-between lg:overflow-hidden">
          <div className="space-y-6 lg:h-full lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Flat Lay
              </label>
            </div>
            
            <div 
              className={`w-full mx-auto bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner lg:flex-1 lg:h-0 lg:w-full lg:max-h-[calc(100vh-200px)] lg:w-auto ${
                aspectRatio === '1:1' ? 'aspect-square' :
                aspectRatio === '3:4' ? 'aspect-[3/4]' :
                aspectRatio === '4:3' ? 'aspect-[4/3]' :
                aspectRatio === '9:16' ? 'aspect-[9/16]' :
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
                    <img src={resultImage} className="w-full h-full object-cover" alt="Result" />
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
            <div className="grid grid-cols-5 gap-3 w-full mx-auto">
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
                disabled={processing.isProcessing || !resultImage || resultImage === initialResultImage}
                title="Reset"
                className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
              >
                <Recycle size={20} />
              </button>
              <button 
                onClick={handleDownload}
                disabled={processing.isProcessing || !resultImage}
                title="Download"
                className="py-4 rounded-2xl border-2 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                style={{ 
                  backgroundColor: (processing.isProcessing || !resultImage) ? '#cbd5e1' : primaryColor, 
                  borderColor: (processing.isProcessing || !resultImage) ? '#cbd5e1' : primaryColor 
                }}
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
                  className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest"
                >
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Flat Lay</h2>
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
      </div>
    </div>
  );
};

export default GuberKarpet;
