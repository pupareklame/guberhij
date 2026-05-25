
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pipette, Copy, Check, Trash2, History, RotateCcw, Image as ImageIcon, ZoomIn, Palette, Share2, Download } from 'lucide-react';
import { useTheme } from '../src/contexts/ThemeContext';
import ImageUploader from '../components/ImageUploader';

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  timestamp: number;
}

const GuberColorPicker: React.FC = () => {
  const { primaryColor } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<ColorInfo | null>(null);
  const [history, setHistory] = useState<ColorInfo[]>([]);
  const [magnifier, setMagnifier] = useState<{ x: number, y: number, show: boolean }>({ x: 0, y: 0, show: false });
  const [isCopying, setIsCopying] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  };

  const handlePickColor = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      const hsl = rgbToHsl(pixel[0], pixel[1], pixel[2]);

      const newColor: ColorInfo = { hex, rgb, hsl, timestamp: Date.now() };
      setPickedColor(newColor);
      setHistory(prev => [newColor, ...prev.slice(0, 19)]);
      
      setMagnifier({
        x: clientX - rect.left,
        y: clientY - rect.top,
        show: true
      });
    } catch (err) {
      console.error("Error picking color:", err);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMagnifier({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      show: true
    });
  };

  const handleMouseLeave = () => {
    setMagnifier(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (image && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = image;
    }
  }, [image]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  const clearAll = () => {
    setImage(null);
    setPickedColor(null);
    setHistory([]);
    setMagnifier({ x: 0, y: 0, show: false });
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
          <div className="flex items-center justify-center relative">
             <button 
              onClick={clearAll}
              className="absolute left-0 p-2 text-white/60 hover:text-white transition-colors"
            >
              <RotateCcw size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Pipette size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Color Picker</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Ekstrak Kode Warna Gambar</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8 flex-1 flex flex-col">
          {!image ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-full max-w-lg">
                <ImageUploader
                  label="Unggah Gambar"
                  image={image}
                  onImageSelect={setImage}
                  aspectRatio="auto"
                  description="Unggah gambar baju, desain, atau apapun untuk mengambil kode warnanya"
                />
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr,320px] gap-8 lg:h-full">
              {/* Image Work Area */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Area Warna</span>
                  </div>
                  <button 
                    onClick={() => setImage(null)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-tight hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw size={10} /> Ganti Gambar
                  </button>
                </div>

                <div 
                  ref={containerRef}
                  className="relative w-full rounded-[32px] overflow-hidden bg-slate-100 border border-slate-200 cursor-crosshair group shadow-inner"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onMouseDown={handlePickColor}
                >
                  <img 
                    ref={imageRef}
                    src={image} 
                    className="w-full h-auto block pointer-events-none select-none" 
                    alt="Source"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Magnifier / Follower */}
                  {magnifier.show && (
                    <div 
                      className="absolute pointer-events-none z-50 transition-transform duration-75"
                      style={{ 
                        left: magnifier.x, 
                        top: magnifier.y,
                        transform: `translate(-50%, -50%)`
                      }}
                    >
                      {/* Loupe */}
                      <div 
                        className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center bg-slate-800"
                      >
                         <div className="absolute inset-0 bg-grid-slate-100/10 pointer-events-none" />
                         <div 
                           className="w-2 h-2 rounded-full border border-white z-10"
                           style={{ backgroundColor: pickedColor?.hex || 'transparent' }}
                         />
                         {/* Centered Pixel Magnifier Effect */}
                         <div 
                           className="absolute inset-0 scale-[8] origin-center opacity-90"
                           style={{ 
                             backgroundImage: `url(${image})`,
                             backgroundPosition: `${(magnifier.x / (containerRef.current?.offsetWidth || 1)) * 100}% ${(magnifier.y / (containerRef.current?.offsetHeight || 1)) * 100}%`,
                             backgroundSize: `${(containerRef.current?.offsetWidth || 1) * 8}px auto`,
                             backgroundRepeat: 'no-repeat'
                           }}
                         />
                      </div>
                      <div 
                        className="mt-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[9px] font-black text-white text-center shadow-lg"
                      >
                        {pickedColor?.hex || 'Picking...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Current Color Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div 
                    className="h-32 w-full transition-colors duration-300 relative group"
                    style={{ backgroundColor: pickedColor?.hex || '#f8fafc' }}
                  >
                    {!pickedColor && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <Pipette size={32} className="animate-pulse" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  <div className="p-6 space-y-4">
                    {pickedColor ? (
                      <>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">HEX</span>
                            <button 
                              onClick={() => copyToClipboard(pickedColor.hex)}
                              className="p-1 px-2 hover:bg-slate-50 rounded flex items-center gap-1 text-[10px] font-black transition-all"
                              style={{ color: primaryColor }}
                            >
                              {isCopying ? <Check size={12} /> : <Copy size={12} />}
                              <span>{pickedColor.hex}</span>
                            </button>
                          </div>
                          <div className="h-[1px] bg-slate-100" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">RGB</span>
                            <span className="text-[10px] font-black text-slate-800">{pickedColor.rgb}</span>
                          </div>
                          <div className="h-[1px] bg-slate-100" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">HSL</span>
                            <span className="text-[10px] font-black text-slate-800">{pickedColor.hsl}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => copyToClipboard(pickedColor.hex)}
                          className="w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-95 transition-all"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Salin Kode Warna
                        </button>
                      </>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ketuk pada gambar</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tight mt-1">Untuk mengambil warna</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* History Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <History size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Riwayat</span>
                    </div>
                    {history.length > 0 && (
                      <button 
                        onClick={() => setHistory([])}
                        className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {history.slice(0, 15).map((color, idx) => (
                      <button
                        key={`${color.hex}-${idx}`}
                        onClick={() => {
                           setPickedColor(color);
                           copyToClipboard(color.hex);
                        }}
                        className="aspect-square rounded-xl border border-slate-100 shadow-sm hover:scale-110 active:scale-95 transition-all relative group"
                        style={{ backgroundColor: color.hex }}
                        title={color.hex}
                      >
                         <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/20 rounded-xl transition-opacity">
                            <Copy size={10} className="text-white" />
                         </div>
                      </button>
                    ))}
                    {history.length === 0 && (
                      <div className="col-span-5 py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center opacity-30">
                        <Palette size={20} className="text-slate-400 mb-1" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Kosong</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips Card */}
                <div className="bg-slate-50 rounded-3xl p-5 space-y-3 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <ZoomIn size={14} style={{ color: primaryColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Tips</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                    Gunakan kursor atau sentuhan untuk memilih warna yang lebih detail. Klik kode warna riwayat untuk menyalinnya kembali.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuberColorPicker;
