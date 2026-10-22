/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Futuristic Dark Blue / Neon Cyberpunk theme
        primary: {
          50: '#e6f7ff',
          100: '#b3e0ff',
          200: '#80c9ff',
          300: '#4db2ff',
          400: '#1a9bff',
          500: '#0084e6', // Primary Blue
          600: '#006db3',
          700: '#005680',
          800: '#003f4d',
          900: '#002833',
        },
        secondary: {
          50: '#f0f4ff',
          100: '#d9e4ff',
          200: '#b3c9ff',
          300: '#8cafff',
          400: '#6694ff',
          500: '#407aff', // Neon Blue
          600: '#1a60ff',
          700: '#0046e6',
          800: '#0034b3',
          900: '#002280',
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Cyan
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          bg: '#0a0a1a',
          surface: '#121230',
          card: '#1a1a3a',
          border: '#2a2a4a',
        },
        neon: {
          cyan: '#00ffff',
          purple: '#9d00ff',
          pink: '#ff00ff',
          green: '#00ff9d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        display: ['Inter', 'system-ui'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'glass-shimmer': 'glass-shimmer 2s ease-in-out infinite',
        'neon-glow': 'neon-glow 1.5s ease-in-out infinite',
        'typing': 'typing 1.5s steps(40) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 20px rgba(0, 132, 230, 0.5)' },
          '50%': { opacity: 0.8, boxShadow: '0 0 40px rgba(0, 132, 230, 0.8)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'glass-shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'neon-glow': {
          '0%, 100%': { textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff' },
          '50%': { textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff' },
        },
        'typing': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'gradient-futuristic': 'linear-gradient(135deg, #0a0a1a 0%, #121230 50%, #1a1a3a 100%)',
        'gradient-neon': 'linear-gradient(90deg, #00ffff 0%, #9d00ff 50%, #ff00ff 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}