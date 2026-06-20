
import React, { useState, useEffect, useRef } from 'react';
import { AppId } from './types';
import GuberHome from './apps/GuberHome';
import UbahWarna from './apps/warna';
import GuberPose from './apps/pose';
import GuberPasFoto from './apps/pasfoto';
import GuberCrop from './apps/crop';
import GuberPOV from './apps/pov';
import GuberMiniDekor from './apps/minidekor';
import GuberLuas from './apps/perluas';
import GuberUbah from './apps/ubah';
import GuberSSVideo from './apps/framevideo';
import GuberEkstrak from './apps/ekstrakbaju';
import GuberKidsModel from './apps/buatmodel';
import GuberLatar from './apps/latar';
import GuberFusion from './apps/fusion';
import GuberGabung from './apps/bersama';
import GuberEditin from './apps/editin';
import GuberProduk from './apps/produk';
import GuberUmur from './apps/umur';
import GuberRestore from './apps/olahfoto';
import GuberUpscale from './apps/upscale';
import GuberEraser from './apps/hapusmanual';
import GuberAnimal from './apps/bajuhewan';
import GuberMultiTryOn from './apps/tryon';
import GuberKamarPas from './apps/kamarpas';
import GuberThumbnail from './apps/thumbnail';
import GuberHelm from './apps/helm';
import GuberClean from './apps/bersih';
import GuberEdit from './apps/edit';
import GuberFood from './apps/food';
import GuberMakanan from './apps/makanan';
import GuberTypo from './apps/desainulang';
import GantiBaju from './apps/gantibaju';
import Wedding from './apps/Wedding';
import Scene from './apps/Scene';
import GuberFeedGenerator from './apps/feedgenerator';
import GuberBerpola from './apps/berpola';
import GuberSuaraAI from './apps/suaraai';
import FotoFashion from './apps/fotofashion';
import Jadi3D from './apps/jadi3d';
import Jikanyata from './apps/jikanyata';
import GuberMiniatur from './apps/miniatur';
import LogoStudio from './apps/logo';
import GuberWatermark from './apps/watermark';
import GuberKarakter from './apps/karakter';
import HijabAI from './apps/hijabai';
import WisataAI from './apps/wisata';
import GuberEkstrakHijab from './apps/ekstrakhijab';
import CyborgAI from './apps/cyborg';
import ClaymationAI from './apps/claymation';
import GuberBuat from './apps/buat';
import Guber3DRender from './apps/3drender';
import GuberEstetik from './apps/estetik';
import GuberProdukEstetik from './apps/produkestetik';
import GuberMockupBaju from './apps/mockupbaju';
import GuberCitaCita from './apps/citacita';
import GuberCitaCita2 from './apps/citacita2';
import GuberGemukin from './apps/gemukin';
import GuberKarpet from './apps/karpet';
import GuberColorPicker from './apps/colorpicker';
import GuberRambut from './apps/rambut';
import MemoryApp from './apps/memori';
import GuberSepatu from './apps/sepatu';
import GuberImg2Prompt from './apps/img2prompt';
import GuberPrompt from './apps/prompt';
import GabungPro from './apps/gabungpro';
import GuberManager from './apps/manager';
import { ShieldCheck, Globe, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeCustomizerModal } from './src/components/ThemeCustomizerModal';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

export const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Fashion: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96V10a2 2 0 0 0 2 2h2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8h2a2 2 0 0 0 2-2V5.42a2 2 0 0 0-1.62-1.96z"/></svg>,
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Video: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>,
  Magic: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Tool: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14.7 6.34 1.96 1.96L9.58 15.38 7 14.5l-.88-2.58 7.58-5.58ZM14.7 6.34l.7-.7a2 2 0 0 1 2.82 2.82l-.7.7M9.58 15.38 6 18l1.41 1.41L11 15.83"/><path d="m4.34 19.66 1.96 1.96L3.13 22l-1.13-1.13 1.34-3.17Z"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Star: ({ filled }: { filled?: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke={filled ? "#f59e0b" : "currentColor"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  Menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
  ),
  Flower: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m4.5 4.5a4.5 4.5 0 1 1-4.5-4.5m4.5 4.5V15m4.5-3a4.5 4.5 0 1 1-4.5-4.5M16.5 12H15"/></svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
};

