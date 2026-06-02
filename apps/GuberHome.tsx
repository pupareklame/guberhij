import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, X, Compass, ArrowRight } from 'lucide-react';
import { AppId } from '../types';
import { useTheme } from '../src/contexts/ThemeContext';

interface GuberHomeProps {
  onStart: () => void;
  apps: Array<{ id: AppId; name: string; icon: React.ReactNode; description: string; filename: string }>;
  onSelectApp: (id: AppId) => void;
}

const GuberHome: React.FC<GuberHomeProps> = ({ onStart, apps, onSelectApp }) => {
  const { primaryColor, secondaryColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Saring agar tidak menampilkan GuberHome itu sendiri di menu pilihan
  const selectableApps = apps.filter(app => app.id !== AppId.GUBER_HOME);

  // Fitur premium hanya akan diisi dan ditampilkan saat kolom pencarian TIDAK kosong
  const filteredApps = searchQuery.trim() === ''
    ? []
    : selectableApps.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div 
      id="guber-home-outer-frame" 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-500"
      style={{
        background: `radial-gradient(circle at center, color-mix(in srgb, ${primaryColor} 85%, #000000 15%), color-mix(in srgb, ${primaryColor} 70%, #000000 30%))`
      }}
    >
      
      {/* Bingkai Utama Berbentuk Rounded Elips Melayang */}
      <div 
        id="guber-home-root" 
        className="w-full max-w-6xl rounded-[32px] md:rounded-[48px] border text-slate-100 flex flex-col items-center pt-16 md:pt-24 px-6 md:px-12 pb-20 relative overflow-hidden select-none shadow-2xl transition-all duration-500"
        style={{
          backgroundColor: `color-mix(in srgb, ${primaryColor} 94%, #000000 6%)`,
          borderColor: `color-mix(in srgb, ${primaryColor} 30%, rgba(255, 255, 255, 0.2) 70%)`,
          backdropFilter: 'blur(28px)'
        }}
      >
        
        {/* Background radial grid line patterns */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.45) 1.2px, transparent 1.2px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Dynamic ambient backdrop glows */}
        <div 
          className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" 
          style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
        />
        <div 
          className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none transition-colors duration-500" 
          style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 8%, transparent)` }}
        />

        {/* Hero Header Area */}
        <div className="flex flex-col items-center text-center relative z-10 max-w-4xl mx-auto w-full mb-12">
          
          {/* Logo Tanpa Kotak Rounded & Logonya Senantiasa Berputar Halus */}
          <motion.div 
            id="guber-logo-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
            <motion.img 
              src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
              alt="Guber Studio Logo" 
              className="w-28 h-28 md:w-36 md:h-36 object-contain relative z-10"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = '<span class="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">G</span>';
                }
              }}
            />
          </motion.div>

          {/* Title Area */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="space-y-3"
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none uppercase">
              GUBER <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, color-mix(in srgb, ${primaryColor}, white 60%), color-mix(in srgb, ${primaryColor}, white 95%))` }}>STUDIO</span> AI
            </h1>
            <p className="text-sm md:text-base font-medium text-slate-400 max-w-lg mx-auto leading-relaxed">
              Edit Foto Profesional dengan <span className="font-bold" style={{ color: `color-mix(in srgb, ${primaryColor}, white 70%)` }}>Guber Studio Canggih</span>
            </p>
          </motion.div>

          {/* Tombol LIHAT SEMUA FITUR diatas kolom pencarian */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-8 flex flex-col items-center text-center gap-2 relative z-10"
          >
            <button 
              id="start-btn"
              onClick={onStart}
              className="group relative px-10 py-4 rounded-2xl font-black text-white text-sm tracking-[0.2em] uppercase overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 20px 50px -5px color-mix(in srgb, ${primaryColor}, transparent 55%), inset 0 2px 4px rgba(255, 255, 255, 0.2)`
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-15 bg-white transition-opacity duration-300"
              />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              
              <span className="relative font-black">
                LIHAT SEMUA FITUR
              </span>
            </button>
          </motion.div>

          {/* Search Inputs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-xl mx-auto w-full mt-10 relative px-2"
          >
            <div 
              className="relative rounded-2xl bg-white/5 border backdrop-blur-xl transition-all duration-300"
              style={{
                borderColor: searchQuery ? `color-mix(in srgb, ${primaryColor}, rgba(255,255,255,0.2) 30%)` : 'rgba(255,255,255,0.1)',
                boxShadow: searchQuery ? `0 0 25px -5px color-mix(in srgb, ${primaryColor}, transparent 60%)` : undefined
              }}
            >
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={20} />
              </div>
              
              <input 
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari fitur premium..."
                className="w-full bg-transparent pl-14 pr-14 py-4 md:py-5 text-base font-medium text-white placeholder:text-slate-500 outline-none rounded-2xl"
              />
              
              {searchQuery && (
                <button 
                  id="clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Hasil Pencarian Kompak & Dekat Kolom Pencarian */}
            {searchQuery.trim() !== '' && (
              <div className="w-full mt-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between px-1 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Hasil Pencarian
                  </span>
                  <span className="text-[9px] font-bold text-slate-400/80">
                    {filteredApps.length} ditemukan
                  </span>
                </div>

                {filteredApps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {filteredApps.map((app) => (
                      <button
                        key={app.id}
                        id={`app-${app.id}`}
                        onClick={() => onSelectApp(app.id)}
                        className="group relative px-8 py-3.5 rounded-2xl font-black text-white text-xs tracking-[0.15em] uppercase overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/45 flex items-center justify-center text-center w-full min-h-[50px]"
                        style={{
                          backgroundColor: primaryColor,
                          boxShadow: `0 10px 25px -5px color-mix(in srgb, ${primaryColor}, transparent 45%), inset 0 1px 2px rgba(255,255,255,0.15)`
                        }}
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-15 bg-white transition-opacity duration-300" />
                        <span className="relative font-black truncate max-w-full">
                          {app.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="w-full py-6 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tidak ditemukan hasil</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Footnote Signature */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 relative z-10 text-center"
        >
          <p className="text-white font-black text-[9px] uppercase tracking-[0.2em] opacity-80">
            by Guber Smart
          </p>
        </motion.div>

        {/* Ambient indicator bulatan halus flat di bagian bawah */}
        <div className="mt-12 opacity-30 flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
        </div>

      </div>
    </div>
  );
};

export default GuberHome;
