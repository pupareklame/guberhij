
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Mic2, 
  MessageSquare, 
  Download, 
  Trash2, 
  RefreshCw, 
  Plus, 
  User, 
  Users,
  Clock,
  Sparkles,
  X,
  Check,
  Play,
  Pause
} from 'lucide-react';
import { pcmToWav } from '../src/utils/wavUtils';
import { generateSpeech } from '../services/suaraai';
import { useTheme } from '../src/contexts/ThemeContext';

interface AudioHistoryItem {
  id: string;
  text: string;
  url: string;
  pcmBase64?: string;
  timestamp: Date;
  voice: string;
  mode: 'SINGLE' | 'DIALOG';
  tone: string;
}

interface DialogTurn {
  id: string;
  speaker: 'P1' | 'P2';
  text: string;
}

const VOICES = [
  { id: 'Puck', name: 'Puck (L)', gender: 'L' },
  { id: 'Charon', name: 'Charon (L)', gender: 'L' },
  { id: 'Kore', name: 'Kore (P)', gender: 'P' },
  { id: 'Fenrir', name: 'Fenrir (L)', gender: 'L' },
  { id: 'Zephyr', name: 'Zephyr (P)', gender: 'P' },
];

const TONES = [
  { id: 'WARM', name: 'Hangat & Ramah', instruction: 'Gunakan nada bicara yang hangat, ramah, dan bersahabat.' },
  { id: 'PROFESSIONAL', name: 'Profesional', instruction: 'Gunakan nada bicara yang profesional, formal, dan berwibawa.' },
  { id: 'ENERGETIC', name: 'Energik', instruction: 'Gunakan nada bicara yang penuh semangat, ceria, dan energik.' },
  { id: 'NARRATOR', name: 'Narator', instruction: 'Gunakan nada bicara seorang narator yang tenang, jelas, dan deskriptif.' },
];

