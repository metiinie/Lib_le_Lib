/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Remap slate to Deep Ocean palette
        slate: {
          50: '#EFF4F5',   // Warm White — lightest surface
          100: '#E8EEF0',  // Light surface / borders
          200: '#D6DFE2',  // Borders / dividers
          300: '#7BA3B0',  // Muted Teal — secondary text (light)
          400: '#4A7A8A',  // Deep Muted — placeholder / muted
          500: '#4A7A8A',  // Deep Muted
          600: '#2A6B80',  // Teal Light — secondary interactive
          700: '#1B4D5C',  // Trusted Teal — primary brand
          800: '#162A33',  // Night Teal — card/surface dark
          900: '#0F1E24',  // Deep Ocean — bg dark
          950: '#0A1519',  // Deepest
        },
        // Remap blue to Trusted Teal brand
        blue: {
          50: '#E8F0F3',
          100: '#C5DDE4',
          200: '#8EBCC9',
          300: '#5AA0B1',
          400: '#2A6B80',  // Teal Light
          500: '#1B4D5C',  // Trusted Teal (primary)
          600: '#1B4D5C',  // Trusted Teal
          700: '#163F4B',
          800: '#162A33',  // Night Teal
          900: '#0F1E24',  // Deep Ocean
        },
        // Remap indigo to Warm Gold (premium) / Teal
        indigo: {
          50: '#F5F0E6',
          100: '#EDE3CC',
          200: '#DFC99A',
          300: '#D4B06A',
          400: '#C49A3C',  // Warm Gold (premium)
          500: '#C49A3C',  // Warm Gold
          600: '#1B4D5C',  // Trusted Teal — for CTA buttons currently using indigo-600
          700: '#163F4B',
          800: '#C49A3C',  // Warm Gold — for premium text
          900: '#0F1E24',  // Deep Ocean
        },
        // Accent colours
        terracotta: {
          DEFAULT: '#C4623A',
          light: '#D4784F',
          dark: '#A85230',
        },
        teal: {
          DEFAULT: '#1B4D5C',
          light: '#2A6B80',
          night: '#162A33',
          deep: '#0F1E24',
        },
        // Semantic overrides
        red: {
          50: '#F5E8E8',
          100: '#EACFCF',
          200: '#D9A5A5',
          300: '#C97B7B',
          400: '#B84C4C',  // Muted Crimson
          500: '#B84C4C',  // Muted Crimson
          600: '#B84C4C',  // Muted Crimson (alert)
          700: '#963E3E',
          800: '#743030',
          900: '#522222',
        },
        green: {
          50: '#E8F3EE',
          100: '#CEE6DC',
          200: '#A0D0BC',
          300: '#73B99C',
          400: '#4A9B7F',  // Sage Green
          500: '#4A9B7F',  // Sage Green (verified/success)
          600: '#3D8069',
          700: '#306654',
          800: '#234C3F',
          900: '#16332A',
        },
        amber: {
          50: '#F8F0E3',
          100: '#F0DCBF',
          200: '#E4C48C',
          300: '#D4A85A',
          400: '#D4784F',  // Terracotta Light — used for warning
          500: '#C49A3C',  // Warm Gold
          600: '#C49A3C',
          700: '#A3802F',
          800: '#826624',
          900: '#614D1A',
        },
        orange: {
          400: '#D4784F',  // Terracotta Light
          500: '#C4623A',  // Warm Terracotta
          600: '#C4623A',  // Warm Terracotta
        },
        emerald: {
          50: '#E8F3EE',
          100: '#CEE6DC',
          500: '#4A9B7F',
          600: '#3D8069',
        },
        yellow: {
          400: '#D4784F',  // Remap to Terracotta Light for warning context
          500: '#C49A3C',
          600: '#C49A3C',
        },
      },
    },
  },
  plugins: [],
};
