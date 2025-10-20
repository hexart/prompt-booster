// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // 同时支持dark类和data-theme属性
    darkMode: 'class',
    theme: {
        extend: {},
    },
    variants: {
        extend: {},
    },
    plugins: [
        require("tailwindcss-animate"),
    ],
}