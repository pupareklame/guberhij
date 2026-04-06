
import React, { useState } from 'react';
import { ProcessingState } from '../types';
import { editPromptWithAI } from '../services/geminiService';

const MOTION_PRESETS = [
  { id: 'WALK', name: 'Jalan Maju', icon: '🚶', desc: 'berjalan maju perlahan ke arah kamera' },
  { id: 'SMOOTH', name: 'Usap Baju', icon: '👕', desc: 'mengusap dan merapikan pakaian dengan tangan' },
  { id: 'TILT_L', name: 'Miring Kiri', icon: '⬅️', desc: 'memiringkan badan atau kepala ke kiri dengan anggun' },
  { id: 'TILT_R', name: 'Miring Kanan', icon: '➡️', desc: 'memiringkan badan atau kepala ke kanan dengan anggun' },
  { id: 'WIND', name: 'Tiupan Angin', icon: '💨', desc: 'angin lembut meniup pakaian dan rambut secara halus' },
  { id: 'SMILE', name: 'Senyum Tipis', icon: '😊', desc: 'tersenyum tipis ke arah kamera dengan natural' },
  { id: 'LOOK', name: 'Menatap Kamera', icon: '👁️', desc: 'melakukan kontak mata intens dengan lensa' },
  { id: 'HAND_POCKET', name: 'Tangan Saku', icon: '👖', desc: 'memasukkan tangan ke saku celana atau jaket' },
  { id: 'TURN', name: 'Berputar', icon: '🔄', desc: 'berputar pelahan menunjukkan detail pakaian 360 derajat' },
  { id: 'HAIR_FIX', name: 'Rapikan Rambut', icon: '💇', desc: 'merapikan anak rambut yang tertiup angin' },
];

