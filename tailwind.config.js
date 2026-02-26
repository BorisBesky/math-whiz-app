/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{js,jsx,ts,tsx}",
];
export const theme = {
  extend: {
    colors: {
      // Brand palette — playful, warm, kid-friendly
      brand: {
        blue: '#3a7bd5',
        coral: '#f56565',
        mint: '#48d1a5',
        sunny: '#f6c844',
        purple: '#8b5cf6',
        pink: '#ec4899',
        sky: '#38bdf8',
        orange: '#fb923c',
      },
      // Per-topic accent colors for topic cards
      topic: {
        multiplication: '#3a7bd5',
        division: '#8b5cf6',
        fractions: '#f56565',
        geometry: '#48d1a5',
        measurement: '#f6c844',
        decimals: '#ec4899',
        patterns: '#fb923c',
        'data-graphs': '#38bdf8',
      },
    },
    fontFamily: {
      display: ['"Baloo 2"', 'Fredoka', 'Comic Sans MS', 'cursive'],
      body: ['"Nunito"', '"Segoe UI"', 'system-ui', 'sans-serif'],
    },
    borderRadius: {
      'card': '1rem',
      'button': '0.75rem',
    },
    boxShadow: {
      'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
      'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      'glow-blue': '0 0 20px rgba(58, 123, 213, 0.25)',
      'glow-green': '0 0 20px rgba(72, 209, 165, 0.3)',
      'glow-coral': '0 0 20px rgba(245, 101, 101, 0.25)',
      'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    },
    keyframes: {
      'bounce-in': {
        '0%': { transform: 'scale(0.3)', opacity: '0' },
        '50%': { transform: 'scale(1.08)' },
        '70%': { transform: 'scale(0.95)' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      'slide-up': {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      'celebrate': {
        '0%': { transform: 'scale(1)' },
        '15%': { transform: 'scale(1.15) rotate(-3deg)' },
        '30%': { transform: 'scale(1.15) rotate(3deg)' },
        '45%': { transform: 'scale(1)' },
      },
      'pulse-soft': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.7' },
      },
      'shake': {
        '0%, 100%': { transform: 'translateX(0)' },
        '20%': { transform: 'translateX(-6px)' },
        '40%': { transform: 'translateX(6px)' },
        '60%': { transform: 'translateX(-4px)' },
        '80%': { transform: 'translateX(4px)' },
      },
      'fade-in': {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      'progress-fill': {
        '0%': { transform: 'scaleX(0)' },
        '100%': { transform: 'scaleX(1)' },
      },
    },
    animation: {
      'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      'slide-up': 'slide-up 0.4s ease-out',
      'celebrate': 'celebrate 0.6s ease-in-out',
      'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      'shake': 'shake 0.5s ease-in-out',
      'fade-in': 'fade-in 0.3s ease-out',
      'progress-fill': 'progress-fill 0.6s ease-out',
    },
  },
};
export const plugins = [];
