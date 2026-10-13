// Configuración de Plataformas de Streaming soportadas
export const PLATFORMS = {
  Netflix: {
    id: 'Netflix',
    name: 'Netflix',
    color: '#E50914',
    bgGradient: 'linear-gradient(135deg, rgba(229, 9, 20, 0.25) 0%, rgba(20, 20, 20, 0.8) 100%)',
    borderColor: '#E50914',
    badgeBg: 'rgba(229, 9, 20, 0.15)',
    textColor: '#ff4d4d',
    defaultProfiles: 5,
    tagline: 'Películas y Series 4K UHD'
  },
  'Disney+': {
    id: 'Disney+',
    name: 'Disney+',
    color: '#00d2d3',
    bgGradient: 'linear-gradient(135deg, rgba(17, 60, 207, 0.3) 0%, rgba(10, 15, 35, 0.9) 100%)',
    borderColor: '#113ccf',
    badgeBg: 'rgba(0, 210, 211, 0.15)',
    textColor: '#00d2d3',
    defaultProfiles: 4,
    tagline: 'Disney, Pixar, Marvel y Star'
  },
  'HBO Max': {
    id: 'HBO Max',
    name: 'HBO Max',
    color: '#002be7',
    bgGradient: 'linear-gradient(135deg, rgba(0, 43, 231, 0.3) 0%, rgba(15, 10, 40, 0.9) 100%)',
    borderColor: '#5b7fff',
    badgeBg: 'rgba(91, 127, 255, 0.15)',
    textColor: '#8aa8ff',
    defaultProfiles: 5,
    tagline: 'HBO, Warner Bros y DC'
  },
  'Prime Video': {
    id: 'Prime Video',
    name: 'Prime Video',
    color: '#00A8E1',
    bgGradient: 'linear-gradient(135deg, rgba(0, 168, 225, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)',
    borderColor: '#00A8E1',
    badgeBg: 'rgba(0, 168, 225, 0.15)',
    textColor: '#38bdf8',
    defaultProfiles: 6,
    tagline: 'Amazon Originals y Películas'
  },
  Spotify: {
    id: 'Spotify',
    name: 'Spotify Familiar',
    color: '#1DB954',
    bgGradient: 'linear-gradient(135deg, rgba(29, 185, 84, 0.25) 0%, rgba(10, 30, 20, 0.9) 100%)',
    borderColor: '#1DB954',
    badgeBg: 'rgba(29, 185, 84, 0.15)',
    textColor: '#4ade80',
    defaultProfiles: 6,
    tagline: 'Música y Podcasts Premium'
  },
  'Paramount+': {
    id: 'Paramount+',
    name: 'Paramount+',
    color: '#0064FF',
    bgGradient: 'linear-gradient(135deg, rgba(0, 100, 255, 0.25) 0%, rgba(10, 20, 45, 0.9) 100%)',
    borderColor: '#0064FF',
    badgeBg: 'rgba(0, 100, 255, 0.15)',
    textColor: '#60a5fa',
    defaultProfiles: 6,
    tagline: 'Montañas de Entretenimiento'
  },
  Crunchyroll: {
    id: 'Crunchyroll',
    name: 'Crunchyroll',
    color: '#F47521',
    bgGradient: 'linear-gradient(135deg, rgba(244, 117, 33, 0.25) 0%, rgba(30, 15, 10, 0.9) 100%)',
    borderColor: '#F47521',
    badgeBg: 'rgba(244, 117, 33, 0.15)',
    textColor: '#fb923c',
    defaultProfiles: 4,
    tagline: 'Anime y Manga Mega Fan'
  },
  'Apple TV+': {
    id: 'Apple TV+',
    name: 'Apple TV+',
    color: '#a1a1aa',
    bgGradient: 'linear-gradient(135deg, rgba(160, 160, 160, 0.2) 0%, rgba(20, 20, 25, 0.9) 100%)',
    borderColor: '#71717a',
    badgeBg: 'rgba(161, 161, 170, 0.15)',
    textColor: '#e4e4e7',
    defaultProfiles: 6,
    tagline: 'Series y Películas Originales'
  },
  'YouTube Premium': {
    id: 'YouTube Premium',
    name: 'YouTube Premium',
    color: '#FF0000',
    bgGradient: 'linear-gradient(135deg, rgba(255, 0, 0, 0.25) 0%, rgba(30, 10, 10, 0.9) 100%)',
    borderColor: '#FF0000',
    badgeBg: 'rgba(255, 0, 0, 0.15)',
    textColor: '#f87171',
    defaultProfiles: 5,
    tagline: 'Sin Anuncios y YouTube Music'
  },
  Otro: {
    id: 'Otro',
    name: 'Otra Plataforma',
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(25, 15, 40, 0.9) 100%)',
    borderColor: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
    textColor: '#a78bfa',
    defaultProfiles: 5,
    tagline: 'Servicio Personalizado'
  }
};

// Lista canónica de plataformas sin duplicados
export const PLATFORMS_LIST = Object.values(PLATFORMS);

// Helper para obtener datos de una plataforma soportando alias antiguos
export function getPlatformInfo(nombre) {
  if (!nombre) return PLATFORMS.Otro;
  if (nombre === 'Max' || nombre === 'Hbo Max') return PLATFORMS['HBO Max'];
  return PLATFORMS[nombre] || PLATFORMS.Otro;
}

// Códigos telefónicos de países de Latinoamérica y más comunes
export const COUNTRY_CODES = [
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+504', country: 'Honduras', flag: '🇭🇳' },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+507', country: 'Panamá', flag: '🇵🇦' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+1', country: 'Estados Unidos / PR', flag: '🇺🇸' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
];
