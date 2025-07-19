/** @type {import('tailwindcss').Config} */
const colors = require('./src/config/config').default.THEME_COLORS; // Import theme colors

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Extend Tailwind's default color palette with your theme colors
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        danger: colors.danger,
        info: colors.info,
        // You can also define custom shades if needed
        // 'custom-green': {
        //   500: '#10B981',
        //   600: '#059669',
        // },
      },
    },
  },
  plugins: [],
}