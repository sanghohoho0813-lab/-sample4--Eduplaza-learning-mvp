import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // 기본 스케일 대비 약 1.5배 확대된 타이포그래피 (요청사항: 전반적으로 글씨 1.5배↑)
    fontSize: {
      xs: ["1.05rem", { lineHeight: "1.55rem" }], // 16.8px
      sm: ["1.2rem", { lineHeight: "1.8rem" }], // 19.2px
      base: ["1.4rem", { lineHeight: "2.1rem" }], // 22.4px
      lg: ["1.6rem", { lineHeight: "2.25rem" }], // 25.6px
      xl: ["1.8rem", { lineHeight: "2.45rem" }], // 28.8px
      "2xl": ["2.1rem", { lineHeight: "2.75rem" }], // 33.6px
      "3xl": ["2.6rem", { lineHeight: "3.25rem" }], // 41.6px
      "4xl": ["3.2rem", { lineHeight: "3.8rem" }], // 51.2px
      "5xl": ["4.4rem", { lineHeight: "1.1" }], // 70.4px
      "6xl": ["5.6rem", { lineHeight: "1.1" }], // 89.6px
    },
    extend: {
      // 보조 텍스트 전용 불투명도 — 흰색·크림 배경 모두에서 WCAG AA(4.5:1)를 넘기는 최소값
      opacity: { 68: "0.68", 72: "0.72" },
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
        // 포레스트 그린과 어울리는 보조 색상 3종.
        // teal은 미래에이아이랩 로고의 시안 계열과 연결되고,
        // amber/clay는 그린의 보색 쪽에서 따뜻한 대비를 만든다.
        teal: {
          50: "#ECF6F7",
          100: "#D5EBEE",
          200: "#A9D7DE",
          300: "#6FB9C5",
          400: "#3E97A8",
          500: "#2A7C8C",
          600: "#1F6372",
          700: "#1A4E5B",
        },
        amber: {
          50: "#FDF6EA",
          100: "#F9EACD",
          200: "#F0D39B",
          300: "#E3B765",
          400: "#D19B3C",
          500: "#B57F27",
          600: "#8F631D",
        },
        clay: {
          50: "#FBF0EC",
          100: "#F5DED6",
          200: "#E8BCAD",
          300: "#D5947F",
          400: "#BE7159",
          500: "#A25742",
          600: "#7F4433",
        },
        success: "#2E7047",
        info: "#2A7C8C",
        danger: "#B4413D",
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
        // CTA 버튼 위를 천천히 지나가는 빛. 전체 5초 중 약 1.5초만 움직이고 나머지는 정지.
        "cta-sweep": {
          "0%": { transform: "translateX(0) skewX(-12deg)" },
          "30%": { transform: "translateX(420%) skewX(-12deg)" },
          "100%": { transform: "translateX(420%) skewX(-12deg)" },
        },
        // 배지 위를 아주 옅게 스치는 빛
        "badge-shimmer": {
          "0%": { transform: "translateX(0) skewX(-12deg)" },
          "35%": { transform: "translateX(420%) skewX(-12deg)" },
          "100%": { transform: "translateX(420%) skewX(-12deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease both",
        "scale-in": "scale-in 0.25s ease both",
        "check-pop": "check-pop 0.3s ease both",
        "cta-sweep": "cta-sweep 5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "badge-shimmer": "badge-shimmer 6s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
