import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {
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
    },
  },

  plugins: [],
  darkMode: 'class', // Enable class-based dark mode
} as Config;
