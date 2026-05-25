import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  User,
  Palette,
  Scissors,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Layers,
  Eye,
  X,
  RefreshCw,
  Maximize,
  Crop,
  Zap
} from 'lucide-react';
import { generateHairTransformation } from '../services/hairService';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';
import { ProcessingState } from '../types';

const HAIR_STYLES = [
  // Female
  { id: 'short_bob', name: 'Short Bob', gender: 'female' },
  { id: 'long_waves', name: 'Long Waves', gender: 'female' },
  { id: 'pixie_cut', name: 'Pixie Cut', gender: 'female' },
  { id: 'ponytail', name: 'Ponytail', gender: 'female' },
  { id: 'straight_long', name: 'Straight Long', gender: 'female' },
  { id: 'layered_cut', name: 'Layered Cut', gender: 'female' },
  { id: 'french_braid', name: 'French Braid', gender: 'female' },
  { id: 'messy_bun', name: 'Messy Bun', gender: 'female' },
  { id: 'curtain_bangs', name: 'Curtain Bangs', gender: 'female' },
  { id: 'shag_cut', name: 'Modern Shag', gender: 'female' },
  { id: 'balayage_waves', name: 'Balayage Waves', gender: 'female' },
  { id: 'high_updo', name: 'High Updo', gender: 'female' },
  { id: 'space_buns', name: 'Space Buns', gender: 'female' },
  { id: 'box_braids', name: 'Box Braids', gender: 'female' },
  
  // Male
  { id: 'buzz_cut', name: 'Buzz Cut', gender: 'male' },
  { id: 'pompadour', name: 'Pompadour', gender: 'male' },
  { id: 'undercut', name: 'Undercut', gender: 'male' },
  { id: 'side_part', name: 'Side Part', gender: 'male' },
  { id: 'crew_cut', name: 'Crew Cut', gender: 'male' },
  { id: 'slick_back', name: 'Slick Back', gender: 'male' },
  { id: 'man_bun', name: 'Man Bun', gender: 'male' },
  { id: 'mullet', name: 'Modern Mullet', gender: 'male' },
  { id: 'taper_fade', name: 'Taper Fade', gender: 'male' },
  { id: 'quiff', name: 'Textured Quiff', gender: 'male' },
  { id: 'top_knot', name: 'Top Knot', gender: 'male' },
  { id: 'flat_top', name: 'Flat Top', gender: 'male' },
  { id: 'wolf_cut_m', name: 'Wolf Cut', gender: 'male' },
  { id: 'mohawk', name: 'Short Mohawk', gender: 'male' },

  // Unisex / Special
  { id: 'curly_afro', name: 'Curly Afro', gender: 'unisex' },
  { id: 'dreadlocks', name: 'Dreadlocks', gender: 'unisex' },
  { id: 'mullet_modern', name: 'Modern Mullet', gender: 'unisex' },
    { id: 'wolf_cut', name: 'Wolf Cut', gender: 'unisex' },
  { id: 'custom', name: 'Custom Style ✍️', gender: 'unisex' },
  { id: 'default_tidy', name: 'TIDAK MEMILIH (OTOMATIS)', gender: 'unisex' },
];

const HAIR_COLORS = [
  { id: 'natural_black', name: 'Natural Black', hex: '#000000' },
  { id: 'dark_brown', name: 'Dark Brown', hex: '#3b2219' },
  { id: 'ash_blonde', name: 'Ash Blonde', hex: '#d1b394' },
  { id: 'platinum_blonde', name: 'Platinum Blonde', hex: '#f0e6d2' },
  { id: 'honey_blonde', name: 'Honey Blonde', hex: '#e3b474' },
  { id: 'copper_red', name: 'Copper Red', hex: '#b85c38' },
  { id: 'cherry_red', name: 'Cherry Red', hex: '#8b0000' },
  { id: 'pastel_pink', name: 'Pastel Pink', hex: '#f8c8dc' },
  { id: 'silver_grey', name: 'Silver Grey', hex: '#c0c0c0' },
  { id: 'blue_black', name: 'Blue Black', hex: '#00008b' },
];

