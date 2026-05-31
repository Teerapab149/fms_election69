"use client";

// Day 9a: voteCTA-button / default variant (extracted 1:1 from VoteCTABlock).
// This is the canonical FMS dynamic CTA: state-aware button with 6 states
// (login / notVoted / voted / ended / closed / paused), gradient + shadow
// + animated glow per state.
//
// Variant contract (per ADR-001 + Day 7b banner pattern):
//   1. Renders root with data-element="voteCTA-button" (Layer 2 scope marker).
//   2. Accepts {config, data, resolvedConfig} like the wrapper did
//      (resolvedConfig is the per-state Layer 3 config from
//      resolveStatefulConfig — present in live + editor preview).
//   3. State selection: internal btnConfig branches mirror stateResolver.voteCTA
//      so the 6 election states paint correctly. Behavior is 1:1 with the
//      previous monolithic VoteCTABlock (P-LOG-015 byte-faithful).
//   4. Style cascade per ADR-001 D10:
//      stateConfig explicit (Layer 3) > --btn-* (Layer 2) > Layer 1 tokens
//      Applied only on the override path (when resolvedConfig is present).
//   5. Legacy hardcoded Tailwind path remains as safety fallback when
//      resolvedConfig is null (preserved 1:1).

import Link from "next/link";
import { signIn } from "next-auth/react";
import { LogIn, Vote, BarChart3 } from "lucide-react";

