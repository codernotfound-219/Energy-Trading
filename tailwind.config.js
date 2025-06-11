/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'energy-green': '#10B981',
        'energy-blue': '#3B82F6',
        'energy-dark': '#1F2937',
      }
    },
  },
  plugins: [],
}
