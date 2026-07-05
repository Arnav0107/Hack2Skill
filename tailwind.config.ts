import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#F7F4ED",
        "ivory-dark": "#EDE9DF",
        forest: "#1B3A2F",
        "forest-light": "#2A5445",
        gold: "#C9A66B",
        "gold-light": "#DFC49A",
        "gold-dark": "#A8854A",
        charcoal: "#3A342C",
        "charcoal-light": "#6B6259",
        "charcoal-muted": "#9B9188",
        // Score bands
        "score-poor": "#8B3A3A",
        "score-poor-bg": "#F5EAEA",
        "score-fair": "#8B6914",
        "score-fair-bg": "#F7F0E0",
        "score-good": "#3E6B45",
        "score-good-bg": "#EAF1EA",
        "score-excel": "#1B3A2F",
        "score-excel-bg": "#E5EDE9",
        // Fraud / alert
        "fraud-red": "#8B3A3A",
        "fraud-bg": "#FBF0F0",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        eyebrow: "0.12em",
        wide: "0.06em",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "5px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(58, 52, 44, 0.06), 0 1px 3px rgba(58, 52, 44, 0.04)",
        "card-hover": "0 6px 20px rgba(58, 52, 44, 0.10), 0 2px 6px rgba(58, 52, 44, 0.06)",
        drawer: "-8px 0 32px rgba(58, 52, 44, 0.12)",
      },
      animation: {
        "fade-up": "fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-left": "slideInLeft 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      transitionTimingFunction: {
        "soft-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
