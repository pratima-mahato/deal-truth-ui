/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f3efe8",
        },
        surface: {
          DEFAULT: "#fffcf8",
        },
        ink: {
          50: "#f6f4f8",
          100: "#ebe7f0",
          400: "#8b8499",
          500: "#5c5668",
          700: "#3a3548",
          800: "#241f33",
          900: "#16131f",
        },
        violet: {
          50: "#f4f1ff",
          100: "#eae3ff",
          200: "#d4c8ff",
          400: "#8b78f2",
          500: "#6d5efc",
          600: "#5c4dff",
          700: "#4a3ad6",
          900: "#2c2470",
        },
        navy: {
          50: "#f6f4f8",
          100: "#ebe7f0",
          200: "#d8d2e0",
          700: "#3a3548",
          800: "#241f33",
          900: "#16131f",
          950: "#0e0c14",
        },
        evidence: {
          supported: "#0f766e",
          uncertain: "#b45309",
          blocker: "#b91c1c",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22, 19, 31, 0.04), 0 8px 24px rgba(22, 19, 31, 0.04)",
        lift: "0 10px 30px rgba(22, 19, 31, 0.08)",
        drawer: "-12px 0 40px rgba(22, 19, 31, 0.12)",
      },
      keyframes: {
        "bar-pulse": {
          "0%, 100%": { transform: "scaleY(0.35)", opacity: "0.55" },
          "50%": { transform: "scaleY(1)", opacity: "1" },
        },
        "soft-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "drawer-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "backdrop-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "bar-pulse": "bar-pulse 1.1s ease-in-out infinite",
        "soft-in": "soft-in 0.35s ease-out",
        "drawer-in": "drawer-in 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        "backdrop-in": "backdrop-in 0.2s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
