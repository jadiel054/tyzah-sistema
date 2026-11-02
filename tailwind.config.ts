import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: "#C0272D", bright: "#E8333A", dark: "#8B1A1F" },
        gold: { DEFAULT: "#C9A84C", light: "#E8C96A" },
        ink: { DEFAULT: "#0A0A0A", 2: "#111111", 3: "#1A1A1A", 4: "#222222" },
        cream: "#F5F0EB",
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-dm)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