const GuberSuaraAI: React.FC = () => {
  const { primaryColor } = useTheme();
  const [mode, setMode] = useState<'SINGLE' | 'DIALOG'>(() => (localStorage.getItem('guber_tts_mode') as 'SINGLE' | 'DIALOG') || 'SINGLE');
  const [singleText, setSingleText] = useState(() => localStorage.getItem('guber_tts_single_text') || '');
  const [singleVoice, setSingleVoice] = useState(() => localStorage.getItem('guber_tts_single_voice') || 'Kore');
  const [tone, setTone] = useState(() => localStorage.getItem('guber_tts_tone') || 'WARM');
  
  const [dialogTurns, setDialogTurns] = useState<DialogTurn[]>(() => {
    const saved = localStorage.getItem('guber_tts_dialog_turns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [
          { id: '1', speaker: 'P1', text: '' },
          { id: '2', speaker: 'P2', text: '' },
        ];
      }
    }
    return [
      { id: '1', speaker: 'P1', text: '' },
      { id: '2', speaker: 'P2', text: '' },
    ];
  });
  const [p1Voice, setP1Voice] = useState(() => localStorage.getItem('guber_tts_p1_voice') || 'Kore');
  const [p2Voice, setP2Voice] = useState(() => localStorage.getItem('guber_tts_p2_voice') || 'Puck');

  const [history, setHistory] = useState<AudioHistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<AudioHistoryItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Save input state to localStorage
  useEffect(() => {
    localStorage.setItem('guber_tts_mode', mode);
    localStorage.setItem('guber_tts_single_text', singleText);
    localStorage.setItem('guber_tts_single_voice', singleVoice);
    localStorage.setItem('guber_tts_tone', tone);
    localStorage.setItem('guber_tts_dialog_turns', JSON.stringify(dialogTurns));
    localStorage.setItem('guber_tts_p1_voice', p1Voice);
    localStorage.setItem('guber_tts_p2_voice', p2Voice);
  }, [mode, singleText, singleVoice, tone, dialogTurns, p1Voice, p2Voice]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('guber_tts_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const restoredHistory = parsed.map((item: any) => {
          let url = '';
          if (item.pcmBase64) {
            try {
              const blob = pcmToWav(item.pcmBase64);
              url = URL.createObjectURL(blob);
            } catch (e) {
              console.error("Failed to restore audio URL", e);
            }
          }
          return { 
            ...item, 
            url,
            timestamp: new Date(item.timestamp) 
          };
        });
        setHistory(restoredHistory);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    const historyToSave = history.slice(0, 5).map(item => ({
      ...item,
      url: '' // Don't save blob URLs, they expire
    }));
    localStorage.setItem('guber_tts_history', JSON.stringify(historyToSave));
  }, [history]);

  const handleAddTurn = () => {
    setDialogTurns([...dialogTurns, { id: Date.now().toString(), speaker: 'P1', text: '' }]);
  };

  const handleRemoveTurn = (id: string) => {
    if (dialogTurns.length <= 2) return;
    setDialogTurns(dialogTurns.filter(t => t.id !== id));
  };

  const updateTurn = (id: string, text: string, speaker?: 'P1' | 'P2') => {
    setDialogTurns(dialogTurns.map(t => t.id === id ? { ...t, text, speaker: speaker || t.speaker } : t));
  };

  const handleReset = () => {
    setSingleText('');
    setDialogTurns([
      { id: '1', speaker: 'P1', text: '' },
      { id: '2', speaker: 'P2', text: '' },
    ]);
    setLatestResult(null);
    setError(null);
  };

  const handleGenerate = async () => {
    setError(null);
    let textToProcess = '';
    let voiceToUse = singleVoice;
    let speakers: { name: string, voice: string }[] | undefined = undefined;

    if (mode === 'SINGLE') {
      if (!singleText.trim()) {
        setError("Harap masukkan teks terlebih dahulu.");
        return;
      }
      const toneInstruction = TONES.find(t => t.id === tone)?.instruction || '';
      textToProcess = `${toneInstruction}\n\n${singleText}`;
    } else {
      const hasEmpty = dialogTurns.some(t => !t.text.trim());
      if (hasEmpty) {
        setError("Harap isi semua percakapan.");
        return;
      }
      
      const toneInstruction = TONES.find(t => t.id === tone)?.instruction || '';
      textToProcess = `${toneInstruction}\n\nTTS percakapan berikut:\n` + 
        dialogTurns.map(t => `${t.speaker === 'P1' ? 'P1' : 'P2'}: ${t.text}`).join('\n');
      
      speakers = [
        { name: 'P1', voice: p1Voice },
        { name: 'P2', voice: p2Voice }
      ];
    }

    setIsProcessing(true);
    try {
      const base64Data = await generateSpeech(textToProcess, voiceToUse, mode === 'DIALOG', speakers);
      
      if (base64Data) {
        const blob = pcmToWav(base64Data);
        const url = URL.createObjectURL(blob);
        
        const newItem: AudioHistoryItem = {
          id: Date.now().toString(),
          text: mode === 'SINGLE' ? singleText.substring(0, 50) + (singleText.length > 50 ? '...' : '') : 'Percakapan Dialog',
          url,
          pcmBase64: base64Data,
          timestamp: new Date(),
          voice: mode === 'SINGLE' ? singleVoice : `${p1Voice} & ${p2Voice}`,
          mode,
          tone: TONES.find(t => t.id === tone)?.name || tone
        };

        setLatestResult(newItem);
        setHistory([newItem, ...history].slice(0, 5));
        
        // Auto play the new audio
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghasilkan suara. Silakan coba lagi.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAudio = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const togglePlay = (item?: AudioHistoryItem) => {
    const target = item || latestResult;
    if (!target || !audioRef.current) return;

    if (audioRef.current.src !== target.url) {
      audioRef.current.src = target.url;
      audioRef.current.play();
      setIsPlaying(true);
      if (item) setLatestResult(item);
    } else {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
                <Volume2 size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5 uppercase">SUARA AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Neural Voice Synthesis Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Left Column: Controls */}
            <div className="space-y-8">
              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} className="text-slate-300" /> 1. Pilih Mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                  {(['SINGLE', 'DIALOG'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === m ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      style={{ color: mode === m ? primaryColor : undefined }}
                    >
                      {m === 'SINGLE' ? 'Tunggal' : 'Dialog'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Section */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={14} className="text-slate-300" /> 2. {mode === 'SINGLE' ? 'Teks Narasi' : 'Percakapan Dialog'}
                </label>
                
                {mode === 'SINGLE' ? (
                  <textarea 
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    placeholder="Masukkan teks di sini..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-slate-300 outline-none min-h-[160px] resize-none transition-all"
                  />
                ) : (
                  <div className="space-y-3">
                    {dialogTurns.map((turn) => (
                      <div key={turn.id} className="flex gap-2 items-start group">
                        <button 
                          onClick={() => updateTurn(turn.id, turn.text, turn.speaker === 'P1' ? 'P2' : 'P1')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all shadow-sm shrink-0 text-white`}
                          style={{ backgroundColor: turn.speaker === 'P1' ? '#334155' : primaryColor }}
                        >
                          {turn.speaker}
                        </button>
                        <div className="flex-1 relative">
                          <textarea 
                            value={turn.text}
                            onChange={(e) => updateTurn(turn.id, e.target.value)}
                            placeholder={`${turn.speaker}...`}
                            className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:border-slate-300 transition-all resize-none"
                            rows={2}
                          />
                          {dialogTurns.length > 2 && (
                            <button 
                              onClick={() => handleRemoveTurn(turn.id)}
                              className="absolute -right-1 -top-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={handleAddTurn}
                      className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                    >
                      <Plus size={14} /> Tambah Dialog
                    </button>
                  </div>
                )}
              </div>

              {/* Voice Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Mic2 size={14} className="text-slate-300" /> 3. Pilihan Suara
                </label>
                {mode === 'SINGLE' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {VOICES.map(v => (
                      <button 
                        key={v.id}
                        onClick={() => setSingleVoice(v.id)}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${singleVoice === v.id ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        style={{ borderColor: singleVoice === v.id ? primaryColor : undefined }}
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: singleVoice === v.id ? primaryColor : undefined }}>{v.name}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Suara P1</p>
                      <select 
                        value={p1Voice}
                        onChange={(e) => setP1Voice(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-slate-300 transition-all appearance-none"
                      >
                        {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Suara P2</p>
                      <select 
                        value={p2Voice}
                        onChange={(e) => setP2Voice(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-slate-300 transition-all appearance-none"
                      >
                        {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Tone Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-slate-300" /> 4. Nada (Tone)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${tone === t.id ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      style={{ borderColor: tone === t.id ? primaryColor : undefined }}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: tone === t.id ? primaryColor : undefined }}>{t.name}</span>
                      {tone === t.id && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center py-4 bg-white border-2 border-slate-100 rounded-2xl transition-all hover:border-slate-200"
                  style={{ color: primaryColor }}
                  title="Reset"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className={`flex items-center justify-center py-4 text-white rounded-2xl transition-all shadow-lg ${
                    isProcessing ? 'bg-slate-300 opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: isProcessing ? undefined : primaryColor }}
                >
                  {isProcessing ? <RefreshCw size={20} className="animate-spin" /> : <Volume2 size={20} />}
                  <span className="ml-2 font-black uppercase tracking-widest text-xs">{isProcessing ? 'PROSES...' : 'GENERATE'}</span>
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-rose-50 border-2 border-rose-100 p-5 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Results */}
            <div className="lg:sticky lg:top-8 space-y-6 mt-12 lg:mt-0">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Volume2 size={14} className="text-slate-300" /> Hasil Generate
                </label>
                
                <div className="w-full bg-slate-50 rounded-3xl border-2 border-slate-100 overflow-hidden relative min-h-[180px] flex flex-col items-center justify-center p-6 transition-all">
                  <AnimatePresence mode="wait">
                    {isProcessing ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center space-y-3"
                      >
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-400 rounded-full animate-spin" style={{ borderTopColor: primaryColor }} />
                        <span className="font-black uppercase tracking-widest text-[9px] animate-pulse" style={{ color: primaryColor }}>Sintesis Suara...</span>
                      </motion.div>
                    ) : latestResult ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full space-y-4"
                      >
                        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                          <button 
                            onClick={() => togglePlay()}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-105 active:scale-95 shrink-0"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {isPlaying && audioRef.current?.src === latestResult.url ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                          </button>
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-bold text-slate-700 truncate italic">"{latestResult.text}"</p>
                            <div className="flex gap-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{latestResult.voice}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-30">•</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{latestResult.tone}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => downloadAudio(latestResult.url, `guber-tts-${latestResult.id}.wav`)}
                            className="bg-white border border-slate-100 hover:border-slate-200 text-slate-500 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <Download size={14} /> Simpan
                          </button>
                          <button
                            onClick={handleGenerate}
                            className="text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <RefreshCw size={14} /> Re-Gen
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center text-center space-y-3"
                      >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-200">
                          <Mic2 size={20} />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Siap Generate</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* History Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-slate-300" /> Riwayat
                  </label>
                  <button 
                    onClick={() => { setHistory([]); localStorage.removeItem('guber_tts_history'); }}
                    className="text-[8px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors"
                  >
                    Hapus
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <AnimatePresence initial={false}>
                    {history.length > 0 ? history.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-3 group ${latestResult?.id === item.id ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                      >
                        <button 
                          onClick={() => togglePlay(item)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 transition-transform active:scale-90`}
                          style={{ backgroundColor: primaryColor }}
                        >
                          {isPlaying && audioRef.current?.src === item.url ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-slate-600 truncate italic">"{item.text}"</p>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.voice} • {item.tone}</p>
                        </div>
                        <button 
                          onClick={() => downloadAudio(item.url, `guber-tts-${item.id}.wav`)}
                          className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          <Download size={14} />
                        </button>
                      </motion.div>
                    )) : (
                      <div className="py-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                        <p className="text-[8px] font-black uppercase tracking-widest">Kosong</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default GuberSuaraAI;
