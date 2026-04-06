
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Sparkles, Map, User, Download, RefreshCw, Layers, Image as ImageIcon, ChevronRight, ChevronLeft, Check, X, Camera, Send, MapPin, Sun, Moon, Cloud, Mountain, Maximize, Scissors, Zap, Eye, Users } from 'lucide-react';
import { ProcessingState } from '../types';
import { processBerpola } from '../services/berpola';
import { extractCleanPhoto } from '../services/bersih';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import Cropper from 'react-easy-crop';
import { useTheme } from '../src/contexts/ThemeContext';

const POSE_PRESETS = [
  { id: 'STANDING_STRAIGHT', name: 'Berdiri Lurus', icon: '🧍', prompt: 'DIRECTIVE: Absolute frontal 0-degree view. POSTURE: Symmetrical high-fashion standing, facing camera directly. LIGHTING: Sharp professional catalog. [ENV]: Clean studio.' },
  { id: 'WALKING_FRONT', name: 'Jalan Depan', icon: '🚶', prompt: 'DIRECTIVE: Dynamic runway walk towards lens. PERSPECTIVE: Perfect frontal. CAMERA: High-speed shutter sharpness. STYLE: Fashion editorial.' },
  { id: 'SWING_FRONT', name: 'Main Ayunan', icon: '🌳', prompt: 'DIRECTIVE: Frontal close-up shot sitting on a rope swing. ACTION: Subject facing camera directly, hands gripping the side ropes. [ENV]: Lush tropical garden with sun-dappled lighting and soft floral bokeh.' },
  { id: 'CAROUSEL_FRONT', name: 'Komedi Putar', icon: '🎠', prompt: 'DIRECTIVE: Riding a carousel horse, frontal view. POSTURE: Facing camera directly. LIGHTING: Nostalgic fairground, sharp focus.' },
  { id: 'KIDS_BIKE', name: 'Sepeda Anak', icon: '🚲', prompt: 'DIRECTIVE: Subject on a mini-bicycle facing straight forward. ACTION: Hands on handlebars, 0-degree perspective. [ENV]: Vivid colors, outdoor playground.' },
  { id: 'MTB_ADULT', name: 'Sepeda Dewasa', icon: '🚴', prompt: 'DIRECTIVE: Aggressive frontal MTB cycling posture. POSTURE: Bicycle and rider facing camera directly. TEXTURE: Sharp fabric and frame details.' },
  { id: 'KIDS_MOTO', name: 'Motor Anak', icon: '🛵', prompt: 'DIRECTIVE: Riding electric toy motorcycle. VIEW: Absolute frontal. EXPRESSION: Cool rider. LIGHTING: Studio high-key.' },
  { id: 'MOGE_SPORT', name: 'Motor Gede', icon: '🏍️', prompt: 'DIRECTIVE: Subject is STRADDLING and SITTING ON the saddle of a high-performance sport motorcycle. POSTURE: Sitting firmly, both hands on handlebars, body facing camera directly (0-degree). LEGS: Naturally straddling the bike body; for children, feet may dangle naturally. VEHICLE: Full-size realistic heavy motorcycle facing 100% frontal. [ENV]: Urban asphalt street.' },
  { id: 'KIDS_SLIDE', name: 'Seluncuran', icon: '🛝', prompt: 'DIRECTIVE: Subject is sitting at the very TOP entrance of a slide, hands holding the side rails, looking directly at the camera before sliding down. VIEW: Absolute frontal. [ENV]: Cheerful outdoor playground.' },
];

