
/**
 * [INTEGRITY-CHECK]: 0x6D6F636B7570
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Download, RefreshCw, Scissors, Check, X, Sparkles, Zap, Maximize, Palette, Image as ImageIcon, Hand, Ruler, Eye, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { generateMockup, upscaleImage } from '../services/mockup';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const BACKGROUND_STYLES = [
  { id: 'MINIMAL_WHITE', name: 'Minimal White', color: '#FFFFFF' },
  { id: 'SOFT_PASTEL', name: 'Soft Pastel', color: '#F0E6EF' },
  { id: 'WOODEN_TEXTURE', name: 'Wooden Texture', color: '#D2B48C' },
  { id: 'MARBLE_STONE', name: 'Marble Stone', color: '#E5E5E5' },
  { id: 'VIBRANT_GRADIENT', name: 'Vibrant Gradient', color: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)' },
];

const HAND_TYPES = [
  { id: 'LEFT', name: 'Left Hand' },
  { id: 'RIGHT', name: 'Right Hand' },
  { id: 'BOTH', name: 'Both Hands' },
];

const PRODUCT_SIZES = [
  { id: 'SMALL', name: 'Small / Compact' },
  { id: 'MEDIUM', name: 'Medium / Standard' },
  { id: 'LARGE', name: 'Large / Prominent' },
];

const GuberMockup: React.FC = () => {
  const { primaryColor } = useTheme();
  const [productImage, setProductImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResult, setOriginalResult] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '3:4' | '1:1' | '4:3' | '16:9'>('9:16');

  const [selectedBg, setSelectedBg] = useState(BACKGROUND_STYLES[0].id);
  const [handType, setHandType] = useState(HAND_TYPES[0].id);
  const [productSize, setProductSize] = useState(PRODUCT_SIZES[1].id);
  const [colorNuance, setColorNuance] = useState('#ffffff');

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
    if (!productImage) return;
    
    setResultImage(null);
    setOriginalResult(null);
    setProcessing({ isProcessing: true, error: null, progress: 'AI sedang merakit mockup produk...' });

    try {
      const result = await generateMockup(
        productImage,
        {
          bgPreset: selectedBg,
          handType: handType as any,
          productSize: productSize as any,
          colorNuance,
          customSizeCm: 0,
          customBgImage: null,
          aiBgPrompt: ''
        },
        aspectRatio
      );
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
      const sharpenedImage = await upscaleImage(resultImage, aspectRatio);
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
    link.download = `product-mockup-${Date.now()}.png`;
    link.click();
  };

  const getAspectValue = () => {
    switch(aspectRatio) {
      case '9:16': return 9/16;
      case '3:4': return 3/4;
      case '1:1': return 1;
      case '4:3': return 4/3;
      case '16:9': return 16/9;
      default: return 9/16;
    }
  };

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100">
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
                <Box size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">PRODUCT MOCKUP AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Guber Studio Official</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Image Uploader */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 1. Foto Produk
            </label>
            <ImageUploader
              label="Unggah Foto Produk"
              image={productImage}
              onImageSelect={setProductImage}
              aspectRatio="square"
              labelInside
            />
          </div>

          {/* Background Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} className="text-slate-300" /> 2. Pilih Background
            </label>
            <div className="grid grid-cols-5 gap-2">
              {BACKGROUND_STYLES.map(bg => (
                <button 
                  key={bg.id} 
                  onClick={() => setSelectedBg(bg.id)}
                  className={`aspect-square rounded-2xl border-4 transition-all flex items-center justify-center relative overflow-hidden ${selectedBg === bg.id ? 'scale-110 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}
                  style={{ 
                    borderColor: selectedBg === bg.id ? primaryColor : undefined,
                    background: bg.color 
                  }}
                  title={bg.name}
                >
                  {selectedBg === bg.id && <Check size={16} className="text-white drop-shadow-md z-10" />}
                </button>
              ))}
            </div>
          </div>

          {/* Hand & Size Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Hand size={14} className="text-slate-300" /> Model Tangan
              </label>
              <select 
                value={handType}
                onChange={(e) => setHandType(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 py-2 text-[10px] font-black uppercase outline-none"
              >
                {HAND_TYPES.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Ruler size={14} className="text-slate-300" /> Ukuran Produk
              </label>
              <select 
                value={productSize}
                onChange={(e) => setProductSize(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 py-2 text-[10px] font-black uppercase outline-none"
              >
                {PRODUCT_SIZES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Color Nuance */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} className="text-slate-300" /> 3. Nuansa Warna
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={colorNuance}
                onChange={(e) => setColorNuance(e.target.value)}
                className="w-12 h-12 rounded-xl border-2 border-slate-100 cursor-pointer overflow-hidden"
              />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih warna dominan untuk adegan</span>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Maximize size={14} className="text-slate-300" /> 4. Aspek Rasio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['9:16', '3:4', '1:1', '4:3', '16:9'] as const).map(ratio => (
                <button 
                  key={ratio} 
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 rounded-xl text-[8px] font-black border-2 transition-all ${aspectRatio === ratio ? 'scale-105 shadow-sm' : 'border-slate-100 bg-white text-slate-400'}`}
                  style={{ 
                    borderColor: aspectRatio === ratio ? primaryColor : undefined,
                    backgroundColor: aspectRatio === ratio ? `${primaryColor}10` : undefined,
                    color: aspectRatio === ratio ? primaryColor : undefined
                  }}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={processing.isProcessing || !productImage}
            className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
            style={{ 
              backgroundColor: processing.isProcessing || !productImage ? undefined : primaryColor,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            {processing.isProcessing ? (
              <span className="relative z-10">SEDANG MERAKIT...</span>
            ) : (
              <span className="text-lg relative z-10">PROSES MOCKUP</span>
            )}
          </button>

          {/* Result Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Box size={14} className="text-slate-300" /> Hasil Mockup Produk
              </label>
            </div>
            
            <div 
              className={`w-full max-w-[280px] mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 ${aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '3:4' ? 'aspect-[3/4]' : aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-[16/9]'}`}
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
                    <img src={productImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
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
            <div className="grid grid-cols-5 gap-3 max-w-[280px] mx-auto">
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Mockup</h2>
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
                aspect={getAspectValue()}
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
  );
};

export default GuberMockup;
