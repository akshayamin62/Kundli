/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        astrogyan: {
          boy: "#0346b0",
          "boy-dark": "#023894",
          girl: "#fd65c6",
          "girl-dark": "#e84db0",
        },
      },
    },
  },
  plugins: [],
};
