import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, Copy, Check, RefreshCw, Layout, Palette, Type, Target, Layers, Image as ImageIcon, Info, ShieldCheck, Zap, AlertCircle, Eye, Scissors, Recycle, X, Trash2, Maximize } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState, FeedGeneratorConfig } from '../types';
import { generateFeedText, generateFeedImage } from '../services/feedgenerator';
import { upscaleImage } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberFeedGenerator: React.FC = () => {
  const { primaryColor } = useTheme();
  const [config, setConfig] = useState<FeedGeneratorConfig>({
    topic: '',
    description: '',
    goal: 'HARD_SELL',
    structure: 'AUTO',
    visualStyle: 'AUTO',
    dimensions: '1:1',
    primaryColor: '#0d9488',
    secondaryColor: '#f59e0b',
    typographyPlacement: 'BOTTOM_CENTER',
    customImage: null
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'json' | 'prompt'>('preview');
  const [result, setResult] = useState<{ imageUrl: string | null; json: any; prompt: string } | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: ''
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedEngine, setSelectedEngine] = useState('gemini-2.5-flash-image');

  // UI States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const engines = [
    { id: 'gemini-2.5-flash-image', name: '2.5 Flash', desc: 'Stable', icon: Sparkles }
  ];

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const handleRgbChange = (colorKey: 'primaryColor' | 'secondaryColor', channel: 'r' | 'g' | 'b', value: string) => {
    const val = Math.min(255, Math.max(0, parseInt(value) || 0));
    const current = hexToRgb(config[colorKey]);
    current[channel] = val;
    setConfig({ ...config, [colorKey]: rgbToHex(current.r, current.g, current.b) });
  };

  const handleGenerate = async () => {
    if (!config.topic) {
      setProcessing({ isProcessing: false, error: 'Silakan isi topik konten terlebih dahulu.', progress: '' });
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Menganalisis Strategi Konten...' });
    setResult(null);
    setInitialImageUrl(null);

    try {
      setProcessing(prev => ({ ...prev, progress: 'Menyusun Struktur JSON...' }));
      const jsonResult = await generateFeedText(config);
      
      setProcessing(prev => ({ ...prev, progress: 'Mengekstrak Visual Prompt...' }));
      const prompt = jsonResult.imagePrompt;

      setResult({ imageUrl: null, json: jsonResult, prompt });
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      let errorMessage = err.message || 'Gagal generate konten.';
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setProcessing({ isProcessing: false, error: "AKSES_DITOLAK", progress: '' });
      } else {
        setProcessing({ isProcessing: false, error: errorMessage, progress: '' });
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!result || isGeneratingImage) return;

    setIsGeneratingImage(true);
    setProcessing({ isProcessing: true, error: null, progress: 'Mensintesis Visual AI...' });
    try {
      const imageUrl = await generateFeedImage(result.prompt, config, selectedEngine);
      setResult({ ...result, imageUrl });
      setInitialImageUrl(imageUrl);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      let errorMessage = err.message || 'Gagal generate gambar.';
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setProcessing({ isProcessing: false, error: "AKSES_DITOLAK", progress: '' });
      } else {
        setProcessing({ isProcessing: false, error: errorMessage, progress: '' });
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `guber-feed-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    if (initialImageUrl) {
      setResult(prev => prev ? { ...prev, imageUrl: initialImageUrl } : null);
      setIsCropping(false);
    }
  };

  const handleFullReset = () => {
    setConfig({
      topic: '',
      description: '',
      customImage: null,
      goal: 'HARD_SELL',
      structure: 'AUTO',
      visualStyle: 'AUTO',
      dimensions: '1:1',
      primaryColor: '#0d9488',
      secondaryColor: '#f59e0b',
      typographyPlacement: 'BOTTOM_CENTER'
    });
    setResult(null);
    setInitialImageUrl(null);
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleUpscale = async () => {
    if (!result?.imageUrl) return;

    setProcessing({ isProcessing: true, error: null, progress: 'Meningkatkan kualitas...' });
    try {
      const sharpenedImage = await upscaleImage(result.imageUrl, config.dimensions);
      setResult({ ...result, imageUrl: sharpenedImage });
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal menajamkan foto', progress: '' });
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

  const handleApplyCrop = async () => {
    if (!result?.imageUrl || !croppedAreaPixels) return;

    try {
      const image = await createImage(result.imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const { width, height } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;

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

      const base64Image = canvas.toDataURL('image/png');
      setResult({ ...result, imageUrl: base64Image });
      setIsCropping(false);
    } catch (e: any) {
      console.error(e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto', progress: '' });
    }
  };

  const getAspectRatioValue = (ratio: string) => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
  };

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square';
      case '9:16': return 'aspect-[9/16]';
      case '16:9': return 'aspect-[16/9]';
      case '3:4': return 'aspect-[3/4]';
      case '4:3': return 'aspect-[4/3]';
      default: return 'aspect-square';
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header Bar */}
      <div 
        className="h-16 border-b border-white/10 flex items-center px-6 justify-between shrink-0 z-30 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))` }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md border border-white/30">
            <Layout size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight uppercase leading-none">FEED GEN AI</h1>
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em] mt-1">Neural Content Strategy Engine</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-full lg:w-[400px] bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-8">
            {/* Topic Input */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Type size={14} /> 1. Topik Konten
              </label>
              <div className="space-y-2">
                <input 
                  type="text"
                  value={config.topic}
                  onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                  placeholder="Judul/Topik Utama"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-teal-500 outline-none transition-all text-sm font-bold text-slate-700"
                />
                <textarea 
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Keterangan tambahan / deskripsi detail..."
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-teal-500 outline-none transition-all text-sm font-bold text-slate-700 resize-none"
                />
              </div>
            </div>

            {/* Custom Image Upload */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} /> 2. Referensi Gambar (Opsional)
              </label>
              <ImageUploader
                label="Pilih Referensi"
                image={config.customImage}
                onImageSelect={(img) => setConfig({ ...config, customImage: img })}
                onClear={() => setConfig({ ...config, customImage: null })}
                aspectRatio="square"
                labelInside
              />
            </div>

            {/* Goal Select */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} /> 3. Tujuan Konten
              </label>
              <select 
                value={config.goal}
                onChange={(e) => setConfig({ ...config, goal: e.target.value as any })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-teal-500 outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="HARD_SELL">Jualan / Hard Sell</option>
                <option value="SHARING">Edukasi / Sharing</option>
                <option value="INTERACTION">Interaksi (Like/Komentar)</option>
                <option value="BRANDING">Personal Branding</option>
              </select>
            </div>

            {/* Structure Select */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layout size={14} /> 4. Struktur Konten
              </label>
              <select 
                value={config.structure}
                onChange={(e) => setConfig({ ...config, structure: e.target.value as any })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-teal-500 outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="AUTO">Auto Match (AI)</option>
                <option value="LISTICLE">Tip & Listicle</option>
                <option value="PROBLEM_SOLUTION">Problem & Solution</option>
                <option value="COMPARISON">A & B / Perbandingan</option>
                <option value="TUTORIAL">Tutorial / Langkah</option>
                <option value="STATISTICS">Data & Statistik</option>
              </select>
            </div>

            {/* Visual Style Select */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={14} /> 5. Gaya Visual
              </label>
              <select 
                value={config.visualStyle}
                onChange={(e) => setConfig({ ...config, visualStyle: e.target.value as any })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-teal-500 outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="AUTO">Auto Match (AI)</option>
                <option value="MINIMALIST">Modern Minimalist</option>
                <option value="PLAYFUL">Ceria & Playful</option>
                <option value="EARTHY">Bohemian / Earthy</option>
                <option value="INDONESIAN">Nuansa Lokal Indonesia</option>
                <option value="PROFESSIONAL">Professional Clean</option>
              </select>
            </div>

            {/* Dimensions Select */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={14} /> 6. Dimensi Gambar
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['1:1', '9:16', '3:4', '16:9', '4:3'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setConfig({ ...config, dimensions: ratio as any })}
                    className={`py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${config.dimensions === ratio ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100' : 'bg-white border-slate-100 text-slate-500 hover:border-teal-200'}`}
                    style={{ 
                      backgroundColor: config.dimensions === ratio ? primaryColor : undefined,
                      borderColor: config.dimensions === ratio ? primaryColor : undefined 
                    }}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Colors */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={14} /> 7. Palet Warna Brand
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Primary</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-full h-10 rounded-xl overflow-hidden border-2 border-slate-100 cursor-pointer p-0 bg-transparent"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Secondary</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-full h-10 rounded-xl overflow-hidden border-2 border-slate-100 cursor-pointer p-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Engine Selection */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} /> 8. Mesin AI Visual
              </label>
              <div className="grid grid-cols-1 gap-2">
                {engines.map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => setSelectedEngine(engine.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      selectedEngine === engine.id 
                        ? 'border-teal-600 bg-teal-50 text-teal-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                    style={{ 
                      borderColor: selectedEngine === engine.id ? primaryColor : undefined,
                      backgroundColor: selectedEngine === engine.id ? `${primaryColor}10` : undefined,
                      color: selectedEngine === engine.id ? primaryColor : undefined
                    }}
                  >
                    <engine.icon size={18} />
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none">{engine.name}</p>
                      <p className="text-[8px] font-bold opacity-60 mt-1">{engine.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button 
              disabled={processing.isProcessing}
              onClick={handleGenerate}
              className="w-full py-5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-3 active:scale-95 group"
              style={{ backgroundColor: processing.isProcessing ? undefined : primaryColor }}
            >
              {processing.isProcessing ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
              <span>{processing.isProcessing ? 'MENGANALISIS...' : 'GENERATE STRATEGI'}</span>
            </button>

            <button
              onClick={handleFullReset}
              className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} /> Reset Form
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col items-center bg-slate-50/50">
          <div className="w-full max-w-5xl space-y-10">
            {/* Tabs */}
            <div className="flex items-center justify-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md mx-auto">
              {(['preview', 'json', 'prompt'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'text-slate-400 hover:bg-slate-50'}`}
                  style={{ backgroundColor: activeTab === tab ? primaryColor : undefined }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Result Area */}
            <div className="w-full min-h-[600px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {processing.isProcessing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-8 text-center"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-teal-100 rounded-full"></div>
                      <div className="absolute inset-0 w-24 h-24 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={32} className="text-teal-600 animate-pulse" style={{ color: primaryColor }} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Neural Content Synthesis...</p>
                      <p className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.3em] animate-pulse" style={{ color: primaryColor }}>{processing.progress}</p>
                    </div>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-10"
                  >
                    {activeTab === 'preview' && (
                      <div className="flex flex-col lg:flex-row gap-12 items-start">
                        {/* Image Preview */}
                        <div className="flex-1 flex flex-col items-center gap-8">
                          <div className={`w-full max-w-md ${getAspectRatioClass(config.dimensions)} bg-white rounded-[48px] border-8 border-white shadow-2xl shadow-teal-900/10 overflow-hidden relative group`}>
                            {isCropping && result.imageUrl ? (
                              <div className="absolute inset-0 z-40">
                                <Cropper
                                  image={result.imageUrl}
                                  crop={crop}
                                  zoom={zoom}
                                  aspect={getAspectRatioValue(config.dimensions)}
                                  onCropChange={setCrop}
                                  onCropComplete={onCropComplete}
                                  onZoomChange={setZoom}
                                  style={{
                                    containerStyle: { background: '#0f172a' },
                                    cropAreaStyle: { border: '2px solid #2dd4bf', boxShadow: '0 0 0 9999px rgba(0,0,0,0.8)' }
                                  }}
                                />
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
                                  <button
                                    onClick={() => setIsCropping(false)}
                                    className="bg-white/90 backdrop-blur-md text-slate-600 p-4 rounded-2xl shadow-xl hover:bg-white transition-all active:scale-90"
                                  >
                                    <X size={24} />
                                  </button>
                                  <button
                                    onClick={handleApplyCrop}
                                    className="bg-teal-600 text-white p-4 rounded-2xl shadow-xl hover:bg-teal-500 transition-all active:scale-90"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <Check size={24} />
                                  </button>
                                </div>
                              </div>
                            ) : result.imageUrl ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full h-full relative"
                              >
                                <img 
                                  src={result.imageUrl} 
                                  className="w-full h-full object-cover" 
                                  alt="Feed Preview" 
                                />
                              </motion.div>
                            ) : (
                              <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-12 text-center gap-8">
                                <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm flex items-center justify-center text-slate-200">
                                  <ImageIcon size={48} />
                                </div>
                                <div className="space-y-3">
                                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Visual Belum Dibuat</h3>
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                                    Klik tombol di bawah untuk menghasilkan visual AI
                                  </p>
                                </div>
                                <button 
                                  onClick={handleGenerateImage}
                                  disabled={isGeneratingImage}
                                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white px-10 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-teal-100 transition-all flex items-center gap-3 active:scale-95 group"
                                  style={{ backgroundColor: isGeneratingImage ? undefined : primaryColor }}
                                >
                                  {isGeneratingImage ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                                  <span>{isGeneratingImage ? 'MENSINTESIS...' : 'GENERATE VISUAL AI'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          {result.imageUrl && !isCropping && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
                              <button
                                onClick={() => setIsPreviewOpen(true)}
                                className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                              >
                                <Eye size={16} /> Preview
                              </button>
                              <button
                                onClick={() => setIsCropping(true)}
                                className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                              >
                                <Scissors size={16} /> Crop
                              </button>
                              <button
                                onClick={handleUpscale}
                                className="bg-white border-2 border-slate-100 hover:border-teal-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                              >
                                <Zap size={16} /> Tajamkan
                              </button>
                              <button
                                onClick={handleReset}
                                disabled={result.imageUrl === initialImageUrl}
                                className={`bg-white border-2 border-slate-100 hover:border-rose-500 text-slate-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 ${result.imageUrl === initialImageUrl ? 'opacity-30' : ''}`}
                              >
                                <Recycle size={16} /> Reset
                              </button>
                              <button
                                onClick={handleDownload}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-teal-100 active:scale-95 col-span-2 sm:col-span-1"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <Download size={16} /> Download
                              </button>
                            </div>
                          )}

                          <div className="w-full bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 text-teal-600" style={{ color: primaryColor }}>
                              <Info size={18} />
                              <span className="text-[11px] font-black uppercase tracking-widest">Visual Advice</span>
                            </div>
                            <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                              "{result.json.visualAdvice}"
                            </p>
                          </div>
                        </div>

                        {/* Content Strategy Display */}
                        <div className="w-full lg:w-[450px] space-y-8">
                          <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 space-y-8">
                            <div className="space-y-3">
                              <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]" style={{ color: primaryColor }}>Headline</span>
                              <h2 className="text-3xl font-black text-slate-800 leading-tight tracking-tight">{result.json.headline}</h2>
                            </div>

                            <div className="space-y-3">
                              <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]" style={{ color: primaryColor }}>Hook</span>
                              <p className="text-base font-bold text-slate-600 leading-relaxed">{result.json.hook}</p>
                            </div>

                            <div className="space-y-6 pt-8 border-t border-slate-50">
                              <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]" style={{ color: primaryColor }}>Key Points</span>
                              <div className="space-y-6">
                                {result.json.points.map((point: any, idx: number) => (
                                  <div key={idx} className="flex gap-5">
                                    <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center shrink-0 text-teal-600 font-black text-sm shadow-sm" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                                      {idx + 1}
                                    </div>
                                    <div className="space-y-1.5">
                                      <h4 className="text-base font-black text-slate-800 leading-none">{point.title}</h4>
                                      <p className="text-xs text-slate-500 font-bold leading-relaxed">{point.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50">
                              <div className="bg-teal-600 p-6 rounded-[24px] text-center shadow-lg shadow-teal-100" style={{ backgroundColor: primaryColor }}>
                                <span className="text-[9px] font-black text-teal-100 uppercase tracking-widest block mb-2 opacity-70">Call to Action</span>
                                <p className="text-base font-black text-white">{result.json.cta}</p>
                              </div>
                            </div>
                          </div>

                          {/* Social Caption */}
                          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl space-y-6 border border-white/10">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">Social Caption</span>
                              <button 
                                onClick={() => handleCopy(result.json.caption + '\n\n' + result.json.hashtags.join(' '), 'caption')}
                                className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors"
                              >
                                {copied === 'caption' ? <Check size={14} /> : <Copy size={14} />}
                                {copied === 'caption' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-sm text-slate-300 font-bold leading-relaxed whitespace-pre-wrap">
                              {result.json.caption}
                            </p>
                            <div className="flex flex-wrap gap-2.5 pt-4 border-t border-white/5">
                              {result.json.hashtags.map((tag: string, i: number) => (
                                <span key={i} className="text-[10px] font-black text-teal-500 tracking-tight">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'json' && (
                      <div className="w-full max-w-4xl mx-auto space-y-6">
                        <div className="flex justify-between items-center px-6">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Content Metadata (JSON)</span>
                          <button 
                            onClick={() => handleCopy(JSON.stringify(result.json, null, 2), 'json')}
                            className="flex items-center gap-2 text-[11px] font-black text-teal-600 uppercase tracking-widest hover:underline"
                            style={{ color: primaryColor }}
                          >
                            {copied === 'json' ? <Check size={16} /> : <Copy size={16} />}
                            {copied === 'json' ? 'Copied!' : 'Copy JSON'}
                          </button>
                        </div>
                        <div className="bg-slate-900 p-8 lg:p-12 rounded-[48px] shadow-2xl overflow-hidden relative group border-8 border-white">
                          <pre className="text-teal-400 font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar whitespace-pre-wrap">
                            {JSON.stringify(result.json, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {activeTab === 'prompt' && (
                      <div className="w-full max-w-4xl mx-auto space-y-6">
                        <div className="flex justify-between items-center px-6">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Image Generation Prompt</span>
                          <button 
                            onClick={() => handleCopy(result.prompt, 'prompt')}
                            className="flex items-center gap-2 text-[11px] font-black text-teal-600 uppercase tracking-widest hover:underline"
                            style={{ color: primaryColor }}
                          >
                            {copied === 'prompt' ? <Check size={16} /> : <Copy size={16} />}
                            {copied === 'prompt' ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        </div>
                        <div className="bg-white p-10 lg:p-16 rounded-[48px] shadow-sm border-8 border-white relative group italic">
                          <p className="text-slate-600 font-black text-lg leading-relaxed tracking-tight">
                            "{result.prompt}"
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    className="flex flex-col items-center gap-8 opacity-20 text-center"
                  >
                    <div className="w-40 h-40 bg-slate-200 rounded-[48px] flex items-center justify-center">
                      <Layout size={80} className="text-slate-400" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Ready to Generate</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Fill the form to start content synthesis</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tips Section */}
            <div className="w-full max-w-2xl mx-auto text-center mt-12 pb-12">
              <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                Gunakan topik yang spesifik untuk hasil yang lebih akurat. AI akan menyesuaikan caption dan visual berdasarkan tujuan konten Anda.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {processing.error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`${processing.error === 'AKSES_DITOLAK' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-600'} border-2 p-8 rounded-[32px] text-[11px] font-black text-center uppercase tracking-widest flex flex-col gap-4 w-full max-w-2xl mx-auto mb-12 shadow-xl shadow-rose-900/5`}
                >
                  {processing.error === 'AKSES_DITOLAK' ? (
                    <>
                      <div className="flex items-center justify-center gap-3">
                        <AlertCircle size={20} className="text-amber-600" />
                        <span className="text-sm">Google Meminta Aktivasi</span>
                      </div>
                      <p className="text-[10px] normal-case font-bold text-amber-800 leading-relaxed">
                        Untuk menggunakan mesin 3.x, Google mewajibkan aktivasi kuota gratis. Klik tombol di bawah (Gratis & Tanpa Input Key).
                      </p>
                      <button 
                        onClick={async () => {
                          try {
                            await (window as any).aistudio.openSelectKey();
                            setProcessing(prev => ({ ...prev, error: null }));
                          } catch(e) {}
                        }}
                        className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-200"
                      >
                        Aktifkan Kuota Gratis Sekarang
                      </button>
                    </>
                  ) : (
                    processing.error
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && result?.imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-12"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={result.imageUrl} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
                alt="Full Preview" 
              />
              <button
                onClick={() => setIsPreviewOpen(false)}
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
    </div>
  );
};

export default GuberFeedGenerator;
