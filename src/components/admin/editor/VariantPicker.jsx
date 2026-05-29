"use client";

// Day 10: VariantPicker — per-element variant swap UI with live mini-previews.
//
// Renders one card per registered variant of the selected element type
// (registry.js → getElementType(id).variants). Each card is a LIVE mini-render
// of the actual variant component (Canva-grade UX, ADR-001 v1.2 / Q1 decision),
// not a static thumbnail. Clicking a card selects that variant; a "reset" link
// clears the admin override so the element re-inherits the template default.
//
// Mounted by PropertyPanel ABOVE the stateful-vs-flat branch (audit Q5) so it
// works for both stateful (voteCTA-button) and flat (banner-section) elements.
// Hidden automatically when an element has < 2 variants.
//
// Live-preview contract (per CLAUDE.md Rule 9 — variant identity hardcoded):
//   - Each variant component renders root with data-element="X" and reads its
//     Layer 2 vars (--btn-*, --banner-*) + Layer 1 tokens (--color-*) from the
//     nearest ancestor that declares them.
//   - The admin editor panel is NOT inside a template's .fms-app scope, so we
//     declare a self-contained PREVIEW_VARS scope on each card (classic flavor).
//     The preview therefore shows "this variant on classic's tokens" — exactly
//     the documented behavior (spec KEY DESIGN). Variant identity (hard border,
//     pill outline, gradient fill) is hardcoded in each component, so the cards
//     visually differ even though they share the same token scope.

import { getElementType, getDefaultVariant } from "../../elements/registry.js";
import { getVoteCTAVariant } from "../../elements/voteCTA-button";
import { getBannerVariant } from "../../elements/banner-section";

// Element ID → its variant resolver. Add entries as more element types adopt
// the variant pattern (Day 12+). An element absent here renders no picker.
const VARIANT_RESOLVERS = {
  "voteCTA-button": getVoteCTAVariant,
  "banner-section": getBannerVariant,
};

// Representative mock data for the live previews. voteCTA derives its visual
// state from `data` — this shape resolves to the "notVoted" state (the most
// representative: logged-in, election open, not yet voted). banner ignores
// `data` and renders its slideshow frame from resolvedTemplate/elementConfigs
// (both null here → default frame), so one MOCK_DATA serves both contracts.
const MOCK_DATA = {
  session: { user: { name: "preview" } },
  isVotedReal: false,
  isCheckingVoted: false,
  initialData: {
    systemMode: "AUTO",
    electionStatus: "ONGOING",
    isSystemOpen: true,
  },
};

// Self-contained token scope for the previews (classic template flavor).
// Layer 1 tokens + Layer 2 element vars, mirroring builtIn/classic.js so the
// previews render faithfully regardless of the editor's ancestry. Layer 2 vars
// reference Layer 1 via var() — valid because both are declared on the same
// element (custom properties resolve against the element's own computed set).
const PREVIEW_VARS = {
  // Layer 1
  "--color-primary": "#8A2680",
  "--color-accent": "#9333EA",
  "--color-bg": "#F8F9FD",
  "--color-surface": "#ffffff",
  "--color-text": "#1a1a2e",
  "--color-text-muted": "#64748b",
  "--color-border": "#e2e8f0",
  "--radius-card": "24px",
  "--radius-button": "9999px",
  "--shadow-button": "0 4px 12px rgba(138,38,128,0.25)",
  // Layer 2 — voteCTA-button
  "--btn-bg": "var(--color-primary)",
  "--btn-text": "var(--color-surface)",
  "--btn-border-color": "transparent",
  "--btn-radius": "var(--radius-button)",
  "--btn-shadow": "var(--shadow-button)",
  "--btn-padding-x": "32px",
  "--btn-padding-y": "16px",
  "--btn-font-size": "16px",
  "--btn-font-weight": "600",
  "--btn-hover-bg": "var(--btn-bg)",
  "--btn-icon-color": "var(--btn-text)",
  "--btn-letter-spacing": "normal",
  "--btn-text-transform": "none",
  // Layer 2 — banner-section
  "--banner-bg": "var(--color-surface)",
  "--banner-border": "var(--color-border)",
  "--banner-radius": "var(--radius-card)",
};

function formatLabel(variantId) {
  return variantId
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
}

export default function VariantPicker({
  elementId,
  currentVariant,
  onSelect,
  onReset,
  isOverridden,
}) {
  const meta = getElementType(elementId);
  // Hide entirely for single-variant or unregistered elements.
  if (!meta || !Array.isArray(meta.variants) || meta.variants.length < 2) {
    return null;
  }

  const VariantResolver = VARIANT_RESOLVERS[elementId];
  if (!VariantResolver) return null; // element not yet wired for live preview

  const activeVariant =
    currentVariant || getDefaultVariant(elementId) || "default";

  return (
    <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Variant
        </p>
        {isOverridden && (
          <button
            type="button"
            onClick={() => onReset?.()}
            className="text-[10px] font-semibold text-slate-400 hover:text-[#8A2680] transition-colors"
          >
            ↺ คืนค่า Template
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {meta.variants.map((variantId) => {
          const VariantComponent = VariantResolver(variantId);
          const isActive = activeVariant === variantId;
          return (
            <div
              key={variantId}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => onSelect?.(variantId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(variantId);
                }
              }}
              className={`group/variant relative cursor-pointer rounded-xl border-2 bg-slate-50/60 overflow-hidden transition-all ${
                isActive
                  ? "border-[#8A2680] ring-2 ring-[#8A2680]/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              title={formatLabel(variantId)}
            >
              {/* Live mini-preview — scaled down, non-interactive. */}
              <div className="relative h-20 overflow-hidden pointer-events-none select-none">
                <div
                  className="variant-preview-scope absolute top-0 left-0 origin-top-left"
                  style={{
                    ...PREVIEW_VARS,
                    transform: "scale(0.42)",
                    width: "238%",
                    padding: "8px 4px",
                  }}
                >
                  <VariantComponent
                    config={{}}
                    data={MOCK_DATA}
                    resolvedConfig={null}
                    resolvedTemplate={null}
                    elementConfigs={null}
                  />
                </div>
              </div>

              <div
                className={`px-2 py-1.5 text-[11px] font-semibold text-center border-t truncate ${
                  isActive
                    ? "bg-[#8A2680] text-white border-[#8A2680]"
                    : "bg-white text-slate-600 border-slate-100"
                }`}
              >
                {formatLabel(variantId)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
