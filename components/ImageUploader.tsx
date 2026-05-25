
import React, { useRef } from 'react';
import { useTheme } from '../src/contexts/ThemeContext';
import { Scissors } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  image: string | null;
  onImageSelect: (base64: string) => void;
  onClear?: () => void;
  onCrop?: () => void;
  aspectRatio?: string;
  description?: string;
  labelInside?: boolean;
  shadow?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  image, 
  onImageSelect, 
  onClear,
  onCrop,
  aspectRatio = '9-16',
  description,
  labelInside = false,
  shadow
}) => {
  const { primaryColor } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCrop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCrop) onCrop();
  };

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1-1': return 'aspect-square';
      case '3-4': return 'aspect-[3/4]';
      case '4-3': return 'aspect-[4/3]';
      case '9-16': return 'aspect-[9/16]';
      case '16-9': return 'aspect-[16/9]';
      case 'auto': 
      case 'original': return 'aspect-auto';
      default: return 'aspect-square';
    }
  };

  const containerClass = `${getAspectRatioClass(aspectRatio)} w-full mx-auto`;

  return (
    <div className="flex flex-col items-center gap-3 w-full relative h-full">
      {!labelInside && <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>{label}</h3>}
      
      <div 
        onClick={handleClick}
        className={`${containerClass} bg-white border-2 border-dashed rounded-[32px] flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-500 group relative min-h-[200px] h-full`}
        style={{ 
          borderColor: `${primaryColor}40`,
          boxShadow: shadow || 'none'
        }}
      >
        {image ? (
          <>
            <img 
              src={image} 
              alt={label} 
              className="w-full h-full object-contain select-none pointer-events-none" 
              draggable="false"
            />
            {onClear && (
              <div className="absolute top-4 right-4 flex gap-2 z-20">
                {onCrop && (
                  <button
                    onClick={handleCrop}
                    className="w-10 h-10 bg-white/90 backdrop-blur-md text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                  >
                    <Scissors size={18} />
                  </button>
                )}
                <button
                  onClick={handleClear}
                  className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
               <span className="bg-white/90 px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-lg" style={{ color: primaryColor }}>Ganti Gambar</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <img 
                src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
                alt="Placeholder" 
                className="w-full h-full object-contain opacity-20 group-hover:opacity-40"
              />
            </div>
            <span 
              className="text-[11px] font-black uppercase tracking-widest transition-colors"
              style={{ color: primaryColor }}
            >
              {labelInside ? label : "Pilih Foto"}
            </span>
          </div>
        )}
      </div>
      {description && <p className="text-[10px] font-bold text-center px-4 uppercase tracking-tighter opacity-60" style={{ color: primaryColor }}>{description}</p>}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
};

export default ImageUploader;
