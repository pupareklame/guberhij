import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X } from 'lucide-react';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useTheme();

  if (!isOpen) return null;

  const primaryPresets = [
    { name: 'Ungu Gelap', color: '#1a0b2e' },
    { name: 'Toska Gelap', color: '#0f766e' },
    { name: 'Navy', color: '#1e3a8a' },
    { name: 'Hitam', color: '#000000' },
  ];

  const secondaryPresets = [
    { name: 'Putih', color: '#ffffff' },
    { name: 'Hitam', color: '#000000' },
    { name: 'Kuning', color: '#f59e0b' },
  ];

  const handleReset = () => {
    setPrimaryColor('#1a0b2e');
    setSecondaryColor('#ffffff');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-[280px] relative border border-slate-100 animate-in zoom-in duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-all"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Warna Tema</h2>
          <button 
            onClick={handleReset}
            className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors"
          >
            Reset
          </button>
        </div>
        
        <div className="space-y-8">
          {/* Primary Color Section */}
          <div className="space-y-3">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Pilih Tema</label>
            <div className="grid grid-cols-4 gap-2">
              {primaryPresets.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setPrimaryColor(preset.color)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${primaryColor === preset.color ? 'border-slate-800 scale-105 shadow-md' : 'border-slate-50 hover:border-slate-200'}`}
                  style={{ backgroundColor: preset.color }}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${!primaryPresets.find(p => p.color === primaryColor) ? 'border-slate-800 scale-105 shadow-md' : 'border-slate-50 hover:border-slate-200'}`}
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="w-1 h-1 rounded-full bg-white/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Color Section */}
          <div className="space-y-3">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Warna Aksen</label>
            <div className="grid grid-cols-4 gap-2">
              {secondaryPresets.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setSecondaryColor(preset.color)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${secondaryColor === preset.color ? 'border-slate-800 scale-105 shadow-md' : 'border-slate-50 hover:border-slate-200'}`}
                  style={{ backgroundColor: preset.color }}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${!secondaryPresets.find(p => p.color === secondaryColor) ? 'border-slate-800 scale-105 shadow-md' : 'border-slate-50 hover:border-slate-200'}`}
                  style={{ backgroundColor: secondaryColor }}
                >
                  <div className="w-1 h-1 rounded-full bg-white/50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Terapkan
        </button>
      </div>
    </div>
  );
};
