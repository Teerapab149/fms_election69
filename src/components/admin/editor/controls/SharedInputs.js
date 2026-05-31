"use client";

import React, { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const COLOR_PRESETS = [
  "#8A2680",
  "#7C3AED",
  "#2563EB",
  "#059669",
  "#DC2626",
  "#F59E0B",
  "#EC4899",
  "#1E293B",
];

const SIZE_OPTIONS = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
const RADIUS_OPTIONS = ["none", "md", "xl", "2xl", "full"];

function FieldLabel({ children }) {
  return (
    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
      {children}
    </label>
  );
}

export function ColorPickerInput({ label, value, onChange }) {
  const current = value || "#8A2680";
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex items-center gap-2 h-9">
        <div className="relative w-9 h-9 rounded-lg border border-slate-200 overflow-hidden shrink-0">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: current }}
          />
          <input
            type="color"
            value={current}
            onChange={(e) => onChange?.(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <input
          type="text"
          value={current}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 h-9 px-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#8A2680]"
        />
      </div>
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange?.(c)}
            className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 ${
              current?.toLowerCase() === c.toLowerCase()
                ? "border-slate-700 ring-1 ring-slate-400"
                : "border-slate-200"
            }`}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  );
}

export function SizeSelect({ label, value, onChange, options = SIZE_OPTIONS }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <select
        value={value || options[0]}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#8A2680]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleSwitch({ label, value, onChange }) {
  const on = value !== false;
  return (
    <div className="flex items-center justify-between h-9">
      {label && (
        <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      )}
      <button
        type="button"
        onClick={() => onChange?.(!on)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          on ? "bg-[#8A2680]" : "bg-slate-300"
        }`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#8A2680]"
      />
    </div>
  );
}

