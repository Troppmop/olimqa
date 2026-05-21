/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef3e2',
          100: '#fde3b8',
          200: '#fcc47a',
          300: '#faa83c',
          400: '#f8930f',
          500: '#e07b0a',
          600: '#b86208',
          700: '#8f4c06',
          800: '#663705',
          900: '#3d2203',
        },
      },
    },
  },
  plugins: [],
}
