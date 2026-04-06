import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Sparkles, Download, RefreshCw, Wand2, Image as ImageIcon, CheckCircle2, AlertCircle, Layout, Trash2, Eye, Zap, Recycle, Scissors, Check, X, Maximize } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { generateAestheticScene, upscaleAestheticImage } from '../services/estetik';
import { EstetikConfig } from '../types';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const EstetikAI: React.FC = () => {
  const { primaryColor } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [initialResult, setInitialResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [showPreview, setShowPreview] = useState(false);
  
  // Crop States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [config, setConfig] = useState<EstetikConfig>({
    style: 'Produk Katalog',
    environment: 'Set Studio Pro',
    decoration: 'Ornamen Minimalis',
    lighting: 'Cahaya Studio Softbox',
    aspectRatio: '1:1',
    additionalPrompt: ''
  });

  const styles = ['Minimalis Modern', 'Bohemian Chic', 'Vintage Retro', 'Sinematik Studio', 'Gaya Skandinavia', 'Loft Industri', 'Elegan Mewah', 'Produk Katalog'];
  const environments = ['Set Studio Pro', 'Interior Minimalis', 'Meja Kayu Estetik', 'Latar Marmer', 'Kafe Estetik', 'Galeri Seni', 'Kantor Modern', 'Ruang Tamu Mewah'];
  const lightingOptions = ['Cahaya Studio Softbox', 'Kilau Golden Hour', 'Cahaya Jendela Alami', 'Softbox Studio', 'Bayangan Dramatis', 'Kehangatan Cahaya Lilin', 'Cahaya Terang Merata'];
  const decorationOptions = ['Tanaman Alami & Kain Lembut', 'Karya Seni Modern', 'Buku Vintage & Lilin', 'Furnitur Minimalis', 'Marmer & Emas Mewah', 'Kayu & Batu Pedesaan', 'Ornamen Minimalis', 'Rangkaian Bunga'];

  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await generateAestheticScene(image, config);
      setResult(res);
      setInitialResult(res);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharpen = async () => {
    if (!result) return;
    setIsProcessing(true);
    setError(null);
    try {
      const sharpened = await upscaleAestheticImage(result, config.aspectRatio);
      setResult(sharpened);
    } catch (err: any) {
      setError(err.message || 'Gagal menajamkan gambar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `guber-estetik-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    if (initialResult) {
      setResult(initialResult);
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
      if (!url.startsWith('data:')) {
        image.crossOrigin = 'anonymous';
      }
      image.src = url;
    });

  const handleCropSave = async () => {
    if (!result || !croppedAreaPixels || croppedAreaPixels.width === 0) {
      setIsCropping(false);
      return;
    }

    try {
      const imageObj = await createImage(result);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        imageObj,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const croppedResult = canvas.toDataURL('image/png');
      setResult(croppedResult);
      setIsCropping(false);
    } catch (e: any) {
      setError('Gagal memotong gambar: ' + (e.message || 'Unknown error'));
      setIsCropping(false);
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
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">ESTETIK AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Sintesis Estetika Neural</p>
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
                  <ImageIcon size={14} className="text-slate-300" /> 1. Input Gambar
                </label>
                <ImageUploader 
                  label="Pilih Foto Objek" 
                  image={image} 
                  onImageSelect={(img) => { setImage(img); setResult(null); setInitialResult(null); setError(null); }} 
                  onClear={() => setImage(null)}
                  aspectRatio="1-1" 
                  labelInside
                />
              </div>

              {/* Konfigurasi */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gaya Visual</label>
                    <select 
                      value={config.style}
                      onChange={(e) => setConfig({...config, style: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-200 transition-all"
                    >
                      {styles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lingkungan</label>
                    <select 
                      value={config.environment}
                      onChange={(e) => setConfig({...config, environment: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-200 transition-all"
                    >
                      {environments.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dekorasi</label>
                    <select 
                      value={config.decoration}
                      onChange={(e) => setConfig({...config, decoration: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-200 transition-all"
                    >
                      {decorationOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pencahayaan</label>
                    <select 
                      value={config.lighting}
                      onChange={(e) => setConfig({...config, lighting: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-200 transition-all"
                    >
                      {lightingOptions.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instruksi Tambahan (Opsional)</label>
                  <textarea 
                    value={config.additionalPrompt}
                    onChange={(e) => setConfig({...config, additionalPrompt: e.target.value})}
                    placeholder="Misal: Tambahkan hiasan bunga mawar merah..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-4 py-3 text-xs font-medium outline-none focus:border-slate-200 transition-all min-h-[100px] resize-none"
                  />
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
                    SEDANG MERENDER...
                  </span>
                ) : (
                  <span className="text-lg relative z-10 flex items-center gap-2">
                    <Wand2 size={20} />
                    JADIKAN ESTETIK
                  </span>
                )}
              </button>
            </div>

            {/* Result Section */}
            <div className="space-y-4 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:sticky lg:top-8 self-start">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Render
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
              <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] lg:max-w-full mx-auto mt-8">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={!result || isProcessing}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !result || isProcessing 
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
                  disabled={!result || isProcessing}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !result || isProcessing 
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
                  disabled={!result || isProcessing}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !result || isProcessing 
                      ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                  style={{ color: primaryColor }}
                  title="Tajamkan"
                >
                  <Zap size={20} />
                </button>
                <button
                  onClick={handleReset}
                  disabled={!result || isProcessing || result === initialResult}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !result || isProcessing || result === initialResult
                      ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                  style={{ color: primaryColor }}
                  title="Reset"
                >
                  <Recycle size={20} />
                </button>
                <button
                  onClick={downloadImage}
                  disabled={!result || isProcessing}
                  className={`flex items-center justify-center py-4 text-white rounded-2xl transition-all ${
                    !result || isProcessing 
                      ? 'bg-slate-300 opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  style={{ backgroundColor: !result || isProcessing ? undefined : primaryColor }}
                  title="Download"
                >
                  <Download size={20} />
                </button>
              </div>
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
              className="mx-8 mb-8 bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {showPreview && result && (
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
                src={result} 
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
                  onClick={downloadImage}
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
        {isCropping && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Estetik</h2>
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
                image={result}
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

export default EstetikAI;


