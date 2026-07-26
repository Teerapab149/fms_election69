"use client";

// TemplateChooserTab — premium Master-Detail template picker.
//
// Direction (2026-06-27, owner): the product is "choose 1 of N templates", not a
// web editor. Layout: a left sidebar list of compact template cards + a right
// "browser mockup" stage that previews the selected template's REAL pages as a
// horizontal peek-carousel (you see the next page sliding in). Apply sets
// SystemConfig.activeTemplateId (live immediately). Active status shows in ONE
// place — the detail's apply button (disabled when already in use).
//
// Perf: only the selected template renders previews, and only the current slide
// + its immediate neighbours mount iframes (windowed) — so the peek shows a real
// next page without firing every page at once.

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Palette, Check, Loader2, ChevronLeft, ChevronRight, ExternalLink, AlertTriangle,
  Monitor, Laptop, Tablet, Smartphone,
} from "lucide-react";
import { getPath } from "../../utils/basePath";
import { injectTemplateTheme } from "../../utils/injectTemplateTheme";

// Device viewports — each previews the page at its TRUE width (the iframe is a real
// viewport, so the page reflows) then scales the frame down to fit the column.
const DEVICES = [
  { key: "pc", label: "PC", Icon: Monitor, w: 1440, h: 860, disp: (vw) => Math.min(Math.round(vw * 0.84), 820) },
  { key: "laptop", label: "Laptop", Icon: Laptop, w: 1024, h: 760, disp: (vw) => Math.min(Math.round(vw * 0.78), 720) },
  { key: "tablet", label: "Tablet", Icon: Tablet, w: 768, h: 1024, disp: (vw) => Math.min(Math.round(vw * 0.46), 460) },
  { key: "mobile", label: "Mobile", Icon: Smartphone, w: 412, h: 880, disp: (vw) => Math.min(Math.round(vw * 0.32), 300) },
];

const PAGES = [
  { page: "home", label: "หน้าแรก" },
  { page: "candidates", label: "ผู้สมัคร · หลายพรรค" },
  { page: "party", label: "ข้อมูลพรรค" },
  { page: "vote", variant: "multi", label: "ลงคะแนน · หลายพรรค" },
  { page: "vote", variant: "single", label: "ลงคะแนน · พรรคเดียว" },
  { page: "results", variant: "locked", label: "ผลคะแนน · ปิดผล" },
  { page: "results", variant: "revealed", label: "ผลคะแนน · เปิดผล" },
  { page: "success", label: "ลงคะแนนสำเร็จ" },
  { page: "closed", label: "ระบบปิด" },
];

const slideSrc = (slug, s) =>
  getPath(`/template-preview?slug=${slug}&page=${s.page}${s.variant ? `&variant=${s.variant}` : ""}`);