const AppContent: React.FC = () => {
  const [favoriteApps, setFavoriteApps] = useState<Set<AppId>>(new Set<AppId>());
  const [activeApp, setActiveApp] = useState<AppId>(() => {
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app') as AppId;
    if (appParam && Object.values(AppId).includes(appParam)) {
      return appParam;
    }
    const saved = localStorage.getItem('guber_active_app');
    return (saved as AppId) || AppId.GUBER_HOME;
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingDots, setLoadingDots] = useState('.');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev === '...') return '.';
        if (prev === '..') return '...';
        return '..';
      });
    }, 500);

    const loadTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(loadTimer);
    };
  }, []);

  useEffect(() => {
    const handleSwitchApp = (e: Event) => {
      const customEvent = e as CustomEvent<{ appId: AppId }>;
      if (customEvent.detail && customEvent.detail.appId) {
        handleSelect(customEvent.detail.appId);
      }
    };
    window.addEventListener('switch-guber-app', handleSwitchApp);
    return () => {
      window.removeEventListener('switch-guber-app', handleSwitchApp);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeApp === AppId.GUBER_HOME) {
      params.delete('app');
    } else {
      params.set('app', activeApp);
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
    
    localStorage.setItem('guber_active_app', activeApp);
    setOpenedApps(prev => {
      if (prev.has(activeApp)) return prev;
      const next = new Set(prev);
      next.add(activeApp);
      return next;
    });
  }, [activeApp]);

  const [openedApps, setOpenedApps] = useState<Set<AppId>>(() => {
    const initial = new Set<AppId>([AppId.GUBER_HOME]);
    
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app') as AppId;
    if (appParam && Object.values(AppId).includes(appParam)) {
      initial.add(appParam);
    }

    const saved = localStorage.getItem('guber_opened_apps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.forEach((id: AppId) => initial.add(id));
      } catch (e) {
        // ignore
      }
    }
    return initial;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('guber_sidebar_open');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('guber_sidebar_open', isSidebarOpen.toString());
  }, [isSidebarOpen]);
  const [searchQuery, setSearchQuery] = useState('');
  const longPressTimer = useRef<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useTheme();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const savedFavs = localStorage.getItem('guber_favorite_apps');
    if (savedFavs) {
      const parsed = JSON.parse(savedFavs) as AppId[];
      const set = new Set<AppId>(parsed);
      set.add(AppId.GUBER_PROMPT_VIDEO);
      setFavoriteApps(set);
    } else {
      const defaultFavs = [
        AppId.GUBER_POSE, 
        AppId.GUBER_MULTI_TRYON, 
        AppId.GUBER_GANTI_BAJU, 
        AppId.GUBER_LATAR,
        AppId.GUBER_PROMPT_VIDEO
      ];
      setFavoriteApps(new Set<AppId>(defaultFavs));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('guber_opened_apps', JSON.stringify(Array.from(openedApps)));
  }, [openedApps]);

  const handleSelect = (id: AppId) => {
    setActiveApp(id);
    // Only close sidebar on mobile, keep it on desktop if preferred
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const toggleFavorite = (id: AppId, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const newFavs = new Set(favoriteApps);
    if (newFavs.has(id)) {
      newFavs.delete(id);
    } else {
      newFavs.add(id);
    }
    setFavoriteApps(newFavs);
    localStorage.setItem('guber_favorite_apps', JSON.stringify(Array.from(newFavs)));
  };

  const startPress = () => {
    longPressTimer.current = window.setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  const endPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const allAppsMetadata = [
    { id: AppId.GUBER_GANTI_BAJU, name: 'GANTI BAJU', filename: 'gantibaju.tsx', icon: <Icons.Fashion />, description: 'Tukar Pakaian Model' },
    { id: AppId.GUBER_FOOD_ESTETIK, name: 'MAKANAN ESTETIK', filename: 'makanan.tsx', icon: <Icons.Magic />, description: 'Foto Produk Makanan Profesional' },
    { id: AppId.GUBER_FOOD, name: 'FOOD PRO', filename: 'food.tsx', icon: <Icons.Fashion />, description: 'Katalog Makanan Sultan' },
    { id: AppId.GUBER_EDIT, name: 'PRO EDITOR', filename: 'edit.tsx', icon: <Icons.Magic />, description: 'Edit Foto via Prompt' },
    { id: AppId.GUBER_TYPO, name: 'TYPO OCR', filename: 'desainulang.tsx', icon: <Icons.Magic />, description: 'Desain Teks dari Foto' },
    { id: AppId.GUBER_CLEAN, name: 'BERSIH FOTO', filename: 'bersih.tsx', icon: <Icons.Tool />, description: 'Hapus UI dari Screenshot' },
    { id: AppId.GUBER_KAMAR_PAS, name: 'KAMAR PAS', filename: 'kamarpas.tsx', icon: <Icons.User />, description: 'Try-on Atasan & Bawahan' },
    { id: AppId.GUBER_WARNA, name: 'UBAH WARNA', filename: 'warna.tsx', icon: <Icons.Fashion />, description: 'Edit Warna Baju' },
    { id: AppId.GUBER_MULTI_TRYON, name: 'COBA OUTFIT', filename: 'tryon.tsx', icon: <Icons.User />, description: 'Ganti Atasan & Bawahan' },
    { id: AppId.GUBER_POSE, name: 'GAYA MODEL', filename: 'pose.tsx', icon: <Icons.Magic />, description: 'Ubah Pose Katalog' },
    { id: AppId.GUBER_EKSTRAK, name: 'PISAH PAKAIAN', filename: 'ekstrakbaju.tsx', icon: <Icons.Tool />, description: 'Ekstrak Aset Produk' },
    { id: AppId.GUBER_KIDS_MODEL, name: 'MODEL ANAK', filename: 'buatmodel.tsx', icon: <Icons.Magic />, description: 'Karakter Model Anak' },
    { id: AppId.GUBER_PRODUK, name: 'IKLAN PRODUK', filename: 'produk.tsx', icon: <Icons.Fashion />, description: 'Visual Iklan Pro' },
    { id: AppId.GUBER_THUMBNAIL, name: 'THUMBNAIL', filename: 'thumbnail.tsx', icon: <Icons.Video />, description: 'Thumbnail Efek Pro' },
    { id: AppId.GUBER_ERASER, name: 'HAPUS OBJEK', filename: 'hapusmanual.tsx', icon: <Icons.Tool />, description: 'Bersihkan Foto AI' },
    { id: AppId.GUBER_UPSCALE, name: 'TAJAMKAN FOTO', filename: 'upscale.tsx', icon: <Icons.Magic />, description: 'HD Upscale 8K' },
    { id: AppId.GUBER_PAS_FOTO, name: 'PAS FOTO', filename: 'pasfoto.tsx', icon: <Icons.Camera />, description: 'Dokumen Resmi' },
    { id: AppId.GUBER_RESTORE, name: 'RESTORASI', filename: 'olahfoto.tsx', icon: <Icons.Magic />, description: 'Perbaiki Foto Lama' },
    { id: AppId.GUBER_LATAR, name: 'GANTI LATAR', filename: 'latar.tsx', icon: <Icons.Magic />, description: 'Background Kreatif' },
    { id: AppId.GUBER_UMUR, name: 'UBAH UMUR', filename: 'umur.tsx', icon: <Icons.User />, description: 'Tua ke Muda / Sebaliknya' },
    { id: AppId.GUBER_CROP, name: 'POTONG FOTO', filename: 'crop.tsx', icon: <Icons.Tool />, description: 'Crop Rasio Standar' },
    { id: AppId.GUBER_SS_VIDEO, name: 'SS VIDEO', filename: 'framevideo.tsx', icon: <Icons.Video />, description: 'Ambil Frame Video' },
    { id: AppId.GUBER_UBAH, name: 'EDIT AJAIB', filename: 'ubah.tsx', icon: <Icons.Tool />, description: 'Transformasi Visual Bebas' },
    { id: AppId.GUBER_LUAS, name: 'PERLUAS FOTO', filename: 'perluas.tsx', icon: <Icons.Tool />, description: 'Outpainting AI' },
    { id: AppId.GUBER_POV, name: 'POV PRODUK', filename: 'pov.tsx', icon: <Icons.Tool />, description: 'Foto Produk POV' },
    { id: AppId.GUBER_MINIDEKOR, name: 'MINIDEKOR', filename: 'minidekor.tsx', icon: <Icons.Flower />, description: 'Scandinavian & Aesthetics Decor' },
    { id: AppId.GUBER_ANIMAL, name: 'KOSTUM HEWAN', filename: 'bajuhewan.tsx', icon: <Icons.Magic />, description: 'Filter Kostum Unik' },
    { id: AppId.GUBER_FUSION, name: 'GABUNG OBJEK', filename: 'fusion.tsx', icon: <Icons.Magic />, description: 'Kreativitas Tanpa Batas' },
    { id: AppId.GUBER_GABUNG, name: 'GABUNG ORANG', filename: 'bersama.tsx', icon: <Icons.Magic />, description: 'Dua Foto Jadi Satu' },
    { id: AppId.GUBER_EDITIN, name: 'EDIT APA AJA', filename: 'editin.tsx', icon: <Icons.Magic />, description: 'Kreativitas AI Bebas' },
    { id: AppId.GUBER_HEADWEAR, name: 'HELM UNIK', filename: 'helm.tsx', icon: <Icons.Magic />, description: 'Penutup Kepala Humor' },
    { id: AppId.GUBER_WEDDING, name: 'WEDDING AI', filename: 'Wedding.tsx', icon: <Icons.Flower />, description: 'Foto Pengantin Mewah' },
    { id: AppId.GUBER_SCENE, name: 'SCENE MASTER', filename: 'Scene.tsx', icon: <Icons.Camera />, description: 'Ubah Sudut Kamera' },
    { id: AppId.GUBER_FEED_GENERATOR, name: 'FEED GEN', filename: 'feedgenerator.tsx', icon: <Icons.Magic />, description: 'Social Media Feed' },
    { id: AppId.GUBER_BERPOLA, name: 'BERPOLA AI', filename: 'berpola.tsx', icon: <Icons.Magic />, description: 'Bersih, Pose, Latar (3-in-1)' },
    { id: AppId.GUBER_SUARA_AI, name: 'SUARA AI', filename: 'suaraai.tsx', icon: <Icons.Video />, description: 'Text to Speech AI' },
    { id: AppId.GUBER_FOTO_FASHION, name: 'FOTO FASHION', filename: 'fotofashion.tsx', icon: <Icons.Fashion />, description: 'Professional AI Fashion Studio' },
    { id: AppId.GUBER_JADI_3D, name: 'JADI 3D', filename: 'jadi3d.tsx', icon: <Icons.Magic />, description: '2D to 3D Cinematic Transformation' },
    { id: AppId.GUBER_JIKANYATA, name: 'JIKA NYATA', filename: 'jikanyata.tsx', icon: <Icons.Magic />, description: 'Sketsa Menjadi Realitas Fotorealistik' },
    { id: AppId.GUBER_MINIATUR, name: 'MINIATUR AI', filename: 'miniatur.tsx', icon: <Icons.Magic />, description: 'Ubah Orang Jadi Miniatur' },
    { id: AppId.LOGO_STUDIO, name: 'LOGO STUDIO', filename: 'logo.tsx', icon: <Icons.Tool />, description: 'Professional AI Logo Generator' },
    { id: AppId.GUBER_WATERMARK, name: 'WATERMARK AI', filename: 'watermark.tsx', icon: <Icons.Tool />, description: 'Neural Repair Watermark' },
    { id: AppId.GUBER_KARAKTER, name: 'KARAKTER AI', filename: 'karakter.tsx', icon: <Icons.Magic />, description: 'Buah & Objek Jadi Karakter' },
    { id: AppId.GUBER_HIJAB_AI, name: 'HIJAB AI', filename: 'hijabai.tsx', icon: <Icons.Magic />, description: 'Pasang Hijab ke Apapun' },
    { id: AppId.GUBER_EKSTRAK_HIJAB, name: 'EKSTRAK HIJAB', filename: 'ekstrakhijab.tsx', icon: <Icons.Tool />, description: 'Ekstrak Hijab ke Berbagai Media' },
    { id: AppId.GUBER_WISATA, name: 'WISATA AI', filename: 'wisata.tsx', icon: <Icons.Camera />, description: 'Keliling Dunia Secara Ajaib' },
    { id: AppId.GUBER_CYBORG, name: 'CYBORG AI', filename: 'cyborg.tsx', icon: <Icons.Magic />, description: 'Neural Machine Synthesis' },
    { id: AppId.GUBER_CLAYMATION, name: 'CLAYMATION AI', filename: 'claymation.tsx', icon: <Icons.Magic />, description: 'Claymation Character Synthesis' },
    { id: AppId.GUBER_BUAT, name: 'BUAT AI', filename: 'buat.tsx', icon: <Icons.Magic />, description: 'Real Image Generator' },
    { id: AppId.GUBER_3D_RENDER, name: '3D RENDER', filename: '3drender.tsx', icon: <Icons.Magic />, description: 'Isometric Kawaii 3D Render' },
    { id: AppId.GUBER_ESTETIK, name: 'ESTETIK AI', filename: 'estetik.tsx', icon: <Icons.Magic />, description: 'AI Photo Aesthetic Enhancer' },
    { id: AppId.GUBER_PRODUK_ESTETIK, name: 'PRODUK ESTETIK', filename: 'produkestetik.tsx', icon: <Icons.Fashion />, description: 'Visual Iklan Produk Estetik' },
    { id: AppId.GUBER_MOCKUP_BAJU, name: 'MOCKUP BAJU', filename: 'mockupbaju.tsx', icon: <Icons.Fashion />, description: 'Boutique Hanger Mockup' },
    { id: AppId.GUBER_CITACITA, name: 'CITA-CITA V1', filename: 'citacita.tsx', icon: <Icons.Magic />, description: 'Visualisasikan Masa Depanmu' },
    { id: AppId.GUBER_CITACITA2, name: 'CITA-CITA V2', filename: 'citacita2.tsx', icon: <Icons.Magic />, description: 'Outfit & Career Swap Engine' },
    { id: AppId.GUBER_GEMUKIN, name: 'GEMUKIN AI', filename: 'gemukin.tsx', icon: <Icons.User />, description: 'Ubah Bobot Badan Instan' },
    { id: AppId.GUBER_KARPET, name: 'BAJU DI KARPET', filename: 'karpet.tsx', icon: <Icons.Fashion />, description: 'Flat Lay Photography AI' },
    { id: AppId.GUBER_GABUNG_PRO, name: 'GABUNG PRO', filename: 'gabungpro.tsx', icon: <Icons.Magic />, description: 'Neural Image Merger Pro' },
    { id: AppId.COLOR_PICKER, name: 'COLOR PICKER', filename: 'colorpicker.tsx', icon: <Icons.Tool />, description: 'Ekstrak Kode Warna Gambar' },
    { id: AppId.HAIR_TRYON, name: 'GANTI RAMBUT', filename: 'rambut.tsx', icon: <Icons.Fashion />, description: 'Ubah Gaya & Warna Rambut AI' },
    { id: AppId.GUBER_MEMORI, name: 'MEMORI AI', filename: 'memori.tsx', icon: <Icons.Magic />, description: 'Emotional Childhood transition' },
    { id: AppId.GUBER_SEPATU, name: 'ALAS KAKI AI', filename: 'sepatu.tsx', icon: <Icons.Fashion />, description: 'Virtual Footwear Try-On' },
    { id: AppId.IMAGE_TO_PROMPT, name: 'IMAGE TO PROMPT', filename: 'img2prompt.tsx', icon: <Icons.Magic />, description: 'Generate Prompt dari Gambar' },
    { id: AppId.GUBER_PROMPT_VIDEO, name: 'PROMPT VIDEO', filename: 'prompt.tsx', icon: <Icons.Video />, description: 'AI Image to 5s Video Prompt' },
  ];

  const APPS_WITH_DEDICATED_SERVICES = [
    AppId.GUBER_3D_RENDER,
    AppId.GUBER_ANIMAL,
    AppId.GUBER_BERPOLA,
    AppId.GUBER_GABUNG,
    AppId.GUBER_CLEAN,
    AppId.GUBER_BUAT,
    AppId.GUBER_KIDS_MODEL,
    AppId.GUBER_CLAYMATION,
    AppId.GUBER_CROP,
    AppId.GUBER_CYBORG,
    AppId.GUBER_TYPO,
    AppId.GUBER_EDIT,
    AppId.GUBER_EDITIN,
    AppId.GUBER_EKSTRAK,
    AppId.GUBER_EKSTRAK_HIJAB,
    AppId.GUBER_FEED_GENERATOR,
    AppId.GUBER_FOOD,
    AppId.GUBER_FOTO_FASHION,
    AppId.GUBER_SS_VIDEO,
    AppId.GUBER_FUSION,
    AppId.GUBER_GANTI_BAJU,
    AppId.GUBER_ERASER,
    AppId.GUBER_HEADWEAR,
    AppId.GUBER_HIJAB_AI,
    AppId.GUBER_JADI_3D,
    AppId.GUBER_JIKANYATA,
    AppId.GUBER_KAMAR_PAS,
    AppId.GUBER_KARAKTER,
    AppId.GUBER_LATAR,
    AppId.LOGO_STUDIO,
    AppId.GUBER_MINIATUR,
    AppId.GUBER_POV,
    AppId.GUBER_MINIDEKOR,
    AppId.GUBER_RESTORE,
    AppId.GUBER_PAS_FOTO,
    AppId.GUBER_LUAS,
    AppId.GUBER_POSE,
    AppId.GUBER_PRODUK,
    AppId.GUBER_SUARA_AI,
    AppId.GUBER_THUMBNAIL,
    AppId.GUBER_MULTI_TRYON,
    AppId.GUBER_UBAH,
    AppId.GUBER_UMUR,
    AppId.GUBER_UPSCALE,
    AppId.GUBER_WARNA,
    AppId.GUBER_WATERMARK,
    AppId.GUBER_WEDDING,
    AppId.GUBER_WISATA,
    AppId.GUBER_ESTETIK,
    AppId.GUBER_FOOD_ESTETIK,
    AppId.GUBER_PRODUK_ESTETIK,
    AppId.GUBER_MOCKUP_BAJU,
    AppId.GUBER_CITACITA,
    AppId.GUBER_CITACITA2,
    AppId.GUBER_GEMUKIN,
    AppId.GUBER_KARPET,
    AppId.GUBER_GABUNG_PRO,
    AppId.COLOR_PICKER,
    AppId.HAIR_TRYON,
    AppId.GUBER_MEMORI,
    AppId.GUBER_SEPATU,
    AppId.IMAGE_TO_PROMPT,
    AppId.GUBER_PROMPT_VIDEO,
  ];

  const filteredAppsMetadata = allAppsMetadata.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const appSections = [
    { title: 'Favorit Saya', apps: filteredAppsMetadata.filter(a => favoriteApps.has(a.id)) },
    { title: 'Identity Tools', apps: filteredAppsMetadata.filter(a => !favoriteApps.has(a.id) && [AppId.GUBER_UMUR, AppId.GUBER_PAS_FOTO].includes(a.id)) },
    { title: 'Food & Catalog', apps: filteredAppsMetadata.filter(a => !favoriteApps.has(a.id) && [AppId.GUBER_FOOD, AppId.GUBER_PRODUK, AppId.GUBER_POV, AppId.GUBER_MINIDEKOR, AppId.GUBER_PRODUK_ESTETIK, AppId.GUBER_FOOD_ESTETIK].includes(a.id)) },
    { title: 'Fashion & Style', apps: filteredAppsMetadata.filter(a => !favoriteApps.has(a.id) && [AppId.GUBER_GANTI_BAJU, AppId.GUBER_KAMAR_PAS, AppId.GUBER_WARNA, AppId.GUBER_MULTI_TRYON, AppId.GUBER_POSE, AppId.GUBER_EKSTRAK, AppId.GUBER_KIDS_MODEL, AppId.GUBER_FOTO_FASHION, AppId.GUBER_HIJAB_AI, AppId.GUBER_EKSTRAK_HIJAB, AppId.GUBER_KARPET, AppId.HAIR_TRYON, AppId.GUBER_SEPATU].includes(a.id)) },
    { title: 'Studio & Edit', apps: filteredAppsMetadata.filter(a => !favoriteApps.has(a.id) && [AppId.GUBER_EDIT, AppId.GUBER_TYPO, AppId.GUBER_CLEAN, AppId.GUBER_ERASER, AppId.GUBER_UPSCALE, AppId.GUBER_RESTORE, AppId.GUBER_LATAR, AppId.GUBER_CROP, AppId.GUBER_SS_VIDEO, AppId.GUBER_UBAH, AppId.GUBER_LUAS, AppId.GUBER_WATERMARK, AppId.COLOR_PICKER, AppId.IMAGE_TO_PROMPT, AppId.GUBER_PROMPT_VIDEO].includes(a.id)) },
    { title: 'Kreatif', apps: filteredAppsMetadata.filter(a => !favoriteApps.has(a.id) && [AppId.GUBER_THUMBNAIL, AppId.GUBER_ANIMAL, AppId.GUBER_FUSION, AppId.GUBER_GABUNG, AppId.GUBER_GABUNG_PRO, AppId.GUBER_EDITIN, AppId.GUBER_HEADWEAR, AppId.GUBER_WEDDING, AppId.GUBER_SCENE, AppId.GUBER_FEED_GENERATOR, AppId.GUBER_BERPOLA, AppId.GUBER_SUARA_AI, AppId.GUBER_JADI_3D, AppId.GUBER_JIKANYATA, AppId.GUBER_MINIATUR, AppId.LOGO_STUDIO, AppId.GUBER_KARAKTER, AppId.GUBER_WISATA, AppId.GUBER_CYBORG, AppId.GUBER_CLAYMATION, AppId.GUBER_BUAT, AppId.GUBER_3D_RENDER, AppId.GUBER_ESTETIK, AppId.GUBER_MOCKUP_BAJU, AppId.GUBER_CITACITA, AppId.GUBER_CITACITA2, AppId.GUBER_GEMUKIN, AppId.GUBER_MEMORI, AppId.GUBER_SEPATU].includes(a.id)) },
  ];

  const renderApps = () => {
    const appsToRender = [
      { id: AppId.GUBER_HOME, component: <GuberHome onStart={() => setIsSidebarOpen(true)} apps={allAppsMetadata} onSelectApp={handleSelect} /> },
      { id: AppId.GUBER_GANTI_BAJU, component: <GantiBaju /> },
      { id: AppId.GUBER_FOOD_ESTETIK, component: <GuberMakanan /> },
      { id: AppId.GUBER_FOOD, component: <GuberFood /> },
      { id: AppId.GUBER_EDIT, component: <GuberEdit /> },
      { id: AppId.GUBER_TYPO, component: <GuberTypo /> },
      { id: AppId.GUBER_CLEAN, component: <GuberClean /> },
      { id: AppId.GUBER_KAMAR_PAS, component: <GuberKamarPas /> },
      { id: AppId.GUBER_WARNA, component: <UbahWarna /> },
      { id: AppId.GUBER_MULTI_TRYON, component: <GuberMultiTryOn /> },
      { id: AppId.GUBER_POSE, component: <GuberPose /> },
      { id: AppId.GUBER_EKSTRAK, component: <GuberEkstrak /> },
      { id: AppId.GUBER_KIDS_MODEL, component: <GuberKidsModel /> },
      { id: AppId.GUBER_PRODUK, component: <GuberProduk /> },
      { id: AppId.GUBER_THUMBNAIL, component: <GuberThumbnail /> },
      { id: AppId.GUBER_ERASER, component: <GuberEraser /> },
      { id: AppId.GUBER_UPSCALE, component: <GuberUpscale /> },
      { id: AppId.GUBER_PAS_FOTO, component: <GuberPasFoto /> },
      { id: AppId.GUBER_RESTORE, component: <GuberRestore /> },
      { id: AppId.GUBER_LATAR, component: <GuberLatar /> },
      { id: AppId.GUBER_UMUR, component: <GuberUmur /> },
      { id: AppId.GUBER_CROP, component: <GuberCrop /> },
      { id: AppId.GUBER_SS_VIDEO, component: <GuberSSVideo /> },
      { id: AppId.GUBER_UBAH, component: <GuberUbah /> },
      { id: AppId.GUBER_LUAS, component: <GuberLuas /> },
      { id: AppId.GUBER_POV, component: <GuberPOV /> },
      { id: AppId.GUBER_MINIDEKOR, component: <GuberMiniDekor /> },
      { id: AppId.GUBER_ANIMAL, component: <GuberAnimal /> },
      { id: AppId.GUBER_FUSION, component: <GuberFusion /> },
      { id: AppId.GUBER_GABUNG, component: <GuberGabung /> },
      { id: AppId.GUBER_EDITIN, component: <GuberEditin /> },
      { id: AppId.GUBER_HEADWEAR, component: <GuberHelm /> },
      { id: AppId.GUBER_WEDDING, component: <Wedding /> },
      { id: AppId.GUBER_SCENE, component: <Scene /> },
      { id: AppId.GUBER_FEED_GENERATOR, component: <GuberFeedGenerator /> },
      { id: AppId.GUBER_BERPOLA, component: <GuberBerpola /> },
      { id: AppId.GUBER_SUARA_AI, component: <GuberSuaraAI /> },
      { id: AppId.GUBER_FOTO_FASHION, component: <FotoFashion /> },
      { id: AppId.GUBER_JADI_3D, component: <Jadi3D /> },
      { id: AppId.GUBER_JIKANYATA, component: <Jikanyata /> },
      { id: AppId.GUBER_MINIATUR, component: <GuberMiniatur /> },
      { id: AppId.LOGO_STUDIO, component: <LogoStudio /> },
      { id: AppId.GUBER_WATERMARK, component: <GuberWatermark /> },
      { id: AppId.GUBER_KARAKTER, component: <GuberKarakter /> },
      { id: AppId.GUBER_HIJAB_AI, component: <HijabAI /> },
      { id: AppId.GUBER_EKSTRAK_HIJAB, component: <GuberEkstrakHijab /> },
      { id: AppId.GUBER_WISATA, component: <WisataAI /> },
      { id: AppId.GUBER_CYBORG, component: <CyborgAI /> },
      { id: AppId.GUBER_CLAYMATION, component: <ClaymationAI /> },
      { id: AppId.GUBER_BUAT, component: <GuberBuat /> },
      { id: AppId.GUBER_3D_RENDER, component: <Guber3DRender /> },
      { id: AppId.GUBER_ESTETIK, component: <GuberEstetik /> },
      { id: AppId.GUBER_PRODUK_ESTETIK, component: <GuberProdukEstetik /> },
      { id: AppId.GUBER_MOCKUP_BAJU, component: <GuberMockupBaju /> },
      { id: AppId.GUBER_CITACITA, component: <GuberCitaCita /> },
      { id: AppId.GUBER_CITACITA2, component: <GuberCitaCita2 /> },
      { id: AppId.GUBER_GEMUKIN, component: <GuberGemukin /> },
      { id: AppId.GUBER_KARPET, component: <GuberKarpet /> },
      { id: AppId.GUBER_GABUNG_PRO, component: <GabungPro /> },
      { id: AppId.COLOR_PICKER, component: <GuberColorPicker /> },
      { id: AppId.HAIR_TRYON, component: <GuberRambut /> },
      { id: AppId.GUBER_MEMORI, component: <MemoryApp /> },
      { id: AppId.GUBER_SEPATU, component: <GuberSepatu /> },
      { id: AppId.IMAGE_TO_PROMPT, component: <GuberImg2Prompt /> },
      { id: AppId.GUBER_PROMPT_VIDEO, component: <GuberPrompt /> },
      { id: AppId.GUBER_MANAGER, component: <GuberManager /> },
    ];

    return appsToRender.map((app) => {
      if (!openedApps.has(app.id)) return null;
      return (
        <div key={app.id} className={activeApp === app.id ? 'block' : 'hidden'}>
          {app.component}
        </div>
      );
    });
  };

  return (
    <>
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white select-none overflow-hidden"
          >
            <div className="absolute inset-0 bg-radial-gradient from-slate-900 via-slate-950 to-slate-950 opacity-80" />
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                {/* Outer glowing aura */}
                <div 
                  className="absolute w-28 h-28 opacity-25 blur-2xl rounded-full animate-pulse" 
                  style={{ backgroundColor: primaryColor || '#ea580c' }}
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-24 h-24 flex items-center justify-center"
                >
                  <img 
                    src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
                    className="w-full h-full object-contain rounded-full drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                    alt="Guber Logo" 
                  />
                </motion.div>
              </div>
              
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-black uppercase tracking-[0.3em] italic text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  Guber Studio
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 text-center flex items-center justify-center">
                  Welcome
                  <span className="inline-block text-left w-6 ml-0.5" style={{ color: primaryColor || '#ea580c' }}>
                    {loadingDots}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="h-screen font-sans text-slate-900 flex overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: `color-mix(in srgb, ${primaryColor}, white 95%)` }}
      >
      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[110] lg:hidden"
          onClick={(e) => {
            e.stopPropagation();
            setIsSidebarOpen(false);
          }}
        />
      )}

      {!isSidebarOpen && (
        <motion.button 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: 0 }}
          onClick={() => setIsSidebarOpen(true)} 
          className="fixed left-[-20px] top-1/2 -translate-y-1/2 z-[100] backdrop-blur-md w-[50px] h-[140px] rounded-r-2xl border-y border-r border-white/20 flex items-center justify-center transition-all overflow-hidden group"
          style={{ 
            backgroundColor: `${primaryColor}B3`, // 70% opacity
            boxShadow: `0 15px 40px -5px ${primaryColor}99` // Stronger shadow
          }}
        >
           <div className="flex flex-col items-center gap-3 ml-4">
             {/* Top vertical line */}
             <div className="w-[1px] h-10 bg-gradient-to-t from-white/60 to-transparent rounded-full" />
             
             <img 
               src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" 
               className="w-8 h-8 object-contain animate-[spin_15s_linear_infinite] group-hover:scale-110 transition-transform opacity-100" 
               alt="Logo" 
             />

             {/* Bottom vertical line */}
             <div className="w-[1px] h-10 bg-gradient-to-b from-white/60 to-transparent rounded-full" />
           </div>
        </motion.button>
      )}
      
      <aside 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 w-64 z-[120] transition-transform duration-500 lg:translate-x-0 lg:static lg:block flex flex-col overflow-y-auto custom-scrollbar ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} 
        style={{ backgroundColor: primaryColor }}
      >
        
        <div className="flex flex-col border-b border-[var(--color-primary)]/50 relative px-4 py-3 gap-3">
          <div className="flex flex-row items-center gap-3">
            <div 
              className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0 overflow-hidden cursor-pointer active:scale-95 transition-transform" 
              onClick={() => setIsThemeModalOpen(true)}
              onMouseDown={startPress}
              onMouseUp={endPress}
              onMouseLeave={endPress}
              onTouchStart={startPress}
              onTouchEnd={endPress}
            >
               <img src="https://i.ibb.co.com/HLG6zZnr/LOGO-GUBER.png" className="w-6 h-6 object-contain animate-[spin_15s_linear_infinite]" alt="Logo" />
            </div>
            <ThemeCustomizerModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
            <div className="flex-1 flex flex-col items-start text-left">
              <div className="flex items-center gap-2">
                <h1 
                  onClick={() => {
                    setActiveApp(AppId.GUBER_HOME);
                    setIsSidebarOpen(false);
                  }}
                  className="text-sm font-black text-white uppercase tracking-widest italic leading-none cursor-pointer hover:opacity-80 transition-opacity" 
                  style={{ color: `color-mix(in srgb, var(--color-primary) 10%, white)`}}
                >
                  Guber Studio
                </h1>
              </div>
              <span className="text-[9px] font-black text-[var(--color-secondary)] uppercase mt-1 tracking-[0.2em] leading-none">PROFESIONAL</span>
            </div>
            {searchQuery === '1111' && (
              <a 
                href="https://accounts.google.com/SignOutOptions?continue=https://aistudio.google.com/u/5/apps/dfb24f1e-14fe-470b-a038-9faf8ad3808b?showAssistant=true" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-[var(--color-secondary)] transition-all border border-white/10 group"
                title="Ganti Akun"
              >
                <Icons.User />
              </a>
            )}
          </div>

          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-secondary)]/50 group-focus-within:text-white transition-colors">
              <Icons.Search />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aplikasi..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-[10px] font-bold text-white placeholder:[var(--color-secondary)]/30 outline-none focus:bg-white/10 focus:border-white/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-secondary)]/50 hover:text-white p-1"
              >
                <Icons.Close />
              </button>
            )}
          </div>
        </div>

        <nav className="py-2 px-3 space-y-4">
          <div className="px-2 mb-2 space-y-2">
          </div>

          {appSections.map((section, sIdx) => {
            const visibleApps = section.apps;
            if (visibleApps.length === 0) return null;
            return (
              <React.Fragment key={sIdx}>
                {sIdx > 0 && (
                  <div className="px-4 py-3 opacity-40">
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white to-transparent" />
                  </div>
                )}
                <div className="space-y-0">
                  <div className="px-4 py-1.5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-[var(--color-secondary)] uppercase tracking-[0.3em] text-left opacity-70">{section.title}</span>
                </div>
                <div className="space-y-0">
                  {visibleApps.map((app, aIdx) => (
                    <React.Fragment key={app.id}>
                      {aIdx > 0 && (
                        <div className="px-6 py-0.5 opacity-20">
                          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white to-transparent" />
                        </div>
                      )}
                      <button 
                        onClick={() => handleSelect(app.id)} 
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative group ${activeApp === app.id ? 'bg-white text-[var(--color-primary)] shadow-md z-10' : 'text-[var(--color-secondary)] hover:bg-white/5'}`}
                      >
                      <div 
                        onClick={(e) => toggleFavorite(app.id, e)} 
                        className={`shrink-0 p-1 hover:bg-black/5 rounded-md transition-colors flex items-center justify-center ${favoriteApps.has(app.id) ? 'opacity-100' : 'opacity-20 group-hover:opacity-60'}`}
                      >
                        <Icons.Star filled={favoriteApps.has(app.id)} />
                      </div>
                      <div className="shrink-0 scale-90 relative">
                        {app.icon}
                      </div>
                      <div className="flex-1 flex flex-col items-start leading-tight overflow-hidden text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider truncate w-full text-left">{app.name}</span>
                        <span className={`text-[7px] font-mono lowercase opacity-50 truncate w-full text-left ${activeApp === app.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary)]'}`}>{app.filename}</span>
                      </div>
                      {activeApp === app.id && <div className="absolute left-0 w-0.5 h-4 rounded-r-full bg-[var(--color-primary)]"></div>}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}
          <div className="h-[60px] w-full shrink-0"></div> 
        </nav>



        <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/10 flex items-center gap-3">
          <ShieldCheck size={20} className="text-[var(--color-secondary)]" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest leading-tight opacity-70">
            {allAppsMetadata.length} Fitur Premium Aktif
          </span>
        </div>
      </aside>

      


      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className={`flex-1 overflow-y-auto custom-scrollbar px-0 pt-0 pb-4 md:p-6 lg:p-4`}> 
          <div className="max-w-full mx-auto w-full">{renderApps()}</div>
        </div>
      </main>
    </div>
    </>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
