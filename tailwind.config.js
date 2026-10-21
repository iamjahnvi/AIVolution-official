/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#FF3B00", // Electric Orange
        dark: "#09090b", // Absolute Dark
        surface: "#18181b", // Elevated Dark
        muted: "#A1A1AA", // Zinc
        gridline: "#27272a", // Subtle dark grey for grid
        // "Lab notebook" palette (homepage)
        paper: "#f3eee2",
        cream: "#faf6ea",
        ink: "#141414",
        pencil: "#6b6860",
        marker: "#ff5a1f",
        highlight: "#ffe85c",
        pen: "#2f6bff",
        redpen: "#e5342b",
        mint: "#3ae88a",
        pink: "#ff8fb1",
        screen: "#0c0f0e",
        // Dark theme palette
        "bg-page": "#0d0d0d",
        "bg-surface": "#141415",
        "bg-elevated": "#1a1a1e",
        "bg-nav": "#121212",
        "fg-primary": "#f0f0f0",
        "fg-secondary": "#a0a0a0",
        "fg-muted": "#6b6b70",
        "border": "#2a2a2e",
    },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
        bricolage: ['"Bricolage Grotesque"', 'Syne', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
       backgroundImage: {
         'banner-gradient': 'linear-gradient(to right, rgba(9,9,11,0.9), rgba(9,9,11,0.3))',
       },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}
