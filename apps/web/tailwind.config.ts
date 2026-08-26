import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#7cb9f9",
          400: "#3f97f6",
          500: "#0077ed",
          600: "#0071e3",
          700: "#0059b2",
          900: "#00397a",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px -12px rgba(0, 0, 0, 0.12)",
        "soft-lg": "0 4px 12px rgba(0, 0, 0, 0.05), 0 24px 48px -16px rgba(0, 0, 0, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
