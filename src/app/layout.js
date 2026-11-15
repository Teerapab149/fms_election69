import './globals.css';
// Web fonts are files in this repository (src/app/fonts), not fetched from Google
// at build time. The list of families lives in scripts/vendor-fonts.mjs.
import './fonts/fonts.css';
import Providers from "../components/Providers";
import ImageErrorGuard from "../components/ImageErrorGuard";

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { useGlobalConfig } from '../contexts/GlobalConfigContext';

import { getSiteConfig, getTemplateCached } from "../lib/cache/siteData";
import { buildTemplateStyles } from "../lib/templateTokens";
import { GLOBAL_CONFIG_DEFAULTS } from "../utils/globalConfigDefaults";

async function getGlobalConfig() {
  try {
    // cached (lib/cache/siteData): this row was read 3x per render (metadata + layout x2)
    const config = await getSiteConfig();
    if (!config) return null;
    // googleFormUrl อยู่ใน COLUMN ของตัวเอง ไม่ได้อยู่ใน JSON ก้อนนี้ — ต้องเชื่อมเข้ามา
    // ให้เหมือนที่ /api/admin/global-config ทำ ไม่งั้น context จะถือค่าว่างของ
    // GLOBAL_CONFIG_DEFAULTS แล้วทุกคนที่เขียน config ทั้งก้อนกลับไป (updateField ของ
    // PropertyPanel, ฟอร์มตั้งค่าทั่วไปหลัง context re-sync) จะลบลิงก์แบบประเมินทิ้ง
    // โดยไม่มีใครตั้งใจ — ลิงก์นั้นคือทางเดียวที่นักศึกษาจะได้ชั่วโมงกิจกรรม
    return { ...(config.globalConfig ?? {}), googleFormUrl: config.googleFormUrl ?? "" };
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
    const config = await getSiteConfig();
    const activeId = config?.activeTemplateId || "classic";
    const tpl = (await getTemplateCached(activeId)) || (await getTemplateCached("classic"));
    const overrides = config?.pageLayout?.themeTokens || {};
    const effectiveTpl = {
      ...tpl,
      theme: { ...(tpl?.theme || {}), tokens: { ...(tpl?.theme?.tokens || {}), ...overrides } },
    };
    // activeTemplateId rides along so the client (loading screens etc.) knows
    // the theme on FIRST paint — no fetch, no light-background flash.
    return { tokenCss: buildTemplateStyles(effectiveTpl, ".fms-app"), activeTemplateId: activeId };
  } catch (error) {
    console.error("Failed to build theme token CSS:", error);
    return { tokenCss: "", activeTemplateId: "classic" };
  }
}

// Deploy origin (for absolute og/twitter image URLs) — derived from NEXTAUTH_URL
// so link previews resolve to the real host, not localhost. basePath rides along
// so the image URL is the full path the asset is actually served at (empty on the
// current root deployment, '/fms-ovs/...' if BASE_PATH ever puts us on a subpath).
const SITE_ORIGIN = (() => {
  try { return new URL(process.env.NEXTAUTH_URL || "http://localhost:3000").origin; }
  catch { return "http://localhost:3000"; }
})();
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
// The election promo banner (same image the home banner element shows).
const OG_IMAGE = `${BASE_PATH}/images/prob/samo49_1.png`;

// Dynamic title/description from the admin-editable election config — updates
// every year when staff bump electionName / electionCalendarYear in การตั้งค่า,
// no code change. Falls back to defaults if the DB is unreachable.
export async function generateMetadata() {
  const cfg = { ...GLOBAL_CONFIG_DEFAULTS, ...((await getGlobalConfig()) || {}) };
  const name = cfg.electionName || "SAMO";
  const fac = cfg.facultyShortEn || "FMS";
  const year = cfg.electionCalendarYear || "";
  const title = `${name} | ${fac} Election ${year}`.trim();
  const description = `ระบบเลือกตั้งออนไลน์ ${cfg.organizationName || "สโมสรนักศึกษา"}`;

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: `${fac} Election`,
      url: `${SITE_ORIGIN}${BASE_PATH}`,
      images: [{ url: OG_IMAGE, width: 800, height: 588, alt: title }],
      locale: "th_TH",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function RootLayout({ children }) {

  // 3. ดึง Session
  const session = await getServerSession(authOptions);
  const globalConfig = await getGlobalConfig();
  const { tokenCss, activeTemplateId } = await getThemeTokenCss();

  return (
    <html lang="th">
      <body className="fms-fonts font-sans antialiased">

        {/* Site-wide Layer 1 token scope — every page inherits the theme */}
        {tokenCss && <style dangerouslySetInnerHTML={{ __html: tokenCss }} />}

        {/* "original" template = the ee059dc hand-crafted design (Kanit). The home
            uses OriginalHome; the other pages render the classic components via each
            page's else branch — force Kanit across the whole subtree so they match
            (default font-sans is Anuphan now). Only when it is the active template. */}
        {activeTemplateId?.startsWith("original") && (
          <style dangerouslySetInnerHTML={{ __html: ".fms-app,.fms-app .font-sans{font-family:var(--font-kanit),sans-serif !important}" }} />
        )}

        {/* 4. ส่ง Session + globalConfig เข้าไป */}
        <Providers session={session} globalConfig={globalConfig} activeTemplateId={activeTemplateId}>
          {/* app-wide net: a DB path whose file is gone must never render the
              browser's broken-image icon (see ImageErrorGuard) */}
          <ImageErrorGuard />
          <div className="fms-app">{children}</div>
        </Providers>

      </body>
    </html>
  );
}