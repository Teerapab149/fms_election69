"use client";

// The certification window (F1, SECURITY-AUDIT-2026-11).
//
// The chain check and the three totals that certification runs cannot see a
// vote moved from one party to another when the total stays the same. Only the
// offline recount with the private key (scripts/decrypt-recount.js) can, so
// certifying now needs its per-option numbers, typed in here; the server
// refuses unless every one equals Candidate.score (checkRecount in
// src/lib/certificationRecord.js).
//
// The boxes start empty and the window never shows the scores the system
// holds: a number copied from the screen would pass the check without anyone
// having run the recount.

import { useEffect, useId, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { getPath } from "../../../utils/basePath";

const DIGITS = /^\d+$/;

// Same words as the server's refusal (api/admin/dashboard, ANONYMIZE_BALLOTS).
// Shown up front so a committee member is not asked for every number only to
// be refused; the server still checks the role and answers 403 either way.
export const STAFF_ONLY_MESSAGE = "รับรองผลได้เฉพาะบัญชีเจ้าหน้าที่คณะเท่านั้น ให้เจ้าหน้าที่เข้าสู่ระบบด้วยบัญชีของตนเองแล้วกดรับรอง";

function optionLabel(c) {
  return c.number > 0 ? `เบอร์ ${c.number} ${c.name}` : c.name;
}

export default function CertifyModal({ isOpen, onClose, onConfirm, isLoading = false }) {
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState({});
  const [role, setRole] = useState(null);
  const idBase = useId();

  useEffect(() => {
    if (!isOpen) {
      setValues({});
      return undefined;
    }
    let cancelled = false;
    setOptions(null);
    setLoadError("");
    setRole(null);
    fetch(getPath("/api/admin/me"), { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) setRole(data?.user?.role || ""); })
      .catch(() => { if (!cancelled) setRole(""); });
    fetch(getPath("/api/admin/dashboard"), { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled) return;
        // number + name only: the score must not reach this window
        const list = (data?.candidates || []).map((c) => ({ number: c.number, name: c.name }));
        list.sort((a, b) => (a.number <= 0 && b.number > 0 ? 1 : b.number <= 0 && a.number > 0 ? -1 : a.number - b.number));
        setOptions(list);
      })
      .catch((e) => { if (!cancelled) setLoadError(`โหลดรายการตัวเลือกไม่สำเร็จ (${e.message}) ปิดหน้าต่างแล้วลองใหม่`); });
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  // role "" = unknown (the lookup failed): show the form and let the server decide
  const notStaff = role !== null && role !== "" && role !== "STAFF";
  const filled = !notStaff && !!options && options.length > 0 && options.every((c) => DIGITS.test((values[c.number] ?? "").trim()));

  const submit = () => {
    if (!filled || isLoading) return;
    const recount = Object.fromEntries(options.map((c) => [String(c.number), Number(values[c.number].trim())]));
    onConfirm(recount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`${idBase}-title`}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        <div className="flex items-start gap-3 p-5 sm:p-6 border-b border-gray-100">
          <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-red-100 text-red-600">
            <AlertTriangle className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id={`${idBase}-title`} className="text-lg font-bold text-gray-900">รับรองผลอย่างเป็นทางการ</h3>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              กรอกคะแนนของทุกตัวเลือกจากผลนับซ้ำด้วยกุญแจส่วนตัว (คำสั่ง <code className="text-xs bg-gray-100 px-1 rounded">decrypt-recount.js</code> ส่วน
              &quot;ตัวเลขสำหรับกรอกในหน้ารับรองผล&quot;) ห้ามคัดลอกจากหน้าผลคะแนน
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isLoading} className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50" aria-label="ปิด">
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {notStaff && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">{STAFF_ONLY_MESSAGE}</p>
          )}
          {!notStaff && loadError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loadError}</p>}
          {!notStaff && !options && !loadError && (
            <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" aria-hidden /> กำลังโหลดรายการตัวเลือก</p>
          )}
          {!notStaff && options && (
            <div className="space-y-2">
              {options.map((c) => {
                const v = values[c.number] ?? "";
                const bad = v.trim() !== "" && !DIGITS.test(v.trim());
                const inputId = `${idBase}-n${c.number}`;
                return (
                  <div key={c.number} className="flex items-center gap-3">
                    <label htmlFor={inputId} className="flex-1 min-w-0 text-sm text-gray-800 break-words">{optionLabel(c)}</label>
                    <input
                      id={inputId}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={v}
                      onChange={(e) => setValues((prev) => ({ ...prev, [c.number]: e.target.value }))}
                      aria-invalid={bad || undefined}
                      className={`w-24 shrink-0 rounded-lg border px-3 py-2 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#8A2680]/40 ${bad ? "border-red-400" : "border-gray-300"}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ระบบจะตรวจโซ่บัตร เทียบจำนวนบัตรกับคะแนนและผู้ลงคะแนน แล้วเทียบตัวเลขที่กรอกกับคะแนนในระบบทีละตัวเลือก
            ถ้าไม่ตรงแม้ตัวเดียวจะรับรองไม่ได้ ถ้าผ่านจะบันทึกตัวเลขที่รับรองไว้ให้เก็บสำเนา และกดแล้วย้อนกลับไม่ได้
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end p-5 sm:p-6 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            ยกเลิก
          </button>
          {!notStaff && (
            <button
              type="button"
              onClick={submit}
              disabled={!filled || isLoading}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              ยืนยันรับรองผล
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
