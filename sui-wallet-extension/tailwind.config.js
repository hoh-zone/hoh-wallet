/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hoh-bg': 'var(--bg-primary)',
        'hoh-card': 'var(--bg-card)',
        'hoh-text': 'var(--text-primary)',
        'hoh-text-secondary': 'var(--text-secondary)',
        'hoh-green': 'var(--accent)', // HOH green
        'hoh-hover': 'var(--bg-secondary)',
        'hoh-border': 'var(--border)',
        'hoh-border-hover': 'var(--border-hover)',
        'hoh-success': 'var(--success)',
        'hoh-danger': 'var(--danger)',
      }
    },
  },
  plugins: [],
}
