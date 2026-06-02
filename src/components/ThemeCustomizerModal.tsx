import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X, Copy, Check } from 'lucide-react';

// Helper to convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  let h = hex.replace(/^#/, '');
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6) {
    r = parseInt(h.substring(0, 2), 16);
    g = parseInt(h.substring(2, 4), 16);
    b = parseInt(h.substring(4, 6), 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hVal = 0;
  let sVal = 0;
  const lVal = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sVal = lVal > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hVal = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hVal = (b - r) / d + 2;
        break;
      case b:
        hVal = (r - g) / d + 4;
        break;
    }
    hVal /= 6;
  }

  return {
    h: Math.round(hVal * 360),
    s: Math.round(sVal * 100),
    l: Math.round(lVal * 100),
  };
}

// Helper to convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { primaryColor, setPrimaryColor, setSecondaryColor } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const primaryPresets = [
    { name: 'Hijau Gelap', color: '#033003' },
    { name: 'Ungu Gelap', color: '#410052' },
    { name: 'Merah Gelap', color: '#4c0519' },
    { name: 'Indigo Gelap', color: '#1e1b4b' },
    { name: 'Hitam', color: '#000000' },
  ];

  const handleReset = () => {
    setPrimaryColor('#0C4F5F');
    setSecondaryColor('#ffffff');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(primaryColor.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Safe HSL values
  const getSafeHsl = (color: string) => {
    try {
      if (/^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color)) {
        return hexToHsl(color);
      }
    } catch (e) {
      // ignore
    }
    return { h: 200, s: 70, l: 20 }; // default
  };

  const hsl = getSafeHsl(primaryColor);

  const handleLightnessChange = (newLightness: number) => {
    const hex = hslToHex(hsl.h, hsl.s, newLightness);
    setPrimaryColor(hex);
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-[1000] p-4 transition-all duration-300"
      style={{
        backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, rgba(2, 6, 23, 0.75))`
      }}
    >
      <div 
        className="border p-6 md:p-8 rounded-[28px] shadow-2xl w-full max-w-[340px] relative animate-in zoom-in-95 duration-200 transition-colors"
        style={{
          backgroundColor: `color-mix(in srgb, ${primaryColor} 18%, #0f172a)`,
          borderColor: `color-mix(in srgb, ${primaryColor} 30%, rgba(255, 255, 255, 0.1))`
        }}
      >
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all cursor-pointer"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handleReset}
            className="px-3.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.15em] transition-all cursor-pointer bg-white/5 hover:bg-white/10 active:scale-95 outline-none font-sans"
            style={{ 
              color: `color-mix(in srgb, ${primaryColor} 20%, #f1f5f9)`,
              borderColor: `color-mix(in srgb, ${primaryColor} 40%, rgba(255, 255, 255, 0.2))`
            }}
          >
            Default
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Primary Presets Group */}
          <div className="space-y-3">
            <label 
              className="block text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
              style={{ color: `color-mix(in srgb, ${primaryColor} 60%, #94a3b8)` }}
            >
              Pilih Tema
            </label>
            <div className="grid grid-cols-5 gap-3.5">
              {primaryPresets.map((preset) => (
                <button
                  key={preset.color}
                  title={preset.name}
                  onClick={() => setPrimaryColor(preset.color)}
                  className={`w-full h-16 rounded-[14px] border-2 transition-all cursor-pointer relative ${
                    primaryColor.toLowerCase() === preset.color.toLowerCase() 
                      ? 'scale-110 shadow-lg' 
                      : 'border-white/10 hover:border-white/30 hover:scale-105 bg-slate-800'
                  }`}
                  style={{ 
                    backgroundColor: preset.color,
                    borderColor: primaryColor.toLowerCase() === preset.color.toLowerCase() 
                      ? primaryColor 
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {primaryColor.toLowerCase() === preset.color.toLowerCase() && (
                    <span className="absolute inset-x-0 bottom-1 flex items-center justify-center">
                      <Check size={12} className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom & Code Area */}
          <div className="space-y-3 pt-4 border-t border-white/5" style={{ borderColor: `color-mix(in srgb, ${primaryColor} 15%, rgba(255, 255, 255, 0.05))` }}>
            <label 
              className="block text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
              style={{ color: `color-mix(in srgb, ${primaryColor} 60%, #94a3b8)` }}
            >
              Warna Kustom
            </label>
            
            <div 
              className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-3 pr-2 shadow-inner transition-colors"
              style={{ borderColor: `color-mix(in srgb, ${primaryColor} 20%, rgba(255, 255, 255, 0.08))` }}
            >
              {/* Color Picker Wrapper */}
              <div 
                className="relative w-10 h-10 overflow-hidden rounded-xl bg-slate-800 flex-shrink-0 border transition-colors"
                style={{ borderColor: `color-mix(in srgb, ${primaryColor} 30%, rgba(255, 255, 255, 0.1))` }}
              >
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer z-10 opacity-0"
                />
                <div 
                  className="w-full h-full"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>

              {/* Hex Code Input Display */}
              <div className="flex-1 min-w-0">
                <input 
                  type="text"
                  value={primaryColor.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('#') && val.length <= 7) {
                      setPrimaryColor(val);
                    } else if (!val.startsWith('#') && val.length <= 6) {
                      setPrimaryColor('#' + val);
                    }
                  }}
                  className="w-full bg-transparent font-mono text-sm text-white font-medium focus:outline-none tracking-wider uppercase"
                />
              </div>

              {/* Copy Button */}
              <button 
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                title="Salin kode warna"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            
            {/* Lightness Slider Control */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.15em]">
                <span style={{ color: `color-mix(in srgb, ${primaryColor} 60%, #94a3b8)` }}>Kecerahan Warna</span>
                <span className="font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5" style={{ color: `color-mix(in srgb, ${primaryColor} 60%, #cbd5e1)` }}>{hsl.l}%</span>
              </div>
              <div className="flex items-center justify-center pt-1">
                <input 
                  type="range"
                  min="2"
                  max="90"
                  value={hsl.l}
                  onChange={(e) => handleLightnessChange(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer outline-none transition-all"
                  style={{
                    background: `linear-gradient(to right, #020617, ${hslToHex(hsl.h, hsl.s, 50)}, #ffffff)`,
                    accentColor: primaryColor,
                  }}
                />
              </div>
            </div>

            {copied && (
              <p className="text-[10px] font-medium text-emerald-400 text-right animate-pulse">
                Kode warna berhasil disalin!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
