// src/app/page.js

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth"; // ✅ Import authOptions
import HomeContent from "../components/HomeContent"; // ✅ เรียกใช้ Component ที่แยกไป

import { db } from "../lib/db";
import { ELECTION_CONFIG } from "../utils/electionConfig";

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

    const { ELECTION_START, ELECTION_END } = ELECTION_CONFIG;
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
    return {
      candidates: [],
      stats: { totalEligible: 0, totalVoted: 0 },
      isSystemOpen: false,
      systemMode: "AUTO",
      electionStatus: "WAITING"
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
      <HomeContent session={session} initialData={homeData} pageLayout={homeData.pageLayout} />
    </main>
  );
}