

export enum AppId {
  GUBER_HOME = 'GUBER_HOME',
  GUBER_WARNA = 'GUBER_WARNA',
  GUBER_POSE = 'GUBER_POSE',
  GUBER_PAS_FOTO = 'GUBER_PAS_FOTO',
  GUBER_POV = 'GUBER_POV',
  GUBER_LUAS = 'GUBER_LUAS',
  GUBER_UBAH = 'GUBER_UBAH',
  GUBER_SS_VIDEO = 'GUBER_SS_VIDEO',
  // fix: Enum members must be constants and cannot use getter syntax; changed to string initializer
  GUBER_TIRU = 'GUBER_TIRU',
  GUBER_EKSTRAK = 'GUBER_EKSTRAK',
  GUBER_KIDS_MODEL = 'GUBER_KIDS_MODEL',
  GUBER_LATAR = 'GUBER_LATAR',
  GUBER_FUSION = 'GUBER_FUSION',
  GUBER_GABUNG = 'GUBER_GABUNG',
  GUBER_KAMAR_PAS = 'GUBER_KAMAR_PAS',
  GUBER_MULTI_TRYON = 'GUBER_MULTI_TRYON',
  GUBER_PRODUK = 'GUBER_PRODUK',
  GUBER_ERASER = 'GUBER_ERASER',
  GUBER_UPSCALE = 'GUBER_UPSCALE',
  GUBER_RESTORE = 'GUBER_RESTORE',
  GUBER_UMUR = 'GUBER_UMUR',
  GUBER_CROP = 'GUBER_CROP',
  GUBER_ANIMAL = 'GUBER_ANIMAL',
  GUBER_EDITIN = 'GUBER_EDITIN',
  GUBER_THUMBNAIL = 'GUBER_THUMBNAIL',
  GUBER_HEADWEAR = 'GUBER_HEADWEAR',
  GUBER_CLEAN = 'GUBER_CLEAN',
  GUBER_EDIT = 'GUBER_EDIT',
  GUBER_FOOD = 'GUBER_FOOD',
  GUBER_TYPO = 'GUBER_TYPO',
  GUBER_MANAGER = 'GUBER_MANAGER',
  GUBER_GANTI_BAJU = 'GUBER_GANTI_BAJU',
  GUBER_WEDDING = 'GUBER_WEDDING',
  GUBER_SCENE = 'GUBER_SCENE',
  GUBER_FEED_GENERATOR = 'GUBER_FEED_GENERATOR',
  GUBER_BERPOLA = 'GUBER_BERPOLA',
  GUBER_SUARA_AI = 'GUBER_SUARA_AI',
  GUBER_FOTO_FASHION = 'GUBER_FOTO_FASHION',
  GUBER_JADI_3D = 'GUBER_JADI_3D',
  GUBER_MINIATUR = 'GUBER_MINIATUR',
  GUBER_KARAKTER = 'GUBER_KARAKTER',
  GUBER_HIJAB_AI = 'GUBER_HIJAB_AI',
  GUBER_WISATA = 'GUBER_WISATA',
  LOGO_STUDIO = 'LOGO_STUDIO',
  GUBER_WATERMARK = 'GUBER_WATERMARK',
  GUBER_CYBORG = 'GUBER_CYBORG',
  GUBER_CLAYMATION = 'GUBER_CLAYMATION',
  GUBER_BUAT = 'GUBER_BUAT',
  GUBER_3D_RENDER = 'GUBER_3D_RENDER',
  GUBER_EKSTRAK_HIJAB = 'GUBER_EKSTRAK_HIJAB',
  GUBER_JIKANYATA = 'GUBER_JIKANYATA',
  GUBER_ESTETIK = 'GUBER_ESTETIK',
  GUBER_PRODUK_ESTETIK = 'GUBER_PRODUK_ESTETIK',
  GUBER_MOCKUP_BAJU = 'GUBER_MOCKUP_BAJU',
  GUBER_CITACITA = 'GUBER_CITACITA',
  GUBER_GEMUKIN = 'GUBER_GEMUKIN',
  GUBER_KARPET = 'GUBER_KARPET',
  GUBER_FOOD_ESTETIK = 'GUBER_FOOD_ESTETIK',
  GUBER_GABUNG_PRO = 'GUBER_GABUNG_PRO',
  COLOR_PICKER = 'COLOR_PICKER',
  HAIR_TRYON = 'HAIR_TRYON',
  GUBER_MEMORI = 'GUBER_MEMORI',
  GUBER_CITACITA2 = 'GUBER_CITACITA2',
  GUBER_SEPATU = 'GUBER_SEPATU',
  IMAGE_TO_PROMPT = 'IMAGE_TO_PROMPT',
  GUBER_MINIDEKOR = 'GUBER_MINIDEKOR'
}

