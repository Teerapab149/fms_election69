// src/app/page.js

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth"; // ✅ Import authOptions
import HomeRenderer from "../components/home/HomeRenderer"; // per-template home layout dispatcher

import { getSiteConfig, getTemplateCached, getHomeStats } from "../lib/cache/siteData";
import { resolveElectionDates } from "../utils/electionConfig";
import { liveSystemStatus } from "../lib/election/systemStatus.mjs";
import { getTemplate } from "../components/admin/editor/templates";

export const dynamic = "force-dynamic";

async function getHomeData(session) {
  try {
    // 🔥 FIX: Query DB directly instead of Fetching via HTTP Loopback (Docker Friendly)
    // Cached reads (lib/cache/siteData.js, TTL 3-5 s, busted by admin writes): a
    // reload storm otherwise re-ran 7 queries per render, two of them counts over
    // the whole User table.
    const { candidates, totalEligible, totalVoted } = await getHomeStats();

    let config = await getSiteConfig();
    if (!config) {
      config = { systemMode: "AUTO" };
    }
    const pageLayout = config?.pageLayout || null;

    // Phase 3 Day 2A — SSR pre-resolve active template at boundary
    const activeTemplateId = config?.activeTemplateId || "classic";
    let resolvedTemplate = await getTemplateCached(activeTemplateId);
    if (!resolvedTemplate) {
      // Fall back to classic if active slug missing in DB+code
      resolvedTemplate = await getTemplateCached("classic");
    }

    const { ELECTION_START, ELECTION_END } = resolveElectionDates(config.globalConfig);
    const now = Date.now();
    const sysMode = config.systemMode || "AUTO";

    // one definition, shared with /template-preview so a template reviewed there
    // is fed exactly the state this page would feed it (lib/election/systemStatus)
    const { isSystemOpen, electionStatus } = liveSystemStatus({
      systemMode: sysMode, start: ELECTION_START, end: ELECTION_END, now,
    });

    return {
      candidates,
      stats: { totalEligible, totalVoted },
      isSystemOpen,
      systemMode: sysMode,
      electionStatus,
      pageLayout,
      resolvedTemplate,
      systemConfig: {
        systemMode: sysMode,
        isSystemOpen,
        showResult: config?.showResult === true,
      },
      userData: session?.user ? {
        isVoted: session.user.isVoted || false,
        isFormCompleted: session.user.isFormCompleted || false,
      } : null,
    };

  } catch (error) {
    console.error("Direct DB Fetch Error:", error);
    // Return mock data ONLY if DB fails completely, to prevent UI crash
    const fallbackTemplate = await getTemplate("classic", null);
    return {
      candidates: [],
      stats: { totalEligible: 0, totalVoted: 0 },
      isSystemOpen: false,
      systemMode: "AUTO",
      electionStatus: "WAITING",
      resolvedTemplate: fallbackTemplate
    };
  }
}

export default async function Home() {
  // 1. ดึง Session จาก Server (0 Request Client)
  const session = await getServerSession(authOptions);

  // 2. ดึงข้อมูล Home จาก Server
  const homeData = await getHomeData(session);

  return (
    <main>
      {/* 3. ส่งข้อมูลทั้งหมดไปให้ Client Component */}
      <HomeRenderer
        session={session}
        initialData={homeData}
        pageLayout={homeData.pageLayout}
        resolvedTemplate={homeData.resolvedTemplate}
        tokens={homeData.resolvedTemplate?.theme?.tokens || null}
      />
    </main>
  );
}