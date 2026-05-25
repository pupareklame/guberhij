import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  User, 
  Briefcase, 
  MapPin, 
  Camera, 
  Palette, 
  X,
  Maximize,
  Download,
  RefreshCw,
  Eye,
  Scissors,
  Zap,
  Recycle,
  Check,
  Layers,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { CitaCitaConfig, ProcessingState } from '../types';
import { generateCitaCita } from '../services/citacita';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const DREAM_JOBS = [
  { id: 'DOKTER', name: 'Dokter', icon: '🩺' },
  { id: 'PILOT', name: 'Pilot', icon: '👨‍✈️' },
  { id: 'ASTRONOT', name: 'Astronot', icon: '👨‍🚀' },
  { id: 'POLISI', name: 'Polisi', icon: '👮' },
  { id: 'TENTARA', name: 'Tentara', icon: '🪖' },
  { id: 'PEMADAM', name: 'Pemadam Kebakaran', icon: '👩‍🚒' },
  { id: 'KOKI', name: 'Koki / Chef', icon: '👨‍🍳' },
  { id: 'GURU', name: 'Guru / Dosen', icon: '👨‍🏫' },
  { id: 'ATLET', name: 'Atlet Profesional', icon: '🏅' },
  { id: 'PENGUSAHA', name: 'Pengusaha Sukses', icon: '💼' },
  { id: 'ARTIS', name: 'Artis / Selebriti', icon: '🎬' },
  { id: 'MUSISI', name: 'Musisi', icon: '🎸' },
  { id: 'PELUKIS', name: 'Pelukis', icon: '🎨' },
  { id: 'ILMUWAN', name: 'Ilmuwan', icon: '🔬' },
  { id: 'HAKIM', name: 'Hakim / Jaksa', icon: '⚖️' },
  { id: 'ARSITEK', name: 'Arsitek', icon: '📐' },
  { id: 'PROGRAMMER', name: 'Programmer / IT', icon: '💻' },
  { id: 'PETANI_MODERN', name: 'Petani Modern', icon: '🚜' },
  { id: 'PEMAIN_VOLI', name: 'Pemain Voli', icon: '🏐' },
  { id: 'PRESIDEN', name: 'Presiden RI', icon: '🇮🇩' },
];

const POSES = [
  { id: 'FORMAL', name: 'Formal & Tegak', prompt: 'standing straight and formal, professional posture' },
  { id: 'COOL_FOLDED', name: 'Tangan Dilipat (Cool)', prompt: 'half-body shot, arms crossed over chest or upper stomach, body slightly tilted, face facing camera, cool expression with a slight smile' },
  { id: 'ACTION', name: 'Sedang Beraksi', prompt: 'in the middle of performing a professional action related to the job' },
  { id: 'STYLISH', name: 'Stylish & Trendy', prompt: 'stylish and trendy pose, fashion-forward' },
  { id: 'SMILING', name: 'Tersenyum Ramah', prompt: 'friendly smiling pose, looking approachable' },
  { id: 'DETERMINED', name: 'Tegas & Berwibawa', prompt: 'determined and authoritative pose, strong presence' },
  { id: 'SERONG_KANAN', name: 'Setengah Badan Serong Kanan', prompt: 'half-body shot, body angled 45 degrees to the right, facing camera, professional state portrait pose, arms down naturally at sides' },
  { id: 'SERONG_KIRI', name: 'Setengah Badan Serong Kiri', prompt: 'half-body shot, body angled 45 degrees to the left, facing camera, professional state portrait pose, arms down naturally at sides' },
  { id: 'RELAXED', name: 'Santai & Natural', prompt: 'relaxed and natural pose, casual professional' },
];

const ENVIRONMENTS = [
  { id: 'PLAIN', name: 'Polos (Studio Background)', prompt: 'plain studio background, solid color, minimalist' },
  { id: 'FOLLOW_JOB', name: 'Mengikuti Cita-Cita', prompt: 'environment that perfectly matches the professional setting of the dream job' },
  { id: 'WORKSPACE', name: 'Ruang Kerja / Kantor', prompt: 'modern office or workspace environment' },
  { id: 'OUTDOOR', name: 'Luar Ruangan / Alam', prompt: 'outdoor natural environment' },
  { id: 'STUDIO', name: 'Studio Foto Profesional', prompt: 'professional photography studio with lighting' },
  { id: 'CITY', name: 'Pusat Kota / Urban', prompt: 'busy city street or urban setting' },
  { id: 'FUTURISTIC', name: 'Masa Depan / Futuristik', prompt: 'high-tech futuristic environment' },
  { id: 'CLASSIC', name: 'Klasik / Vintage', prompt: 'classic or vintage historical setting' },
];

