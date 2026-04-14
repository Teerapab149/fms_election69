// src/components/HomeContent.js
"use client";
import { getPath } from "../utils/basePath";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import BlockRenderer from "../components/blocks/BlockRenderer";
import HeroBlock from "../components/blocks/HeroBlock";
import MeetCandidatesBlock from "../components/blocks/MeetCandidatesBlock";
import VoteCTABlock from "../components/blocks/VoteCTABlock";
import StatsBlock from "../components/blocks/StatsBlock";
import ElectionBannerBlock from "../components/blocks/ElectionBannerBlock";

// Default blocks (ใช้เป็น fallback เมื่อ API ล้มเหลว)
const FALLBACK_BLOCKS = [
  { type: "hero",           visible: true, order: 1, config: { showCountdown: true, showStatusBadge: true } },
  { type: "voteCTA",        visible: true, order: 2, config: {} },
  { type: "meetCandidates", visible: true, order: 3, config: {} },
  { type: "stats",          visible: true, order: 4, config: { showPercentage: true, showTotalEligible: true } },
  { type: "electionBanner", visible: true, order: 5, config: {} },
];

export default function HomeContent({ initialData }) {
  const { data: session, status } = useSession();

  // ✅ ใช้ข้อมูลที่ Server ส่งมาเป็นค่าเริ่มต้นทันที (ไม่ต้องรอโหลด)
  const [stats, setStats] = useState({
    totalEligible: initialData?.stats?.totalEligible || 0,
    totalVoted: initialData?.stats?.totalVoted || 0,
    percentage:
      initialData?.stats?.totalEligible > 0
        ? ((initialData.stats.totalVoted / initialData.stats.totalEligible) * 100).toFixed(2)
        : "0.00",
  });

  const [mounted, setMounted] = useState(false);

  // 🔐 เช็คสถานะ isVoted จาก Database จริง (ไม่พึ่ง session เพราะ JWT ไม่ update หลังโหวต)
  const [isVotedReal, setIsVotedReal] = useState(false);
  const [isCheckingVoted, setIsCheckingVoted] = useState(true);

  // 🧱 pageLayout จาก API (null = ยังโหลด / ล้มเหลว → ใช้ FALLBACK_BLOCKS)
  const [homeBlocks, setHomeBlocks] = useState(FALLBACK_BLOCKS);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔐 Fetch สถานะ isVoted จริงจาก Database เมื่อมี session
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (session?.user?.studentId) {
        try {
          const res = await fetch(getPath(`/api/check-status?studentId=${session.user.studentId}`));
          if (res.ok) {
            const data = await res.json();
            setIsVotedReal(data.isVoted === true);
          }
        } catch (error) {
          console.error("Error checking vote status:", error);
        }
      }
      setIsCheckingVoted(false);
    };

    if (status === "authenticated") {
      checkVoteStatus();
    } else if (status === "unauthenticated") {
      setIsCheckingVoted(false);
    }
  }, [session?.user?.studentId, status]);

  // 🧱 Fetch pageLayout จาก API
  useEffect(() => {
    fetch(getPath("/api/admin/page-layout"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.home) setHomeBlocks(data.home);
      })
      .catch((err) => {
        console.error("[HomeContent] page-layout fetch failed:", err);
        // ล้มเหลว → ใช้ FALLBACK_BLOCKS ที่ตั้งค่าไว้แล้ว
      });
  }, []);

  if (!mounted) return null;

  // ข้อมูลที่ส่งให้ทุก block component
  const blockData = { session, isVotedReal, isCheckingVoted, initialData, stats };

  // Map type → component (column assignment is fixed; order within each column is driven by block.order)
  const BLOCK_COMPONENTS = {
    hero:            HeroBlock,
    meetCandidates:  MeetCandidatesBlock,
    voteCTA:         VoteCTABlock,
    stats:           StatsBlock,
    electionBanner:  ElectionBannerBlock,
  };

  // renderColumn — filters to the given types, sorts by block.order, skips hidden blocks
  const renderColumn = (types) =>
    homeBlocks
      .filter((b) => types.includes(b.type) && b.visible !== false)
      .sort((a, b) => a.order - b.order)
      .map((block) => {
        const Component = BLOCK_COMPONENTS[block.type];
        if (!Component) return null;
        return <Component key={block.type} config={block.config || {}} data={blockData} />;
      });

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8F9FD] text-slate-900 font-sans selection:bg-[#8A2680] selection:text-white relative">

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="bg-noise" />
      </div>

      <div className="relative z-50 shrink-0">
        <Navbar />
      </div>

      <main className="flex-grow flex items-center justify-center py-6 lg:py-6 xl:py-10 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="container mx-auto max-w-[1400px] w-full">
          {/* 2-column layout — order within each column respects block.order from saved config */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(480px,45%)] gap-6 lg:gap-8 items-start">
            <div className="space-y-4 lg:space-y-6">
              {renderColumn(["hero", "meetCandidates", "voteCTA"])}
            </div>
            <div className="space-y-4 lg:space-y-6">
              {renderColumn(["stats", "electionBanner"])}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-50 shrink-0 w-full py-4 bg-white/50 backdrop-blur-sm border-t border-slate-100 text-center mt-auto">
        <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">
          © FMS@PSU 2026. All Rights Reserved.
        </p>
      </footer>

      <style jsx global>{`
        @keyframes shine { 100% { transform: translateX(100%); } }
        .animate-shine { animation: shine 1.5s infinite; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}
