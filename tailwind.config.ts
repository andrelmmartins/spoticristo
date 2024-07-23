import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#f2f2f2',
        black: '#0D0D0B',
        blue: {
          light: '#0F5CBF',
          dark: '#0442BF',
        },
        red: '#D9042B'
      }
    },
  },
  plugins: [],
};
export default config;
