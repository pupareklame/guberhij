
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
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden">
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
                <Shirt size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">TRY-ON AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Fitting Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            {/* Column 1: Model & Step Info */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              {/* Model Upload */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <User size={14} className="text-slate-300" /> 1. Foto Model
                </label>
                <div className="lg:flex-1 min-h-0">
                  <ImageUploader
                    label="Pilih Foto Model"
                    image={originalModel}
                    onImageSelect={handleModelUpload}
                    onClear={() => { setOriginalModel(null); setNeutralModel(null); setShirtModel(null); setFinalModel(null); }}
                    aspectRatio="9-16"
                    labelInside
                  />
                </div>
              </div>

              {/* Status Info */}
              <div className="shrink-0 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-300" /> AI Status
                </label>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Model Ready</span>
                      <div className={`w-2 h-2 rounded-full ${neutralModel ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-200'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Top Fitting</span>
                      <div className={`w-2 h-2 rounded-full ${shirtModel ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-200'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Final Output</span>
                      <div className={`w-2 h-2 rounded-full ${finalModel ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-200'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Garment Selections */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
               {/* Shirt Selection */}
               <div className="flex-1 flex flex-col min-h-0">
                  <label className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-2 ${neutralModel ? 'text-slate-400' : 'text-slate-200'}`}>
                    <Shirt size={14} className={neutralModel ? 'text-slate-300' : 'text-slate-100'} /> 2. Pilih Atasan
                  </label>
                  <div className="flex-1 min-h-0 relative">
                    <ImageUploader 
                      label="Upload Baju" 
                      image={uploadedShirt} 
                      onImageSelect={(img) => { setUploadedShirt(img); setShirtModel(null); setFinalModel(null); }} 
                      onClear={() => { setUploadedShirt(null); setShirtModel(null); setFinalModel(null); }} 
                      aspectRatio="square" 
                      labelInside
                    />
                    {!neutralModel && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center p-6 text-center select-none">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-white/80 px-4 py-2 rounded-lg shadow-sm">Unggah model terlebih dahulu</p>
                      </div>
                    )}
                  </div>
                  <button
                    disabled={processing.isProcessing || !uploadedShirt || !neutralModel}
                    onClick={handleApplyShirt}
                    className="mt-2 w-full py-3 rounded-xl text-white font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-30"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {processing.isProcessing && !shirtModel ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>PASANG ATASAN</span>
                  </button>
               </div>

               {/* Pants Selection */}
               <div className="flex-1 flex flex-col min-h-0 border-t border-slate-100 pt-4">
                  <label className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-2 ${shirtModel ? 'text-slate-400' : 'text-slate-200'}`}>
                    <Layers size={14} className={shirtModel ? 'text-slate-300' : 'text-slate-100'} /> 3. Pilih Bawahan
                  </label>
                  <div className="flex-1 min-h-0 relative">
                    <ImageUploader 
                      label="Upload Celana" 
                      image={uploadedPants} 
                      onImageSelect={(img) => { setUploadedPants(img); setFinalModel(null); }} 
                      onClear={() => { setUploadedPants(null); setFinalModel(null); }} 
                      aspectRatio="square" 
                      labelInside
                    />
                    {!shirtModel && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center p-6 text-center select-none">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-white/80 px-4 py-2 rounded-lg shadow-sm">Pasang atasan terlebih dahulu</p>
                      </div>
                    )}
                  </div>
                  <button
                    disabled={processing.isProcessing || !uploadedPants || !shirtModel}
                    onClick={handleApplyPants}
                    className="mt-2 w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-30"
                  >
                    {processing.isProcessing && shirtModel && !finalModel ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>PASANG BAWAHAN</span>
                  </button>
               </div>
            </div>

            {/* Column 3: Result Section */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Rasio
                </label>
                
                {/* Aspect Ratio Selection */}
                <div className="flex-1 flex items-center gap-2 lg:gap-1 overflow-x-auto no-scrollbar justify-end ml-4">
                  {['9:16', '3:4', '1:1', '4:3', '16:9'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-1.5 lg:px-2 lg:py-1 rounded-lg border transition-all text-[10px] lg:text-[8px] font-black shrink-0 ${
                        aspectRatio === ratio 
                          ? 'shadow-sm text-white' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 shadow-sm'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === ratio ? primaryColor : undefined,
                        borderColor: aspectRatio === ratio ? primaryColor : undefined,
                      }}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className="bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner"
                  style={{ 
                    borderColor: afterImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: afterImage ? 'white' : undefined,
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: ratioW / ratioH
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
                    ) : afterImage ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                      >
                        {/* BEFORE/AFTER SLIDER */}
                        <div className="absolute inset-0">
                          <img src={afterImage} alt="Result" className="w-full h-full object-cover" />
                        </div>
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                          <img src={beforeImage!} alt="Original" className="w-full h-full object-cover" />
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
                          Original
                        </div>
                        <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest z-30">
                          Try-On AI
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                          <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-12 h-12 object-contain grayscale opacity-50" alt="Logo" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum Ada Hasil</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-5 gap-2 lg:gap-3 w-full mx-auto shrink-0">
                  <button 
                    onClick={() => setIsFullPreviewOpen(true)}
                    disabled={!afterImage || processing.isProcessing}
                    title="Preview"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => setIsCropping(true)}
                    disabled={!afterImage || processing.isProcessing}
                    title="Crop"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Scissors size={20} />
                  </button>
                  <button 
                    onClick={handleSharpen}
                    disabled={!afterImage || processing.isProcessing}
                    title="Sharpen"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-rose-500 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Zap size={20} />
                  </button>
                  <button 
                    onClick={handleReset}
                    disabled={!afterImage || processing.isProcessing || afterImage === initialResultImage}
                    title="Reset"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Recycle size={20} />
                  </button>
                  <button 
                    onClick={downloadResult}
                    disabled={!afterImage || processing.isProcessing}
                    title="Download"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
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
