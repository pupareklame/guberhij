
import React, { useState, useRef, useEffect } from 'react';
import { ProcessingState } from '../types';
import { generateSellingNarration, generateSpeech } from '../services/geminiService';
import ImageUploader from '../components/ImageUploader';
// @ts-ignore
import * as lamejs from 'lamejs';

interface VoiceClip {
  id: string;
  voiceName: string;
  timestamp: string;
  audioBase64: string;
  text: string;
}

const GuberNarasi: React.FC = () => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [narration, setNarration] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [voiceHistory, setVoiceHistory] = useState<VoiceClip[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const [voiceProcessing, setVoiceProcessing] = useState(false);

  const voices = [
    { id: 'Zephyr', name: 'Zephyr', icon: '👩' },
    { id: 'Kore', name: 'Kore', icon: '👩' },
    { id: 'Charon', name: 'Charon', icon: '👨' },
    { id: 'Puck', name: 'Puck', icon: '👨' },
    { id: 'Fenrir', name: 'Fenrir', icon: '👨' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('guber_narasi_v9_history');
    if (saved) {
      try { setVoiceHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('guber_narasi_v9_history', JSON.stringify(voiceHistory));
  }, [voiceHistory]);

  const handleGenerateNarration = async () => {
    if (!screenshot) return;
    setProcessing({ isProcessing: true, error: null, progress: 'Menganalisis produk...' });
    try {
      const result = await generateSellingNarration(screenshot);
      const clean = result?.replace(/[^\p{L}\p{N}\p{P}\s]/gu, '').replace(/\s+/g, ' ').trim() || "";
      setNarration(clean);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) {
      setProcessing({ isProcessing: false, error: err.message, progress: '' });
    }
  };

  const handleGenerateVoice = async () => {
    if (!narration.trim()) return;
    setVoiceProcessing(true);
    try {
      const base64 = await generateSpeech(narration.trim(), selectedVoice);
      const newClip: VoiceClip = {
        id: Date.now().toString(),
        voiceName: selectedVoice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioBase64: base64,
        text: narration.trim()
      };
      setVoiceHistory(prev => [newClip, ...prev].slice(0, 10));
      setVoiceProcessing(false);
      // Play immediately after generate
      setTimeout(() => playAudio(base64), 100);
    } catch (err: any) {
      alert("Gagal memproses suara: " + err.message);
      setVoiceProcessing(false);
    }
  };

  const playAudio = async (dataBase64: string) => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) {}
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    
    const binary = atob(dataBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    // Safety check for Int16 conversion
    const pcmData = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
    
    const buffer = ctx.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768.0;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    activeSourceRef.current = source;
    source.start(0);
  };

  const downloadMP3 = (dataBase64: string, voice: string) => {
    try {
      const binary = atob(dataBase64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      
      // CRITICAL: Aligned buffer for Int16Array (2 bytes per sample)
      const safeLen = Math.floor(len / 2) * 2;
      const pcm16 = new Int16Array(bytes.buffer, 0, safeLen / 2);

      // 1 channel, 24000Hz, 128kbps
      const mp3encoder = new lamejs.Mp3Encoder(1, 24000, 128);
      const mp3Data = [];
      const blockSize = 1152;

      for (let i = 0; i < pcm16.length; i += blockSize) {
        const chunk = pcm16.subarray(i, i + blockSize);
        const mp3buf = mp3encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
      }
      
      const last = mp3encoder.flush();
      if (last.length > 0) mp3Data.push(last);
      
      const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Robust download trigger
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `narasi-${voice.toLowerCase()}-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
    } catch (e) { 
      console.error(e);
      alert("Maaf, gagal membuat file MP3."); 
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-6 pb-24">
      
      <div className="flex flex-col items-center text-center space-y-1 mb-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Narasi Pro</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MP3 Sync Engine • V9.0 Stable</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom 1: Upload */}
        <div className="lg:col-span-4 bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col items-center h-fit">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Target Visual</h3>
          <ImageUploader 
            label="Foto Jualan" 
            image={screenshot} 
            onImageSelect={(img) => { setScreenshot(img); setNarration(''); }} 
            aspectRatio="9-16" 
            labelInside={true} 
          />
          <button 
            disabled={processing.isProcessing || !screenshot} 
            onClick={handleGenerateNarration} 
            className="w-full mt-6 h-14 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-30 transition-all border-b-4 border-indigo-800"
          >
            {processing.isProcessing ? "MENGANALISIS..." : "BUAT NASKAH"}
          </button>
        </div>

        {/* Kolom 2: Editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 min-h-[450px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editor Naskah AI</h3>
              {narration && (
                <button 
                  onClick={() => { navigator.clipboard.writeText(narration); setCopyStatus(true); setTimeout(() => setCopyStatus(false), 2000); }}
                  className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-sm ${copyStatus ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-900 active:scale-95'}`}
                >
                  {copyStatus ? 'Tersalin' : 'Copy Teks'}
                </button>
              )}
            </div>

            <div className="flex-1 relative mb-6">
              {processing.isProcessing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                   <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                   <p className="text-[9px] font-black text-indigo-600 uppercase animate-pulse">Menyusun Hook...</p>
                </div>
              )}
              <textarea 
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Hasil akan muncul di sini..."
                className="w-full h-full min-h-[200px] bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl p-6 text-[16px] font-medium leading-relaxed outline-none focus:border-indigo-200 transition-all resize-none text-slate-700 italic shadow-inner"
              />
            </div>

            <div className="bg-slate-900 rounded-[28px] p-5 space-y-6">
               <div className="space-y-3">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest text-center">Pilih Pengisi Suara:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {voices.map(v => (
                      <button 
                        key={v.id} 
                        onClick={() => setSelectedVoice(v.id)} 
                        className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all flex flex-col items-center gap-1 border-2 ${selectedVoice === v.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                      >
                        <span className="text-xl">{v.icon}</span>
                        <span>{v.name}</span>
                      </button>
                    ))}
                  </div>
               </div>
               
               <button 
                disabled={voiceProcessing || !narration.trim()} 
                onClick={handleGenerateVoice} 
                className="w-full h-14 bg-white text-slate-900 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-50 active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3 border-b-4 border-slate-300"
              >
                {voiceProcessing ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-indigo-500 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                    PREVIEW SUARA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat */}
      <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8 px-2">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Riwayat Suara</h3>
           </div>
           {voiceHistory.length > 0 && (
             <button onClick={() => setVoiceHistory([])} className="text-[9px] font-bold text-rose-500 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors uppercase">Hapus Semua</button>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {voiceHistory.length === 0 ? (
            <div className="col-span-full py-16 text-center opacity-10">
               <span className="text-6xl block mb-4">🎤</span>
               <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Riwayat</p>
            </div>
          ) : (
            voiceHistory.map(item => (
              <div key={item.id} className="bg-slate-50 rounded-[28px] p-5 border border-slate-100 hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl">
                      {voices.find(v => v.id === item.voiceName)?.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{item.voiceName}</p>
                      <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{item.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => playAudio(item.audioBase64)} 
                      className="w-11 h-11 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center active:scale-90"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <button 
                      onClick={() => downloadMP3(item.audioBase64, item.voiceName)} 
                      className="w-11 h-11 bg-indigo-600 text-white rounded-xl shadow-md flex items-center justify-center active:scale-90"
                      title="Download MP3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic leading-snug line-clamp-2 px-1">"{item.text}"</p>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pt-4">Guber Studio Neural Engine v9.0</p>
    </div>
  );
};

export default GuberNarasi;
