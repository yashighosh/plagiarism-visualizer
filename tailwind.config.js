/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#15151e',
        primary: '#6366f1',
        primaryDark: '#4f46e5',
        matchHighlight: 'rgba(234, 179, 8, 0.4)',
        matchText: '#fef08a',
        spuriousHighlight: 'rgba(239, 68, 68, 0.2)',
        spuriousText: '#fca5a5'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
