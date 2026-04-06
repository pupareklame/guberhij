
/**
 * [INTEGRITY-CHECK]: 0x72757461696E696D
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Download, RefreshCw, Sparkles, Image as ImageIcon, ShieldCheck, Info, Eye, Scissors, Zap, X, Check, Lock, ShieldAlert } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { createMiniature, createGroupMiniature, analyzePoseFromImage } from '../services/miniatur';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberMiniatur: React.FC = () => {
  const { primaryColor } = useTheme();
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [poseDescription, setPoseDescription] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [pose, setPose] = useState('standing');
  const [headType, setHeadType] = useState<'large' | 'normal'>('large');
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

  const [isAnalyzingPose, setIsAnalyzingPose] = useState(false);

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const poses = [
    { id: 'standing', label: 'Berdiri', icon: '🧍' },
    { id: 'sitting', label: 'Duduk Kursi', icon: '🪑' },
    { id: 'motorcycle', label: 'Naik Motor', icon: '🏍️' },
    { id: 'sleeping', label: 'Tidur', icon: '😴' },
    { id: 'dancing', label: 'Menari', icon: '💃' },
  ];

  const handleGenerate = async () => {
    if (!personImage) {
      setProcessing(prev => ({ ...prev, error: "Unggah foto terlebih dahulu." }));
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: activeTab === 'preset' ? 'Neural Scale Reduction...' : 'Replicating Pose & Group...' });
    setResultImage(null);

    try {
      let result;
      if (activeTab === 'preset') {
        result = await createMiniature(personImage, aspectRatio, pose, headType, 'rutainim');
      } else {
        result = await createGroupMiniature(personImage, aspectRatio, poseDescription, headType, 'rutainim');
      }
      setResultImage(result);
      setOriginalResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memproses miniatur.", progress: '' });
    }
  };

  const handleReset = () => {
    setPersonImage(null);
    setPoseDescription('');
    setResultImage(null);
    setOriginalResultImage(null);
    setSliderPos(50);
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleResetResult = () => {
    if (originalResultImage) {
      setResultImage(originalResultImage);
    }
  };

  const handleAnalyzePose = async () => {
    if (!personImage) {
      setProcessing(prev => ({ ...prev, error: "Unggah foto terlebih dahulu untuk menganalisis pose." }));
      return;
    }

    setIsAnalyzingPose(true);
    try {
      const enhancedPose = await analyzePoseFromImage(personImage, poseDescription);
      setPoseDescription(enhancedPose);
    } catch (err: any) {
      setProcessing(prev => ({ ...prev, error: err.message || "Gagal menganalisis pose." }));
    } finally {
      setIsAnalyzingPose(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `miniature-${Date.now()}.png`;
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

      setResultImage(canvas.toDataURL('image/png'));
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      setIsCropping(false);
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar.', progress: '' });
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling Image...' });
    
    try {
      const sharpenedImage = await upscaleImage(resultImage, 'ULTRA_HD');
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      console.error(e);
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100">
        {/* Header - Rounded like fotofashion */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">MINIATUR AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">objek jadi mini di tangan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => { setActiveTab('preset'); handleReset(); }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'preset' ? 'bg-white shadow-sm' : 'text-slate-400'
              }`}
              style={{ color: activeTab === 'preset' ? primaryColor : undefined }}
            >
              Sendiri
            </button>
            <button
              onClick={() => { setActiveTab('custom'); handleReset(); }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'custom' ? 'bg-white shadow-sm' : 'text-slate-400'
              }`}
              style={{ color: activeTab === 'custom' ? primaryColor : undefined }}
            >
              Sesuai Unggahan
            </button>
          </div>

          {/* Person Upload */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-slate-300" /> 1. Unggah {activeTab === 'preset' ? 'Karakter' : 'Foto Grup/Pose'}
            </label>
            <ImageUploader 
              label={activeTab === 'preset' ? "Pilih Karakter" : "Pilih Foto Grup"} 
              image={personImage} 
              onImageSelect={(img) => { setPersonImage(img); setResultImage(null); }} 
              aspectRatio="9-16" 
              labelInside
            />
            {activeTab === 'custom' && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[8px] font-bold text-blue-600 leading-tight uppercase tracking-wider">
                  Sistem akan mendeteksi jumlah orang secara otomatis. Pastikan foto jelas agar jumlah orang tetap sama (tidak bertambah/berkurang).
                </p>
              </div>
            )}
          </div>

          {/* Pose Selection - Only for Preset Tab */}
          {activeTab === 'preset' ? (
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw size={14} className="text-slate-300" /> 2. Pose Miniatur
              </label>
              <div className="grid grid-cols-5 gap-2">
                {poses.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPose(p.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-300 min-h-[70px] ${
                      pose === p.id 
                        ? 'scale-105' 
                        : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                    }`}
                    style={{
                      backgroundColor: pose === p.id ? primaryColor : undefined,
                      color: pose === p.id ? 'white' : undefined,
                      borderColor: pose === p.id ? primaryColor : undefined,
                    }}
                  >
                    <span className="text-xl mb-1">{p.icon}</span>
                    <span className={`text-[7px] font-black uppercase tracking-tight text-center leading-tight ${pose === p.id ? 'text-white' : 'text-slate-500'}`}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw size={14} className="text-slate-300" /> 2. Keterangan Pose
                </label>
                <button
                  onClick={handleAnalyzePose}
                  disabled={isAnalyzingPose || !personImage}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    isAnalyzingPose 
                      ? 'bg-slate-100 text-slate-400' 
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isAnalyzingPose ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {isAnalyzingPose ? 'Menganalisis...' : 'AI Pose'}
                </button>
              </div>
              <textarea
                value={poseDescription}
                onChange={(e) => setPoseDescription(e.target.value)}
                placeholder="Contoh: Sedang berpelukan, bergandengan tangan, atau pose spesifik lainnya..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[10px] font-bold outline-none min-h-[80px] resize-none transition-all focus:bg-white focus:border-slate-200"
              />
            </div>
          )}

          {/* Head Size Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-slate-300" /> 3. Ukuran Kepala
            </label>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setHeadType('large')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  headType === 'large' ? 'bg-white shadow-sm' : 'text-slate-400'
                }`}
                style={{ color: headType === 'large' ? primaryColor : undefined }}
              >
                Karikatur (Ekstrem)
              </button>
              <button
                onClick={() => setHeadType('normal')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  headType === 'normal' ? 'bg-white shadow-sm' : 'text-slate-400'
                }`}
                style={{ color: headType === 'normal' ? primaryColor : undefined }}
              >
                Normal (Besar)
              </button>
            </div>
            <div className="flex items-start gap-2 p-2 bg-rose-50 rounded-xl border border-rose-100">
              <ShieldAlert size={12} className="text-rose-500 mt-0.5 shrink-0" />
              <p className="text-[7px] font-bold text-rose-600 leading-tight uppercase tracking-wider">
                MANDATORY: Kepala harus besar. Jika hasil kepala tidak besar, silakan klik proses ulang.
              </p>
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 4. Pilih Aspek Rasio
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

          <div className="">
            <button
              onClick={handleGenerate}
              disabled={processing.isProcessing || !personImage}
              className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ 
                backgroundColor: processing.isProcessing || !personImage ? undefined : primaryColor,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processing.isProcessing ? (
                <span className="relative z-10">SEDANG PROSES...</span>
              ) : (
                <span className="text-lg relative z-10">BUAT MINIATUR</span>
              )}
            </button>
          </div>

          {/* Result Section - Exactly like ImageUploader */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Miniatur
              </label>
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
                    {/* Before/After Slider inside the box */}
                    <img src={personImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
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

            {/* Action Buttons - Icon Only */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Miniatur</h2>
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
  );
};

export default GuberMiniatur;
