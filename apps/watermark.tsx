
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Sparkles, Download, RefreshCw, Layers, Image as ImageIcon, Check, X, Camera, Maximize, Scissors, Zap, Eye, ShieldAlert, BookOpen, Code, Cpu, Scale, Info, MessageSquareText } from 'lucide-react';
import { ProcessingState } from '../types';
import { removeWatermark } from '../services/watermark';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import Cropper from 'react-easy-crop';
import { useTheme } from '../src/contexts/ThemeContext';
import Markdown from 'react-markdown';

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', ratio: 1/1, class: 'aspect-square' },
  { label: '3:4', value: '3:4', ratio: 3/4, class: 'aspect-[3/4]' },
  { label: '4:3', value: '4:3', ratio: 4/3, class: 'aspect-[4/3]' },
  { label: '9:16', value: '9:16', ratio: 9/16, class: 'aspect-[9/16]' },
  { label: '16:9', value: '16:9', ratio: 16/9, class: 'aspect-[16/9]' },
];

const GuberWatermark: React.FC = () => {
  const { primaryColor } = useTheme();
  const [activeTab, setActiveTab] = useState<'APP' | 'DOCS'>('APP');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [watermarkDescription, setWatermarkDescription] = useState('');
  const [sliderPos, setSliderPos] = useState(50);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS.find(r => r.value === '9:16') || ASPECT_RATIOS[0]);
  
  // Processing States
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  // Modal States
  const [showCrop, setShowCrop] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const addToHistory = (img: string) => {
    setHistory(prev => [...prev, img]);
    setResultImage(img);
  };

  const handleProcess = async () => {
    if (!sourceImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menganalisis Watermark...' });
    try {
      const instruction = watermarkDescription 
        ? `Clean and remove this specific watermark: ${watermarkDescription}. Restore the background pixels seamlessly.`
        : "Clean and remove all watermarks and logos. Restore the background pixels seamlessly.";
      
      const result = await removeWatermark(sourceImage, null, instruction, selectedRatio.value);
      addToHistory(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal menghapus watermark.", progress: '' });
    }
  };

  const handleUpscale = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menajamkan Foto...' });
    try {
      const result = await upscaleImage(resultImage, selectedRatio.value);
      addToHistory(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: "Gagal menajamkan foto.", progress: '' });
    }
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

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return canvas.toDataURL('image/png');
  };

  const handleCropSave = async () => {
    if (!resultImage || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(resultImage, croppedAreaPixels);
      addToHistory(croppedImage);
      setShowCrop(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUseAsSource = () => {
    if (resultImage) {
      setSourceImage(resultImage);
      setResultImage(null);
      setHistory([]);
      setSliderPos(50);
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setResultImage(newHistory[newHistory.length - 1]);
    } else {
      setHistory([]);
      setResultImage(null);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `watermark-removed-${Date.now()}.png`;
    link.click();
  };

  const docContent = `
# PANDUAN PENGGUNAAN AI WATERMARK REPAIR

Aplikasi ini menggunakan teknologi **Neural Repair** canggih untuk menghapus watermark, logo, atau teks yang mengganggu pada foto Anda. AI bekerja dengan cara menganalisis area di sekitar objek yang dihapus dan mensintesis piksel baru agar hasil restorasi terlihat alami dan menyatu dengan latar belakang asli tanpa meninggalkan bekas blur.

### Langkah Cepat:
1. **Unggah Foto**: Pilih gambar yang ingin dibersihkan.
2. **Atur Rasio**: Pilih aspek rasio yang sesuai (Default: 9:16).
3. **Deskripsi**: Masukkan teks singkat mengenai letak atau bentuk watermark untuk membantu akurasi deteksi AI.
4. **Proses**: Klik tombol **PERBAIKI FOTO** dan tunggu hingga selesai.
5. **Iterasi**: Jika masih ada sisa, klik **Gunakan Lagi** untuk membersihkan sisa watermark tersebut.
6. **Simpan**: Gunakan fitur **Upscale** jika ingin hasil lebih tajam, lalu klik **Download**.
`;

  return (
    <div className="h-full bg-slate-50/50 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto min-h-full bg-white flex flex-col border-x border-slate-100">
        {/* Header */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))` }}
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <ShieldAlert size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">AI Watermark Repair</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Repair Engine</p>
              </div>
            </div>
            <div className="flex gap-1 bg-black/10 p-1 rounded-xl backdrop-blur-sm">
              <button 
                onClick={() => setActiveTab('APP')}
                className={`p-2 rounded-lg transition-all ${activeTab === 'APP' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/60 hover:text-white'}`}
              >
                <Zap size={14} />
              </button>
              <button 
                onClick={() => setActiveTab('DOCS')}
                className={`p-2 rounded-lg transition-all ${activeTab === 'DOCS' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/60 hover:text-white'}`}
              >
                <BookOpen size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 flex-1">
          {activeTab === 'APP' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Upload Section */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> 1. Unggah Foto Ber-Watermark
                </label>
                <ImageUploader 
                  label="Pilih Foto" 
                  image={sourceImage} 
                  onImageSelect={(img) => { setSourceImage(img); setResultImage(null); setHistory([]); }} 
                  aspectRatio="1-1" 
                  labelInside
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Maximize size={14} className="text-slate-300" /> 2. Aspek Rasio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setSelectedRatio(r)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                        selectedRatio.value === r.value 
                          ? 'scale-105 shadow-md text-white' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                      }`}
                      style={{
                        backgroundColor: selectedRatio.value === r.value ? primaryColor : undefined,
                        color: selectedRatio.value === r.value ? 'white' : undefined,
                        borderColor: selectedRatio.value === r.value ? primaryColor : undefined,
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

              {/* Watermark Description */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquareText size={14} className="text-slate-300" /> 3. Deskripsi Watermark (Opsional)
                </label>
                <div className="relative group">
                  <textarea
                    value={watermarkDescription}
                    onChange={(e) => setWatermarkDescription(e.target.value)}
                    placeholder="Contoh: Tulisan miring Shutterstock putih transparan di tengah..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:border-slate-200 focus:bg-white transition-all resize-none h-24"
                  />
                  <div className="absolute bottom-3 right-3 opacity-20 group-focus-within:opacity-40 transition-opacity pointer-events-none">
                    <Sparkles size={16} style={{ color: primaryColor }} />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic">
                  *Jelaskan bentuk atau tulisan watermark agar AI lebih akurat mendeteksinya.
                </p>
              </div>

              <button
                onClick={handleProcess}
                disabled={processing.isProcessing || !sourceImage}
                className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-lg hover:shadow-xl active:scale-95"
                style={{ backgroundColor: processing.isProcessing || !sourceImage ? undefined : primaryColor }}
              >
                {processing.isProcessing ? 'SEDANG MEMPERBAIKI...' : 'PERBAIKI FOTO'}
              </button>

              {/* Result Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Hasil Bersih
                  </label>
                  <div className="flex gap-4">
                    {resultImage && (
                      <button onClick={handleUseAsSource} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <RefreshCw size={12} /> Gunakan Lagi
                      </button>
                    )}
                    {history.length > 0 && (
                      <button onClick={handleUndo} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <RefreshCw size={12} /> Undo
                      </button>
                    )}
                  </div>
                </div>
                
                <div 
                  className={`w-full max-w-[280px] mx-auto bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 ${
                    selectedRatio.value === '1:1' ? 'aspect-square' :
                    selectedRatio.value === '3:4' ? 'aspect-[3/4]' :
                    selectedRatio.value === '4:3' ? 'aspect-[4/3]' :
                    selectedRatio.value === '9:16' ? 'aspect-[9/16]' :
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
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:scale-110 shadow-lg"
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
                <div className="grid grid-cols-4 gap-3 max-w-[280px] mx-auto">
                  <button
                    onClick={() => setShowCrop(true)}
                    disabled={!resultImage || processing.isProcessing}
                    className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${!resultImage || processing.isProcessing ? 'opacity-30 border-slate-50 cursor-not-allowed' : 'border-slate-100 hover:border-slate-200 hover:scale-105'}`}
                    style={{ color: primaryColor }}
                    title="Crop"
                  >
                    <Scissors size={20} />
                  </button>
                  <button
                    onClick={handleUpscale}
                    disabled={!resultImage || processing.isProcessing}
                    className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${!resultImage || processing.isProcessing ? 'opacity-30 border-slate-50 cursor-not-allowed' : 'border-slate-100 hover:border-slate-200 hover:scale-105'}`}
                    style={{ color: primaryColor }}
                    title="Tajamkan"
                  >
                    <Zap size={20} />
                  </button>
                  <button
                    onClick={() => resultImage && setShowPreview(true)}
                    disabled={!resultImage || processing.isProcessing}
                    className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${!resultImage || processing.isProcessing ? 'opacity-30 border-slate-50 cursor-not-allowed' : 'border-slate-100 hover:border-slate-200 hover:scale-105'}`}
                    style={{ color: primaryColor }}
                    title="Preview"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={downloadResult}
                    disabled={!resultImage || processing.isProcessing}
                    className={`flex items-center justify-center py-4 text-white rounded-2xl transition-all shadow-md ${!resultImage || processing.isProcessing ? 'bg-slate-300 opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    style={{ backgroundColor: !resultImage || processing.isProcessing ? undefined : primaryColor }}
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="prose prose-slate prose-sm max-w-none"
            >
              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
                <div className="markdown-body text-[11px] leading-relaxed text-justify">
                  <Markdown>
                    {docContent}
                  </Markdown>
                </div>
              </div>
            </motion.div>
          )}

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
                  onClick={downloadResult}
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
        {showCrop && (resultImage || sourceImage) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCrop(false)}
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
                image={(resultImage || sourceImage)!}
                crop={crop}
                zoom={zoom}
                aspect={selectedRatio.ratio}
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

export default GuberWatermark;
