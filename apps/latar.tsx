
/**
 * [INTEGRITY-CHECK]: 0x726174616C
 * STATUS: PROTECTED-V1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Download, RefreshCw, Sparkles, Info, Crop, Map, Sun, Moon, Cloud, Camera, Mountain, X, Check, Scissors, Zap, Eye, ShieldAlert, Lock, User, Maximize, Users, Send, MapPin, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { changeBackground } from '../services/latar';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const BACKGROUND_PRESETS = [
  { id: 'LUX_OFFICE', name: 'Luxury Office', icon: <ImageIcon size={18} />, prompt: 'Inside a high-end luxury modern office, floor-to-ceiling glass windows, blurred evening city skyline, professional soft interior lighting, cinematic bokeh.' },
  { id: 'GOLDEN_BEACH', name: 'Sunset Beach', icon: <Sun size={18} />, prompt: 'At a breathtaking tropical beach during golden hour sunset, warm orange sunlight, calm waves, palm trees in the distance, high-end travel photography style.' },
  { id: 'CYBER_STREET', name: 'Cyberpunk City', icon: <Moon size={18} />, prompt: 'On a rainy neon-lit street in a futuristic city, vibrant pink and blue reflections on wet asphalt, cinematic depth of field, hazy atmosphere.' },
  { id: 'ALPS_VISTA', name: 'Alpine Peaks', icon: <Mountain size={18} />, prompt: 'Standing on a wooden balcony overlooking the Swiss Alps, snow-capped mountains, crisp morning daylight, clear blue sky, majestic atmosphere.' },
  { id: 'MINIMAL_STUDIO', name: 'Soft Studio', icon: <Camera size={18} />, prompt: 'In a professional minimalist photo studio, clean neutral gray textured wall, high-end soft-box lighting, elegant fashion catalog vibe.' },
  { id: 'COZY_CAFE', name: 'Aesthetic Cafe', icon: <Cloud size={18} />, prompt: 'Inside a warm industrial-style cafe, hanging edison bulbs, wooden textures, blurred coffee machine background, cozy morning vibes.' },
  { id: 'FOREST_MIST', name: 'Mystic Forest', icon: <Cloud size={18} />, prompt: 'Deep inside a mystical pine forest, heavy morning mist, sun rays filtering through trees (god rays), moody and atmospheric.' },
  { id: 'SPACE_STATION', name: 'Space Station', icon: <Zap size={18} />, prompt: 'Inside a high-tech space station, circular windows showing Earth from orbit, clean white surfaces, futuristic blue lighting.' },
  { id: 'DESERT_DUNES', name: 'Golden Desert', icon: <Sun size={18} />, prompt: 'In a vast golden desert with rolling sand dunes, clear blue sky, harsh midday sun, cinematic wide shot.' },
];

const LIGHTING_MOODS = [
  { id: 'NATURAL', name: 'Natural', prompt: 'Natural daylight, soft shadows.' },
  { id: 'DRAMATIC', name: 'Dramatic', prompt: 'High contrast, dramatic shadows, moody lighting.' },
  { id: 'GOLDEN', name: 'Golden Hour', prompt: 'Warm golden hour lighting, soft orange glow.' },
  { id: 'STUDIO', name: 'Studio Soft', prompt: 'Professional studio lighting, soft-box effect.' },
  { id: 'NEON', name: 'Neon Glow', prompt: 'Vibrant neon lighting, colorful reflections.' },
];

const GuberLatar: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [prompt, setPrompt] = useState<string>('');
  const [selectedLighting, setSelectedLighting] = useState(LIGHTING_MOODS[0].id);
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

  const handleGenerate = async () => {
    if (!sourceImage) {
      setProcessing({ isProcessing: false, error: "Harap unggah foto subjek terlebih dahulu.", progress: '' });
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Neural Background Synthesis...' });
    setResultImage(null);

    try {
      const lightingPrompt = LIGHTING_MOODS.find(m => m.id === selectedLighting)?.prompt || '';
      const finalPrompt = `
        [BACKGROUND_DIRECTIVE]: ${prompt || 'Professional studio background'}
        [LIGHTING_MOOD]: ${lightingPrompt}
        [ENVIRONMENT_RULES]: Cinematic lighting, professional blending, 8K resolution, realistic shadows.
      `;

      const result = await changeBackground(sourceImage, finalPrompt, aspectRatio);
      setResultImage(result);
      setOriginalResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal mengubah latar belakang.", progress: '' });
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!resultImage || !croppedAreaPixels) return;
    try {
      const image = new Image();
      image.src = resultImage;
      await new Promise((resolve) => (image.onload = resolve));

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

  const handleReset = () => {
    setSourceImage(null);
    setResultImage(null);
    setOriginalResultImage(null);
    setSliderPos(50);
    setPrompt('');
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Enhancing Details...' });
    try {
      const upscaled = await upscaleImage(resultImage, 'ULTRA_HD');
      setResultImage(upscaled);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal menajamkan gambar.", progress: '' });
    }
  };

  const handleResetResult = () => {
    setResultImage(originalResultImage);
    setSliderPos(50);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `latar-${Date.now()}.png`;
    link.click();
  };

  if (false) {
    return null;
  }

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto lg:overflow-hidden custom-scrollbar">
      <div className="max-w-2xl lg:max-w-7xl mx-auto min-h-full lg:h-screen bg-white flex flex-col border-x border-slate-100 shadow-sm">
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">GANTI LATAR AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Bersihkan & Ganti Latar Belakang</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 lg:flex-1 lg:overflow-hidden">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:h-full lg:overflow-hidden">
            {/* Column 1: Config (Desktop) */}
            <div className="lg:col-span-4 space-y-6 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar">
            {/* Source Image Upload */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-slate-300" /> 1. Foto Subjek
              </label>
              <ImageUploader
                label="Pilih Foto"
                image={sourceImage}
                onImageSelect={(img) => { setSourceImage(img); setResultImage(null); }}
                onClear={() => { setSourceImage(null); setResultImage(null); }}
                aspectRatio="9-16"
                labelInside
              />
            </div>

            {/* Background Presets */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-slate-300" /> 2. Preset Latar
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {BACKGROUND_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPrompt(p.prompt)}
                    className={`flex flex-col items-center justify-center p-4 rounded-[24px] border-2 transition-all duration-300 gap-2 group ${
                      prompt === p.prompt 
                        ? 'scale-105 shadow-md' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                    }`}
                    style={prompt === p.prompt ? { 
                      backgroundColor: primaryColor,
                      borderColor: primaryColor,
                      color: 'white'
                    } : {}}
                  >
                    <div className={`transition-transform group-hover:scale-110 ${prompt === p.prompt ? 'text-white' : 'text-slate-400'}`}>
                      {p.icon}
                    </div>
                    <span className="text-[8px] font-black uppercase text-center leading-tight tracking-tight">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-slate-300" /> 3. Deskripsi Latar
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Contoh: Di puncak gunung bersalju, cahaya pagi yang dingin..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-5 text-[12px] font-semibold outline-none h-32 resize-none transition-all placeholder:text-slate-300 focus:bg-white focus:border-slate-200"
                  style={{ borderColor: prompt ? primaryColor : undefined }}
                />
                <div className="absolute bottom-4 right-4 opacity-20">
                  <Camera size={20} style={{ color: primaryColor }} />
                </div>
              </div>
            </div>

            {/* Lighting Moods */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sun size={14} className="text-slate-300" /> 4. Mood Pencahayaan
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {LIGHTING_MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedLighting(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                      selectedLighting === m.id 
                        ? 'scale-105 shadow-md' 
                        : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                    }`}
                    style={selectedLighting === m.id ? { 
                      backgroundColor: primaryColor,
                      borderColor: primaryColor,
                      color: 'white'
                    } : {}}
                  >
                    <span className="text-[7px] font-black uppercase text-center leading-tight tracking-tight">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Maximize size={14} className="text-slate-300" /> 5. Pilih Aspek Rasio
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
                disabled={processing.isProcessing || !sourceImage || !prompt}
                className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
                style={{ 
                  backgroundColor: processing.isProcessing || !sourceImage || !prompt ? undefined : primaryColor,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                {processing.isProcessing ? (
                  <span className="relative z-10">MEMBERSIHKAN & MENGGANTI...</span>
                ) : (
                  <span className="text-lg relative z-10 uppercase">BERSIHKAN & GANTI LATAR</span>
                )}
              </button>
            </div>
          </div>

          {/* Column 2: Results (Desktop) */}
          <div className="lg:col-span-8 space-y-4 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:flex lg:flex-col lg:justify-between lg:overflow-hidden">
            <div className="space-y-4 lg:h-full lg:flex lg:flex-col lg:justify-between">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Generate
                </label>
              </div>

              <div 
                className={`flex-1 flex items-center justify-center bg-white border-2 border-dashed rounded-[32px] overflow-hidden relative group transition-all duration-500 min-h-[300px] lg:min-h-0 lg:h-full lg:max-h-[calc(100vh-200px)] lg:w-auto`}
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
                      className="w-full h-full relative select-none touch-none flex items-center justify-center p-4 lg:p-8"
                    >
                      <div className="relative w-full h-full max-h-[calc(100vh-250px)] flex items-center justify-center">
                        <img src={sourceImage!} className="absolute inset-0 w-full h-full object-contain blur-sm grayscale opacity-50" alt="Original" />
                        <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                          <img src={resultImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" alt="Result" />
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
                  <Recycle size={20} />
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Latar</h2>
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
    </div>
  );
};

export default GuberLatar;
