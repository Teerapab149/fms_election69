"use client";

import { RotateCcw } from "lucide-react";
import { ELEMENT_PRESETS, PRESET_NAMES } from "./elementRegistry";

// Compare currentConfig against a preset — true only if every preset key matches.
function isPresetActive(currentConfig, presetConfig) {
  if (!currentConfig || !presetConfig) return false;
  for (const [key, value] of Object.entries(presetConfig)) {
    const cur = currentConfig[key];
    if (typeof value === "string" && typeof cur === "string") {
      if (cur.toLowerCase() !== value.toLowerCase()) return false;
    } else if (cur !== value) {
      return false;
    }
  }
  return true;
}

export default function QuickStyleBar({
  elementId,
  currentConfig = {},
  onApplyPreset,
  onReset,
}) {
  const element = ELEMENT_PRESETS[elementId];
  if (!element) return null;

  const presets = element.presets || {};
  const presetKeys = Object.keys(PRESET_NAMES).filter((k) => presets[k]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presetKeys.map((key) => {
        const meta = PRESET_NAMES[key];
        const active = isPresetActive(currentConfig, presets[key]);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onApplyPreset?.(elementId, key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              active
                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800"
            }`}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: meta.color }}
            />
            {meta.name}
          </button>
        );
      })}

      {onReset && (
        <button
          type="button"
          onClick={() => onReset(elementId)}
          className="flex items-center gap-1 ml-auto text-xs text-slate-400 hover:text-[#8A2680] transition-colors"
          title="รีเซ็ต"
        >
          <RotateCcw className="w-3 h-3" />
          รีเซ็ต
        </button>
      )}
    </div>
  );
}
