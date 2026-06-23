/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      colors: {
        warm: {
          50: '#FAF9F6',
          100: '#F5F0EB',
          200: '#EBE3D9',
          300: '#D9CDC0',
          400: '#C4B4A5',
          500: '#A89888',
          600: '#8C7B6B',
          700: '#736557',
          800: '#5C5046',
          900: '#3D3530',
        },
        clay: {
          400: '#D4855E',
          500: '#C4784C',
          600: '#A8653E',
        },
        sage: {
          400: '#8CB8A8',
          500: '#7C9A92',
          600: '#5F8278',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        'elevated': '0 8px 30px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)',
      },
    },
  },
  plugins: [],
}