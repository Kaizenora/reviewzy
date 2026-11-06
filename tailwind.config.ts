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
        cream: {
          50: "#FCFAF6",
          100: "#FAF7F2",
          200: "#F3EDE2",
          300: "#E9DFD0",
          400: "#D8CBB6",
        },
        terracotta: {
          500: "#E36427",
          600: "#D4561B",
          700: "#B84512",
        },
        charcoal: {
          900: "#181715",
          800: "#24221F",
          700: "#36332E",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        button: "0 4px 14px rgba(227, 100, 39, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
