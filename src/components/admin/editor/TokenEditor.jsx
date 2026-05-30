"use client";

// Day 11 Tier 1: Theme Token Editor (Layer 1).
//
// Edits the active template's 15 Layer 1 tokens (--color-*, --radius-*,
// --shadow-*, --font-*). Editing a token changes the WHOLE page at once
// (VISION Pillar 3 Tier 1). Stored as a sparse override map in
// useEditorState.themeTokens; cascade at render: override > template token.
//
// Self-contained collapsible card, Tailwind-only, reuses SharedInputs.
// Each row shows the current value (override ?? template default) and a
// per-token reset dot when overridden; a global "reset all" clears them.

import { useState } from "react";
import { Palette, ChevronDown, RotateCcw } from "lucide-react";
import { ColorPickerInput, TextInput } from "./controls/SharedInputs";

// Token metadata — drives the grouped UI. Keys must match the 15 Layer 1
// tokens declared in every built-in template's theme.tokens (ADR-001 / D9).
const TOKEN_GROUPS = [
  {
    label: "สี (Colors)",
    tokens: [
      { key: "--color-primary", label: "หลัก (Primary)", type: "color" },
      { key: "--color-accent", label: "รอง (Accent)", type: "color" },
      { key: "--color-bg", label: "พื้นหลัง (Background)", type: "color" },
      { key: "--color-surface", label: "พื้นการ์ด (Surface)", type: "color" },
      { key: "--color-text", label: "ตัวอักษร (Text)", type: "color" },
      { key: "--color-text-muted", label: "ตัวอักษรรอง (Muted)", type: "color" },
      { key: "--color-border", label: "เส้นขอบ (Border)", type: "color" },
    ],
  },
  {
    label: "มุมโค้ง (Radius)",
    tokens: [
      { key: "--radius-sm", label: "เล็ก (sm)", type: "text" },
      { key: "--radius-md", label: "กลาง (md)", type: "text" },
      { key: "--radius-card", label: "การ์ด (card)", type: "text" },
      { key: "--radius-button", label: "ปุ่ม (button)", type: "text" },
    ],
  },
  {
    label: "เงา (Shadow)",
    tokens: [
      { key: "--shadow-card", label: "เงาการ์ด (card)", type: "text" },
      { key: "--shadow-button", label: "เงาปุ่ม (button)", type: "text" },
    ],
  },
  {
    label: "ฟอนต์ (Font)",
    tokens: [
      { key: "--font-display", label: "หัวข้อ (Display)", type: "font" },
      { key: "--font-body", label: "เนื้อหา (Body)", type: "font" },
    ],
  },
];

const FONT_OPTIONS = [
  "Inter, system-ui, sans-serif",
  "'Poppins', system-ui, sans-serif",
  "'Sarabun', system-ui, sans-serif",
  "'Prompt', system-ui, sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Courier New', monospace",
];

function FontSelect({ label, value, onChange }) {
  const current = value || FONT_OPTIONS[0];
  const known = FONT_OPTIONS.includes(current);
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500 mb-1">{label}</p>
      <select
        value={known ? current : "__custom"}
        onChange={(e) => e.target.value !== "__custom" && onChange?.(e.target.value)}
        className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#8A2680] bg-white"
        style={{ fontFamily: current }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f}>{f.split(",")[0].replace(/'/g, "")}</option>
        ))}
        {!known && <option value="__custom">{current.split(",")[0]}</option>}
      </select>
    </div>
  );
}

export default function TokenEditor({
  tokens = {},          // active template's base tokens (the 15 defaults)
  overrides = {},       // admin's sparse overrides (useEditorState.themeTokens)
  onSetToken,           // (key, value) => void
  onResetToken,         // (key) => void
  onResetAll,           // () => void
}) {
  const [open, setOpen] = useState(true);
  const overrideCount = Object.keys(overrides).length;

  const valueOf = (key) => (key in overrides ? overrides[key] : tokens[key]) || "";
  const isOverridden = (key) => key in overrides;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 text-left min-w-0 flex-1 group"
        >
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 text-purple-600 p-2.5 rounded-xl shrink-0">
            <Palette className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              ธีมสี / Theme Tokens
              {overrideCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-[#8A2680] px-1.5 py-0.5 rounded-full">
                  {overrideCount}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ปรับสี/ฟอนต์/มุมโค้งทั้งเว็บพร้อมกัน (Layer 1)
            </p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {overrideCount > 0 && (
          <button
            type="button"
            onClick={() => onResetAll?.()}
            className="ml-2 shrink-0 flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-[#8A2680] transition-colors"
            title="คืนค่าทั้งหมดเป็น Template"
          >
            <RotateCcw className="w-3 h-3" />
            คืนค่า
          </button>
        )}
      </div>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-4">
          {TOKEN_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                {group.label}
              </p>
              <div className={group.tokens[0].type === "color" ? "grid grid-cols-2 gap-x-4 gap-y-3" : "space-y-3"}>
                {group.tokens.map((t) => (
                  <div key={t.key} className="relative">
                    {/* override marker + per-token reset */}
                    {isOverridden(t.key) && (
                      <button
                        type="button"
                        onClick={() => onResetToken?.(t.key)}
                        title="คืนค่า token นี้"
                        className="absolute -left-2 top-0 w-2 h-2 rounded-full bg-[#8A2680] hover:scale-150 transition-transform"
                      />
                    )}
                    {t.type === "color" && (
                      <ColorPickerInput
                        label={t.label}
                        value={valueOf(t.key)}
                        onChange={(v) => onSetToken?.(t.key, v)}
                      />
                    )}
                    {t.type === "text" && (
                      <TextInput
                        label={t.label}
                        value={valueOf(t.key)}
                        onChange={(v) => onSetToken?.(t.key, v)}
                      />
                    )}
                    {t.type === "font" && (
                      <FontSelect
                        label={t.label}
                        value={valueOf(t.key)}
                        onChange={(v) => onSetToken?.(t.key, v)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
