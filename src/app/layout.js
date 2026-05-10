import './globals.css';
import Providers from "../components/Providers";
import { Prompt, Kanit } from 'next/font/google';

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { useGlobalConfig } from '../contexts/GlobalConfigContext';

import { db } from "../lib/db";

async function getGlobalConfig() {
  try {
    const config = await db.systemConfig.findFirst({
      where: { id: 1 },
      select: { globalConfig: true },
    });
    return config?.globalConfig ?? null;
  } catch (error) {
    console.error("Failed to fetch globalConfig:", error);
    return null;
  }
}

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
  openGraph: {
    title: 'SAMO 49 - FMS Election 2026',
    description: 'ระบบเลือกตั้งสโมสรนักศึกษาคณะวิทยาการจัดการ',
    siteName: 'FMS Election 2026',
    images: [
      {
        url: '/images/prob/samo49_1.png', 
        width: 1200,
        height: 630,
        alt: 'SAMO 49 Election Preview',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
};

export default async function RootLayout({ children }) {

  // 3. ดึง Session
  const session = await getServerSession(authOptions);
  const globalConfig = await getGlobalConfig();

  return (
    <html lang="th">
      <body className={`${prompt.variable} ${kanit.variable} font-sans antialiased`}>

        {/* 4. ส่ง Session + globalConfig เข้าไป */}
        <Providers session={session} globalConfig={globalConfig}>
          {children}
        </Providers>

      </body>
    </html>
  );
}