const LATAR_PRESETS = [
  { id: 'LUX_OFFICE', name: 'Kantor Mewah', icon: <ImageIcon size={18} />, color: '#334155', prompt: 'Inside a high-end luxury modern office, floor-to-ceiling glass windows, blurred evening city skyline, professional soft interior lighting, cinematic bokeh.' },
  { id: 'GOLDEN_BEACH', name: 'Pantai Sunset', icon: <Sun size={18} />, color: '#f59e0b', prompt: 'At a breathtaking tropical beach during golden hour sunset, warm orange sunlight, calm waves, palm trees in the distance, high-end travel photography style.' },
  { id: 'CYBER_STREET', name: 'Kota Cyberpunk', icon: <Moon size={18} />, color: '#7c3aed', prompt: 'On a rainy neon-lit street in a futuristic city, vibrant pink and blue reflections on wet asphalt, cinematic depth of field, hazy atmosphere.' },
  { id: 'ALPS_VISTA', name: 'Puncak Alpen', icon: <Mountain size={18} />, color: '#0ea5e9', prompt: 'Standing on a wooden balcony overlooking the Swiss Alps, snow-capped mountains, crisp morning daylight, clear blue sky, majestic atmosphere.' },
  { id: 'MINIMAL_STUDIO', name: 'Studio Minimalis', icon: <Camera size={18} />, color: '#94a3b8', prompt: 'In a professional minimalist photo studio, clean neutral gray textured wall, high-end soft-box lighting, elegant fashion catalog vibe.' },
  { id: 'COZY_CAFE', name: 'Kafe Estetik', icon: <Cloud size={18} />, color: '#f8fafc', prompt: 'Inside a modern minimalist cafe with an all-white aesthetic, white marble tables, white walls, soft bright natural lighting, professional architectural photography style.' },
];

type Step = 'CLEAN' | 'POSE_LATAR';

