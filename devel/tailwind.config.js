export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,html}",
    "!./src/**/stores/**",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        'dnd-gold': '#D4AF37',
        'dnd-red': '#8B1538',
        'dnd-dark': '#1a1a1a'
      },
      fontFamily: {
        'cinzel': ['Cinzel', 'serif'],
        'inter': ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
}