export interface FotoFashionConfig {
  modelType: 'MANUSIA' | 'MANEKIN' | 'KUSTOM';
  mannequinType?: 'FULL_BODY' | 'CHILD' | 'TABLETOP';
  gender: 'PRIA' | 'WANITA';
  customGender?: string;
  age: 'ANAK' | 'DEWASA' | 'KUSTOM';
  customAge?: string;
  clothingType: string;
  customClothingType?: string;
  location: 'INDOOR' | 'OUTDOOR';
  visualStyle: 'MINIMALIS' | 'NATURAL' | 'SUNSET' | 'URBAN' | 'ELEGAN' | 'KUSTOM';
  customVisualStyle?: string;
  additionalInstruction: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
  progress: string;
}

export enum TransformMode {
  COLOR_CHANGE = 'COLOR_CHANGE',
  GRAPHIC_REPLACE = 'GRAPHIC_REPLACE'
}

export interface TryOnConfig {
  bgPosePrompt?: string;
}

export type PasFotoCategory = 'SD' | 'SMP' | 'SMA' | 'JAS' | 'KEMEJA_PUTIH' | 'PDH_KHAKI' | 'CUSTOM';
export type FotoSize = '3x4' | '4x6';
export type Gender = 'LAKI_LAKI' | 'PEREMPUAN';
export type HijabStyle = 'SEGI_EPAT' | 'PASMINA';
export type HairStyle = 'ORIGINAL_NEAT' | 'FORMAL';
export type TieStyle = 'TANPA_DASI' | 'SD' | 'SMP' | 'SMA' | 'PEJABAT' | 'KUPU_KUPU' | 'SILANG' | 'CUSTOM';

export interface PasFotoConfig {
  category: PasFotoCategory;
  gender: Gender;
  useHijab: boolean;
  hijabColor: string;
  hijabStyle: HijabStyle;
  hairStyle: HairStyle;
  bgColor: string;
  size: FotoSize;
  useNameTag: boolean;
  nameTagText: string;
  nameTagMaterial: 'HITAM' | 'EMAS';
  useKorpriLogo: boolean;
  useSuit: boolean;
  useTie: boolean;
  tieStyle: TieStyle;
  customTiePrompt?: string;
  customTieImage?: string;
  customOutfitImage?: string;
  customLogoImage?: string;
}

export interface KidsModelConfig {
  age: number;
  gender: 'BOY' | 'GIRL';
  shirtColor: string;
  pantsColor: string;
  pose: string;
  shotType?: 'KNEE_UP' | 'FULL_BODY';
  skinRadiant?: number;
  faceEnhance?: number;
  brightness?: number;
}

export interface PoseConfig {
  posePreset: 'STANDING' | 'WALKING' | 'STYLISH' | 'BIKE' | 'SWING' | 'SLIDE' | 'EATING';
  customPose: string;
  bgPreset: string;
  customBg: string;
}

export interface POVConfig {
  handType: 'LEFT' | 'RIGHT' | 'BOTH';
  productSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  customSizeCm: number;
  bgPreset: string;
  colorNuance: string;
  customBgImage: string | null;
  aiBgPrompt: string;
}

export interface MiniDekorConfig {
  vasBunga: string;
  lampuMeja: string;
  bukuFoto: string;
  ornamenDekorasi: string;
  lilinAromaterapi: string;
  taplak: string;
  warna: string;
  suasana: string;
  kamera: string;
  warnaDinding: string;
}

export interface ExpandConfig {
  expansionType: 'AUTO' | 'MANUAL';
  additionalInstruction: string;
}

