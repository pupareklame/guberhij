import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Maximize, Send, Sparkles, Download, RefreshCw, Scissors, Check, X, Image as ImageIcon, User, Eye, Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import ImageUploader from '../components/ImageUploader';
import { SceneConfig, ProcessingState } from '../types';
import { generateScene, upscaleImage } from '../services/geminiService';
import { useTheme } from '../src/contexts/ThemeContext';

const Scene: React.FC = () => {
  const { primaryColor } = useTheme();
  const [images, setImages] = useState<{ reference: string | null, character: string | null }>({
    reference: null,
    character: null
  });
  const [config, setConfig] = useState<SceneConfig>({
    prompt: '',
    aspectRatio: '1:1'
  });
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResult, setOriginalResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: ''
  });

  // UI States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getAspectRatioValue = (ratio: string) => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
  };

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square';
      case '9:16': return 'aspect-[9/16]';
      case '16:9': return 'aspect-[16/9]';
      case '3:4': return 'aspect-[3/4]';
      case '4:3': return 'aspect-[4/3]';
      default: return 'aspect-square';
    }
  };

  const handleGenerate = async () => {
    if (!images.reference) {
      setProcessing({ isProcessing: false, error: 'Harap unggah gambar referensi', progress: '' });
      return;
    }
    if (!config.prompt.trim()) {
      setProcessing({ isProcessing: false, error: 'Harap isi prompt pengambilan scene', progress: '' });
      return;
    }

    setResultImage(null);
    setOriginalResult(null);
    setIsCropping(false);
    setProcessing({ isProcessing: true, error: null, progress: 'Menganalisis Scene...' });
    
    try {
      const result = await generateScene(config, images);
      setResultImage(result);
      setOriginalResult(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || 'Gagal memproses scene', progress: '' });
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

      const { width, height } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;

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
      setResultImage(base64Image);
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

  const handleSetAsSource = () => {
    if (resultImage) {
      setImages({ ...images, reference: resultImage });
      setResultImage(null);
      setOriginalResult(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    if (originalResult) {
      setResultImage(originalResult);
      setIsCropping(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `scene-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header Bar */}
      <div className="h-16 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 border-b border-white/10 flex items-center px-6 justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md border border-white/20">
            <Camera size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight uppercase leading-none">Scene Master AI</h1>
            <p className="text-[9px] font-bold text-teal-400 uppercase tracking-[0.2em] mt-1">Neural Cinematic Engine</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-full lg:w-[400px] bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-8">
            {/* Image Uploaders */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} /> 1. Gambar Referensi
                </label>
                <ImageUploader
                  label="Unggah Referensi"
                  image={images.reference}
                  onImageSelect={(img) => setImages({ ...images, reference: img })}
                  onClear={() => setImages({ ...images, reference: null })}
                  aspectRatio="square"
                  labelInside
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> 2. Karakter (Opsional)
                </label>
                <ImageUploader
                  label="Unggah Karakter"
                  image={images.character}
                  onImageSelect={(img) => setImages({ ...images, character: img })}
                  onClear={() => setImages({ ...images, character: null })}
                  aspectRatio="square"
                  labelInside
                  description="Agar karakter tetap konsisten"
                />
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Send size={14} /> 3. Prompt Scene
              </label>
              <textarea
                value={config.prompt}
                onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                placeholder="Misal: Ambil dari sudut pandang mata burung (bird eye view), atau close up wajah..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none min-h-[140px] resize-none transition-all"
              />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Maximize size={14} /> 4. Rasio Gambar
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['1:1', '9:16', '3:4', '16:9', '4:3'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setConfig({ ...config, aspectRatio: ratio })}
                    className={`py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${config.aspectRatio === ratio ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100' : 'bg-white border-slate-100 text-slate-500 hover:border-teal-200'}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={processing.isProcessing}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-3 group active:scale-95"
            >
              {processing.isProcessing ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              )}
              <span>{processing.isProcessing ? 'MENSINTESIS...' : 'HASILKAN SCENE'}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col items-center bg-slate-50/50">
          <div className="w-full max-w-4xl space-y-10">
            {/* Result Area */}
            <div className="flex flex-col items-center w-full">
              <div className={`w-full max-w-2xl ${getAspectRatioClass(config.aspectRatio)} bg-white rounded-[48px] border-8 border-white shadow-2xl shadow-teal-900/10 overflow-hidden relative group`}>
                <AnimatePresence mode="wait">
                  {processing.isProcessing ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-teal-900/10 backdrop-blur-md z-30"
                    >
                      <div className="relative">
                        <div className="w-24 h-24 border-4 border-teal-100 rounded-full"></div>
                        <div className="absolute inset-0 w-24 h-24 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera size={32} className="text-teal-600 animate-pulse" />
                        </div>
                      </div>
                      <p className="mt-6 text-teal-900 font-black uppercase tracking-widest text-xs italic animate-pulse">Neural Rendering...</p>
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
                        aspect={getAspectRatioValue(config.aspectRatio)}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        style={{
                          containerStyle: { background: '#0f172a' },
                          cropAreaStyle: { border: '2px solid #2dd4bf', boxShadow: '0 0 0 9999px rgba(0,0,0,0.8)' }
                        }}
                      />
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
                        <button
                          onClick={() => setIsCropping(false)}
                          className="bg-white/90 backdrop-blur-md text-slate-600 p-4 rounded-2xl shadow-xl hover:bg-white transition-all active:scale-90"
                        >
                          <X size={24} />
                        </button>
                        <button
                          onClick={handleApplyCrop}
                          className="bg-teal-600 text-white p-4 rounded-2xl shadow-xl hover:bg-teal-500 transition-all active:scale-90"
                        >
                          <Check size={24} />
                        </button>
                      </div>
                    </motion.div>
                  ) : resultImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full relative"
                    >
                      <img
                        src={resultImage}
                        alt="Scene Result"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-slate-50"
                    >
                      <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center mb-6">
                        <Camera size={48} className="text-slate-200" />
                      </div>
                      <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">Neural Canvas Ready</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              {resultImage && !processing.isProcessing && !isCropping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-10 flex flex-col items-center gap-6 w-full max-w-2xl"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                    <button
                      onClick={() => setIsPreviewOpen(true)}
                      className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <Eye size={16} /> Preview
                    </button>
                    <button
                      onClick={() => setIsCropping(true)}
                      className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <Scissors size={16} /> Crop
                    </button>
                    <button
                      onClick={handleUpscale}
                      className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <Sparkles size={16} /> Tajamkan
                    </button>
                    <button
                      onClick={handleSetAsSource}
                      className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <Maximize size={16} /> Jadikan Sumber
                    </button>
                    <button
                      onClick={handleReset}
                      className="bg-white border-2 border-slate-100 hover:border-rose-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <RefreshCw size={16} /> Reset
                    </button>
                    <button
                      onClick={handleDownload}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-teal-100 active:scale-95"
                    >
                      <Download size={16} /> Download
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {processing.error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-6 bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest w-full max-w-2xl"
                >
                  {processing.error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && resultImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-12"
          >
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            >
              <X size={40} />
            </button>
            <img
              src={resultImage}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              alt="Preview"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scene;