function buildButtonStyle(cfg) {
  if (!cfg) return undefined;

  // Layer 2 var fallbacks per field — Layer 3 (cfg.X) wins when explicit.
  const style = {};

  // Background
  if (cfg.backgroundType === "gradient") {
    const parts = [cfg.gradientFrom];
    if (cfg.gradientVia) parts.push(cfg.gradientVia);
    parts.push(cfg.gradientTo);
    const direction = {
      "to-r": "to right", "to-l": "to left",
      "to-t": "to top", "to-b": "to bottom",
      "to-tr": "to top right", "to-tl": "to top left",
      "to-br": "to bottom right", "to-bl": "to bottom left"
    }[cfg.gradientDirection] || "to right";
    style.backgroundImage = `linear-gradient(${direction}, ${parts.join(", ")})`;
    style.backgroundColor = cfg.gradientFrom; // fallback
  } else if (cfg.backgroundType === "solid") {
    style.backgroundColor = cfg.backgroundColor || 'var(--btn-bg)';
    style.backgroundImage = "none";
  } else if (cfg.backgroundColor) {
    style.backgroundColor = cfg.backgroundColor;
    style.backgroundImage = "none";
  } else {
    // No Layer 3 background → fall back to Layer 2 vars. --btn-bg-gradient
    // defaults to "none" so this is inert until the admin sets a gradient
    // (Tier 2 GradientPicker); --btn-bg covers the solid case.
    style.backgroundColor = 'var(--btn-bg)';
    style.backgroundImage = 'var(--btn-bg-gradient)';
  }

  // Text
  style.color = cfg.textColor || 'var(--btn-text)';
  if (cfg.fontSize) {
    const sizeMap = { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" };
    style.fontSize = sizeMap[cfg.fontSize] || "1.125rem";
  } else {
    style.fontSize = 'var(--btn-font-size)';
  }
  if (cfg.fontWeight) {
    const weightMap = { normal: "400", medium: "500", semibold: "600", bold: "700", black: "900" };
    style.fontWeight = weightMap[cfg.fontWeight] || "700";
  } else {
    style.fontWeight = 'var(--btn-font-weight)';
  }

  // Radius — Layer 3 → Layer 2 (--btn-radius) → Layer 1 (--radius-button via var chain)
  {
    const radiusMap = { none: "0", sm: "0.125rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px" };
    style.borderRadius = (cfg.borderRadius && radiusMap[cfg.borderRadius]) || 'var(--btn-radius)';
  }

  // Border
  if (cfg.borderWidth && cfg.borderWidth !== "0") {
    style.borderWidth = `${cfg.borderWidth}px`;
    style.borderStyle = "solid";
    style.borderColor = cfg.borderColor || 'var(--btn-border-color)';
  }

  // Shadow — Layer 3 (cfg.shadow) wins; "none" = explicit no-shadow (leave
  // unset); absent → fall back to Layer 2 var(--btn-shadow) so the Tier 2
  // ShadowControl is live whenever a state doesn't hardcode its own shadow.
  if (cfg.shadow && cfg.shadow !== "none") {
    const shadowMap = {
      sm: "0 1px 2px 0",
      md: "0 4px 6px -1px",
      lg: "0 10px 15px -3px",
      xl: "0 20px 25px -5px",
      "2xl": "0 25px 50px -12px"
    };
    const shadowColor = cfg.shadowColor ? `${cfg.shadowColor}66` : "rgba(0,0,0,0.25)";
    style.boxShadow = `${shadowMap[cfg.shadow] || shadowMap.lg} ${shadowColor}`;
  } else if (cfg.shadow == null) {
    style.boxShadow = 'var(--btn-shadow)';
  }

  // Padding
  if (cfg.paddingX) {
    style.paddingLeft = style.paddingRight = `${parseInt(cfg.paddingX) * 0.25}rem`;
  } else {
    style.paddingLeft = style.paddingRight = 'var(--btn-padding-x)';
  }
  if (cfg.paddingY) {
    style.paddingTop = style.paddingBottom = `${parseInt(cfg.paddingY) * 0.25}rem`;
  } else {
    style.paddingTop = style.paddingBottom = 'var(--btn-padding-y)';
  }

  // Decoration vars — always inherit unless theme overrides at element scope
  style.letterSpacing = 'var(--btn-letter-spacing)';
  style.textTransform = 'var(--btn-text-transform)';

  return style;
}

export default function DefaultVoteCTA({ config = {}, data = {}, resolvedConfig = null }) {
  const { session, isVotedReal, isCheckingVoted, initialData } = data;

  // ─── Button config logic (1:1 with legacy VoteCTABlock) ───────────────
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

  // Style overrides from editor config — null in legacy mode
  const styleOverride = resolvedConfig;
  const hasOverride = !!styleOverride && Object.keys(styleOverride).length > 0;
  const buttonInlineStyle = hasOverride ? buildButtonStyle(styleOverride) : undefined;
  const textOverride = hasOverride ? styleOverride.text : null;

  const legacyClassName = `relative w-full sm:w-auto overflow-hidden rounded-xl bg-gradient-to-r ${btnConfig.gradientBase} px-10 py-4 text-lg font-bold text-white ${btnConfig.shadow} ring-1 ring-white/20 transition-all duration-500 ease-out transform group-hover:scale-[1.02] group-hover:-translate-y-1 active:scale-95 isolate`;
  const overrideClassName = `relative w-full sm:w-auto overflow-hidden ring-1 ring-white/20 transition-all duration-500 ease-out transform group-hover:scale-[1.02] group-hover:-translate-y-1 active:scale-95 isolate text-white`;
  const btnClassName = hasOverride ? overrideClassName : legacyClassName;

  const InnerButton = () => (
    <button data-element="voteCTA-button" className={btnClassName} style={buttonInlineStyle}>
      {!hasOverride && (
        <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${btnConfig.gradientHover} opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100`} />
      )}
      <span className="relative z-20 flex items-center justify-center gap-3 drop-shadow-sm">
        {textOverride ?? btnConfig.text}
        <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md shadow-inner border border-white/10">
          {btnConfig.icon}
        </span>
      </span>
      {!hasOverride && (
        <div className="absolute inset-0 z-30 flex h-full w-full justify-center pointer-events-none">
          <div className="relative h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:animate-shine skew-x-20" />
        </div>
      )}
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
          {!hasOverride && (
            <div
              className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${btnConfig.glowColor} opacity-40 blur-lg group-hover:opacity-80 group-hover:blur-xl transition-all duration-700 ${btnConfig.animation}`}
            />
          )}
          <InnerButton />
        </div>
      ) : (
        <Link href={btnConfig.href} className="group relative w-[90%] sm:w-auto inline-block">
          {!hasOverride && (
            <div
              className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${btnConfig.glowColor} opacity-40 blur-lg group-hover:opacity-80 group-hover:blur-xl transition-all duration-700 ${btnConfig.animation}`}
            />
          )}
          <InnerButton />
        </Link>
      )}
    </div>
  );
}
