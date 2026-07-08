/**
 * Lourenço Barbearia — Design System Tokens
 * Baseado na identidade visual: Azul Safira, Branco Alva, Toque Carmim.
 */

export const colors = {
  /** Azul Safira — Headers, botões, ícones ativos */
  primary: '#0D2C68',
  primaryLight: '#1A3F8C',
  primaryDark: '#091E47',

  /** Toque Carmim — Notificações, botões críticos, destaques */
  accent: '#B0121F',
  accentLight: '#D4232F',

  /** Branco Alva — Fundo principal, texto sobre primária */
  background: '#F8F4EF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFDF9',

  /** Texto */
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#F8F4EF',
  textOnAccent: '#FFFFFF',

  /** Bordas e divisores */
  border: '#E5E1DB',
  borderLight: '#F0EDE7',
  divider: '#E8E4DE',

  /** Status */
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  /** Álbum de Memórias */
  albumBg: '#F5F0E8',
  albumPageBg: '#FAF7F2',
  stickerBorder: '#D4C5A9',
  stickerBorderGold: '#C9A84C',
  slotEmpty: 'rgba(13, 44, 104, 0.04)',
  slotBorder: 'rgba(13, 44, 104, 0.12)',

  /** Overlay */
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
} as const;

export const fonts = {
  bold: 'Montserrat_700Bold',
  semibold: 'Montserrat_600SemiBold',
  medium: 'Montserrat_500Medium',
  regular: 'Poppins_400Regular',
  light: 'Poppins_300Light',
} as const;

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

/** Dimensões das figurinhas do álbum (grade 5 colunas × 20 linhas = 100 slots) */
export const stickerDimensions = {
  /** Aspect ratio real de figurinha Panini */
  aspectRatio: 3 / 4,
  /** Largura em mm para impressão */
  printWidthMm: 68,
  /** Altura em mm para impressão */
  printHeightMm: 98,
  /** Colunas por página do álbum */
  columns: 5,
  /** Linhas por página do álbum */
  rows: 20,
  /** Total de slots no álbum */
  perPage: 100,
  /** Gap entre figurinhas */
  gap: 6,
  /** Padding da página */
  pagePadding: 10,
} as const;

export const theme = {
  colors,
  fonts,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
  stickerDimensions,
} as const;

export type Theme = typeof theme;
export default theme;
