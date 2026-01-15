/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. ส่วน Font เดิมของคุณ (เก็บไว้)
      fontFamily: {
        sans: ['var(--font-kanit)', 'sans-serif'],
        prompt: ['var(--font-prompt)', 'sans-serif'],
      },
      // 2. ส่วน Animation ใหม่ (เพิ่มเข้าไป)
      animation: {
        'blob': 'blob 10s infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'shine': 'shine 1.5s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shine: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' }
        }
      },
    },
  },
  plugins: [], // ย้ายออกมาอยู่นอก theme แล้ว
};