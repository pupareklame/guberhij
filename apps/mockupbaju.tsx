
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shirt, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Wand2, 
  Image as ImageIcon, 
  Layout, 
  Trash2, 
  Zap, 
  Check, 
  Hand,
  Store,
  Brush,
  Eraser,
  ArrowLeft,
  ArrowRight,
  Edit3,
  Scissors,
  Eye,
  Layers,
  X
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { generateMockupBaju } from '../services/mockupbaju';
import { genericImageEdit, inpaintImage, upscaleImage } from '../services/edit';
import { MockupBajuConfig } from '../types';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberMockupBaju: React.FC = () => {
  const { primaryColor } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [sliderPosFix, setSliderPosFix] = useState(50);

  // Fix/Edit States
  const [showFix, setShowFix] = useState(false);
  const [fixPrompt, setFixPrompt] = useState('');
  const [fixResult, setFixResult] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixEditMode, setFixEditMode] = useState<'BRUSH' | 'NO_BRUSH'>('BRUSH');
  const [brushSize, setBrushSize] = useState(30);
  const [brushMode, setBrushMode] = useState<'PAINT' | 'ERASE'>('PAINT');
  const [maskData, setMaskData] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const lastPointRef = React.useRef<{ x: number, y: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Crop & Action States
  const [isCropping, setIsCropping] = useState(false);
  const [croppingTarget, setCroppingTarget] = useState<'RESULT' | 'FIX_RESULT' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showPreviewResult, setShowPreviewResult] = useState(false);
  const [showPreviewFix, setShowPreviewFix] = useState(false);

  const [config, setConfig] = useState<MockupBajuConfig>({
    itemType: 'ATASAN',
    boutiqueStyle: 'MINIMALIS',
    handType: 'TANGAN_KANAN',
    aspectRatio: '9:16',
    brandName: '',
  });

  const itemTypes = [
    { label: 'Atasan', value: 'ATASAN' },
    { label: 'Bawahan', value: 'BAWAHAN' },
    { label: 'Dress', value: 'DRESS' },
    { label: 'Setelan', value: 'SETELAN' },
  ];

  const boutiqueStyles = [
    { label: 'Minimalis', value: 'MINIMALIS' },
    { label: 'Mewah', value: 'MEWAH' },
    { label: 'Modern', value: 'MODERN' },
    { label: 'Vintage', value: 'VINTAGE' },
    { label: 'Industrial', value: 'INDUSTRIAL' },
    { label: 'Bohemian', value: 'BOHEMIAN' },
    { label: 'Classic', value: 'CLASSIC' },
    { label: 'Streetwear', value: 'STREETWEAR' },
  ];

  const handTypes = [
    { label: 'Tangan Kanan', value: 'TANGAN_KANAN' },
    { label: 'Tangan Kiri', value: 'TANGAN_KIRI' },
  ];

  // Canvas Logic
  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && canvasSize.width > 0 && canvasSize.height > 0) {
      const ctx = canvas.getContext('2d');
      const tempImage = canvas.toDataURL();
      const dpr = 2;
      canvas.width = canvasSize.width * dpr;
      canvas.height = canvasSize.height * dpr;
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = tempImage;
    }
  }, [canvasSize.width, canvasSize.height, result]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    const dpr = 2;
    const scaledX = x * dpr;
    const scaledY = y * dpr;
    lastPointRef.current = { x: scaledX, y: scaledY };
    setIsDrawing(true);
    setMousePos({ x, y });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, (brushSize * dpr) / 2, 0, Math.PI * 2);
    if (brushMode === 'ERASE') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ff0000';
      ctx.globalAlpha = 1.0;
    }
    ctx.fill();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    setMousePos({ x, y });
    if (!isDrawing || !lastPointRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = 2;
    const currX = x * dpr;
    const currY = y * dpr;
    ctx.lineWidth = brushSize * dpr; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (brushMode === 'ERASE') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#ff0000';
      ctx.fillStyle = '#ff0000';
      ctx.globalAlpha = 1.0;
    }
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currX, currY);
    ctx.stroke();
    lastPointRef.current = { x: currX, y: currY };
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setMaskData(dataUrl);
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(dataUrl);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyStep < 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prevStep = historyStep - 1;
    setHistoryStep(prevStep);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (prevStep >= 0) {
      const img = new Image();
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[prevStep];
      setMaskData(history[prevStep]);
    } else {
      setMaskData(null);
    }
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const nextStep = historyStep + 1;
    setHistoryStep(nextStep);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[nextStep];
    setMaskData(history[nextStep]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setMaskData(null);
      setHistory([]);
      setHistoryStep(-1);
    }
  };

  const handleFix = async () => {
    if (!result || !fixPrompt) return;
    try {
      setIsFixing(true);
      setError(null);
      let res;
      if (fixEditMode === 'BRUSH') {
        if (!maskData) throw new Error("Tandai area yang ingin diperbaiki dengan brush.");
        
        // Prepare binary mask
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Canvas tidak ditemukan.");
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error("Gagal membuat context canvas.");
        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
          } else {
            data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
          }
        }
        tempCtx.putImageData(imageData, 0, 0);
        const finalMask = tempCanvas.toDataURL('image/png');

        // Align source image to canvas size (object-cover)
        const alignSource = async (): Promise<string> => {
          const alignCanvas = document.createElement('canvas');
          alignCanvas.width = canvas.width;
          alignCanvas.height = canvas.height;
          const alignCtx = alignCanvas.getContext('2d');
          if (!alignCtx) return result;
          const img = new Image();
          await new Promise((resolve) => { img.onload = resolve; img.src = result; });
          const containerRatio = alignCanvas.width / alignCanvas.height;
          const imgRatio = img.width / img.height;
          let dw, dh, ox, oy;
          if (imgRatio > containerRatio) {
            dh = alignCanvas.height;
            dw = img.width * (alignCanvas.height / img.height);
            ox = (alignCanvas.width - dw) / 2;
            oy = 0;
          } else {
            dw = alignCanvas.width;
            dh = img.height * (alignCanvas.width / img.width);
            ox = 0;
            oy = (alignCanvas.height - dh) / 2;
          }
          alignCtx.fillStyle = 'black';
          alignCtx.fillRect(0, 0, alignCanvas.width, alignCanvas.height);
          alignCtx.drawImage(img, ox, oy, dw, dh);
          return alignCanvas.toDataURL('image/png');
        };

        const alignedResult = await alignSource();
        res = await inpaintImage(alignedResult, finalMask, fixPrompt, null, config.aspectRatio);
      } else {
        res = await genericImageEdit(result, fixPrompt, config.aspectRatio);
      }
      setFixResult(res);
      setSliderPosFix(50);
    } catch (err: any) {
      setError(err.message || "Gagal memperbaiki gambar.");
    } finally {
      setIsFixing(false);
    }
  };

  const handleSharpen = async (target: 'RESULT' | 'FIX_RESULT') => {
    const imgToSharpen = target === 'RESULT' ? result : fixResult;
    if (!imgToSharpen) return;

    try {
      if (target === 'RESULT') setIsProcessing(true);
      else setIsFixing(true);
      setError(null);

      const sharpened = await upscaleImage(imgToSharpen, config.aspectRatio);
      if (target === 'RESULT') setResult(sharpened);
      else setFixResult(sharpened);
    } catch (err: any) {
      setError(err.message || "Gagal menajamkan gambar.");
    } finally {
      if (target === 'RESULT') setIsProcessing(false);
      else setIsFixing(false);
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!croppingTarget || !croppedAreaPixels) return;
    const imgUrl = croppingTarget === 'RESULT' ? result : fixResult;
    if (!imgUrl) return;

    try {
      const img = new Image();
      await new Promise((resolve) => { img.onload = resolve; img.src = imgUrl; });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      const croppedBase64 = canvas.toDataURL('image/png');
      
      if (croppingTarget === 'RESULT') setResult(croppedBase64);
      else setFixResult(croppedBase64);
      
      setIsCropping(false);
      setCroppingTarget(null);
    } catch (err) {
      console.error(err);
      setError('Gagal memotong gambar.');
    }
  };

  const downloadImage = (img: string | null) => {
    if (!img) return;
    const link = document.createElement('a');
    link.href = img;
    link.download = `guber-mockup-${Date.now()}.png`;
    link.click();
  };

  const processImage = async () => {
    if (!image) return;
    try {
      setIsProcessing(true);
      setError(null);
      const res = await generateMockupBaju(image, config);
      setResult(res);
      setSliderPos(50);
    } catch (err: any) {
      setError(err.message || "Gagal memproses mockup baju.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl lg:max-w-7xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
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
                <Shirt size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">MOCKUP BAJU</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Boutique Display Synthesis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> 1. Upload Foto Pakaian
                </label>
                <ImageUploader 
                  label="Pilih Foto Pakaian" 
                  image={image} 
                  onImageSelect={(img) => { setImage(img); setResult(null); setError(null); }} 
                  onClear={() => setImage(null)}
                  aspectRatio="9-16" 
                  labelInside
                />
              </div>

              {/* Configuration */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Zap size={12} /> Nama Merek (Neon Sign)
                  </label>
                  <input 
                    type="text"
                    placeholder="Contoh: Guber Son"
                    value={config.brandName}
                    onChange={(e) => setConfig({...config, brandName: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-200 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Shirt size={12} /> Jenis Pakaian
                    </label>
                    <select 
                      value={config.itemType}
                      onChange={(e) => setConfig({...config, itemType: e.target.value as any})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-200 transition-all"
                    >
                      {itemTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Store size={12} /> Gaya Butik
                    </label>
                    <select 
                      value={config.boutiqueStyle}
                      onChange={(e) => setConfig({...config, boutiqueStyle: e.target.value as any})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-200 transition-all"
                    >
                      {boutiqueStyles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Hand size={12} /> Posisi Tangan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {handTypes.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setConfig({...config, handType: t.value as any})}
                        className={`py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${
                          config.handType === t.value 
                            ? 'text-white' 
                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200 hover:bg-white'
                        }`}
                        style={{
                          backgroundColor: config.handType === t.value ? primaryColor : undefined,
                          borderColor: config.handType === t.value ? primaryColor : undefined,
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layout size={14} className="text-slate-300" /> Pilih Aspek Rasio
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setConfig({...config, aspectRatio: ratio})}
                        className={`py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${
                          config.aspectRatio === ratio 
                            ? 'text-white' 
                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200 hover:bg-white'
                        }`}
                        style={{
                          backgroundColor: config.aspectRatio === ratio ? primaryColor : undefined,
                          borderColor: config.aspectRatio === ratio ? primaryColor : undefined,
                        }}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={processImage}
                disabled={!image || isProcessing}
                className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
                style={{ 
                  backgroundColor: !image || isProcessing ? undefined : primaryColor,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                {isProcessing ? (
                  <span className="relative z-10 flex items-center gap-2">
                    <RefreshCw size={18} className="animate-spin" />
                    SEDANG MEMPROSES...
                  </span>
                ) : (
                  <span className="text-lg relative z-10 flex items-center gap-2">
                    <Wand2 size={20} />
                    BUAT MOCKUP
                  </span>
                )}
              </button>
            </div>

            {/* Result Section */}
            <div className="space-y-4 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:sticky lg:top-8 self-start">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Mockup
                </label>
              </div>
              
              <div 
                className={`w-full max-w-[280px] lg:max-w-full mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 ${
                  config.aspectRatio === '1:1' ? 'aspect-square' :
                  config.aspectRatio === '3:4' ? 'aspect-[3/4]' :
                  config.aspectRatio === '4:3' ? 'aspect-[4/3]' :
                  config.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                  'aspect-[16/9]'
                }`}
                style={{ 
                  borderColor: result ? 'white' : `${primaryColor}40`,
                  backgroundColor: result ? 'white' : undefined
                }}
              >
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center z-30"
                    >
                      <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full relative select-none touch-none"
                    >
                      <img src={image!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
                      <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                        <img src={result} className="absolute inset-0 w-full h-full object-cover" alt="Result" />
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
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:scale-110 shadow-lg"
                          style={{ borderColor: primaryColor }}
                        >
                          <div className="flex gap-0.5">
                            <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                            <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[6px] font-black text-white uppercase tracking-widest pointer-events-none">Original</div>
                      <div className="absolute bottom-4 right-4 px-2 py-0.5 bg-white/40 backdrop-blur-md rounded-full text-[6px] font-black text-black uppercase tracking-widest pointer-events-none">Mockup</div>
                      
                      {/* Preview Overlay */}
                      <AnimatePresence>
                        {showPreviewResult && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 bg-black flex items-center justify-center"
                          >
                            <img src={result} className="w-full h-full object-contain" alt="Preview" />
                            <button 
                              onClick={() => setShowPreviewResult(false)}
                              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all"
                            >
                              <X size={20} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                        <Shirt size={32} className="text-slate-300" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest">Belum Ada Hasil</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-2 w-full max-w-[360px] lg:max-w-full mx-auto mt-8">
                <button
                  onClick={() => setShowPreviewResult(true)}
                  disabled={!result || isProcessing}
                  className="flex flex-col items-center justify-center p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-slate-200 transition-all disabled:opacity-30"
                  style={{ color: primaryColor }}
                >
                  <Eye size={18} />
                  <span className="text-[8px] font-black uppercase mt-1">Preview</span>
                </button>
                <button
                  onClick={() => { setIsCropping(true); setCroppingTarget('RESULT'); }}
                  disabled={!result || isProcessing}
                  className="flex flex-col items-center justify-center p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-slate-200 transition-all disabled:opacity-30"
                  style={{ color: primaryColor }}
                >
                  <Scissors size={18} />
                  <span className="text-[8px] font-black uppercase mt-1">Crop</span>
                </button>
                <button
                  onClick={() => handleSharpen('RESULT')}
                  disabled={!result || isProcessing}
                  className="flex flex-col items-center justify-center p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-slate-200 transition-all disabled:opacity-30"
                  style={{ color: primaryColor }}
                >
                  <Layers size={18} />
                  <span className="text-[8px] font-black uppercase mt-1">Tajamkan</span>
                </button>
                <button
                  onClick={() => downloadImage(result)}
                  disabled={!result || isProcessing}
                  className="flex flex-col items-center justify-center p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-slate-200 transition-all disabled:opacity-30"
                  style={{ color: primaryColor }}
                >
                  <Download size={18} />
                  <span className="text-[8px] font-black uppercase mt-1">Simpan</span>
                </button>
              </div>

              <div className="flex justify-center gap-2 w-full max-w-[360px] lg:max-w-full mx-auto mt-2">
                <button
                  onClick={() => setResult(null)}
                  disabled={!result || isProcessing}
                  className={`w-full flex items-center justify-center p-4 bg-white border-2 rounded-2xl transition-all ${
                    !result || isProcessing 
                      ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                  style={{ color: primaryColor }}
                >
                  <Trash2 size={20} className="mr-2" />
                  <span className="text-xs font-black uppercase tracking-widest">Hapus Hasil</span>
                </button>
              </div>

              {/* Fix Feature Switch */}
              {result && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Edit3 size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Perbaiki Hasil</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Edit bagian yang kurang pas</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowFix(!showFix)}
                    className={`w-10 h-5 rounded-full transition-all relative ${showFix ? 'bg-teal-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showFix ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              )}

              {/* Fix Section */}
              <AnimatePresence>
                {showFix && result && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 pt-6 border-t border-slate-100 mt-6 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors size={14} className="text-teal-500" />
                      <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Editor Perbaikan</h3>
                    </div>

                    {/* Mode Selection */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                      <button
                        onClick={() => setFixEditMode('BRUSH')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          fixEditMode === 'BRUSH' ? 'bg-white shadow-sm' : 'text-slate-400'
                        }`}
                        style={{ color: fixEditMode === 'BRUSH' ? primaryColor : undefined }}
                      >
                        <Brush size={14} /> Pakai Brush
                      </button>
                      <button
                        onClick={() => setFixEditMode('NO_BRUSH')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          fixEditMode === 'NO_BRUSH' ? 'bg-white shadow-sm' : 'text-slate-400'
                        }`}
                        style={{ color: fixEditMode === 'NO_BRUSH' ? primaryColor : undefined }}
                      >
                        <Wand2 size={14} /> Tanpa Brush
                      </button>
                    </div>

                    {/* Canvas for Brush Mode */}
                    {fixEditMode === 'BRUSH' && (
                      <div className="space-y-4">
                        <div 
                          ref={containerRef}
                          className={`relative w-full bg-slate-100 rounded-[32px] overflow-hidden group/fix transition-all duration-500 ${
                            config.aspectRatio === '1:1' ? 'aspect-square' :
                            config.aspectRatio === '3:4' ? 'aspect-[3/4]' :
                            config.aspectRatio === '4:3' ? 'aspect-[4/3]' :
                            config.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                            'aspect-[16/9]'
                          }`}
                        >
                          <img src={result} className="absolute inset-0 w-full h-full object-cover" alt="To Fix" />
                          <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={(e) => { stopDrawing(e); setMousePos(null); }}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="absolute inset-0 w-full h-full cursor-none touch-none z-10"
                            style={{ opacity: 0.6 }}
                          />
                          
                          {/* Brush Cursor Preview */}
                          {mousePos && (
                            <div 
                              className="absolute pointer-events-none border-2 border-white shadow-lg rounded-full -translate-x-1/2 -translate-y-1/2 z-20"
                              style={{
                                left: mousePos.x,
                                top: mousePos.y,
                                width: brushSize,
                                height: brushSize,
                                backgroundColor: brushMode === 'PAINT' ? '#ff0000' : 'rgba(255,255,255,0.5)',
                                opacity: 0.5
                              }}
                            />
                          )}
                        </div>

                        {/* Brush Controls */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brush Settings</span>
                            <div className="flex gap-2">
                              <button onClick={undo} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-50"><ArrowLeft size={14} /></button>
                              <button onClick={redo} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-50"><ArrowRight size={14} /></button>
                              <button onClick={() => setBrushMode('PAINT')} className={`p-2 rounded-lg ${brushMode === 'PAINT' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400'}`}><Brush size={14} /></button>
                              <button onClick={() => setBrushMode('ERASE')} className={`p-2 rounded-lg ${brushMode === 'ERASE' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400'}`}><Eraser size={14} /></button>
                              <button onClick={clearCanvas} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><RefreshCw size={14} /></button>
                            </div>
                          </div>
                          <input 
                            type="range" min="5" max="100" value={brushSize} 
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: primaryColor }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Fix Prompt */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instruksi Perbaikan</label>
                      <textarea
                        placeholder="Contoh: Rapikan bagian lengan, atau ganti warna hanger jadi emas..."
                        value={fixPrompt}
                        onChange={(e) => setFixPrompt(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-200 transition-all min-h-[80px] resize-none"
                      />
                    </div>

                    <button
                      onClick={handleFix}
                      disabled={isFixing || !fixPrompt}
                      className="w-full bg-teal-500 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                      {isFixing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isFixing ? 'MEMPERBAIKI...' : 'TERAPKAN PERBAIKAN'}
                    </button>

                    {/* Fix Result Display */}
                    <AnimatePresence>
                      {fixResult && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-4 pt-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Hasil Perbaikan</span>
                            <button 
                              onClick={() => { setResult(fixResult); setFixResult(null); setShowFix(false); clearCanvas(); }}
                              className="text-[9px] font-black text-white bg-teal-500 px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-teal-600 transition-all"
                            >
                              Gunakan Hasil Ini
                            </button>
                          </div>
                          <div className={`w-full rounded-[32px] overflow-hidden border-4 border-teal-500/20 relative group ${
                            config.aspectRatio === '1:1' ? 'aspect-square' :
                            config.aspectRatio === '3:4' ? 'aspect-[3/4]' :
                            config.aspectRatio === '4:3' ? 'aspect-[4/3]' :
                            config.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                            'aspect-[16/9]'
                          }`}>
                            <img src={result!} className="absolute inset-0 w-full h-full object-cover" alt="Before Fix" />
                            <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 0 0 ${sliderPosFix}%)` }}>
                              <img src={fixResult} className="absolute inset-0 w-full h-full object-cover" alt="After Fix" />
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={sliderPosFix} 
                              onChange={(e) => setSliderPosFix(Number(e.target.value))} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" 
                            />
                            <div className="absolute top-0 bottom-0 w-[2px] bg-white z-10 pointer-events-none" style={{ left: `${sliderPosFix}%` }}>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-xl flex items-center justify-center border-2 border-teal-500 shadow-lg">
                                <div className="flex gap-0.5">
                                  <div className="w-0.5 h-2 rounded-full bg-teal-500" />
                                  <div className="w-0.5 h-2 rounded-full bg-teal-500" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Preview Overlay Fix */}
                            <AnimatePresence>
                              {showPreviewFix && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 z-40 bg-black flex items-center justify-center"
                                >
                                  <img src={fixResult} className="w-full h-full object-contain" alt="Preview Fix" />
                                  <button 
                                    onClick={() => setShowPreviewFix(false)}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all"
                                  >
                                    <X size={20} />
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Action Buttons Fix */}
                          <div className="grid grid-cols-4 gap-2">
                            <button
                              onClick={() => setShowPreviewFix(true)}
                              className="flex flex-col items-center justify-center p-3 bg-teal-50 border-2 border-teal-100 rounded-2xl hover:border-teal-200 transition-all text-teal-600"
                            >
                              <Eye size={18} />
                              <span className="text-[8px] font-black uppercase mt-1">Preview</span>
                            </button>
                            <button
                              onClick={() => { setIsCropping(true); setCroppingTarget('FIX_RESULT'); }}
                              className="flex flex-col items-center justify-center p-3 bg-teal-50 border-2 border-teal-100 rounded-2xl hover:border-teal-200 transition-all text-teal-600"
                            >
                              <Scissors size={18} />
                              <span className="text-[8px] font-black uppercase mt-1">Crop</span>
                            </button>
                            <button
                              onClick={() => handleSharpen('FIX_RESULT')}
                              className="flex flex-col items-center justify-center p-3 bg-teal-50 border-2 border-teal-100 rounded-2xl hover:border-teal-200 transition-all text-teal-600"
                            >
                              <Layers size={18} />
                              <span className="text-[8px] font-black uppercase mt-1">Tajamkan</span>
                            </button>
                            <button
                              onClick={() => downloadImage(fixResult)}
                              className="flex flex-col items-center justify-center p-3 bg-teal-50 border-2 border-teal-100 rounded-2xl hover:border-teal-200 transition-all text-teal-600"
                            >
                              <Download size={18} />
                              <span className="text-[8px] font-black uppercase mt-1">Simpan</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-8 mb-8 bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest flex flex-col items-center gap-3"
            >
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cropper Modal */}
        <AnimatePresence>
          {isCropping && croppingTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                    <Scissors size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-sm">Potong Gambar</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Sesuaikan area yang diinginkan</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsCropping(false); setCroppingTarget(null); }}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 relative">
                <Cropper
                  image={(croppingTarget === 'RESULT' ? result : fixResult) || ''}
                  crop={crop}
                  zoom={zoom}
                  aspect={
                    config.aspectRatio === '1:1' ? 1 :
                    config.aspectRatio === '3:4' ? 3/4 :
                    config.aspectRatio === '4:3' ? 4/3 :
                    config.aspectRatio === '9:16' ? 9/16 :
                    16/9
                  }
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="p-8 bg-black/50 border-t border-white/10 space-y-6">
                <div className="flex items-center gap-6">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest min-w-[60px]">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: primaryColor }}
                  />
                </div>
                <button
                  onClick={handleCropSave}
                  className="w-full py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-white transition-all shadow-2xl shadow-white/10"
                  style={{ backgroundColor: primaryColor }}
                >
                  SIMPAN POTONGAN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuberMockupBaju;
