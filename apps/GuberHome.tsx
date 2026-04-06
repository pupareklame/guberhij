
import React, { useState } from 'react';
import { AppId } from '../types';
import { useTheme } from '../src/contexts/ThemeContext';
import { Search, X } from 'lucide-react';

interface GuberHomeProps {
  onStart: () => void;
  apps: Array<{ id: AppId; name: string; icon: React.ReactNode; description: string; filename: string }>;
  onSelectApp: (id: AppId) => void;
}

const GuberHome: React.FC<GuberHomeProps> = ({ onStart, apps, onSelectApp }) => {
  const { primaryColor, secondaryColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="flex flex-col items-center justify-start pt-12 md:pt-20 min-h-[70vh] animate-in fade-in zoom-in-95 duration-1000 w-full max-w-6xl mx-auto px-6 relative pb-20 rounded-[40px] md:rounded-[60px] shadow-inner border"
      style={{ 
        background: `linear-gradient(to bottom right, color-mix(in srgb, ${primaryColor}, transparent 90%), white, color-mix(in srgb, ${primaryColor}, transparent 95%))`,
        borderColor: `color-mix(in srgb, ${primaryColor}, transparent 80%)`
      }}
    >
      <div className="relative mb-8 group">
        <div 
          className="absolute inset-0 blur-[120px] rounded-full animate-pulse transition-colors"
          style={{ backgroundColor: `color-mix(in srgb, ${primaryColor}, transparent 90%)` }}
        ></div>
        <img 
          src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
          alt="Guber Studio Logo" 
          className="w-24 h-24 md:w-28 md:h-28 object-contain relative z-10 animate-[spin_25s_linear_infinite] group-hover:scale-105 transition-transform duration-1000" 
        />
      </div>
      
      <div className="text-center space-y-8 max-w-4xl relative z-20 w-full">
        <div className="space-y-3">
          <h1 
            className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none italic drop-shadow-md"
            style={{ color: primaryColor }}
          >
            GUBER STUDIO AI
          </h1>
          <p className="text-sm md:text-base font-bold text-slate-500 leading-tight">
            Edit Foto Profesional dengan <span style={{ color: primaryColor }} className="font-black">Guber Studio Canggih</span>
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto w-full relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari fitur premium..."
            className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:border-slate-200 focus:shadow-lg transition-all"
            style={{ borderColor: searchQuery ? primaryColor : undefined }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* Search Results */}
        {searchQuery && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => onSelectApp(app.id)}
                  className="group flex flex-col items-center p-4 bg-white border-2 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  style={{ borderColor: `${primaryColor}20` }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: primaryColor, color: 'white' }}
                  >
                    {app.icon}
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-700 text-center leading-tight">
                    {app.name}
                  </h3>
                  <p className="text-[8px] text-slate-400 font-bold mt-1 text-center line-clamp-2">
                    {app.description}
                  </p>
                  <div className="mt-2 text-[6px] font-mono text-slate-300 uppercase tracking-tighter">
                    {app.filename}
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full py-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
                Tidak ada fitur yang ditemukan
              </div>
            )}
          </div>
        )}

        <div className="pt-8">
          <button 
            onClick={onStart} 
            className="group relative inline-flex items-center justify-center px-10 py-3 font-black text-white transition-all duration-500 rounded-2xl overflow-hidden border-t border-white/20"
            style={{ 
              backgroundColor: primaryColor,
              boxShadow: `0 10px 25px -5px color-mix(in srgb, ${primaryColor}, transparent 60%), inset 0 2px 4px rgba(255,255,255,0.3)`
            }}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            <span className="text-[10px] tracking-[0.8em] uppercase ml-[0.8em] relative z-10">MENU LENGKAP</span>
          </button>
        </div>

        <div className="pt-4">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">
            by Guber Smart
          </p>
        </div>
      </div>

      <div className="mt-8 opacity-20 flex gap-3">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }}></div>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>
      </div>
    </div>
  );
};

export default GuberHome;
