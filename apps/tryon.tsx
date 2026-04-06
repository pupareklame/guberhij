
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * [INTEGRITY-CHECK]: 0x6E6F797274
 * STATUS: PROTECTED-V1
 */
import { User, Shirt, Sparkles, Image as ImageIcon, Download, RefreshCw, Info, ShieldCheck, Layers, Maximize2, X, Scissors, Check, Eye, Recycle, Zap } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { neutralizeClothes, applyGarment, upscaleImage } from '../services/tryon';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

/**
 * [INTEGRITY-CHECK]: 0x6E6F797274
 * STATUS: PROTECTED-V1
 */

const GuberMultiTryOn: React.FC = () => {
  const { primaryColor } = useTheme();
  // Model Stages
  const [originalModel, setOriginalModel] = useState<string | null>(null);
  const [neutralModel, setNeutralModel] = useState<string | null>(null);
  const [shirtModel, setShirtModel] = useState<string | null>(null);
  const [finalModel, setFinalModel] = useState<string | null>(null);

  // Asset Inputs
  const [uploadedShirt, setUploadedShirt] = useState<string | null>(null);
  const [uploadedPants, setUploadedPants] = useState<string | null>(null);

  // UI States
  const [isUploaderHidden, setIsUploaderHidden] = useState(false);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('9:16');

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

  const handleModelUpload = async (base64: string) => {
    setOriginalModel(base64);
    setNeutralModel(null);
    setShirtModel(null);
    setFinalModel(null);
    setUploadedShirt(null);
    setUploadedPants(null);
    setIsUploaderHidden(false);

    setProcessing({ isProcessing: true, error: null, progress: 'Menyiapkan Kaos & Celana Pendek Dasar...' });
    try {
      const neutralized = await neutralizeClothes(base64);
      if (!neutralized) throw new Error("Gagal melakukan pembersihan model.");
      
      setNeutralModel(neutralized);
      setInitialResultImage(neutralized);
      setProcessing({ isProcessing: false, error: null, progress: '' });
      setIsUploaderHidden(true);
    } catch (err: any) {
      setProcessing({ 
        isProcessing: false, 
        error: err.message || "Gagal memproses model sumber.", 
        progress: '' 
      });
      setNeutralModel(null);
    }
  };

  const handleApplyShirt = async () => {
    if (!neutralModel || !uploadedShirt) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Mengganti Atasan...' });
    setShirtModel(null);
    setFinalModel(null);

    try {
      const result = await applyGarment(neutralModel, uploadedShirt, 'TOP', '', aspectRatio);
      setShirtModel(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memasang atasan.", progress: '' });
    }
  };

  const handleApplyPants = async () => {
    const baseImage = shirtModel || neutralModel;
    if (!baseImage || !uploadedPants) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Mengganti Bawahan...' });
    setFinalModel(null);

    try {
      const result = await applyGarment(baseImage, uploadedPants, 'BOTTOM', '', aspectRatio);
      setFinalModel(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memasang bawahan.", progress: '' });
    }
  };

  const handleSharpen = async () => {
    const currentResult = finalModel || shirtModel || neutralModel;
    if (!currentResult) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Menajamkan Hasil...' });
    try {
      const sharpenedImage = await upscaleImage(currentResult, aspectRatio);
      if (finalModel) setFinalModel(sharpenedImage);
      else if (shirtModel) setShirtModel(sharpenedImage);
      else setNeutralModel(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal menajamkan foto.", progress: '' });
    }
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

  const handleApplyCrop = async () => {
    const currentResult = finalModel || shirtModel || neutralModel;
    if (!currentResult || !croppedAreaPixels) return;
    try {
      const image = await createImage(currentResult);
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
      
      const base64Image = canvas.toDataURL('image/png');
      if (finalModel) setFinalModel(base64Image);
      else if (shirtModel) setShirtModel(base64Image);
      else setNeutralModel(base64Image);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto', progress: '' });
    }
  };

  const handleReset = () => {
    if (initialResultImage) {
      if (finalModel) setFinalModel(initialResultImage);
      else if (shirtModel) setShirtModel(initialResultImage);
      else setNeutralModel(initialResultImage);
    }
  };

  const downloadResult = () => {
    const final = finalModel || shirtModel || neutralModel;
    if (!final) return;
    const link = document.createElement('a');
    link.href = final;
    link.download = `guber-multi-tryon-${Date.now()}.png`;
    link.click();
  };

  const afterImage = finalModel || shirtModel || neutralModel;
  const beforeImage = originalModel;

  const [ratioW, ratioH] = aspectRatio.split(':').map(Number);

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl lg:max-w-7xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
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
                <Shirt size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">MULTI TRY-ON STUDIO</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Smart Fitting Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-16 space-y-8 flex-1 lg:grid lg:grid-cols-2 lg:gap-16 lg:space-y-0">
          <div className="space-y-8">
            {/* Step 1: Model Upload */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} className="text-slate-300" /> 1. Unggah Model
                </label>
                {originalModel && (
                  <button 
                    onClick={() => setIsUploaderHidden(!isUploaderHidden)}
                    className="text-[9px] font-black uppercase tracking-widest hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {isUploaderHidden ? 'Ganti Model' : 'Tutup Panel'}
                  </button>
                )}
              </div>
              
              <AnimatePresence mode="wait">
                {!isUploaderHidden && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <ImageUploader 
                      label="Pilih Foto Model" 
                      image={originalModel} 
                      onImageSelect={handleModelUpload} 
                      onClear={() => { setOriginalModel(null); setNeutralModel(null); }} 
                      aspectRatio="9-16" 
                      labelInside
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 2: Shirt Selection */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${neutralModel ? 'text-slate-400' : 'text-slate-200'}`}>
                <Shirt size={12} className={neutralModel ? 'text-slate-300' : 'text-slate-100'} /> 2. Ganti Atasan
              </label>
              
              {neutralModel ? (
                <div className="space-y-4">
                  <ImageUploader 
                    label="Pilih Gambar Baju" 
                    image={uploadedShirt} 
                    onImageSelect={(img) => { setUploadedShirt(img); setShirtModel(null); setFinalModel(null); }} 
                    onClear={() => { setUploadedShirt(null); setShirtModel(null); setFinalModel(null); }} 
                    aspectRatio="square" 
                    labelInside
                  />
                  <button
                    disabled={processing.isProcessing || !uploadedShirt}
                    onClick={handleApplyShirt}
                    className="w-full disabled:bg-slate-300 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: processing.isProcessing || !uploadedShirt ? undefined : primaryColor }}
                  >
                    {processing.isProcessing && !shirtModel ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>{shirtModel ? "GANTI LAGI" : "PASANG ATASAN"}</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 opacity-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Selesaikan Langkah 1</p>
                </div>
              )}
            </div>

            {/* Step 3: Pants Selection */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${shirtModel ? 'text-slate-400' : 'text-slate-200'}`}>
                <Layers size={12} className={shirtModel ? 'text-slate-300' : 'text-slate-100'} /> 3. Ganti Bawahan
              </label>
              
              {shirtModel ? (
                <div className="space-y-4">
                  <ImageUploader 
                    label="Pilih Gambar Celana" 
                    image={uploadedPants} 
                    onImageSelect={(img) => { setUploadedPants(img); setFinalModel(null); }} 
                    onClear={() => { setUploadedPants(null); setFinalModel(null); }} 
                    aspectRatio="square" 
                    labelInside
                  />
                  <button
                    disabled={processing.isProcessing || !uploadedPants}
                    onClick={handleApplyPants}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {processing.isProcessing && shirtModel && !finalModel ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>{finalModel ? "GANTI LAGI" : "PASANG BAWAHAN"}</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 opacity-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Pasang atasan dulu</p>
                </div>
              )}
            </div>

            {/* Step 4: Aspect Ratio */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Maximize2 size={12} className="text-slate-300" /> 4. Aspek Rasio
              </label>
              <div className="grid grid-cols-5 gap-2">
                {['9:16', '3:4', '1:1', '4:3', '16:9'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border-2 ${
                      aspectRatio === ratio 
                        ? 'text-white shadow-lg' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                    style={{ 
                      backgroundColor: aspectRatio === ratio ? primaryColor : undefined,
                      borderColor: aspectRatio === ratio ? primaryColor : undefined
                    }}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Area */}
          <div className="space-y-4 lg:pt-0 pt-6 border-t lg:border-t-0 border-slate-100 lg:sticky lg:top-8 self-start">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={12} className="text-slate-300" /> Hasil Try-On AI
              </label>
            </div>

            <div className="flex flex-col items-center w-full">
              <div 
                className="w-full max-w-[280px] lg:max-w-full bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500"
                style={{ 
                  aspectRatio: `${ratioW}/${ratioH}`,
                  borderColor: afterImage ? 'white' : `${primaryColor}40`,
                  backgroundColor: afterImage ? 'white' : undefined
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
                      <span className="mt-4 text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>{processing.progress || 'Neural Fitting...'}</span>
                    </motion.div>
                  ) : afterImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full relative select-none touch-none"
                    >
                      <img src={beforeImage!} className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 blur-[1px]" alt="Original" />
                      <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                        <img src={afterImage} className="absolute inset-0 w-full h-full object-cover" alt="Result" />
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={sliderPos} 
                        onChange={(e) => setSliderPos(Number(e.target.value))} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" 
                      />
                      <div className="absolute top-0 bottom-0 w-[2px] bg-white z-10 pointer-events-none shadow-2xl" style={{ left: `${sliderPos}%` }}>
                        <div 
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:scale-110 shadow-xl"
                          style={{ borderColor: primaryColor }}
                        >
                          <div className="flex gap-0.5">
                            <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                            <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[6px] font-black text-white uppercase tracking-widest pointer-events-none">Asli</div>
                      <div className="absolute bottom-4 right-4 px-2 py-0.5 bg-white/40 backdrop-blur-md rounded-full text-[6px] font-black text-black uppercase tracking-widest pointer-events-none">Try-On AI</div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                        <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-12 h-12 object-contain grayscale opacity-50" alt="Logo" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Hasil</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] lg:max-w-full mx-auto mt-8">
                <button
                  onClick={() => setIsFullPreviewOpen(true)}
                  disabled={!afterImage || processing.isProcessing}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !afterImage || processing.isProcessing 
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
                  disabled={!afterImage || processing.isProcessing}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !afterImage || processing.isProcessing 
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
                  disabled={!afterImage || processing.isProcessing}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !afterImage || processing.isProcessing 
                      ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                  style={{ color: primaryColor }}
                  title="Tajamkan"
                >
                  <Zap size={20} />
                </button>
                <button
                  onClick={handleReset}
                  disabled={!afterImage || processing.isProcessing || afterImage === initialResultImage}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !afterImage || processing.isProcessing || afterImage === initialResultImage
                      ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                  style={{ color: primaryColor }}
                  title="Reset"
                >
                  <Recycle size={20} />
                </button>
                <button
                  onClick={downloadResult}
                  disabled={!afterImage || processing.isProcessing}
                  className={`flex items-center justify-center py-4 text-white rounded-2xl transition-all ${
                    !afterImage || processing.isProcessing 
                      ? 'bg-slate-300 opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  style={{ backgroundColor: !afterImage || processing.isProcessing ? undefined : primaryColor }}
                  title="Download"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
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

      {/* Full Preview Modal */}
      <AnimatePresence>
        {isFullPreviewOpen && afterImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setIsFullPreviewOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center" 
              onClick={e => e.stopPropagation()}
            >
              <img src={afterImage} className="max-w-full max-h-[90vh] rounded-[32px] shadow-2xl border border-white/10 object-contain" alt="Full Preview" />
              <button 
                className="absolute -top-4 -right-4 lg:top-0 lg:-right-12 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
                onClick={() => setIsFullPreviewOpen(false)}
              >
                <X size={24} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <button
                  onClick={downloadResult}
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
        {isCropping && afterImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil</h2>
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
                image={afterImage}
                crop={crop}
                zoom={zoom}
                aspect={ratioW / ratioH}
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

export default GuberMultiTryOn;
