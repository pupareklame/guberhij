
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Download, RefreshCw, Sparkles, Image as ImageIcon, Eye, X, Check, Layers, Zap, Layout, User, Box, Anchor, Table, Maximize2, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { extractHijab, HijabOption, upscaleImage } from '../services/ekstrakhijab';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberEkstrakHijab: React.FC = () => {
  const { primaryColor } = useTheme();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<HijabOption>('LANTAI');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('3:4');

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

  const options: { id: HijabOption; label: string; icon: any }[] = [
    { id: 'LANTAI', label: 'Lantai Estetik', icon: Layout },
    { id: 'MANEKIN', label: 'Manekin', icon: User },
    { id: 'FLAT_LAY', label: 'Flat Lay', icon: Box },
    { id: 'HANGER', label: 'Gantungan', icon: Anchor },
    { id: 'TABLE_TOP', label: 'Meja', icon: Table },
  ];

  const handleImageUpload = (base64: string) => {
    setOriginalImage(base64);
    setResultImage(null);
  };

  const handleExtract = async () => {
    if (!originalImage) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Mengekstrak hijab...' });
    try {
      const result = await extractHijab(originalImage, selectedOption, additionalPrompt, aspectRatio);
      setResultImage(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: e.message || 'Gagal mengekstrak hijab.', progress: '' });
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
      setProcessing({ isProcessing: false, error: err.message || "Gagal menajamkan foto.", progress: '' });
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

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `ekstrak-hijab-${Date.now()}.png`;
    link.click();
  };

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
                <Scissors size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">EKSTRAK HIJAB AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Hijab Extraction Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> 1. Foto Hijab
                </label>
                <ImageUploader
                  label="Pilih Foto Hijab"
                  image={originalImage}
                  onImageSelect={handleImageUpload}
                  onClear={() => setOriginalImage(null)}
                  aspectRatio="3-4"
                  labelInside
                />
              </div>

              {/* Option Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-slate-300" /> 2. Opsi Tampilan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.id)}
                      className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                        selectedOption === opt.id 
                          ? 'bg-slate-50' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                      style={{ borderColor: selectedOption === opt.id ? primaryColor : undefined }}
                    >
                      <opt.icon 
                        size={20} 
                        style={{ color: selectedOption === opt.id ? primaryColor : undefined }}
                        className="group-hover:scale-110 transition-transform"
                      />
                      <span className={`text-[9px] font-black uppercase tracking-widest text-center ${selectedOption === opt.id ? '' : 'opacity-60'}`}
                        style={{ color: selectedOption === opt.id ? primaryColor : undefined }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Prompt */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-slate-300" /> 3. Instruksi Tambahan (Opsional)
                </label>
                <textarea
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  placeholder="Contoh: Tambahkan bunga di samping hijab..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-slate-300 outline-none min-h-[100px] resize-none transition-all"
                />
              </div>

              {/* Aspect Ratio Selection */}
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

              {/* Action Button */}
              <button
                onClick={handleExtract}
                disabled={processing.isProcessing || !originalImage}
                className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${
                  processing.isProcessing || !originalImage ? 'bg-slate-300 opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
                style={{ backgroundColor: !processing.isProcessing && originalImage ? primaryColor : undefined }}
              >
                {processing.isProcessing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{processing.progress}</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>EKSTRAK SEKARANG</span>
                  </>
                )}
              </button>

              {processing.error && (
                <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest text-center">
                  {processing.error}
                </div>
              )}
            </div>

            {/* Result Column */}
            <div className="mt-12 lg:mt-0 space-y-4 lg:sticky lg:top-8 self-start">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Eye size={14} className="text-slate-300" /> Hasil Ekstraksi
                </label>
                
                <div className="flex flex-col items-center w-full">
                  <div 
                    className={`w-full max-w-[280px] lg:max-w-full bg-slate-50/50 rounded-[40px] overflow-hidden relative group transition-all duration-500 ${
                      !resultImage ? 'border-2 border-dashed' : 'border-4 border-white'
                    }`}
                    style={{ 
                      aspectRatio: aspectRatio.replace(':', '/'),
                      borderColor: resultImage ? 'white' : `${primaryColor}40`,
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
                          <span className="mt-4 text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>{processing.progress || 'Mengekstrak...'}</span>
                        </motion.div>
                      ) : resultImage ? (
                        <motion.div
                          key="result"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full h-full relative"
                        >
                          <img 
                            src={resultImage} 
                            alt="Hasil" 
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center relative">
                          <div className="relative flex flex-col items-center gap-6">
                            <img 
                              src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
                              className="w-24 h-24 object-contain opacity-20 select-none pointer-events-none" 
                              alt="Logo Guber" 
                            />
                            <div className="space-y-1">
                              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">HASIL DISINI</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] lg:max-w-full mx-auto mt-8">
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
                      onClick={handleReset}
                      disabled={!resultImage || processing.isProcessing || resultImage === initialResultImage}
                      className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                        !resultImage || processing.isProcessing || resultImage === initialResultImage
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
          </div>
        </div>
      </div>

      {/* Fullscreen Preview */}
      <AnimatePresence>
        {showPreview && resultImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
          >
            <button 
              onClick={() => setShowPreview(false)}
              className="absolute top-8 right-8 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <X size={24} />
            </button>
            <img 
              src={resultImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
            <div className="absolute bottom-8 flex gap-4">
              <button
                onClick={downloadResult}
                className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
              >
                <Download size={18} /> Simpan Foto
              </button>
            </div>
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
                aspect={aspectRatio.split(':').map(Number)[0] / aspectRatio.split(':').map(Number)[1]}
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

export default GuberEkstrakHijab;
