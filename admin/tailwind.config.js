/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1120',
          950: '#070C18',
        },
        charcoal: {
          800: '#1E293B',
          900: '#0F172A',
        },
        purple: {
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          950: '#2E1065',
        }
      }
    },
  },
  plugins: [],
}
