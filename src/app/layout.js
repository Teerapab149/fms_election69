import './globals.css';
import Providers from "../components/Providers";
import { Prompt, Kanit } from 'next/font/google';

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { useGlobalConfig } from '../contexts/GlobalConfigContext';

import { db } from "../lib/db";
import { getTemplate } from "../components/admin/editor/templates";
import { buildTokenStyles } from "../lib/templateTokens";

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

// Day 11+ tokenization: emit the Layer 1 token scope at the LAYOUT level so
// EVERY page (not just home) inherits the active template's tokens overlaid
// with the admin's themeTokens. This lets var(--color-*) resolve site-wide
// (navbar, shared chrome, future per-page tokenized elements). Home's own
// .fms-app scope still nests harmlessly with identical values.
async function getThemeTokenCss() {
  try {
    const config = await db.systemConfig.findFirst({
      where: { id: 1 },
      select: { pageLayout: true, activeTemplateId: true },
    });
    const activeId = config?.activeTemplateId || "classic";
    const tpl = (await getTemplate(activeId, db)) || (await getTemplate("classic", db));
    const baseTokens = tpl?.theme?.tokens || {};
    const overrides = config?.pageLayout?.themeTokens || {};
    const effective = { ...baseTokens, ...overrides };
    return buildTokenStyles(effective, ".fms-app");
  } catch (error) {
    console.error("Failed to build theme token CSS:", error);
    return "";
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
  const tokenCss = await getThemeTokenCss();

  return (
    <html lang="th">
      <body className={`${prompt.variable} ${kanit.variable} font-sans antialiased`}>

        {/* Site-wide Layer 1 token scope — every page inherits the theme */}
        {tokenCss && <style dangerouslySetInnerHTML={{ __html: tokenCss }} />}

        {/* 4. ส่ง Session + globalConfig เข้าไป */}
        <Providers session={session} globalConfig={globalConfig}>
          <div className="fms-app">{children}</div>
        </Providers>

      </body>
    </html>
  );
}