
/**
 * [INTEGRITY-CHECK]: 0x68656c6d
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, RefreshCw, Sparkles, Image as ImageIcon, Zap, X, Check, Scissors, Palette } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { applyHeadwear, upscaleImage } from '../services/helm';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const HEADWEAR_PRESETS = [
  { id: 'TEKO', name: 'Helm Teko', icon: '🫖', prompt: 'a realistic teapot modified into a functional open-face motorcycle helmet. The teapot must maintain its exact original UPRIGHT shape, with the spout on the side and the handle on top. The front side is cleanly cut open to reveal the face. It must be perfectly sized to fit the person\'s head proportionally.' },
  { id: 'GAS_3KG', name: 'Gas Elpiji 3kg', icon: '🟢', prompt: 'an Indonesian 3kg LPG gas cylinder (tabung melon) modified into a functional open-face motorcycle helmet. It must keep its exact UPRIGHT vertical shape and the top ring handles. The front is cut open to show the subject\'s face. It must be scaled proportionally to sit correctly on the person\'s head.' },
];

const PRESET_COLORS = [
  { name: 'Default', value: 'original color' },
  { name: 'Merah', value: '#ef4444' },
  { name: 'Biru', value: '#0ea5e9' },
  { name: 'Kuning', value: '#eab308' },
  { name: 'Putih', value: '#f8fafc' },
  { name: 'Hitam', value: '#0f172a' },
];

const GuberHelm: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [customHeadwearAsset, setCustomHeadwearAsset] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(HEADWEAR_PRESETS[1].id);
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0].value);
  const [customPrompt, setCustomPrompt] = useState<string>('');
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

  const handleGenerate = async () => {
    if (!sourceImage) {
      setProcessing(prev => ({ ...prev, error: "Harap unggah foto model terlebih dahulu." }));
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Applying Helmet...' });
    setResultImage(null);

    try {
      const preset = HEADWEAR_PRESETS.find(p => p.id === selectedId);
      let headwearDescription = customPrompt.trim() || preset?.prompt || 'open-face motorcycle helmet in upright position with snug chin strap and proportional size';
      
      if (selectedColor !== 'original color' && !customHeadwearAsset) {
        headwearDescription = `${headwearDescription} The entire outer surface must be colored in solid ${selectedColor}.`;
      }
      
      const result = await applyHeadwear(sourceImage, headwearDescription, customHeadwearAsset);
      setResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memasang helm.", progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `helm-unik-${Date.now()}.png`;
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
                <Zap size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Helm Unik AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Helmet Synthesis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Image Upload */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 1. Unggah Foto Model
            </label>
            <ImageUploader 
              label="Pilih Foto" 
              image={sourceImage} 
              onImageSelect={(img) => { setSourceImage(img); setResultImage(null); }} 
              aspectRatio="9-16" 
              labelInside 
            />
          </div>

          {/* Helmet Presets */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-slate-300" /> 2. Pilih Model Helm
            </label>
            <div className="grid grid-cols-2 gap-2">
              {HEADWEAR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedId(p.id); setCustomPrompt(''); setCustomHeadwearAsset(null); }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                    selectedId === p.id && !customPrompt && !customHeadwearAsset
                      ? 'scale-105 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                  style={selectedId === p.id && !customPrompt && !customHeadwearAsset ? {
                    backgroundColor: primaryColor,
                    color: 'white',
                    borderColor: primaryColor,
                  } : {}}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[10px] font-black uppercase leading-tight text-left">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Asset */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> Custom Asset (Opsional)
            </label>
            <ImageUploader 
              label="Upload Benda" 
              image={customHeadwearAsset} 
              onImageSelect={(img) => { setCustomHeadwearAsset(img); setCustomPrompt(''); setSelectedId(null); }} 
              aspectRatio="square" 
              labelInside 
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} className="text-slate-300" /> Warna Helm
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-full aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${selectedColor === c.value ? 'scale-110 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                  style={{ 
                    backgroundColor: c.value.startsWith('#') ? c.value : '#fff',
                    borderColor: selectedColor === c.value ? primaryColor : undefined
                  }}
                  title={c.name}
                >
                  {c.value === 'original color' && <span className="text-[8px] font-black text-slate-400">ORI</span>}
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
              disabled={processing.isProcessing || !sourceImage}
              className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ backgroundColor: processing.isProcessing || !sourceImage ? undefined : primaryColor }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processing.isProcessing ? (
                <span className="relative z-10">FITTING...</span>
              ) : (
                <span className="text-lg relative z-10">PASANG HELM</span>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Helm
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
                    <img src={sourceImage!} className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 blur-[1px]" alt="Original" />
                    <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                      <img src={resultImage} className="absolute inset-0 w-full h-full object-cover" alt="Result" />
                    </div>
                    <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
                    <div className="absolute top-0 bottom-0 w-[2px] bg-white z-10 pointer-events-none" style={{ left: `${sliderPos}%` }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center border-2" style={{ borderColor: primaryColor }}>
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                          <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                        </div>
                      </div>
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Helm</h2>
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

export default GuberHelm;
