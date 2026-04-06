
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  User, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  X, 
  Info, 
  Scissors, 
  Zap, 
  Type, 
  PenTool, 
  Layout, 
  Layers, 
  Maximize, 
  FileText, 
  Sliders, 
  Box, 
  Feather, 
  Shapes, 
  Hash, 
  Type as WordmarkIcon, 
  Shield, 
  Droplets 
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { generateLogo, LogoStyle, LogoResult } from '../services/logo';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';
import Markdown from 'react-markdown';

const LOGO_STYLES: { name: LogoStyle; icon: React.ReactNode; description: string }[] = [
  { name: 'Minimalist', icon: <Feather size={16} />, description: 'Simpel, bersih, garis tipis, flat design.' },
  { name: 'Vintage', icon: <Box size={16} />, description: 'Retro, klasik, tekstur kertas tua, sepia.' },
  { name: '3D Modern', icon: <Maximize size={16} />, description: 'Futuristik, depth, glossy, metallic.' },
  { name: 'Abstrak', icon: <Shapes size={16} />, description: 'Unik, artistik, bentuk non-representasional.' },
  { name: 'Mascot', icon: <User size={16} />, description: 'Karakter, bold outlines, ekspresif.' },
  { name: 'Geometric', icon: <Hash size={16} />, description: 'Presisi, simetris, matematis, bentuk bersih.' },
  { name: 'Lettermark', icon: <Type size={16} />, description: 'Inisial brand, fokus pada modifikasi huruf.' },
  { name: 'Wordmark', icon: <WordmarkIcon size={16} />, description: 'Teks fokus, nama brand lengkap, tipografi unik.' },
  { name: 'Emblem', icon: <Shield size={16} />, description: 'Badge klasik, segel, perisai, gaya lencana.' },
  { name: 'Watercolor', icon: <Droplets size={16} />, description: 'Sapuan kuas cat air, tekstur basah, gradasi.' },
];

const ScribbleCanvas: React.FC<{ onSave: (data: string) => void; primaryColor: string }> = ({ onSave, primaryColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSave('');
  };

  return (
    <div className="space-y-2">
      <div className="relative aspect-square bg-white border-2 border-slate-100 rounded-2xl overflow-hidden cursor-crosshair shadow-inner">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button 
          onClick={clear}
          className="absolute bottom-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Gunakan jari atau mouse untuk mencoret logo</p>
    </div>
  );
};

