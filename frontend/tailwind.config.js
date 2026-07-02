/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        surface: {
          50:  "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB", // Borders
          300: "#D1D5DB",
        },
      },
      boxShadow: {
        soft:    "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.06)",
        card:    "0 2px 8px rgba(16,185,129,0.06), 0 8px 32px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 24px rgba(16,185,129,0.12), 0 12px 36px rgba(0,0,0,0.06)",
        glow:    "0 0 20px rgba(16,185,129,0.15)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%":   { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%":   { opacity: 0, transform: "translateX(-12px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        pulse_ring: {
          "0%":   { transform: "scale(1)",   opacity: 0.6 },
          "100%": { transform: "scale(1.5)", opacity: 0 },
        },
      },
      animation: {
        shimmer:    "shimmer 1.8s infinite linear",
        "fade-up":  "fade-up 0.5s ease-out both",
        "slide-in": "slide-in 0.4s ease-out both",
        pulse_ring: "pulse_ring 1.5s ease-out infinite",
      },
    },
  },
  plugins: [],
};
