"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Ban,
  UserX,
  CheckCircle2,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";

/* ---------------- utils ---------------- */

function getType(selectedParty) {
  if (!selectedParty) return "none";
  if (selectedParty.number === 0) return "abstain";
  if (selectedParty.number === -1) return "disapprove";
  return "approve";
}

const Label = React.memo(function Label({ selectedParty, variant }) {
  const type = getType(selectedParty);
  const isSingle = variant === "single";

  // กรณีนี้จะไม่เกิดขึ้นเพราะ Footer ซ่อนอยู่ แต่ใส่กันไว้
  if (!selectedParty) return null;

  if (type === "abstain") {
    return (
      <span
        className={
          isSingle
            ? "text-white/90 flex items-center gap-2 font-black"
            : "text-orange-600 flex items-center gap-2 font-bold"
        }
      >
        <Ban size={20} className={isSingle ? "text-white/70" : ""} /> งดออกเสียง
      </span>
    );
  }

  if (type === "disapprove") {
    return (
      <span
        className={
          isSingle
            ? "text-red-300 flex items-center gap-2 font-black"
            : "text-red-600 flex items-center gap-2 font-bold"
        }
      >
        <UserX size={20} /> ไม่รับรอง
      </span>
    );
  }

  // Vote for candidate
  return (
    <span
      className={
        isSingle
          ? "break-words font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
          : "text-[#4D2A67] break-words font-bold"
      }
    >
      <span className={isSingle ? "text-[var(--party-gold)] mr-2" : "text-slate-500 mr-2"}>
        เบอร์ {selectedParty.number}
      </span>
      {selectedParty.name}
    </span>
  );
});

/* ---------------- component ---------------- */

