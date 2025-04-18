// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    ],
    // 同时支持dark类和data-theme属性
    darkMode: 'class',
    theme: {
        extend: {
            animation: {
                'blink': 'blink 0.8s infinite alternate',
                'spin-reverse': 'spin-reverse 1s linear infinite',
            },
            keyframes: {
                blink: {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                },
                'spin-reverse': {
                    '0%': { transform: 'rotate(360deg)' },
                    '100%': { transform: 'rotate(0deg)' },
                }
            },
        },
    },
    variants: {
        extend: {},
    },
    plugins: [
        require("tailwindcss-animate"),
    ],
}