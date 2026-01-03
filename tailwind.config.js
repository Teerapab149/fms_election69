/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ✅ 1. ตั้ง Prompt เป็นค่าเริ่มต้น (font-sans)
        sans:['var(--font-kanit)', 'sans-serif'],
        
        // ✅ 2. เพิ่ม Kanit เป็นตัวเลือกเสริม (font-kanit)
        prompt:['var(--font-prompt)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};