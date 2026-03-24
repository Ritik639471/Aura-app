/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          accent: 'var(--primary-accent)',
          glow: 'var(--primary-glow)',
        },
        secondary: {
          accent: 'var(--secondary-accent)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
      backgroundImage: {
        'glass-gradient': 'var(--glass-bg)',
      },
      borderWidth: {
        'glass': '1px',
      },
      borderColor: {
        'glass': 'var(--glass-border)',
      },
      keyframes: {
        'shiny-text': {
          '0%': { 'background-position': '200% 0' },
          '100%': { 'background-position': '-200% 0' },
        },
      },
      animation: {
        'shiny-text': 'shiny-text 5s linear infinite',
      },
    },
  },
  plugins: [],
}