const STYLES = [
  { id: 'FOTOREALISTIK', name: 'Fotorealistik' },
  { id: 'CINEMATIC', name: 'Cinematic' },
  { id: 'ANIME', name: 'Anime Style' },
  { id: '3D_RENDER', name: '3D Render' },
];

const GENDERS = [
  { id: 'PRIA', name: 'Pria Dewasa' },
  { id: 'WANITA', name: 'Wanita Dewasa' },
  { id: 'ANAK_LAKI', name: 'Anak Laki-laki' },
  { id: 'ANAK_PEREMPUAN', name: 'Anak Perempuan' },
];

const JERSEY_MOTIFS = [
  { id: 'SOLID', name: 'Polos' },
  { id: 'STRIPES', name: 'Garis-garis (Stripes)' },
  { id: 'GRADIENT', name: 'Gradasi Modern' },
  { id: 'DIGITAL_PRINT', name: 'Digital Print Abstract' },
  { id: 'WAVE', name: 'Ombak (Wave Pattern)' },
  { id: 'HEXAGON', name: 'Hexagon Tech' },
];

const JERSEY_COLORS = [
  { id: 'MERAH', name: 'Merah', hex: '#ef4444' },
  { id: 'BIRU', name: 'Biru', hex: '#3b82f6' },
  { id: 'KUNING', name: 'Kuning', hex: '#eab308' },
  { id: 'HIJAU', name: 'Hijau', hex: '#22c55e' },
  { id: 'HITAM', name: 'Hitam', hex: '#18181b' },
  { id: 'PUTIH', name: 'Putih', hex: '#ffffff' },
  { id: 'ORANGE', name: 'Oranye', hex: '#f97316' },
];

