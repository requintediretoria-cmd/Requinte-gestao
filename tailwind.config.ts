import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf8f0",
          100: "#faefd9",
          200: "#f4dca8",
          300: "#edc36e",
          400: "#e5a43c",
          500: "#d4882a",
          600: "#b86e20",
          700: "#95541c",
          800: "#7a451e",
          900: "#653a1c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
