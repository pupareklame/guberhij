import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Film, Sparkles, Upload, Copy, Check, Zap, ArrowRight,
  TrendingUp, Trash2, Heart, Award, Cpu, Sliders, RefreshCw, Layers
} from 'lucide-react';
import { useTheme } from '../src/contexts/ThemeContext';
import { generateImageToVideoPrompt, ImageToPromptParams, analyzeImageForVideoSuggestions, VideoSuggestions } from '../services/prompt';
import ImageUploader from '../components/ImageUploader';

interface VideoPromptResult {
  primarySubject: string;
  colorScheme: string;
  environment: string;
  cinematographicPrompt: string;
  slowMotionCommercialPrompt: string;
  epicDynamicPrompt: string;
  artisticSurrealPrompt: string;
  timeline: Array<{
    timeRange: string;
    description: string;
  }>;
  expertDirectives: {
    cameraSpeed: string;
    focalLength: string;
    lightingStyle: string;
    vfxKeywords: string[];
  };
}

interface SavedHistoryItem {
  id: string;
  image: string;
  result: VideoPromptResult;
  config: ImageToPromptParams;
  createdAt: string;
  isFavorited?: boolean;
}

const safeLocalStorageSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      console.warn(`Storage Quota Exceeded for key: ${key}. Clearing larger cached images.`);
      try {
        localStorage.removeItem('guber_video_prompt_image_v2');
        localStorage.removeItem('guber_video_prompt_active_v2');
        localStorage.removeItem('guber_video_prompt_suggestions');
        if (key !== 'guber_video_prompt_image_v2') {
          localStorage.setItem(key, value);
        }
      } catch (innerErr) {
        console.error("Failed to set item even after clearing large items:", innerErr);
      }
    } else {
      console.error("localStorage error:", err);
    }
  }
};

