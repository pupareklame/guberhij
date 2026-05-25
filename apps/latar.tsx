
/**
 * [INTEGRITY-CHECK]: 0x726174616C
 * STATUS: PROTECTED-V1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Download, RefreshCw, Sparkles, Info, Crop, Map, Sun, Moon, Cloud, Camera, Mountain, X, Check, Scissors, Zap, Eye, ShieldAlert, Lock, User, Maximize, Users, Send, MapPin, Recycle, Gamepad2, Tent, IceCream, Rocket, Heart, Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { changeBackground } from '../services/latar';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const BACKGROUND_PRESETS = [
  { id: 'FASHION_SHOW', name: 'Fashion Show', icon: <Sparkles size={18} />, prompt: 'A whimsical children fashion show with a bright red carpet path in the center, cute chubby babies (bayi gemoy) as the audience sitting on both sides, colorful balloons, playful stage lighting, cheerful and child-like atmosphere.' },
  { id: 'ROBLOX_WORLD', name: 'Dunia Roblox', icon: <Gamepad2 size={18} />, prompt: 'Inside a vibrant 3D Roblox world, blocky architecture, bright primary colors, a clear central path for the subject to stand on, playful game environment, sunny day.' },
  { id: 'COLORFUL_PARK', name: 'Taman Warna', icon: <Sun size={18} />, prompt: 'In a beautiful colorful children playground park, rainbow slides, bright swings, a clean green grass area in the center, blooming flowers, cheerful atmosphere, soft sunlight.' },
  { id: 'SNACK_STREET', name: 'Jajanan Warna', icon: <IceCream size={18} />, prompt: 'On a street filled with colorful Indonesian traditional snack carts (gerobak jajanan), a clear walking path in the middle, vibrant colors, festive decorations, cheerful market vibe.' },
  { id: 'CANDY_LAND', name: 'Negeri Permen', icon: <Heart size={18} />, prompt: 'In a magical candy land, giant lollipops, chocolate rivers, cotton candy clouds, a clear sugary path for the subject, bright pink and pastel colors, whimsical atmosphere.' },
  { id: 'TOY_ROOM', name: 'Kamar Mainan', icon: <ImageIcon size={18} />, prompt: 'Inside a cozy and messy children playroom, filled with colorful toys, building blocks, a clear space on the floor in the center, bright wallpaper, soft indoor lighting.' },
  { id: 'CARTOON_VILLAGE', name: 'Desa Kartun', icon: <Tent size={18} />, prompt: 'In a cute 3D cartoon village, rounded houses, bright colors, a clean cobblestone path in the middle, friendly atmosphere, stylized trees and clouds.' },
  { id: 'DINO_JUNGLE', name: 'Hutan Dino', icon: <Mountain size={18} />, prompt: 'In a lush prehistoric jungle, giant tropical leaves, a clear dirt path in the center, friendly dinosaurs in the distance, misty atmosphere, adventurous vibe.' },
  { id: 'SPACE_ADVENTURE', name: 'Luar Angkasa', icon: <Rocket size={18} />, prompt: 'In a fun cartoon space adventure, colorful planets, a glowing cosmic path for the subject, friendly aliens, sparkling stars, vibrant purple and blue galaxy.' },
  { id: 'UNDERWATER', name: 'Bawah Laut', icon: <Cloud size={18} />, prompt: 'In a vibrant underwater kingdom, colorful coral reefs, a clear sandy path on the sea floor, friendly sea creatures, sun rays filtering through water, magical blue atmosphere.' },
];

const GuberLatar: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [cleanedImage, setCleanedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [showPreview, setShowPreview] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState(false);
  
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

  const customBgInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-detect aspect ratio from source image
  useEffect(() => {
    if (sourceImage) {
      const img = new Image();
      img.src = sourceImage;
      img.onload = () => {
        const ratio = img.width / img.height;
        const targets = [
          { val: 1, str: '1:1' },
          { val: 3/4, str: '3:4' },
          { val: 4/3, str: '4:3' },
          { val: 9/16, str: '9:16' },
          { val: 8/16, str: '8:16' },
          { val: 16/9, str: '16:9' }
        ];
        const closest = targets.reduce((prev, curr) => 
          Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
        );
        setAspectRatio(closest.str);
      };
    }
  }, [sourceImage]);

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const handleGenerate = async () => {
    if (!sourceImage) {
      setProcessing({ isProcessing: false, error: "Harap unggah foto subjek terlebih dahulu.", progress: '' });
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Tahap 1: Membersihkan Latar...' });
    setResultImage(null);

    try {
      let imageToProcess = cleanedImage;

      // If not cleaned yet, perform cleaning first (Normal Mode behavior)
      if (!imageToProcess) {
        const cleanPrompt = `
          [TASK]: BACKGROUND REMOVAL TO PURE WHITE.
          [OBJECTIVE]: Extract ONLY the person and their clothing. Replace everything else with PURE SOLID WHITE background (#FFFFFF).
          [RULES]: 
          1. No shadows, no gradients, just pure white.
          2. Remove all screenshot UI, black bars, and original scenery.
          3. Keep the person 100% identical.
        `;
        imageToProcess = await changeBackground(sourceImage, cleanPrompt, aspectRatio);
        // Optionally save it to cleanedImage so if they run again it's faster
        setCleanedImage(imageToProcess);
      }

      setProcessing(prev => ({ ...prev, progress: 'Tahap 2: Mengganti Latar...' }));

      const finalPrompt = customBackground 
        ? `[TASK]: COMPOSITING. Move the person from image 1 to the background in image 2. ${prompt || 'Professional blending and lighting.'}`
        : `
        [TASK]: BACKGROUND REPLACEMENT ON CLEANED SUBJECT.
        [OBJECTIVE]: Apply the new environment: ${prompt || 'Professional studio background'} to the entire white area surrounding the person.
        [ENVIRONMENT_RULES]: Cinematic lighting, professional blending, 8K resolution, realistic shadows.
        [STRICT_RULE]: The person must remain 100% identical.
      `;

      const result = await changeBackground(imageToProcess, finalPrompt, aspectRatio, customBackground || undefined);
      setResultImage(result);
      setOriginalResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memproses gambar.", progress: '' });
    }
  };

  const handleClean = async () => {
    if (!sourceImage) {
      setProcessing({ isProcessing: false, error: "Harap unggah foto subjek terlebih dahulu.", progress: '' });
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Membersihkan Latar (Mode Expert)...' });
    
    try {
      const cleanPrompt = `
        [TASK]: BACKGROUND REMOVAL TO PURE WHITE.
        [OBJECTIVE]: Extract ONLY the person and their clothing. Replace everything else with PURE SOLID WHITE background (#FFFFFF).
        [RULES]: 
        1. No shadows, no gradients, just pure white.
        2. Remove all screenshot UI, black bars, and original scenery.
        3. Keep the person 100% identical.
      `;

      const result = await changeBackground(sourceImage, cleanPrompt, aspectRatio);
      setCleanedImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal membersihkan latar.", progress: '' });
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
    setCustomBackground(null);
    setResultImage(null);
    setOriginalResultImage(null);
    setSliderPos(50);
    setPrompt('');
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBackground(reader.result as string);
        setPrompt('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Enhancing Details...' });
    try {
      const upscaled = await upscaleImage(resultImage, aspectRatio);
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
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden text-slate-900">
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Latar AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Guber AI Studio</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* Column 1: Subject & Mode */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              {/* Subject Upload */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <User size={14} className="text-slate-300" /> 1. Foto Subjek
                </label>
                <div className="lg:flex-1 min-h-0">
                  <ImageUploader
                    label="Pilih Subjek"
                    image={sourceImage}
                    onImageSelect={(img) => { 
                      setSourceImage(img); 
                      setCleanedImage(null);
                      setResultImage(null); 
                    }}
                    onClear={() => { 
                      setSourceImage(null); 
                      setCleanedImage(null);
                      setResultImage(null); 
                    }}
                    aspectRatio={aspectRatio.replace(':', '-')}
                    labelInside
                  />
                </div>
              </div>

              {/* Expert Mode Panel */}
              <div className="shrink-0 space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Zap size={14} style={{ color: isExpertMode ? primaryColor : '#94a3b8' }} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      {isExpertMode ? 'Expert Mode' : 'Normal Mode'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsExpertMode(!isExpertMode)}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${isExpertMode ? '' : 'bg-slate-300'}`}
                    style={{ backgroundColor: isExpertMode ? primaryColor : undefined }}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isExpertMode ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                
                {isExpertMode && (
                  <button
                    onClick={handleClean}
                    disabled={processing.isProcessing || !sourceImage || !!cleanedImage}
                    className={`w-full py-3 rounded-xl border-2 font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all ${
                      cleanedImage 
                        ? 'bg-green-50 border-green-200 text-green-600' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {processing.progress === 'Membersihkan Latar (Mode Expert)...' ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : cleanedImage ? (
                      <Check size={12} />
                    ) : (
                      <Scissors size={12} />
                    )}
                    {processing.progress === 'Membersihkan Latar (Mode Expert)...' ? 'Cleaning...' : cleanedImage ? 'Cleaned' : 'Clean BG First'}
                  </button>
                )}
              </div>
            </div>

            {/* Column 2: Background Choices */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-slate-300" /> 2. Preset Latar
                </label>
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar lg:pr-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => customBgInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center p-4 rounded-[24px] border-2 transition-all duration-300 gap-2 group relative overflow-hidden ${
                        customBackground 
                          ? 'scale-[1.02] shadow-md ring-2 ring-offset-2' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                      }`}
                      style={customBackground ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}
                    >
                      {customBackground && (
                        <div className="absolute inset-0 z-0">
                          <img src={customBackground} className="w-full h-full object-cover opacity-30" alt="Custom" />
                        </div>
                      )}
                      <div className="relative z-10"><Camera size={18} /></div>
                      <span className="relative z-10 text-[8px] font-black uppercase text-center tracking-tight">
                        {customBackground ? 'Latar Kustom' : 'Upload Latar'}
                      </span>
                      <input type="file" ref={customBgInputRef} onChange={handleCustomBgUpload} className="hidden" accept="image/*" />
                    </button>

                    {BACKGROUND_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setPrompt(p.prompt); setCustomBackground(null); }}
                        className={`flex flex-col items-center justify-center p-4 rounded-[24px] border-2 transition-all duration-300 gap-2 group ${
                          prompt === p.prompt 
                            ? 'scale-[1.02] shadow-md' 
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                        }`}
                        style={prompt === p.prompt ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}
                      >
                        <div className="relative z-10">{p.icon}</div>
                        <span className="text-[8px] font-black uppercase text-center leading-tight tracking-tight">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col min-h-0 pt-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Map size={14} className="text-slate-300" /> 3. Deskripsi Latar
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => { setPrompt(e.target.value); if (e.target.value) setCustomBackground(null); }}
                    placeholder="Contoh: Di puncak gunung..."
                    className="w-full min-h-[100px] p-4 bg-slate-50 border-2 border-slate-200 rounded-[24px] text-[11px] font-medium focus:border-slate-400 focus:outline-none resize-none transition-all shadow-inner"
                  />
                  {prompt && (
                    <button 
                      onClick={() => setPrompt('')}
                      className="absolute bottom-3 right-3 p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Generate Button */}
              <div className="lg:hidden pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !sourceImage || (!prompt && !customBackground)}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !sourceImage || (!prompt && !customBackground)) ? '#cbd5e1' : primaryColor 
                  }}
                >
                  GANTI LATAR
                </button>
              </div>
            </div>

            {/* Column 3: Result Area */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between shrink-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Rasio
                  </label>
                  
                  {/* Aspect Ratio Selection */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-4">
                    {ratios.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setAspectRatio(r.value)}
                        className={`px-2 py-1 rounded-md text-[8px] font-black transition-all ${aspectRatio === r.value ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
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
                        className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-sm px-6 text-center"
                      >
                        <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                          {processing.progress || 'Neural Background Rendering...'}
                        </p>
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
                          className="absolute inset-0 overflow-hidden shadow-2xl"
                          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                          <img src={sourceImage!} alt="Original" className="w-full h-full object-cover" />
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
                          Asli
                        </div>
                        <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest z-30">
                          Latar Baru
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
              <div className="grid grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3 w-full mx-auto shrink-0">
                <button 
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !sourceImage || (!prompt && !customBackground)}
                  title="Generate"
                  className="hidden lg:flex order-5 lg:order-first col-span-1 lg:col-span-2 py-4 rounded-2xl border-2 text-white items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !sourceImage || (!prompt && !customBackground)) ? '#cbd5e1' : primaryColor, 
                    borderColor: (processing.isProcessing || !sourceImage || (!prompt && !customBackground)) ? '#cbd5e1' : primaryColor 
                  }}
                >
                  <span className="font-black uppercase tracking-widest text-[10px]">GANTI LATAR</span>
                </button>

                <button 
                  onClick={() => setShowPreview(true)}
                  disabled={processing.isProcessing || !resultImage}
                  title="Preview"
                  className="order-1 lg:order-2 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm shadow-slate-200/50"
                >
                  <Eye size={20} />
                </button>
                <button 
                  onClick={() => setIsCropping(true)}
                  disabled={processing.isProcessing || !resultImage}
                  title="Crop"
                  className="order-2 lg:order-3 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm shadow-slate-200/50"
                >
                  <Scissors size={20} />
                </button>
                <button 
                  onClick={handleSharpen}
                  disabled={processing.isProcessing || !resultImage}
                  title="Sharpen"
                  className="order-3 lg:order-4 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm shadow-slate-200/50"
                >
                  <Zap size={20} />
                </button>
                <button 
                  onClick={handleResetResult}
                  disabled={processing.isProcessing || !resultImage || resultImage === originalResultImage}
                  title="Reset"
                  className="order-4 lg:order-5 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm shadow-slate-200/50"
                >
                  <Recycle size={20} />
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={processing.isProcessing || !resultImage}
                  title="Download"
                  className="order-6 lg:order-6 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm shadow-slate-200/50"
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
                aspect={
                  aspectRatio === '1:1' ? 1 : 
                  aspectRatio === '3:4' ? 3/4 : 
                  aspectRatio === '4:3' ? 4/3 : 
                  aspectRatio === '9:16' ? 9/16 : 
                  aspectRatio === '8:16' ? 8/16 : 
                  16/9
                }
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

export default GuberLatar;
