/**
 * [INTEGRITY-CHECK]: 0x65736F70
 * STATUS: PROTECTED-V1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, User, Users, Download, RefreshCw, Scissors, Check, X, Sparkles, MapPin, Send, Maximize, Image as ImageIcon, Crop, Zap, Lock, ShieldAlert, Eye, Recycle, AlertCircle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState } from '../types';
import { transformPose, upscaleImage } from '../services/pose';
import ImageUploader from '../components/ImageUploader';
import { useTheme } from '../src/contexts/ThemeContext';

const POSE_PRESETS = [
  { id: 'STANDING_STRAIGHT', name: 'Berdiri Lurus', icon: '🧍', prompt: 'DIRECTIVE: Absolute frontal 0-degree view. POSTURE: Symmetrical high-fashion standing, facing camera directly. LIGHTING: Sharp professional catalog. [ENV]: Clean studio.' },
  { id: 'WALKING_FRONT', name: 'Jalan Depan', icon: '🚶', prompt: 'DIRECTIVE: Dynamic runway walk towards lens. PERSPECTIVE: Perfect frontal. CAMERA: High-speed shutter sharpness. STYLE: Fashion editorial.' },
  { id: 'SWING_FRONT', name: 'Main Ayunan', icon: '🌳', prompt: 'DIRECTIVE: Frontal close-up shot sitting on a rope swing. ACTION: Subject facing camera directly, hands gripping the side ropes. [ENV]: Lush tropical garden with sun-dappled lighting and soft floral bokeh.' },
  { id: 'CAROUSEL_FRONT', name: 'Komedi Putar', icon: '🎠', prompt: 'DIRECTIVE: Riding a carousel horse, frontal view. POSTURE: Facing camera directly. LIGHTING: Nostalgic fairground, sharp focus.' },
  { id: 'KIDS_BIKE', name: 'Sepeda Anak', icon: '🚲', prompt: 'DIRECTIVE: Subject on a mini-bicycle facing straight forward. ACTION: Hands on handlebars, 0-degree perspective. [ENV]: Vivid colors, outdoor playground.' },
  { id: 'MTB_ADULT', name: 'Sepeda Dewasa', icon: '🚴', prompt: 'DIRECTIVE: Aggressive frontal MTB cycling posture. POSTURE: Bicycle and rider facing camera directly. TEXTURE: Sharp fabric and frame details.' },
  { id: 'KIDS_MOTO', name: 'Motor Anak', icon: '🛵', prompt: 'DIRECTIVE: Riding electric toy motorcycle. VIEW: Absolute frontal. EXPRESSION: Cool rider. LIGHTING: Studio high-key.' },
  { id: 'HALF_BODY', name: 'Setengah Badan', icon: '👤', prompt: 'DIRECTIVE: Half-body shot from waist up. POSTURE: Natural standing pose, facing camera directly. VIEW: Medium close-up. LIGHTING: Soft studio portrait. [ENV]: Clean studio.' },
  { id: 'MOGE_SPORT', name: 'Motor Gede', icon: '🏍️', prompt: 'DIRECTIVE: Subject is STRADDLING and SITTING ON the saddle of a high-performance sport motorcycle. POSTURE: Sitting firmly, both hands on handlebars, body facing camera directly (0-degree). LEGS: Naturally straddling the bike body; for children, feet may dangle naturally. VEHICLE: Full-size realistic heavy motorcycle facing 100% frontal. [ENV]: Urban asphalt street.' },
  { id: 'KIDS_SLIDE', name: 'Seluncuran', icon: '🛝', prompt: 'DIRECTIVE: Subject is sitting at the very TOP entrance of a slide, hands holding the side rails, looking directly at the camera before sliding down. VIEW: Absolute frontal. [ENV]: Cheerful outdoor playground.' },
  { id: 'FIGHTING_STANCE', name: 'Kuda-kuda', icon: '🥋', prompt: 'DIRECTIVE: Martial arts fighting stance (Kuda-kuda). POSTURE: Legs wide apart, knees bent, low center of gravity. ACTION: Hands in a defensive or ready-to-strike position, facing camera directly. VIEW: 0-degree frontal. STYLE: Powerful and focused.' },
  { id: 'PRAYER_STANDING', name: 'Sholat Berdiri', icon: '🤲', prompt: 'DIRECTIVE: Standing prayer position (Sholat Berdiri). POSTURE: Subject is standing straight, facing camera directly (0-degree). ACTION: Both hands are folded over the stomach (bersedekap), right hand over left hand. VIEW: Full body frontal. STYLE: Calm and respectful.' },
  { id: 'SUPERMAN_FLY', name: 'Terbang Superman', icon: '🦸', prompt: 'DIRECTIVE: Superman-style flying pose in the sky. POSTURE: Subject is flying horizontally through the air, one arm extended forward with a closed fist, the other arm tucked near the side. VIEW: Dynamic low-angle or side-frontal view. [ENV]: High altitude among fluffy white clouds, bright blue sky, cinematic sunlight.' },
  { id: 'PLAYROOM_CHEERFUL', name: 'Ruang Bermain', icon: '🧸', prompt: 'DIRECTIVE: A high-angle, medium-wide photo capturing a cheerful model standing on a clean tiled floor in a bright, toy-filled playroom. PERSPECTIVE: Taken from slightly above and in front of him (high-angle frontal). POSTURE: Smiling broadly, both hands tucked into pockets, facing camera directly in the center of the frame. [ENV]: Large, white, arched shelving unit with character figures (Mario, Superman, Batman) and toy cars in background. Left: multi-colored plastic playpen with small red slide. Right: basket of toys, white side table with flowers, yellow ride-on car. LIGHTING: Bright, even, natural light.' },
  { id: 'YELLOW_PICKUP_SIT', name: 'Walau Habis Terang', icon: '🛻', prompt: 'Transform the uploaded person into a dark cinematic road scene while strictly preserving the original face identity, facial structure, hairstyle, age, skin tone, and realistic facial details of the model. Keep the face highly recognizable and realistic. The face and hair should remain relatively clean and natural, not overly dirty, messy, or damaged.\n\n    A young man is being dragged behind a slightly lowered vintage yellow pickup truck with a completely plain and smooth closed tailgate, without logos, text, stickers, or visible decorations.\n\n    Both of his wrists are tightly tied to the upper left and upper right corners of the rear side of the truck. His wrists are positioned noticeably higher than his shoulders, causing his body to hang slightly downward from the bindings. His shoulders sit lower than his tied wrists, creating realistic body tension and gravity.\n\n    His upper back and shoulders lightly press against the closed tailgate while his torso hangs naturally. His hips and butt are suspended slightly above the asphalt, clearly not touching the road. His legs hang downward and drag naturally along the asphalt with subtle friction and realistic movement.\n\n    Keep the body posture realistic:\n    wrists higher than shoulders\n    body slightly hanging\n    butt suspended above the asphalt\n    no contact between butt and road\n    legs dragging naturally\n\n    If the original model wears different clothing, change the outfit into:\n    plain white t-shirt\n    black casual jacket\n    blue Levi’s denim jeans\n    black shoes\n\n    Add only subtle dust and light friction marks on the clothing. Avoid excessive dirt or damage.\n\n    His facial expression should look emotionally exhausted, numb, hopeless, calm, and reflective, with an empty distant stare. Hair should appear natural with only slight wind movement, not overly messy.\n\n    The vintage yellow pickup truck should appear slightly old, dusty, slightly lowered (“slammed stance”), and cinematic. Rear view, symmetrical composition, centered in frame.\n\n    The road is completely empty with no vehicles or people, creating a lonely and emotional cinematic atmosphere. The asphalt texture should be highly detailed near the camera.\n\n    Camera angle: dramatic low-angle cinematic shot from near ground level, emphasizing the suspended body posture, road texture, perspective depth, and emotional atmosphere. Large cloudy sky dominating the upper background with soft natural evening lighting and moody cinematic tones.\n\n    Style: ultra photorealistic cinematic photography, DSLR realism, realistic skin texture, cinematic color grading, muted vintage tones, subtle film grain, volumetric lighting, shallow depth of field, emotional indie movie aesthetic, cinematic thriller atmosphere, ultra detailed, 4K realism.\n\n    Mood: tragic, lonely, emotionally broken, dark cinematic tension, hopeless journey.\n\n    Composition details:\n    Plain smooth tailgate\n    Wrist bindings attached to upper rear corners\n    Wrists higher than shoulders\n    Body naturally hanging downward\n    Butt suspended above asphalt without touching\n    Legs dragging naturally\n    Slight motion blur for realism\n    Soft atmospheric background blur\n    Symmetrical framing\n    Main focus on the man and truck\n\n    Negative prompt: gore, blood, open wounds, broken bones, excessive dirt, messy hair, damaged face, smiling, cartoon, anime, fake anatomy, floating body, distorted limbs, extra arms, blurry face, unrealistic rope, exaggerated action, oversaturated colors, CGI look, plastic skin, warped truck, duplicated body parts, low quality' },
];

const GuberPose: React.FC = () => {
  const { primaryColor } = useTheme();
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResultImage, setOriginalResultImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(POSE_PRESETS[0].id);
  const [selectedEngine, setSelectedEngine] = useState('gemini-2.5-flash-image');
  const [customPosePrompt, setCustomPosePrompt] = useState<string>('');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showReference, setShowReference] = useState(false);
  
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

  const ratios = [
    { label: '1:1', value: '1:1', class: 'aspect-square' },
    { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
  ];

  const handleSelectPreset = (poseId: string) => {
    setSelectedPoseId(poseId);
    setCustomPosePrompt('');
    setReferenceImage(null);
  };

  const handleCustomUpload = (base64: string) => {
    setReferenceImage(base64);
    setSelectedPoseId(null);
    setCustomPosePrompt('');
  };

  const handleCustomPoseChange = (val: string) => {
    setCustomPosePrompt(val);
    if (val.trim()) {
      setSelectedPoseId(null);
      setReferenceImage(null);
    }
  };

  const handleReset = () => {
    setReferenceImage(null);
    setSelectedPoseId(POSE_PRESETS[0].id);
    setCustomPosePrompt('');
    setCustomInstruction('');
    setResultImage(null);
    setOriginalResultImage(null);
    setBeforeImage(modelImage);
    setSliderPos(50);
    setIsCropping(false);
    setProcessing({ isProcessing: false, error: null, progress: '' });
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Sharpening & Enhancing Details...' });
    try {
      const upscaled = await upscaleImage(resultImage, aspectRatio);
      setResultImage(upscaled);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      let errorMessage = err.message || "Gagal menajamkan gambar.";
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setProcessing({ 
          isProcessing: false, 
          error: "AKSES_DITOLAK", 
          progress: '' 
        });
      } else {
        setProcessing({ isProcessing: false, error: errorMessage, progress: '' });
      }
    }
  };

  const handleResetResult = () => {
    setResultImage(originalResultImage);
    setSliderPos(50);
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `pose-${Date.now()}.png`;
    link.click();
  };

  const handleGenerate = async () => {
    if (!modelImage) {
      setProcessing({ isProcessing: false, error: "Harap unggah foto model terlebih dahulu.", progress: '' });
      return;
    }

    setResultImage(null);
    setOriginalResultImage(null);
    setIsCropping(false);
    setProcessing({ isProcessing: true, error: null, progress: 'Neural Mapping V21...' });
    
    try {
      const preset = POSE_PRESETS.find(p => p.id === selectedPoseId);
      let posePrompt = '';
      
      if (showReference && referenceImage) {
        posePrompt = `
          [POSE_EXTRACTION_DIRECTIVE]:
          1. ANALYZE the skeletal structure, joint coordinates (shoulders, elbows, wrists, hips, knees, ankles), and biomechanics of the human subject in the REFERENCE image.
          2. EXTRACT the precise 3D spatial orientation and limb angles.
          3. TRANSFER this exact pose onto the subject from the MODEL image with anatomical accuracy.
          4. IGNORE ALL visual attributes of the person in the REFERENCE image (face, hair, skin, clothing, gender, age).
          5. RETAIN 100% of the MODEL image's identity, facial features, skin tone, and clothing textures.
          6. The final output must be a high-fidelity, hyper-realistic synthesis where the MODEL's subject adopts the REFERENCE's pose perfectly while maintaining original identity.
          7. Ensure realistic weight distribution and interaction with the ground or environment.
        `;
      } else if (customPosePrompt.trim()) {
        posePrompt = `TASK: Creative Pose Synthesis. SUBJECT: "${customPosePrompt}". ORIENTATION: Forced 0-degree frontal. LIGHTING: Cinematic rim light. RESOLUTION: 8K textures.`;
      } else if (preset) {
        posePrompt = preset.prompt;
        if (customInstruction.trim()) {
          posePrompt = posePrompt.replace(/\[ENV\]:.*?(?=\[|$)/i, '[ENVIRONMENT_OVERRIDE]: Default environment purged for user directive.');
        }
      }
      
      const finalInstruction = `
        [POSE_CORE]: ${posePrompt} 
        [ADDITIONAL_DIRECTIVE]: ${customInstruction} 
        
        [UNBREAKABLE_RULES]:
        1. IDENTITY: Face, skin tone, and distinguishing features must remain 100% identical to the MODEL image.
        2. GARMENT: Keep exact textures, prints, and colors of the original clothing.
        3. VIEWPORT: ${(showReference && referenceImage) ? 'Follow the orientation of the REFERENCE image.' : 'Mandatory face-to-face 0-degree frontal perspective.'}
        4. PHYSICS: Ensure realistic weight-bearing and environmental integration.
        5. STYLE: If additional instructions are provided, PRIORITIZE them as the main visual theme.
        6. ASPECT RATIO: Use ${aspectRatio}.
      `;

      const result = await transformPose(modelImage, (showReference ? referenceImage : null), finalInstruction, aspectRatio, selectedEngine);
      setResultImage(result);
      setOriginalResultImage(result);
      setBeforeImage(modelImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      let errorMessage = err.message || "Proses AI gagal. Coba lagi.";
      const lowerError = errorMessage.toLowerCase();
      if (
        lowerError.includes('permission denied') || 
        lowerError.includes('requested entity was not found') ||
        lowerError.includes('failed to call') ||
        lowerError.includes('api key')
      ) {
        setProcessing({ 
          isProcessing: false, 
          error: "AKSES_DITOLAK", 
          progress: '' 
        });
      } else {
        setProcessing({ isProcessing: false, error: errorMessage, progress: '' });
      }
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
    if (!resultImage || !croppedAreaPixels) return;
    try {
      const { width, height, x, y } = croppedAreaPixels;
      
      // Crop Result Image
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = width; canvas.height = height;
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      const base64Result = canvas.toDataURL('image/png');
      setResultImage(base64Result);

      // Also crop the before image so the slider stays aligned
      if (beforeImage) {
        const bImg = await createImage(beforeImage);
        const bCanvas = document.createElement('canvas');
        const bCtx = bCanvas.getContext('2d');
        if (bCtx) {
          bCanvas.width = width; bCanvas.height = height;
          bCtx.drawImage(bImg, x, y, width, height, 0, 0, width, height);
          setBeforeImage(bCanvas.toDataURL('image/png'));
        }
      }

      setIsCropping(false);
    } catch (e) { 
      console.error(e); 
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto', progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `pose-${Date.now()}.png`;
    link.click();
  };

  if (false) {
    return null;
  }

  return (
    <div className="h-screen bg-slate-50/50 overflow-hidden">
      <div className="max-w-2xl lg:max-w-7xl mx-auto h-full bg-white flex flex-col border-x border-slate-100 shadow-sm overflow-hidden">
        {/* Header - Hidden on Desktop */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden shrink-0"
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
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">GANTI POSE AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">ubah pose sesuai keinginan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 flex-1 overflow-y-auto lg:overflow-hidden custom-scrollbar">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:h-full lg:overflow-hidden">
            {/* Column 1: Model Utama & Katalog Pose */}
            <div className="lg:col-span-3 space-y-6 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar">
              {/* Model Utama */}
              <div className="space-y-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} className="text-slate-300" /> 1. Model Utama
                </label>
                <div className="w-full mx-auto">
                  <ImageUploader
                    label="Pilih Model"
                    image={modelImage}
                    onImageSelect={(base64) => {
                      setModelImage(base64);
                      setBeforeImage(base64);
                    }}
                    onClear={() => {
                      setModelImage(null);
                      setBeforeImage(null);
                    }}
                    aspectRatio="9-16"
                    labelInside
                  />
                </div>
              </div>

              {/* Katalog Pose */}
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={12} className="text-slate-300" /> 3. Katalog Pose
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POSE_PRESETS.map((p) => (
                    <button 
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 gap-1.5 group ${selectedPoseId === p.id ? 'scale-105 shadow-md text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'}`}
                      style={selectedPoseId === p.id ? { 
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: 'white'
                      } : {}}
                    >
                      <span className="text-base transition-transform group-hover:scale-110">{p.icon}</span>
                      <span className="text-[7px] font-black uppercase text-center leading-tight tracking-tight">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Pose Referensi & Config */}
            <div className="lg:col-span-3 space-y-6 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full lg:overflow-y-auto lg:pr-4 custom-scrollbar">
              {/* Switch Pose Referensi */}
              <div className="p-4 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-between group hover:border-slate-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${showReference ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-400'}`}>
                    <Users size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Pose Referensi</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">{showReference ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReference(!showReference)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-500 p-1 ${showReference ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-sm ${showReference ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Pose Referensi */}
              <AnimatePresence>
                {showReference && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-5 pb-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={12} className="text-slate-300" /> 2. Pose Referensi
                      </label>
                      <div className="w-full mx-auto">
                        <ImageUploader
                          label="Pilih Pose"
                          image={referenceImage}
                          onImageSelect={handleCustomUpload}
                          onClear={() => setReferenceImage(null)}
                          aspectRatio="9-16"
                          labelInside
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Deskripsi Pose */}
              <div className={`space-y-3 pt-4 border-t border-slate-50 transition-all ${showReference ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Send size={12} className="text-slate-300" /> 4. Deskripsi Pose
                </label>
                <input 
                  type="text"
                  value={customPosePrompt}
                  onChange={(e) => handleCustomPoseChange(e.target.value)}
                  disabled={showReference}
                  placeholder={showReference ? "Matikan foto referensi untuk mengisi..." : "Misal: Pose hero menaiki naga..."}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-200 transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Instruksi Tambahan */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={12} className="text-slate-300" /> 5. Instruksi Tambahan
                </label>
                <textarea 
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="Misal: Tambahkan detail seperti sayap..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-200 transition-all h-20 resize-none placeholder:text-slate-300"
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Maximize size={12} className="text-slate-300" /> 6. Aspek Rasio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all aspect-square ${
                        aspectRatio === r.value 
                          ? 'scale-105 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                        color: aspectRatio === r.value ? 'white' : undefined,
                        borderColor: aspectRatio === r.value ? primaryColor : undefined,
                      }}
                    >
                      <span className="text-[8px] font-black">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Engine Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} className="text-slate-300" /> 7. Enjin AI (Model)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gemini-2.5-flash-image', name: 'Nano Banana 1', desc: 'Sangat Cepat' },
                    { id: 'gemini-3-flash-image-preview', name: 'Nano Banana 2', desc: 'Gemini 3 Flash' }
                  ].map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => setSelectedEngine(engine.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 gap-1 ${
                        selectedEngine === engine.id 
                          ? 'scale-105 shadow-md bg-white border-white' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                      }`}
                      style={selectedEngine === engine.id ? { 
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: 'white'
                      } : {}}
                    >
                      <span className="text-[9px] font-black uppercase tracking-tight">{engine.name}</span>
                      <span className={`text-[6px] font-bold uppercase tracking-widest ${selectedEngine === engine.id ? 'text-white/60' : 'text-slate-400'}`}>
                        {engine.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={processing.isProcessing || !modelImage}
                  className="w-full disabled:bg-slate-300 text-white py-4 rounded-[24px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center group relative overflow-hidden shadow-lg"
                  style={{ 
                    backgroundColor: processing.isProcessing ? undefined : primaryColor,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  {processing.isProcessing ? (
                    <span className="relative z-10 text-xs">MEMPROSES...</span>
                  ) : (
                    <span className="text-sm relative z-10 flex items-center gap-2">
                      <Sparkles size={16} /> GENERATE POSE
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Column 3: Results */}
            <div className="lg:col-span-6 lg:pt-0 pt-8 border-t lg:border-t-0 border-slate-100 lg:h-full flex flex-col overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex items-center justify-between shrink-0">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-300" /> Hasil Foto Pose
                  </label>
                </div>
                
                <div 
                  className={`w-full mx-auto bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner lg:flex-1 lg:h-0 w-full ${
                    aspectRatio === '1:1' ? 'aspect-square' :
                    aspectRatio === '3:4' ? 'aspect-[3/4]' :
                    aspectRatio === '4:3' ? 'aspect-[4/3]' :
                    aspectRatio === '9:16' ? 'aspect-[9/16]' :
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
                        {/* BEFORE/AFTER SLIDER */}
                        <div className="absolute inset-0">
                          <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                        </div>
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                          <img src={beforeImage!} alt="Original" className="w-full h-full object-cover" />
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
                        <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest z-30">
                          Original
                        </div>
                        <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest z-30">
                          AI Pose
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

                {/* Action Buttons */}
                <div className="grid grid-cols-5 gap-3 w-full mx-auto pt-4 shrink-0">
                  <button 
                    onClick={() => setShowPreview(true)}
                    disabled={processing.isProcessing || !resultImage}
                    title="Preview"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => setIsCropping(true)}
                    disabled={processing.isProcessing || !resultImage}
                    title="Crop"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Scissors size={20} />
                  </button>
                  <button 
                    onClick={handleSharpen}
                    disabled={processing.isProcessing || !resultImage}
                    title="Sharpen"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Zap size={20} />
                  </button>
                  <button 
                    onClick={handleResetResult}
                    disabled={processing.isProcessing || !resultImage || resultImage === originalResultImage}
                    title="Reset"
                    className="py-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-900 transition-all disabled:opacity-30 bg-white shadow-sm"
                  >
                    <Recycle size={20} />
                  </button>
                  <button 
                    onClick={handleDownload}
                    disabled={processing.isProcessing || !resultImage}
                    title="Download"
                    className="py-4 rounded-2xl border-2 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                    style={{ 
                      backgroundColor: (processing.isProcessing || !resultImage) ? '#cbd5e1' : primaryColor, 
                      borderColor: (processing.isProcessing || !resultImage) ? '#cbd5e1' : primaryColor 
                    }}
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
                      className={`${processing.error === 'AKSES_DITOLAK' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-2 border-rose-100 text-rose-600'} p-5 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest flex flex-col gap-3`}
                    >
                      {processing.error === 'AKSES_DITOLAK' ? (
                        <>
                          <div className="flex items-center justify-center gap-2">
                            <AlertCircle size={16} className="text-amber-600" />
                            <span>Akses Model Terbatas</span>
                          </div>
                          <p className="text-[8px] normal-case font-bold text-amber-800 leading-relaxed">
                            Model Gemini 3 Flash Image mungkin memerlukan aktivasi tambahan atau sedang dalam masa pemeliharaan untuk akun Free Tier. Silakan coba gunakan "Nano Banana 1" untuk sementara.
                          </p>
                          <button 
                            onClick={() => setSelectedEngine('gemini-2.5-flash-image')}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-200"
                          >
                            Gunakan Nano Banana 1 (Lancar)
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
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Hasil Pose</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyCrop}
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
                aspect={aspectRatio === '1:1' ? 1 : aspectRatio === '3:4' ? 3/4 : aspectRatio === '4:3' ? 4/3 : aspectRatio === '9:16' ? 9/16 : 16/9}
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

export default GuberPose;