const GuberRambut: React.FC = () => {
  const { primaryColor } = useTheme();
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [imageRatio, setImageRatio] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [initialResult, setInitialResult] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(HAIR_STYLES.find(s => s.id === 'default_tidy')!);
  const [customStyle, setCustomStyle] = useState('');
  const [selectedColor, setSelectedColor] = useState(HAIR_COLORS[0]);
  const [customHex, setCustomHex] = useState('#ff0000');
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [gender, setGender] = useState('male');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [sliderPos, setSliderPos] = useState(50);
  const [showPreview, setShowPreview] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const ratios = [
    { label: '1:1', value: '1:1' },
    { label: '3:4', value: '3:4' },
    { label: '4:3', value: '4:3' },
    { label: '9:16', value: '9:16' },
    { label: '16:9', value: '16:9' },
  ];

  const handleFileUpload = (base64: string) => {
    setBaseImage(base64);
    setResultImage(null);
    setProcessing({ ...processing, error: null });

    // Handle aspect ratio detection
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      setImageRatio(ratio.toString());
    };
    img.src = base64;
  };

  const startTransformation = async () => {
    if (!baseImage) return;
    
    let finalStyle = '';
    if (selectedStyle.id === 'custom') {
      finalStyle = customStyle;
    } else if (selectedStyle.id === 'default_tidy') {
      finalStyle = "Rapi dan berminyak rambut (pomade look), shiny healthy hair, well-groomed";
    } else {
      finalStyle = selectedStyle.name;
    }

    if (selectedStyle.id === 'custom' && !finalStyle.trim()) {
      setProcessing({ ...processing, error: "Tuliskan gaya rambut kustom kamu!" });
      return;
    }

    setProcessing({ isProcessing: true, error: null, progress: 'Neural Hair Styling...' });
    setResultImage(null);

    try {
      const hairColorValue = selectedColor.id === 'custom' ? `Custom Hex: ${customHex}` : selectedColor.name;
      const result = await generateHairTransformation(
        baseImage,
        finalStyle,
        hairColorValue,
        gender,
        aspectRatio
      );
      setResultImage(result);
      setInitialResult(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ 
        isProcessing: false, 
        error: err?.message || "Gagal mengubah gaya rambut. Silakan coba lagi.",
        progress: ''
      });
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `guber-rambut-${Date.now()}.png`;
    link.click();
  };

  const handleGenerateWithLink = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    startTransformation();
    
    // Open link on 1st, 4th, 7th... click
    if (newCount % 3 === 1) {
      window.open('https://s.shopee.co.id/6fdszNDSY1', '_blank');
    }
  };

  const filteredStyles = HAIR_STYLES.filter(s => s.gender === gender || s.gender === 'unisex');

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden">
      <div className="max-w-2xl lg:max-w-full mx-auto lg:h-full bg-white flex flex-col border-x border-slate-100 shadow-sm">
        
        {/* Header - Mobile Only Context Style */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center text-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Scissors size={16} />
              </div>
              <div className="flex flex-col text-left">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">HAIR STYLIST AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Grooming Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* COLUMN 1: Base Image & Gender */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <User size={14} className="text-slate-300" /> 1. Foto Wajah
                </label>
                <div className="lg:flex-1 min-h-0 flex flex-col items-center justify-center">
                  <div 
                    className="w-full max-h-full transition-all duration-500 overflow-hidden rounded-[32px]" 
                    style={{ aspectRatio: imageRatio || '9/16' }}
                  >
                    <ImageUploader
                      label="Pilih Foto Selfie"
                      image={baseImage}
                      onImageSelect={handleFileUpload}
                      onClear={() => { setBaseImage(null); setResultImage(null); setImageRatio(null); }}
                      aspectRatio="original"
                      labelInside
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-slate-300" /> 2. Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                  {['female', 'male'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-3 lg:py-1.5 rounded-xl text-[11px] lg:text-[9px] font-black uppercase transition-all ${gender === g ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      style={{ color: gender === g ? primaryColor : undefined }}
                    >
                      {g === 'female' ? 'Wanita' : 'Pria'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Style & Color Selection */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
               <div className="flex-1 flex flex-col gap-4 min-h-0">
                 {/* Styles Selection */}
                 <div className="flex-1 flex flex-col min-h-0">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Scissors size={14} className="text-slate-300" /> 3. Gaya Rambut
                    </label>
                    <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-3 p-1">
                      {filteredStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style)}
                          className={`group relative rounded-2xl border-2 transition-all p-4 text-left flex items-center justify-between gap-2 h-14 ${
                            selectedStyle.id === style.id 
                            ? 'shadow-sm bg-white border-rose-500' 
                            : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                          style={{ borderColor: selectedStyle.id === style.id ? primaryColor : undefined }}
                        >
                          <span className={`text-[10px] font-black uppercase tracking-tight leading-tight line-clamp-2 ${
                            selectedStyle.id === style.id ? 'text-slate-950' : 'text-slate-500'
                          }`}>
                            {style.name}
                          </span>
                          {selectedStyle.id === style.id && (
                            <div 
                              className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <Check size={10} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {selectedStyle.id === 'custom' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3"
                      >
                         <textarea
                          placeholder="Contoh: Mullet dengan poni lurus, samping tipis"
                          value={customStyle}
                          onChange={(e) => setCustomStyle(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none h-20"
                         />
                      </motion.div>
                    )}
                 </div>

                 {/* Colors Selection */}
                 <div className="shrink-0 mb-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <Palette size={14} className="text-slate-300" /> 4. Warna Rambut
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {HAIR_COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color)}
                          className={`relative aspect-square rounded-xl transition-all hover:scale-110 ${
                            selectedColor.id === color.id ? 'scale-110 shadow-lg' : 'opacity-80'
                          }`}
                          style={{ 
                            backgroundColor: color.hex,
                            boxShadow: selectedColor.id === color.id ? `0 0 0 2px white, 0 0 0 4px ${primaryColor}` : undefined
                          }}
                        >
                          {selectedColor.id === color.id && (
                            <div className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                      
                      {/* Custom Color Button */}
                      <button
                        onClick={() => {
                          setSelectedColor({ id: 'custom', name: 'Warna Kustom', hex: customHex });
                          colorInputRef.current?.click();
                        }}
                        className={`relative aspect-square rounded-xl transition-all hover:scale-110 flex items-center justify-center border-2 border-dashed ${
                          selectedColor.id === 'custom' ? 'scale-110 shadow-lg border-solid' : 'opacity-80 border-slate-300 bg-slate-50'
                        }`}
                        style={{ 
                          backgroundColor: selectedColor.id === 'custom' ? customHex : undefined,
                          borderColor: selectedColor.id === 'custom' ? primaryColor : undefined,
                          boxShadow: selectedColor.id === 'custom' ? `0 0 0 2px white, 0 0 0 4px ${primaryColor}` : undefined
                        }}
                      >
                        <input 
                          type="color" 
                          ref={colorInputRef}
                          value={customHex}
                          onChange={(e) => {
                            setCustomHex(e.target.value);
                            setSelectedColor({ id: 'custom', name: 'Warna Kustom', hex: e.target.value });
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {selectedColor.id === 'custom' ? (
                           <div className="text-white mix-blend-difference">
                             <Check size={14} strokeWidth={3} />
                           </div>
                        ) : (
                          <Palette size={14} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                    <div className="mt-3 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Warna:</span>
                       <span className="text-[9px] font-black text-slate-900 uppercase">
                         {selectedColor.id === 'custom' ? `Kustom (${customHex})` : selectedColor.name}
                       </span>
                    </div>
                 </div>
               </div>

               {/* Mobile Action */}
               <div className="lg:hidden">
                  <button 
                    onClick={handleGenerateWithLink}
                    disabled={processing.isProcessing || !baseImage}
                    className="w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-30"
                    style={{ backgroundColor: (processing.isProcessing || !baseImage) ? '#cbd5e1' : primaryColor }}
                  >
                    UBAH GAYA
                  </button>
               </div>
            </div>

            {/* COLUMN 3: Result & Preview */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
                <div className="flex items-center justify-between shrink-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Rasio
                  </label>
                  <div className="flex-1 flex items-center gap-2 lg:gap-1 overflow-x-auto no-scrollbar justify-end ml-4">
                    {ratios.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setAspectRatio(r.value)}
                        className={`px-3 py-1.5 lg:px-3 lg:py-1.5 rounded-lg border transition-all text-[10px] lg:text-[9px] font-black shrink-0 ${
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

               {/* PREVIEW STAGE */}
               <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                  <div 
                    className={`bg-slate-50 border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner w-full max-h-full`}
                    style={{ 
                      borderColor: resultImage ? 'white' : `${primaryColor}40`,
                      maxHeight: '100%',
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
                           className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/80 backdrop-blur-sm"
                         >
                           <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                           <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">{processing.progress}</p>
                         </motion.div>
                       ) : resultImage ? (
                         <motion.div
                           key="result"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="w-full h-full relative"
                         >
                            <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                            <div 
                              className="absolute inset-0 overflow-hidden"
                              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                            >
                              <img src={baseImage!} alt="Original" className="w-full h-full object-cover" />
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
                            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest z-30">
                              Before
                            </div>
                            <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest z-30">
                              After AI
                            </div>
                         </motion.div>
                       ) : (
                         <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                           <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                             <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-12 h-12 object-contain grayscale opacity-50" alt="Logo" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Foto & Gaya Dahulu</p>
                         </div>
                       )}
                    </AnimatePresence>
                  </div>
               </div>

               {/* ACTION BAR - Preview, Crop, Upscale, Initial, Download */}
               <div className="grid grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3 w-full shrink-0 items-center">
                  <button 
                    onClick={handleGenerateWithLink}
                    disabled={processing.isProcessing || !baseImage}
                    title="Generate"
                    className="hidden lg:flex order-5 lg:order-first col-span-1 lg:col-span-2 py-4 rounded-2xl border-2 text-white items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                    style={{ 
                      backgroundColor: (processing.isProcessing || !baseImage) ? '#cbd5e1' : primaryColor, 
                      borderColor: (processing.isProcessing || !baseImage) ? '#cbd5e1' : primaryColor 
                    }}
                  >
                    <span className="font-black uppercase tracking-widest text-[10px]">HASILKAN</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowPreview(true)}
                    disabled={processing.isProcessing || !resultImage}
                    title="Preview"
                    className="order-1 lg:order-2 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Eye size={20} />
                  </button>

                  <button 
                    onClick={() => { if(resultImage) window.open(resultImage, '_blank') }}
                    disabled={processing.isProcessing || !resultImage}
                    title="Crop"
                    className="order-2 lg:order-3 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Crop size={20} />
                  </button>

                  <button 
                    onClick={() => { if(resultImage) window.open(resultImage, '_blank') }}
                    disabled={processing.isProcessing || !resultImage}
                    title="Upscale"
                    className="order-3 lg:order-4 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-rose-500 transition-all bg-white shadow-sm disabled:opacity-30"
                  >
                    <Zap size={20} />
                  </button>

                  <button 
                    onClick={() => { if(initialResult) setResultImage(initialResult); }}
                    disabled={processing.isProcessing || !initialResult || resultImage === initialResult}
                    title="Kembali ke Awal"
                    className="order-4 lg:order-5 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <RefreshCw size={20} />
                  </button>

                  <button 
                    onClick={downloadResult}
                    disabled={processing.isProcessing || !resultImage}
                    title="Download"
                    className="order-6 lg:order-6 py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Download size={20} />
                  </button>
               </div>

               {/* Error Feed */}
               <AnimatePresence>
                 {processing.error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 flex items-center gap-3"
                    >
                      <AlertCircle size={18} />
                      <p className="text-[10px] font-bold uppercase tracking-tight">{processing.error}</p>
                    </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* FULL SCREEN PREVIEW */}
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
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                   <button
                    onClick={downloadResult}
                    className="bg-white text-black px-12 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Download size={18} /> Download
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default GuberRambut;
