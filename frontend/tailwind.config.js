/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dff0ff',
          200: '#b8e3ff',
          300: '#79ceff',
          400: '#32b5fb',
          500: '#0798e7',
          600: '#0078c5',
          700: '#05629f',
          800: '#0a527f',
          900: '#0e4569',
        },
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 82, 127, 0.10)',
        glass: '0 20px 60px rgba(7, 120, 197, 0.16)',
      },
      borderRadius: {
        app: '1rem',
      },
    },
  },
  plugins: [],
}
