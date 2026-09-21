import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kyra: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc7fc",
          400: "#36aaf7",
          500: "#0c8ee9",
          600: "#016fc7",
          700: "#0258a1",
          800: "#064b85",
          900: "#0b3f6f",
          950: "#07284b",
        },
        brand: {
          navy: "#0a192f",
          dark: "#0b132b",
          gold: "#c59b27",
          goldLight: "#e5be58",
          emerald: "#064e3b",
          slate: "#1e293b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