const GuberBerpola: React.FC = () => {
  const { primaryColor } = useTheme();
  const [currentStep, setCurrentStep] = useState<Step>('CLEAN');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [cleanResultImage, setCleanResultImage] = useState<string | null>(null);
  const [poseResultImage, setPoseResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [history, setHistory] = useState<string[]>([]);
  
  // Pose States
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(POSE_PRESETS[0].id);
  const [customPosePrompt, setCustomPosePrompt] = useState<string>('');
  const [poseRefImage, setPoseRefImage] = useState<string | null>(null);

  // Latar States
  const [latarPrompt, setLatarPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState('9:16');

  // Crop States
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const addToHistory = (img: string) => {
    setHistory(prev => [...prev, img]);
    if (currentStep === 'CLEAN') {
      setCleanResultImage(img);
    } else {
      setPoseResultImage(img);
    }
  };

  const handleClean = async () => {
    if (!sourceImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Membersihkan UI & Latar...' });
    try {
      const result = await extractCleanPhoto(sourceImage, null);
      addToHistory(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: "Gagal membersihkan foto.", progress: '' });
    }
  };

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const handlePoseDanLatar = async () => {
    const baseImage = cleanResultImage || sourceImage;
    if (!baseImage) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Memproses Pose & Latar...' });
    try {
      const preset = POSE_PRESETS.find(p => p.id === selectedPoseId);
      let posePrompt = '';
      
      if (customPosePrompt.trim()) {
        posePrompt = `TASK: Creative Pose Synthesis. SUBJECT: "${customPosePrompt}". ORIENTATION: Forced 0-degree frontal.`;
      } else if (preset) {
        posePrompt = preset.prompt;
      }
      
      const finalInstruction = `
        [POSE_CORE]: ${posePrompt} 
        [USER_ENVIRONMENT_DIRECTIVE]: ${latarPrompt} 
        [UNBREAKABLE_RULES]:
        1. IDENTITY: Face, skin tone, and distinguishing features must remain 100% identical.
        2. GARMENT: Keep exact textures and colors of the original clothing.
        3. VIEWPORT: Mandatory face-to-face 0-degree frontal perspective.
        4. BACKGROUND: ${latarPrompt ? `Replace background with: ${latarPrompt}` : 'Keep background as is or follow pose environment.'}
      `;

      const result = await processBerpola(baseImage, poseRefImage, finalInstruction, aspectRatio);
      addToHistory(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: "Gagal memproses pose dan latar.", progress: '' });
    }
  };

  const handleUpscale = async (target?: string) => {
    const targetImage = target || poseResultImage || cleanResultImage || sourceImage;
    if (!targetImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menajamkan Foto...' });
    try {
      const result = await upscaleImage(targetImage, 'ULTRA_HD');
      addToHistory(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: "Gagal menajamkan foto.", progress: '' });
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

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/png');
  };

  const handleCropSave = async () => {
    const targetImage = currentStep === 'CLEAN' ? cleanResultImage : (poseResultImage || cleanResultImage || sourceImage);
    if (!targetImage || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(targetImage, croppedAreaPixels);
      addToHistory(croppedImage);
      setShowCrop(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setSourceImage(null);
    setCleanResultImage(null);
    setPoseResultImage(null);
    setHistory([]);
    setCurrentStep('CLEAN');
    setPoseRefImage(null);
    setLatarPrompt('');
    setCustomPosePrompt('');
    setSliderPos(50);
    setSelectedPoseId(POSE_PRESETS[0].id);
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      const lastImg = newHistory[newHistory.length - 1];
      if (currentStep === 'CLEAN') {
        setCleanResultImage(lastImg);
      } else {
        setPoseResultImage(lastImg);
      }
    } else if (history.length === 1) {
      setHistory([]);
      if (currentStep === 'CLEAN') {
        setCleanResultImage(null);
      } else {
        setPoseResultImage(null);
      }
    }
  };

  const downloadResult = (img?: string) => {
    const target = img || (currentStep === 'CLEAN' ? cleanResultImage : poseResultImage);
    if (!target) return;
    const link = document.createElement('a');
    link.href = target;
    link.download = `berpola-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100">
        {/* Header - Rounded like miniatur */}
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">GUBER BERPOLA</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Clean, Pose & Latar AI</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Step Navigation */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            {(['CLEAN', 'POSE_LATAR'] as Step[]).map((s) => (
              <button
                key={s}
                onClick={() => setCurrentStep(s)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === s ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                style={{ color: currentStep === s ? primaryColor : undefined }}
              >
                {s === 'CLEAN' ? '1. Bersihkan' : '2. Pose & Latar'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 'CLEAN' && (
              <motion.div
                key="clean"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Unggah Screenshot
                  </label>
                  <ImageUploader 
                    label="Pilih Screenshot" 
                    image={sourceImage} 
                    onImageSelect={(img) => { setSourceImage(img); setCleanResultImage(null); setHistory([]); }} 
                    aspectRatio="9-16" 
                    labelInside
                  />
                </div>

                <button
                  onClick={handleClean}
                  disabled={processing.isProcessing || !sourceImage}
                  className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500"
                  style={{ backgroundColor: processing.isProcessing || !sourceImage ? undefined : primaryColor }}
                >
                  {processing.isProcessing ? 'PROSES CLEANING...' : 'BERSIHKAN FOTO'}
                </button>
              </motion.div>
            )}

            {currentStep === 'POSE_LATAR' && (
              <motion.div
                key="pose_latar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Pose Selection */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} className="text-slate-300" /> Pilih Pose
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {POSE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPoseId(p.id); setCustomPosePrompt(''); }}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all ${selectedPoseId === p.id && !customPosePrompt ? 'scale-105' : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}
                        style={{ 
                          backgroundColor: selectedPoseId === p.id && !customPosePrompt ? primaryColor : undefined, 
                          color: selectedPoseId === p.id && !customPosePrompt ? 'white' : undefined, 
                          borderColor: selectedPoseId === p.id && !customPosePrompt ? primaryColor : undefined 
                        }}
                      >
                        <span className="text-lg mb-1">{p.icon}</span>
                        <span className="text-[7px] font-black uppercase tracking-tight text-center leading-tight">{p.name}</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={customPosePrompt}
                    onChange={(e) => { setCustomPosePrompt(e.target.value); setSelectedPoseId(null); }}
                    placeholder="Deskripsi pose kustom (opsional)..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-medium focus:outline-none focus:ring-2"
                    style={{ borderColor: primaryColor }}
                  />
                </div>

                {/* Background Selection */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Pilih Latar
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LATAR_PRESETS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLatarPrompt(l.prompt)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${latarPrompt === l.prompt ? 'scale-105' : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}
                        style={{ 
                          backgroundColor: latarPrompt === l.prompt ? primaryColor : undefined, 
                          color: latarPrompt === l.prompt ? 'white' : undefined, 
                          borderColor: latarPrompt === l.prompt ? primaryColor : undefined 
                        }}
                      >
                        <div className="text-lg mb-1" style={{ color: latarPrompt === l.prompt ? 'white' : l.color }}>{l.icon}</div>
                        <span className="text-[7px] font-black uppercase tracking-tight text-center leading-tight">{l.name}</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={latarPrompt}
                    onChange={(e) => setLatarPrompt(e.target.value)}
                    placeholder="Deskripsi latar kustom (opsional)..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-medium focus:outline-none focus:ring-2"
                    style={{ borderColor: primaryColor }}
                  />
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Maximize size={14} className="text-slate-300" /> Aspek Rasio
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {ratios.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setAspectRatio(r.value)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                          aspectRatio === r.value 
                            ? 'scale-105 shadow-md text-white' 
                            : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                        }`}
                        style={{ 
                          backgroundColor: aspectRatio === r.value ? primaryColor : undefined, 
                          color: aspectRatio === r.value ? 'white' : undefined, 
                          borderColor: aspectRatio === r.value ? primaryColor : undefined 
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

                <button
                  onClick={handlePoseDanLatar}
                  disabled={processing.isProcessing || (!sourceImage && !cleanResultImage)}
                  className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500"
                  style={{ backgroundColor: processing.isProcessing || (!sourceImage && !cleanResultImage) ? undefined : primaryColor }}
                >
                  {processing.isProcessing ? 'PROSES TRANSFORMASI...' : 'TERAPKAN POSE & LATAR'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Section - Exactly like miniatur */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Berpola
              </label>
              {history.length > 0 && (
                <button onClick={handleUndo} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1">
                  <RefreshCw size={12} /> Undo
                </button>
              )}
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
                borderColor: (poseResultImage || cleanResultImage) ? 'white' : `${primaryColor}40`,
                backgroundColor: (poseResultImage || cleanResultImage) ? 'white' : undefined
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
                ) : (poseResultImage || cleanResultImage) ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative select-none touch-none"
                  >
                    <img src={sourceImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
                    <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                      <img src={(poseResultImage || cleanResultImage)!} className="absolute inset-0 w-full h-full object-cover" alt="Result" />
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
            <div className="grid grid-cols-4 gap-3 max-w-[280px] mx-auto">
              <button
                onClick={() => setShowCrop(true)}
                disabled={!(poseResultImage || cleanResultImage) || processing.isProcessing}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${!(poseResultImage || cleanResultImage) || processing.isProcessing ? 'opacity-30 border-slate-50 cursor-not-allowed' : 'border-slate-100 hover:border-slate-200'}`}
                style={{ color: primaryColor }}
                title="Crop"
              >
                <Scissors size={20} />
              </button>
              <button
                onClick={() => handleUpscale()}
                disabled={!(poseResultImage || cleanResultImage) || processing.isProcessing}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${!(poseResultImage || cleanResultImage) || processing.isProcessing ? 'opacity-30 border-slate-50 cursor-not-allowed' : 'border-slate-100 hover:border-slate-200'}`}
                style={{ color: primaryColor }}
                title="Tajamkan"
              >
                <Zap size={20} />
              </button>
              <button
                onClick={() => (poseResultImage || cleanResultImage) && setShowPreview(true)}
                disabled={!(poseResultImage || cleanResultImage) || processing.isProcessing}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${!(poseResultImage || cleanResultImage) || processing.isProcessing ? 'opacity-30 border-slate-50 cursor-not-allowed' : 'border-slate-100 hover:border-slate-200'}`}
                style={{ color: primaryColor }}
                title="Preview"
              >
                <Eye size={20} />
              </button>
              <button
                onClick={() => downloadResult()}
                disabled={!(poseResultImage || cleanResultImage) || processing.isProcessing}
                className={`flex items-center justify-center py-4 text-white rounded-2xl transition-all ${!(poseResultImage || cleanResultImage) || processing.isProcessing ? 'bg-slate-300 opacity-50 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: !(poseResultImage || cleanResultImage) || processing.isProcessing ? undefined : primaryColor }}
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
        {showPreview && (poseResultImage || cleanResultImage) && (
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
                src={(poseResultImage || cleanResultImage)!} 
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
                  onClick={() => downloadResult()}
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
        {showCrop && (poseResultImage || cleanResultImage || sourceImage) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Berpola</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCrop(false)}
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
                image={(poseResultImage || cleanResultImage || sourceImage)!}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio === '9:16' ? 9/16 : aspectRatio === '3:4' ? 3/4 : aspectRatio === '1:1' ? 1/1 : aspectRatio === '4:3' ? 4/3 : 16/9}
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

export default GuberBerpola;
