/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cosmos: {
          900: "#0a0015",
          800: "#100025",
          700: "#1a0035",
          600: "#2d0060",
          400: "#7c3aed",
          300: "#a78bfa",
          200: "#ddd6fe",
        },
      },
    },
  },
  plugins: [],
};
