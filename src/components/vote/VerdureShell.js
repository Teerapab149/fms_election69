"use client";

// VerdureShell — shared wrapper for Verdure inner pages. Paints the page canvas
// (cream by default, moss-green when `moss`), mounts the chrome (edge label,
// cornermark, top-right status + user, bottom dock), then the page content as
// children. Same idea as StudioDarkShell; props match the Verdure design's
// per-screen specifics (edge number/label, status chip, back link).

import VerdureChrome, { verdureTheme, VerdureFooter } from "../home/VerdureChrome";
import { useActiveTemplateId } from "../../contexts/GlobalConfigContext";

export default function VerdureShell({
  active = "home",
  moss = false,
  editorMode = false,
  systemMode = "AUTO",
  edge = { num: "01", label: "Home", th: "" },
  // null (not a literal string) so VerdureChrome's `cornermarkTitle || meta.wordmark`
  // falls through to the live globalConfig-derived value when a page doesn't
  // override it (see VerdureChrome.js meta / VerdureCandidates usage).
  cornermarkTitle = null,
  cornermarkSub = null,
  statusChip = null,
  backHref = null,
  backLabel = "",
  children,
}) {
  // The html/body canvas sits OUTSIDE .vd-root, so it can't read the themed
  // --cream/--moss vars — paint it with the ACTIVE theme's literal palette so even
  // overscroll matches (the .vd-root itself is already themed via VerdureBaseStyles).
  const t = verdureTheme(useActiveTemplateId());
  return (
    <div className={`fms-app vd-root ${moss ? "vd-moss" : ""}`}>
      {/* page canvas on the browser frame (no white/dark flash); gated on !editorMode
          so it doesn't leak into the admin inline preview */}
      {!editorMode && (
        <style>{`html,body{background:${moss ? t.moss : t.cream};color-scheme:${moss ? "dark" : "light"}}`}</style>
      )}

      <VerdureChrome
        active={active}
        moss={moss}
        editorMode={editorMode}
        systemMode={systemMode}
        edge={edge}
        cornermarkTitle={cornermarkTitle}
        cornermarkSub={cornermarkSub}
        statusChip={statusChip}
        backHref={backHref}
        backLabel={backLabel}
      />

      {children}

      <VerdureFooter />
    </div>
  );
}
