
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Download, Scissors, Check, X, Sparkles, ImageIcon, Maximize, Zap, Eye, Cpu, Recycle, Baby, User as UserIcon, UserPlus } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState, CyborgConfig } from '../types';
import { generateCyborg } from '../services/cyborg';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const CYBORG_PRESETS = [
  { label: 'Futuristik', value: 'Futuristic high-tech chrome and neon circuits with sleek armor' },
  { label: 'Dinosaurus', value: 'Cybernetic dinosaur hybrid with metallic scales, glowing eyes, and prehistoric mechanical armor' },
  { label: 'Hewan', value: 'Animal-themed cyborg with beast-like mechanical features, fur-metal hybrid textures' },
  { label: 'Makhluk Mitos', value: 'Mythical creature cyborg (Dragon/Phoenix) with ethereal energy and legendary mechanical artifacts' },
  { label: 'Steampunk', value: 'Vintage brass gears, steam-powered mechanisms, copper pipes, and leather accents' },
  { label: 'Battle Damaged', value: 'Worn-out combat cyborg with exposed wiring, battle scars, and rusted metallic plates' },
  { label: 'Nano-Tech', value: 'Sleek liquid metal, microscopic robotic swarms, and shifting geometric surfaces' },
  { label: 'Cyber-Samurai', value: 'Traditional samurai armor integrated with high-tech glowing katanas and digital masks' },
];

const VISUAL_EFFECTS = [
  { label: 'Cinematic', value: 'Cinematic lighting, dramatic shadows, anamorphic lens flare, high contrast' },
  { label: 'Cyberpunk', value: 'Vibrant neon colors, rainy night atmosphere, glitch effects, urban sci-fi' },
  { label: 'Noir', value: 'Black and white, high contrast, moody shadows, classic detective film aesthetic' },
  { label: 'Retro-Futurism', value: '80s sci-fi aesthetic, VHS grain, synthwave colors, glowing grids' },
  { label: 'Hyper-Realistic', value: 'Extreme detail, natural lighting, sharp textures, photorealistic finish' },
  { label: 'Anime 3D', value: 'Stylized 3D anime look, vibrant colors, clean lines, cel-shaded mechanical parts' },
];

