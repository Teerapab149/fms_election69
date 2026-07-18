// src/app/page.js

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth"; // ✅ Import authOptions
import HomeRenderer from "../components/home/HomeRenderer"; // per-template home layout dispatcher

import { db } from "../lib/db";
import { resolveElectionDates } from "../utils/electionConfig";
import { getTemplate } from "../components/admin/editor/templates";

export const dynamic = "force-dynamic";

async function getHomeData(session) {
  try {
    // 🔥 FIX: Query DB directly instead of Fetching via HTTP Loopback (Docker Friendly)
    const candidates = await db.candidate.findMany({
      select: {
        id: true,
        number: true,
        logoUrl: true,
      },
      orderBy: { number: 'asc' },
      take: 5,
    });

    const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
    const totalEligible = await db.user.count({ where: { year: { in: validYears } } });
    const totalVoted = await db.user.count({
      where: { isVoted: true, year: { in: validYears } }
    });

    let config = await db.systemConfig.findFirst({ where: { id: 1 } });
    if (!config) {
      config = { systemMode: "AUTO" };
    }
    const pageLayout = config?.pageLayout || null;

    // Phase 3 Day 2A — SSR pre-resolve active template at boundary
    const activeTemplateId = config?.activeTemplateId || "classic";
    let resolvedTemplate = await getTemplate(activeTemplateId, db);
    if (!resolvedTemplate) {
      // Fall back to classic if active slug missing in DB+code
      resolvedTemplate = await getTemplate("classic", db);
    }

    const { ELECTION_START, ELECTION_END } = resolveElectionDates(config.globalConfig);
    const now = Date.now();
    const sysMode = config.systemMode || "AUTO";

    let isSystemOpen = false;
    let electionStatus = "WAITING";

    if (sysMode === "MANUAL_OPEN") {
      isSystemOpen = true;
      electionStatus = "ONGOING";
    } else if (sysMode === "PAUSE") {
      isSystemOpen = false;
      electionStatus = "CLOSED";
    } else if (sysMode === "ENDED") {
      isSystemOpen = false;
      electionStatus = "ENDED";
    } else {
      // AUTO
      if (now < ELECTION_START) {
        isSystemOpen = false;
        electionStatus = "WAITING";
      } else if (now >= ELECTION_END) {
        isSystemOpen = false;
        electionStatus = "ENDED";
      } else {
        isSystemOpen = true;
        electionStatus = "ONGOING";
      }
    }

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