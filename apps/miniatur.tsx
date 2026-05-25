
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
  const [cameraAngle, setCameraAngle] = useState('high_distortion');
  const [useFinger, setUseFinger] = useState(false);
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
  
  const cameraAngles = [
    { id: 'high_distortion', label: 'Distorsi Tinggi', icon: '📐', desc: 'Kepala Raksasa' },
    { id: 'gulliver', label: 'Gulliver', icon: '🗼', desc: 'Sudut Rendah' },
    { id: 'isometric', label: 'Isometrik', icon: '🧊', desc: 'Diorama' },
    { id: 'profile', label: 'Profil', icon: '👤', desc: 'Samping' },
    { id: 'finger_pov', label: 'POV Jari', icon: '☝️', desc: 'Fisheye' },
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
        result = await createMiniature(personImage, aspectRatio, pose, useFinger, cameraAngle, 'rutainim');
      } else {
        result = await createGroupMiniature(personImage, aspectRatio, poseDescription, useFinger, cameraAngle, 'rutainim');
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
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">MINIATUR AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">objek jadi mini di tangan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            {/* Column 1: Character & Mode */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              {/* Tabs */}
              <div className="shrink-0 flex bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => { setActiveTab('preset'); handleReset(); }}
                  className={`flex-1 py-3 lg:py-1.5 rounded-xl text-[10px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'preset' ? 'bg-white shadow-sm' : 'text-slate-400'
                  }`}
                  style={{ color: activeTab === 'preset' ? primaryColor : undefined }}
                >
                  Sendiri
                </button>
                <button
                  onClick={() => { setActiveTab('custom'); handleReset(); }}
                  className={`flex-1 py-3 lg:py-1.5 rounded-xl text-[10px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'custom' ? 'bg-white shadow-sm' : 'text-slate-400'
                  }`}
                  style={{ color: activeTab === 'custom' ? primaryColor : undefined }}
                >
                  Grup
                </button>
              </div>

              {/* Person Upload */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <User size={14} className="text-slate-300" /> 1. Unggah {activeTab === 'preset' ? 'Karakter' : 'Foto Grup'}
                </label>
                <div className="lg:flex-1 min-h-0">
                  <ImageUploader 
                    label={activeTab === 'preset' ? "Pilih Karakter" : "Pilih Foto Grup"} 
                    image={personImage} 
                    onImageSelect={(img) => { setPersonImage(img); setResultImage(null); }} 
                    aspectRatio="9-16" 
                    labelInside
                  />
                </div>
                {activeTab === 'custom' && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 rounded-xl border border-blue-100">
                    <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[7px] font-bold text-blue-600 leading-tight uppercase tracking-wider">
                      Sistem akan mendeteksi jumlah orang secara otomatis.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Settings */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
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
                          className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-300 min-h-[60px] ${
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
                          <span className="text-lg mb-1">{p.icon}</span>
                          <span className={`text-[6px] font-black uppercase tracking-tight text-center leading-tight ${pose === p.id ? 'text-white' : 'text-slate-500'}`}>
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
                        {isAnalyzingPose ? 'AI' : 'AI Pose'}
                      </button>
                    </div>
                    <textarea
                      value={poseDescription}
                      onChange={(e) => setPoseDescription(e.target.value)}
                      placeholder="Contoh: Sedang berpelukan..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-[10px] font-bold outline-none min-h-[80px] resize-none transition-all focus:bg-white focus:border-slate-200"
                    />
                  </div>
                )}

                {/* Camera Angle Selection */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> 3. Sudut Kamera
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {cameraAngles.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setCameraAngle(a.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-300 min-h-[60px] ${
                          cameraAngle === a.id 
                            ? 'scale-105' 
                            : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                        }`}
                        style={{
                          backgroundColor: cameraAngle === a.id ? primaryColor : undefined,
                          color: cameraAngle === a.id ? 'white' : undefined,
                          borderColor: cameraAngle === a.id ? primaryColor : undefined,
                        }}
                      >
                        <span className="text-lg mb-1">{a.icon}</span>
                        <span className={`text-[6px] font-black uppercase tracking-tight text-center leading-tight ${cameraAngle === a.id ? 'text-white' : 'text-slate-500'}`}>
                          {a.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interaction Selection */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-slate-300" /> 4. Interaksi Jari
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button
                      onClick={() => setUseFinger(false)}
                      className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        !useFinger ? 'bg-white shadow-sm' : 'text-slate-400'
                      }`}
                      style={{ color: !useFinger ? primaryColor : undefined }}
                    >
                      Tanpa Jari
                    </button>
                    <button
                      onClick={() => setUseFinger(true)}
                      className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        useFinger ? 'bg-white shadow-sm' : 'text-slate-400'
                      }`}
                      style={{ color: useFinger ? primaryColor : undefined }}
                    >
                      Pakai Jari
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Generate Button */}
              <div className="lg:hidden pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !personImage}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !personImage) ? '#cbd5e1' : primaryColor 
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
                          <img src={personImage!} alt="Original" className="w-full h-full object-cover" />
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
                          Miniatur
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
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !personImage}
                  title="Generate"
                  className="hidden lg:flex order-5 lg:order-first col-span-1 lg:col-span-2 py-4 rounded-2xl border-2 text-white items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !personImage) ? '#cbd5e1' : primaryColor, 
                    borderColor: (processing.isProcessing || !personImage) ? '#cbd5e1' : primaryColor 
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
                  onClick={handleResetResult}
                  disabled={processing.isProcessing || !resultImage || resultImage === originalResultImage}
                  title="Reset"
                  className="order-4 lg:order-5 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <RefreshCw size={20} />
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
