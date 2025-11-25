/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                hs: ['"Black Han Sans"', 'sans-serif'],
                dh: ['"Do Hyeon"', 'sans-serif'],
                teko: ['"Teko"', 'sans-serif'],
            },
            animation: {
                'shake': 'shake 0.5s',
                'glitch': 'glitch 0.2s cubic-bezier(.25, .46, .45, .94) both infinite',
                'fadeIn': 'fadeIn 0.5s ease-out forwards',
            },
            keyframes: {
                shake: {
                    '0%': { transform: 'translate(1px, 1px) rotate(0deg)' },
                    '50%': { transform: 'translate(-1px, 2px) rotate(-1deg)' },
                    '100%': { transform: 'translate(1px, -2px) rotate(-1deg)' },
                },
                glitch: {
                    '0%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, 2px)' },
                    '40%': { transform: 'translate(-2px, -2px)' },
                    '60%': { transform: 'translate(2px, 2px)' },
                    '80%': { transform: 'translate(2px, -2px)' },
                    '100%': { transform: 'translate(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
