
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, RefreshCw, Info, ShieldCheck, Maximize2, Zap, Box, Building2, User, Type, Layout, X, Scissors, Check, Eye, RotateCcw, AlertCircle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { generate3DRender, upscaleImage } from '../services/3drender';
import { useTheme } from '../src/contexts/ThemeContext';

const Guber3DRender: React.FC = () => {
  const { primaryColor } = useTheme();
  
  // Inputs
  const [buildingType, setBuildingType] = useState('APARTEMEN');
  const [characterType, setCharacterType] = useState('KUCING');
  const [mainText, setMainText] = useState('ABCD');
  const [subText, setSubText] = useState('CAFE');
  const [topText, setTopText] = useState('HOME');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [selectedEngine, setSelectedEngine] = useState('gemini-2.5-flash-image');

  // Result
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  // UI States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const handleGenerate = async () => {
    setProcessing({ isProcessing: true, error: null, progress: 'Membangun Dunia 3D...' });
    setResultImage(null);

    try {
      const result = await generate3DRender({
        buildingType,
        characterType,
        mainText,
        subText,
        topText,
        aspectRatio,
        modelId: selectedEngine
      });
      setResultImage(result);
      setOriginalImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      let errorMessage = err.message || "Gagal membuat 3D Render.";
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setProcessing({ 
          isProcessing: false, 
          error: "AKSES_DITOLAK", 
          progress: '' 
        });
      } else {
        setProcessing({ isProcessing: false, error: errorMessage, progress: '' });
      }
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Menajamkan Hasil...' });
    try {
      const sharpenedImage = await upscaleImage(resultImage, aspectRatio);
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      let errorMessage = err.message || "Gagal menajamkan foto.";
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setProcessing({ 
          isProcessing: false, 
          error: "AKSES_DITOLAK", 
          progress: '' 
        });
      } else {
        setProcessing({ isProcessing: false, error: errorMessage, progress: '' });
      }
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `guber-3drender-${Date.now()}.png`;
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
      
      const base64Image = canvas.toDataURL('image/png');
      setResultImage(base64Image);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto', progress: '' });
    }
  };

  const handleReset = () => {
    if (originalImage) {
      setResultImage(originalImage);
    }
  };

  const [ratioW, ratioH] = aspectRatio.split(':').map(Number);

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">3D RENDER STUDIO</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Isometric Kawaii Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 flex-1">
          {/* Building & Character Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} className="text-slate-300" /> Jenis Bangunan
              </label>
              <input 
                type="text"
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value.toUpperCase())}
                placeholder="MISAL: APARTEMEN"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[10px] font-bold outline-none transition-all focus:bg-white focus:border-slate-200"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-slate-300" /> Jenis Karakter
              </label>
              <input 
                type="text"
                value={characterType}
                onChange={(e) => setCharacterType(e.target.value.toUpperCase())}
                placeholder="MISAL: KUCING"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[10px] font-bold outline-none transition-all focus:bg-white focus:border-slate-200"
              />
            </div>
          </div>

          {/* Text Inputs */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={12} className="text-slate-300" /> Kustomisasi Teks
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Teks Atas</span>
                <input 
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-[9px] font-bold outline-none focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Teks Utama</span>
                <input 
                  type="text"
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-[9px] font-bold outline-none focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Subteks</span>
                <input 
                  type="text"
                  value={subText}
                  onChange={(e) => setSubText(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-[9px] font-bold outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layout size={12} className="text-slate-300" /> Aspek Rasio
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

          {/* Engine Selection */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} className="text-slate-300" /> Mesin Render AI
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'gemini-2.5-flash-image', label: '2.5 Flash', desc: 'Stable' }
              ].map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => setSelectedEngine(engine.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    selectedEngine === engine.id 
                      ? 'text-white shadow-lg' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                  style={{ 
                    backgroundColor: selectedEngine === engine.id ? primaryColor : undefined,
                    borderColor: selectedEngine === engine.id ? primaryColor : undefined
                  }}
                >
                  <span className="text-[9px] font-black uppercase tracking-tight">{engine.label}</span>
                  <span className={`text-[7px] font-bold uppercase opacity-60 ${selectedEngine === engine.id ? 'text-white' : 'text-slate-400'}`}>
                    {engine.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            disabled={processing.isProcessing}
            onClick={handleGenerate}
            className="w-full disabled:bg-slate-300 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: processing.isProcessing ? undefined : primaryColor }}
          >
            {processing.isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>PROSES SEKARANG</span>
          </button>

          {/* Result Area */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex flex-col items-center w-full">
              <div 
                className="w-full max-w-[280px] bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500"
                style={{ 
                  aspectRatio: `${ratioW}/${ratioH}`,
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
                      <span className="mt-4 text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>{processing.progress || 'Neural Rendering...'}</span>
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
                        <Box size={32} className="text-slate-300" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Hasil</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              {resultImage && !processing.isProcessing && (
                <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] mx-auto mt-8">
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center justify-center py-4 bg-white border-2 border-slate-100 rounded-2xl transition-all hover:border-slate-200"
                    style={{ color: primaryColor }}
                    title="Preview"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => setIsCropping(true)}
                    className="flex items-center justify-center py-4 bg-white border-2 border-slate-100 rounded-2xl transition-all hover:border-slate-200"
                    style={{ color: primaryColor }}
                    title="Crop"
                  >
                    <Scissors size={20} />
                  </button>
                  <button
                    onClick={handleSharpen}
                    className="flex items-center justify-center py-4 bg-white border-2 border-slate-100 rounded-2xl transition-all hover:border-slate-200"
                    style={{ color: primaryColor }}
                    title="Tajamkan"
                  >
                    <Zap size={20} />
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resultImage === originalImage}
                    className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                      resultImage === originalImage ? 'opacity-30 border-slate-50 cursor-not-allowed' : 'border-slate-100 hover:border-slate-200'
                    }`}
                    style={{ color: primaryColor }}
                    title="Reset"
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button
                    onClick={downloadResult}
                    className="flex items-center justify-center py-4 text-white rounded-2xl transition-all shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {processing.error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`${processing.error === 'AKSES_DITOLAK' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-600'} border-2 p-5 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest flex flex-col gap-3`}
              >
                {processing.error === 'AKSES_DITOLAK' ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <span>Google Meminta Aktivasi</span>
                    </div>
                    <p className="text-[8px] normal-case font-bold text-amber-800 leading-relaxed">
                      Untuk menggunakan mesin 3.x, Google mewajibkan aktivasi kuota gratis. Klik tombol di bawah (Gratis & Tanpa Input Key).
                    </p>
                    <button 
                      onClick={async () => {
                        try {
                          await (window as any).aistudio.openSelectKey();
                          setProcessing({ ...processing, error: null });
                        } catch(e) {}
                      }}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-200"
                    >
                      Aktifkan Kuota Gratis Sekarang
                    </button>
                  </>
                ) : (
                  processing.error
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && resultImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center" 
              onClick={e => e.stopPropagation()}
            >
              <img src={resultImage} className="max-w-full max-h-[90vh] rounded-[32px] shadow-2xl border border-white/10 object-contain" alt="Full Preview" />
              <button 
                className="absolute -top-4 -right-4 lg:top-0 lg:-right-12 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
                onClick={() => setIsPreviewOpen(false)}
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
        {isCropping && resultImage && (
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
                image={resultImage}
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

export default Guber3DRender;