export function AlignSelect({ label, value, onChange }) {
  const options = [
    { key: "left", icon: AlignLeft },
    { key: "center", icon: AlignCenter },
    { key: "right", icon: AlignRight },
  ];
  const current = value || "left";
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex gap-1 h-9">
        {options.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            className={`flex-1 h-9 flex items-center justify-center rounded-lg border transition-colors ${
              current === key
                ? "border-[#8A2680] bg-[#8A2680]/10 text-[#8A2680]"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function RadiusSelect({ label, value, onChange }) {
  return (
    <SizeSelect
      label={label}
      value={value}
      onChange={onChange}
      options={RADIUS_OPTIONS}
    />
  );
}

export function PaddingSlider({ label, value, onChange, min = 2, max = 16, step = 2 }) {
  const current = Number.isFinite(value) ? value : min;
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <FieldLabel>{label}</FieldLabel>
          <span className="text-[10px] font-mono text-slate-500">{current}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="w-full h-9 accent-[#8A2680]"
      />
    </div>
  );
}

export function WeightToggle({ label, value, onChange }) {
  const options = [
    { key: "400", label: "ปกติ" },
    { key: "700", label: "หนา" },
    { key: "900", label: "หนามาก" },
  ];
  const current = String(value || "400");
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex gap-1 h-9">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange?.(o.key)}
            className={`flex-1 h-9 text-[11px] font-semibold rounded-lg border transition-colors ${
              current === o.key
                ? "border-[#8A2680] bg-[#8A2680]/10 text-[#8A2680]"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Pillar 3 Tier 2 — visual builders ──────────────────────────────────────
// All fully controlled (value in, string out). Vars store CSS strings, so px
// controls emit "<n>px", gradient emits a linear-gradient() string, shadow a
// box-shadow string. Empty value → control shows sensible defaults but emits
// nothing until the admin acts (matches Day 11 override-or-empty, P-LOG-054).

// A labeled <select>. options = string[] or [{value,label}].
export function SelectInput({ label, value, onChange, options = [] }) {
  const norm = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <select
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#8A2680]"
      >
        {norm.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Range slider that emits a "<n>px" STRING (vars store "32px", not numbers).
export function PxSlider({ label, value, onChange, min = 0, max = 64, step = 1 }) {
  const num = parseInt(value, 10);
  const current = Number.isFinite(num) ? num : min;
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <FieldLabel>{label}</FieldLabel>
          <span className="text-[10px] font-mono text-slate-500">{current}px</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange?.(`${e.target.value}px`)}
        className="w-full h-9 accent-[#8A2680]"
      />
    </div>
  );
}

const GRADIENT_DIRECTIONS = [
  { value: "to right", label: "→" },
  { value: "to bottom right", label: "↘" },
  { value: "to bottom", label: "↓" },
];

// Best-effort parse of a linear-gradient string into { dir, stops }. Bails to
// null on function-valued stops (rgb/var) since commas inside them break a
// naive split — the picker then falls back to its defaults.
function parseGradient(str) {
  if (typeof str !== "string") return null;
  const m = str.match(/^linear-gradient\(\s*(to [a-z ]+|[\d.]+deg)\s*,\s*(.+)\)\s*$/i);
  if (!m) return null;
  if (/\b(rgb|rgba|hsl|hsla|var)\s*\(/i.test(m[2])) return null;
  const stops = m[2]
    .split(",")
    .map((s) => s.trim().replace(/\s+[\d.]+%$/, ""))
    .filter(Boolean);
  return { dir: m[1].trim(), stops };
}

// Gradient builder: direction + 2–3 color stops + on/off. Emits a
// linear-gradient() string, or "none" when off.
export function GradientPicker({ label, value, onChange }) {
  const isNone = !value || value === "none";
  const parsed = !isNone ? parseGradient(value) : null;
  const dir = parsed?.dir || "to right";
  const stops = (parsed?.stops?.length ? parsed.stops : ["#8A2680", "#C026D3"]).slice(0, 3);

  const emit = (nextDir, nextStops) =>
    onChange?.(`linear-gradient(${nextDir}, ${nextStops.filter(Boolean).join(", ")})`);
  const setStop = (i, c) => {
    const n = [...stops];
    n[i] = c;
    emit(dir, n);
  };
  const addStop = () => stops.length < 3 && emit(dir, [...stops, "#ffffff"]);
  const removeStop = (i) => stops.length > 2 && emit(dir, stops.filter((_, idx) => idx !== i));

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex gap-1">
          {GRADIENT_DIRECTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => emit(d.value, stops)}
              className={`w-7 h-7 text-xs rounded-md border transition-colors ${
                !isNone && dir === d.value
                  ? "border-[#8A2680] bg-[#8A2680]/10 text-[#8A2680]"
                  : "border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange?.(isNone ? `linear-gradient(${dir}, ${stops.join(", ")})` : "none")}
          className={`text-[10px] font-semibold px-2 h-7 rounded-md border transition-colors ${
            isNone
              ? "border-slate-200 text-slate-400 hover:border-slate-300"
              : "border-[#8A2680] text-[#8A2680]"
          }`}
        >
          {isNone ? "เปิด" : "ปิด"}
        </button>
      </div>
      {!isNone && (
        <>
          <div
            className="h-8 rounded-lg border border-slate-200 mb-1.5"
            style={{ backgroundImage: value }}
          />
          <div className="space-y-1.5">
            {stops.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="relative w-7 h-7 rounded-md border border-slate-200 overflow-hidden shrink-0">
                  <div className="absolute inset-0" style={{ backgroundColor: c }} />
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => setStop(i, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <input
                  type="text"
                  value={c}
                  onChange={(e) => setStop(i, e.target.value)}
                  className="flex-1 h-7 px-2 text-[11px] font-mono border border-slate-200 rounded-md focus:outline-none focus:border-[#8A2680]"
                />
                {stops.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeStop(i)}
                    className="text-slate-300 hover:text-rose-500 px-1 text-base leading-none"
                    aria-label="ลบสี"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {stops.length < 3 && (
            <button
              type="button"
              onClick={addStop}
              className="mt-1.5 text-[10px] text-[#8A2680] font-semibold hover:underline"
            >
              + เพิ่มสี
            </button>
          )}
        </>
      )}
    </div>
  );
}

function hexToRgba(hex, alpha) {
  let h = String(hex || "").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Parse "Xpx Ypx Bpx <color>" → numeric offsets + hex + alpha (color
// round-trip is best-effort; rgba parses back, named colors fall back).
function parseShadow(str) {
  if (typeof str !== "string" || !str.trim() || str.trim() === "none") return null;
  const m = str.trim().match(/^(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+)$/);
  if (!m) return null;
  const colorStr = m[4].trim();
  let hex = "#000000";
  let alpha = 1;
  const rgba = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/i);
  if (rgba) {
    alpha = rgba[4] !== undefined ? parseFloat(rgba[4]) : 1;
    hex = "#" + [rgba[1], rgba[2], rgba[3]].map((v) => parseInt(v, 10).toString(16).padStart(2, "0")).join("");
  } else if (/^#[0-9a-f]{3,8}$/i.test(colorStr)) {
    hex = colorStr;
  }
  return { x: +m[1], y: +m[2], blur: +m[3], hex, alpha };
}

const SHADOW_PRESETS = [
  { key: "none", label: "ไม่มี", value: "none" },
  { key: "soft", label: "นุ่ม", value: "0px 10px 15px rgba(0, 0, 0, 0.15)" },
  { key: "hard", label: "คม", value: "5px 5px 0px rgba(0, 0, 0, 1)" },
];

// Box-shadow builder: presets + X/Y/blur sliders + color + opacity. Emits a
// "<x>px <y>px <blur>px rgba(...)" string, or "none".
export function ShadowControl({ label, value, onChange }) {
  const isNone = !value || value === "none";
  const p = parseShadow(value) || { x: 0, y: 6, blur: 16, hex: "#000000", alpha: 0.2 };
  const emit = (next) => {
    const s = { ...p, ...next };
    onChange?.(`${s.x}px ${s.y}px ${s.blur}px ${hexToRgba(s.hex, s.alpha)}`);
  };
  const sliders = [
    ["x", "X", -20, 20],
    ["y", "Y", -20, 20],
    ["blur", "Blur", 0, 40],
  ];
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex gap-1 mb-2">
        {SHADOW_PRESETS.map((pr) => (
          <button
            key={pr.key}
            type="button"
            onClick={() => onChange?.(pr.value)}
            className={`flex-1 h-7 text-[10px] font-semibold rounded-md border transition-colors ${
              pr.value === "none" && isNone
                ? "border-[#8A2680] bg-[#8A2680]/10 text-[#8A2680]"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {pr.label}
          </button>
        ))}
      </div>
      {!isNone && (
        <div className="space-y-2">
          {sliders.map(([k, lbl, mn, mx]) => (
            <div key={k}>
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500">{lbl}</span>
                <span className="text-[10px] font-mono text-slate-400">{p[k]}px</span>
              </div>
              <input
                type="range"
                min={mn}
                max={mx}
                value={p[k]}
                onChange={(e) => emit({ [k]: +e.target.value })}
                className="w-full h-6 accent-[#8A2680]"
              />
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="relative w-7 h-7 rounded-md border border-slate-200 overflow-hidden shrink-0">
              <div className="absolute inset-0" style={{ backgroundColor: p.hex }} />
              <input
                type="color"
                value={p.hex}
                onChange={(e) => emit({ hex: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500">ความเข้ม</span>
                <span className="text-[10px] font-mono text-slate-400">{Math.round(p.alpha * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(p.alpha * 100)}
                onChange={(e) => emit({ alpha: +e.target.value / 100 })}
                className="w-full h-6 accent-[#8A2680]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

