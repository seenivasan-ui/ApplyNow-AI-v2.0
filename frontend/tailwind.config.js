/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        neon: "#00ff87",
        acid: "#c8ff00",
        plasma: "#ff2d78",
        void: "#060612",
        deep: "#0d0d1a",
        card: "#111127",
        border: "#1e1e3f",
      },
      animation: {
        pulse_slow: "pulse 3s ease-in-out infinite",
        scan: "scan 2s linear infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        "slide-in": "slideIn 0.4s ease-out",
        "fade-up": "fadeUp 0.5s ease-out",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        glow: {
          from: { textShadow: "0 0 10px #00ff87, 0 0 20px #00ff87" },
          to: { textShadow: "0 0 20px #00ff87, 0 0 40px #00ff87, 0 0 60px #00ff87" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slideIn: {
          from: { opacity: 0, transform: "translateX(-20px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        fadeUp: {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
