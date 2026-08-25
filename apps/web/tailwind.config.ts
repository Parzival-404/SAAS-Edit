import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f0ff",
          100: "#e6e1ff",
          400: "#8b7bff",
          500: "#6c4fff",
          600: "#5636ef",
          700: "#4527c2",
        },
      },
    },
  },
  plugins: [],
};

export default config;
