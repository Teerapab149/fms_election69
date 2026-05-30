"use client";

// Day 11 Tier 2: per-element Layer 2 var editor.
//
// Overrides the selected element's Layer 2 vars (--btn-*, --banner-*) for the
// current template — changes ONLY this element, unlike the Tier 1 token editor
// which recolors the whole page (VISION Pillar 3 Tier 2). Stored sparse in
// useEditorState.elementVars[id]; cascade: elementVars[id][k] > template
// elements[id].vars[k] > Layer 1 token.
//
// Curated subset per element (audit Q3) — not every var is user-facing in Day 11.
// Self-hides for elements without a schema entry. Mounted in PropertyPanel
// alongside the Day 10 VariantPicker.

import { ColorPickerInput, TextInput } from "./controls/SharedInputs";

const ELEMENT_VAR_SCHEMA = {
  "voteCTA-button": [
    { key: "--btn-bg", label: "พื้นหลัง (BG)", type: "color" },
    { key: "--btn-text", label: "ตัวอักษร (Text)", type: "color" },
    { key: "--btn-border-color", label: "สีขอบ (Border)", type: "color" },
    { key: "--btn-radius", label: "มุมโค้ง (Radius)", type: "text" },
    { key: "--btn-shadow", label: "เงา (Shadow)", type: "text" },
    { key: "--btn-padding-x", label: "ระยะซ้าย-ขวา (Padding X)", type: "text" },
  ],
  "banner-section": [
    { key: "--banner-bg", label: "พื้นหลัง (BG)", type: "color" },
    { key: "--banner-border", label: "สีเส้น (Border)", type: "color" },
    { key: "--banner-radius", label: "มุมโค้ง (Radius)", type: "text" },
  ],
};

export default function ElementVarsPanel({
  elementId,
  overrides = {},   // useEditorState.elementVars[elementId] || {}
  onSetVar,         // (varKey, value) => void
  onResetVar,       // (varKey) => void
}) {
  const schema = ELEMENT_VAR_SCHEMA[elementId];
  if (!schema) return null; // element has no curated Layer 2 vars

  const isOverridden = (key) => key in overrides;

  return (
    <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2.5">
        สไตล์เฉพาะปุ่มนี้ · Element Style (Layer 2)
      </p>
      <div className="space-y-3">
        {schema.map((v) => (
          <div key={v.key} className="relative">
            {isOverridden(v.key) && (
              <button
                type="button"
                onClick={() => onResetVar?.(v.key)}
                title="คืนค่า"
                className="absolute -left-2 top-0 w-2 h-2 rounded-full bg-[#8A2680] hover:scale-150 transition-transform z-10"
              />
            )}
            {v.type === "color" ? (
              <ColorPickerInput
                label={v.label}
                value={overrides[v.key] || ""}
                onChange={(val) => onSetVar?.(v.key, val)}
              />
            ) : (
              <TextInput
                label={v.label}
                value={overrides[v.key] || ""}
                onChange={(val) => onSetVar?.(v.key, val)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
