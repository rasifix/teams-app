/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF1E6',
          100: '#FFD8B8',
          200: '#FFB77D',
          300: '#FFA55C',
          400: '#FF8C2E',
          500: '#FF8C2E', // Default orange
          600: '#D15E00',
          700: '#A34900',
          800: '#753500',
          900: '#472000',
          950: '#1A0B00',
        },
      },
    },
  },
  plugins: [],
}