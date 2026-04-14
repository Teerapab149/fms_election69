"use client";

import CandidateCard from "./CandidateCard";
import AbstainCard from "./AbstainCard";
import { Vote } from "lucide-react";

// ─── Adaptive Grid ────────────────────────────────────────────────────────────
// Mobile: 1 col (< sm)
// sm+:    2 col
// lg+:    3 col (for auto / 3+ parties)
//
// 1 party  → 1 col, narrow
// 2 parties → 2 col sm+, max-w-2xl
// 3 parties → 2 col sm, 3 col lg, max-w-4xl
// 4+        → 2 col sm, 3 col lg, max-w-5xl (compact cards)
function getAdaptiveGrid(count, configCols) {
  if (configCols && configCols !== "auto") {
    const fixed = {
      "2": "grid-cols-1 sm:grid-cols-2 max-w-2xl",
      "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl",
    };
    return fixed[configCols] ?? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl";
  }

  if (count <= 1) return "grid-cols-1 max-w-sm";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl";
}

// Auto-resolve card variant: admin config "compact" → always compact
// admin config "grid" (default) → grid for ≤3 parties, compact for ≥4
function resolveCardVariant(configVariant, partyCount) {
  if (configVariant === "compact") return "compact";
  return partyCount >= 4 ? "compact" : "grid";
}

// ─── MultiPartyView ───────────────────────────────────────────────────────────
// STYLED_BLOCKS_ARCHITECTURE.md config props:
//   gridCols     — "auto" | "2" | "3"
//   cardVariant  — "grid" | "compact"  (auto-adapts on partyCount internally)
//   showDivider  — boolean
//   abstainStyle — "standard" | "compact" | "minimal" | "auto"
//
// HARD LOCKS:
//   - ALL regularParties ต้องแสดงครบ — ห้ามซ่อน
//   - Abstain ต้องแสดงเสมอ — ห้ามซ่อน
//   - ห้ามมี "ไม่รับรอง" ใน MultiPartyView
//   - onSelect logic ห้ามแก้
export default function MultiPartyView({
  regularParties,
  specialOptions,
  selectedPartyId,
  onSelect,
  onViewDetails,
  config = {},
}) {
  const {
    gridCols     = "auto",
    cardVariant  = "grid",
    showDivider  = true,
    abstainStyle = "auto",
  } = config;

  const partyCount = regularParties.length;
  const resolvedVariant = resolveCardVariant(cardVariant, partyCount);
  const gridClasses = getAdaptiveGrid(partyCount, gridCols);

  // abstainStyle auto: standard สำหรับ ≤3 พรรค, compact สำหรับ ≥4
  const resolvedAbstainStyle =
    abstainStyle === "auto"
      ? partyCount <= 3 ? "standard" : "compact"
      : abstainStyle;

  const isAbstainSelected = selectedPartyId === specialOptions.abstain?.id;

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4">

      {/* ─── Section Header ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-3 mb-8 md:mb-10 animate-stagger-card"
        style={{ animationDelay: "0ms" }}
      >
        <div
          className="h-px flex-1 max-w-[60px] md:max-w-[100px]"
          style={{ background: "linear-gradient(to right, transparent, #c392fc40, transparent)" }}
        />
        <div
          className="flex items-center gap-2 px-5 py-2 rounded-full backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.70)",
            boxShadow: "0 4px 20px rgba(61,37,73,0.05), inset 0 0.5px 0 rgba(255,255,255,0.6)",
          }}
        >
          <Vote size={14} style={{ color: "#7244a8" }} />
          <span
            className="text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase"
            style={{ color: "#7244a8" }}
          >
            เลือกได้ 1 พรรค
          </span>
        </div>
        <div
          className="h-px flex-1 max-w-[60px] md:max-w-[100px]"
          style={{ background: "linear-gradient(to right, transparent, #c392fc40, transparent)" }}
        />
      </div>

      {/* ─── Party Grid ──────────────────────────────────────────────────────────
          HARD LOCK: ทุกพรรคต้องแสดง, ห้ามมี "ไม่รับรอง"
      ─────────────────────────────────────────────────────────────────────────── */}
      <div className={`grid ${gridClasses} mx-auto gap-3 sm:gap-4 lg:gap-5 mb-6`}>
        {regularParties.map((party, index) => (
          <div
            key={party.id}
            className="animate-stagger-card"
            style={{ animationDelay: `${(index + 1) * 80}ms` }}
          >
            <CandidateCard
              party={party}
              isSelected={selectedPartyId === party.id}
              onSelect={onSelect}
              onViewDetails={onViewDetails}
              variant={resolvedVariant}
            />
          </div>
        ))}
      </div>

      {/* ─── Divider ─────────────────────────────────────────────────────────────
          HARD LOCK: Abstain ต้องแสดงเสมอ — divider เป็น optional visual เท่านั้น
      ─────────────────────────────────────────────────────────────────────────── */}
      {specialOptions.abstain && (
        <>
          {showDivider && (
            <div
              className="flex items-center gap-3 my-5 animate-stagger-card"
              style={{ animationDelay: `${(partyCount + 1) * 80}ms` }}
            >
              <div
                className="flex-1 h-px"
                style={{ background: "linear-gradient(to right, transparent, #7244a820)" }}
              />
              <span
                className="text-[10px] font-bold tracking-[0.2em] uppercase px-2"
                style={{ color: "#7244a8" + "60" }}
              >
                หรือ
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "linear-gradient(to left, transparent, #7244a820)" }}
              />
            </div>
          )}

          {/* Abstain — centered pill, not spanning the full grid */}
          <div
            className="flex justify-center mb-8 md:mb-12 animate-stagger-card"
            style={{ animationDelay: `${(partyCount + 2) * 80}ms` }}
          >
            <div className="w-full max-w-sm">
              <AbstainCard
                abstainOption={specialOptions.abstain}
                isSelected={isAbstainSelected}
                onSelect={onSelect}
                variant={resolvedAbstainStyle}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
