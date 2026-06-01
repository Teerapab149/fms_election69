"use client";

// Day 11 Tier 2 → Pillar 3: per-element Layer 2 var editor (no-code depth).
//
// Overrides the selected element's Layer 2 vars (--btn-*, --banner-*) for the
// current template — changes ONLY this element, unlike the Tier 1 token editor
// which recolors the whole page (VISION Pillar 3 Tier 2). Stored sparse in
// useEditorState.elementVars[id]; cascade: elementVars[id][k] > template
// elements[id].vars[k] > Layer 1 token.
//
// Pillar 3: the schema is grouped + surfaces ALL 17 voteCTA-button vars (was 6)
// with visual builders (gradient/shadow/px sliders) — no fake knobs, every key
// is declared in the templates (classic.js:269-287). Self-hides for elements
// without a schema entry. Mounted in PropertyPanel alongside the VariantPicker.

import { useState } from "react";
import { Info } from "lucide-react";
import { isStatefulElement } from "./elementCatalog";
import {
  ColorPickerInput,
  TextInput,
  GradientPicker,
  ShadowControl,
  PxSlider,
  SelectInput,
  WeightToggle,
} from "./controls/SharedInputs";

// Shared bg schema for the two stats sub-cards (same var keys; each resolves in
// its own [data-element] scope, so edits stay per-card). cfg.backgroundColor is
// unset on every template (Day 6) so these are live immediately — no masking.
const STATS_CARD_BG_SCHEMA = [
  {
    group: "พื้นหลัง · Background",
    vars: [
      { key: "--stats-card-bg", label: "สีพื้นหลัง", type: "color", owns: "backgroundColor" },
      { key: "--stats-card-bg-gradient", label: "ไล่สีพื้นหลัง", type: "gradient" },
    ],
  },
];

// Grouped schema. Each var's `type` selects the control. All keys below are
// real Layer 2 vars declared in the built-in templates.
const ELEMENT_VAR_SCHEMA = {
  "voteCTA-button": [
    {
      group: "หลัก · Core",
      vars: [
        { key: "--btn-bg", label: "พื้นหลัง (สีพื้น)", type: "color" },
        { key: "--btn-bg-gradient", label: "พื้นหลัง (ไล่สี)", type: "gradient" },
        { key: "--btn-text", label: "สีตัวอักษร", type: "color" },
        { key: "--btn-border-color", label: "สีขอบ", type: "color" },
        { key: "--btn-border-width", label: "ความหนาขอบ", type: "px", max: 8 },
        { key: "--btn-radius", label: "มุมโค้ง (Radius)", type: "text" },
        { key: "--btn-shadow", label: "เงา", type: "shadow" },
      ],
    },
    {
      group: "ขนาด · Sizing",
      vars: [
        { key: "--btn-padding-x", label: "ระยะซ้าย-ขวา", type: "px", max: 80 },
        { key: "--btn-padding-y", label: "ระยะบน-ล่าง", type: "px", max: 48 },
        { key: "--btn-font-size", label: "ขนาดตัวอักษร", type: "px", min: 10, max: 40 },
        { key: "--btn-font-weight", label: "ความหนาตัวอักษร", type: "weight" },
      ],
    },
    {
      group: "Hover",
      vars: [
        { key: "--btn-hover-bg", label: "พื้นหลังตอน hover", type: "color" },
        { key: "--btn-hover-shadow", label: "เงาตอน hover", type: "shadow" },
        { key: "--btn-hover-transform", label: "transform ตอน hover", type: "text" },
      ],
    },
    {
      group: "ตกแต่ง · Decoration",
      vars: [
        { key: "--btn-icon-color", label: "สีไอคอน", type: "color" },
        { key: "--btn-letter-spacing", label: "ระยะตัวอักษร", type: "text" },
        {
          key: "--btn-text-transform",
          label: "รูปแบบตัวพิมพ์",
          type: "select",
          options: [
            { value: "none", label: "ปกติ" },
            { value: "uppercase", label: "พิมพ์ใหญ่" },
            { value: "lowercase", label: "พิมพ์เล็ก" },
            { value: "capitalize", label: "ขึ้นต้นใหญ่" },
          ],
        },
      ],
    },
  ],
  "banner-section": [
    {
      group: "กรอบ · Frame",
      vars: [
        { key: "--banner-border", label: "สีเส้นขอบ", type: "color" },
        { key: "--banner-border-width", label: "ความหนาขอบ", type: "px", max: 8 },
        { key: "--banner-radius", label: "มุมโค้ง (Radius)", type: "text" },
        { key: "--banner-shadow", label: "เงา", type: "shadow" },
        { key: "--banner-bg", label: "พื้นหลัง (หลังรูป)", type: "color" },
      ],
    },
  ],
  "stats-progress-card": STATS_CARD_BG_SCHEMA,
  "stats-eligible-card": STATS_CARD_BG_SCHEMA,
  // Results page (first non-home element with Tier 2 vars). Both keys are
  // declared in classic.js and consumed by ResultsStatsBar's primary card.
  "results-stats-bar": [
    {
      group: "การ์ดคะแนนรวม · Total Card",
      vars: [
        { key: "--rsb-accent", label: "สีหลัก (เน้น)", type: "color" },
        { key: "--rsb-card-bg", label: "สีพื้นหลังการ์ด", type: "color" },
      ],
    },
  ],
  // Candidates page — tagline badge pill (pairs with the counter).
  // `owns` links a var to the Layer-3 cfg key it supersedes so PropertyPanel
  // hides the duplicate "ปรับเอง" picker (deconfliction — Tier-2 owns styling).
  "candidates-tagline": [
    {
      group: "ป้ายหัวข้อ · Tagline Pill",
      vars: [
        { key: "--ctl-accent", label: "สีไอคอน/ตัวอักษร", type: "color", owns: "textColor" },
        { key: "--ctl-bg", label: "สีพื้นหลัง", type: "color", owns: "backgroundColor" },
        { key: "--ctl-border", label: "สีขอบ", type: "color" },
      ],
    },
  ],
  // Candidates page — counter pill (icon + text + bg + border).
  "candidates-counter": [
    {
      group: "ป้ายจำนวนพรรค · Counter Pill",
      vars: [
        { key: "--cc-accent", label: "สีไอคอน/ตัวอักษร", type: "color", owns: "textColor" },
        { key: "--cc-bg", label: "สีพื้นหลัง", type: "color", owns: "backgroundColor" },
        { key: "--cc-border", label: "สีขอบ", type: "color" },
      ],
    },
  ],
  // Vote page — header badge (accent text). Tier-2 owns its colour; the
  // Layer-3 cfg.color default was removed from classic.js (deconfliction pilot).
  "vote-header-badge": [
    {
      group: "ป้ายหัวข้อหน้าโหวต · Header Badge",
      vars: [
        { key: "--vh-badge-color", label: "สีตัวอักษร", type: "color", owns: "color" },
      ],
    },
  ],
};

