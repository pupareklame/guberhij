
/**
 * [INTEGRITY-CHECK]: 0x63726f70
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Download, RefreshCw, Image as ImageIcon, Zap, X, Check, RotateCw, ZoomIn, Eye } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { upscaleImage } from '../services/crop';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberCrop: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('3:4');
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isCropping, setIsCropping] = useState(false);

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

  const handleGenerate = async () => {
    if (!sourceImage || !croppedAreaPixels) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Cropping Image...' });
    try {
      const image = await createImage(sourceImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setProcessing({ isProcessing: false, error: "Gagal memproses canvas.", progress: '' });
        return;
      }
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      const result = canvas.toDataURL('image/png');
      setResultImage(result);
      setOriginalResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) { 
      console.error(e);
      setProcessing({ isProcessing: false, error: e.message || "Gagal memotong foto.", progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `crop-foto-${Date.now()}.png`;
    link.click();
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Sharpening & Enhancing Details...' });
    try {
      const sharpenedImage = await upscaleImage(resultImage, aspectRatio);
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      console.error(e);
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  const handleResetResult = () => {
    setResultImage(originalResultImage);
  };

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
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      setResultImage(canvas.toDataURL('image/png'));
      setIsCropping(false);
    } catch (e) { 
      console.error(e);
      setIsCropping(false);
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
                <Scissors size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Potong Foto AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Precision Studio Cropper</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Image Upload */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 1. Unggah Foto
            </label>
            <ImageUploader 
              label="Pilih Foto" 
              image={sourceImage} 
              onImageSelect={(img) => { setSourceImage(img); setResultImage(null); }} 
              aspectRatio="square" 
              labelInside 
            />
          </div>

          {sourceImage && !resultImage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Aspect Ratio Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> 2. Pilih Aspek Rasio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                        aspectRatio === r.value 
                          ? 'scale-105 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                      }`}
                      style={aspectRatio === r.value ? {
                        backgroundColor: primaryColor,
                        color: 'white',
                        borderColor: primaryColor,
                      } : {}}
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

              {/* Zoom Control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ZoomIn size={14} className="text-slate-300" /> 3. Zoom
                  </label>
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg" style={{ color: primaryColor, backgroundColor: `color-mix(in srgb, ${primaryColor}, white 90%)` }}>{zoom.toFixed(1)}x</span>
                </div>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-teal-600" style={{ accentColor: primaryColor }} />
              </div>

              {/* Rotation Control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <RotateCw size={14} className="text-slate-300" /> 4. Rotasi
                  </label>
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg" style={{ color: primaryColor, backgroundColor: `color-mix(in srgb, ${primaryColor}, white 90%)` }}>{rotation}°</span>
                </div>
                <input type="range" value={rotation} min={0} max={360} step={1} onChange={(e) => setRotation(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-teal-600" style={{ accentColor: primaryColor }} />
              </div>

              <div className="relative w-full aspect-[3/4] bg-slate-50 rounded-[32px] overflow-hidden border-2 border-slate-100">
                <Cropper
                  image={sourceImage}
                  crop={crop}
                  rotation={rotation}
                  zoom={zoom}
                  aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '3:4' ? 3/4 : aspectRatio === '4:3' ? 4/3 : aspectRatio === '9:16' ? 9/16 : 16/9}
                  onCropChange={setCrop}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: { background: '#f8fafc' },
                    cropAreaStyle: { border: `2px solid ${primaryColor}`, boxShadow: '0 0 0 9999px rgba(255,255,255,0.8)' }
                  }}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={processing.isProcessing || !sourceImage}
                className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
                style={{ backgroundColor: processing.isProcessing || !sourceImage ? undefined : primaryColor }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                {processing.isProcessing ? (
                  <span className="relative z-10">PROCESSING...</span>
                ) : (
                  <span className="text-lg relative z-10">POTONG FOTO</span>
                )}
              </button>
            </motion.div>
          )}

          {/* Result Section */}
          {resultImage && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Foto
                </label>
                <button onClick={() => setResultImage(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"><RefreshCw size={12} /> Edit Lagi</button>
              </div>
              
              <div 
                className={`w-full max-w-[280px] mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 ${
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
                    <motion.div key="loading" className="absolute inset-0 flex items-center justify-center z-30">
                      <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                    </motion.div>
                  ) : (
                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative select-none touch-none">
                      <img src={resultImage} className="absolute inset-0 w-full h-full object-cover" alt="Result" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-5 gap-2 max-w-[360px] mx-auto">
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
                  onClick={handleResetResult}
                  disabled={!resultImage || processing.isProcessing || resultImage === originalResultImage}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !resultImage || processing.isProcessing || resultImage === originalResultImage
                      ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                  style={{ color: primaryColor }}
                  title="Reset"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!resultImage || processing.isProcessing}
                  className={`flex items-center justify-center py-4 rounded-2xl transition-all shadow-lg shadow-current/20 ${
                    !resultImage || processing.isProcessing 
                      ? 'bg-slate-300 cursor-not-allowed' 
                      : 'hover:scale-105 active:scale-95'
                  }`}
                  style={{ backgroundColor: !resultImage || processing.isProcessing ? undefined : primaryColor, color: 'white' }}
                  title="Simpan"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {processing.error && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest">
                {processing.error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropping && resultImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Foto</h2>
              <div className="flex gap-3">
                <button onClick={() => setIsCropping(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Batal</button>
                <button onClick={handleCropSave} className="px-6 py-2 text-black rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2" style={{ backgroundColor: 'white' }}><Check size={14} /> Simpan Crop</button>
              </div>
            </div>
            <div className="flex-1 relative">
              <Cropper image={resultImage} crop={crop} zoom={zoom} aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '3:4' ? 3/4 : aspectRatio === '4:3' ? 4/3 : aspectRatio === '9:16' ? 9/16 : 16/9} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-8 bg-black/50 backdrop-blur-md flex flex-col items-center gap-4">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-[10px] font-black text-white/60 uppercase tracking-widest"><span>Zoom</span><span>{Math.round(zoom * 100)}%</span></div>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
};

export default GuberCrop;
