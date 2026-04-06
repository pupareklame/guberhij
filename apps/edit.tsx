
/**
 * [INTEGRITY-CHECK]: 0x65646974
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, Download, RefreshCw, Sparkles, Image as ImageIcon, Zap, X, Check, Scissors, Type, Layers, Wand2, Eye, Recycle, Brush, Eraser, Minus, Plus, ArrowLeft, ArrowRight, Trash2, ArrowUpCircle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { genericImageEdit, composeImages, upscaleImage, inpaintImage } from '../services/edit';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';
import { GoogleGenAI } from "@google/genai";

const GuberEdit: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImage2, setSourceImage2] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [showPreview, setShowPreview] = useState(false);
  const [editMode, setEditMode] = useState<'BRUSH' | 'NO_BRUSH'>('BRUSH');
  
  // Brush States
  const [brushSize, setBrushSize] = useState(20);
  const brushColor = '#ff0000'; // Pure red for maximum visibility
  const brushOpacity = 0.3; // 30% opacity as requested
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskData, setMaskData] = useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [brushMode, setBrushMode] = useState<'PAINT' | 'ERASE'>('PAINT');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mainFileInputRef = React.useRef<HTMLInputElement>(null);
  const customFileInputRef = React.useRef<HTMLInputElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const lastPointRef = React.useRef<{ x: number, y: number } | null>(null);
  
  // Undo/Redo States
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  const [showCustomObject, setShowCustomObject] = useState(false);
  
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const detectAspectRatio = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const targets = [
          { val: 1, str: '1:1' },
          { val: 3/4, str: '3:4' },
          { val: 4/3, str: '4:3' },
          { val: 9/16, str: '9:16' },
          { val: 16/9, str: '16:9' }
        ];
        const closest = targets.reduce((prev, curr) => 
          Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
        );
        resolve(closest.str);
      };
      img.src = base64;
    });
  };

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const handleGenerate = async () => {
    if (!sourceImage) {
      setProcessing(prev => ({ ...prev, error: "Unggah foto utama terlebih dahulu." }));
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Processing Transformation...' });
    setResultImage(null);
    setInitialResultImage(null);

    try {
      if (editMode === 'BRUSH') {
        if (!maskData) {
          throw new Error("Gunakan brush untuk menandai area yang ingin diubah.");
        }

        // 1. Prepare the aligned source image (matching the UI's object-cover crop)
        const getAlignedSourceImage = async (): Promise<string> => {
          const canvas = canvasRef.current;
          if (!canvas) return sourceImage;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return sourceImage;

          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = sourceImage;
          });

          // Calculate object-cover dimensions
          const containerRatio = tempCanvas.width / tempCanvas.height;
          const imgRatio = img.width / img.height;
          let drawWidth, drawHeight, offsetX, offsetY;

          if (imgRatio > containerRatio) {
            drawHeight = tempCanvas.height;
            drawWidth = img.width * (tempCanvas.height / img.height);
            offsetX = (tempCanvas.width - drawWidth) / 2;
            offsetY = 0;
          } else {
            drawWidth = tempCanvas.width;
            drawHeight = img.height * (tempCanvas.width / img.width);
            offsetX = 0;
            offsetY = (tempCanvas.height - drawHeight) / 2;
          }

          tempCtx.fillStyle = 'black'; // Background for any gaps
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
          return tempCanvas.toDataURL('image/png');
        };

        // 2. Generate a high-contrast binary mask (white on black)
        const generateBinaryMask = async (): Promise<string> => {
          const canvas = canvasRef.current;
          if (!canvas) return maskData;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return maskData;

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
          return tempCanvas.toDataURL('image/png');
        };

        const [alignedSource, finalMask] = await Promise.all([
          getAlignedSourceImage(),
          generateBinaryMask()
        ]);

        const result = await inpaintImage(alignedSource, finalMask, editPrompt, sourceImage2, aspectRatio);
        
        setResultImage(result);
        setInitialResultImage(result);
      } else {
        // NO BRUSH MODE - Global Edit
        const result = await genericImageEdit(sourceImage, editPrompt, aspectRatio);
        setResultImage(result);
        setInitialResultImage(result);
      }
      
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memproses gambar.", progress: '' });
    }
  };

  const handleRestore = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
    }
  };

  const handleSetAsSource = () => {
    if (!resultImage) return;
    setSourceImage(resultImage);
    setResultImage(null);
    setInitialResultImage(null);
    clearCanvas();
    setSliderPos(50);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `edit-foto-${Date.now()}.png`;
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

    // Check for API key selection for gemini-3.1-flash-image-preview
    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // After opening the dialog, we assume the user will select a key.
        // The instructions say to proceed to the app after triggering openSelectKey.
      }
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling Image to 4K...' });
    try {
      const sharpenedImage = await upscaleImage(resultImage, aspectRatio);
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.message || '';
      if (errorMsg.includes("Requested entity was not found.") && typeof (window as any).aistudio !== 'undefined') {
        await (window as any).aistudio.openSelectKey();
      }
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
    }
  };

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setSourceImage(base64);
        const detected = await detectAspectRatio(base64);
        setAspectRatio(detected);
        setResultImage(null);
        setInitialResultImage(null);
        clearCanvas();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage2(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!editPrompt.trim()) return;
    
    setProcessing(prev => ({ ...prev, isProcessing: true, progress: 'Enhancing prompt with AI...' }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Enhance this image editing prompt to be more detailed and professional for an AI inpainting model. The goal is to modify the area marked by a brush. Original prompt: "${editPrompt}". Return only the enhanced prompt text.`,
      });
      
      if (response.text) {
        setEditPrompt(response.text.trim());
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
    } finally {
      setProcessing(prev => ({ ...prev, isProcessing: false, progress: '' }));
    }
  };

  // Resize Observer for Canvas
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

  // Sync canvas resolution with display size when size changes
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && canvasSize.width > 0 && canvasSize.height > 0) {
      const ctx = canvas.getContext('2d');
      const tempImage = canvas.toDataURL();
      
      // Use a fixed DPI factor for internal resolution
      const dpr = 2;
      canvas.width = canvasSize.width * dpr;
      canvas.height = canvasSize.height * dpr;
      
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = tempImage;
    }
  }, [canvasSize.width, canvasSize.height, sourceImage]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    // Use consistent scaling
    const dpr = 2;
    const scaledX = x * dpr;
    const scaledY = y * dpr;

    lastPointRef.current = { x: scaledX, y: scaledY };
    setIsDrawing(true);
    setMousePos({ x, y });

    // Draw initial dot for "bulat" base and immediate feedback
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, (brushSize * dpr) / 2, 0, Math.PI * 2);
    if (brushMode === 'ERASE') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = brushColor;
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

    // Use consistent scaling to prevent distortion
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
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
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
      saveHistory(dataUrl);
    }
  };

  const saveHistory = (dataUrl: string) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep <= 0) {
      if (historyStep === 0) {
        clearCanvas();
        setHistoryStep(-1);
      }
      return;
    }
    const prevStep = historyStep - 1;
    setHistoryStep(prevStep);
    loadHistoryStep(history[prevStep]);
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const nextStep = historyStep + 1;
    setHistoryStep(nextStep);
    loadHistoryStep(history[nextStep]);
  };

  const loadHistoryStep = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
    setMaskData(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setMaskData(null);
      if (historyStep !== -1) {
        setHistory([]);
        setHistoryStep(-1);
      }
    }
  };

  const handleResetAll = () => {
    setSourceImage(null);
    setSourceImage2(null);
    setEditPrompt('');
    setResultImage(null);
    setInitialResultImage(null);
    setSliderPos(50);
    clearCanvas();
    setProcessing({ isProcessing: false, error: null, progress: '' });
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Edit3 size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Pro Photo Editor</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Manipulation Synthesis</p>
              </div>
            </div>
            <button 
              onClick={handleResetAll}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              title="Reset Semua"
            >
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Mode Selection Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setEditMode('BRUSH')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                editMode === 'BRUSH' 
                  ? 'bg-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{ color: editMode === 'BRUSH' ? primaryColor : undefined }}
            >
              <Brush size={14} /> Pakai Brush
            </button>
            <button
              onClick={() => setEditMode('NO_BRUSH')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                editMode === 'NO_BRUSH' 
                  ? 'bg-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{ color: editMode === 'NO_BRUSH' ? primaryColor : undefined }}
            >
              <Wand2 size={14} /> Tanpa Brush
            </button>
          </div>

          {/* Image Uploads */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> 1. Foto Utama
                </label>
                {sourceImage && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSourceImage(null); clearCanvas(); }}
                      className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                      title="Hapus Gambar"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                    <button 
                      onClick={() => mainFileInputRef.current?.click()}
                      className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-100 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                      title="Ganti Gambar"
                    >
                      <RefreshCw size={12} /> Ganti
                    </button>
                  </div>
                )}
              </div>
              <div className={`relative w-full max-w-[280px] mx-auto ${ratios.find(r => r.value === aspectRatio)?.class || 'aspect-[9/16]'} bg-slate-100 rounded-[32px] overflow-hidden group/canvas transition-all duration-500`} ref={containerRef}>
                <ImageUploader 
                  label="Pilih Foto Utama" 
                  image={sourceImage} 
                  onImageSelect={async (img) => { 
                    setSourceImage(img); 
                    const detected = await detectAspectRatio(img);
                    setAspectRatio(detected);
                    setResultImage(null); 
                    setInitialResultImage(null); 
                    clearCanvas(); 
                  }} 
                  aspectRatio={aspectRatio.replace(':', '-')} 
                  labelInside 
                />
                
                {/* Brush Canvas Overlay */}
                {sourceImage && editMode === 'BRUSH' && (
                  <>
                    <div className="absolute inset-0 z-10">
                      <div className="w-full h-full relative">
                          <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={(e) => { stopDrawing(e); setMousePos(null); }}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-full cursor-none touch-none"
                            style={{ opacity: brushOpacity }}
                          />
                        
                        {/* Brush Preview Circle */}
                        {mousePos && (
                          <div 
                            className="absolute pointer-events-none border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-full -translate-x-1/2 -translate-y-1/2 z-20 transition-transform duration-75"
                            style={{
                              left: mousePos.x,
                              top: mousePos.y,
                              width: brushSize,
                              height: brushSize,
                              backgroundColor: brushMode === 'PAINT' ? brushColor : 'rgba(255,255,255,0.3)',
                              opacity: brushMode === 'PAINT' ? brushOpacity : 0.7,
                              borderStyle: brushMode === 'ERASE' ? 'dashed' : 'solid',
                              borderColor: 'white',
                              boxShadow: `0 0 20px ${brushMode === 'PAINT' ? brushColor : 'white'}40`
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Hidden File Input for Source Image */}
                {sourceImage && (
                  <>
                    <input type="file" ref={mainFileInputRef} onChange={handleMainFileChange} className="hidden" accept="image/*" />
                  </>
                )}
              </div>
            </div>

            {editMode === 'BRUSH' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> 2. Objek Kustom (Opsional)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{showCustomObject ? 'ON' : 'OFF'}</span>
                    <button 
                      onClick={() => setShowCustomObject(!showCustomObject)}
                      className={`w-8 h-4 rounded-full transition-all relative ${showCustomObject ? 'bg-teal-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showCustomObject ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {showCustomObject && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                      <div className="relative group">
                        <ImageUploader label="Pilih Objek Kustom" image={sourceImage2} onImageSelect={setSourceImage2} onClear={() => setSourceImage2(null)} aspectRatio="square" labelInside />
                        
                        {sourceImage2 && (
                          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                            <button 
                              onClick={() => setSourceImage2(null)}
                              className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all"
                              title="Hapus Gambar"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button 
                              onClick={() => customFileInputRef.current?.click()}
                              className="w-8 h-8 bg-white text-slate-600 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-all"
                              title="Ganti Gambar"
                            >
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        )}
                        <input type="file" ref={customFileInputRef} onChange={handleCustomFileChange} className="hidden" accept="image/*" />
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">
                        * Jika diunggah, objek ini akan ditempatkan pada area yang di-brush.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* Brush Controls */}
            {sourceImage && editMode === 'BRUSH' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brush Settings</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={undo}
                      disabled={historyStep < 0}
                      className={`p-2 rounded-lg transition-all ${historyStep < 0 ? 'opacity-30' : 'bg-white shadow-sm hover:bg-slate-50'}`}
                      style={{ color: primaryColor }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button 
                      onClick={redo}
                      disabled={historyStep >= history.length - 1}
                      className={`p-2 rounded-lg transition-all ${historyStep >= history.length - 1 ? 'opacity-30' : 'bg-white shadow-sm hover:bg-slate-50'}`}
                      style={{ color: primaryColor }}
                    >
                      <ArrowRight size={16} />
                    </button>
                    <div className="w-[1px] h-8 bg-slate-200 mx-1" />
                    <button 
                      onClick={() => setBrushMode('PAINT')} 
                      className={`p-2 rounded-lg transition-all ${brushMode === 'PAINT' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                      style={{ color: brushMode === 'PAINT' ? primaryColor : undefined }}
                    >
                      <Brush size={16} />
                    </button>
                    <button 
                      onClick={() => setBrushMode('ERASE')} 
                      className={`p-2 rounded-lg transition-all ${brushMode === 'ERASE' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                      style={{ color: brushMode === 'ERASE' ? primaryColor : undefined }}
                    >
                      <Eraser size={16} />
                    </button>
                    <button 
                      onClick={clearCanvas} 
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Size</span>
                      <span>{brushSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(Number(e.target.value))} 
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: primaryColor }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Wand2 size={14} className="text-slate-300" /> 3. Neural Prompting
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={handleEnhancePrompt}
                  disabled={!editPrompt.trim() || processing.isProcessing}
                  className="p-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-all disabled:opacity-30"
                  title="AI Enhance Prompt"
                >
                  <Sparkles size={14} />
                </button>
                <button 
                  onClick={() => setEditPrompt('')}
                  className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                  title="Clear Prompt"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <textarea 
              value={editPrompt} 
              onChange={(e) => setEditPrompt(e.target.value)} 
              placeholder={editMode === 'BRUSH' 
                ? "Deskripsikan perubahan yang diinginkan pada area yang di-brush..." 
                : "Deskripsikan perubahan global yang diinginkan pada seluruh foto..."}
              className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[11px] font-bold text-slate-700 outline-none focus:border-teal-500 transition-all placeholder:text-slate-300 resize-none"
            />
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-300" /> 4. Pilih Aspek Rasio
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
              disabled={processing.isProcessing || !sourceImage}
              className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
              style={{ backgroundColor: processing.isProcessing || !sourceImage ? undefined : primaryColor }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {processing.isProcessing ? (
                <span className="relative z-10">TRANSFORMING...</span>
              ) : (
                <span className="text-lg relative z-10">RUN AI EDITOR</span>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-300" /> Hasil Transformasi
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
                    <img src={sourceImage!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
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
            <div className="grid grid-cols-6 gap-2 max-w-[360px] mx-auto">
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
                onClick={handleSetAsSource}
                disabled={!resultImage || processing.isProcessing}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing 
                    ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                style={{ color: primaryColor }}
                title="Jadikan Sumber"
              >
                <ArrowUpCircle size={20} />
              </button>
              <button
                onClick={handleRestore}
                disabled={!resultImage || processing.isProcessing || resultImage === initialResultImage}
                className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                  !resultImage || processing.isProcessing || resultImage === initialResultImage
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Transformasi</h2>
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

export default GuberEdit;
