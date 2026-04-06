
/**
 * [INTEGRITY-CHECK]: 0x70726F64756B
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Download, RefreshCw, Scissors, Check, X, Sparkles, Zap, Maximize, Palette, Image as ImageIcon, Camera, Layout, User, Eye, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { generateProductScene, upscaleImage } from '../services/produk';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const OUTFIT_STYLES = [
  { id: 'CASUAL_STREETWEAR', name: 'Casual Streetwear' },
  { id: 'FORMAL_BUSINESS', name: 'Formal Business' },
  { id: 'LUXURY_FASHION', name: 'Luxury Fashion' },
  { id: 'SPORTY_ATHLEISURE', name: 'Sporty Athleisure' },
  { id: 'BOHEMIAN_CHIC', name: 'Bohemian Chic' },
];

const ENVIRONMENTS = [
  { id: 'URBAN_STREET', name: 'Urban Street' },
  { id: 'MINIMALIST_STUDIO', name: 'Minimalist Studio' },
  { id: 'LUXURY_INTERIOR', name: 'Luxury Interior' },
  { id: 'NATURE_OUTDOOR', name: 'Nature Outdoor' },
  { id: 'CYBERPUNK_CITY', name: 'Cyberpunk City' },
];

const CAMERA_ANGLES = [
  { id: 'FRONT', name: 'Eye Level' },
  { id: 'SIDE', name: 'Side Angle' },
  { id: 'TOP', name: 'Top Angle' },
];

const INTERACTIONS = [
  { id: 'HOLDING_PRODUCT', name: 'Holding Product' },
  { id: 'WEARING_PRODUCT', name: 'Wearing Product' },
  { id: 'STANDING_NEXT_TO', name: 'Standing Next To' },
  { id: 'SITTING_WITH', name: 'Sitting With' },
];

const GuberProduk: React.FC = () => {
  const { primaryColor } = useTheme();
  const [faceImage, setFaceImage] = useState<string | null>(null);
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

  const [outfitStyle, setOutfitStyle] = useState(OUTFIT_STYLES[0].id);
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0].id);
  const [cameraAngle, setCameraAngle] = useState(CAMERA_ANGLES[0].id);
  const [interaction, setInteraction] = useState(INTERACTIONS[0].id);
  const [additionalPrompt, setAdditionalPrompt] = useState('');

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
    if (!faceImage || !productImage) return;
    
    setResultImage(null);
    setOriginalResult(null);
    setProcessing({ isProcessing: true, error: null, progress: 'AI sedang merancang adegan produk...' });

    try {
      const result = await generateProductScene(
        faceImage,
        productImage,
        {
          outfitStyle,
          environment,
          cameraAngle: cameraAngle as any,
          interactionState: interaction,
          additionalPrompt
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
    link.download = `product-scene-${Date.now()}.png`;
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
    <div className="h-full lg:h-screen lg:overflow-hidden bg-slate-50/50 flex flex-col custom-scrollbar">
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
              <ShoppingBag size={16} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">PRODUCT SCENE AI</h1>
              <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Guber Studio Official</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:flex lg:overflow-hidden max-w-2xl lg:max-w-7xl mx-auto w-full bg-white border-x border-slate-100 shadow-sm">
        {/* Left Column: Inputs */}
        <div className="w-full lg:w-1/2 lg:h-full lg:overflow-y-auto p-4 lg:p-8 space-y-6 custom-scrollbar border-r border-slate-50">
          {/* Image Uploaders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-slate-300" /> 1. Wajah Model
              </label>
              <ImageUploader
                label="Foto Wajah"
                image={faceImage}
                onImageSelect={setFaceImage}
                aspectRatio="square"
                labelInside
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag size={14} className="text-slate-300" /> 2. Foto Produk
              </label>
              <ImageUploader
                label="Foto Produk"
                image={productImage}
                onImageSelect={setProductImage}
                aspectRatio="square"
                labelInside
              />
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={14} className="text-slate-300" /> Gaya Pakaian
              </label>
              <select 
                value={outfitStyle}
                onChange={(e) => setOutfitStyle(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 py-2 text-[10px] font-black uppercase outline-none"
              >
                {OUTFIT_STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layout size={14} className="text-slate-300" /> Lingkungan
              </label>
              <select 
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 py-2 text-[10px] font-black uppercase outline-none"
              >
                {ENVIRONMENTS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} className="text-slate-300" /> Sudut Kamera
              </label>
              <select 
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 py-2 text-[10px] font-black uppercase outline-none"
              >
                {CAMERA_ANGLES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-slate-300" /> Interaksi
              </label>
              <select 
                value={interaction}
                onChange={(e) => setInteraction(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 py-2 text-[10px] font-black uppercase outline-none"
              >
                {INTERACTIONS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          </div>

          {/* Additional Prompt */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-slate-300" /> 3. Detail Tambahan (Opsional)
            </label>
            <textarea 
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="Contoh: Pencahayaan dramatis, efek neon, dll."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none h-24 resize-none"
              style={{ borderColor: primaryColor }}
            />
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
            disabled={processing.isProcessing || !faceImage || !productImage}
            className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
            style={{ 
              backgroundColor: processing.isProcessing || !faceImage || !productImage ? undefined : primaryColor,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            {processing.isProcessing ? (
              <span className="relative z-10">SEDANG MERANCANG...</span>
            ) : (
              <span className="text-lg relative z-10">PROSES ADEGAN</span>
            )}
          </button>

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

        {/* Right Column: Results */}
        <div className="w-full lg:w-1/2 lg:h-full lg:flex lg:flex-col lg:justify-between lg:overflow-hidden p-4 lg:p-8 bg-slate-50/30 custom-scrollbar">
          <div className="space-y-4 lg:h-full lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag size={14} className="text-slate-300" /> Hasil Adegan Produk
              </label>
            </div>
            
            <div 
              className={`w-full max-w-[280px] mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 lg:h-full lg:max-h-[calc(100vh-320px)] lg:w-auto ${aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '3:4' ? 'aspect-[3/4]' : aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-[16/9]'}`}
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Adegan</h2>
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

export default GuberProduk;
