import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f5f1",
          100: "#ebe7dc",
          200: "#d3cab2",
          300: "#b6a781",
          400: "#998760",
          500: "#7d6c49",
          600: "#5f523a",
          700: "#443b2c",
          800: "#2a251c",
          900: "#16130e",
          950: "#0b0a07",
        },
        brand: {
          DEFAULT: "#c89b3c",
          50: "#fbf6e6",
          100: "#f6ecc0",
          200: "#ecd57e",
          300: "#dfba47",
          400: "#d2a428",
          500: "#c89b3c",
          600: "#a37a23",
          700: "#7d5a1c",
          800: "#553e15",
          900: "#33270f",
        },
      },
      fontFamily: {
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        display: ["ui-serif", "Georgia", "serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
