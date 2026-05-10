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