// Deconfliction helper: the set of Layer-3 `cfg` keys that a Tier-2 schema
// supersedes for an element. PropertyPanel uses this to hide the duplicate
// "ปรับเอง" colour pickers so a single surface (Tier-2) owns each property
// (resolves P-LOG-067 — Layer-3 cfg would otherwise mask the Tier-2 var).
export function getOwnedConfigKeys(elementId) {
  const schema = ELEMENT_VAR_SCHEMA[elementId];
  const owned = new Set();
  if (!schema) return owned;
  for (const group of schema) {
    for (const v of group.vars) {
      if (v.owns) owned.add(v.owns);
    }
  }
  return owned;
}

function VarControl({ field, value, onChange }) {
  switch (field.type) {
    case "color":
      return <ColorPickerInput label={field.label} value={value} onChange={onChange} />;
    case "gradient":
      return <GradientPicker label={field.label} value={value} onChange={onChange} />;
    case "shadow":
      return <ShadowControl label={field.label} value={value} onChange={onChange} />;
    case "px":
      return (
        <PxSlider
          label={field.label}
          value={value}
          onChange={onChange}
          min={field.min ?? 0}
          max={field.max ?? 64}
        />
      );
    case "weight":
      return <WeightToggle label={field.label} value={value} onChange={onChange} />;
    case "select":
      return <SelectInput label={field.label} value={value} onChange={onChange} options={field.options} />;
    default:
      return <TextInput label={field.label} value={value} onChange={onChange} />;
  }
}

function VarGroup({ group, defaultOpen, overrides, onSetVar, onResetVar }) {
  const [open, setOpen] = useState(defaultOpen);
  const overriddenCount = group.vars.filter((v) => v.key in overrides).length;
  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-[11px] font-bold text-slate-600">{group.group}</span>
        <span className="flex items-center gap-2">
          {overriddenCount > 0 && (
            <span className="text-[9px] font-bold text-[#8A2680] bg-[#8A2680]/10 rounded-full px-1.5 py-0.5">
              {overriddenCount}
            </span>
          )}
          <span className="text-slate-400 text-xs">{open ? "−" : "+"}</span>
        </span>
      </button>
      {open && (
        <div className="px-3 py-3 space-y-3">
          {group.vars.map((field) => (
            <div key={field.key} className="relative">
              {field.key in overrides && (
                <button
                  type="button"
                  onClick={() => onResetVar?.(field.key)}
                  title="คืนค่า Template"
                  className="absolute -left-1.5 top-0 w-2 h-2 rounded-full bg-[#8A2680] hover:scale-150 transition-transform z-10"
                />
              )}
              <VarControl
                field={field}
                value={overrides[field.key] || ""}
                onChange={(val) => onSetVar?.(field.key, val)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ElementVarsPanel({
  elementId,
  overrides = {},   // useEditorState.elementVars[elementId] || {}
  onSetVar,         // (varKey, value) => void
  onResetVar,       // (varKey) => void
}) {
  const schema = ELEMENT_VAR_SCHEMA[elementId];
  if (!schema) return null; // element has no curated Layer 2 vars

  // Stateful elements (voteCTA-button) hardcode bg/gradient/shadow/etc per state
  // in their Layer 3 config, which WINS over these Layer 2 vars (P-LOG-054). So
  // for them most knobs here act only as fallbacks — per-state look is edited in
  // the Stateful Gallery below. Be honest about it rather than ship dead knobs.
  const stateful = isStatefulElement(elementId);

  return (
    <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2.5">
        สไตล์เฉพาะ Element นี้ · Element Style (Layer 2)
      </p>
      {stateful && (
        <div className="flex items-start gap-1.5 rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-2 mb-2.5">
          <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-sky-700">
            Element นี้มีหลายสถานะ — <b>สี/ไล่สี/เงา</b> ของแต่ละสถานะแก้ที่ <b>แกลเลอรีสถานะ</b> ด้านล่าง
            ค่าตรงนี้ใช้เป็น fallback และคุมพวกตัวอักษร (letter-spacing / ตัวพิมพ์) ที่มีผลทุกสถานะ
          </p>
        </div>
      )}
      <div className="space-y-2">
        {schema.map((group, i) => (
          <VarGroup
            key={group.group}
            group={group}
            defaultOpen={i === 0}
            overrides={overrides}
            onSetVar={onSetVar}
            onResetVar={onResetVar}
          />
        ))}
      </div>
    </div>
  );
}