const CyborgAI: React.FC = () => {
  const { primaryColor } = useTheme();
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [category, setCategory] = useState<'ANAK' | 'PRIA' | 'WANITA'>('PRIA');
  const [shotType, setShotType] = useState<'PORTRAIT' | 'FULL_BODY'>('PORTRAIT');
  const [selectedPreset, setSelectedPreset] = useState(CYBORG_PRESETS[0].value);
  const [selectedEffect, setSelectedEffect] = useState(VISUAL_EFFECTS[0].value);
  const [customInstruction, setCustomInstruction] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('9:16');
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

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menajamkan Detail...' });
    try {
      const upscaled = await upscaleImage(resultImage, aspectRatio);
      setResultImage(upscaled);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal menajamkan gambar.", progress: '' });
    }
  };

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
    }
  };

  const handleGenerate = async () => {
    if (!faceImage) {
      setProcessing({ isProcessing: false, error: "Harap unggah foto wajah terlebih dahulu.", progress: '' });
      return;
    }

    setResultImage(null);
    setInitialResultImage(null);
    setIsCropping(false);
    setProcessing({ isProcessing: true, error: null, progress: 'Mentransformasi Cyborg...' });
    
    try {
      const config: CyborgConfig = {
        category,
        preset: selectedPreset,
        shotType,
        visualEffect: selectedEffect,
        customInstruction,
        aspectRatio
      };
      const result = await generateCyborg(faceImage, config);
      setResultImage(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Proses AI gagal. Coba lagi.", progress: '' });
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
      const { width, height } = croppedAreaPixels;
      canvas.width = width; canvas.height = height;
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      const base64Image = canvas.toDataURL('image/png');
      setResultImage(base64Image);
      setIsCropping(false);
    } catch (e) { 
      console.error(e); 
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto', progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `cyborg-ai-${Date.now()}.png`;
    link.click();
  };

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
                <Cpu size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">CYBORG AI STUDIO</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Machine Synthesis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Category Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setCategory('ANAK')} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${category === 'ANAK' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
              style={{ color: category === 'ANAK' ? primaryColor : undefined }}
            >
              <Baby size={14} /> Anak
            </button>
            <button 
              onClick={() => setCategory('PRIA')} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${category === 'PRIA' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
              style={{ color: category === 'PRIA' ? primaryColor : undefined }}
            >
              <UserIcon size={14} /> Pria
            </button>
            <button 
              onClick={() => setCategory('WANITA')} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${category === 'WANITA' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
              style={{ color: category === 'WANITA' ? primaryColor : undefined }}
            >
              <UserPlus size={14} /> Wanita
            </button>
          </div>

          {/* Image Uploader */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12} className="text-slate-300" /> 1. Unggah Wajah
            </label>
            <ImageUploader
              label="Unggah Foto Wajah"
              image={faceImage}
              onImageSelect={setFaceImage}
              onClear={() => setFaceImage(null)}
              aspectRatio="1-1"
              labelInside
            />
          </div>

          {/* Shot Type Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Maximize size={12} className="text-slate-300" /> 2. Tipe Tampilan (Shot Type)
            </label>
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setShotType('PORTRAIT')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${shotType === 'PORTRAIT' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                style={{ color: shotType === 'PORTRAIT' ? primaryColor : undefined }}
              >
                Portrait (Wajah)
              </button>
              <button 
                onClick={() => setShotType('FULL_BODY')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${shotType === 'FULL_BODY' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                style={{ color: shotType === 'FULL_BODY' ? primaryColor : undefined }}
              >
                Full Body (Badan)
              </button>
            </div>
          </div>

          {/* Preset Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} className="text-slate-300" /> 3. Pilih Tipe Cyborg
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CYBORG_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setSelectedPreset(preset.value)}
                  className={`px-3 py-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all text-center ${
                    selectedPreset === preset.value 
                      ? 'border-current' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                  }`}
                  style={{
                    borderColor: selectedPreset === preset.value ? primaryColor : undefined,
                    color: selectedPreset === preset.value ? primaryColor : undefined,
                    backgroundColor: selectedPreset === preset.value ? `${primaryColor}10` : undefined,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Effect Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} className="text-slate-300" /> 4. Pilih Efek Visual
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISUAL_EFFECTS.map((effect) => (
                <button
                  key={effect.label}
                  onClick={() => setSelectedEffect(effect.value)}
                  className={`px-3 py-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all text-center ${
                    selectedEffect === effect.value 
                      ? 'border-current' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                  }`}
                  style={{
                    borderColor: selectedEffect === effect.value ? primaryColor : undefined,
                    color: selectedEffect === effect.value ? primaryColor : undefined,
                    backgroundColor: selectedEffect === effect.value ? `${primaryColor}10` : undefined,
                  }}
                >
                  {effect.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={12} className="text-slate-300" /> 5. Instruksi Tambahan (Opsional)
            </label>
            <textarea
              placeholder="Misal: Tambahkan sayap mekanik, mata merah menyala..."
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-[10px] font-bold uppercase tracking-widest focus:border-slate-200 outline-none transition-all min-h-[80px] resize-none"
            />
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Maximize size={12} className="text-slate-300" /> 6. Aspek Rasio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ratios.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setAspectRatio(r.value as any)}
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
              disabled={processing.isProcessing || !faceImage}
              className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ 
                backgroundColor: processing.isProcessing || !faceImage ? undefined : primaryColor,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processing.isProcessing ? (
                <span className="relative z-10">SEDANG TRANSFORMASI...</span>
              ) : (
                <span className="text-lg relative z-10 flex items-center gap-2">
                  <Cpu size={20} /> GENERATE CYBORG
                </span>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={12} className="text-slate-300" /> Hasil Cyborg AI
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
                    <img src={faceImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
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
                    <div className="absolute bottom-4 left-4 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[6px] font-black text-white uppercase tracking-widest pointer-events-none">Asli</div>
                    <div className="absolute bottom-4 right-4 px-2 py-0.5 bg-white/40 backdrop-blur-md rounded-full text-[6px] font-black text-black uppercase tracking-widest pointer-events-none">Cyborg AI</div>
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

export default CyborgAI;