export interface GuberProdukConfig {
  interactionState: string;
  cameraAngle: 'FRONT' | 'SIDE' | 'TOP';
  outfitStyle: string;
  environment: string;
  additionalPrompt: string;
}

export interface FusionConfig {
  object1: string;
  object2: string;
  style: string;
}

export interface GabungConfig {
  subject1: string;
  subject2: string;
  interaction: string;
  environment: string;
  style: string;
  subject1Image?: string | null;
  subject2Image?: string | null;
}

export interface AnimeConfig {
  stylePreset: string;
  customStyle: string;
  powerEffect: string;
  isCyberpunk: boolean;
}

export interface HaluConfig {
  bgPreset: string;
  customBg: string;
  nuance: string;
  poseType: string;
  idolName: string;
}

export interface WeddingConfig {
  mode: 'SINGLE' | 'COUPLE';
  camera: string;
  style: string;
  location: string;
  aspectRatio: string;
  additionalPrompt: string;
}

export interface SceneConfig {
  prompt: string;
  aspectRatio: string;
}

export interface FeedGeneratorConfig {
  topic: string;
  description: string;
  customImage?: string | null;
  goal: 'HARD_SELL' | 'SHARING' | 'INTERACTION' | 'BRANDING';
  structure: 'AUTO' | 'LISTICLE' | 'PROBLEM_SOLUTION' | 'COMPARISON' | 'TUTORIAL' | 'STATISTICS';
  visualStyle: 'AUTO' | 'MINIMALIST' | 'PLAYFUL' | 'EARTHY' | 'INDONESIAN' | 'PROFESSIONAL';
  dimensions: '9:16' | '16:9' | '3:4' | '4:3' | '1:1';
  primaryColor: string;
  secondaryColor: string;
  typographyPlacement: 'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_CENTER' | 'BOTTOM_RIGHT';
}
export interface Jadi3DConfig {
  style: 'PIXAR' | 'DISNEY' | 'ANIME_3D' | 'REALISTIC_3D' | 'CLAYMATION' | 'TOY_STORY' | 'KIDS_REAL' | 'CUSTOM';
  customStyle?: string;
  intensity: number;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface CyborgConfig {
  category: 'ANAK' | 'PRIA' | 'WANITA';
  preset: string;
  shotType: 'PORTRAIT' | 'FULL_BODY';
  visualEffect: string;
  customInstruction: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface ClaymationConfig {
  category: 'ANAK' | 'PRIA' | 'WANITA' | 'HEWAN' | 'BENDA';
  characterPrompt: string;
  style: string;
  scene: string;
  customInstruction: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface EstetikConfig {
  style: string;
  environment: string;
  decoration: string;
  lighting: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  additionalPrompt: string;
  text?: string;
  textStyle?: string;
}

export interface MockupBajuConfig {
  itemType: 'ATASAN' | 'BAWAHAN' | 'DRESS' | 'SETELAN';
  boutiqueStyle: 'MINIMALIS' | 'MEWAH' | 'MODERN' | 'VINTAGE' | 'INDUSTRIAL' | 'BOHEMIAN' | 'CLASSIC' | 'STREETWEAR';
  handType: 'TANGAN_KIRI' | 'TANGAN_KANAN';
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  brandName: string;
}

export interface CitaCitaConfig {
  dreamJob: string;
  pose: string;
  environment: string;
  gender: 'PRIA' | 'WANITA' | 'ANAK_LAKI' | 'ANAK_PEREMPUAN';
  style: 'FOTOREALISTIK' | 'CINEMATIC' | 'ANIME' | '3D_RENDER';
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  additionalPrompt: string;
  userName: string;
  userJobTitle: string;
  jerseyColor?: string;
  jerseyMotif?: string;
  sleeveType?: 'PENDEK' | 'PANJANG';
}

export interface SepatuConfig {
  target: 'ANAK_LAKI' | 'ANAK_PEREMPUAN' | 'DEWASA_LAKI' | 'DEWASA_PEREMPUAN';
  environment: string;
  additionalPrompt?: string;
  orientation?: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  mode?: 'KATALOG' | 'SHOWROOM' | 'POV';
  logo?: string;
  soleMotif?: string;
  showroomAmbiance?: string;
  showroomColor?: string;
  showroomComposition?: string;
  povPreset?: string;
}
