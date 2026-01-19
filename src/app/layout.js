import './globals.css';
import Providers from "../components/Providers";
import { Prompt, Kanit } from 'next/font/google';

// 1. นำเข้า getServerSession
import { getServerSession } from "next-auth";

// ✅ 2. แก้ตรงนี้! นำเข้า authOptions จาก lib/auth
import { authOptions } from "../lib/auth";

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt',
  display: 'swap',
});

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-kanit',
  display: 'swap',
});

export const metadata = {
  title: 'SAMO 49 - FMS Election 2026',
  description: 'ระบบเลือกตั้งสโมสรนักศึกษาคณะวิทยาการจัดการ',
};

export default async function RootLayout({ children }) {

  // 3. ดึง Session
  const session = await getServerSession(authOptions);
  console.log("SERVER SESSION STATUS:", session ? "✅ FOUND" : "❌ NULL");

  return (
    <html lang="th">
      <body className={`${prompt.variable} ${kanit.variable} font-sans antialiased`}>

        {/* 4. ส่ง Session เข้าไป */}
        <Providers session={session}>
          {children}
        </Providers>

      </body>
    </html>
  );
}