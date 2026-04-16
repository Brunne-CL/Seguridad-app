import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Paleta UTEQ / App Seguridad
 * - Azul oscuro profundo: #003366
 * - Azul medio (UTEQ): #00517A
 * - Verde-agua claro: #00B3B3
 * - Gris humo: #666666
 * - Blanco cremoso: #F5F5F5
 * - Naranja-Amarillento: #EDA200
 * - Negro: #000000
 * - Blanco: #FFFFFF
 */
const UteqPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#E6EEF2',
      100: '#CCDDE5',
      200: '#99BBCB',
      300: '#6699B1',
      400: '#337797',
      500: '#00517A', // Azul UTEQ
      600: '#004166',
      700: '#003366', // Azul oscuro profundo
      800: '#00264D',
      900: '#001A33',
      950: '#000D1A',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FFFFFF',
          50: '#F5F5F5',  // Blanco cremoso
          100: '#EBEBEB',
          200: '#D6D6D6',
          300: '#B3B3B3',
          400: '#8C8C8C',
          500: '#666666',  // Gris humo
          600: '#4D4D4D',
          700: '#333333',
          800: '#1A1A1A',
          900: '#000000',  // Negro
          950: '#000000',
        },
        primary: {
          color: '#00517A',
          contrastColor: '#FFFFFF',
          hoverColor: '#004166',
          activeColor: '#003366',
        },
        highlight: {
          background: '#E6F7F7',
          focusBackground: '#CCF0F0',
          color: '#006B6B',
          focusColor: '#00B3B3', // Verde-agua
        },
        text: {
          color: '#000000',
          hoverColor: '#003366',
          mutedColor: '#666666',
          hoverMutedColor: '#00517A',
        },
      },
    },
  },
});

export default UteqPreset;
