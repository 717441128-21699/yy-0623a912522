/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        roseGold: '#B76E79',
        darkBg: '#1A1A2E',
        softPink: '#F5E6E0',
        emerald: '#2ECC71',
        amber: '#F39C12',
        coral: '#E74C3C',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
