import './globals.css';
import { Prompt, Kanit } from 'next/font/google'; // 1. นำเข้าทั้ง Prompt และ Kanit

// 2. ตั้งค่า Prompt (เหมือนเดิม)
const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt', 
  display: 'swap',
});

// 3. เพิ่มการตั้งค่า Kanit
const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-kanit', // ชื่อตัวแปรต้องไม่ซ้ำกับ prompt
  display: 'swap',
});

export const metadata = {
  title: 'SAMO 49 - FMS Election 2026',
  description: 'ระบบเลือกตั้งสโมสรนักศึกษาคณะวิทยาการจัดการ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      {/* 4. ใส่ตัวแปรทั้ง 2 ตัวลงใน body (คั่นด้วยเว้นวรรค) */}
      <body className={`${prompt.variable} ${kanit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}