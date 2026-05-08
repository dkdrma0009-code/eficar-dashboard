/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1D9E75',
          50: '#E8F7F2',
          100: '#C5EBD9',
          200: '#8DD6B8',
          300: '#55C197',
          400: '#2BAE81',
          500: '#1D9E75',
          600: '#17805E',
          700: '#116247',
          800: '#0B4330',
          900: '#052518',
        },
      },
    },
  },
  plugins: [],
};
