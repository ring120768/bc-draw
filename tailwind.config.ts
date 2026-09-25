import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        club: {
          green: "#1a5632",
          greenDark: "#12401f",
          cream: "#faf6ee",
          gold: "#c9a227",
        },
      },
    },
  },
  plugins: [],
};

export default config;
