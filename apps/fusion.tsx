
/**
 * [INTEGRITY-CHECK]: 0x667573696f6e
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Download, RefreshCw, Sparkles, Image as ImageIcon, Zap, X, Check, Scissors } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState, FusionConfig } from '../types';
import { generateFusionCharacter, upscaleImage } from '../services/fusion';
import { useTheme } from '../src/contexts/ThemeContext';

const STYLE_PRESETS = [
  { id: 'PHOTOREALISM', name: 'Photorealism', icon: '📸', prompt: 'Photorealistic style, camera-like capture, highly realistic skin texture, natural ambient lighting, accurate physically-based shadows, natural depth of field, 8k raw photo.' },
  { id: 'HYPERREALISM', name: 'Hyperrealism', icon: '🔍', prompt: 'Hyperrealistic extreme detail, beyond reality, 8K resolution, microscopic skin pores, fine hair strands, dramatic cinematic lighting, extreme contrast, sharp focus.' },
  { id: 'CARTOON', name: 'Cartoon / Animated', icon: '🎬', prompt: 'Cartoon animated style, 3D Disney/Pixar rendering, vibrant saturated colors, exaggerated expressive features, smooth stylized textures, playful mood.' },
  { id: 'DIGITAL_PAINTING', name: 'Digital Painting', icon: '🖌️', prompt: 'Digital painting style, visible artistic brush strokes, illustrative concept art, rich color palette, soft blending, professional digital art workstation look.' },
  { id: 'OIL_PAINTING', name: 'Oil Painting', icon: '🖼️', prompt: 'Classic oil painting on canvas, thick impasto brushwork, warm golden tones, visible canvas texture, renaissance period style, masterpiece museum quality.' },
  { id: 'WATERCOLOR', name: 'Watercolor', icon: '💧', prompt: 'Watercolor painting, soft transparent washes, artistic water bleed effects, wet-on-wet technique, delicate edges, hand-painted on textured paper.' },
  { id: 'SKETCH', name: 'Sketch / Pencil', icon: '✏️', prompt: 'Hand-drawn pencil sketch, charcoal drawing style, graphite textures, cross-hatching shadows, black and white, artistic paper grain, manual line art.' },
  { id: '3D_RENDER', name: '3D Render', icon: '🎮', prompt: 'High-end 3D render, Octane render, Unreal Engine 5 style, volumetric studio lighting, ray-traced shadows, digital plastic/metal textures, 4k gaming asset.' },
  { id: 'CYBERPUNK', name: 'Cyberpunk', icon: '🌃', prompt: 'Cyberpunk futuristic aesthetic, vibrant neon glow (blue, magenta, cyan), dark rainy atmosphere, high-tech sci-fi elements, cinematic nocturnal vibe.' },
  { id: 'MINIMALIST', name: 'Minimalist / Flat', icon: '⬜', prompt: 'Minimalist flat design, clean vector art style, solid block colors, minimal shadows, simple geometric forms, modern UI/UX illustration style.' }
];

const GuberFusion: React.FC = () => {
  const { primaryColor } = useTheme();
  const [config, setConfig] = useState<FusionConfig>({
    object1: '',
    object2: '',
    style: STYLE_PRESETS[0].prompt
  });
  const [selectedStyleId, setSelectedStyleId] = useState(STYLE_PRESETS[0].id);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  
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

  const handleSelectStyle = (id: string, prompt: string) => {
    setSelectedStyleId(id);
    setConfig({ ...config, style: prompt });
  };

  const handleGenerate = async () => {
    if (!config.object1.trim() || !config.object2.trim()) {
      setProcessing(prev => ({ ...prev, error: "Harap isi kedua kolom objek yang ingin digabung." }));
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Fusing Objects...' });
    setResultImage(null);

    try {
      const result = await generateFusionCharacter(config);
      setResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memfusikan objek.", progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `fusion-objek-${Date.now()}.png`;
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
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      setResultImage(canvas.toDataURL('image/png'));
      setIsCropping(false);
    } catch (e) { 
      console.error(e);
      setIsCropping(false);
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling Image...' });
    try {
      const sharpenedImage = await upscaleImage(resultImage, aspectRatio);
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Fusion Objek AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Object Synthesis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Object Inputs */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Box size={14} className="text-slate-300" /> 1. Masukkan Objek
            </label>
            <div className="space-y-3">
              <input 
                type="text" 
                value={config.object1}
                onChange={(e) => setConfig({...config, object1: e.target.value})}
                placeholder="Contoh: Seekor kucing..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold text-slate-700 outline-none focus:border-teal-500 transition-all shadow-inner placeholder:text-slate-300"
              />
              <input 
                type="text" 
                value={config.object2}
                onChange={(e) => setConfig({...config, object2: e.target.value})}
                placeholder="Contoh: Burger keju..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold text-slate-700 outline-none focus:border-teal-500 transition-all shadow-inner placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-slate-300" /> 2. Pilih Gaya Visual
            </label>
            <div className="grid grid-cols-5 gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleSelectStyle(style.id, style.prompt)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                    selectedStyleId === style.id 
                      ? 'scale-105 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                  style={selectedStyleId === style.id ? {
                    backgroundColor: primaryColor,
                    color: 'white',
                    borderColor: primaryColor,
                  } : {}}
                >
                  <span className="text-lg mb-1">{style.icon}</span>
                  <span className="text-[6px] font-black uppercase text-center leading-tight">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 3. Pilih Aspek Rasio
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

          <div className="">
            <button
              onClick={handleGenerate}
              disabled={processing.isProcessing || !config.object1 || !config.object2}
              className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ backgroundColor: processing.isProcessing || !config.object1 || !config.object2 ? undefined : primaryColor }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processing.isProcessing ? (
                <span className="relative z-10">FUSING...</span>
              ) : (
                <span className="text-lg relative z-10">MULAI FUSION</span>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Fusion
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
                  <motion.div key="loading" className="absolute inset-0 flex items-center justify-center z-30">
                    <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                  </motion.div>
                ) : resultImage ? (
                  <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative select-none touch-none">
                    <img src={resultImage} className="absolute inset-0 w-full h-full object-cover" alt="Result" />
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
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              <button onClick={() => setIsCropping(true)} disabled={!resultImage || processing.isProcessing} className="flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all border-slate-100 hover:border-slate-200 disabled:opacity-30" style={{ color: primaryColor }}><Scissors size={20} /></button>
              <button onClick={handleSharpen} disabled={!resultImage || processing.isProcessing} className="flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all border-slate-100 hover:border-slate-200 disabled:opacity-30" style={{ color: primaryColor }}><Zap size={20} /></button>
              <button onClick={handleDownload} disabled={!resultImage || processing.isProcessing} className="flex items-center justify-center py-4 text-white rounded-2xl transition-all disabled:bg-slate-300" style={{ backgroundColor: !resultImage || processing.isProcessing ? undefined : primaryColor }}><Download size={20} /></button>
            </div>
          </div>

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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Fusion</h2>
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
    </div>
  );
};

export default GuberFusion;
