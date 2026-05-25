// @ais-lock: DO NOT MODIFY - FILE IS FINAL
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shirt, User, Download, RefreshCw, Sparkles, Image as ImageIcon, Eye, Scissors, X, Check, Layers, Zap, Recycle, Maximize, Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { applyGarment, applyMultiGarments, applyPromptGarment, upscaleImage } from '../services/gantibaju';
import { enhancePrompt } from '../services/buat';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GantiBaju: React.FC = () => {
  const { primaryColor } = useTheme();
  const [originalModel, setOriginalModel] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [topAsset, setTopAsset] = useState<string | null>(null);
  const [bottomAsset, setBottomAsset] = useState<string | null>(null);
  const [fullSetAsset, setFullSetAsset] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState<'FULL_SET' | 'PARTS' | 'PROMPT'>('PARTS');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
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

  const handleModelUpload = async (base64: string) => {
    setOriginalModel(base64);
    setBeforeImage(base64);
    setResultImage(null);
  };

  const handleProcessFitting = async () => {
    const baseModel = originalModel;
    if (!baseModel) return;

    if (mode === 'FULL_SET' && !fullSetAsset) {
      setProcessing({ isProcessing: false, error: "Harap unggah foto pakaian (Full Set).", progress: '' });
      return;
    }

    if (mode === 'PARTS' && !topAsset && !bottomAsset) {
      setProcessing({ isProcessing: false, error: "Harap unggah minimal satu bagian pakaian (Atasan/Bawahan).", progress: '' });
      return;
    }

    if (mode === 'PROMPT' && !customPrompt.trim()) {
      setProcessing({ isProcessing: false, error: "Harap isi keterangan baju kustom.", progress: '' });
      return;
    }

    setResultImage(null);
    setInitialResultImage(null);
    setIsCropping(false);
    setProcessing({ isProcessing: true, error: null, progress: 'Neural Outfit Fitting...' });

    try {
      let result: string;
      if (mode === 'FULL_SET') {
        result = await applyGarment(baseModel, fullSetAsset!, 'BOTH', customPrompt || 'Fit this one-piece set perfectly to the model body.', aspectRatio);
      } else if (mode === 'PARTS') {
        result = await applyMultiGarments(baseModel, topAsset, bottomAsset, customPrompt || 'Apply these specific items to the correct regions.', aspectRatio);
      } else {
        result = await applyPromptGarment(baseModel, customPrompt, aspectRatio);
      }
      
      setResultImage(result);
      setInitialResultImage(result);
      setBeforeImage(originalModel);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal mengganti pakaian.", progress: '' });
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
      console.error(e);
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
      setSliderPos(50);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!customPrompt.trim()) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menyempurnakan Prompt...' });
    try {
      const enhanced = await enhancePrompt(customPrompt);
      setCustomPrompt(enhanced);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: "Gagal menyempurnakan prompt.", progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `gantibaju-${Date.now()}.png`;
    link.click();
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
    if (!resultImage || !croppedAreaPixels || croppedAreaPixels.width === 0) {
      setIsCropping(false);
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Cropping Image...' });
    
    try {
      const { width, height, x, y } = croppedAreaPixels;
      
      // Crop Result Image
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      const croppedResult = canvas.toDataURL('image/png');
      setResultImage(croppedResult);

      // Also crop the before image so the slider stays aligned
      if (beforeImage) {
        const bImg = await createImage(beforeImage);
        const bCanvas = document.createElement('canvas');
        const bCtx = bCanvas.getContext('2d');
        if (bCtx) {
          bCanvas.width = width; bCanvas.height = height;
          bCtx.drawImage(bImg, x, y, width, height, 0, 0, width, height);
          setBeforeImage(bCanvas.toDataURL('image/png'));
        }
      }

      setIsCropping(false);
      setTimeout(() => {
        setProcessing({ isProcessing: false, error: null, progress: '' });
      }, 100);
    } catch (e: any) {
      console.error("Crop Error:", e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar: ' + (e.message || 'Unknown error'), progress: '' });
      setIsCropping(false);
    }
  };

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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">GANTI BAJU AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Outfit Swap Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            {/* Column 1: Model & Mode */}
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
                    onClear={() => { setOriginalModel(null); setBeforeImage(null); }}
                    aspectRatio="9-16"
                    labelInside
                  />
                </div>
              </div>

              {/* Mode Selection */}
              <div className="shrink-0 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-slate-300" /> 2. Mode Pakaian
                </label>
                <div className="grid grid-cols-1 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                  {(['PARTS', 'FULL_SET', 'PROMPT'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`py-3 lg:py-1.5 rounded-xl text-[11px] lg:text-[9px] font-black uppercase transition-all ${mode === m ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      style={{ color: mode === m ? primaryColor : undefined }}
                    >
                      {m === 'FULL_SET' ? 'Satu Set' : m === 'PARTS' ? 'Atasan/Bawahan' : 'Prompt AI'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Outfit Selection */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              <AnimatePresence mode="wait">
                {mode === 'FULL_SET' ? (
                  <motion.div
                    key="full-set"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Shirt size={14} className="text-slate-300" /> 3. Foto Pakaian (Full Set)
                    </label>
                    <div className="flex-1 min-h-0">
                      <ImageUploader
                        label="Pilih Pakaian"
                        image={fullSetAsset}
                        onImageSelect={setFullSetAsset}
                        onClear={() => setFullSetAsset(null)}
                        aspectRatio="square"
                        labelInside
                      />
                    </div>

                    <div className="shrink-0 mt-2">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-slate-300" /> 4. Detail Tambahan (Opsional)
                      </label>
                      <div className="relative">
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Mendetailkan hal yang dianggap perlu..."
                          className="w-full min-h-[80px] p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl text-xs font-medium focus:border-slate-400 focus:outline-none resize-none transition-all shadow-inner"
                        />
                        <div className="absolute bottom-3 right-3 flex gap-1.5">
                          <button
                            onClick={() => setCustomPrompt('')}
                            className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                            style={{ opacity: customPrompt ? 1 : 0 }}
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            onClick={handleEnhancePrompt}
                            disabled={!customPrompt.trim() || processing.isProcessing}
                            className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
                            title="Sempurnakan dengan AI"
                            style={{ opacity: customPrompt ? 1 : 0 }}
                          >
                            <Sparkles size={12} style={{ color: customPrompt.trim() ? primaryColor : undefined }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : mode === 'PARTS' ? (
                  <motion.div
                    key="parts"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col gap-4 min-h-0"
                  >
                    <div className="flex-1 flex flex-col min-h-0">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Shirt size={14} className="text-slate-300" /> 3. Foto Atasan
                      </label>
                      <div className="flex-1 min-h-0">
                        <ImageUploader
                          label="Pilih Atasan"
                          image={topAsset}
                          onImageSelect={setTopAsset}
                          onClear={() => setTopAsset(null)}
                          aspectRatio="square"
                          labelInside
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Shirt size={14} className="text-slate-300" /> 4. Foto Bawahan
                      </label>
                      <div className="flex-1 min-h-0">
                        <ImageUploader
                          label="Pilih Bawahan"
                          image={bottomAsset}
                          onImageSelect={setBottomAsset}
                          onClear={() => setBottomAsset(null)}
                          aspectRatio="square"
                          labelInside
                        />
                      </div>
                    </div>

                    <div className="shrink-0">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-slate-300" /> 5. Detail Tambahan (Opsional)
                      </label>
                      <div className="relative">
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Mendetailkan hal yang dianggap perlu..."
                          className="w-full min-h-[80px] p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl text-xs font-medium focus:border-slate-400 focus:outline-none resize-none transition-all shadow-inner"
                        />
                         <div className="absolute bottom-3 right-3 flex gap-1.5">
                          <button
                            onClick={() => setCustomPrompt('')}
                            className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                            style={{ opacity: customPrompt ? 1 : 0 }}
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            onClick={handleEnhancePrompt}
                            disabled={!customPrompt.trim() || processing.isProcessing}
                            className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
                            title="Sempurnakan dengan AI"
                            style={{ opacity: customPrompt ? 1 : 0 }}
                          >
                            <Sparkles size={12} style={{ color: customPrompt.trim() ? primaryColor : undefined }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="prompt"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-slate-300" /> 3. Keterangan Baju Kustom
                    </label>
                    <div className="relative flex-1">
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Contoh: Gaun pesta warna merah dengan motif bunga emas..."
                        className="w-full min-h-[450px] lg:min-h-[250px] p-6 bg-slate-50 border-2 border-slate-200 rounded-[32px] text-base lg:text-sm font-medium focus:border-slate-400 focus:outline-none resize-none transition-all shadow-inner"
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                          onClick={() => setCustomPrompt('')}
                          disabled={!customPrompt.trim() || processing.isProcessing}
                          className="p-2 bg-white shadow-lg border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all disabled:opacity-50"
                          title="Hapus Prompt"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={handleEnhancePrompt}
                          disabled={!customPrompt.trim() || processing.isProcessing}
                          className="p-2 bg-white shadow-lg border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
                          title="Sempurnakan dengan AI"
                        >
                          <Sparkles size={16} style={{ color: customPrompt.trim() ? primaryColor : undefined }} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Generate Button */}
              <div className="lg:hidden pt-4">
                <button 
                  onClick={handleProcessFitting}
                  disabled={processing.isProcessing || !originalModel || (mode === 'FULL_SET' ? !fullSetAsset : mode === 'PARTS' ? (!topAsset && !bottomAsset) : !customPrompt.trim())}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !originalModel || (mode === 'FULL_SET' ? !fullSetAsset : mode === 'PARTS' ? (!topAsset && !bottomAsset) : !customPrompt.trim())) ? '#cbd5e1' : primaryColor 
                  }}
                >
                  HASILKAN
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
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`px-3 py-1.5 lg:px-2 lg:py-1 rounded-lg border transition-all text-[10px] lg:text-[8px] font-black shrink-0 ${
                        aspectRatio === r.value 
                          ? 'shadow-sm' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                        color: aspectRatio === r.value ? 'white' : undefined,
                        borderColor: aspectRatio === r.value ? primaryColor : undefined,
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className={`bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner ${
                    aspectRatio === '1:1' ? 'aspect-square' :
                    aspectRatio === '3:4' ? 'aspect-[3/4]' :
                    aspectRatio === '4:3' ? 'aspect-[4/3]' :
                    aspectRatio === '9:16' ? 'aspect-[9/16]' :
                    'aspect-[16/9]'
                  }`}
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: aspectRatio.replace(':', '/')
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
                        {/* BEFORE/AFTER SLIDER */}
                        <div className="absolute inset-0">
                          <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
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
                          AI Fitting
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
                <div className="grid grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3 w-full mx-auto">
                  <button 
                    onClick={handleProcessFitting}
                    disabled={processing.isProcessing || !originalModel || (mode === 'FULL_SET' ? !fullSetAsset : mode === 'PARTS' ? (!topAsset && !bottomAsset) : !customPrompt.trim())}
                    title="Generate"
                    className="hidden lg:flex order-5 lg:order-first col-span-1 lg:col-span-2 py-4 rounded-2xl border-2 text-white items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                    style={{ 
                      backgroundColor: (processing.isProcessing || !originalModel || (mode === 'FULL_SET' ? !fullSetAsset : mode === 'PARTS' ? (!topAsset && !bottomAsset) : !customPrompt.trim())) ? '#cbd5e1' : primaryColor, 
                      borderColor: (processing.isProcessing || !originalModel || (mode === 'FULL_SET' ? !fullSetAsset : mode === 'PARTS' ? (!topAsset && !bottomAsset) : !customPrompt.trim())) ? '#cbd5e1' : primaryColor 
                    }}
                  >
                    <span className="font-black uppercase tracking-widest text-[10px]">HASILKAN</span>
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
                    onClick={handleReset}
                    disabled={processing.isProcessing || !resultImage || resultImage === initialResultImage}
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Fitting</h2>
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
);
};

export default GantiBaju;