const GuberEditPrompt: React.FC = () => {
  const [description, setDescription] = useState<string>('');
  const [customDirectives, setCustomDirectives] = useState<string>('');
  const [selectedMotions, setSelectedMotions] = useState<string[]>([]);
  const [resultPrompt, setResultPrompt] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);
  
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: '',
  });

  const toggleMotion = (id: string) => {
    setSelectedMotions(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!description.trim() && selectedMotions.length === 0) {
      setProcessing(prev => ({ ...prev, error: "Harap masukkan deskripsi atau pilih gerakan." }));
      return;
    }

    setProcessing({ 
      isProcessing: true, 
      error: null, 
      progress: 'Neural AI sedang merancang koreografi 6 detik...' 
    });
    setResultPrompt(null);

    try {
      const motionDescriptions = selectedMotions.map(id => 
        MOTION_PRESETS.find(p => p.id === id)?.desc || ''
      );
      
      const result = await editPromptWithAI(
        description || "Seorang model fashion", 
        motionDescriptions,
        customDirectives
      );
      setResultPrompt(result);
      setProcessing({ isProcessing: false, error: null, progress: 'Prompt Selesai!' });
    } catch (err: any) {
      setProcessing({ 
        isProcessing: false, 
        error: err.message || "Gagal merancang prompt.", 
        progress: '' 
      });
    }
  };

  const handleCopy = () => {
    if (!resultPrompt) return;
    navigator.clipboard.writeText(resultPrompt).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-2">
         <h2 className="text-2xl font-black text-slate-800 uppercase tracking-[0.2em] italic">Guber Motion Architect</h2>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grok 6s Image-to-Video Scripting • Master Cinematic Flow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Kolom 1: Input & Presets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[44px] p-8 md:p-10 border border-slate-100 shadow-xl space-y-8">
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-2">1. Deskripsi Singkat Karakter/Foto</label>
               <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Wanita cantik memakai jaket kulit hitam di jalanan Tokyo malam hari..."
                  className="w-full bg-slate-50 border-2 border-dashed border-teal-100 rounded-[32px] p-6 text-[12px] font-bold text-teal-900 outline-none focus:border-teal-400 transition-all min-h-[100px] resize-none shadow-inner"
               />
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-50">
               <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">2. Racik Koreografi Gerakan</label>
                  <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded">Boleh Pilih Banyak</span>
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {MOTION_PRESETS.map((m) => (
                    <button 
                      key={m.id}
                      onClick={() => toggleMotion(m.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-[24px] border-2 transition-all gap-2 relative group ${selectedMotions.includes(m.id) ? 'bg-teal-600 border-teal-600 text-white shadow-2xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-teal-200'}`}
                    >
                      <span className="text-2xl transition-transform group-hover:scale-110">{m.icon}</span>
                      <span className="text-[8px] font-black uppercase text-center leading-tight">{m.name}</span>
                      {selectedMotions.includes(m.id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                           <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-50">
               <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">3. Instruksi Teknis & Kamera (Opsional)</label>
                  <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Special Directives</span>
               </div>
               <textarea 
                  value={customDirectives}
                  onChange={(e) => setCustomDirectives(e.target.value)}
                  placeholder="Contoh: Kamera mengikuti model (tracking), tanpa ada bayangan menutupi wajah, pencahayaan studio cerah, soft bokeh..."
                  className="w-full bg-slate-50 border-2 border-dashed border-indigo-100 rounded-[32px] p-6 text-[12px] font-bold text-indigo-900 outline-none focus:border-indigo-400 transition-all min-h-[100px] resize-none shadow-inner"
               />
               <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter px-2 italic">Gunakan ini untuk kontrol pergerakan kamera dan pencahayaan yang lebih presisi.</p>
            </div>

            <button 
              disabled={processing.isProcessing || (!description && selectedMotions.length === 0)} 
              onClick={handleGenerate} 
              className={`w-full py-6 rounded-[32px] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-4 ${processing.isProcessing ? 'bg-slate-400 text-slate-200' : 'bg-slate-900 text-white hover:bg-teal-600'}`}
            >
              {processing.isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>ARCHITECTING MOTION...</span>
                </>
              ) : (
                <>
                  <span>RANCANG SKRIP VIDEO</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </>
              )}
            </button>
            
            {processing.error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[9px] font-black uppercase text-center tracking-widest">
                ⚠️ {processing.error}
              </div>
            )}
          </div>
        </div>

        {/* Kolom 2: Output Area */}
        <div className="lg:col-span-5 flex flex-col h-full sticky top-10">
          <div className="bg-slate-900 rounded-[50px] p-8 md:p-12 border border-white/5 shadow-3xl relative overflow-hidden flex-1 flex flex-col min-h-[500px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-[80px] rounded-full"></div>
            
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
               <h3 className="text-[11px] font-black text-teal-400 uppercase tracking-[0.4em]">Hasil Skrip Video</h3>
               {resultPrompt && (
                  <span className="text-[8px] font-black bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded uppercase">6s Optimized</span>
               )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {processing.isProcessing ? (
                <div className="flex flex-col items-center gap-8 text-center">
                   <div className="w-20 h-20 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.5em] animate-pulse">{processing.progress}</p>
                </div>
              ) : resultPrompt ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 relative group shadow-inner">
                    <p className="text-white/90 text-[14px] md:text-[15px] font-medium leading-relaxed italic select-all cursor-text">
                      "{resultPrompt}"
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleCopy}
                    className={`w-full py-6 rounded-[28px] font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-4 ${copyStatus ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-teal-400'}`}
                  >
                    {copyStatus ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        COPIED TO CLIPBOARD
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        SALIN PROMPT GERAKAN
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center px-12 opacity-10 grayscale">
                   <img src="https://i.ibb.co.com/1GwzNnsH/GUBER-FOTO-PRO.png" className="w-24 h-24 mb-8 animate-[spin_20s_linear_infinite]" alt="Logo" />
                   <p className="text-[12px] font-black uppercase text-white tracking-[0.5em] italic leading-tight text-center">Movement Engine Ready</p>
                   <p className="text-[9px] text-white/50 mt-4 uppercase font-bold tracking-widest leading-relaxed">Racik skenario visual di kiri untuk menghasilkan skrip video profesional</p>
                </div>
              )}
            </div>

            <div className="mt-12 flex flex-col items-center gap-3 opacity-30">
               <span className="text-[9px] font-black text-teal-400 uppercase tracking-[0.6em]">Professional Motion Logic Protocol</span>
               <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500/20" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuberEditPrompt;
