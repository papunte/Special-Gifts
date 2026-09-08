/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        frozen: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#4a90e2',
          500: '#1d6cd3',
          600: '#0f52b0',
          700: '#0e418e',
          800: '#103875',
          900: '#133062',
        },
        ice: {
          cyan: '#a5f3fc',
          glow: 'rgba(165, 243, 252, 0.4)',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'snow': 'snow 10s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        snow: {
          '0%': { transform: 'translateY(-10vh) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(110vh) translateX(50px)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
