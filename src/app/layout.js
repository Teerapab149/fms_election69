import './globals.css';
import Providers from "../components/Providers";
import { Prompt, Kanit } from 'next/font/google';

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { useGlobalConfig } from '../contexts/GlobalConfigContext';

import { db } from "../lib/db";
import { getTemplate } from "../components/admin/editor/templates";
import { buildTemplateStyles } from "../lib/templateTokens";

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

// Day 11+ tokenization: emit the token scope at the LAYOUT level so EVERY page
// (not just home) inherits the active template's design, overlaid with the
// admin's themeTokens. buildTemplateStyles emits BOTH Layer 1 tokens (--color-*)
// AND Layer 2 element-scope vars (`.fms-app [data-element=X]{...}`), so any page
// that renders a tokenized element picks up the template defaults site-wide.
// Home's own .fms-app scope still nests harmlessly — HomeContent's <style> comes
// later in the DOM, so its effectiveTemplate (with admin element-var overrides)
// wins on home; other pages fall back to these template defaults.
async function getThemeTokenCss() {
  try {
    const config = await db.systemConfig.findFirst({
      where: { id: 1 },
      select: { pageLayout: true, activeTemplateId: true },
    });
    const activeId = config?.activeTemplateId || "classic";
    const tpl = (await getTemplate(activeId, db)) || (await getTemplate("classic", db));
    const overrides = config?.pageLayout?.themeTokens || {};
    const effectiveTpl = {
      ...tpl,
      theme: { ...(tpl?.theme || {}), tokens: { ...(tpl?.theme?.tokens || {}), ...overrides } },
    };
    return buildTemplateStyles(effectiveTpl, ".fms-app");
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