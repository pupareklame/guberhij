
/**
 * [INTEGRITY-CHECK]: 0x656B737472616B62616A75
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Download, RefreshCw, Sparkles, Image as ImageIcon, Zap, X, Check, Shirt, Layers } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { extractClothing, upscaleImage } from '../services/ekstrakbaju';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberEkstrak: React.FC = () => {
  const { primaryColor } = useTheme();
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [topResult, setTopResult] = useState<string | null>(null);
  const [bottomResult, setBottomResult] = useState<string | null>(null);
  const [fullResult, setFullResult] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  const [processingTop, setProcessingTop] = useState<ProcessingState>({ isProcessing: false, error: null, progress: '', });
  const [processingBottom, setProcessingBottom] = useState<ProcessingState>({ isProcessing: false, error: null, progress: '', });
  const [processingFull, setProcessingFull] = useState<ProcessingState>({ isProcessing: false, error: null, progress: '', });

  // Crop States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropTarget, setCropTarget] = useState<'TOP' | 'BOTTOM' | 'FULL' | null>(null);

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const handleExtract = async (type: 'TOP' | 'BOTTOM' | 'FULL') => {
    if (!modelImage) return;
    
    const setProc = type === 'TOP' ? setProcessingTop : type === 'BOTTOM' ? setProcessingBottom : setProcessingFull;
    const setResult = type === 'TOP' ? setTopResult : type === 'BOTTOM' ? setBottomResult : setFullResult;
    
    setProc({ 
      isProcessing: true, 
      error: null, 
      progress: type === 'TOP' ? 'Membedah Serat Atasan...' : type === 'BOTTOM' ? 'Memetakan Batas Bawahan...' : 'Mengekstrak Jubah/Gamis...'
    });
    
    try {
      const result = await extractClothing(modelImage, type, aspectRatio);
      setResult(result);
      setProc({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) { 
      setProc({ isProcessing: false, error: err.message || "Gagal ekstraksi.", progress: '' }); 
    }
  };

  const handleDownload = (img: string, label: string) => {
    const link = document.createElement('a'); 
    link.href = img; 
    link.download = `ekstrak-${label}-${Date.now()}.png`; 
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
    const resultImage = cropTarget === 'TOP' ? topResult : cropTarget === 'BOTTOM' ? bottomResult : fullResult;
    const setResult = cropTarget === 'TOP' ? setTopResult : cropTarget === 'BOTTOM' ? setBottomResult : setFullResult;
    
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

      setResult(canvas.toDataURL('image/png'));
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      setIsCropping(false);
    }
  };

  const handleSharpen = async (type: 'TOP' | 'BOTTOM' | 'FULL') => {
    const resultImage = type === 'TOP' ? topResult : type === 'BOTTOM' ? bottomResult : fullResult;
    const setResult = type === 'TOP' ? setTopResult : type === 'BOTTOM' ? setBottomResult : setFullResult;
    const setProc = type === 'TOP' ? setProcessingTop : type === 'BOTTOM' ? setProcessingBottom : setProcessingFull;

    if (!resultImage) return;
    setProc({ isProcessing: true, error: null, progress: 'Upscaling Image...' });
    
    try {
      const sharpenedImage = await upscaleImage(resultImage, aspectRatio);
      setResult(sharpenedImage);
      setProc({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      console.error(e);
      setProc({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Ekstrak Baju AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Asset Extractor Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Model Upload */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 1. Foto Model Sumber
            </label>
            <ImageUploader 
              label="Unggah Model" 
              image={modelImage} 
              onImageSelect={(img) => {
                setModelImage(img);
                setTopResult(null);
                setBottomResult(null);
              }} 
              aspectRatio="9-16" 
              labelInside
            />
          </div>

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

          {/* Extraction Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <button
              onClick={() => handleExtract('TOP')}
              disabled={processingTop.isProcessing || !modelImage}
              className="disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ backgroundColor: processingTop.isProcessing || !modelImage ? undefined : primaryColor }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processingTop.isProcessing ? (
                <span className="relative z-10">PROSES...</span>
              ) : (
                <span className="text-[8px] relative z-10">EKSTRAK ATASAN</span>
              )}
            </button>
            <button
              onClick={() => handleExtract('FULL')}
              disabled={processingFull.isProcessing || !modelImage}
              className="disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ backgroundColor: processingFull.isProcessing || !modelImage ? undefined : '#5A5A40' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processingFull.isProcessing ? (
                <span className="relative z-10">PROSES...</span>
              ) : (
                <span className="text-[8px] relative z-10">EKSTRAK FULL</span>
              )}
            </button>
            <button
              onClick={() => handleExtract('BOTTOM')}
              disabled={processingBottom.isProcessing || !modelImage}
              className="disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ backgroundColor: processingBottom.isProcessing || !modelImage ? undefined : 'black' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processingBottom.isProcessing ? (
                <span className="relative z-10">PROSES...</span>
              ) : (
                <span className="text-[8px] relative z-10">EKSTRAK BAWAHAN</span>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-8 pt-6 border-t border-slate-100">
            {/* Full Result (Gamis/Jubah) */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                Hasil Full (Gamis / Jubah)
              </label>
              <div className="aspect-[3/4] w-full max-w-[320px] mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500"
                style={{ borderColor: fullResult ? 'white' : `#5A5A4040` }}
              >
                <AnimatePresence mode="wait">
                  {processingFull.isProcessing ? (
                    <motion.div key="loading-full" className="absolute inset-0 flex items-center justify-center z-30">
                      <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                    </motion.div>
                  ) : fullResult ? (
                    <motion.img key="result-full" src={fullResult} className="w-full h-full object-contain p-4" alt="Full Result" />
                  ) : (
                    <div className="opacity-20 flex flex-col items-center">
                      <Shirt size={60} className="text-slate-400 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ready</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-[320px] mx-auto">
                <button onClick={() => { setCropTarget('FULL'); setIsCropping(true); }} disabled={!fullResult} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Scissors size={20} /></button>
                <button onClick={() => handleSharpen('FULL')} disabled={!fullResult} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Zap size={20} /></button>
                <button onClick={() => handleDownload(fullResult!, 'full')} disabled={!fullResult} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Download size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Top Result */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                Hasil Atasan
              </label>
              <div className="aspect-square w-full bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500"
                style={{ borderColor: topResult ? 'white' : `${primaryColor}40` }}
              >
                <AnimatePresence mode="wait">
                  {processingTop.isProcessing ? (
                    <motion.div key="loading-top" className="absolute inset-0 flex items-center justify-center z-30">
                      <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-12 h-12 object-contain animate-spin" alt="Logo" />
                    </motion.div>
                  ) : topResult ? (
                    <motion.img key="result-top" src={topResult} className="w-full h-full object-contain p-4" alt="Top Result" />
                  ) : (
                    <div className="opacity-20 flex flex-col items-center">
                      <Shirt size={40} className="text-slate-400 mb-2" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Ready</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { setCropTarget('TOP'); setIsCropping(true); }} disabled={!topResult} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Scissors size={16} /></button>
                <button onClick={() => handleSharpen('TOP')} disabled={!topResult} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Zap size={16} /></button>
                <button onClick={() => handleDownload(topResult!, 'atasan')} disabled={!topResult} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Download size={16} /></button>
              </div>
            </div>

            {/* Bottom Result */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                Hasil Bawahan
              </label>
              <div className="aspect-square w-full bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500"
                style={{ borderColor: bottomResult ? 'white' : `black` }}
              >
                <AnimatePresence mode="wait">
                  {processingBottom.isProcessing ? (
                    <motion.div key="loading-bottom" className="absolute inset-0 flex items-center justify-center z-30">
                      <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-12 h-12 object-contain animate-spin" alt="Logo" />
                    </motion.div>
                  ) : bottomResult ? (
                    <motion.img key="result-bottom" src={bottomResult} className="w-full h-full object-contain p-4" alt="Bottom Result" />
                  ) : (
                    <div className="opacity-20 flex flex-col items-center">
                      <Layers size={40} className="text-slate-400 mb-2" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Ready</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { setCropTarget('BOTTOM'); setIsCropping(true); }} disabled={!bottomResult} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Scissors size={16} /></button>
                <button onClick={() => handleSharpen('BOTTOM')} disabled={!bottomResult} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Zap size={16} /></button>
                <button onClick={() => handleDownload(bottomResult!, 'bawahan')} disabled={!bottomResult} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 flex items-center justify-center"><Download size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
          <AnimatePresence>
            {(processingTop.error || processingBottom.error || processingFull.error) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest"
              >
                {processingTop.error || processingBottom.error || processingFull.error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropping && (cropTarget === 'TOP' ? topResult : cropTarget === 'BOTTOM' ? bottomResult : fullResult) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Ekstraksi</h2>
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
                image={cropTarget === 'TOP' ? topResult! : cropTarget === 'BOTTOM' ? bottomResult! : fullResult!}
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

export default GuberEkstrak;