// ── One device-framed slide: browser chrome + the page at its TRUE device width,
//    scaled down to the display size (so the page reflows like the real device). ──
function BrowserSlide({ familySlug, themeSlug, slide, device, displayW, isCurrent, mounted, accent }) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef(null);
  const scale = displayW / device.w;
  const displayH = device.h * scale;
  // The iframe URL uses the FAMILY slug (stable) — switching colour theme doesn't
  // change it, so no reload / no jump to the home slide. The theme is injected.
  const src = slideSrc(familySlug, slide);
  useEffect(() => { setLoaded(false); }, [src]);
  // Re-tint in place whenever the chosen theme changes (and once it's loaded).
  useEffect(() => {
    if (loaded) injectTemplateTheme(iframeRef.current?.contentDocument, themeSlug);
  }, [themeSlug, loaded]);

  return (
    <div
      className="shrink-0 transition-all duration-500 ease-out"
      style={{ width: displayW, transform: isCurrent ? "scale(1)" : "scale(0.94)", opacity: isCurrent ? 1 : 0.45 }}
    >
      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)]">
        {/* browser chrome */}
        <div className="h-9 flex items-center gap-2 px-3.5 bg-slate-50 border-b border-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-2 flex-1 h-5 rounded-md bg-white border border-slate-200 flex items-center px-2 text-[10px] text-slate-400 font-mono truncate">
            fms-ovs/{slide.page}{slide.variant ? `·${slide.variant}` : ""}
          </div>
        </div>
        {/* viewport — iframe fades in only once loaded + styled, to hide the
            dev CSS-not-yet-applied flash (FOUC). The tinted panel + spinner cover
            the load. */}
        <div className="relative overflow-hidden" style={{ height: displayH, background: accent ? `${accent}1a` : "#0f172a" }}>
          {mounted ? (
            <>
              {!loaded && (
                <div className="absolute inset-0 z-10 grid place-items-center">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: accent || "#94a3b8" }} />
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={src}
                src={src}
                title={slide.label}
                onLoad={() => { injectTemplateTheme(iframeRef.current?.contentDocument, themeSlug); setTimeout(() => setLoaded(true), 220); }}
                scrolling="no"
                style={{ width: device.w, height: device.h, border: 0, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none", opacity: loaded ? 1 : 0, transition: "opacity 280ms ease" }}
              />
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ background: accent ? `${accent}14` : "#0b0b08" }}>
              <span className="text-[11px] font-semibold text-slate-400">{slide.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── The device-aware peek-carousel stage for the selected template ────────────
function PreviewStage({ familySlug, themeSlug, accent }) {
  const [idx, setIdx] = useState(0);
  const [deviceKey, setDeviceKey] = useState("pc");
  const [vw, setVw] = useState(720);
  const vpRef = useRef(null);

  // Reset to the home slide only when the LAYOUT family changes — switching colour
  // theme (themeSlug) keeps the current page (no bounce); it re-tints in place.
  useEffect(() => { setIdx(0); }, [familySlug]);
  useEffect(() => {
    const el = vpRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setVw(el.clientWidth);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const device = DEVICES.find((d) => d.key === deviceKey) ?? DEVICES[0];
  const gap = 20;
  const displayW = device.disp(vw);
  const offset = (vw - displayW) / 2 - idx * (displayW + gap); // centre current, peek both sides
  const go = (d) => setIdx((i) => Math.min(Math.max(i + d, 0), PAGES.length - 1));
  const slide = PAGES[idx];

  return (
    <div>
      {/* device viewport toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-1">
          {DEVICES.map(({ key, label, Icon }) => {
            const on = key === deviceKey;
            return (
              <button key={key} type="button" onClick={() => setDeviceKey(key)} aria-pressed={on} title={label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${on ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[11px] font-mono text-slate-400 tabular-nums">{device.w}×{device.h}</span>
      </div>

      <div ref={vpRef} className="relative overflow-hidden">
        <div className="flex items-start" style={{ gap, transform: `translateX(${offset}px)`, transition: "transform 520ms cubic-bezier(0.22,1,0.36,1)" }}>
          {PAGES.map((s, i) => (
            <BrowserSlide
              key={i}
              familySlug={familySlug}
              themeSlug={themeSlug}
              slide={s}
              device={device}
              displayW={displayW}
              isCurrent={i === idx}
              mounted={Math.abs(i - idx) <= 1}
              accent={accent}
            />
          ))}
        </div>

        {/* edge arrows */}
        {idx > 0 && (
          <button type="button" onClick={() => go(-1)} aria-label="หน้าก่อนหน้า"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center text-slate-700 transition active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {idx < PAGES.length - 1 && (
          <button type="button" onClick={() => go(1)} aria-label="หน้าถัดไป"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center text-slate-700 transition active:scale-90">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* caption + dots */}
      <div className="flex items-center justify-between gap-3 mt-4 px-1">
        <span className="text-sm font-semibold text-slate-600">
          <span className="text-slate-400 font-normal">{idx + 1}/{PAGES.length} · </span>{slide.label}
        </span>
        <div className="flex items-center gap-1.5">
          {PAGES.map((s, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)} aria-label={s.label} title={s.label}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-[#8A2680]" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`} />
          ))}
        </div>
        <button type="button" onClick={() => window.open(slideSrc(themeSlug, slide) + '&chrome=1', '_blank')}
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition">
          <ExternalLink className="w-3 h-3" /> เปิดเต็มจอ
        </button>
      </div>
    </div>
  );
}

// ── Sidebar card (master) — one per family; colour themes = clickable swatches ──
function SidebarCard({ fam, selectedSlug, activeSlug, onSelect }) {
  const { rep, themes } = fam;
  const multi = themes.length > 1;
  const isSelected = themes.some((t) => t.slug === selectedSlug);
  const isActive = themes.some((t) => t.slug === activeSlug);
  return (
    // p-3.5 (was p-4) + a tighter swatch gutter: at 130px per card six families
    // overflowed a 900px-tall screen by 131px. The reclaim gets the whole list
    // onto one screen at that height, so the common case needs no scrolling at
    // all and the box above only kicks in on shorter windows.
    <div className={`rounded-2xl border p-3.5 transition-all duration-200 ${isSelected ? "border-slate-300 bg-white shadow-md" : "border-transparent bg-white/60 hover:bg-white hover:shadow-sm"}`}>
      <button type="button" onClick={() => onSelect(rep.slug)} className="w-full text-left">
        <div className="flex items-center gap-2">
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="กำลังใช้อยู่" />}
          <span className={`font-bold text-[15px] leading-tight ${isSelected ? "text-slate-900" : "text-slate-700"}`}>{rep.name}</span>
          <span className="ml-auto text-[9px] font-mono uppercase tracking-wide text-slate-300">{rep.layoutFamily || rep.slug}</span>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{rep.description}</p>
      </button>
      <div className="flex items-center gap-1.5 mt-2">
        {themes.map((t) => {
          const on = t.slug === selectedSlug;
          const c = t.colorSwatch?.primary || "#8A2680";
          return (
            <button key={t.slug} type="button" title={t.name} aria-label={`เลือก ${t.name}`} onClick={() => onSelect(t.slug)}
              className={`w-5 h-5 rounded-full border-2 grid place-items-center transition-transform ${on ? "scale-110" : "hover:scale-105"}`}
              style={{ background: c, borderColor: on ? "#0f172a" : "#fff", boxShadow: on ? "0 0 0 2px rgba(15,23,42,.18)" : "0 1px 2px rgba(15,23,42,.18)" }}>
              {t.slug === activeSlug && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>
          );
        })}
        {multi && <span className="ml-1 text-[10px] font-semibold text-slate-400">{themes.length} สี</span>}
      </div>
    </div>
  );
}

export default function TemplateChooserTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [pending, setPending] = useState(null);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, layoutRes] = await Promise.all([
        fetch(getPath("/api/admin/templates"), { credentials: "include" }),
        fetch(getPath("/api/admin/page-layout")),
      ]);
      if (!tplRes.ok) throw new Error(`templates HTTP ${tplRes.status}`);
      const tplData = await tplRes.json();
      setTemplates(tplData.templates || []);
      const layout = layoutRes.ok ? await layoutRes.json() : {};
      setActiveSlug(layout.activeTemplateId || "original");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // One card per layout family (classic family retired). Each family keeps its
  // colour themes (e.g. verdure terracotta/honey/teal/berry) → clickable swatches.
  const families = useMemo(() => {
    // v2-R6 — surface the newest, most-complete families first: receipt + blossom
    // lead, then original, then the earlier real templates. Families absent here fall
    // to the end (index 99); the classic family is filtered out above regardless.
    const ORDER = ["receipt", "blossom", "original", "gumroad", "studio-dark", "verdure"];
    const REP = { gumroad: "gumroad", "studio-dark": "studio-dark", verdure: "verdure", original: "original" };
    const groups = {};
    for (const t of templates) {
      const fam = t.layoutFamily || "classic";
      if (fam === "classic") continue;
      (groups[fam] || (groups[fam] = [])).push(t);
    }
    return Object.entries(groups)
      .map(([fam, list]) => {
        const rep = list.find((t) => t.slug === (REP[fam] || fam)) || list[0];
        return { family: fam, rep, themes: [rep, ...list.filter((t) => t !== rep)] };
      })
      .sort((a, b) => {
        const ai = ORDER.indexOf(a.family), bi = ORDER.indexOf(b.family);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
  }, [templates]);

  // Default the detail to the active template once loaded.
  useEffect(() => {
    if (selectedSlug || !families.length) return;
    const all = families.flatMap((f) => f.themes);
    const initial = all.find((t) => t.slug === activeSlug) || families[0].rep;
    setSelectedSlug(initial.slug);
  }, [families, activeSlug, selectedSlug]);

  const selected = useMemo(() => templates.find((t) => t.slug === selectedSlug) || null, [templates, selectedSlug]);
  const selectedFamily = useMemo(() => families.find((f) => f.themes.some((t) => t.slug === selectedSlug)) || null, [families, selectedSlug]);
  const isSelectedActive = selected && selected.slug === activeSlug;
  const accent = selected?.colorSwatch?.primary || "#8A2680";

  const confirmApply = async () => {
    if (!pending || applying) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(getPath(`/api/admin/templates/${pending.slug}/apply`), { method: "POST", credentials: "include" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      setActiveSlug(pending.slug);
      setToast(`เปลี่ยนเป็น “${pending.name}” แล้ว — หน้าเว็บสาธารณะอัปเดตแล้ว`);
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setError(`เปลี่ยนธีมไม่สำเร็จ: ${e.message}`);
    } finally {
      setApplying(false);
      setPending(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-50 text-[#8A2680] p-2.5 rounded-xl shrink-0">
          <Palette className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-slate-800">เลือกธีมเว็บไซต์</h2>
          <p className="text-sm text-slate-500 mt-0.5">เลือกธีมจากด้านซ้าย ดูหน้าจริงทุกหน้า แล้วกดใช้ — หน้าเว็บสาธารณะเปลี่ยนทันที</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-24 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดธีม...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
          {/* ── MASTER: sidebar ──
              The list is its OWN scroll box, not part of the page scroll. Six
              families ran 840px tall against a 900px viewport, so the last card
              sat at y=1031 — unreachable without scrolling the page, which
              carried the preview stage away with it (the stage is the whole
              point of the tab). Bounding it to the viewport keeps picking a
              theme and watching it side by side. */}
          <div className="lg:sticky lg:top-[72px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">ธีมทั้งหมด ({families.length})</p>
            {/* 216px = where the list starts on an unscrolled page (192, under
                the tab's title block) + 24 of breathing room. Bounding it there
                — rather than to the sticky offset — is what removes the PAGE
                scroll: with the list inside the first screen there is nothing
                left to scroll past, so the preview can never drift away. */}
            <div className="tc-list flex lg:flex-col gap-2 lg:gap-1.5 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[calc(100vh-216px)] pb-1 lg:pb-0 lg:p-1.5 lg:rounded-2xl lg:border lg:border-slate-200/70 lg:bg-white/50">
              {families.map((fam) => (
                <div key={fam.family} className="min-w-[220px] lg:min-w-0">
                  <SidebarCard fam={fam} selectedSlug={selectedSlug} activeSlug={activeSlug} onSelect={setSelectedSlug} />
                </div>
              ))}
            </div>
          </div>

          {/* ── DETAIL: preview stage ── */}
          <div className="bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200/70 p-5 lg:p-7">
            {selected && (
              <>
                <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">{selected.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xl">{selected.description}</p>
                  </div>
                  {isSelectedActive ? (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-default select-none">
                      <Check className="w-4 h-4" /> กำลังใช้งานอยู่
                    </span>
                  ) : (
                    <button type="button" onClick={() => setPending({ slug: selected.slug, name: selected.name })}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all active:scale-95 bg-[#8A2680] hover:bg-[#751f6c]">
                      ใช้ธีมนี้
                    </button>
                  )}
                </div>

                <PreviewStage familySlug={selectedFamily?.rep?.slug || selected.slug} themeSlug={selected.slug} accent={accent} />
              </>
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-6">
        แต่ละธีมรองรับครบทุกหน้า · เนื้อหา (ชื่อ/ปี/ผู้สมัคร) แก้ที่แท็บ “ตั้งค่าทั่วไป” และ “จัดการผู้สมัคร”
      </p>

      {/* the theme list's own scrollbar — slim and always drawn, so a short
          window shows that there is more below instead of hiding it behind the
          page scroll. Overlay scrollbars (macOS default) would vanish here. */}
      <style jsx>{`
        /* NOTE: no \`scrollbar-width\` here on purpose. Declaring the standards
           property makes Chromium ignore the ::-webkit-scrollbar rules and fall
           back to an OVERLAY scrollbar — measured as a 0px layout gutter, i.e.
           nothing visible until you already know to scroll, which is the exact
           opposite of the ask. Letting the webkit pseudo-elements win gives a
           classic bar that is always drawn; scrollbar-gutter keeps the cards
           from shifting when it appears. */
        .tc-list { scrollbar-gutter: stable; }
        .tc-list::-webkit-scrollbar { width: 8px; height: 6px; }
        .tc-list::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 999px; }
        .tc-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .tc-list::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* confirm */}
      {pending && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !applying && setPending(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-purple-50 text-[#8A2680] flex items-center justify-center mb-4">
              <Palette className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">ใช้ธีม “{pending.name}”?</h3>
            <p className="text-sm text-slate-500 mt-1.5 mb-6">หน้าเว็บสาธารณะจะเปลี่ยนเป็นธีมนี้ทันที (เปลี่ยนกลับได้ทุกเมื่อ)</p>
            <div className="flex gap-3">
              <button type="button" disabled={applying} onClick={() => setPending(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 disabled:opacity-50">
                ยกเลิก
              </button>
              <button type="button" disabled={applying} onClick={confirmApply} className="flex-1 px-4 py-2.5 rounded-xl bg-[#8A2680] text-white font-bold text-sm hover:bg-[#751f6c] disabled:opacity-70 flex items-center justify-center gap-2">
                {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังเปลี่ยน...</> : <>ยืนยัน</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-xl animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}
