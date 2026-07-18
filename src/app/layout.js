import './globals.css';
import Providers from "../components/Providers";
import { Prompt, Kanit, Archivo_Black, Space_Grotesk, Anuphan, Inter, JetBrains_Mono, Instrument_Serif, DM_Serif_Display, Manrope, IBM_Plex_Sans_Thai, Space_Mono, Chakra_Petch } from 'next/font/google';

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { useGlobalConfig } from '../contexts/GlobalConfigContext';

import { db } from "../lib/db";
import { getTemplate } from "../components/admin/editor/templates";
import { buildTemplateStyles } from "../lib/templateTokens";
import { GLOBAL_CONFIG_DEFAULTS } from "../utils/globalConfigDefaults";

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
    // activeTemplateId rides along so the client (loading screens etc.) knows
    // the theme on FIRST paint — no fetch, no light-background flash.
    return { tokenCss: buildTemplateStyles(effectiveTpl, ".fms-app"), activeTemplateId: activeId };
  } catch (error) {
    console.error("Failed to build theme token CSS:", error);
    return { tokenCss: "", activeTemplateId: "classic" };
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

// Display + mono families for the committed templates (gumroad "Active Pulse" et al).
// Archivo Black = chunky blocky headings; Space Grotesk = mono labels / data.
// Latin-only: Thai script always falls through to Kanit (see GumroadHome --fd/--fm).
const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-archivo',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

// Site-wide body font: Anuphan — a loopless (ไม่มีหัว) modern humanist Thai sans.
// Replaces Kanit as the default `font-sans` (tailwind.config.js). Kanit stays
// loaded as the fallback + for long-form text on future pages (user's exception).
const anuphan = Anuphan({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-anuphan',
  display: 'swap',
});

// Studio Dark v2 template families. Geist (the prototype's sans) ships as a
// separate Vercel npm package, not next/font/google — to avoid adding a runtime
// dep we substitute Inter, a near-identical neutral grotesque available in
// Google Fonts (exact-match upgrade later = `npm i geist`). JetBrains Mono =
// small-caps data/labels (sub for Geist Mono); Instrument Serif (italic) = the
// real lime-accent signature, available as-is. All latin-only → Thai falls
// through to Anuphan (the dark minimal vibe pairs well with the loopless Anuphan).
// Loading is mandatory — a declared font-family does nothing unless next/font
// loads it (impeccable rule).
const studioSans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-studio-sans',
  display: 'swap',
});

const studioMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-studio-mono',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

// Verdure template families (moss/cream/terracotta editorial). DM Serif Display
// (italic) = the big serif "50"/headlines; Manrope = the sans; IBM Plex Sans Thai
// = the Thai body (loopless, pairs with the serif); Space Mono = the mono labels.
// Loading is mandatory — a declared font-family does nothing unless next/font
// loads it (impeccable rule; root cause of the gumroad font drift).
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex-thai',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

// Receipt template family (Template #6 — "Paper Materiality"). Chakra Petch = the
// squared, technical Thai receipt voice with tabular numerals (the "printer slip"
// sound); paired with IBM Plex Sans Thai (structural headings, already loaded) +
// Space Mono (Latin/digits/ballot-ref, already loaded). Loading is mandatory — a
// declared font-family does nothing unless next/font loads it AND it is consumed
// via a CSS var (--rc-fr on .rc-root). impeccable rule; root cause of the gumroad
// font drift.
const chakraPetch = Chakra_Petch({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-chakra',
  display: 'swap',
});

// Deploy origin (for absolute og/twitter image URLs) — derived from NEXTAUTH_URL
// so link previews resolve to the real host, not localhost. basePath rides along
// so the image URL is the full /fms-ovs/... path the asset is actually served at.
const SITE_ORIGIN = (() => {
  try { return new URL(process.env.NEXTAUTH_URL || "http://localhost:3000").origin; }
  catch { return "http://localhost:3000"; }
})();
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs";
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
  const title = `${name} · ${fac} Election ${year}`.trim();
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
      <body className={`${prompt.variable} ${kanit.variable} ${anuphan.variable} ${archivoBlack.variable} ${spaceGrotesk.variable} ${studioSans.variable} ${studioMono.variable} ${instrumentSerif.variable} ${dmSerif.variable} ${manrope.variable} ${plexThai.variable} ${spaceMono.variable} ${chakraPetch.variable} font-sans antialiased`}>

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
          <div className="fms-app">{children}</div>
        </Providers>

      </body>
    </html>
  );
}