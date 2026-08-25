import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#EEF3EE",
          100: "#DCE7DD",
          200: "#B9CFBC",
          300: "#8FAE95",
          400: "#5F8468",
          500: "#456A50",
          600: "#345441",
          700: "#294435",
          800: "#20362A",
          900: "#1A2B22",
          950: "#131F19",
        },
        cream: {
          50: "#FBFAF5",
          100: "#F5F2E9",
          200: "#EDE8DA",
          300: "#E0D9C5",
          400: "#CCC2A6",
          500: "#B3A683",
        },
        gold: {
          300: "#DCC9A2",
          400: "#CBB185",
          500: "#B6996A",
          600: "#997C4E",
        },
        success: "#3E8E5A",
        info: "#5B84B1",
        danger: "#C25450",
      },
      fontFamily: {
        display: ["'Noto Serif KR'", "Georgia", "serif"],
        sans: [
          "Pretendard",
          "'Noto Sans KR'",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(19,31,25,0.05), 0 4px 16px rgba(19,31,25,0.06)",
        "card-hover":
          "0 2px 4px rgba(19,31,25,0.07), 0 10px 28px rgba(19,31,25,0.12)",
        glow: "0 0 0 1px rgba(220,201,162,0.25), 0 4px 20px rgba(19,31,25,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "check-pop": {
          "0%": { transform: "scale(0.6)" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease both",
        "scale-in": "scale-in 0.25s ease both",
        "check-pop": "check-pop 0.3s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
