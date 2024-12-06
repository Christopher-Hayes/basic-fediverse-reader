import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--background)",
          darker: "var(--background-darker)",
          lighter: "var(--background-lighter)",
        },
        fg: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-muted)",
        },
        highlight: {
          DEFAULT: "var(--highlight)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
