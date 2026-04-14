"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { LogIn, Vote, BarChart3 } from "lucide-react";
import { getPath } from "../../utils/basePath";

// VoteCTABlock — ปุ่ม Dynamic ที่เปลี่ยนตาม election status + login state
// LOCKED: logic ทั้งหมดของปุ่ม (redirect, election status check, login flow) ห้ามแก้ผ่าน config
// config props: (reserved สำหรับ Phase 4 — theme color เท่านั้น)
// data props:   session, isVotedReal, isCheckingVoted, initialData
export default function VoteCTABlock({ config = {}, data = {} }) {
  const { session, isVotedReal, isCheckingVoted, initialData } = data;

  // ─── Button config logic (เหมือน HomeContent.js เดิมทุกประการ) ───────────────
  let btnConfig = {
    isLoginAction: true,
    text: "เข้าสู่ระบบ / Sign in",
    gradientBase: "from-[#691E61] via-[#8A2680] to-[#C026D3]",
    gradientHover: "from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6]",
    glowColor: "from-[#8A2680] to-[#3b82f6]",
    shadow: "shadow-[0_10px_20px_-5px_rgba(138,38,128,0.4)]",
    icon: <LogIn className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />,
    animation: "",
  };

  const sysMode = initialData?.systemMode || "AUTO";
  const electionStatus = initialData?.electionStatus;

  if (sysMode === "PAUSE") {
    btnConfig = {
      isLoginAction: false,
      href: "/closed",
      text: "ระบบปิดปรับปรุงชั่วคราว / Maintenance",
      gradientBase: "from-orange-500 via-orange-600 to-orange-700",
      gradientHover: "from-orange-600 via-orange-700 to-orange-800",
      glowColor: "from-orange-400 to-orange-600",
      shadow: "shadow-[0_10px_20px_-5px_rgba(249,115,22,0.4)]",
      icon: <Vote className="w-5 h-5 text-white animate-spin-slow" />,
      animation: "",
    };
  } else if (sysMode === "ENDED" || (sysMode === "AUTO" && electionStatus === "ENDED")) {
    btnConfig = {
      isLoginAction: false,
      href: "/results",
      text: "อยู่นอกระยะเวลาเลือกตั้ง / Ended",
      gradientBase: "from-slate-700 via-slate-800 to-slate-900",
      gradientHover: "from-slate-600 via-slate-700 to-slate-800",
      glowColor: "from-slate-500 to-slate-700",
      shadow: "shadow-[0_10px_20px_-5px_rgba(0,0,0,0.4)]",
      icon: <Vote className="w-5 h-5 text-slate-400" />,
      animation: "",
    };
  } else if (initialData?.isSystemOpen === false && !(sysMode === "AUTO" && electionStatus === "WAITING")) {
    btnConfig = {
      isLoginAction: false,
      href: "/closed",
      text: "ระบบปิดรับลงคะแนน / Closed",
      gradientBase: "from-slate-700 via-slate-800 to-slate-900",
      gradientHover: "from-slate-600 via-slate-700 to-slate-800",
      glowColor: "from-slate-500 to-slate-700",
      shadow: "shadow-[0_10px_20px_-5px_rgba(0,0,0,0.4)]",
      icon: <Vote className="w-5 h-5 text-slate-400" />,
      animation: "",
    };
  } else if (sysMode === "MANUAL_OPEN") {
    if (session) {
      if (isVotedReal) {
        btnConfig = {
          isLoginAction: false, href: "/results",
          text: "ดูผลคะแนน / Results",
          gradientBase: "from-[#0369a1] via-[#0284c7] to-[#38bdf8]",
          gradientHover: "from-[#0f766e] via-[#0d9488] to-[#14b8a6]",
          glowColor: "from-[#0ea5e9] to-[#14b8a6]",
          shadow: "shadow-[0_10px_20px_-5px_rgba(14,165,233,0.4)]",
          icon: <BarChart3 className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" />,
          animation: "",
        };
      } else {
        btnConfig = {
          isLoginAction: false, href: "/vote",
          text: "ลงคะแนน / Vote Now",
          gradientBase: "from-[#10B981] via-[#059669] to-[#047857]",
          gradientHover: "from-[#34D399] via-[#10B981] to-[#059669]",
          glowColor: "from-[#34D399] to-[#059669]",
          shadow: "shadow-[0_15px_30px_-8px_rgba(16,185,129,0.4)]",
          icon: <Vote className="w-5 h-5 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />,
          animation: "animate-pulse",
        };
      }
    }
  } else if (session) {
    if (isVotedReal) {
      btnConfig = {
        isLoginAction: false, href: "/results",
        text: "ดูผลคะแนน / Results",
        gradientBase: "from-[#0369a1] via-[#0284c7] to-[#38bdf8]",
        gradientHover: "from-[#0f766e] via-[#0d9488] to-[#14b8a6]",
        glowColor: "from-[#0ea5e9] to-[#14b8a6]",
        shadow: "shadow-[0_10px_20px_-5px_rgba(14,165,233,0.4)]",
        icon: <BarChart3 className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" />,
        animation: "",
      };
    } else {
      btnConfig = {
        isLoginAction: false, href: "/vote",
        text: "ลงคะแนน / Vote Now",
        gradientBase: "from-[#10B981] via-[#059669] to-[#047857]",
        gradientHover: "from-[#34D399] via-[#10B981] to-[#059669]",
        glowColor: "from-[#34D399] to-[#059669]",
        shadow: "shadow-[0_15px_30px_-8px_rgba(16,185,129,0.4)]",
        icon: <Vote className="w-5 h-5 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />,
        animation: "animate-pulse",
      };
    }
  }

  const InnerButton = () => (
    <button
      className={`relative w-full sm:w-auto overflow-hidden rounded-xl bg-gradient-to-r ${btnConfig.gradientBase} px-10 py-4 text-lg font-bold text-white ${btnConfig.shadow} ring-1 ring-white/20 transition-all duration-500 ease-out transform group-hover:scale-[1.02] group-hover:-translate-y-1 active:scale-95 isolate`}
    >
      <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${btnConfig.gradientHover} opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100`} />
      <span className="relative z-20 flex items-center justify-center gap-3 drop-shadow-sm">
        {btnConfig.text}
        <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md shadow-inner border border-white/10">
          {btnConfig.icon}
        </span>
      </span>
      <div className="absolute inset-0 z-30 flex h-full w-full justify-center pointer-events-none">
        <div className="relative h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:animate-shine skew-x-20" />
      </div>
    </button>
  );

  return (
    <div className="w-full flex justify-center lg:justify-start pt-0 pb-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
      {btnConfig.isLoginAction ? (
        <div
          onClick={() =>
            signIn("authentik", {
              callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs") + "/vote",
            })
          }
          className="group relative w-[90%] sm:w-auto inline-block cursor-pointer"
        >
          <div
            className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${btnConfig.glowColor} opacity-40 blur-lg group-hover:opacity-80 group-hover:blur-xl transition-all duration-700 ${btnConfig.animation}`}
          />
          <InnerButton />
        </div>
      ) : (
        <Link href={btnConfig.href} className="group relative w-[90%] sm:w-auto inline-block">
          <div
            className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${btnConfig.glowColor} opacity-40 blur-lg group-hover:opacity-80 group-hover:blur-xl transition-all duration-700 ${btnConfig.animation}`}
          />
          <InnerButton />
        </Link>
      )}
    </div>
  );
}
