"use client";

// Element Library (Pillar 1, slice 1) — the "คลังสมบัติ" catalog browser.
//
// Shows every registered element TYPE grouped by category (registry.js), with a
// search filter, variant-count + stateful badges. Types that have >1 variant
// (today: voteCTA-button, banner-section) expand inline to the existing
// VariantPicker — LIVE mini-previews of the real variant components, and clicking
// applies the swap via editor.setElementVariant (no mock, no placeholder).
//
// Honest scope (slice 1): browse + variant-swap for multi-variant types. Most
// types are single-variant ("default") today; the library grows as devs author
// variants (VISION Pillar 1 — heritage). Dragging a NEW element onto a page
// (slot placement) is deferred — needs the slot architecture.

import { useState, useMemo } from "react";
import {
  Library, Search, ChevronDown, ChevronRight, Layers, Zap, X,
} from "lucide-react";
import { listCategories, listElementTypes } from "../../elements/registry.js";
import VariantPicker from "./VariantPicker.jsx";

// User-facing Thai category labels (the structural registry ids stay as keys).
const CATEGORY_TH = {
  action: "ปุ่ม / การกระทำ",
  "section-header": "แบนเนอร์ / หัวข้อใหญ่",
  "data-display": "ข้อมูล / ตัวเลข / เวลา",
  content: "ข้อความ / เนื้อหา",
  media: "รูปภาพ / การ์ด",
  navigation: "เมนู / นำทาง",
  layout: "เลย์เอาต์ / เส้นแบ่ง",
};

export default function ElementLibraryPanel({
  elementVariants = {},
  onSelectVariant,
  onResetVariant,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null); // typeId expanded for variants

  const categories = useMemo(() => listCategories(), []);
  const totalTypes = useMemo(() => listElementTypes().length, []);

  const q = query.trim().toLowerCase();
  const matches = (typeId, t) =>
    !q ||
    typeId.toLowerCase().includes(q) ||
    t.name.toLowerCase().includes(q) ||
    (t.description || "").toLowerCase().includes(q);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 p-4"
      >
        <div className="bg-purple-50 text-[#8A2680] p-2 rounded-lg">
          <Library className="h-5 w-5" />
        </div>
        <div className="text-left min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-700">คลัง Element</h3>
          <p className="text-[11px] text-slate-400">
            {totalTypes} ชนิด · แบ่งตามหมวด · หยิบ variant มาใช้ได้
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* search */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา element…"
              className="w-full pl-8 pr-7 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#8A2680] focus:ring-2 focus:ring-[#8A2680]/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3">
            {categories.map(([catId, cat]) => {
              const types = listElementTypes(catId).filter(([id, t]) => matches(id, t));
              if (!types.length) return null;
              return (
                <section key={catId}>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {CATEGORY_TH[catId] || cat.name}{" "}
                    <span className="text-slate-300">({types.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {types.map(([typeId, t]) => {
                      const multi = Array.isArray(t.variants) && t.variants.length > 1;
                      const isExpanded = expanded === typeId;
                      const overridden = !!elementVariants[typeId];
                      return (
                        <div
                          key={typeId}
                          className={`rounded-xl border transition-colors ${
                            isExpanded ? "border-[#8A2680]/40 bg-purple-50/30" : "border-slate-200 bg-white"
                          } ${multi ? "" : "opacity-90"}`}
                        >
                          <button
                            type="button"
                            disabled={!multi}
                            onClick={() => multi && setExpanded(isExpanded ? null : typeId)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left ${multi ? "cursor-pointer" : "cursor-default"}`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700 truncate">{t.name}</span>
                                {overridden && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A2680] shrink-0" title="มีการปรับ variant" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                  multi ? "text-[#8A2680] bg-purple-50" : "text-slate-400 bg-slate-50"
                                }`}>
                                  <Layers className="w-2.5 h-2.5" />
                                  {t.variants.length} รูปแบบ
                                </span>
                                {t.stateful && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                    <Zap className="w-2.5 h-2.5" />
                                    ตามสถานะ
                                  </span>
                                )}
                              </div>
                            </div>
                            {multi && (
                              <ChevronRight className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            )}
                          </button>

                          {multi && isExpanded && (
                            <div className="border-t border-slate-100">
                              <VariantPicker
                                elementId={typeId}
                                currentVariant={elementVariants[typeId]}
                                onSelect={(v) => onSelectVariant?.(typeId, v)}
                                onReset={() => onResetVariant?.(typeId)}
                                isOverridden={overridden}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
            ชนิดที่มี “รูปแบบเดียว” จะมี variant เพิ่มขึ้นเมื่อ dev สร้างเพิ่ม —
            คลังจะโตขึ้นทุกปี (มรดกตกทอด)
          </p>
        </div>
      )}
    </div>
  );
}
