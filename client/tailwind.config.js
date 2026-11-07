/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          'navy-light': '#1E293B',
          blue: '#1E3A8A',
          teal: '#0D9488',
          'teal-light': '#14B8A6',
          emerald: '#10B981',
          accent: '#0284C7',
          surface: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}
