/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    // Geräte, deren Hauptzeiger ein Finger ist (Tablet, Handy)
    function ({ addVariant }) {
      addVariant('touch', '@media (pointer: coarse)');
    },
  ],
}