export default function VoteFooter({
  selectedParty,
  onConfirm,
  isSubmitting,
  variant = "multi", // "single" | "multi"
  partyPrimary = "#4D2A67",
  partyGold = "#CDA176",
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // Reset popup if selection is cleared
  useEffect(() => {
    if (!selectedParty) setOpen(false);
  }, [selectedParty]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const canConfirm = !!selectedParty && !isSubmitting;
  // ✅ เช็คว่ามีค่าไหม เพื่อใช้ในการซ่อน/แสดง
  const isVisible = !!selectedParty;

  const selectedType = useMemo(() => getType(selectedParty), [selectedParty]);

  const handleOpenModal = useCallback(() => {
    if (!canConfirm) return;
    setOpen(true);
  }, [canConfirm]);

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onConfirm?.();
  }, [canConfirm, onConfirm]);

  const isSingle = variant === "single";

  /* ---------------- footer bar ---------------- */

  if (!mounted) return null;

  return (
    <>
      {isSingle && (
        <style jsx global>{`
          :root {
            --party-primary: ${partyPrimary};
            --party-gold: ${partyGold};
          }
        `}</style>
      )}

      {/* FOOTER BAR */}
      <div
        className={[
          "fixed bottom-0 left-0 right-0 z-[100000] transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)", // Cinematic easing
          // ✅ ถ้าไม่มี selection ให้ดันลงไปข้างล่าง (Hidden)
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-[150%] opacity-0 pointer-events-none",

          isSingle
            ? "p-4 md:p-6 pointer-events-none"
            : "bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        ].join(" ")}
      >
        <div
          className={[
            "mx-auto flex items-center justify-between gap-4 transition-all",
            isSingle
              ? "pointer-events-auto max-w-4xl w-full bg-[#0B0613]/85 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 pr-3 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
              : "max-w-7xl w-full px-4 py-3 md:py-4"
          ].join(" ")}
        >
          {/* Left: Info */}
          <div className="flex-1 min-w-0 pl-3">
            <p
              className={
                isSingle
                  ? "text-[9px] md:text-[10px] text-white/40 font-extrabold tracking-[0.2em] uppercase mb-1"
                  : "text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5"
              }
            >
              Your Selection
            </p>

            <div className="text-sm md:text-xl truncate">
              <Label selectedParty={selectedParty} variant={variant} partyGold={partyGold} />
            </div>
          </div>

          {/* Right: Button */}
          <button
            onClick={handleOpenModal}
            disabled={!canConfirm}
            className={[
              "shrink-0 flex items-center justify-center gap-2 font-bold transition-all duration-300 relative overflow-hidden",
              isSingle
                ? "rounded-2xl px-6 py-3.5 md:px-8 md:py-4 text-white text-sm tracking-wide shadow-lg border border-white/10"
                : "rounded-xl px-6 py-3 text-white text-sm md:text-base shadow-md min-w-[140px]",
              canConfirm
                ? isSingle
                  ? "hover:scale-[1.03] hover:shadow-[var(--party-gold)]/20 active:scale-95 bg-[#2a1b3d]" // Fallback color
                  : "bg-[#4D2A67] hover:bg-[#3d2152] hover:-translate-y-0.5"
                : "opacity-50 cursor-not-allowed bg-slate-400 grayscale"
            ].join(" ")}
            style={
              isSingle && canConfirm
                ? {
                  background: `linear-gradient(135deg, ${partyPrimary} 0%, ${partyPrimary} 30%, #2a1635 100%)`,
                  boxShadow: `0 0 20px -5px ${partyPrimary}`
                }
                : {}
            }
          >
            {isSingle && canConfirm && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
            )}

            {isSingle ? (
              <CheckCircle2 size={18} className={canConfirm ? "text-[var(--party-gold)]" : "text-white/50"} />
            ) : (
              <CheckCircle2 size={18} />
            )}

            <span>{isSingle ? "CONFIRM VOTE" : "ยืนยันการลงคะแนน"}</span>
          </button>
        </div>

        {/* Safe Area for iPhone Home Indicator */}
        <div className="h-[env(safe-area-inset-bottom)] w-full" />
      </div>

      {/* ---------------- POPUP CONFIRM (Modal) ---------------- */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => !isSubmitting && setOpen(false)}
            />

            {/* Modal Card */}
            <div
              className={[
                "relative w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-300",
                isSingle
                  ? "bg-[#120c1f] text-white border border-white/10 ring-1 ring-white/5"
                  : "bg-white text-slate-900 ring-1 ring-slate-100"
              ].join(" ")}
            >
              {/* Header */}
              <div className={`p-6 md:p-8 ${isSingle ? "bg-gradient-to-b from-white/5 to-transparent" : "bg-slate-50"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${isSingle ? "bg-[var(--party-gold)] animate-pulse" : "bg-green-500"}`} />
                      <span className={`text-[10px] font-black tracking-[0.25em] uppercase ${isSingle ? "text-white/50" : "text-slate-400"}`}>
                        Confirmation
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                      ยืนยันการลงคะแนน
                    </h3>
                  </div>
                  <button
                    onClick={() => !isSubmitting && setOpen(false)}
                    className={`p-2 rounded-full transition-colors ${isSingle ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-600"}`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 md:px-8 pb-8">
                <div className={`rounded-3xl p-5 mb-6 ${isSingle ? "bg-white/5 border border-white/5" : "bg-slate-50 border border-slate-100"}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isSingle ? "text-white/40" : "text-slate-400"}`}>
                    You have selected
                  </p>
                  <div className="text-base md:text-lg break-words overflow-hidden">
                    <Label selectedParty={selectedParty} variant={variant} />
                  </div>
                </div>

                <p className={`text-sm text-center font-medium mb-6 ${isSingle ? "text-white/60" : "text-slate-500"}`}>
                  {selectedType === "approve"
                    ? <>เมื่อยืนยันแล้วจะไม่สามารถแก้ไขผลได้อีก<br />กรุณาตรวจสอบความถูกต้อง</>
                    : "คุณกำลังเลือกที่จะไม่รับรอง หรือ งดออกเสียง กรุณายืนยันการตัดสินใจ"}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                    className={`py-3.5 rounded-2xl font-bold text-sm transition-all ${isSingle
                      ? "bg-transparent border border-white/10 hover:bg-white/5 text-white/70"
                      : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                  >
                    แก้ไข
                  </button>

                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className={`py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${isSingle
                      ? "text-[#0B0613]"
                      : "bg-[#4D2A67] text-white"
                      }`}
                    style={isSingle ? {
                      background: `linear-gradient(135deg, ${partyGold} 0%, #E6C6A0 100%)`
                    } : {}}
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> ยืนยัน
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}