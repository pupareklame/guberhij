
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  Maximize, 
  Zap,
  Layers,
  Palette,
  Check,
  X,
  Scissors,
  Camera
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useTheme } from '../src/contexts/ThemeContext';
import ImageUploader from '../components/ImageUploader';
import { ProcessingState, Jadi3DConfig } from '../types';
import { generate3DImage, upscaleImage } from '../services/jadi3d';

const Jadi3D: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  
  // Crop States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: ''
  });

  const [config, setConfig] = useState<Jadi3DConfig>({
    style: 'PIXAR',
    intensity: 100,
    aspectRatio: '1:1'
  });

  const [customStyleText, setCustomStyleText] = useState('');

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const styles = [
    { id: 'PIXAR', label: 'Pixar', icon: '🎬' },
    { id: 'DISNEY', label: 'Disney', icon: '✨' },
    { id: 'ANIME_3D', label: 'Anime 3D', icon: '🇯🇵' },
    { id: 'REALISTIC_3D', label: 'Realistic', icon: '📸' },
    { id: 'CLAYMATION', label: 'Claymation', icon: '🏺' },
    { id: 'TOY_STORY', label: 'Toy Story', icon: '🧸' },
    { id: 'KIDS_REAL', label: 'Gambar Anak Nyata', icon: '🖍️' },
    { id: 'CUSTOM', label: 'Kustom', icon: '🎨' },
  ];

  const handleGenerate = async () => {
    if (!sourceImage) {
      setProcessing({ isProcessing: false, error: 'Harap unggah gambar terlebih dahulu', progress: '' });
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'SEDANG RENDERING 3D..' });
    setResultImage(null);

    try {
      const finalConfig = {
        ...config,
        customStyle: config.style === 'CUSTOM' ? customStyleText : undefined
      };
      const result = await generate3DImage(sourceImage, finalConfig);
      setResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || 'Gagal merender 3D', progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `3d-render-${Date.now()}.png`;
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
      const sharpenedImage = await upscaleImage(resultImage, config.aspectRatio);
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">JADI 3D</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Guber Studio 3D Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* 1. Upload */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 1. Unggah Gambar 2D
            </label>
            <ImageUploader
              label="Klik atau seret gambar biasa"
              image={sourceImage}
              onImageSelect={(img) => { setSourceImage(img); setResultImage(null); }}
              aspectRatio="square"
              labelInside
            />
          </div>

          {/* 2. Style Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} className="text-slate-300" /> 2. Pilih Gaya 3D
            </label>
            <div className="grid grid-cols-4 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setConfig({ ...config, style: s.id as any })}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-300 min-h-[60px] ${
                    config.style === s.id 
                      ? 'scale-105' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                  style={{
                    backgroundColor: config.style === s.id ? primaryColor : undefined,
                    color: config.style === s.id ? 'white' : undefined,
                    borderColor: config.style === s.id ? primaryColor : undefined,
                  }}
                >
                  <span className="text-lg mb-1">{s.icon}</span>
                  <span className={`text-[7px] font-black uppercase tracking-tight text-center leading-tight ${config.style === s.id ? 'text-white' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
            {config.style === 'KIDS_REAL' && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="px-2">
                <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">
                  * Gaya ini menciptakan interpretasi fotorealistik dengan menjaga bentuk dasar yang "salah" secara anatomis, tidak proporsional, dan aneh dari gambar anak, namun merendernya dengan tekstur, detail, dan pencahayaan nyata.
                </p>
              </motion.div>
            )}
            {config.style === 'CUSTOM' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <textarea
                  value={customStyleText}
                  onChange={(e) => setCustomStyleText(e.target.value)}
                  placeholder="Deskripsikan gaya 3D kustom Anda..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none min-h-[80px] resize-none focus:border-primary/50"
                  style={{ color: primaryColor }}
                />
              </motion.div>
            )}
          </div>

          {/* 3. Intensity */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-slate-300" /> 3. Intensitas 3D
              </label>
              <span className="text-[10px] font-black px-3 py-1 rounded-full text-white uppercase tracking-widest transition-all duration-300" style={{ backgroundColor: primaryColor }}>{config.intensity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={config.intensity}
              onChange={(e) => setConfig({ ...config, intensity: parseInt(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: primaryColor, background: `color-mix(in srgb, ${primaryColor}, transparent 80%)` }}
            />
          </div>

          {/* 4. Aspect Ratio */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 4. Pilih Aspek Rasio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ratios.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setConfig({ ...config, aspectRatio: r.value as any })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                    config.aspectRatio === r.value 
                      ? 'scale-105' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                  style={{
                    backgroundColor: config.aspectRatio === r.value ? primaryColor : undefined,
                    color: config.aspectRatio === r.value ? 'white' : undefined,
                    borderColor: config.aspectRatio === r.value ? primaryColor : undefined,
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
            onClick={handleGenerate}
            disabled={processing.isProcessing || !sourceImage}
            className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
            style={{ 
              backgroundColor: processing.isProcessing || !sourceImage ? undefined : primaryColor,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            {processing.isProcessing ? (
              <span className="relative z-10">SEDANG RENDERING...</span>
            ) : (
              <span className="text-lg relative z-10">HASILKAN 3D</span>
            )}
          </button>

          {/* Result Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Render
              </label>
            </div>
            
            <div 
              className={`w-full max-w-[280px] mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 ${
                config.aspectRatio === '1:1' ? 'aspect-square' :
                config.aspectRatio === '3:4' ? 'aspect-[3/4]' :
                config.aspectRatio === '4:3' ? 'aspect-[4/3]' :
                config.aspectRatio === '9:16' ? 'aspect-[9/16]' :
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
                    <img src={sourceImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
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

            {/* Action Buttons */}
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil 3D</h2>
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
                aspect={config.aspectRatio === '1:1' ? 1 : config.aspectRatio === '3:4' ? 3/4 : config.aspectRatio === '4:3' ? 4/3 : config.aspectRatio === '9:16' ? 9/16 : 16/9}
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

export default Jadi3D;
