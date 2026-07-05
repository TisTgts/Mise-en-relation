/** @type {import('tailwindcss').Config} */
/** Palette ambre/or — différencie toghinis.com du bleu toghinis.net */
const brandAmber = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
};

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: brandAmber[50],
          500: brandAmber[500],
          600: brandAmber[600],
          700: brandAmber[700],
        },
        secondary: {
          50: '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        // Remappe indigo/blue vers la palette ambre (évite 50+ fichiers)
        indigo: brandAmber,
        blue: {
          500: brandAmber[500],
          600: brandAmber[600],
          700: brandAmber[700],
        },
      }
    },
  },
  plugins: [],
}
