/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          100: 'var(--color-slate-100)',
          200: 'var(--color-slate-200)',
          300: 'var(--color-slate-300)',
          400: 'var(--color-slate-400)',
          500: 'var(--color-slate-500)',
          600: 'var(--color-slate-600)',
          700: 'var(--color-slate-700)',
          800: 'var(--color-slate-800)',
          900: 'var(--color-slate-900)',
          950: 'var(--color-slate-950)',
        },
        indigo: {
          300: 'var(--color-indigo-300)',
          400: 'var(--color-indigo-400)',
          500: 'var(--color-indigo-500)',
          600: 'var(--color-indigo-600)',
          900: 'var(--color-indigo-900)',
          950: 'var(--color-indigo-950)',
        },
        violet: {
          500: 'var(--color-violet-500)',
          600: 'var(--color-violet-600)',
        },
        purple: {
          400: 'var(--color-purple-400)',
          500: 'var(--color-purple-500)',
          600: 'var(--color-purple-600)',
        },
        rose: {
          400: 'var(--color-rose-400)',
          500: 'var(--color-rose-500)',
          600: 'var(--color-rose-600)',
          950: 'var(--color-rose-950)',
        },
        emerald: {
          200: 'var(--color-emerald-200)',
          400: 'var(--color-emerald-400)',
          500: 'var(--color-emerald-500)',
          600: 'var(--color-emerald-600)',
          900: 'var(--color-emerald-900)',
          950: 'var(--color-emerald-950)',
        },
        amber: {
          400: 'var(--color-amber-400)',
          500: 'var(--color-amber-500)',
          600: 'var(--color-amber-600)',
          950: 'var(--color-amber-950)',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: 'var(--color-indigo-500)',
          600: 'var(--color-indigo-600)',
          700: 'var(--color-indigo-600)',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
