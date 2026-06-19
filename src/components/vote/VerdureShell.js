"use client";

// VerdureShell — shared wrapper for Verdure inner pages. Paints the page canvas
// (cream by default, moss-green when `moss`), mounts the chrome (edge label,
// cornermark, top-right status + user, bottom dock), then the page content as
// children. Same idea as StudioDarkShell; props match the Verdure design's
// per-screen specifics (edge number/label, status chip, back link).

import VerdureChrome from "../home/VerdureChrome";

export default function VerdureShell({
  active = "home",
  moss = false,
  editorMode = false,
  systemMode = "AUTO",
  edge = { num: "01", label: "Index", th: "" },
  cornermarkTitle = "SAMO 50",
  cornermarkSub = "FMS Election · 2570",
  statusChip = null,
  backHref = null,
  backLabel = "",
  children,
}) {
  return (
    <div className={`fms-app vd-root ${moss ? "vd-moss" : ""}`}>
      {/* page canvas on the browser frame (no white/dark flash); gated on !editorMode
          so it doesn't leak into the admin inline preview */}
      {!editorMode && (
        <style>{`html,body{background:${moss ? "#1F3A2C" : "#F4ECDB"};color-scheme:${moss ? "dark" : "light"}}`}</style>
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
    </div>
  );
}
