import type { Config } from "tailwindcss";

// Design tokens extension
const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./src/pages/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}",
        "./src/game/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                poppins: ["var(--font-poppins-family)"],
                luckiest: ["var(--font-luckiest-guy-family)"],
            },
            colors: {
                brand: {
                    50: "#f2fdf8",
                    100: "#e0fbef",
                    200: "#bdf5dc",
                    300: "#88ebc2",
                    400: "#34d399",
                    500: "#10b981",
                    600: "#059669",
                    700: "#047857",
                    800: "#065f46",
                    900: "#064e3b",
                },
                surface: {
                    DEFAULT: "rgba(30,30,38,0.72)",
                    alt: "rgba(52,52,60,0.65)",
                    strong: "rgba(18,18,24,0.85)",
                },
                accent: "#34d399",
                danger: "#dc2626",
                warning: "#f59e0b",
                info: "#3b82f6",
                success: "#10b981",
            },
            spacing: {
                "18": "4.5rem",
            },
            borderRadius: {
                pill: "9999px",
            },
            boxShadow: {
                soft: "0 2px 4px -1px rgba(0,0,0,0.3), 0 4px 12px -1px rgba(0,0,0,0.25)",
                inset: "inset 0 1px 2px rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.4)",
            },
            transitionTimingFunction: {
                "game-pop": "cubic-bezier(.34,1.56,.64,1)",
            },
            keyframes: {
                pulsePop: {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.12)" },
                    "100%": { transform: "scale(1)" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
            },
            animation: {
                pulsePop:
                    "pulsePop 400ms var(--ease-game-pop, cubic-bezier(.34,1.56,.64,1))",
                fadeIn: "fadeIn 500ms ease",
            },
        },
    },
};
export default config;
