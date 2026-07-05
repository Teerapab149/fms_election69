"use client";

// SinglePartyBaseStyles — emits the active Original theme's structural ramp as
// CSS vars on :root, for the ORIGINAL template's cinematic single-vote page
// (SinglePartyView's createPortal branch + LiquidHero + LiquidMeshHeroBackground).
//
// WHY :root (not a scoped class): SinglePartyView renders through createPortal
// into a <div id="cinematic-root"> appended to document.body — OUTSIDE the
// layout's `.fms-app` wrapper. So the Layer-1 --color-* tokens (SSR'd scoped to
// .fms-app) DO NOT reach the portal. Emitting --spv-* on :root is the only scope
// the portal can inherit. Mirrors OriginalBaseStyles (reads useActiveTemplateId +
// ?slug= preview override) but targets :root and derives the page's structural
// stops (darks / accent gold / mesh pastels) the Layer-1 set lacks.
//
// NON-BREAKING contract: every consumer uses var(--spv-X, <exact original value>),
// so with the flagship "original" theme the emitted ramp equals those fallbacks
// and the page renders byte-identical to before.

import { useState, useEffect } from "react";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { originalTheme } from "../../utils/originalPalettes";

// Build the --spv-* ramp from a palette. For the flagship "original" theme the
// values below MUST equal the hardcoded fallbacks used at each consumer, so the
// default render is byte-identical. Other themes re-tint the same slots.
function buildRamp(slug) {
  const t = originalTheme(slug);
  const isDefault = !slug || slug === "original";
  if (isDefault) {
    // Exact current values — byte-faithful default (see SinglePartyView portal).
    return {
      "--spv-brand": "#8A2680",   // core brand (var(--color-primary) parity)
      "--spv-accent": "#C026D3",  // bright accent (var(--color-accent) parity)
      "--spv-gold": "#B8860B",    // "The Identity / Our Policies" eyebrow gold
      "--spv-gold-bright": "#D4AF37", // scrollbar thumb / metallic highlight
      "--spv-dark": "#1A1A1A",    // portal base ink / vote-section dark
      "--spv-dark-2": "#2A2A2A",  // secondary vote option surface
      "--spv-dark-3": "#3A3A3A",  // secondary vote option hover
      "--spv-deep": "#2E1065",    // mission header deep purple / policy bg number
      "--spv-deep-2": "#4C1D95",  // mission gradient mid
      "--spv-glow": "#D97706",    // mission accent blob / gold-amber pulse
      "--spv-glow-2": "#FCD34D",  // mission icon / bright accent text
      "--spv-hero-a": "#2E1065",  // LiquidHero reveal gradient start
      "--spv-hero-b": "#7e22ce",  // LiquidHero reveal gradient mid
      "--spv-hero-c": "#ec4899",  // LiquidHero reveal gradient end
      "--spv-vote-glow": "#6A0DAD", // vote-section blur glow + team accent
      // Mesh pastels (LiquidMeshHeroBackground blobs / radials / conic)
      "--spv-mesh1": "rgba(165, 243, 252, 0.85)",
      "--spv-mesh2": "rgba(233, 213, 255, 0.85)",
      "--spv-mesh3": "rgba(251, 207, 232, 0.80)",
      "--spv-mesh-mix": "rgba(221, 214, 254, 0.55)",
      // Footer confirm affordance (VoteFooter single) — party defaults
      "--spv-footer-primary": "#4D2A67",
      "--spv-footer-gold": "#CDA176",
    };
  }
  // Themed variants — derive the same structural slots from the palette ramp.
  // Darks: near-black warmed toward `deep` so each theme's chrome reads distinct
  // without going light. color-mix keeps them dark (mostly black).
  const dark = `color-mix(in srgb, ${t.deep} 16%, #141414)`;
  return {
    "--spv-brand": t.brand,
    "--spv-accent": t.bright,
    "--spv-gold": t.mid,
    "--spv-gold-bright": t.glow,
    "--spv-dark": dark,
    "--spv-dark-2": `color-mix(in srgb, ${t.deep} 18%, #1f1f1f)`,
    "--spv-dark-3": `color-mix(in srgb, ${t.deep} 22%, #2c2c2c)`,
    "--spv-deep": t.deep,
    "--spv-deep-2": t.brand,
    "--spv-glow": t.glow,
    "--spv-glow-2": t.glow,
    "--spv-hero-a": t.deep,
    "--spv-hero-b": t.brand,
    "--spv-hero-c": t.bright,
    "--spv-vote-glow": t.brand,
    // Mesh pastels from soft/mid/glow tints with alpha (kept light + airy).
    "--spv-mesh1": `color-mix(in srgb, ${t.soft} 85%, transparent)`,
    "--spv-mesh2": `color-mix(in srgb, ${t.mid} 30%, transparent)`,
    "--spv-mesh3": `color-mix(in srgb, ${t.glow} 30%, transparent)`,
    "--spv-mesh-mix": `color-mix(in srgb, ${t.soft2} 55%, transparent)`,
    "--spv-footer-primary": t.deep,
    "--spv-footer-gold": t.glow,
  };
}

export function SinglePartyBaseStyles() {
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("original")) setPreviewSlug(s);
  }, []);
  const slug = previewSlug || activeSlug;
  // Only theme when the active/previewed template is the Original family; for any
  // other template (gumroad/verdure/studio-dark) emit the byte-identical default
  // ramp so their single-vote (if reached) is unchanged.
  const ramp = buildRamp(slug && slug.startsWith("original") ? slug : "original");
  const decls = Object.entries(ramp)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return (
    <style jsx global>{`
      :root {
        ${decls}
      }
    `}</style>
  );
}

export default SinglePartyBaseStyles;
