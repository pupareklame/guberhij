
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Download, 
  Image as ImageIcon, 
  Zap, 
  X, 
  Check, 
  Scissors, 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  History,
  Trash2,
  Maximize2,
  Settings2,
  Eye,
  RefreshCw
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { upscaleImage } from '../services/framevideo';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberFrameVideo: React.FC = () => {
  const { primaryColor } = useTheme();
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [captures, setCaptures] = useState<string[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<string | null>(null);
  const [initialCapture, setInitialCapture] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const FRAME_STEP = 1 / 30;

  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  const clearAll = () => {
    if (videoSrc && videoSrc.startsWith('blob:')) URL.revokeObjectURL(videoSrc);
    setVideoSrc(null);
    setCaptures([]);
    setSelectedCapture(null);
    setInitialCapture(null);
    setCurrentTime(0);
    setDuration(0);
    setVideoAspectRatio(null);
    setIsCropping(false);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    setShowPreview(false);
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      clearAll();
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  const adjustTime = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      let newTime = video.currentTime + seconds;
      // Use 0.03 delta for better precision at the end of the video
      const maxTime = Math.max(0, video.duration - 0.03);
      newTime = Math.max(0, Math.min(newTime, maxTime));
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const jumpToTime = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      // Use 0.03 delta for better precision at the end of the video
      const safeTime = time >= video.duration ? Math.max(0, video.duration - 0.03) : time;
      video.currentTime = safeTime;
      setCurrentTime(safeTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.pause();
      // Use 0.03 delta for better precision at the end of the video
      const safeTime = time >= video.duration ? Math.max(0, video.duration - 0.03) : time;
      video.currentTime = safeTime;
      setCurrentTime(safeTime);
    }
  };

  const captureCurrentFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Nerve Capture...' });
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/png');
    setCaptures(prev => [dataUrl, ...prev].slice(0, 10));
    setSelectedCapture(dataUrl);
    setInitialCapture(dataUrl);
    
    setTimeout(() => {
      setProcessing({ isProcessing: false, error: null, progress: '' });
    }, 500);
  };

  const handleDownload = () => {
    if (!selectedCapture) return;
    const link = document.createElement('a');
    link.href = selectedCapture;
    link.download = `guber-frame-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    if (initialCapture) {
      setSelectedCapture(initialCapture);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
      image.crossOrigin = 'anonymous';
      image.src = url;
    });

  const handleCropSave = async () => {
    if (!selectedCapture || !croppedAreaPixels) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Neural Cropping...' });
    try {
      const image = await createImage(selectedCapture);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      
      const croppedDataUrl = canvas.toDataURL('image/png');
      setSelectedCapture(croppedDataUrl);
      setCaptures(prev => prev.map(c => c === selectedCapture ? croppedDataUrl : c));
      setIsCropping(false);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) { 
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar.', progress: '' });
      setIsCropping(false);
    }
  };

  const handleSharpen = async () => {
    if (!selectedCapture) return;
    setProcessing({ isProcessing: true, error: null, progress: 'HD Upscaling...' });
    try {
      const sharpenedImage = await upscaleImage(selectedCapture, videoAspectRatio ? videoAspectRatio.toFixed(2) : 'original');
      setSelectedCapture(sharpenedImage);
      setCaptures(prev => prev.map(c => c === selectedCapture ? sharpenedImage : c));
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden">
      <div className="max-w-2xl lg:max-w-full mx-auto lg:h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        
        {/* Header - Mobile Only */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Video size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase text-pretty">FRAME MASTER</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Capture Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* Column 1: Video Import */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
               <div className="flex-1 flex flex-col min-h-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Video size={14} className="text-slate-300" /> 1. Video Source
                  </label>
                  
                  <div 
                    className="flex-1 min-h-[300px] lg:min-h-0 bg-slate-50 border-2 border-dashed rounded-[32px] overflow-hidden relative group transition-all duration-500 shadow-inner flex items-center justify-center"
                    style={{ borderColor: `${primaryColor}40` }}
                  >
                    {!videoSrc ? (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-slate-100/50 transition-all p-6 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-lg border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                          <img 
                            src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
                            className={`w-10 h-10 object-contain ${processing.isProcessing ? 'animate-spin' : ''}`} 
                            alt="Logo" 
                          />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>Pilih Video</span>
                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                      </label>
                    ) : (
                      <div className="w-full h-full relative">
                        <video 
                          ref={videoRef} 
                          src={videoSrc} 
                          className="w-full h-full object-contain bg-black rounded-[28px]" 
                          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                          onSeeked={(e) => setCurrentTime(e.currentTarget.currentTime)}
                          onLoadedMetadata={(e) => {
                            setDuration(e.currentTarget.duration);
                            setVideoAspectRatio(e.currentTarget.videoWidth / e.currentTarget.videoHeight);
                          }}
                          crossOrigin="anonymous" 
                          playsInline
                          muted
                        />
                        <button 
                          onClick={clearAll}
                          className="absolute top-4 right-4 p-2 bg-white/90 text-rose-500 rounded-full shadow-lg hover:bg-rose-500 hover:text-white transition-all z-10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Column 2: Navigasi & Capture */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
               {videoSrc && (
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex-1 flex flex-col gap-4 min-h-0"
                 >
                    {/* Step 2: Controls */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Settings2 size={14} className="text-slate-300" /> 2. Navigasi
                      </label>
                      
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Posisi</span>
                          <span style={{ color: primaryColor }}>{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
                        </div>
                        
                        <input 
                          type="range" 
                          min={0} 
                          max={duration || 0} 
                          step={0.001} 
                          value={currentTime} 
                          onChange={handleSeek}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          style={{ accentColor: primaryColor }}
                        />

                        <div className="grid grid-cols-5 gap-1">
                          <button 
                            onClick={() => adjustTime(-1)} 
                            className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center justify-center group"
                            style={{ color: primaryColor }}
                          >
                            <span className="text-[10px] font-black opacity-80 group-hover:opacity-100">-1s</span>
                          </button>
                          <button 
                            onClick={() => adjustTime(-FRAME_STEP)} 
                            className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center justify-center group"
                            style={{ color: primaryColor }}
                          >
                            <ChevronLeft size={16} className="opacity-80 group-hover:opacity-100" />
                          </button>
                          <button 
                            onClick={() => adjustTime(FRAME_STEP)} 
                            className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center justify-center group"
                            style={{ color: primaryColor }}
                          >
                            <ChevronRight size={16} className="opacity-80 group-hover:opacity-100" />
                          </button>
                          <button 
                            onClick={() => adjustTime(1)} 
                            className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center justify-center group"
                            style={{ color: primaryColor }}
                          >
                            <span className="text-[10px] font-black opacity-80 group-hover:opacity-100">+1s</span>
                          </button>
                          <button 
                            onClick={() => jumpToTime(duration - 0.06)} 
                            className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center justify-center group"
                            style={{ color: primaryColor }}
                            title="Jump to last frame (-0.06s)"
                          >
                            <ChevronsRight size={16} className="opacity-80 group-hover:opacity-100" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Capture History */}
                    <div className="flex-1 flex flex-col min-h-0 min-h-[150px]">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <History size={14} className="text-slate-300" /> 3. Riwayat Capture
                      </label>
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl p-4 overflow-y-auto custom-scrollbar">
                        {captures.length > 0 ? (
                           <div className="grid grid-cols-3 gap-2">
                              {captures.map((cap, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedCapture(cap)}
                                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                    selectedCapture === cap ? 'scale-95 shadow-sm' : 'border-transparent'
                                  }`}
                                  style={{ borderColor: selectedCapture === cap ? primaryColor : 'transparent' }}
                                >
                                  <img src={cap} className="w-full h-full object-cover" alt={`Capture ${idx}`} />
                                </button>
                              ))}
                           </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-4">
                             <ImageIcon size={24} className="mb-2" />
                             <p className="text-[8px] font-black uppercase tracking-widest">Belum Ada Capture</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={captureCurrentFrame}
                      disabled={processing.isProcessing || !videoSrc}
                      className="w-full py-4 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Camera size={16} />
                      <span>CAPTURE FRAME</span>
                    </button>
                 </motion.div>
               )}
            </div>

            {/* Column 3: Result Section */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
               <div className="flex items-center justify-between shrink-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Hasil Frame
                  </label>
               </div>

               <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                  <div 
                    className="bg-slate-50 border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner w-full h-auto max-w-full max-h-full"
                    style={{ 
                      borderColor: selectedCapture ? 'white' : `${primaryColor}40`,
                      backgroundColor: selectedCapture ? 'white' : undefined,
                      aspectRatio: videoAspectRatio ? videoAspectRatio : '1/1'
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {processing.isProcessing ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-sm"
                        >
                          <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">{processing.progress}</p>
                        </motion.div>
                      ) : selectedCapture ? (
                        <motion.div
                          key="result"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full h-full relative"
                        >
                          <img src={selectedCapture} alt="Selected Capture" className="w-full h-full object-cover" />
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                          <div className="w-20 h-20 rounded-[40px] bg-slate-100 flex items-center justify-center mb-4">
                            <img 
                              src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
                              className={`w-12 h-12 object-contain grayscale opacity-50 ${processing.isProcessing ? 'animate-spin' : ''}`} 
                              alt="Logo" 
                            />
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest">Pilih Frame</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="grid grid-cols-5 gap-2 lg:gap-3 w-full mx-auto">
                  <button 
                    onClick={() => setShowPreview(true)}
                    disabled={processing.isProcessing || !selectedCapture}
                    title="Preview"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => setIsCropping(true)}
                    disabled={processing.isProcessing || !selectedCapture}
                    title="Crop"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Scissors size={20} />
                  </button>
                  <button 
                    onClick={handleSharpen}
                    disabled={processing.isProcessing || !selectedCapture}
                    title="Sharpen"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Zap size={20} />
                  </button>
                  <button 
                    onClick={handleReset}
                    disabled={processing.isProcessing || !selectedCapture || selectedCapture === initialCapture}
                    title="Reset"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <RefreshCw size={20} />
                  </button>
                  <button 
                    onClick={handleDownload}
                    disabled={processing.isProcessing || !selectedCapture}
                    title="Download"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Download size={20} />
                  </button>
               </div>
            </div>

          </div>
        </div>

        {/* Crop Modal */}
        <AnimatePresence>
          {isCropping && selectedCapture && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Frame Capture</h2>
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
                  image={selectedCapture}
                  crop={crop}
                  zoom={zoom}
                  aspect={videoAspectRatio || 1}
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
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Screen Preview Modal */}
        <AnimatePresence>
          {showPreview && selectedCapture && (
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
                  src={selectedCapture} 
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

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default GuberFrameVideo;
