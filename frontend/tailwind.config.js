/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        tub: {
          red: '#E63329',
          orange: '#F47920',
          dark: '#1A1A1A',
        }
      }
    },
  },
  plugins: [],
}
