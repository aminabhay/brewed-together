/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso: '#3B2418',
        mocha: '#6F4E37',
        latte: '#F3E5D0',
        foam: '#FFF8EE',
        amber: '#FFB347',
        sage: '#8A9A7B',
        rose: '#D98A8A',
        slate: '#2B2B28',
      },
      fontFamily: {
        hand: ['Caveat', 'cursive'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
