import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Primary teal color with various shades
        primary: {
          DEFAULT: '#20C3AF',
          50: '#E4F8F5',
          100: '#C9F1EB',
          200: '#94E3D7',
          300: '#5FD4C3',
          400: '#2AC5B0',
          500: '#20C3AF', // Brand primary color
          600: '#1B9E8E',
          700: '#15776D',
          800: '#10514B',
          900: '#0A2A28',
          950: '#051716',
        },
        // Secondary orange color with various shades
        secondary: {
          DEFAULT: '#C2511F',
          50: '#FCE9DF',
          100: '#F9D3BF',
          200: '#F2A77F',
          300: '#EB7B40',
          400: '#D45F24',
          500: '#C2511F', // Brand secondary color
          600: '#9D4319',
          700: '#783413',
          800: '#52240D',
          900: '#2C1306',
          950: '#190B04',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover':
          '0 12px 24px -6px rgb(0 0 0 / 0.10), 0 4px 8px -4px rgb(0 0 0 / 0.05)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
      },
    },
  },

  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class', // Enable class-based dark mode
} as Config;