const LogoStudio: React.FC = () => {
  const { primaryColor } = useTheme();
  const [mode, setMode] = useState<'TEXT' | 'UPLOAD' | 'MANUAL'>('TEXT');
  const [scribbleImage, setScribbleImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<LogoStyle>('Minimalist');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [count, setCount] = useState(1);
  const [sliderPositions, setSliderPositions] = useState<number[]>([50, 50, 50, 50]);
  
  const [results, setResults] = useState<LogoResult[]>([]);
  const [activeResultIdx, setActiveResultIdx] = useState(0);
  
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

  const handleProcess = async () => {
    const isScribbleMode = mode === 'UPLOAD' || mode === 'MANUAL';
    if (isScribbleMode && !scribbleImage) {
      setProcessing({ isProcessing: false, error: "Berikan coretan logo Anda.", progress: '' });
      return;
    }
    if (mode === 'TEXT' && !description) {
      setProcessing({ isProcessing: false, error: "Masukkan deskripsi logo.", progress: '' });
      return;
    }

    setResults([]);
    setProcessing({ isProcessing: true, error: null, progress: 'Generating Logos...' });

    try {
      const logoResults = await generateLogo({
        mode: isScribbleMode ? 'SCRIBBLE' : 'TEXT',
        scribbleImage: scribbleImage || undefined,
        description,
        style: selectedStyle,
        additionalInstructions,
        aspectRatio: aspectRatio as any,
        count
      });
      setResults(logoResults);
      setActiveResultIdx(0);
      setSliderPositions([50, 50, 50, 50]);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal membuat logo.", progress: '' });
    }
  };

  const handleDownload = (idx: number) => {
    const activeResult = results[idx];
    if (!activeResult) return;
    const link = document.createElement('a');
    link.href = activeResult.image;
    link.download = `logo-${selectedStyle}-${Date.now()}.png`;
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
    const activeResult = results[activeResultIdx];
    if (!activeResult || !croppedAreaPixels) return;
    try {
      const image = await createImage(activeResult.image);
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

      const newResults = [...results];
      newResults[activeResultIdx] = { ...activeResult, image: canvas.toDataURL('image/png') };
      setResults(newResults);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      setIsCropping(false);
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar.', progress: '' });
    }
  };

  const handleSharpen = async (idx: number) => {
    const activeResult = results[idx];
    if (!activeResult) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling Image...' });
    
    try {
      const sharpenedImage = await upscaleImage(activeResult.image, 'ULTRA_HD');
      const newResults = [...results];
      newResults[idx] = { ...activeResult, image: sharpenedImage };
      setResults(newResults);
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">LOGO STUDIO</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Professional AI Logo Generator</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layout size={14} className="text-slate-300" /> 1. Pilih Metode Input
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => { setMode('TEXT'); setScribbleImage(null); }}
                className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${mode === 'TEXT' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                style={{ color: mode === 'TEXT' ? primaryColor : undefined }}
              >
                <FileText size={12} /> Teks
              </button>
              <button
                onClick={() => { setMode('UPLOAD'); setScribbleImage(null); }}
                className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${mode === 'UPLOAD' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                style={{ color: mode === 'UPLOAD' ? primaryColor : undefined }}
              >
                <ImageIcon size={12} /> Unggah
              </button>
              <button
                onClick={() => { setMode('MANUAL'); setScribbleImage(null); }}
                className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${mode === 'MANUAL' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                style={{ color: mode === 'MANUAL' ? primaryColor : undefined }}
              >
                <PenTool size={12} /> Manual
              </button>
            </div>
          </div>

          {/* Input Content */}
          <AnimatePresence mode="wait">
            {mode === 'TEXT' ? (
              <motion.div
                key="text-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Type size={14} className="text-slate-300" /> 2. Deskripsi Logo
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Logo minimalis untuk kedai kopi bernama 'Kopi Senja'..."
                  className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-medium focus:border-slate-200 outline-none transition-all resize-none"
                />
              </motion.div>
            ) : mode === 'UPLOAD' ? (
              <motion.div
                key="upload-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> 2. Unggah Coretan
                </label>
                <ImageUploader
                  label="Pilih Coretan"
                  image={scribbleImage}
                  onImageSelect={setScribbleImage}
                  onClear={() => setScribbleImage(null)}
                  aspectRatio="square"
                  labelInside
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan coretan Anda (Opsional)..."
                  className="w-full h-20 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-medium focus:border-slate-200 outline-none transition-all resize-none"
                />
              </motion.div>
            ) : (
              <motion.div
                key="manual-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <PenTool size={14} className="text-slate-300" /> 2. Coret Manual
                </label>
                <ScribbleCanvas primaryColor={primaryColor} onSave={setScribbleImage} />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan coretan Anda (Opsional)..."
                  className="w-full h-20 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-medium focus:border-slate-200 outline-none transition-all resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Style Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} className="text-slate-300" /> 3. Gaya Logo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LOGO_STYLES.map((style) => (
                <button
                  key={style.name}
                  onClick={() => setSelectedStyle(style.name)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${selectedStyle === style.name ? 'bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}
                  style={{ borderColor: selectedStyle === style.name ? primaryColor : undefined }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: selectedStyle === style.name ? primaryColor : 'rgba(0,0,0,0.05)', color: selectedStyle === style.name ? 'white' : 'inherit' }}
                  >
                    {style.icon}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className={`text-[10px] font-black uppercase truncate ${selectedStyle === style.name ? '' : 'text-slate-600'}`} style={{ color: selectedStyle === style.name ? primaryColor : undefined }}>
                      {style.name}
                    </span>
                    <span className="text-[7px] text-slate-400 truncate">{style.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sliders size={14} className="text-slate-300" /> 4. Instruksi Tambahan
            </label>
            <input
              type="text"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Warna spesifik, elemen tertentu, dll..."
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-medium focus:border-slate-200 outline-none transition-all"
            />
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

          {/* Count Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={14} className="text-slate-300" /> 6. Jumlah Variasi
              </label>
              <span 
                className="text-[10px] font-black px-3 py-1 rounded-full text-white uppercase tracking-widest"
                style={{ backgroundColor: primaryColor }}
              >
                {count} Logo
              </span>
            </div>
            <div className="px-2">
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-800"
                style={{ accentColor: primaryColor }}
              />
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={processing.isProcessing || (mode === 'TEXT' ? !description : !scribbleImage)}
            className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-xl"
            style={{ 
              backgroundColor: processing.isProcessing || (mode === 'TEXT' ? !description : !scribbleImage) ? undefined : primaryColor,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            {processing.isProcessing ? (
              <span className="relative z-10 flex items-center gap-2">
                <RefreshCw size={18} className="animate-spin" /> SEDANG PROSES...
              </span>
            ) : (
              <span className="text-lg relative z-10 flex items-center gap-2">
                <Sparkles size={20} /> BUAT LOGO
              </span>
            )}
          </button>

            {/* Result Section */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Logo {results.length > 0 && `(${results.length})`}
                </label>
              </div>

              <div className={`grid gap-6 ${count > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                <AnimatePresence mode="popLayout">
                  {processing.isProcessing ? (
                    Array.from({ length: count }).map((_, idx) => (
                      <motion.div
                        key={`loading-${idx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`w-full bg-slate-50 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center p-12 min-h-[300px] ${
                          aspectRatio === '1:1' ? 'aspect-square' :
                          aspectRatio === '3:4' ? 'aspect-[3/4]' :
                          aspectRatio === '4:3' ? 'aspect-[4/3]' :
                          aspectRatio === '9:16' ? 'aspect-[9/16]' :
                          'aspect-[16/9]'
                        }`}
                        style={{ borderColor: `${primaryColor}40` }}
                      >
                        <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-center" style={{ color: primaryColor }}>
                          {processing.progress}
                        </p>
                      </motion.div>
                    ))
                  ) : results.length > 0 ? (
                    results.map((result, idx) => (
                      <motion.div
                        key={`result-card-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div 
                          className={`w-full bg-white border-2 rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-sm hover:shadow-md ${
                            activeResultIdx === idx ? 'ring-2 ring-offset-2' : ''
                          } ${
                            aspectRatio === '1:1' ? 'aspect-square' :
                            aspectRatio === '3:4' ? 'aspect-[3/4]' :
                            aspectRatio === '4:3' ? 'aspect-[4/3]' :
                            aspectRatio === '9:16' ? 'aspect-[9/16]' :
                            'aspect-[16/9]'
                          }`}
                          style={{ 
                            borderColor: activeResultIdx === idx ? primaryColor : 'white',
                            boxShadow: activeResultIdx === idx ? `0 0 0 2px white, 0 0 0 4px ${primaryColor}` : undefined
                          }}
                          onClick={() => setActiveResultIdx(idx)}
                        >
                          <div className="w-full h-full relative select-none touch-none">
                            {/* Before/After Slider */}
                            <div className="absolute inset-0 w-full h-full bg-slate-50 flex items-center justify-center">
                              {scribbleImage ? (
                                <img src={scribbleImage} className="w-full h-full object-contain opacity-30" alt="Original" />
                              ) : (
                                <Palette size={40} className="text-slate-200" />
                              )}
                            </div>
                            <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 0 0 ${sliderPositions[idx]}%)` }}>
                              <img src={result.image} className="absolute inset-0 w-full h-full object-contain" alt="Result" />
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={sliderPositions[idx]} 
                              onChange={(e) => {
                                const newPositions = [...sliderPositions];
                                newPositions[idx] = Number(e.target.value);
                                setSliderPositions(newPositions);
                              }} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" 
                            />
                            <div className="absolute top-0 bottom-0 w-[2px] bg-white z-10 pointer-events-none" style={{ left: `${sliderPositions[idx]}%` }}>
                              <div 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-lg flex items-center justify-center border-2 transition-transform group-hover:scale-110 shadow-lg"
                                style={{ borderColor: primaryColor }}
                              >
                                <div className="flex gap-0.5">
                                  <div className="w-0.5 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                                  <div className="w-0.5 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Individual Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveResultIdx(idx); setIsCropping(true); }}
                            className="flex items-center justify-center py-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-600"
                            title="Crop"
                          >
                            <Scissors size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSharpen(idx); }}
                            className="flex items-center justify-center py-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-600"
                            title="Tajamkan"
                          >
                            <Zap size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(idx); }}
                            className="flex items-center justify-center py-2.5 text-white rounded-xl transition-all shadow-sm active:scale-95"
                            style={{ backgroundColor: primaryColor }}
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    Array.from({ length: count }).map((_, idx) => (
                      <div key={`placeholder-${idx}`} className="flex flex-col items-center justify-center p-12 text-center opacity-40 bg-slate-50 border-2 border-dashed rounded-[32px]" style={{ borderColor: `${primaryColor}40` }}>
                        <div className="w-20 h-20 rounded-3xl bg-white shadow-inner flex items-center justify-center mb-4">
                          <Palette size={32} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Hasil {idx + 1}</p>
                      </div>
                    ))
                  )}
                </AnimatePresence>
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
        {isCropping && results[activeResultIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Logo</h2>
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
                image={results[activeResultIdx].image}
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

export default LogoStudio;
