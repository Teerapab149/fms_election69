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
} from "lucide-react";
import { getPath } from "../../utils/basePath";

const FRAME_W = 1280;
const FRAME_H = 860;

const PAGES = [
  { page: "home", label: "หน้าแรก" },
  { page: "candidates", label: "ผู้สมัคร" },
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

// ── One browser-window slide: chrome + a scaled live page (or a light poster
//    placeholder when it's outside the mounted window). ─────────────────────────
function BrowserSlide({ slug, slide, slideW, isCurrent, mounted, accent }) {
  const [loaded, setLoaded] = useState(false);
  const scale = slideW / FRAME_W;
  const src = slideSrc(slug, slide);
  useEffect(() => { setLoaded(false); }, [src]);

  return (
    <div
      className="shrink-0 transition-all duration-500 ease-out"
      style={{ width: slideW, transform: isCurrent ? "scale(1)" : "scale(0.93)", opacity: isCurrent ? 1 : 0.45 }}
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
        {/* viewport */}
        <div className="relative overflow-hidden bg-[#0b0b08]" style={{ height: FRAME_H * scale }}>
          {mounted ? (
            <>
              {!loaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40">
                  <Loader2 className="w-5 h-5 text-white/80 animate-spin" />
                </div>
              )}
              <iframe
                key={src}
                src={src}
                title={slide.label}
                onLoad={() => setLoaded(true)}
                scrolling="no"
                style={{ width: FRAME_W, height: FRAME_H, border: 0, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}
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

// ── The peek-carousel stage for the selected template ─────────────────────────
function PreviewStage({ slug, accent }) {
  const [idx, setIdx] = useState(0);
  const [vw, setVw] = useState(720);
  const vpRef = useRef(null);

  useEffect(() => { setIdx(0); }, [slug]);
  useEffect(() => {
    const el = vpRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setVw(el.clientWidth);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const gap = 20;
  const slideW = Math.min(Math.round(vw * 0.84), 820);
  const offset = (vw - slideW) / 2 - idx * (slideW + gap); // centre current, peek both sides
  const go = (d) => setIdx((i) => Math.min(Math.max(i + d, 0), PAGES.length - 1));
  const slide = PAGES[idx];

  return (
    <div>
      <div ref={vpRef} className="relative overflow-hidden">
        <div className="flex items-stretch" style={{ gap, transform: `translateX(${offset}px)`, transition: "transform 520ms cubic-bezier(0.22,1,0.36,1)" }}>
          {PAGES.map((s, i) => (
            <BrowserSlide
              key={i}
              slug={slug}
              slide={s}
              slideW={slideW}
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
        <button type="button" onClick={() => window.open(slideSrc(slug, slide) + '&chrome=1', '_blank')}
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition">
          <ExternalLink className="w-3 h-3" /> เปิดเต็มจอ
        </button>
      </div>
    </div>
  );
}

// ── Sidebar card (master) ─────────────────────────────────────────────────────
function SidebarCard({ tpl, selected, active, onSelect }) {
  const sw = tpl.colorSwatch || {};
  const dots = [sw.primary, sw.secondary, sw.background].filter(Boolean);
  return (
    <button
      type="button"
      onClick={() => onSelect(tpl.slug)}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 group ${selected ? "border-slate-300 bg-white shadow-md" : "border-transparent bg-white/60 hover:bg-white hover:shadow-sm"}`}
    >
      <div className="flex items-center gap-2">
        {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="กำลังใช้อยู่" />}
        <span className={`font-bold text-[15px] leading-tight ${selected ? "text-slate-900" : "text-slate-700"}`}>{tpl.name}</span>
        <span className="ml-auto text-[9px] font-mono uppercase tracking-wide text-slate-300">{tpl.layoutFamily || tpl.slug}</span>
      </div>
      <p className="text-[11.5px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{tpl.description}</p>
      <div className="flex items-center gap-1.5 mt-2.5">
        {dots.map((c, i) => (
          <span key={i} className="w-4 h-4 rounded-full border border-black/5" style={{ background: c }} />
        ))}
        {active && <span className="ml-1 text-[10px] font-bold text-emerald-600">ใช้อยู่</span>}
      </div>
    </button>
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

  // One choosable card per layout family (classic family retired). rep = the
  // family's canonical template.
  const choices = useMemo(() => {
    const ORDER = ["original", "gumroad", "studio-dark", "verdure"];
    const REP = { gumroad: "gumroad", "studio-dark": "studio-dark", verdure: "verdure", original: "original" };
    const groups = {};
    for (const t of templates) {
      const fam = t.layoutFamily || "classic";
      if (fam === "classic") continue;
      (groups[fam] || (groups[fam] = [])).push(t);
    }
    return Object.entries(groups)
      .map(([fam, list]) => list.find((t) => t.slug === (REP[fam] || fam)) || list[0])
      .sort((a, b) => {
        const ai = ORDER.indexOf(a.layoutFamily || a.slug), bi = ORDER.indexOf(b.layoutFamily || b.slug);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
  }, [templates]);

  // Default the detail to the active template once loaded.
  useEffect(() => {
    if (selectedSlug || !choices.length) return;
    const initial = choices.find((t) => t.slug === activeSlug) || choices[0];
    setSelectedSlug(initial.slug);
  }, [choices, activeSlug, selectedSlug]);

  const selected = useMemo(() => choices.find((t) => t.slug === selectedSlug) || null, [choices, selectedSlug]);
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
          {/* ── MASTER: sidebar ── */}
          <div className="lg:sticky lg:top-[72px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">ธีมทั้งหมด ({choices.length})</p>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {choices.map((t) => (
                <div key={t.slug} className="min-w-[220px] lg:min-w-0">
                  <SidebarCard tpl={t} selected={t.slug === selectedSlug} active={t.slug === activeSlug} onSelect={setSelectedSlug} />
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

                <PreviewStage slug={selected.slug} accent={accent} />
              </>
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-6">
        แต่ละธีมรองรับครบทุกหน้า · เนื้อหา (ชื่อ/ปี/ผู้สมัคร) แก้ที่แท็บ “ตั้งค่าทั่วไป” และ “จัดการผู้สมัคร”
      </p>

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
