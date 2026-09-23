/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-main": "#0B0B0F",
        "bg-sidebar": "#13131A",
        "accent-primary": "#6366F1",
        "accent-secondary": "#8B5CF6",
        "content-primary": "#F3F4F6",
        "content-secondary": "#9CA3AF",
        // Aliases to support both naming conventions used across files
        "text-primary": "#F3F4F6",
        "text-secondary": "#9CA3AF",
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
