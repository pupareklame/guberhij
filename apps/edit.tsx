
/**
 * [INTEGRITY-CHECK]: 0x65646974
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, Download, RefreshCw, Sparkles, Image as ImageIcon, Zap, X, Check, Scissors, Type, Layers, Wand2, Eye, Recycle, Brush, Eraser, Minus, Plus, ArrowLeft, ArrowRight, Trash2, ArrowUpCircle, Maximize } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { genericImageEdit, composeImages, upscaleImage, inpaintImage } from '../services/edit';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';
import { GoogleGenAI } from "@google/genai";

const GuberEdit: React.FC = () => {
  const { primaryColor } = useTheme();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
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
  const brushOpacity = 0.6; // 60% opacity as requested
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskData, setMaskData] = useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [brushMode, setBrushMode] = useState<'PAINT' | 'ERASE'>('PAINT');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
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
          { val: 8/16, str: '8:16' },
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
    { label: '8:16', value: '8:16', class: 'aspect-[8/16]' },
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
    setBeforeImage(resultImage);
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
      const { width, height, x, y } = croppedAreaPixels;
      
      // Crop Result Image
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCropping(false);
        return;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      setResultImage(canvas.toDataURL('image/png'));

      // Also crop the before image so the slider stays aligned
      if (beforeImage) {
        const bImg = await createImage(beforeImage);
        const bCanvas = document.createElement('canvas');
        const bCtx = bCanvas.getContext('2d');
        if (bCtx) {
          bCanvas.width = width; bCanvas.height = height;
          bCtx.drawImage(bImg, x, y, width, height, 0, 0, width, height);
          setBeforeImage(bCanvas.toDataURL('image/png'));
        }
      }

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
    setBeforeImage(null);
    setSourceImage2(null);
    setEditPrompt('');
    setResultImage(null);
    setInitialResultImage(null);
    setSliderPos(50);
    clearCanvas();
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  return (
    <div className="h-screen bg-slate-50/50 overflow-hidden">
      <div className="max-w-2xl lg:max-w-7xl mx-auto h-full bg-white flex flex-col border-x border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Edit3 size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">EDIT FOTO AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Manipulation Synthesis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 flex-1 overflow-y-auto lg:overflow-hidden custom-scrollbar">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:h-full lg:overflow-hidden">
            {/* Column 1: Mode & Source Image */}
            <div className="lg:col-span-3 space-y-6 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar">
              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-slate-300" /> 1. Mode Edit
                </label>
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
                    <Brush size={14} /> Brush
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
                    <Wand2 size={14} /> Global
                  </button>
                </div>
              </div>

              {/* Source Image */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> 2. Foto Utama
                  </label>
                  {sourceImage && (
                    <button 
                      onClick={handleResetAll}
                      className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                      title="Reset Semua"
                    >
                      <Trash2 size={12} /> Reset
                    </button>
                  )}
                </div>
                <div className={`relative w-[80%] lg:w-full mr-auto lg:mx-auto ${ratios.find(r => r.value === aspectRatio)?.class || 'aspect-[9/16]'} bg-slate-100 rounded-[32px] overflow-hidden group/canvas transition-all duration-500 shadow-inner`} ref={containerRef}>
                  <ImageUploader 
                    label="Pilih Foto Utama" 
                    image={sourceImage} 
                    onImageSelect={async (img) => { 
                      setSourceImage(img); 
                      setBeforeImage(img);
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
                </div>
              </div>
            </div>

            {/* Column 2: Controls & Prompt */}
            <div className="lg:col-span-3 space-y-6 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar">
              {/* Custom Object */}
              {editMode === 'BRUSH' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={14} className="text-slate-300" /> 3. Objek Kustom
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
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">
                          * Objek ini akan ditempatkan pada area yang di-brush.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Brush Controls */}
              {sourceImage && editMode === 'BRUSH' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Brush size={12} className="text-slate-300" /> 4. Brush Settings
                  </label>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <button 
                          onClick={undo}
                          disabled={historyStep < 0}
                          className={`p-2 rounded-lg transition-all ${historyStep < 0 ? 'opacity-30' : 'bg-white shadow-sm hover:bg-slate-50'}`}
                          style={{ color: historyStep >= 0 ? primaryColor : undefined }}
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button 
                          onClick={redo}
                          disabled={historyStep >= history.length - 1}
                          className={`p-2 rounded-lg transition-all ${historyStep >= history.length - 1 ? 'opacity-30' : 'bg-white shadow-sm hover:bg-slate-50'}`}
                          style={{ color: historyStep < history.length - 1 ? primaryColor : undefined }}
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setBrushMode('PAINT')} 
                          className={`p-2 rounded-lg transition-all ${brushMode === 'PAINT' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                          style={{ color: brushMode === 'PAINT' ? primaryColor : undefined }}
                        >
                          <Brush size={14} />
                        </button>
                        <button 
                          onClick={() => setBrushMode('ERASE')} 
                          className={`p-2 rounded-lg transition-all ${brushMode === 'ERASE' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                          style={{ color: brushMode === 'ERASE' ? primaryColor : undefined }}
                        >
                          <Eraser size={14} />
                        </button>
                        <button 
                          onClick={clearCanvas} 
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>

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

              {/* Prompt Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Wand2 size={14} className="text-slate-300" /> {editMode === 'BRUSH' ? '5.' : '3.'} Neural Prompting
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
                    ? "Deskripsikan perubahan pada area brush..." 
                    : "Deskripsikan perubahan global..."}
                  className="w-full h-24 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[11px] font-bold text-slate-700 outline-none focus:border-slate-200 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Maximize size={12} className="text-slate-300" /> {editMode === 'BRUSH' ? '6.' : '4.'} Aspek Rasio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all aspect-square ${
                        aspectRatio === r.value 
                          ? 'scale-105 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                        color: aspectRatio === r.value ? 'white' : undefined,
                        borderColor: aspectRatio === r.value ? primaryColor : undefined,
                      }}
                    >
                      <span className="text-[8px] font-black">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !sourceImage}
                  className="w-full disabled:bg-slate-300 text-white py-4 rounded-[24px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg"
                  style={{ backgroundColor: processing.isProcessing || !sourceImage ? undefined : primaryColor }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  {processing.isProcessing ? (
                    <span className="relative z-10 text-xs uppercase">Transforming...</span>
                  ) : (
                    <span className="text-sm relative z-10 flex items-center gap-2">
                      <Sparkles size={16} /> RUN AI EDITOR
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Column 3: Result Section */}
            <div className="lg:col-span-6 space-y-4 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:flex lg:flex-col lg:justify-between lg:overflow-hidden">
              <div className="space-y-6 lg:h-full lg:flex lg:flex-col lg:justify-between">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Hasil Transformasi
                  </label>
                </div>
                
                <div 
                  className={`w-full mx-auto bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner lg:flex-1 lg:h-0 lg:w-full lg:max-h-[calc(100vh-200px)] lg:w-auto ${
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
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-sm">
                        <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">{processing.progress}</p>
                      </motion.div>
                    ) : resultImage ? (
                      <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative">
                        {/* BEFORE/AFTER SLIDER */}
                        <div className="absolute inset-0">
                          <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                        </div>
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                          <img src={beforeImage!} alt="Original" className="w-full h-full object-cover" />
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
                          Original
                        </div>
                        <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest z-30">
                          AI Edit
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
                <div className="grid grid-cols-6 gap-3 w-full mx-auto pt-4 shrink-0">
                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                    title="Preview"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => setIsCropping(true)}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                    title="Crop"
                  >
                    <Scissors size={20} />
                  </button>
                  <button
                    onClick={handleSharpen}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                    title="Tajamkan"
                  >
                    <Zap size={20} />
                  </button>
                  <button
                    onClick={handleSetAsSource}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                    title="Jadikan Sumber"
                  >
                    <ArrowUpCircle size={20} />
                  </button>
                  <button
                    onClick={handleRestore}
                    disabled={!resultImage || processing.isProcessing || resultImage === initialResultImage}
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                    title="Restore"
                  >
                    <Recycle size={20} />
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!resultImage || processing.isProcessing}
                    className="py-4 rounded-2xl border-2 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                    style={{ 
                      backgroundColor: (!resultImage || processing.isProcessing) ? '#cbd5e1' : primaryColor,
                      borderColor: (!resultImage || processing.isProcessing) ? '#cbd5e1' : primaryColor
                    }}
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
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
          </div>
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