const GuberCitaCita: React.FC = () => {
  const { primaryColor } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResultImage, setInitialResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [showPreview, setShowPreview] = useState(false);
  
  // Crop States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const [config, setConfig] = useState<CitaCitaConfig>({
    dreamJob: 'DOKTER',
    pose: 'half-body shot, arms crossed over chest or upper stomach, body slightly tilted, face facing camera, cool expression with a slight smile',
    environment: 'FOLLOW_JOB',
    gender: 'PRIA',
    style: 'FOTOREALISTIK',
    aspectRatio: '9:16',
    additionalPrompt: '',
    userName: '',
    userJobTitle: '',
    jerseyColor: 'BIRU',
    jerseyMotif: 'SOLID',
    sleeveType: 'PENDEK',
  });

  const ratios = [
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const handleImageUpload = (base64: string) => {
    setImage(base64);
    setResultImage(null);
  };

  const handleProcessCitaCita = async () => {
    if (!image) return;

    setResultImage(null);
    setProcessing({ isProcessing: true, error: null, progress: 'Menciptakan Masa Depan...' });

    try {
      const result = await generateCitaCita(image, config);
      setResultImage(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memproses cita-cita.", progress: '' });
    }
  };

  const currentAspect = ratios.find(r => r.value === config.aspectRatio)?.value.replace(':', '/') || '9/16';

  const handleReset = () => {
    if (initialResultImage) {
      setResultImage(initialResultImage);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `citacita-${config.dreamJob.toLowerCase()}-${Date.now()}.png`;
    link.click();
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
    if (!resultImage || !croppedAreaPixels || croppedAreaPixels.width === 0) {
      setIsCropping(false);
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Memotong Gambar...' });
    
    try {
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

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

      const croppedResult = canvas.toDataURL('image/png');

      setResultImage(croppedResult);
      setIsCropping(false);
      
      setTimeout(() => {
        setProcessing({ isProcessing: false, error: null, progress: '' });
      }, 100);
    } catch (e: any) {
      console.error("Crop Error:", e);
      setProcessing({ isProcessing: false, error: 'Gagal memotong gambar: ' + (e.message || 'Unknown error'), progress: '' });
      setIsCropping(false);
    }
  };

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden text-slate-900 font-sans">
      <div className="max-w-2xl lg:max-w-full mx-auto lg:h-full bg-white flex flex-col border-x border-slate-100 shadow-sm relative">
        
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
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">CITA-CITA AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Guber AI Studio</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col font-sans">
            
            {/* Column 1: Identity & Subject */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
               {/* Subject Upload */}
               <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <User size={14} className="text-slate-300" /> 1. Foto Anda
                </label>
                <div className="lg:flex-1 min-h-0">
                  <ImageUploader
                    label="Pilih Foto Anda"
                    image={image}
                    onImageSelect={handleImageUpload}
                    onClear={() => { setImage(null); }}
                    aspectRatio={config.aspectRatio.replace(':', '-')}
                    labelInside
                  />
                </div>
              </div>

              {/* Name & Title */}
              <div className="shrink-0 space-y-3 p-4 bg-slate-50 rounded-[24px] border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                  <input 
                    type="text"
                    value={config.userName}
                    onChange={(e) => setConfig({...config, userName: e.target.value})}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-400 transition-all uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Jabatan Impian</label>
                  <input 
                    type="text"
                    value={config.userJobTitle}
                    onChange={(e) => setConfig({...config, userJobTitle: e.target.value})}
                    placeholder="Contoh: CEO Termuda"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-400 transition-all italic"
                  />
                </div>
                
                <div className="pt-2 border-t border-slate-200 space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Kategori</label>
                   <select 
                    value={config.gender}
                    onChange={(e) => setConfig({...config, gender: e.target.value as any})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none appearance-none cursor-pointer"
                  >
                    {GENDERS.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Column 2: Career Config */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Briefcase size={14} className="text-slate-300" /> 2. Pilih Masa Depan
                </label>
                
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar lg:pr-1 space-y-6">
                  {/* Job Presets Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {DREAM_JOBS.map(job => (
                      <button 
                        key={job.id} 
                        onClick={() => setConfig({...config, dreamJob: job.id})}
                        className={`flex flex-col items-center justify-center p-3 rounded-[24px] border-2 transition-all duration-300 min-h-[64px] group ${
                          config.dreamJob === job.id 
                            ? 'scale-[1.02] shadow-md text-white border-transparent' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-white'
                        }`}
                        style={{ backgroundColor: config.dreamJob === job.id ? primaryColor : undefined }}
                      >
                        <span className="text-xl mb-1 transition-transform group-hover:scale-110">{job.icon}</span>
                        <span className="text-[8px] font-black uppercase text-center leading-tight tracking-tight">{job.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Volley Specific Options */}
                  <AnimatePresence>
                    {config.dreamJob === 'PEMAIN_VOLI' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-[28px]"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Warna Jersey</label>
                            <select 
                              value={config.jerseyColor}
                              onChange={(e) => setConfig({...config, jerseyColor: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-[10px] font-bold text-slate-900"
                            >
                              {JERSEY_COLORS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Motif</label>
                            <select 
                              value={config.jerseyMotif}
                              onChange={(e) => setConfig({...config, jerseyMotif: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-[10px] font-bold text-slate-900"
                            >
                              {JERSEY_MOTIFS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                          {(['PENDEK', 'PANJANG'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => setConfig({...config, sleeveType: s})}
                              className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${config.sleeveType === s ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}
                            >
                              {s === 'PENDEK' ? 'Pendek' : 'Panjang'}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pose & Env Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pose</label>
                      <select 
                        value={config.pose}
                        onChange={(e) => setConfig({...config, pose: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold text-slate-900 outline-none"
                      >
                        {POSES.map(p => <option key={p.id} value={p.prompt}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Latar Belakang</label>
                      <select 
                        value={config.environment}
                        onChange={(e) => setConfig({...config, environment: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold text-slate-900 outline-none"
                      >
                        {ENVIRONMENTS.map(env => <option key={env.id} value={env.prompt}>{env.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Prompt Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Instruksi Tambahan</label>
                    <textarea
                      value={config.additionalPrompt}
                      onChange={(e) => setConfig({...config, additionalPrompt: e.target.value})}
                      placeholder="Contoh: Memakai kacamata..."
                      className="w-full h-20 p-3 bg-slate-50 border-2 border-slate-100 rounded-[20px] text-[10px] font-medium focus:border-slate-300 resize-none outline-none shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Generate Button */}
              <div className="lg:hidden pt-4">
                <button 
                  onClick={handleProcessCitaCita}
                  disabled={processing.isProcessing || !image}
                  className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !image) ? '#cbd5e1' : primaryColor 
                  }}
                >
                  WUJUDKAN CITA-CITA
                </button>
              </div>
            </div>

            {/* Column 3: Result Area */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Camera size={14} className="text-slate-300" /> Hasil Visualisasi
                  </label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {ratios.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setConfig({...config, aspectRatio: r.value as any})}
                        className={`px-2 py-1 rounded-md text-[8px] font-black transition-all ${config.aspectRatio === r.value ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                   <div className="px-3 py-1 bg-slate-100 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                     Neural Render Engine v3
                   </div>
                </div>
              </div>
              
              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className={`bg-slate-50 border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner ${
                    config.aspectRatio === '1:1' ? 'aspect-square' :
                    config.aspectRatio === '3:4' ? 'aspect-[3/4]' :
                    config.aspectRatio === '4:3' ? 'aspect-[4/3]' :
                    config.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                    'aspect-[16/9]'
                  }`}
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: currentAspect
                  }}
                >
                  <AnimatePresence mode="wait">
                    {processing.isProcessing ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-sm px-6 text-center"
                      >
                        <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                          {processing.progress || 'Neural Studio sedang menjahit...'}
                        </p>
                      </motion.div>
                    ) : resultImage ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative group"
                      >
                        {/* BEFORE/AFTER SLIDER */}
                        <div className="absolute inset-0">
                          <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                        </div>
                        <div 
                          className="absolute inset-0 overflow-hidden shadow-2xl"
                          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                          <img src={image!} alt="Original" className="w-full h-full object-cover" />
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

                        {/* Caption Overlay */}
                        {(config.userName || config.userJobTitle) && (
                          <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white text-center z-30 pointer-events-none group-hover:opacity-100 transition-opacity">
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                              <p className="text-sm font-black uppercase tracking-[0.3em] mb-1 drop-shadow-xl">{config.userName}</p>
                              <p className="text-[10px] font-bold opacity-80 italic tracking-wider px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full inline-block border border-white/20">{config.userJobTitle}</p>
                            </motion.div>
                          </div>
                        )}

                        {/* LABELS */}
                        <div className="absolute top-6 left-6 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest z-30">
                          Asli
                        </div>
                        <div className="absolute top-6 right-6 px-3 py-1 bg-white/40 backdrop-blur-md rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest z-30">
                          Masa Depan
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
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3 w-full mx-auto shrink-0 mb-4 lg:mb-0">
                <button 
                  onClick={handleProcessCitaCita}
                  disabled={processing.isProcessing || !image}
                  className="hidden lg:flex order-5 lg:order-first col-span-1 lg:col-span-2 py-4 rounded-2xl border-2 text-white items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                  style={{ 
                    backgroundColor: (processing.isProcessing || !image) ? '#cbd5e1' : primaryColor, 
                    borderColor: (processing.isProcessing || !image) ? '#cbd5e1' : primaryColor 
                  }}
                >
                  <span className="font-black uppercase tracking-widest text-[10px]">REGENERASI</span>
                </button>

                <button 
                  onClick={() => setShowPreview(true)}
                  disabled={processing.isProcessing || !resultImage}
                  className="order-1 lg:order-2 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Eye size={20} />
                </button>
                <button 
                  onClick={() => setIsCropping(true)}
                  disabled={processing.isProcessing || !resultImage}
                  className="order-2 lg:order-3 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Scissors size={20} />
                </button>
                <button 
                  onClick={() => {}} // Sharpen not implemented
                  disabled={true}
                  className="order-3 lg:order-4 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm opacity-30"
                >
                  <Zap size={20} />
                </button>
                <button 
                  onClick={handleReset}
                  disabled={processing.isProcessing || !resultImage || resultImage === initialResultImage}
                  className="order-4 lg:order-5 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Recycle size={20} />
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={processing.isProcessing || !resultImage}
                  className="order-6 lg:order-6 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                >
                  <Download size={20} />
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {processing.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest shrink-0"
                  >
                    {processing.error}
                  </motion.div>
                )}
              </AnimatePresence>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Visualisasi</h2>
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
                image={resultImage}
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

export default GuberCitaCita;
