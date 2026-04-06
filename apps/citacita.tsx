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
];

const POSES = [
  { id: 'FORMAL', name: 'Formal & Tegak', prompt: 'standing straight and formal, professional posture' },
  { id: 'COOL_FOLDED', name: 'Tangan Dilipat (Cool)', prompt: 'half-body shot, arms crossed over chest or upper stomach, body slightly tilted, face facing camera, cool expression with a slight smile' },
  { id: 'ACTION', name: 'Sedang Beraksi', prompt: 'in the middle of performing a professional action related to the job' },
  { id: 'STYLISH', name: 'Stylish & Trendy', prompt: 'stylish and trendy pose, fashion-forward' },
  { id: 'SMILING', name: 'Tersenyum Ramah', prompt: 'friendly smiling pose, looking approachable' },
  { id: 'DETERMINED', name: 'Tegas & Berwibawa', prompt: 'determined and authoritative pose, strong presence' },
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
    aspectRatio: '3:4',
    additionalPrompt: '',
    userName: '',
    userJobTitle: '',
  });

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const handleImageUpload = (base64: string) => {
    setImage(base64);
    setResultImage(null);
  };

  const handleProcessCitaCita = async () => {
    if (!image) return;

    setResultImage(null);
    setProcessing({ isProcessing: true, error: null, progress: 'Visualizing Future...' });

    try {
      const result = await generateCitaCita(image, config);
      setResultImage(result);
      setInitialResultImage(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message || "Gagal memproses cita-cita.", progress: '' });
    }
  };

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

    setProcessing({ isProcessing: true, error: null, progress: 'Cropping Image...' });
    
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
    <div className="h-full bg-slate-50/50 overflow-y-auto lg:overflow-hidden custom-scrollbar">
      <div className="max-w-2xl lg:max-w-7xl mx-auto min-h-full lg:h-screen bg-white flex flex-col border-x border-slate-100 shadow-sm">
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">CITA-CITA AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Career Visualization</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-12 lg:flex-1 lg:overflow-hidden">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:h-full lg:overflow-hidden">
            <div className="space-y-8 lg:h-full lg:overflow-y-auto lg:pr-6 custom-scrollbar">
              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-slate-300" /> 1. Foto Anda
                </label>
                <ImageUploader
                  label="Pilih Foto Anda"
                  image={image}
                  onImageSelect={handleImageUpload}
                  onClear={() => { setImage(null); }}
                  aspectRatio="3-4"
                  labelInside
                />
              </div>

              {/* Name & Title Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} className="text-slate-300" /> Nama Anda
                  </label>
                  <input 
                    type="text"
                    value={config.userName}
                    onChange={(e) => setConfig({...config, userName: e.target.value})}
                    placeholder="Masukkan Nama..."
                    className="w-full bg-slate-100 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-slate-200 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-300" /> Cita-Cita
                  </label>
                  <input 
                    type="text"
                    value={config.userJobTitle}
                    onChange={(e) => setConfig({...config, userJobTitle: e.target.value})}
                    placeholder="Contoh: Dokter Spesialis..."
                    className="w-full bg-slate-100 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-slate-200 transition-all"
                  />
                </div>
              </div>

              {/* Career Config */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-300" /> 2. Pilih Cita-Cita
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <select 
                      value={config.dreamJob}
                      onChange={(e) => setConfig({...config, dreamJob: e.target.value})}
                      className="col-span-2 w-full bg-white border-0 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {DREAM_JOBS.map(job => (
                        <option key={job.id} value={job.id}>{job.icon} {job.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={14} className="text-slate-300" /> 3. Kategori
                    </label>
                    <div className="p-1 bg-slate-100 rounded-2xl">
                      <select 
                        value={config.gender}
                        onChange={(e) => setConfig({...config, gender: e.target.value as any})}
                        className="w-full bg-white border-0 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {GENDERS.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Maximize size={14} className="text-slate-300" /> 4. Pose
                    </label>
                    <div className="p-1 bg-slate-100 rounded-2xl">
                      <select 
                        value={config.pose}
                        onChange={(e) => setConfig({...config, pose: e.target.value})}
                        className="w-full bg-white border-0 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {POSES.map(p => (
                          <option key={p.id} value={p.prompt}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-slate-300" /> 5. Lingkungan
                    </label>
                    <div className="p-1 bg-slate-100 rounded-2xl">
                      <select 
                        value={config.environment}
                        onChange={(e) => setConfig({...config, environment: e.target.value})}
                        className="w-full bg-white border-0 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {ENVIRONMENTS.map(env => (
                          <option key={env.id} value={env.prompt}>{env.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Palette size={14} className="text-slate-300" /> 6. Gaya Visual
                    </label>
                    <div className="p-1 bg-slate-100 rounded-2xl">
                      <select 
                        value={config.style}
                        onChange={(e) => setConfig({...config, style: e.target.value as any})}
                        className="w-full bg-white border-0 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {STYLES.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-slate-300" /> 7. Instruksi Tambahan
                  </label>
                  <div className="relative">
                    <textarea
                      value={config.additionalPrompt}
                      onChange={(e) => setConfig({...config, additionalPrompt: e.target.value})}
                      placeholder="Contoh: Tambahkan kacamata, pegang stetoskop..."
                      className="w-full h-24 p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-xs font-medium focus:border-slate-200 focus:outline-none resize-none transition-all"
                    />
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={() => setConfig({...config, additionalPrompt: ''})}
                        disabled={!config.additionalPrompt.trim() || processing.isProcessing}
                        className="p-2 bg-white shadow-lg border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio Selection */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> 8. Pilih Aspek Rasio
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {ratios.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setConfig({...config, aspectRatio: r.value as any})}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                          config.aspectRatio === r.value 
                            ? 'scale-105' 
                            : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white'
                        }`}
                        style={{
                          backgroundColor: config.aspectRatio === r.value ? primaryColor : undefined,
                          color: config.aspectRatio === r.value ? 'white' : undefined,
                          borderColor: config.aspectRatio === r.value ? primaryColor : undefined,
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
              </div>

              <div className="">
                <button
                  onClick={handleProcessCitaCita}
                  disabled={processing.isProcessing || !image}
                  className="w-full disabled:bg-slate-300 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
                  style={{ 
                    backgroundColor: processing.isProcessing || !image ? undefined : primaryColor,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  {processing.isProcessing ? (
                    <span className="relative z-10">SEDANG PROSES...</span>
                  ) : (
                    <span className="text-lg relative z-10">WUJUDKAN CITA-CITA</span>
                  )}
                </button>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-4 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:flex lg:flex-col lg:justify-center">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-300" /> Hasil Visualisasi
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
                      <img src={image!} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
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
                      
                      {/* Caption Overlay */}
                      {(config.userName || config.userJobTitle) && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white text-center z-30 pointer-events-none">
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <p className="text-sm font-black uppercase tracking-[0.2em] mb-1 drop-shadow-lg">{config.userName}</p>
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-[1px] w-4 bg-white/30" />
                              <p className="text-[9px] font-bold opacity-90 italic tracking-wider">{config.userJobTitle}</p>
                              <div className="h-[1px] w-4 bg-white/30" />
                            </div>
                          </motion.div>
                        </div>
                      )}
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
                  onClick={() => {}} // Sharpen not implemented for this app
                  disabled={true}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all opacity-30 border-slate-50 cursor-not-allowed`}
                  style={{ color: primaryColor }}
                  title="Tajamkan"
                >
                  <Zap size={20} />
                </button>
                <button
                  onClick={handleReset}
                  disabled={!resultImage || processing.isProcessing || resultImage === initialResultImage}
                  className={`flex items-center justify-center py-4 bg-white border-2 rounded-2xl transition-all ${
                    !resultImage || processing.isProcessing || resultImage === initialResultImage
                      ? 'opacity-30 border-slate-50 cursor-not-allowed' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                  style={{ color: primaryColor }}
                  title="Reset"
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
          </div>
        </div>

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
