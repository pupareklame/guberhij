/**
 * [INTEGRITY-CHECK]: minidekor-v1
 * STATUS: PROTECTED
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Download, 
  RefreshCw, 
  Scissors, 
  Check, 
  X, 
  Sparkles, 
  Maximize, 
  Palette, 
  Image as ImageIcon, 
  Eye, 
  Grid, 
  SlidersHorizontal,
  Home,
  CheckCircle,
  TrendingUp,
  Sliders,
  Trash2,
  Settings,
  Camera
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ProcessingState, MiniDekorConfig, AppId } from '../types';
import { generateDekor, upscaleDekorImage } from '../services/minidekor';
import { useTheme } from '../src/contexts/ThemeContext';

interface PresetVariation {
  id: string;
  name: string;
  description: string;
  tag: string;
  colorHex: string;
  config: MiniDekorConfig;
}

const PRESET_VARIATIONS: PresetVariation[] = [
  {
    id: 'scandinavian',
    name: 'Putih & Kayu',
    description: 'Kombinasi klasik kayu oak alami dengan tulip putih segar.',
    tag: 'VARIASI 1',
    colorHex: '#EAE5D9',
    config: {
      vasBunga: 'white tulips in a clear glass vase',
      lampuMeja: 'pleated wooden table lamp with warm yellow light',
      bukuFoto: 'stack of beige art books on a wooden stand',
      ornamenDekorasi: 'bubble candle sculpture',
      lilinAromaterapi: 'scented soy candle',
      taplak: 'soft white textured tablecloth',
      warna: 'cream and ivory color palette',
      suasana: 'cozy and elegant',
      kamera: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)',
      warnaDinding: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'
    }
  },
  {
    id: 'sage_green',
    name: 'Sage Green',
    description: 'Nuansa alam yang menenangkan dengan dedaunan eukaliptus.',
    tag: 'VARIASI 2',
    colorHex: '#A2B59F',
    config: {
      vasBunga: 'eucalyptus branches in a ceramic vase',
      lampuMeja: 'sage green fabric lampshade with warm lighting',
      bukuFoto: 'gardening books displayed on a wooden easel',
      ornamenDekorasi: 'moss stone ornament',
      lilinAromaterapi: 'scented candle in frosted glass',
      taplak: 'textured linen tablecloth',
      warna: 'sage green and cream colors',
      suasana: 'relaxing nature-inspired',
      kamera: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)',
      warnaDinding: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'
    }
  },
  {
    id: 'pink_pastel',
    name: 'Pink Pastel',
    description: 'Dekorasi manis nan romantis dengan bunga peony pink.',
    tag: 'VARIASI 3',
    colorHex: '#E8C5C8',
    config: {
      vasBunga: 'blush pink peonies in a transparent vase',
      lampuMeja: 'pastel pink table lamp with pleated shade',
      bukuFoto: 'fashion magazines on mini wooden stand',
      ornamenDekorasi: 'pearl decorative sculpture',
      lilinAromaterapi: 'pink scented candle',
      taplak: 'embroidered white tablecloth',
      warna: 'blush pink and ivory color palette',
      suasana: 'dreamy and romantic',
      kamera: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)',
      warnaDinding: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'
    }
  },
  {
    id: 'japandi',
    name: 'Japandi Zen',
    description: 'Harmoni ketenangan Jepang dan fungsionalitas Skandinavia.',
    tag: 'VARIASI 4',
    colorHex: '#DFD5C6',
    config: {
      vasBunga: 'dried pampas grass in a matte ceramic vase',
      lampuMeja: 'Japanese paper lamp glowing warmly',
      bukuFoto: 'minimalist architecture books on wooden easel',
      ornamenDekorasi: 'stone sculpture ornament',
      lilinAromaterapi: 'neutral candle',
      taplak: 'beige linen tablecloth',
      warna: 'warm beige, sand and wood tones',
      suasana: 'peaceful zen',
      kamera: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)',
      warnaDinding: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'
    }
  },
  {
    id: 'dark_mocha',
    name: 'Dark Mocha',
    description: 'Gaya premium nan mewah dengan mawar merah dan kayu walnut.',
    tag: 'VARIASI 5',
    colorHex: '#6F4E37',
    config: {
      vasBunga: 'dark red roses in smoked glass vase',
      lampuMeja: 'walnut wood lamp with warm amber glow',
      bukuFoto: 'black hardcover design books',
      ornamenDekorasi: 'marble sculpture ornament',
      lilinAromaterapi: 'premium scented candle',
      taplak: 'mocha brown textured tablecloth',
      warna: 'dominant chocolate brown, beige and gold palette',
      suasana: 'sophisticated',
      kamera: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)',
      warnaDinding: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'
    }
  },
  {
    id: 'blue_coastal',
    name: 'Blue Coastal',
    description: 'Kesegaran pesisir pantai dengan bunga hydrangea biru.',
    tag: 'VARIASI 6',
    colorHex: '#A3BACD',
    config: {
      vasBunga: 'blue hydrangea flowers in a glass vase',
      lampuMeja: 'white pleated lamp with warm light',
      bukuFoto: 'travel books with ocean photography',
      ornamenDekorasi: 'seashell ornament',
      lilinAromaterapi: 'blue scented candle',
      taplak: 'textured white tablecloth',
      warna: 'dominant navy blue and white palette',
      suasana: 'calm seaside',
      kamera: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)',
      warnaDinding: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'
    }
  },
  {
    id: 'vintage_book',
    name: 'Vintage Book',
    description: 'Nostalgia sudut baca klasik dengan mawar putih hangat.',
    tag: 'VARIASI 7',
    colorHex: '#C5A880',
    config: {
      vasBunga: 'cream roses in antique glass vase',
      lampuMeja: 'brass table lamp with warm glow',
      bukuFoto: 'stacked classic hardcover books',
      ornamenDekorasi: 'vintage pocket watch ornament',
      lilinAromaterapi: 'soy candle',
      taplak: 'lace tablecloth',
      warna: 'warm beige and antique gold tones',
      suasana: 'nostalgic',
      kamera: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)',
      warnaDinding: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'
    }
  },
  {
    id: 'modern_luxury',
    name: 'Modern Luxury',
    description: 'Kemewahan kamar hotel bintang 5 dengan bunga anggrek.',
    tag: 'VARIASI 8',
    colorHex: '#ECCDA9',
    config: {
      vasBunga: 'white orchids in elegant vase',
      lampuMeja: 'designer sculptural lamp',
      bukuFoto: 'luxury fashion coffee-table books',
      ornamenDekorasi: 'abstract ceramic sculpture',
      lilinAromaterapi: 'premium candle',
      taplak: 'silk tablecloth',
      warna: 'white, gold and champagne color palette',
      suasana: 'upscale',
      kamera: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)',
      warnaDinding: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'
    }
  }
];

const CAMERA_OPTIONS = [
  { label: 'Eye-Level (Sejajar Meja - 0°)', val: 'straight eye-level shot (0-degree angle, level with the tabletop, looking directly forward horizontally at the objects)' },
  { label: 'Subtle High Angle (Sesuai Foto - 15°)', val: 'subtle high-angle shot (15-degree tilt downward, looking gracefully down at the tabletop and hiasan objek)' },
  { label: 'Medium High Angle (30°)', val: 'medium high-angle shot (30-degree tilt downward from high eye-view, showing more of the decorated table surface)' },
  { label: 'Steep High Angle (45°)', val: 'steep high-angle shot (45-degree angle pointing downwards, showcasing the spacious table arrangement and wall background equally)' },
  { label: 'Semi Top-Down Angle (60°)', val: 'semi-overhead view (60-degree steep downward projection, displaying the complete layout from a higher perspective)' },
  { label: 'Full Overhead / Flatlay (Tegak Lurus - 90°)', val: 'straight top-down overhead flatlay shot (90-degree angle, pointing perpendicular onto the beautiful table decor elements)' },
  { label: 'Cinematic Closeup (Detail Dekat)', val: 'close-up beauty shot with a cinematic shallow depth of field and soft background blur focusing on the fine textures' }
];

const FLOWER_OPTIONS = [
  { label: 'Tulip Putih', val: 'white tulips in a clear glass vase' },
  { label: 'Eukaliptus Hijau', val: 'eucalyptus branches in a ceramic vase' },
  { label: 'Peony Pink', val: 'blush pink peonies in a transparent vase' },
  { label: 'Rumput Pampas Kering', val: 'dried pampas grass in a matte ceramic vase' },
  { label: 'Mawar Merah', val: 'dark red roses in smoked glass vase' },
  { label: 'Hydrangea Biru', val: 'blue hydrangea flowers in a glass vase' },
  { label: 'Mawar Klasik Cream', val: 'cream roses in antique glass vase' },
  { label: 'Anggrek Putih', val: 'white orchids in elegant vase' },
  { label: 'Bunga Lavender', val: 'lavender flowers in a minimalist container' }
];

const LAMP_OPTIONS = [
  { label: 'Lampu Lipit Kayu (Pleated)', val: 'pleated wooden table lamp with warm yellow light' },
  { label: 'Lampu Tudung Sage Green', val: 'sage green fabric lampshade with warm lighting' },
  { label: 'Lampu Pleated Pink', val: 'pastel pink table lamp with pleated shade' },
  { label: 'Lampu Kertas Jepang (Paper)', val: 'Japanese paper lamp glowing warmly' },
  { label: 'Lampu Kayu Walnut', val: 'walnut wood lamp with warm amber glow' },
  { label: 'Lampu Pleated Putih', val: 'white pleated lamp with warm light' },
  { label: 'Lampu Kuningan Antik (Brass)', val: 'brass table lamp with warm glow' },
  { label: 'Lampu Patung Desainer (Sculptural)', val: 'designer sculptural lamp' }
];

const BOOK_OPTIONS = [
  { label: 'Buku Seni Beige (Stacked)', val: 'stack of beige art books on a wooden stand' },
  { label: 'Buku Berkebun', val: 'gardening books displayed on a wooden easel' },
  { label: 'Majalah Fashion Premium', val: 'fashion magazines on mini wooden stand' },
  { label: 'Buku Arsitektur Minimalis', val: 'minimalist architecture books on wooden easel' },
  { label: 'Buku Hardcover Hitam', val: 'black hardcover design books' },
  { label: 'Buku Travel Nuansa Pantai', val: 'travel books with ocean photography' },
  { label: 'Buku Klasik Hardcover', val: 'stacked classic hardcover books' },
  { label: 'Buku Mode Mewah', val: 'luxury fashion coffee-table books' }
];

const ORNAMENT_OPTIONS = [
  { label: 'Lilin Patung Gelembung (Bubble)', val: 'bubble candle sculpture' },
  { label: 'Batu Lumut Alami (Moss)', val: 'moss stone ornament' },
  { label: 'Patung Mutiara (Pearl)', val: 'pearl decorative sculpture' },
  { label: 'Patung Batu Japandi', val: 'stone sculpture ornament' },
  { label: 'Patung Marmer (Marble)', val: 'marble sculpture ornament' },
  { label: 'Kerang Laut Estetik', val: 'seashell ornament' },
  { label: 'Jam Saku Vintage', val: 'vintage pocket watch ornament' },
  { label: 'Patung Keramik Abstrak', val: 'abstract ceramic sculpture' }
];

const CANDLE_OPTIONS = [
  { label: 'Lilin Kedelai Aromaterapi', val: 'premium scented soy candle' },
  { label: 'Lilin Kaca Doff (Frosted)', val: 'scented candle in frosted glass' },
  { label: 'Lilin Aromaterapi Pink', val: 'pink scented candle' },
  { label: 'Lilin Netral Sand', val: 'neutral aesthetic candle' },
  { label: 'Lilin Aromaterapi Biru', val: 'blue scented candle' }
];

const TABLECLOTH_OPTIONS = [
  { label: 'Taplak Putih Bertekstur', val: 'soft white textured tablecloth' },
  { label: 'Taplak Linen Sage', val: 'textured linen tablecloth' },
  { label: 'Taplak Renda Vintage (Lace)', val: 'lace tablecloth' },
  { label: 'Taplak Linen Krem Sederhana', val: 'beige linen tablecloth' },
  { label: 'Taplak Mocha Bertekstur', val: 'mocha brown textured tablecloth' },
  { label: 'Taplak Sutra Mewah (Silk)', val: 'silk tablecloth' }
];

const COLOR_OPTIONS = [
  { label: 'Cream & Ivory (Scandinavian)', val: 'cream and ivory color palette' },
  { label: 'Sage Green & Cream (Botanical)', val: 'dominant sage green and cream colors' },
  { label: 'Blush Pink & Ivory', val: 'blush pink and ivory color palette' },
  { label: 'Warm Beige, Sand & Wood (Japandi)', val: 'warm beige, sand and wood tones' },
  { label: 'Cokelat Tua, Beige & Gold (Mocha)', val: 'dominant chocolate brown, beige and gold palette' },
  { label: 'Navy Blue & White', val: 'dominant navy blue and white palette' },
  { label: 'Emas Kuno & Beige (Vintage)', val: 'warm beige and antique gold tones' },
  { label: 'Putih, Emas & Champagne (Mewah)', val: 'white, gold and champagne color palette' }
];

const ROOM_THEMES = [
  { label: 'Scandinavian Cozy', val: 'cozy and elegant' },
  { label: 'Botanical Nature-inspired', val: 'relaxing nature-inspired' },
  { label: 'Blush Feminine & Dreamy', val: 'dreamy and romantic' },
  { label: 'Minimalist Japandi Zen', val: 'peaceful zen' },
  { label: 'Dark Modern Sophisticated', val: 'sophisticated luxury hotel suite' },
  { label: 'Warm Vintage Nostalgic', val: 'nostalgic cozy reading corner' },
  { label: 'Sangat Mewah (Five-star Hotel)', val: 'upscale sophisticated luxury' }
];

const WALL_OPTIONS = [
  { label: 'Polos Minimalis (Putih)', val: 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture' },
  { label: 'Panel Kayu Vertikal (Warm Oak)', val: 'scandinavian light oak vertical wooden slat wall cladding paneling in the background, warm natural timber texture' },
  { label: 'Stiker / Motif Wallpaper Botanikal', val: 'elegant minimalist vintage botanical patterned wallpaper on the background wall, gentle subtle floral line-art motifs' },
  { label: 'Marmer Carrara Mewah (Marble)', val: 'luxurious polished white carrara marble wall slabs with elegant gray veining and soft specular highlights in the background' },
  { label: 'Semen Ekspos Minimalis (Concrete)', val: 'chic industrial raw exposed light grey polished concrete wall background with tiny air pockets' }
];

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', class: 'aspect-square' },
  { label: '3:4', value: '3:4', class: 'aspect-[3/4]' },
  { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
  { label: '9:16', value: '9:16', class: 'aspect-[9/16]' },
  { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
];

const GuberMiniDekor: React.FC = () => {
  const { primaryColor } = useTheme();
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>('scandinavian');
  
  // Custom config states
  const [customConfig, setCustomConfig] = useState<MiniDekorConfig>({
    ...PRESET_VARIATIONS[0].config
  });

  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalResult, setOriginalResult] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // Cropper states
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [processing, setProcessing] = useState<ProcessingState>({ 
    isProcessing: false, 
    error: null, 
    progress: '' 
  });

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
      const image = await createImage(resultImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width, height } = croppedAreaPixels;
      canvas.width = width; canvas.height = height;
      ctx.drawImage(
        image, 
        croppedAreaPixels.x, 
        croppedAreaPixels.y, 
        croppedAreaPixels.width, 
        croppedAreaPixels.height, 
        0, 
        0, 
        croppedAreaPixels.width, 
        croppedAreaPixels.height
      );
      const base64Image = canvas.toDataURL('image/png');
      setResultImage(base64Image);
      setIsCropping(false);
    } catch (e) { 
      console.error(e); 
      setProcessing({ isProcessing: false, error: 'Gagal memotong foto dekorasi', progress: '' });
    }
  };

  // Check if current value is one of the dropdown options (to show custom text inputs smoothly)
  const isFlowerPreset = FLOWER_OPTIONS.some(f => f.val === customConfig.vasBunga);
  const isLampPreset = LAMP_OPTIONS.some(l => l.val === customConfig.lampuMeja);
  const isBookPreset = BOOK_OPTIONS.some(b => b.val === customConfig.bukuFoto);
  const isOrnamentPreset = ORNAMENT_OPTIONS.some(o => o.val === customConfig.ornamenDekorasi);
  const isCandlePreset = CANDLE_OPTIONS.some(c => c.val === customConfig.lilinAromaterapi);
  const isTableclothPreset = TABLECLOTH_OPTIONS.some(t => t.val === customConfig.taplak);
  const isColorPreset = COLOR_OPTIONS.some(co => co.val === customConfig.warna);
  const isThemePreset = ROOM_THEMES.some(theme => theme.val === customConfig.suasana);
  const isCameraPreset = CAMERA_OPTIONS.some(cam => cam.val === customConfig.kamera);
  const isWallPreset = WALL_OPTIONS.some(w => w.val === customConfig.warnaDinding);

  // Build the dynamic prompt matching precise user camera angle, composition, and layout instructions!
  const getPromptToUse = () => {
    // Elegant arrangement tucked deep at the back edge of the table near the wall background, leaving the front tabletop clean and minimalist.
    return `Minimalist interior styling design. The image has a strict horizontal split composition: the entire bottom half of the frame (representing 50% of the photograph) is a full flat tabletop surface of a round table covered completely with ${customConfig.taplak}. This tablecloth-covered surface stretches fully from the extreme left edge to the extreme right edge, filling the bottom half. The entire top half of the photograph (representing the other 50% of the image) is a clean, minimalist background styled as: ${customConfig.warnaDinding || 'clean empty minimalist walls meeting in a clean vertical line in the background with a soft matte white plaster texture'}.
All of the styled home decor objects are placed elegantly clustered and arranged together at the far back edge of the tabletop, tucked close to the background corner wall, rather than in the center of the table. This elegant arrangement at the edge near the wall consists of: a clear glass vase containing ${customConfig.vasBunga} positioned at the left back edge close to the wall corner, a decorative ${customConfig.lampuMeja} emitting a soft ambient warm glow in the absolute center back edge near the wall, and a beautiful ${customConfig.bukuFoto} displayed on a small wooden easel stand at the right back edge near the wall. Arranged right alongside them deep at the back of the table are a ${customConfig.ornamenDekorasi} and a gorgeous aromatic ${customConfig.lilinAromaterapi} with soft warm highlights.
The middle and front foreground area of the tablecloth surface are completely empty, clean, uncluttered, and pristine, showcasing a beautiful sense of depth, space, and realistic soft shadows.
The dominant color scheme is ${customConfig.warna}, with a cozy and peaceful ${customConfig.suasana} atmosphere.
Camera: Elegant high-end professional Scandinavian home decor magazine style, ${customConfig.kamera || 'eye-level shot (eye-view) combined with a very subtle high-angle tilt looking down gently'}, neutral background, shallow depth of field, natural soft bokeh, cinematic warm lighting, realistic textures, photorealistic, ultra-detailed, 8k.`;
  };

  const handleGenerate = async () => {
    setResultImage(null);
    setOriginalResult(null);
    setProcessing({ 
      isProcessing: true, 
      error: null, 
      progress: 'PROSES...' 
    });

    try {
      const promptText = getPromptToUse();
      const result = await generateDekor(promptText, aspectRatio);
      setResultImage(result);
      setOriginalResult(result);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (err: any) { 
      setProcessing({ 
        isProcessing: false, 
        error: err.message || 'Gagal merender dekorasi minimalis', 
        progress: '' 
      }); 
    }
  };

  const handleSharpen = async () => {
    if (!resultImage) return;
    setProcessing({ isProcessing: true, error: null, progress: 'AI sedang meningkatkan resolusi ke HD Ultra...' });
    try {
      const sharpenedImage = await upscaleDekorImage(resultImage);
      setResultImage(sharpenedImage);
      setProcessing({ isProcessing: false, error: null, progress: '' });
    } catch (e: any) {
      setProcessing({ isProcessing: false, error: e.message || 'Gagal menajamkan gambar dekorasi.', progress: '' });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `minidekor-${Date.now()}.png`;
    link.click();
  };

  const handleUseAsPOVBackground = () => {
    if (!resultImage) return;
    
    // Save to localStorage for when GuberPOV mounts
    localStorage.setItem('guber_pov_custom_bg', resultImage);
    
    // Dispatch custom event in case GuberPOV is already mounted and listening
    window.dispatchEvent(new CustomEvent('guber-set-custom-bg', { 
      detail: { imageUrl: resultImage } 
    }));

    // Switch workspace app to POV
    window.dispatchEvent(new CustomEvent('switch-guber-app', {
      detail: { appId: AppId.GUBER_POV }
    }));
  };

  const selectPreset = (p: PresetVariation) => {
    setSelectedPresetId(p.id);
    setCustomConfig({ ...p.config });
  };

  const handleCustomFieldChange = (key: keyof MiniDekorConfig, val: string) => {
    setCustomConfig(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const getAspectValue = () => {
    switch(aspectRatio) {
      case '1:1': return 1;
      case '4:3': return 4/3;
      case '3:4': return 3/4;
      case '16:9': return 16/9;
      case '9:16': return 9/16;
      default: return 9/16;
    }
  };

  return (
    <div className="lg:h-screen bg-slate-50/50 lg:overflow-hidden min-h-screen custom-scrollbar overflow-x-hidden">
      <div className="max-w-2xl lg:max-w-full mx-auto lg:h-full bg-[var(--color-app-bg)] flex flex-col border-x border-slate-100 shadow-sm">
        
        {/* Mobile Header - Hidden on Desktop */}
        <div 
          className="p-4 border-b border-white/10 rounded-b-[40px] shadow-xl z-20 lg:hidden"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor}, black 20%))`,
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-inner border border-white/30 backdrop-blur-sm">
                <Box size={16} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-black text-white tracking-tight leading-none mb-0.5">MINIDEKOR AI</h1>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] leading-none text-white/60">Scandinavian & Aesthetics Studio</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Studio Layout identical to Ganti Baju UI flow! */}
        <div className="p-4 lg:p-4 lg:flex-1 lg:overflow-hidden overflow-y-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-full lg:overflow-hidden flex flex-col">
            
            {/* Column 1: Presets Variation Panel */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-4 lg:border-r lg:border-slate-200">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Palette size={14} className="text-slate-300" /> 1. Variasi Estetik
              </label>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                {PRESET_VARIATIONS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      className={`w-full text-center py-3.5 px-4 rounded-xl border transition-all text-xs font-black tracking-tight ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10' 
                          : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Custom Tuning Settings */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-y-auto custom-scrollbar pt-6 lg:pt-0 lg:px-4 lg:border-r lg:border-slate-200">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Settings size={14} className="text-slate-300" /> 2. Kustomisasi Elemen
              </label>

              <div className="space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                {/* 1. Vas Bunga */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Jenis Bunga di Vas</label>
                  <select
                    value={isFlowerPreset ? customConfig.vasBunga : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('vasBunga', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isFlowerPreset && <option value="">Tulis Manual...</option>}
                    {FLOWER_OPTIONS.map((f, idx) => (
                      <option key={idx} value={f.val}>{f.label}</option>
                    ))}
                    {isFlowerPreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.vasBunga}
                    onChange={(e) => handleCustomFieldChange('vasBunga', e.target.value)}
                    placeholder="Ketik deskripsi bunga manual..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 2. Lampu Meja */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Lampu Meja</label>
                  <select
                    value={isLampPreset ? customConfig.lampuMeja : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('lampuMeja', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isLampPreset && <option value="">Tulis Manual...</option>}
                    {LAMP_OPTIONS.map((l, idx) => (
                      <option key={idx} value={l.val}>{l.label}</option>
                    ))}
                    {isLampPreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.lampuMeja}
                    onChange={(e) => handleCustomFieldChange('lampuMeja', e.target.value)}
                    placeholder="Ketik deskripsi lampu manual..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 3. Buku Foto */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Display Buku / Easel</label>
                  <select
                    value={isBookPreset ? customConfig.bukuFoto : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('bukuFoto', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isBookPreset && <option value="">Tulis Manual...</option>}
                    {BOOK_OPTIONS.map((b, idx) => (
                      <option key={idx} value={b.val}>{b.label}</option>
                    ))}
                    {isBookPreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.bukuFoto}
                    onChange={(e) => handleCustomFieldChange('bukuFoto', e.target.value)}
                    placeholder="Ketik deskripsi buku manual..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 4. Ornamen Dekorasi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ornamen Dekorasi</label>
                  <select
                    value={isOrnamentPreset ? customConfig.ornamenDekorasi : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('ornamenDekorasi', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isOrnamentPreset && <option value="">Tulis Manual...</option>}
                    {ORNAMENT_OPTIONS.map((o, idx) => (
                      <option key={idx} value={o.val}>{o.label}</option>
                    ))}
                    {isOrnamentPreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.ornamenDekorasi}
                    onChange={(e) => handleCustomFieldChange('ornamenDekorasi', e.target.value)}
                    placeholder="Ketik deskripsi ornamen manual..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 5. Lilin Aromaterapi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Aksesori Lilin</label>
                  <select
                    value={isCandlePreset ? customConfig.lilinAromaterapi : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('lilinAromaterapi', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isCandlePreset && <option value="">Tulis Manual...</option>}
                    {CANDLE_OPTIONS.map((c, idx) => (
                      <option key={idx} value={c.val}>{c.label}</option>
                    ))}
                    {isCandlePreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.lilinAromaterapi}
                    onChange={(e) => handleCustomFieldChange('lilinAromaterapi', e.target.value)}
                    placeholder="Ketik deskripsi lilin manual..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 6. Taplak */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alas / Taplak Meja</label>
                  <select
                    value={isTableclothPreset ? customConfig.taplak : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('taplak', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isTableclothPreset && <option value="">Tulis Manual...</option>}
                    {TABLECLOTH_OPTIONS.map((t, idx) => (
                      <option key={idx} value={t.val}>{t.label}</option>
                    ))}
                    {isTableclothPreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.taplak}
                    onChange={(e) => handleCustomFieldChange('taplak', e.target.value)}
                    placeholder="Ketik deskripsi alas/taplak manual..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 7. Warna Utama */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Palet Warna Utama</label>
                  <select
                    value={isColorPreset ? customConfig.warna : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('warna', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isColorPreset && <option value="">Tulis Manual...</option>}
                    {COLOR_OPTIONS.map((co, idx) => (
                      <option key={idx} value={co.val}>{co.label}</option>
                    ))}
                    {isColorPreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.warna}
                    onChange={(e) => handleCustomFieldChange('warna', e.target.value)}
                    placeholder="Ketik palet warna manual..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 8. Suasana */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Suasana / Tema Ruangan</label>
                  <select
                    value={isThemePreset ? customConfig.suasana : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('suasana', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isThemePreset && <option value="">Tulis Manual...</option>}
                    {ROOM_THEMES.map((theme, idx) => (
                      <option key={idx} value={theme.val}>{theme.label}</option>
                    ))}
                    {isThemePreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.suasana}
                    onChange={(e) => handleCustomFieldChange('suasana', e.target.value)}
                    placeholder="Ketik tema suasana manual..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 9. Warna / Motif Dinding */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Gaya / Motif Dinding</label>
                  <select
                    value={isWallPreset ? customConfig.warnaDinding : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('warnaDinding', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isWallPreset && <option value="">Tulis Manual...</option>}
                    {WALL_OPTIONS.map((w, idx) => (
                      <option key={idx} value={w.val}>{w.label}</option>
                    ))}
                    {isWallPreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.warnaDinding}
                    onChange={(e) => handleCustomFieldChange('warnaDinding', e.target.value)}
                    placeholder="Ketik deskripsi dinding manual (misal: panel kayu oak, semen, marmer)..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>

                {/* 10. Kamera & Perspektif */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sudut Kamera & Lensa</label>
                  <select
                    value={isCameraPreset ? customConfig.kamera : ''}
                    onChange={(e) => {
                      if (e.target.value !== '') handleCustomFieldChange('kamera', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {!isCameraPreset && <option value="">Tulis Manual...</option>}
                    {CAMERA_OPTIONS.map((cam, idx) => (
                      <option key={idx} value={cam.val}>{cam.label}</option>
                    ))}
                    {isCameraPreset && <option value="">Input Manual Lainnya...</option>}
                  </select>
                  <input
                    type="text"
                    value={customConfig.kamera}
                    onChange={(e) => handleCustomFieldChange('kamera', e.target.value)}
                    placeholder="Ketik instruksi kamera khusus..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:border-slate-300 outline-none shadow-sm"
                  />
                </div>
              </div>

              {/* Generate Trigger Inside Column */}
              <button
                onClick={handleGenerate}
                disabled={processing.isProcessing}
                className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {processing.isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Mendesain...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>RANCANG DEKORASI</span>
                  </>
                )}
              </button>
            </div>

            {/* Column 3: High-End Display Panel */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full lg:overflow-hidden pt-8 lg:pt-0 lg:pl-4">
              
              <div className="flex items-center justify-between shrink-0">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14} className="text-slate-300" /> Rasio Foto
                </label>
                
                {/* Aspect Ratio Menu matching gantibaju layout */}
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar justify-end ml-4">
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black shrink-0 ${
                        aspectRatio === r.value 
                          ? 'shadow-sm text-white' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                      }`}
                      style={{
                        backgroundColor: aspectRatio === r.value ? primaryColor : undefined,
                        borderColor: aspectRatio === r.value ? primaryColor : undefined,
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewport Frame with Ratio Calculations */}
              <div className="lg:flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <div 
                  className={`bg-slate-50 border-2 border-dashed rounded-[24px] flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner`}
                  style={{ 
                    borderColor: resultImage ? 'white' : `${primaryColor}40`,
                    backgroundColor: resultImage ? 'white' : undefined,
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: aspectRatio.replace(':', '/')
                  }}
                >
                  <AnimatePresence mode="wait">
                    {processing.isProcessing ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white/85 backdrop-blur-sm"
                      >
                        <img 
                          src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
                          className="w-16 h-16 object-contain animate-spin" 
                          alt="Logo" 
                        />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] animate-pulse text-center">
                          {processing.progress}
                        </p>
                      </motion.div>
                    ) : resultImage ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                      >
                        {isComparing && originalResult ? (
                          <>
                            {/* Comparison Slider inside the exact bounding ratio! */}
                            <div className="absolute inset-0 select-none overflow-hidden">
                              <img 
                                src={originalResult} 
                                alt="Direct render" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div 
                              className="absolute inset-0 overflow-hidden"
                              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                            >
                              <img 
                                src={resultImage} 
                                alt="Upscaled UHD" 
                                className="absolute inset-0 w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            
                            {/* Slide line handle */}
                            <div 
                              className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
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
                              onChange={(e) => setSliderPos(Number(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                            />

                            {/* Tags */}
                            <div className="absolute bottom-4 left-4 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-wider z-30">
                              Standard
                            </div>
                            <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-white/60 backdrop-blur-md rounded-full text-[8px] font-black text-slate-950 uppercase tracking-wider z-30">
                              Ultra HD Enhanced
                            </div>
                          </>
                        ) : (
                          <img
                            src={resultImage}
                            alt="Mini Dekorasi AI"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                          <img 
                            src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
                            className="w-10 h-10 object-contain grayscale opacity-60" 
                            alt="Logo" 
                          />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Rancang Layout Minimalis
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Utility and Actions bar matching Ganti Baju style */}
              <div className="grid grid-cols-5 gap-2 w-full">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={processing.isProcessing || !resultImage}
                  title="Pratinjau Layar Penuh"
                  className="py-3.5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:text-slate-900 flex items-center justify-center text-slate-400 bg-white transition-all disabled:opacity-30 shadow-sm"
                >
                  <Eye size={18} />
                </button>

                <button
                  onClick={() => setIsComparing(!isComparing)}
                  disabled={processing.isProcessing || !originalResult || resultImage === originalResult}
                  title="Bandingkan Standard vs HD"
                  className={`py-3.5 rounded-2xl border-2 hover:text-slate-900 flex items-center justify-center transition-all disabled:opacity-30 shadow-sm ${
                    isComparing ? 'bg-slate-150 border-slate-300 text-slate-950' : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <SlidersHorizontal size={18} />
                </button>

                <button
                  onClick={() => setIsCropping(true)}
                  disabled={processing.isProcessing || !resultImage}
                  title="Potong Foto"
                  className="py-3.5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:text-slate-900 flex items-center justify-center text-slate-400 bg-white transition-all disabled:opacity-30 shadow-sm"
                >
                  <Scissors size={18} />
                </button>

                <button
                  onClick={handleSharpen}
                  disabled={processing.isProcessing || !resultImage}
                  title="Tingkatkan HD"
                  className="py-3.5 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 hover:text-emerald-800 flex items-center justify-center text-slate-400 bg-white transition-all disabled:opacity-30 shadow-sm"
                >
                  <TrendingUp size={18} />
                </button>

                <button
                  onClick={handleDownload}
                  disabled={processing.isProcessing || !resultImage}
                  title="Simpan Hasil"
                  className="py-3.5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:text-slate-900 flex items-center justify-center text-slate-400 bg-white transition-all disabled:opacity-30 shadow-sm"
                >
                  <Download size={18} />
                </button>
              </div>

              {/* Gunakan sebagai latar kustom POV */}
              <button
                onClick={handleUseAsPOVBackground}
                disabled={processing.isProcessing || !resultImage}
                className="w-full py-3.5 px-4 rounded-2xl border-2 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm border-slate-100 hover:border-slate-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed bg-white"
              >
                <ImageIcon size={16} style={{ color: primaryColor }} />
                Gunakan Sebagai Latar Kustom di POV Produk
              </button>

            </div>

          </div>
        </div>

      </div>

      {/* Full Screen Live Viewport */}
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
                  <Download size={16} /> Download High-Res
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cropper Modal Overlay */}
      <AnimatePresence>
        {isCropping && resultImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Potong Desain Interior</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="px-6 py-2 text-black bg-white hover:bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Check size={14} /> Terapkan Potongan
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <Cropper
                image={resultImage}
                crop={crop}
                zoom={zoom}
                aspect={getAspectValue()}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 bg-black/50 backdrop-blur-md flex flex-col items-center gap-4">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-[10px] font-black text-white/50 uppercase tracking-widest">
                  <span>Skala Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
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

export default GuberMiniDekor;