const GuberPrompt: React.FC = () => {
  const { primaryColor } = useTheme();

  // Inputs
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customGuidance, setCustomGuidance] = useState<string>('');
  const [uploaderAspectRatio, setUploaderAspectRatio] = useState<string>('square');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<VideoSuggestions | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedLightingId, setSelectedLightingId] = useState<string | null>(null);
  const [selectedAestheticId, setSelectedAestheticId] = useState<string | null>(null);

  // Execution states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Active Generated Prompt state
  const [promptResult, setPromptResult] = useState<VideoPromptResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const detectAspectRatio = (base64: string) => {
    if (!base64) {
      setUploaderAspectRatio('square');
      return;
    }
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const ratio = img.width / img.height;
      if (Math.abs(ratio - 1) < 0.12) {
        setUploaderAspectRatio('1-1');
      } else if (Math.abs(ratio - 0.75) < 0.12) {
        setUploaderAspectRatio('3-4');
      } else if (Math.abs(ratio - 1.33) < 0.12) {
        setUploaderAspectRatio('4-3');
      } else if (Math.abs(ratio - 0.56) < 0.12) {
        setUploaderAspectRatio('9-16');
      } else if (Math.abs(ratio - 1.77) < 0.12) {
        setUploaderAspectRatio('16-9');
      } else {
        setUploaderAspectRatio('original'); // aspect-auto
      }
    };
  };

  // Analysis function
  const handleAnalyzeImage = async (imgBase64: string) => {
    if (!imgBase64) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setSuggestions(null);
    setSelectedCameraId(null);
    setSelectedLightingId(null);
    setSelectedAestheticId(null);

    try {
      const sug = await analyzeImageForVideoSuggestions(imgBase64);
      setSuggestions(sug);
      safeLocalStorageSetItem('guber_video_prompt_suggestions', JSON.stringify(sug));
      
      // Auto-select first options as default
      if (sug.cameraMotions?.length > 0) setSelectedCameraId(sug.cameraMotions[0].id);
      if (sug.lightingStyles?.length > 0) setSelectedLightingId(sug.lightingStyles[0].id);
      if (sug.visualAesthetics?.length > 0) setSelectedAestheticId(sug.visualAesthetics[0].id);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err?.message || 'Gagal menganalisis gambar dengan Gemini 2.5 free tier.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load state and history from cache
  useEffect(() => {
    const cachedActive = localStorage.getItem('guber_video_prompt_active_v2');
    const cachedImage = localStorage.getItem('guber_video_prompt_image_v2');
    const cachedSuggestions = localStorage.getItem('guber_video_prompt_suggestions');
    const cachedCameraId = localStorage.getItem('guber_video_prompt_sel_cam');
    const cachedLightingId = localStorage.getItem('guber_video_prompt_sel_light');
    const cachedAestheticId = localStorage.getItem('guber_video_prompt_sel_aes');
    
    if (cachedActive) {
      try {
        setPromptResult(JSON.parse(cachedActive));
      } catch (err) {
        console.error(err);
      }
    }
    if (cachedImage) {
      setSelectedImage(cachedImage);
      detectAspectRatio(cachedImage);
      if (cachedSuggestions) {
        try {
          const parsedSug = JSON.parse(cachedSuggestions);
          setSuggestions(parsedSug);
          if (cachedCameraId) setSelectedCameraId(cachedCameraId);
          else if (parsedSug.cameraMotions?.length > 0) setSelectedCameraId(parsedSug.cameraMotions[0].id);

          if (cachedLightingId) setSelectedLightingId(cachedLightingId);
          else if (parsedSug.lightingStyles?.length > 0) setSelectedLightingId(parsedSug.lightingStyles[0].id);

          if (cachedAestheticId) setSelectedAestheticId(cachedAestheticId);
          else if (parsedSug.visualAesthetics?.length > 0) setSelectedAestheticId(parsedSug.visualAesthetics[0].id);
        } catch (err) {
          console.error(err);
          handleAnalyzeImage(cachedImage);
        }
      } else {
        handleAnalyzeImage(cachedImage);
      }
    }
  }, []);

  // Save selected option IDs to cache on variation
  useEffect(() => {
    if (selectedCameraId) safeLocalStorageSetItem('guber_video_prompt_sel_cam', selectedCameraId);
    if (selectedLightingId) safeLocalStorageSetItem('guber_video_prompt_sel_light', selectedLightingId);
    if (selectedAestheticId) safeLocalStorageSetItem('guber_video_prompt_sel_aes', selectedAestheticId);
  }, [selectedCameraId, selectedLightingId, selectedAestheticId]);

  const saveActiveResult = (result: VideoPromptResult | null) => {
    setPromptResult(result);
    if (result) {
      safeLocalStorageSetItem('guber_video_prompt_active_v2', JSON.stringify(result));
    } else {
      localStorage.removeItem('guber_video_prompt_active_v2');
    }
  };

  const handleImageUploaded = (base64: string) => {
    setSelectedImage(base64);
    detectAspectRatio(base64);
    setPromptResult(null);
    setSuggestions(null);
    setSelectedCameraId(null);
    setSelectedLightingId(null);
    setSelectedAestheticId(null);
    safeLocalStorageSetItem('guber_video_prompt_image_v2', base64);
    localStorage.removeItem('guber_video_prompt_active_v2');
    localStorage.removeItem('guber_video_prompt_suggestions');
    handleAnalyzeImage(base64);
  };

  const handleGeneratePrompt = async (autoSelect: boolean = false) => {
    if (!selectedImage) {
      setErrorMsg('Unggah bahan gambar referensi terlebih dahulu!');
      return;
    }
    if (!suggestions) {
      setErrorMsg('Analisis gambar terlebih dahulu menggunakan tombol Analisis AI!');
      return;
    }

    let camId = selectedCameraId;
    let lightId = selectedLightingId;
    let aesId = selectedAestheticId;

    if (autoSelect) {
      if (suggestions.cameraMotions?.length > 0) {
        const randCam = suggestions.cameraMotions[Math.floor(Math.random() * suggestions.cameraMotions.length)];
        camId = randCam.id;
        setSelectedCameraId(randCam.id);
      }
      if (suggestions.lightingStyles?.length > 0) {
        const randLight = suggestions.lightingStyles[Math.floor(Math.random() * suggestions.lightingStyles.length)];
        lightId = randLight.id;
        setSelectedLightingId(randLight.id);
      }
      if (suggestions.visualAesthetics?.length > 0) {
        const randAes = suggestions.visualAesthetics[Math.floor(Math.random() * suggestions.visualAesthetics.length)];
        aesId = randAes.id;
        setSelectedAestheticId(randAes.id);
      }
    }

    const activeCam = suggestions.cameraMotions.find(c => c.id === camId);
    const activeLight = suggestions.lightingStyles.find(l => l.id === lightId);
    const activeAes = suggestions.visualAesthetics.find(a => a.id === aesId);

    if (!activeCam || !activeLight || !activeAes) {
      setErrorMsg('Pilih saran gerakan kamera, pencahayaan, dan estetika visual untuk menghasilkan prompt!');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationStep('Menganalisis komposisi visual...');

    const intervalSteps = [
      'Menyelaraskan opsi kamera & pencahayaan...',
      'Merumuskan elemen partikel efek...',
      'Membangun skenario kronologi waktu...',
      'Menggabungkan hasil prompt...',
    ];

    let currentIntervalIdx = 0;
    const intervalTimer = setInterval(() => {
      if (currentIntervalIdx < intervalSteps.length) {
        setGenerationStep(intervalSteps[currentIntervalIdx]);
        currentIntervalIdx++;
      }
    }, 200);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const subject = suggestions.productAnalysis || "Visual Focus Subject";
      const subjectEnvBase = suggestions.subjectAndEnvBase || "The subject is centered in the environment.";
      const elementAction = suggestions.elementAction || "Elements interact dynamically.";
      const cleanGuidance = customGuidance ? ` ${customGuidance.trim()}` : "";

      const cinematographicPrompt = `${subjectEnvBase} ${elementAction} ${activeCam.description || ""}, showcasing ${activeLight.description || ""}. ${activeAes.description || ""}.${cleanGuidance}`.trim();

      const slowMotionCommercialPrompt = `${subjectEnvBase} In stunning slow motion, ${elementAction} Camera tracking: ${activeCam.description || ""}. Featuring ${activeLight.description || ""} and ${activeAes.description || ""}.${cleanGuidance}`.trim();

      const epicDynamicPrompt = `${subjectEnvBase} Fast dynamic pacing. ${elementAction} Rapid camera movement: ${activeCam.description || ""}. Lit by ${activeLight.description || ""}. ${activeAes.description || ""}.${cleanGuidance}`.trim();

      const artisticSurrealPrompt = `Surreal aesthetic. ${subjectEnvBase} ${elementAction} Floating elements and magical interactions. Camera: ${activeCam.description || ""}. Built with ${activeLight.description || ""} and ${activeAes.description || ""}.${cleanGuidance}`.trim();

      const assembledResult: VideoPromptResult = {
        primarySubject: subject,
        colorScheme: "Dynamic Accent & " + (activeLight.label || "Visual Style"),
        environment: activeAes.label || "Studio Environment",
        cinematographicPrompt,
        slowMotionCommercialPrompt,
        epicDynamicPrompt,
        artisticSurrealPrompt,
        timeline: [
          {
            timeRange: "0s - 1.5s",
            description: `Scene starts. ${subjectEnvBase} ${activeCam.label || "Camera motion"} begins.`
          },
          {
            timeRange: "1.5s - 3.5s",
            description: `Midway progression. ${elementAction} Cinematic details of ${activeAes.label || "Aesthetic"} become prominent.`
          },
          {
            timeRange: "3.5s - 5.0s",
            description: `Stabilized finish. Masterful lighting drop of ${activeLight.description || ""} with beautiful depth-of-field.`
          }
        ],
        expertDirectives: {
          cameraSpeed: "Optimized speed",
          focalLength: "35mm anamorphic film lens",
          lightingStyle: activeLight.label || "Dynamic Studio Light",
          vfxKeywords: ["cinematic", "commercial", "slow_motion", "volumetric_light", "8k"]
        }
      };

      saveActiveResult(assembledResult);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Gagal merumuskan kombinasi prompt.');
    } finally {
      clearInterval(intervalTimer);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleClearAll = () => {
    setSelectedImage(null);
    setUploaderAspectRatio('square');
    saveActiveResult(null);
    setSuggestions(null);
    setSelectedCameraId(null);
    setSelectedLightingId(null);
    setSelectedAestheticId(null);
    setAnalysisError(null);
    localStorage.removeItem('guber_video_prompt_image_v2');
    localStorage.removeItem('guber_video_prompt_active_v2');
    localStorage.removeItem('guber_video_prompt_suggestions');
    localStorage.removeItem('guber_video_prompt_sel_cam');
    localStorage.removeItem('guber_video_prompt_sel_light');
    localStorage.removeItem('guber_video_prompt_sel_aes');
    setErrorMsg(null);
  };


  return (
    <div 
      className="lg:h-screen lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden transition-colors duration-500 flex items-center justify-center p-0 lg:p-6"
      style={{
        background: `radial-gradient(circle at center, color-mix(in srgb, ${primaryColor} 85%, #000000 15%), color-mix(in srgb, ${primaryColor} 70%, #000000 30%))`
      }}
    >
      <div 
        className="w-full max-w-2xl lg:max-w-7xl mx-auto h-full flex flex-col shadow-2xl lg:rounded-3xl overflow-hidden relative border transition-all duration-500"
        style={{
          backgroundColor: `color-mix(in srgb, ${primaryColor} 94%, #000000 6%)`,
          borderColor: `color-mix(in srgb, ${primaryColor} 30%, rgba(255, 255, 255, 0.2) 70%)`,
          backdropFilter: 'blur(28px)'
        }}
      >
        {/* Background radial grid line patterns */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60 z-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.45) 1.2px, transparent 1.2px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Dynamic ambient backdrop glows */}
        <div 
          className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-500 z-0" 
          style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
        />
        <div 
          className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none transition-colors duration-500 z-0" 
          style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 8%, transparent)` }}
        />

        <div className="relative z-10 flex flex-col h-full w-full">
          {/* Header - Hidden on Desktop */}
          <div 
            className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden shrink-0"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                    <Film size={16} />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">PROMPT VIDEO</h1>
                    <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Prompt Architect</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Header - Desktop */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b border-slate-200/50 shrink-0 bg-white/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md animate-pulse"
                style={{ backgroundColor: primaryColor }}
              >
                <Film size={20} />
              </div>
              <div className="text-left">
                <h1 className="text-sm font-black text-slate-800 tracking-tight uppercase leading-none">PROMPT VIDEO AI</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Image-to-Video 5s Prompt Generator</p>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
            <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
                  {/* Column 1: Material Acuan & Custom Guidance */}
                  <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-4 lg:border-r lg:border-slate-200">
                    {/* 1. Upload Section */}
                    <div className="shrink-0 flex flex-col min-h-0">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Camera size={14} className="text-slate-300" /> 1. Bahan Acuan
                      </label>
                      <div className="min-h-0">
                        <ImageUploader
                          label="Pilih Gambar"
                          image={selectedImage}
                          onImageSelect={handleImageUploaded}
                          onClear={handleClearAll}
                          aspectRatio={uploaderAspectRatio}
                          labelInside
                        />
                      </div>

                      {/* AI Image Analysis Feedback */}
                      {selectedImage && (
                        <div className="mt-2.5">
                          {isAnalyzing ? (
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5 animate-pulse">
                              <RefreshCw size={12} className="animate-spin text-slate-400" />
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Menganalisis Gambar...</span>
                            </div>
                          ) : suggestions ? (
                            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-3 text-left">
                              <span className="text-[8px] font-black tracking-wider text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded uppercase block w-max mb-1.5">
                                Hasil Analisis Gambar
                              </span>
                              <p className="text-[10px] text-slate-650 font-bold leading-normal">
                                "{suggestions.productAnalysis}"
                              </p>
                            </div>
                          ) : analysisError ? (
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-left">
                              <span className="text-[8px] font-black tracking-wider text-rose-800 bg-rose-100/85 px-1.5 py-0.5 rounded uppercase block w-max mb-1.5">
                                Analisis Gagal
                              </span>
                              <p className="text-[10px] text-rose-600 font-semibold mb-2">
                                {analysisError}
                              </p>
                              <button
                                onClick={() => handleAnalyzeImage(selectedImage)}
                                className="w-full py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                              >
                                Coba Ulang Analisis
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAnalyzeImage(selectedImage)}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Cpu size={12} className="animate-pulse" /> Mulai Analisis Gambar
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Custom Guidelines (Opsional) */}
                    <div className="flex-1 flex flex-col min-h-0 min-h-[140px] pt-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-slate-300" /> 2. Arahan Khusus (Opsional)
                      </label>
                      <div className="relative flex-1 min-h-[100px]">
                        <textarea
                          value={customGuidance}
                          onChange={(e) => setCustomGuidance(e.target.value)}
                          placeholder="Misal: 'gumpalan asap lembut berhembus lambat', 'buat air laut bergejolak dramatis'..."
                          className="w-full h-full p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-xs font-semibold focus:border-slate-300 focus:outline-none resize-none transition-all shadow-inner placeholder:text-slate-300"
                        />
                        {customGuidance && (
                          <div className="absolute bottom-3 right-3 flex gap-1">
                            <button
                              onClick={() => setCustomGuidance('')}
                              className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Suggestions & Directions Wizard */}
                  <div className="lg:col-span-4 flex flex-col gap-3 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sliders size={14} className="text-slate-300" /> 3. Saran Visual Gemini
                      </span>
                      {suggestions && (
                        <span className="text-[8.5px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-black animate-pulse">
                          FREE TIER 2.5 ACTIVE
                        </span>
                      )}
                    </label>

                    <div className="flex-1 flex flex-col gap-3.5 lg:overflow-y-auto pr-1">
                      {isAnalyzing ? (
                        <div className="flex-1 flex flex-col justify-center items-center py-12 bg-slate-50/50 border border-slate-100 rounded-3xl min-h-[300px]">
                          <RefreshCw size={24} className="text-slate-400 animate-spin mb-3" />
                          <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none animate-pulse">Menghubungkan Gemini...</h4>
                          <p className="text-[9px] text-slate-400 font-bold mt-2">Merumuskan skenario kamera & elemen visual terbaik</p>
                        </div>
                      ) : !suggestions ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/50 border-2 border-dashed border-slate-150 rounded-3xl text-center min-h-[300px]">
                          <Cpu size={24} className="text-slate-300 mb-2" />
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Menunggu Bahan Acuan</h4>
                          <p className="text-[9.5px] text-slate-400 font-bold mt-1 leading-normal max-w-[200px] mx-auto">
                            Gemini secara dinamis akan menyarankan opsi gerakan kamera, pencahayaan, dan estetika unik khusus setelah Anda mengunggah gambar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Camera suggestion select */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                              Pilih Gerakan Kamera (0s - 5s)
                            </span>
                            <div className="space-y-1 max-h-[110px] overflow-y-auto custom-scrollbar pr-0.5">
                              {suggestions.cameraMotions.map((cam) => (
                                <button
                                  key={cam.id}
                                  onClick={() => setSelectedCameraId(cam.id)}
                                  className={`w-full text-left p-2 rounded-xl border text-[10px] transition-all flex flex-col gap-0.5 ${
                                    selectedCameraId === cam.id 
                                      ? 'text-white border-transparent' 
                                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                                  }`}
                                  style={{
                                    backgroundColor: selectedCameraId === cam.id ? primaryColor : undefined,
                                    borderColor: selectedCameraId === cam.id ? primaryColor : undefined,
                                  }}
                                >
                                  <span className="font-extrabold flex items-center gap-1.5">
                                    🎥 {cam.label}
                                  </span>
                                  <span className={`text-[8.5px] line-clamp-1 ${selectedCameraId === cam.id ? 'text-white/80' : 'text-slate-400 font-semibold'}`}>
                                    {cam.description}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Lighting suggestion select */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                              Pilih Gaya Pencahayaan
                            </span>
                            <div className="space-y-1 max-h-[110px] overflow-y-auto custom-scrollbar pr-0.5">
                              {suggestions.lightingStyles.map((light) => (
                                <button
                                  key={light.id}
                                  onClick={() => setSelectedLightingId(light.id)}
                                  className={`w-full text-left p-2 rounded-xl border text-[10px] transition-all flex flex-col gap-0.5 ${
                                    selectedLightingId === light.id 
                                      ? 'text-white border-transparent' 
                                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                                  }`}
                                  style={{
                                    backgroundColor: selectedLightingId === light.id ? primaryColor : undefined,
                                    borderColor: selectedLightingId === light.id ? primaryColor : undefined,
                                  }}
                                >
                                  <span className="font-extrabold flex items-center gap-1.5">
                                    💡 {light.label}
                                  </span>
                                  <span className={`text-[8.5px] line-clamp-1 ${selectedLightingId === light.id ? 'text-white/80' : 'text-slate-400 font-semibold'}`}>
                                    {light.description}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Aesthetic suggestion select */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                              Pilih Estetika Visual
                            </span>
                            <div className="space-y-1 max-h-[110px] overflow-y-auto custom-scrollbar pr-0.5">
                              {suggestions.visualAesthetics.map((aes) => (
                                <button
                                  key={aes.id}
                                  onClick={() => setSelectedAestheticId(aes.id)}
                                  className={`w-full text-left p-2 rounded-xl border text-[10px] transition-all flex flex-col gap-0.5 ${
                                    selectedAestheticId === aes.id 
                                      ? 'text-white border-transparent' 
                                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                                  }`}
                                  style={{
                                    backgroundColor: selectedAestheticId === aes.id ? primaryColor : undefined,
                                    borderColor: selectedAestheticId === aes.id ? primaryColor : undefined,
                                  }}
                                >
                                  <span className="font-extrabold flex items-center gap-1.5">
                                    🎨 {aes.label}
                                  </span>
                                  <span className={`text-[8.5px] line-clamp-1 ${selectedAestheticId === aes.id ? 'text-white/80' : 'text-slate-400 font-semibold'}`}>
                                    {aes.description}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Desktop Generate Prompt Trigger */}
                    <div className="hidden lg:flex gap-2.5 pt-3 shrink-0">
                      <button
                        onClick={() => handleGeneratePrompt(false)}
                        disabled={isGenerating || !selectedImage || !suggestions || !selectedCameraId || !selectedLightingId || !selectedAestheticId}
                        className="flex-1 py-4 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 border-2 border-white hover:brightness-105 active:scale-95 shadow-md"
                        style={{ 
                          backgroundColor: (isGenerating || !selectedImage || !suggestions || !selectedCameraId) ? `color-mix(in srgb, ${primaryColor} 50%, #cbd5e1)` : primaryColor,
                          boxShadow: `0 5px 0 ${(isGenerating || !selectedImage || !suggestions || !selectedCameraId) ? `color-mix(in srgb, ${primaryColor} 30%, #e2e8f0)` : `color-mix(in srgb, ${primaryColor} 60%, black)`}, 0 10px 15px rgba(0,0,0,0.15)`
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>MERUMUSKAN...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>BUAT</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleGeneratePrompt(true)}
                        disabled={isGenerating || !selectedImage || !suggestions}
                        className="px-6 py-4 rounded-3xl bg-amber-500 hover:bg-amber-655 border-2 border-white text-white font-black uppercase tracking-[0.15em] text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 shrink-0"
                        style={{
                          boxShadow: `0 5px 0 #b45309, 0 10px 15px rgba(0,0,0,0.15)`
                        }}
                      >
                        <Zap size={13} fill="currentColor" />
                        <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>AUTO</span>
                      </button>
                    </div>

                    {/* Mobile Generate Prompt Trigger */}
                    <div className="lg:hidden flex gap-2 pt-3 shrink-0">
                      <button
                        onClick={() => handleGeneratePrompt(false)}
                        disabled={isGenerating || !selectedImage || !suggestions || !selectedCameraId || !selectedLightingId || !selectedAestheticId}
                        className="flex-1 py-3 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2 border border-white"
                        style={{ 
                          backgroundColor: (isGenerating || !selectedImage || !suggestions || !selectedCameraId) ? `color-mix(in srgb, ${primaryColor} 50%, #cbd5e1)` : primaryColor,
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>MERUMUSKAN UTAS...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={11} />
                            <span>BUAT</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleGeneratePrompt(true)}
                        disabled={isGenerating || !selectedImage || !suggestions}
                        className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 border border-white text-white font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                      >
                        <Zap size={12} fill="currentColor" />
                        <span>AUTO</span>
                      </button>
                    </div>
                  </div>

                  {/* Column 3: Results Panel */}
                  <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-6 lg:pt-0 lg:pl-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                      <Sparkles size={14} className="text-slate-300" /> Hasil Rekonstruksi Prompt
                    </label>

                    <div className="flex-1 lg:overflow-y-auto pr-1 flex flex-col gap-4 h-full custom-scrollbar">
                      <AnimatePresence mode="wait">
                        {isGenerating ? (
                          <motion.div
                            key="loading-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center p-8 bg-white/40 border-2 border-dashed border-slate-200/50 rounded-3xl min-h-[350px] backdrop-blur-sm"
                          >
                            <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-16 h-16 object-contain animate-spin" alt="Logo" />
                            <p className="mt-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] text-center animate-pulse">{generationStep}</p>
                          </motion.div>
                        ) : errorMsg ? (
                          <motion.div
                            key="error-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-6 bg-rose-50 border border-rose-200/50 rounded-3xl text-left"
                          >
                            <h4 className="text-xs font-black text-rose-800 uppercase leading-none">Terjadi Gangguan</h4>
                            <p className="text-[11px] text-rose-600 font-bold mt-1.5 leading-relaxed">{errorMsg}</p>
                          </motion.div>
                        ) : !promptResult ? (
                          <motion.div
                            key="empty-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/30 border-2 border-dashed border-slate-200/50 rounded-3xl min-h-[350px]"
                          >
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                               <Film size={26} />
                            </div>
                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Kombinasi Studio Prompt Kosong</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 leading-normal">
                              Cara Membuat Prompt Video Kreatif 5 Detik:
                            </p>
                            <div className="text-left text-[11px] text-slate-500 font-semibold space-y-2 mt-4 bg-white/80 p-5 rounded-2xl border border-slate-200/50 shadow-inner w-full">
                              <div className="flex gap-2">
                                <span className="w-5 h-5 rounded bg-slate-900 text-white font-black text-[9px] flex items-center justify-center shrink-0">1</span>
                                <span>Unggah gambar/foto orisinal Anda yang ingin dijadikan video animasi.</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="w-5 h-5 rounded bg-slate-900 text-white font-black text-[9px] flex items-center justify-center shrink-0">2</span>
                                <span>Pilih opsi gerak dambaan kamera, tema estetika, intensitas akselerasi, atau tulis manual instruksi pelengkap.</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="w-5 h-5 rounded bg-slate-900 text-white font-black text-[9px] flex items-center justify-center shrink-0">3</span>
                                <span>Tekan tombol <b className="text-slate-800">BUAT</b> atau <b className="text-amber-600 font-extrabold pb-0.5 border-b border-amber-200">AUTO</b>, dan AI akan merumuskan formula visualisasi canggih.</span>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="result-prompt"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 text-left pb-6"
                          >
                            {/* Visual DNA Header */}
                            <div className="bg-white border border-slate-150 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="w-12 h-12 bg-slate-900 border border-slate-200 rounded-xl overflow-hidden shadow-inner shrink-0">
                                  <img 
                                    src={selectedImage || ''} 
                                    alt="Focal core reference" 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="text-left">
                                  <span 
                                    className="text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    VISUAL INTELLIGENCE DNA
                                  </span>
                                  <h4 className="text-[12px] font-black text-slate-800 uppercase mt-1 leading-tight">
                                    {promptResult.primarySubject || 'Focal Product Detected'}
                                  </h4>
                                  <p className="text-[9px] text-slate-400 font-bold leading-normal mt-0.5">
                                    Warna: <span className="text-slate-600">{promptResult.colorScheme}</span> | Latar: <span className="text-slate-600">{promptResult.environment}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-1.5 shrink-0 self-end sm:self-auto">
                                <button
                                  onClick={() => copyText(`${promptResult.primarySubject} - Palette: ${promptResult.colorScheme}`, 'attributes')}
                                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all border border-slate-150 flex items-center gap-1"
                                >
                                  {copiedKey === 'attributes' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  Atribut DNA
                                </button>
                              </div>
                            </div>

                            {/* Prompts Cards Section */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                4 MODEL FORMULA PROMPT VIDEO SINEMATIK (5 DETIK)
                              </span>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Prompt 1: Master Cinema */}
                                <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
                                  <div>
                                    <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                                      <span className="bg-blue-50 text-blue-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                        Cinematic Masterpiece
                                      </span>
                                      <button
                                        onClick={() => copyText(promptResult.cinematographicPrompt, 'cinem')}
                                        className="text-slate-400 hover:text-slate-700 text-[10px] font-bold flex items-center gap-1"
                                      >
                                        {copiedKey === 'cinem' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                        Salin
                                      </button>
                                    </div>
                                    <p className="text-[11px] font-semibold leading-relaxed text-slate-700 select-all font-mono">
                                      "{promptResult.cinematographicPrompt}"
                                    </p>
                                  </div>
                                  <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider block mt-3 leading-none">Best for Sora & Runway</span>
                                </div>

                                {/* Prompt 2: Slow-Mo Commercial */}
                                <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
                                  <div>
                                    <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                        Slow-Mo Lux Commercial
                                      </span>
                                      <button
                                        onClick={() => copyText(promptResult.slowMotionCommercialPrompt, 'slowm')}
                                        className="text-slate-400 hover:text-slate-700 text-[10px] font-bold flex items-center gap-1"
                                      >
                                        {copiedKey === 'slowm' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                        Salin
                                      </button>
                                    </div>
                                    <p className="text-[11px] font-semibold leading-relaxed text-slate-700 select-all font-mono">
                                      "{promptResult.slowMotionCommercialPrompt}"
                                    </p>
                                  </div>
                                  <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider block mt-3 leading-none">Best for Fluid Dynamics & Spills</span>
                                </div>

                                {/* Prompt 3: Epic Dynamic Movement */}
                                <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
                                  <div>
                                    <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                                      <span className="bg-rose-50 text-rose-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                        Epic Action Flight
                                      </span>
                                      <button
                                        onClick={() => copyText(promptResult.epicDynamicPrompt, 'epicd')}
                                        className="text-slate-400 hover:text-slate-700 text-[10px] font-bold flex items-center gap-1"
                                      >
                                        {copiedKey === 'epicd' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                        Salin
                                      </button>
                                    </div>
                                    <p className="text-[11px] font-semibold leading-relaxed text-slate-700 select-all font-mono">
                                      "{promptResult.epicDynamicPrompt}"
                                    </p>
                                  </div>
                                  <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider block mt-3 leading-none">Best for Action Shots & VFX Boost</span>
                                </div>

                                {/* Prompt 4: Dreamy Portal / Abstract */}
                                <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors">
                                  <div>
                                    <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                                      <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                        Dreamscape / Surreal float
                                      </span>
                                      <button
                                        onClick={() => copyText(promptResult.artisticSurrealPrompt, 'surrm')}
                                        className="text-slate-400 hover:text-slate-700 text-[10px] font-bold flex items-center gap-1"
                                      >
                                        {copiedKey === 'surrm' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                        Salin
                                      </button>
                                    </div>
                                    <p className="text-[11px] font-semibold leading-relaxed text-slate-700 select-all font-mono">
                                      "{promptResult.artisticSurrealPrompt}"
                                    </p>
                                  </div>
                                  <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider block mt-3 leading-none">Best for Luxury Art Advertisements</span>
                                </div>
                              </div>
                            </div>

                            {/* Timeline Choreography */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 leading-none">
                                <Layers size={13} style={{ color: primaryColor }} />
                                Skenario Kronologi Gerakan (0s - 5s)
                              </h3>

                              <div className="relative border-l border-slate-100 pl-4 ml-2.5 space-y-3">
                                {promptResult.timeline?.map((stepIn, idx) => (
                                  <div key={idx} className="relative">
                                    <span 
                                      className="absolute -left-[20.5px] top-1.5 w-1.5 h-1.5 rounded-full border border-white"
                                      style={{ backgroundColor: primaryColor }}
                                    />
                                    <div className="text-left">
                                      <span className="text-[8px] font-black text-slate-800 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                                        {stepIn.timeRange}
                                      </span>
                                      <p className="text-[11px] font-semibold text-slate-600 mt-1 leading-relaxed">
                                        {stepIn.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Expert Settings Panel */}
                            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-800 rounded-full blur-2xl opacity-40 translate-x-8 -translate-y-8" />
                              
                              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 leading-none">
                                <Award size={13} className="text-amber-400" />
                                Spesifikasi Teknis Video Generator
                              </h3>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">Camera Pace</span>
                                  <span className="text-[10.5px] text-amber-200 font-black tracking-wide block">{promptResult.expertDirectives?.cameraSpeed || '0.5x Pan'}</span>
                                </div>

                                <div className="space-y-0.5 text-left">
                                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">Recommended Lens</span>
                                  <span className="text-[10.5px] text-amber-200 font-black tracking-wide block">{promptResult.expertDirectives?.focalLength || '35mm Cinemascope'}</span>
                                </div>

                                <div className="space-y-0.5 text-left">
                                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">Lighting Directives</span>
                                  <span className="text-[10.5px] text-amber-200 font-black tracking-wide block">{promptResult.expertDirectives?.lightingStyle || 'Backlit Soft diffusing'}</span>
                                </div>
                              </div>

                              <div className="mt-4 border-t border-slate-800 pt-3 text-left">
                                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Visual FX Tags:</span>
                                <div className="flex flex-wrap gap-1">
                                  {promptResult.expertDirectives?.vfxKeywords?.map((tag, i) => (
                                    <span key={i} className="bg-slate-800 text-slate-300 hover:text-white px-2 py-0.5 rounded-lg text-[8.5px] font-mono tracking-tighter">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuberPrompt;
