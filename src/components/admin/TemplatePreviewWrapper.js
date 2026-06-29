"use client";

// TemplatePreviewWrapper — a professional template-showcase frame (Storybook /
// theme-previewer style) that wraps any page content OR an iframe.
//
// Layout: a fixed 56px dark top control bar (device viewports · mock address bar ·
// exit) over a light "design studio" canvas with a subtle grid, centring a
// browser-mockup shell whose width animates between device sizes.
//
// JS + JSDoc (this project is JavaScript — no TS toolchain). Pass `src` for a true
// device-width preview (an iframe is the only faithful viewport), or `children`
// for arbitrary content.

import { useState, useEffect } from "react";
import { Monitor, Laptop, Tablet, Smartphone, Lock, X, Loader2 } from "lucide-react";

/**
 * @typedef {"pc"|"laptop"|"tablet"|"mobile"} ViewportKey
 * @typedef {{ key: ViewportKey, label: string, width: number, Icon: import("lucide-react").LucideIcon }} ViewportOption
 */

/** @type {ViewportOption[]} */
const VIEWPORTS = [
  { key: "pc", label: "PC", width: 1440, Icon: Monitor },
  { key: "laptop", label: "Laptop", width: 1024, Icon: Laptop },
  { key: "tablet", label: "Tablet", width: 768, Icon: Tablet },
  { key: "mobile", label: "Mobile", width: 412, Icon: Smartphone },
];

/**
 * @typedef {Object} TemplatePreviewWrapperProps
 * @property {React.ReactNode} [children]  Content inside the shell. Ignored when `src` is set.
 * @property {string} [src]                Iframe source — the faithful way to preview a real device width.
 * @property {string} [url]                Text shown in the decorative address bar.
 * @property {React.ReactNode} [actions]   Optional extra controls in the top bar (e.g. page/state switchers).
 * @property {ViewportKey} [defaultView]   Initial device viewport (default "pc").
 * @property {() => void} [onExit]         Click handler for the "Exit Preview" button.
 */

/** @param {TemplatePreviewWrapperProps} props */
export default function TemplatePreviewWrapper({
  children,
  src,
  url = "fms-ovs.psu.ac.th",
  actions,
  defaultView = "pc",
  onExit,
}) {
  /** @type {[ViewportKey, (v: ViewportKey) => void]} */
  const [currentView, setCurrentView] = useState(defaultView);
  const active = VIEWPORTS.find((v) => v.key === currentView) ?? VIEWPORTS[0];

  // Fade the iframe in only once it's loaded + styled, to hide the dev FOUC
  // (unstyled HTML flashing before CSS applies). Reset on src change only —
  // switching device just resizes the same iframe, so it shouldn't reflash.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    // Fallback: heavy pages (LiquidHero / the verdure vote intro) don't always
    // fire a timely load event — never leave the preview stuck behind the spinner.
    const t = setTimeout(() => setLoaded(true), 1400);
    return () => clearTimeout(t);
  }, [src]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-100">
      {/* ── Top control bar (56px) ─────────────────────────────────────── */}
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 h-14 shrink-0 px-3 sm:px-4 bg-neutral-900 text-neutral-100 shadow-lg">
        {/* left — device viewports (+ optional custom actions) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-neutral-800 rounded-lg p-1">
            {VIEWPORTS.map(({ key, label, Icon }) => {
              const on = key === currentView;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCurrentView(key)}
                  aria-pressed={on}
                  title={label}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    on ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </button>
              );
            })}
          </div>
          {actions && <div className="hidden lg:flex items-center gap-2 pl-1">{actions}</div>}
        </div>

        {/* center — decorative (disabled) address bar */}
        <div className="hidden sm:flex justify-center">
          <div className="flex items-center gap-2 w-full max-w-md h-8 px-3 rounded-full bg-neutral-800 border border-neutral-700">
            <Lock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={url}
              aria-label="ที่อยู่ตัวอย่าง (อ่านอย่างเดียว)"
              className="w-full bg-transparent text-xs text-neutral-400 outline-none cursor-default truncate select-none"
            />
          </div>
        </div>

        {/* right — exit */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-all active:scale-95 shadow-sm"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">ออกจากพรีวิว</span>
          </button>
        </div>
      </header>

      {/* ── Canvas (design-studio grid) ────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 overflow-auto flex justify-center p-3 sm:p-6 lg:p-8"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* browser-mockup shell — width animates between device sizes */}
        <div
          className="flex flex-col w-full max-w-full max-h-full bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ width: active.width }}
        >
          {/* shell header — mac window controls */}
          <div className="flex items-center gap-2 h-10 shrink-0 px-3.5 bg-neutral-100 border-b border-neutral-200">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </span>
            <div className="mx-auto flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 truncate max-w-[60%]">
              <Lock className="w-3 h-3" /> {url}
            </div>
            <span className="text-[10px] font-mono text-neutral-300 tabular-nums">{active.width}px</span>
          </div>

          {/* shell content */}
          <div className="relative flex-1 min-h-0 bg-white">
            {src ? (
              <>
                {!loaded && (
                  <div className="absolute inset-0 z-10 grid place-items-center bg-white">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                )}
                <iframe
                  src={src}
                  title="Template preview"
                  onLoad={() => setLoaded(true)}
                  className="w-full h-full border-0"
                  style={{ opacity: loaded ? 1 : 0, transition: "opacity 280ms ease" }}
                />
              </>
            ) : (
              <div className="w-full h-full overflow-auto">{children}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
