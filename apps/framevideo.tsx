
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
  Settings2
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
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [captures, setCaptures] = useState<string[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<string | null>(null);
  
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

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoSrc && videoSrc.startsWith('blob:')) URL.revokeObjectURL(videoSrc);
      setCaptures([]);
      setSelectedCapture(null);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  // Standard frame steps (assuming 30fps)
  const FRAME_STEP = 1 / 30;

  const adjustTime = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      let newTime = video.currentTime + seconds;
      
      // Ensure we stay within bounds and avoid the "black screen" end state
      const maxTime = Math.max(0, video.duration - 0.01);
      newTime = Math.max(0, Math.min(newTime, maxTime));
      
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const jumpToTime = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      // If jumping to the end, use a small offset to keep the frame visible
      const safeTime = time >= video.duration ? Math.max(0, video.duration - 0.01) : time;
      video.currentTime = safeTime;
      setCurrentTime(safeTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.pause();
      const safeTime = time >= video.duration ? Math.max(0, video.duration - 0.01) : time;
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

    setProcessing({ isProcessing: true, error: null, progress: 'Capturing...' });
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/png');
    setCaptures(prev => [dataUrl, ...prev].slice(0, 10));
    setSelectedCapture(dataUrl);
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleDownload = () => {
    if (!selectedCapture) return;
    const link = document.createElement('a');
    link.href = selectedCapture;
    link.download = `guber-frame-${Date.now()}.png`;
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
    if (!selectedCapture || !croppedAreaPixels) return;
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
    } catch (e) { 
      console.error(e);
      setIsCropping(false);
    }
  };

  const handleSharpen = async () => {
    if (!selectedCapture) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Enhancing...' });
    try {
      const sharpenedImage = await upscaleImage(selectedCapture, aspectRatio);
      setSelectedCapture(sharpenedImage);
      setCaptures(prev => prev.map(c => c === selectedCapture ? sharpenedImage : c));
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar.', progress: '' });
    }
  };

  return (
    <div className="h-full bg-slate-950 overflow-y-auto custom-scrollbar text-slate-200">
      <div className="max-w-3xl mx-auto min-h-full bg-slate-900 flex flex-col shadow-2xl">
        
        {/* Header */}
        <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Camera size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none uppercase">Frame Master Pro</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 mt-1">Guber AI Neural Capture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button className="p-2 text-slate-400 hover:text-white transition-colors"><Settings2 size={18} /></button>
          </div>
        </header>

        <main className="p-6 space-y-8">
          {/* Video Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Video size={14} /> Video Source
              </h2>
              {videoSrc && (
                <button 
                  onClick={() => { setVideoSrc(null); setDuration(0); setCurrentTime(0); setCaptures([]); setSelectedCapture(null); }}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} /> Reset
                </button>
              )}
            </div>

            <div 
              className="w-full bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden relative group shadow-2xl flex items-center justify-center transition-all duration-500"
              style={{ aspectRatio: videoAspectRatio ? `${videoAspectRatio}` : '16/9' }}
            >
              {!videoSrc ? (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-slate-800/50 transition-all group">
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Video size={28} className="text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Import Video File</span>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              ) : (
                <div className="w-full h-full relative">
                  <video 
                    ref={videoRef} 
                    src={videoSrc} 
                    className="w-full h-full object-contain bg-black" 
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} 
                    onLoadedMetadata={(e) => {
                      setDuration(e.currentTarget.duration);
                      setVideoAspectRatio(e.currentTarget.videoWidth / e.currentTarget.videoHeight);
                    }}
                    crossOrigin="anonymous" 
                    playsInline
                    muted
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="flex justify-between text-[10px] font-mono text-white/70">
                        <span>{currentTime.toFixed(2)}s</span>
                        <span>{duration.toFixed(2)}s</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {videoSrc && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Timeline Controls */}
              <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-[32px] space-y-6 shadow-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timeline Navigation</span>
                    <span className="text-[12px] font-mono font-bold text-indigo-400 tabular-nums bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                      {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                    </span>
                  </div>
                  
                  <input 
                    type="range" 
                    min={0} 
                    max={duration || 0} 
                    step={0.001} 
                    value={currentTime} 
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-6 gap-2">
                  <button onClick={() => jumpToTime(0)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all group">
                    <ChevronsLeft size={18} className="text-slate-400 group-hover:text-white" />
                    <span className="text-[8px] font-bold mt-1 text-slate-500">START</span>
                  </button>
                  <button onClick={() => adjustTime(-1)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all group">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">-1s</span>
                  </button>
                  <button onClick={() => adjustTime(-FRAME_STEP)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all group">
                    <ChevronLeft size={18} className="text-slate-400 group-hover:text-white" />
                    <span className="text-[8px] font-bold mt-1 text-slate-500">FRAME</span>
                  </button>
                  <button onClick={() => adjustTime(FRAME_STEP)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all group">
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-white" />
                    <span className="text-[8px] font-bold mt-1 text-slate-500">FRAME</span>
                  </button>
                  <button onClick={() => adjustTime(1)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all group">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">+1s</span>
                  </button>
                  <button onClick={() => jumpToTime(duration)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all group">
                    <ChevronsRight size={18} className="text-slate-400 group-hover:text-white" />
                    <span className="text-[8px] font-bold mt-1 text-slate-500">END</span>
                  </button>
                </div>

                <button
                  onClick={captureCurrentFrame}
                  disabled={processing.isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  {processing.isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera size={20} />
                      <span>Capture Frame</span>
                    </>
                  )}
                </button>
              </div>

              {/* Captures Gallery */}
              {captures.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} /> Capture History
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {captures.map((cap, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCapture(cap)}
                        className={`flex-shrink-0 w-24 aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selectedCapture === cap ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img src={cap} className="w-full h-full object-cover" alt={`Capture ${idx}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Frame Actions */}
              {selectedCapture && (
                <div className="bg-slate-800/30 border border-slate-700 p-6 rounded-[32px] space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Selected Frame</h3>
                    <div className="flex gap-2">
                      {ratios.map(r => (
                        <button 
                          key={r.value}
                          onClick={() => setAspectRatio(r.value)}
                          className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                            aspectRatio === r.value ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div 
                    className={`w-full max-w-sm mx-auto bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xl border border-slate-700/50 transition-all duration-500 ${
                      aspectRatio === '1:1' ? 'aspect-square' :
                      aspectRatio === '3:4' ? 'aspect-[3/4]' :
                      aspectRatio === '4:3' ? 'aspect-[4/3]' :
                      aspectRatio === '9:16' ? 'aspect-[9/16]' :
                      'aspect-[16/9]'
                    }`}
                  >
                    <img src={selectedCapture} className="w-full h-full object-cover" alt="Selected" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                       <button onClick={() => setSelectedCapture(null)} className="p-2 bg-rose-500 text-white rounded-full"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setIsCropping(true)} 
                      className="flex flex-col items-center justify-center py-4 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-all group"
                    >
                      <Scissors size={20} className="text-slate-400 group-hover:text-indigo-400" />
                      <span className="text-[9px] font-bold mt-2 text-slate-500 uppercase tracking-widest">Crop</span>
                    </button>
                    <button 
                      onClick={handleSharpen} 
                      disabled={processing.isProcessing}
                      className="flex flex-col items-center justify-center py-4 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-all group disabled:opacity-50"
                    >
                      <Zap size={20} className="text-slate-400 group-hover:text-amber-400" />
                      <span className="text-[9px] font-bold mt-2 text-slate-500 uppercase tracking-widest">Enhance</span>
                    </button>
                    <button 
                      onClick={handleDownload} 
                      className="flex flex-col items-center justify-center py-4 bg-indigo-600 rounded-2xl hover:bg-indigo-500 transition-all group shadow-lg shadow-indigo-500/20"
                    >
                      <Download size={20} className="text-white" />
                      <span className="text-[9px] font-bold mt-2 text-white/70 uppercase tracking-widest">Save</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Empty State */}
          {!videoSrc && (
            <div className="py-20 flex flex-col items-center text-center space-y-6 opacity-50">
              <div className="w-24 h-24 rounded-[40px] bg-slate-800 flex items-center justify-center border border-slate-700">
                <Video size={40} className="text-slate-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Video Loaded</p>
                <p className="text-[10px] text-slate-600 max-w-[200px] mx-auto">Upload a video to start extracting high-quality frames with AI enhancement.</p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="p-8 border-t border-slate-800 text-center">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">Powered by Guber AI Neural Engine</p>
        </footer>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropping && selectedCapture && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Scissors size={18} className="text-indigo-500" />
                <h2 className="text-white font-bold uppercase tracking-widest text-xs">Crop Selection</h2>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsCropping(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Cancel</button>
                <button onClick={handleCropSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"><Check size={14} /> Apply Crop</button>
              </div>
            </div>
            <div className="flex-1 relative">
              <Cropper 
                image={selectedCapture} 
                crop={crop} 
                zoom={zoom} 
                aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '3:4' ? 3/4 : aspectRatio === '4:3' ? 4/3 : aspectRatio === '9:16' ? 9/16 : 16/9} 
                onCropChange={setCrop} 
                onCropComplete={onCropComplete} 
                onZoomChange={setZoom} 
              />
            </div>
            <div className="p-8 bg-slate-900/80 backdrop-blur-md flex flex-col items-center gap-4 border-t border-slate-800">
              <div className="w-full max-w-xs space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  value={zoom} 
                  min={1} 
                  max={3} 
                  step={0.1} 
                  onChange={(e) => setZoom(Number(e.target.value))} 
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {processing.isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Zap size={24} className="text-indigo-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xs font-bold text-white uppercase tracking-[0.2em]">{processing.progress || 'Processing...'}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Neural Engine Active</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default GuberFrameVideo;
