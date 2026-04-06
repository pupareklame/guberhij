
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, User, Download, RefreshCw, Sparkles, Image as ImageIcon, Check, X, Info, Scissors, Zap, Eye, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { transformGarment } from '../services/warna';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const COLOR_PRESETS = [
  { name: 'Sage Green', hex: '#9ca986', prompt: 'Sage Green' },
  { name: 'Terracotta', hex: '#b35a44', prompt: 'Terracotta' },
  { name: 'Navy Blue', hex: '#1e293b', prompt: 'Navy Blue' },
  { name: 'Maroon', hex: '#7f1d1d', prompt: 'Maroon' },
  { name: 'Lavender', hex: '#e9d5ff', prompt: 'Lavender' },
  { name: 'Mustard', hex: '#eab308', prompt: 'Mustard' },
  { name: 'Emerald', hex: '#065f46', prompt: 'Emerald' },
  { name: 'Dusty Rose', hex: '#fda4af', prompt: 'Dusty Rose' },
];

const UbahWarna: React.FC = () => {
  const { primaryColor } = useTheme();
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [colorRefImage, setColorRefImage] = useState<string | null>(null);
  const [useColorRef, setUseColorRef] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState('#ff0000');
  const [targetGarment, setTargetGarment] = useState<'TOP' | 'BOTTOM' | 'BOTH'>('TOP');
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState('9:16');
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

  const handleProcess = async () => {
    if (!modelImage) return;
    const activeColorRef = useColorRef ? colorRefImage : null;
    if (!selectedColor && !activeColorRef) {
      setProcessing({ isProcessing: false, error: "Pilih warna atau aktifkan referensi.", progress: '' });
      return;
    }

    setResultImage(null);
    setProcessing({ isProcessing: true, error: null, progress: 'Neural Color Matching...' });

    try {
      const colorDesc = selectedColor || "Gunakan warna dari gambar referensi";
      const result = await transformGarment(modelImage, {
        target: targetGarment,
        colorName: colorDesc,
        colorImage: activeColorRef || undefined,
        intensity: 100,
        aspectRatio: aspectRatio
      }, 'anraw');
      setResultImage(result);
      setOriginalResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal mengubah warna.", progress: '' });
    }
  };

  const handleReset = () => {
    setModelImage(null);
    setColorRefImage(null);
    setResultImage(null);
    setOriginalResultImage(null);
    setSelectedColor(null);
    setSliderPos(50);
    setProcessing({ isProcessing: false, error: null, progress: '' });
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
    link.download = `warna-${Date.now()}.png`;
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
    } catch (e) {
      console.error(e);
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
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl lg:max-w-7xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        {/* Header - Rounded like fotofashion */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Palette size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">UBAH WARNA</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">ganti warna pakaian model</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Left Column: Controls */}
            <div className="space-y-8">
              {/* Model Upload */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-slate-300" /> 1. PILIH ASET PAKAIAN
                </label>
                <ImageUploader
                  label="Pilih Foto"
                  image={modelImage}
                  onImageSelect={(img) => { setModelImage(img); setResultImage(null); }}
                  onClear={() => setModelImage(null)}
                  aspectRatio="9-16"
                  labelInside
                />
              </div>

              {/* Target Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Check size={14} className="text-slate-300" /> 2. Yang ingin di ubah warnan
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                  {(['TOP', 'BOTTOM', 'BOTH'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTargetGarment(t)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${targetGarment === t ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      style={{ color: targetGarment === t ? primaryColor : undefined }}
                    >
                      {t === 'TOP' ? 'Atasan' : t === 'BOTTOM' ? 'Bawahan' : 'Semua'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette size={14} className="text-slate-300" /> 3. Katalog Warna
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => { setSelectedColor(color.prompt); setColorRefImage(null); }}
                      className={`group relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selectedColor === color.prompt ? 'bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}
                      style={{ borderColor: selectedColor === color.prompt ? primaryColor : undefined }}
                    >
                      <div 
                        className="w-full aspect-square rounded-lg shadow-inner" 
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className={`text-[7px] font-black uppercase truncate w-full text-center ${selectedColor === color.prompt ? '' : 'text-slate-400 group-hover:text-slate-600'}`} style={{ color: selectedColor === color.prompt ? primaryColor : undefined }}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                  {/* Custom Color Option */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        const input = document.getElementById('custom-color-picker') as HTMLInputElement;
                        input?.click();
                      }}
                      className={`w-full flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selectedColor?.startsWith('#') ? 'bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}
                      style={{ borderColor: selectedColor?.startsWith('#') ? primaryColor : undefined }}
                    >
                      <div 
                        className="w-full aspect-square rounded-lg shadow-inner flex items-center justify-center overflow-hidden" 
                        style={{ backgroundColor: customColor }}
                      >
                        <div className="w-full h-full bg-gradient-to-tr from-black/20 to-transparent flex items-center justify-center">
                          <Palette size={12} className="text-white drop-shadow-md" />
                        </div>
                      </div>
                      <span className={`text-[7px] font-black uppercase truncate w-full text-center ${selectedColor?.startsWith('#') ? '' : 'text-slate-400 group-hover:text-slate-600'}`} style={{ color: selectedColor?.startsWith('#') ? primaryColor : undefined }}>
                        Kustom
                      </span>
                    </button>
                    <input 
                      id="custom-color-picker"
                      type="color" 
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setSelectedColor(e.target.value);
                        setColorRefImage(null);
                      }}
                      className="absolute inset-0 opacity-0 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* Reference Toggle & Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                      <ImageIcon size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Gunakan Referensi</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Ambil warna dari gambar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseColorRef(!useColorRef)}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${useColorRef ? '' : 'bg-slate-200'}`}
                    style={{ backgroundColor: useColorRef ? primaryColor : undefined }}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${useColorRef ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {useColorRef && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3"
                    >
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={14} className="text-slate-300" /> 4. Referensi Warna
                      </label>
                      <ImageUploader
                        label="Pilih Referensi"
                        image={colorRefImage}
                        onImageSelect={(img) => { setColorRefImage(img); setSelectedColor(null); }}
                        onClear={() => colorRefImage && setColorRefImage(null)}
                        aspectRatio="square"
                        labelInside
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Aspect Ratio Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> 5. Pilih Aspek Rasio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                        aspectRatio === r.value 
                          ? 'scale-105' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                        color: aspectRatio === r.value ? 'white' : undefined,
                        borderColor: aspectRatio === r.value ? primaryColor : undefined,
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

              <div className="">
                <button
                  onClick={handleProcess}
                  disabled={processing.isProcessing || !modelImage || (!selectedColor && !colorRefImage)}
                  className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
                  style={{ 
                    backgroundColor: processing.isProcessing || !modelImage || (!selectedColor && !colorRefImage) ? undefined : primaryColor,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  {processing.isProcessing ? (
                    <span className="relative z-10">SEDANG PROSES...</span>
                  ) : (
                    <span className="text-lg relative z-10">GANTI WARNA</span>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Result Section */}
            <div className="lg:sticky lg:top-8 self-start space-y-6 mt-12 lg:mt-0">
              <div className="space-y-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Hasil Recolor
                  </label>
                </div>
                
                <div 
                  className={`w-full max-w-[280px] lg:max-w-full mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 ${
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
                        {/* Before/After Slider inside the box */}
                        <img src={modelImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
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

                {/* Action Buttons - Icon Only */}
                <div className="grid grid-cols-5 gap-3 max-w-[320px] lg:max-w-full mx-auto">
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Recolor</h2>
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
  );
};

export default UbahWarna;
