
/**
 * [INTEGRITY-CHECK]: 0x64657361696e756c616e67
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Download, RefreshCw, Sparkles, Image as ImageIcon, Zap, X, Check, Scissors, Type, Wand2, Eye, Recycle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { extractTextOCR, generateTypographyPoster, upscaleImage } from '../services/desainulang';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const BACKGROUND_STYLES = [
  { 
    id: 'MINIMAL_CORNER', 
    name: 'Minimalist Corner', 
    icon: '🎨', 
    prompt: 'Clean bright minimalist white background with colorful abstract geometric decorations (circles, waves, dots) only in the top-left and bottom-right corners. Cheerful, trendy, and aesthetic vibe.' 
  },
  { 
    id: 'FLORAL_CORNER', 
    name: 'Floral Aesthetic', 
    icon: '🌸', 
    prompt: 'Elegant bright pastel cream background with watercolor flower illustrations and botanical leaves neatly arranged in all four corners. Soft, warm, and professional commercial studio look.' 
  },
  { 
    id: 'GEOMETRIC_POP', 
    name: 'Geometric Joy', 
    icon: '📐', 
    prompt: 'Vibrant minimalist bright background with playful primary color shapes (stars, zigzags, rings) decorating the corners. High contrast, energetic, and clean advertising style.' 
  },
  { 
    id: 'STUDIO_CLEAN', 
    name: 'Studio White', 
    icon: '📸', 
    prompt: 'Professional clean solid white studio background with extremely soft lighting. Minimalist and expensive look.' 
  }
];

const TYPO_EFFECTS = [
  { 
    id: 'CHEWY_STROKE', 
    name: 'Chewy Bubbly', 
    prompt: 'Font: Extra bold rounded bubbly font (Chewy style). Effect: Very thick sharp white stroke (outline) and a soft colorful drop shadow. Finish: Vibrant glossy candy-colored gradient.' 
  },
  { 
    id: 'IMPACT_NEON', 
    name: 'Cyber Neon', 
    prompt: 'Font: Heavy futuristic Sans Serif. Effect: Intense neon glow stroke in electric blue and pink. Finish: 3D metallic texture with deep long shadows.' 
  },
  { 
    id: 'LUXURY_GOLD', 
    name: 'Gold 3D', 
    prompt: 'Font: Elegant bold serif. Effect: Polished 24K gold 3D extrusion with sharp bevels. Finish: High-gloss reflections and realistic soft drop shadow.' 
  },
  { 
    id: 'RETRO_CANDY', 
    name: 'Retro Layered', 
    prompt: 'Font: Blocky retro 90s style. Effect: Multiple layers of offset shadows in yellow and pink. Finish: Thick black comic-style outline.' 
  }
];

const GuberTypo: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [detectedText, setDetectedText] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_STYLES[0].id);
  const [selectedTypo, setSelectedTypo] = useState(TYPO_EFFECTS[0].id);
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [showPreview, setShowPreview] = useState(false);
  
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

  const handleImageUpload = async (img: string) => {
    setSourceImage(img);
    setResultImage(null);
    setDetectedText('');
    
    setProcessing({ isProcessing: true, error: null, progress: 'AI reading text...' });
    try {
      const text = await extractTextOCR(img);
      setDetectedText(text);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: null, progress: '' });
      console.error("OCR Error:", err);
    }
  };

  const handleGenerate = async () => {
    if (!detectedText.trim()) {
      setProcessing(prev => ({ ...prev, error: "Masukkan teks terlebih dahulu." }));
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Neural Designer working...' });
    setResultImage(null);

    try {
      const bgPrompt = BACKGROUND_STYLES.find(b => b.id === selectedBg)?.prompt || '';
      const typoPrompt = TYPO_EFFECTS.find(t => t.id === selectedTypo)?.prompt || '';
      
      const result = await generateTypographyPoster(detectedText, bgPrompt, typoPrompt, aspectRatio);
      setResultImage(result);
      setOriginalResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal membuat desain.", progress: '' });
    }
  };

  const handleRestore = () => {
    if (originalResultImage) {
      setResultImage(originalResultImage);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `typo-design-${Date.now()}.png`;
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
                <Palette size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Typo Designer AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Poster Synthesis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Image Upload */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 1. Unggah Referensi
            </label>
            <ImageUploader 
              label="Pilih Foto Referensi" 
              image={sourceImage} 
              onImageSelect={handleImageUpload} 
              aspectRatio="9-16" 
              labelInside 
            />
          </div>

          {/* Text Input */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} className="text-slate-300" /> 2. Edit Teks
            </label>
            <textarea 
              value={detectedText}
              onChange={(e) => setDetectedText(e.target.value)}
              placeholder="Teks akan muncul di sini atau ketik manual..."
              className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[11px] font-bold text-slate-700 outline-none focus:border-teal-500 transition-all placeholder:text-slate-300 resize-none"
            />
          </div>

          {/* Background Style */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} className="text-slate-300" /> 3. Pilih Latar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_STYLES.map((b) => (
                <button 
                  key={b.id}
                  onClick={() => setSelectedBg(b.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${selectedBg === b.id ? 'scale-105 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  style={selectedBg === b.id ? { 
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: 'white'
                  } : {}}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-[9px] font-black uppercase text-center leading-tight">{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Typography Effect */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-slate-300" /> 4. Pilih Efek Teks
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPO_EFFECTS.map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setSelectedTypo(t.id)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col gap-1 ${selectedTypo === t.id ? 'scale-105 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  style={selectedTypo === t.id ? { 
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: 'white'
                  } : {}}
                >
                  <span className="text-[10px] font-black uppercase leading-tight">{t.name}</span>
                  <span className={`text-[7px] font-bold uppercase ${selectedTypo === t.id ? 'text-white/60' : 'opacity-60'}`}>Stroke + Shadow</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 5. Pilih Aspek Rasio
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
              disabled={processing.isProcessing || !detectedText}
              className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ backgroundColor: processing.isProcessing || !detectedText ? undefined : primaryColor }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processing.isProcessing ? (
                <span className="relative z-10">RENDERING...</span>
              ) : (
                <span className="text-lg relative z-10">RENDER POSTER</span>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Poster
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
                    <img src={sourceImage!} className="absolute inset-0 w-full h-full object-cover grayscale opacity-30" alt="Original" />
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
            <div className="grid grid-cols-5 gap-3 max-w-[320px] mx-auto">
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
                onClick={handleRestore}
                disabled={!resultImage || processing.isProcessing || resultImage === originalResultImage}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing || resultImage === originalResultImage
                    ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                style={{ color: primaryColor }}
                title="Restore"
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Poster</h2>
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

export default GuberTypo;
