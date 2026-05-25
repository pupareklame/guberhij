import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Footprints, User, Download, RefreshCw, Sparkles, Image as ImageIcon, Eye, Scissors, X, Check, Layers, Zap, Recycle, Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState, SepatuConfig } from '../types';
import { generateSepatu } from '../services/sepatu';
import { upscaleImage } from '../services/gantibaju';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const GuberSepatu: React.FC = () => {
  const { primaryColor } = useTheme();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [soleMotifImage, setSoleMotifImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'KATALOG' | 'SHOWROOM' | 'POV'>('KATALOG');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('9:16');
  const [showPreview, setShowPreview] = useState(false);
  
  const [config, setConfig] = useState<SepatuConfig>({
    target: 'DEWASA_LAKI',
    environment: 'Jalanan Perkotaan yang Estetik (Urban Street)',
    aspectRatio: '9:16',
    mode: 'KATALOG',
    showroomAmbiance: 'DEFAULT',
    showroomComposition: 'FOLLOW'
  });

  const [customEnv, setCustomEnv] = useState('');

  const environmentPresets = [
    { id: 'urban', label: 'Urban Street', value: 'Jalanan Perkotaan yang Estetik (Urban Street)' },
    { id: 'hiking', label: 'Mountain Hiking', value: 'Jalur Pendakian Gunung dengan Bebatuan (Hiking Path)' },
    { id: 'studio', label: 'Minimalist Studio', value: 'Studio Foto Minimalis dengan Pencahayaan Lembut' },
    { id: 'boss', label: 'Boss Pose', value: 'Duduk di Kursi Mewah dengan kaki menyilang di paha seperti Bos, dalam ruangan kantor eksekutif' },
    { id: 'hotel', label: 'Luxury Hotel', value: 'Lobi Hotel Bintang 5 dengan Lantai Marmer Mewah' },
    { id: 'redcarpet', label: 'Red Carpet', value: 'Karpet Merah Acara Gala dengan Pencahayaan Glamor' },
    { id: 'yacht', label: 'Luxury Yacht', value: 'Dek Kapal Pesiar Mewah dengan Pemandangan Lautan' },
    { id: 'desert', label: 'Desert Dunes', value: 'Bukit Pasir Gurun yang Estetik saat Matahari Terbenam' },
    { id: 'store', label: 'Luxury Store', value: 'Toko Sepatu Mewah dengan banyak Rak Sepatu di Belakang' },
    { id: 'stairs', label: 'Modern Stairs', value: 'Tangga Kontemporer yang Elegan dan Arsitektural' },
    { id: 'tennis', label: 'Sport Court', value: 'Lapangan Olahraga/Tennis Outdoor yang Modern' },
    { id: 'autumn', label: 'Autumn Park', value: 'Taman Musim Gugur dengan Daun Oranye yang Estetik' },
    { id: 'nature', label: 'Green Forest', value: 'Hutan Pinus yang Asri dan Berkabut' },
    { id: 'school', label: 'School Class', value: 'Di dalam ruang kelas sekolah dengan bangku dan papan tulis, mengenakan seragam sekolah yang rapi' },
    { id: 'sd_antiair', label: 'SD Anti Air', value: 'Rumput hijau sintetis banjir air hujan deras Memakai celana kain pendek longgar polos warna merah khas anak SD Indonesia, memakai kaos kaki putih' },
    { id: 'smp_antiair', label: 'SMP Anti Air', value: 'Rumput hijau sintetis banjir air hujan deras Memakai celana kain longgar polos warna BIRU khas anak SMP Indonesia, memakai kaos kaki putih' },
    { id: 'sma_antiair', label: 'SMA Anti Air', value: 'Rumput hijau sintetis banjir air hujan deras Memakai celana kain longgar polos warna ABU TERANG khas anak SMA Indonesia, memakai kaos kaki putih' },
  ];

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  // Crop States
  const [isCropping, setIsCropping] = useState(false);
  const [cropSource, setCropSource] = useState<'original' | 'result' | 'logo' | 'soleMotif'>('result');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const ratios = [
    { label: '1:1', value: '1:1', aspect: 1 },
    { label: '3:4', value: '3:4', aspect: 3/4 },
    { label: '4:3', value: '4:3', aspect: 4/3 },
    { label: '9:16', value: '9:16', aspect: 9/16 },
    { label: '16:9', value: '16:9', aspect: 16/9 },
  ];

  const povPresets = [
    { id: 'DEFAULT', label: 'Default', value: 'aesthetic room with books, small plants, and soft window light' },
    { id: 'BLACKBOX', label: 'Kotak Logo Emas', value: 'blackbox_goldlogo' },
    { id: 'KOREAN', label: 'Korean Style', value: 'aesthetic Korean room style with soft pastel tones and minimalist decor' },
    { id: 'LUXURY', label: 'Luxury Room', value: 'luxury minimalist interior with high-end furniture and marble accents' },
    { id: 'SCANDI', label: 'Scandi Decor', value: 'Scandinavian decor with light wood, cozy textiles, and clean lines' },
    { id: 'CREAM', label: 'Soft Cream', value: 'soft cream monochrome theme with high-key lighting and elegant textures' },
    { id: 'CAFE', label: 'Modern Cafe', value: 'modern cafe aesthetic with wooden tables, warm ambient light, and coffee shop vibes' },
    { id: 'SUNLIGHT', label: 'Morning Sun', value: 'cozy room with golden morning sunlight streaming through a window' },
    { id: 'SHELF', label: 'Shoe Shelf', value: 'standing next to a modern shoe shelf with neatly organized luxury footwear' },
  ];

  const handleImageUpload = (base64: string) => {
    setOriginalImage(base64);
    setResultImage(null);
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setProcessing({ isProcessing: true, error: null, progress: '' });
    setResultImage(null);
    setInitialResultImage(null);

    const orientations = ['Front View', 'Side View', 'Back View', 'Top Angled View'];
    const randomOrientation = activeTab === 'KATALOG' ? orientations[Math.floor(Math.random() * orientations.length)] : undefined;

    try {
      const updatedConfig: SepatuConfig = { 
        ...config, 
        mode: activeTab,
        orientation: randomOrientation,
        logo: (activeTab === 'SHOWROOM' || activeTab === 'POV') ? (logoImage || undefined) : undefined,
        soleMotif: activeTab === 'SHOWROOM' ? (soleMotifImage || undefined) : undefined,
        environment: activeTab === 'SHOWROOM' ? 'Luxury Showroom' : (activeTab === 'POV' ? 'Aesthetic Room' : (customEnv || config.environment)), 
        showroomAmbiance: (activeTab === 'SHOWROOM' || activeTab === 'POV') ? (config.showroomAmbiance || 'DEFAULT') : undefined,
        showroomColor: (activeTab === 'SHOWROOM' || activeTab === 'POV') ? (config.showroomColor || undefined) : undefined,
        showroomComposition: activeTab === 'SHOWROOM' ? (config.showroomComposition || 'FOLLOW') : undefined,
        povPreset: activeTab === 'POV' ? (config.povPreset || 'DEFAULT') : undefined,
        additionalPrompt: config.additionalPrompt,
        aspectRatio 
      };
      const result = await generateSepatu(originalImage, updatedConfig);
      setResultImage(result);
      setInitialResultImage(result);
      setBeforeImage(originalImage);
      setSliderPos(50);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memasang sepatu.", progress: '' });
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Upscaling...' });
    try {
      const sharpened = await upscaleImage(resultImage, aspectRatio);
      setResultImage(sharpened);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: "Gagal menajamkan gambar.", progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `sepatu-ai-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
      setSliderPos(50);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    const source = cropSource === 'result' ? resultImage : cropSource === 'original' ? originalImage : cropSource === 'logo' ? logoImage : soleMotifImage;
    if (!source || !croppedAreaPixels) return;
    
    // For resultImage, we don't want a loading state as requested
    if (cropSource !== 'result') {
      setProcessing({ isProcessing: true, error: null, progress: 'Memproses...' });
    }
    
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      const croppedBase64 = canvas.toDataURL('image/png');
      
      if (cropSource === 'result') {
        setResultImage(croppedBase64);
        // User wants crop to be just crop on Result.
      } else if (cropSource === 'original') {
        setOriginalImage(croppedBase64);
      } else if (cropSource === 'logo') {
        setLogoImage(croppedBase64);
      } else if (cropSource === 'soleMotif') {
        setSoleMotifImage(croppedBase64);
      }
      
      setIsCropping(false);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err) {
      setProcessing({ isProcessing: false, error: "Gagal memotong gambar.", progress: '' });
    }
  };

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden">
      <div className="max-w-2xl lg:max-w-full mx-auto lg:h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        {/* Header - Hidden on Desktop */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Footprints size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">Alas Kaki AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Professional Shoe Studio</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            {/* Column 1: Config */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              {/* Tab Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-2xl shrink-0">
                <button
                  onClick={() => setActiveTab('KATALOG')}
                  className={`flex-1 py-3 lg:py-2 rounded-xl text-[11px] lg:text-[9px] font-black uppercase transition-all flex lg:flex-col items-center justify-center gap-2 lg:gap-0.5 ${
                    activeTab === 'KATALOG' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  style={{ color: activeTab === 'KATALOG' ? primaryColor : undefined }}
                >
                  <Footprints size={12} className="shrink-0" /> PAKAI
                </button>
                <button
                  onClick={() => setActiveTab('POV')}
                  className={`flex-1 py-3 lg:py-2 rounded-xl text-[11px] lg:text-[9px] font-black uppercase transition-all flex lg:flex-col items-center justify-center gap-2 lg:gap-0.5 ${
                    activeTab === 'POV' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  style={{ color: activeTab === 'POV' ? primaryColor : undefined }}
                >
                   <Eye size={12} className="shrink-0" /> POV
                </button>
                <button
                  onClick={() => setActiveTab('SHOWROOM')}
                  className={`flex-1 py-3 lg:py-2 rounded-xl text-[11px] lg:text-[9px] font-black uppercase transition-all flex lg:flex-col items-center justify-center gap-2 lg:gap-0.5 ${
                    activeTab === 'SHOWROOM' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  style={{ color: activeTab === 'SHOWROOM' ? primaryColor : undefined }}
                >
                   <Sparkles size={12} className="shrink-0" /> TOKO
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-y-auto no-scrollbar pb-4">
                <div className="flex flex-col min-h-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <ImageIcon size={14} className="text-slate-300" /> 1. Foto Alas Kaki
                  </label>
                  <div className="h-48 lg:h-64 shrink-0">
                    <ImageUploader
                      image={originalImage}
                      onImageSelect={handleImageUpload}
                      onClear={() => { setOriginalImage(null); }}
                      onCrop={() => { setCropSource('original'); setIsCropping(true); }}
                      label="Unggah Foto Produk"
                      aspectRatio="3-4"
                      labelInside
                    />
                  </div>
                </div>

                {activeTab === 'SHOWROOM' ? (
                  <div className="space-y-8">
                    <div className="flex flex-col min-h-0">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <ImageIcon size={14} className="text-slate-300" /> 2. Unggah Logo Brand
                      </label>
                      <div className="h-40 shrink-0">
                        <ImageUploader
                          image={logoImage}
                          onImageSelect={(b64) => setLogoImage(b64)}
                          onClear={() => setLogoImage(null)}
                          onCrop={() => { setCropSource('logo'); setIsCropping(true); }}
                          label="Logo Dinding"
                          aspectRatio="1-1"
                          labelInside
                          description="Logo akan diletakkan di dinding showroom"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col min-h-0">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <ImageIcon size={14} className="text-slate-300" /> 3. Unggah Motif Alas Sol
                      </label>
                      <div className="h-40 shrink-0">
                        <ImageUploader
                          image={soleMotifImage}
                          onImageSelect={(b64) => setSoleMotifImage(b64)}
                          onClear={() => setSoleMotifImage(null)}
                          onCrop={() => { setCropSource('soleMotif'); setIsCropping(true); }}
                          label="Motif Alas Sol"
                          aspectRatio="1-1"
                          labelInside
                          description="Motif/warna untuk alas atau sol bawah sepatu"
                        />
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'POV' ? (
                  <div className="space-y-8">
                    <div className="flex flex-col min-h-0">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <ImageIcon size={14} className="text-slate-300" /> 2. Unggah Logo Brand
                      </label>
                      <div className="h-40 shrink-0">
                        <ImageUploader
                          image={logoImage}
                          onImageSelect={(b64) => setLogoImage(b64)}
                          onClear={() => setLogoImage(null)}
                          onCrop={() => { setCropSource('logo'); setIsCropping(true); }}
                          label="Logo Dinding"
                          aspectRatio="1-1"
                          labelInside
                          description="Logo akan diletakkan di dinding latar POV"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="shrink-0 space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User size={14} className="text-slate-300" /> 2. Pilih Kategori
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                        {[
                          { id: 'ANAK_LAKI', label: 'Anak Laki' },
                          { id: 'ANAK_PEREMPUAN', label: 'Anak Puan' },
                          { id: 'DEWASA_LAKI', label: 'Dewasa Laki' },
                          { id: 'DEWASA_PEREMPUAN', label: 'Dewasa Puan' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setConfig({ ...config, target: t.id as any })}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                              config.target === t.id ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                            style={{ color: config.target === t.id ? primaryColor : undefined }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Column 2: Background Settings */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              <div className="flex-1 flex flex-col min-h-0">
                {activeTab === 'KATALOG' ? (
                  <>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-slate-300" /> 3. Pilih Latar Belakang
                    </label>
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        {environmentPresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setConfig({ ...config, environment: preset.value });
                              setCustomEnv('');
                            }}
                            className={`p-2.5 rounded-xl border-2 text-[10px] font-bold text-left transition-all ${
                              config.environment === preset.value && !customEnv ? 'bg-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'
                            }`}
                            style={config.environment === preset.value && !customEnv ? { borderColor: primaryColor, color: primaryColor } : {}}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="shrink-0 mt-4">
                      <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2 block">Custom Latar (Opsional)</label>
                      <input
                        type="text"
                        value={customEnv}
                        onChange={(e) => setCustomEnv(e.target.value)}
                        placeholder="Ketik latar kustom disini..."
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl text-xs font-medium focus:border-slate-400 focus:outline-none transition-all shadow-inner mb-4"
                      />

                      <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2 block">Instruksi Tambahan (Opsional)</label>
                      <textarea
                        value={config.additionalPrompt || ''}
                        onChange={(e) => setConfig({ ...config, additionalPrompt: e.target.value })}
                        placeholder="Contoh: Tanpa tali belakang, bersihkan kotoran, tambahkan lilitan tali, dsb..."
                        rows={2}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl text-xs font-medium focus:border-slate-400 focus:outline-none transition-all shadow-inner resize-none"
                      />
                    </div>
                  </>
                ) : activeTab === 'SHOWROOM' ? (
                  <div className="flex flex-col gap-5">
                    {/* Ambiance Presets */}
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none block">1. Nuansa Ruangan</label>
                       <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'DEFAULT', label: 'Default', icon: Sparkles },
                            { id: 'DARK', label: 'Gelap Elegan', icon: Layers },
                            { id: 'BRIGHT', label: 'Putih Terang', icon: User }
                          ].map(amb => (
                            <button
                              key={amb.id}
                              onClick={() => setConfig({ ...config, showroomAmbiance: amb.id })}
                              className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                                (config.showroomAmbiance || 'DEFAULT') === amb.id ? 'bg-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}
                              style={(config.showroomAmbiance || 'DEFAULT') === amb.id ? { borderColor: primaryColor, color: primaryColor } : {}}
                            >
                               <amb.icon size={12} />
                               <span className="text-[7px] font-black uppercase text-center">{amb.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Color Context */}
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none block">2. Aksen Warna (Opsional)</label>
                       <div className="flex flex-wrap gap-1.5 items-center">
                          {[
                            { name: 'Red', hex: '#ef4444' },
                            { name: 'Blue', hex: '#3b82f6' },
                            { name: 'Green', hex: '#22c55e' },
                            { name: 'Gold', hex: '#eab308' },
                            { name: 'Pink', hex: '#ec4899' },
                            { name: 'Purple', hex: '#a855f7' }
                          ].map(color => (
                            <button
                              key={color.name}
                              onClick={() => setConfig({ ...config, showroomColor: config.showroomColor === color.name ? undefined : color.name })}
                              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                                config.showroomColor === color.name ? 'border-slate-800 scale-110 shadow-lg' : 'border-white'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                          <div className="flex items-center gap-2 ml-1">
                             <input 
                                type="color" 
                                value={config.showroomColor?.startsWith('#') ? config.showroomColor : '#ffffff'}
                                onChange={(e) => setConfig({ ...config, showroomColor: e.target.value })}
                                className="w-6 h-6 rounded-full overflow-hidden border-2 border-white cursor-pointer shadow-sm p-0 bg-transparent"
                             />
                             {config.showroomColor && (
                               <button 
                                 onClick={() => setConfig({ ...config, showroomColor: undefined })}
                                 className="text-[8px] font-black text-slate-400 hover:text-slate-600 uppercase"
                               >
                                 Reset
                               </button>
                             )}
                          </div>
                       </div>
                    </div>

                     {/* Composition Selection */}
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none block">3. Atur Posisi Alas Kaki</label>
                       <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                          {[
                            { id: 'FOLLOW', label: 'Ikuti Gambar' },
                            { id: 'REARRANGE', label: 'Atur Menarik (Hero)' },
                            { id: 'STACKED', label: 'Tumpuk Estetik' },
                            { id: 'DIAGONAL', label: 'Damping Serong' }
                          ].map(comp => (
                            <button
                              key={comp.id}
                              onClick={() => setConfig({ ...config, showroomComposition: comp.id })}
                              className={`py-2 px-1 rounded-lg text-[8px] font-black transition-all ${
                                (config.showroomComposition || 'FOLLOW') === comp.id ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                              }`}
                              style={(config.showroomComposition || 'FOLLOW') === comp.id ? { color: primaryColor } : {}}
                            >
                               {comp.label}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none block">4. Instruksi Tambahan (Opsional)</label>
                      <textarea
                        value={config.additionalPrompt || ''}
                        onChange={(e) => setConfig({ ...config, additionalPrompt: e.target.value })}
                        placeholder="Contoh: Tambahkan pantulan air di meja, buat suasana hujan di luar jendela showroom, dsb..."
                        rows={3}
                        className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-medium focus:border-slate-300 focus:outline-none transition-all shadow-inner resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {/* Pilih Latar POV */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-slate-300" /> Pilih Latar POV
                      </label>
                      <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          {povPresets.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setConfig({ ...config, povPreset: preset.value });
                              }}
                              className={`p-3 lg:p-2.5 rounded-xl border-2 text-[10px] font-bold text-left transition-all ${
                                (config.povPreset || povPresets[0].value) === preset.value ? 'bg-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'
                              }`}
                              style={(config.povPreset || povPresets[0].value) === preset.value ? { borderColor: primaryColor, color: primaryColor } : {}}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nuansa Ruangan */}
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none block">Nuansa Ruangan</label>
                       <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'DEFAULT', label: 'Default', icon: Sparkles },
                            { id: 'DARK', label: 'Gelap Elegan', icon: Layers },
                            { id: 'BRIGHT', label: 'Putih Terang', icon: User }
                          ].map(amb => (
                            <button
                              key={amb.id}
                              onClick={() => setConfig({ ...config, showroomAmbiance: amb.id })}
                              className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                                (config.showroomAmbiance || 'DEFAULT') === amb.id ? 'bg-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}
                              style={(config.showroomAmbiance || 'DEFAULT') === amb.id ? { borderColor: primaryColor, color: primaryColor } : {}}
                            >
                               <amb.icon size={12} />
                               <span className="text-[7px] font-black uppercase text-center">{amb.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Aksen Warna */}
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none block">Aksen Warna (Opsional)</label>
                       <div className="flex flex-wrap gap-1.5 items-center">
                          {[
                            { name: 'Red', hex: '#ef4444' },
                            { name: 'Blue', hex: '#3b82f6' },
                            { name: 'Green', hex: '#22c55e' },
                            { name: 'Gold', hex: '#eab308' },
                            { name: 'Pink', hex: '#ec4899' },
                            { name: 'Purple', hex: '#a855f7' }
                          ].map(color => (
                            <button
                              key={color.name}
                              onClick={() => setConfig({ ...config, showroomColor: config.showroomColor === color.name ? undefined : color.name })}
                              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                                config.showroomColor === color.name ? 'border-slate-800 scale-110 shadow-lg' : 'border-white'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                          <div className="flex items-center gap-2 ml-1">
                             <input 
                                type="color" 
                                value={config.showroomColor?.startsWith('#') ? config.showroomColor : '#ffffff'}
                                onChange={(e) => setConfig({ ...config, showroomColor: e.target.value })}
                                className="w-6 h-6 rounded-full overflow-hidden border-2 border-white cursor-pointer shadow-sm p-0 bg-transparent"
                             />
                             {config.showroomColor && (
                               <button 
                                 onClick={() => setConfig({ ...config, showroomColor: undefined })}
                                 className="text-[8px] font-black text-slate-400 hover:text-slate-600 uppercase"
                               >
                                 Reset
                               </button>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Instruksi Tambahan */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none block">Instruksi Tambahan (Opsional)</label>
                      <textarea
                        value={config.additionalPrompt || ''}
                        onChange={(e) => setConfig({ ...config, additionalPrompt: e.target.value })}
                        placeholder="Contoh: Pegangan tangan lebih rapat, tambahkan gelang mewah, dsb..."
                        rows={3}
                        className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-medium focus:border-slate-300 focus:outline-none transition-all shadow-inner resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Generate Button */}
              <div className="lg:hidden pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !originalImage}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ backgroundColor: (processing.isProcessing || !originalImage) ? '#cbd5e1' : primaryColor }}
                >
                  HASILKAN
                </button>
              </div>
            </div>

            {/* Column 3: Result Section */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
               <div className="flex items-center justify-between shrink-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Rasio
                  </label>
                  <div className="flex-1 flex items-center gap-2 lg:gap-1 overflow-x-auto no-scrollbar justify-end ml-4">
                    {ratios.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setAspectRatio(r.value as any)}
                        className={`px-3 py-1.5 lg:px-2 lg:py-1 rounded-lg border transition-all text-[10px] lg:text-[8px] font-black shrink-0 ${
                          aspectRatio === r.value 
                            ? 'shadow-sm' 
                            : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                        }`}
                        style={{
                          backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                          color: aspectRatio === r.value ? 'white' : undefined,
                          borderColor: aspectRatio === r.value ? primaryColor : undefined,
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className="bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner w-full h-full"
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
                    aspectRatio: aspectRatio.replace(':', '/')
                  }}
                >
                  <AnimatePresence mode="wait">
                    {processing.isProcessing ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                      >
                         <div className="w-16 h-16 relative">
                            <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" alt="Guber Logo" className="w-full h-full object-contain animate-spin" />
                         </div>
                         <h3 className="mt-4 font-black uppercase tracking-[0.3em] text-slate-400 text-[10px] animate-pulse">{processing.progress || 'Studio AI Processing...'}</h3>
                      </motion.div>
                    ) : resultImage ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                      >
                        {/* BEFORE/AFTER SLIDER */}
                        <div className="absolute inset-0">
                          <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                        </div>
                        {beforeImage && (
                          <>
                            <div 
                              className="absolute inset-0 overflow-hidden"
                              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                            >
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center p-8 lg:p-16">
                                 <img src={beforeImage} alt="Original" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                              </div>
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
                          </>
                        )}
                        
                        {/* LABELS */}
                        <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest z-30">
                          PRODUK
                        </div>
                        <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[8px] font-black text-slate-900 uppercase tracking-widest z-30">
                          STUDIO AI
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center select-none opacity-40">
                         <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                            <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" alt="Guber Logo" className="w-12 h-12 object-contain grayscale opacity-50" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum Ada Hasil</p>
                      </div>
                    )}
                  </AnimatePresence>
               </div>
               </div>

                {/* Footer Actions */}
                <div className="grid grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3 w-full mx-auto">
                  <button 
                    onClick={handleGenerate}
                    disabled={processing.isProcessing || !originalImage}
                    title="Generate"
                    className="hidden lg:flex order-5 lg:order-first col-span-1 lg:col-span-2 py-4 rounded-2xl border-2 text-white items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                    style={{ 
                      backgroundColor: (processing.isProcessing || !originalImage) ? '#cbd5e1' : primaryColor,
                      borderColor: (processing.isProcessing || !originalImage) ? '#cbd5e1' : primaryColor
                    }}
                  >
                    <span className="font-black uppercase tracking-widest text-[10px]">HASILKAN</span>
                  </button>

                  <button 
                    onClick={() => setShowPreview(true)}
                    disabled={!resultImage || processing.isProcessing}
                    title="Preview"
                    className="order-1 lg:order-2 py-4 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => { setCropSource('result'); setIsCropping(true); }}
                    disabled={!resultImage || processing.isProcessing}
                    title="Crop"
                    className="order-2 lg:order-3 py-4 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                  >
                    <Scissors size={20} />
                  </button>
                  <button 
                    onClick={handleSharpen}
                    disabled={!resultImage || processing.isProcessing}
                    title="Upscale"
                    className="order-3 lg:order-4 py-4 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                  >
                    <Zap size={20} />
                  </button>
                  <button 
                    onClick={handleReset}
                    disabled={!resultImage || processing.isProcessing || resultImage === initialResultImage}
                    title="Reset"
                    className="order-4 lg:order-5 py-4 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                  >
                    <Recycle size={20} />
                  </button>
                  <button 
                    onClick={handleDownload}
                    disabled={!resultImage || processing.isProcessing}
                    title="Download"
                    className="order-6 lg:order-6 py-4 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                  >
                    <Download size={20} />
                  </button>
                </div>

                {processing.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-center"
                  >
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{processing.error}</p>
                  </motion.div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && resultImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 lg:p-12"
            onClick={() => setShowPreview(false)}
          >
             <button
              onClick={() => setShowPreview(false)}
              className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={resultImage} 
                className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white/5 shadow-amber-500/10" 
                alt="Full Preview" 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropping && (cropSource === 'result' ? resultImage : cropSource === 'original' ? originalImage : cropSource === 'logo' ? logoImage : soleMotifImage) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Sesuaikan Tampilan</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase"
                >
                  Batal
                </button>
                <button
                  onClick={handleCropSave}
                  className="px-6 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase flex items-center gap-2"
                >
                  <Check size={14} /> Simpan
                </button>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <Cropper
                image={cropSource === 'result' ? resultImage! : cropSource === 'original' ? originalImage! : cropSource === 'logo' ? logoImage! : soleMotifImage!}
                crop={crop}
                zoom={zoom}
                aspect={cropSource === 'result' ? (ratios.find(r => r.value === aspectRatio)?.aspect) : undefined}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 bg-black/50 backdrop-blur-md flex flex-col items-center gap-4">
              <div className="w-full max-w-xs space-y-4">
                <div className="flex justify-between text-[10px] font-black text-white/60 uppercase tracking-widest">
                  <span>Pembesaran</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuberSepatu;
