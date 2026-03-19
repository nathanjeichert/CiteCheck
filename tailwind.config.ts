import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        warm: {
          bg: "#faf8f5",
          white: "#ffffff",
          subtle: "#f5f0eb",
          border: "#e8e0d8",
          "border-hover": "#d4c9be",
          text: "#1a1612",
          body: "#44403c",
          muted: "#78716c",
          dim: "#a8a29e",
          accent: "#1e3a5f",
          "accent-light": "#2d5a8e",
          green: "#166534",
          "green-bg": "#f0fdf4",
          red: "#991b1b",
          "red-bg": "#fef2f2",
          yellow: "#92400e",
          "yellow-bg": "#fffbeb",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
