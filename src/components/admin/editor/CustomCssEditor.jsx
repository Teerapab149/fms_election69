"use client";

// Pillar 3 Tier 3 — per-element custom CSS (Layer 3), the expert escape hatch
// (VISION: "Tier 3 Advanced CSS — custom CSS textarea, warning เก็บเฉพาะ dev").
//
// The textarea holds DECLARATIONS only (e.g. `transform: rotate(-2deg);`). At
// render time buildElementCss wraps them as `.fms-app [data-element=id]{...}`
// in both the editor preview and the live page. Stored sparse in
// useEditorState.elementCss[id]; cascade sits on top of variant + tokens + vars.
//
// Collapsed by default — it's advanced. Mounted in PropertyPanel after the
// ElementVarsPanel. Self-hides when no element is selected.

import { useState } from "react";
import { AlertTriangle, Code2 } from "lucide-react";

export default function CustomCssEditor({
  elementId,
  value = "",        // useEditorState.elementCss[elementId] || ""
  onChange,          // (css) => void
}) {
  const [open, setOpen] = useState(false);
  if (!elementId) return null;

  return (
    <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <Code2 className="w-3 h-3" />
          ขั้นสูง · Custom CSS (Layer 3)
        </span>
        <span className="flex items-center gap-1.5">
          {value?.trim() && (
            <span className="w-2 h-2 rounded-full bg-[#8A2680]" title="มี CSS กำหนดเอง" />
          )}
          <span className="text-slate-400 text-xs">{open ? "−" : "+"}</span>
        </span>
      </button>

      {open && (
        <div className="mt-2.5 space-y-2">
          <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-amber-700">
              สำหรับ dev เท่านั้น — ใส่เฉพาะ <span className="font-mono">property: value;</span> (ไม่ต้องใส่ selector หรือปีกกา)
              ระบบจะครอบ scope ให้เฉพาะ element นี้
            </p>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            spellCheck={false}
            rows={5}
            placeholder={"transform: rotate(-2deg);\nopacity: 0.9;"}
            className="w-full px-2.5 py-2 text-[11px] font-mono leading-relaxed border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#8A2680] focus:bg-white resize-y"
          />
          {value?.trim() && (
            <button
              type="button"
              onClick={() => onChange?.("")}
              className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold"
            >
              ล้าง CSS
            </button>
          )}
        </div>
      )}
    </div>
  );
}
