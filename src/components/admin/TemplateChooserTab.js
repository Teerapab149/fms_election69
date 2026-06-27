"use client";

// TemplateChooserTab — the staff-facing "pick a theme" surface.
//
// Direction (2026-06-27, owner): the product is "choose 1 of N templates", NOT a
// web editor. This tab is the clean, full-page chooser: big template cards + a
// live preview gallery + one-click apply. Applying sets SystemConfig.activeTemplateId
// (POST /api/admin/templates/<slug>/apply) which every public page dispatches on —
// so the change is LIVE immediately, no draft/publish step.
//
// Self-contained on purpose: the lightweight preview thumbnail + gallery are copied
// (not imported) from PageDesignTab so this surface doesn't pull in the ~2,300-line
// editor module. The full editor stays available as an author tool behind ?advanced=1.

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Palette, Check, Layers, FileText, Loader2, ChevronDown, ExternalLink,
  Info, Sparkles, X, AlertTriangle,
} from "lucide-react";
import { getPath } from "../../utils/basePath";
import { BUILT_IN_TEMPLATES } from "./editor/templates";

// ── Mini home-page thumbnail per layout family, painted in the template's own
//    swatch (copied from PageDesignTab — see notes there). ───────────────────────
function TemplateHomeThumb({ tpl }) {
  const family = tpl.layoutFamily || "classic";
  const p = tpl.colorSwatch?.primary || "#8A2680";
  const s = tpl.colorSwatch?.secondary || "#9333EA";
  const bg = tpl.colorSwatch?.background || "#F8F9FD";
  const dark = (() => {
    const h = bg.replace("#", "");
    if (h.length < 6) return false;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();
  const line = dark ? "rgba(255,255,255,.28)" : "rgba(15,23,42,.22)";
  const lineSoft = dark ? "rgba(255,255,255,.14)" : "rgba(15,23,42,.10)";
  const surface = dark ? "rgba(255,255,255,.07)" : "#ffffff";
  const frame = {
    height: 76, borderRadius: 8, background: bg, overflow: "hidden",
    border: "1px solid rgba(15,23,42,.12)", position: "relative", pointerEvents: "none",
  };

  if (family === "gumroad") {
    const ink = "#26271c";
    return (
      <div style={frame} aria-hidden>
        <div style={{ height: 11, borderBottom: `1.5px solid ${ink}`, display: "flex", alignItems: "center", gap: 3, padding: "0 5px" }}>
          <span style={{ width: 10, height: 3.5, borderRadius: 2, background: ink }} />
          <span style={{ flex: 1 }} />
          <span style={{ width: 7, height: 3.5, borderRadius: 2, background: p }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 3, padding: 4, height: "calc(100% - 11px)" }}>
          <div style={{ gridRow: "span 2", background: "#fffdfa", border: `1.5px solid ${ink}`, borderRadius: 5, boxShadow: `2px 2px 0 ${ink}`, padding: 4, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
            <span style={{ width: "78%", height: 8, borderRadius: 2, background: ink }} />
            <span style={{ width: "52%", height: 4, borderRadius: 2, background: "rgba(38,39,28,.35)" }} />
            <span style={{ width: 22, height: 7, borderRadius: 3, background: s, border: `1px solid ${ink}`, marginTop: 2 }} />
          </div>
          <div style={{ gridColumn: "span 2", background: ink, border: `1.5px solid ${ink}`, borderRadius: 5, boxShadow: `2px 2px 0 ${ink}` }} />
          <div style={{ background: p, border: `1.5px solid ${ink}`, borderRadius: 5, boxShadow: `2px 2px 0 ${ink}` }} />
          <div style={{ background: s, border: `1.5px solid ${ink}`, borderRadius: 5, boxShadow: `2px 2px 0 ${ink}` }} />
        </div>
      </div>
    );
  }

  if (family === "studio-dark") {
    return (
      <div style={{ ...frame, display: "grid", gridTemplateColumns: "14px 1fr" }} aria-hidden>
        <div style={{ background: "rgba(0,0,0,.45)", borderRight: `1px solid ${lineSoft}`, padding: "4px 3px", display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ width: "100%", height: 4, borderRadius: 2, background: s, opacity: 0.85 }} />
          {[0, 1, 2].map((i) => <span key={i} style={{ width: "100%", height: 2.5, borderRadius: 2, background: i === 0 ? p : lineSoft }} />)}
          <span style={{ flex: 1 }} />
          <span style={{ width: "100%", height: 6, borderRadius: 2, border: `1px solid ${lineSoft}` }} />
        </div>
        <div style={{ display: "grid", gridTemplateRows: "1fr 9px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 5, padding: 5 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
              <span style={{ width: "85%", height: 9, borderRadius: 2, background: s }} />
              <span style={{ width: "46%", height: 9, borderRadius: 2, background: p }} />
              <span style={{ width: 24, height: 6, borderRadius: 99, border: `1px solid ${p}`, marginTop: 3 }} />
            </div>
            <div style={{ border: `1px solid ${lineSoft}`, borderRadius: 4, display: "flex", flexDirection: "column", justifyContent: "space-evenly", padding: "2px 4px" }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: i === 0 ? "88%" : "64%", height: 3, borderRadius: 2, background: i === 0 ? p : line, opacity: i === 0 ? 0.9 : 1 }} />)}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${lineSoft}`, display: "flex", alignItems: "center", gap: 3, padding: "0 5px", overflow: "hidden" }}>
            {[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 12, height: 3, borderRadius: 2, background: i % 2 ? p : line, flexShrink: 0, opacity: 0.8 }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (family === "verdure") {
    const moss = "#1F3A2C", cream = "#F4ECDB", terra = "#BC5E3E", ruleC = "#D4C9AC";
    return (
      <div style={{ ...frame, background: cream, position: "relative", display: "grid", placeItems: "center" }} aria-hidden>
        <span style={{ position: "absolute", top: 5, left: 5, width: 9, height: 9, borderRadius: "50%", background: moss }} />
        <div style={{ position: "relative", width: 38, height: 38, borderRadius: "50%", background: moss, display: "grid", placeItems: "center" }}>
          <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 18, color: cream, lineHeight: 1 }}>50</span>
          <span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1px dashed ${terra}`, opacity: 0.5 }} />
        </div>
        <div style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 2, padding: "2px 4px", borderRadius: 99, background: moss }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: terra }} />
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(244,236,219,.4)" }} />)}
        </div>
        <span style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", width: 1, height: 22, background: ruleC }} />
      </div>
    );
  }

  // classic family — the original layout, repainted
  return (
    <div style={frame} aria-hidden>
      <div style={{ height: 11, background: surface, borderBottom: `1px solid ${lineSoft}`, display: "flex", alignItems: "center", gap: 3, padding: "0 5px" }}>
        <span style={{ width: 5, height: 5, borderRadius: 99, background: p }} />
        <span style={{ flex: 1 }} />
        <span style={{ width: 9, height: 3, borderRadius: 2, background: line }} />
        <span style={{ width: 9, height: 3, borderRadius: 2, background: line }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3.5, paddingTop: 8 }}>
        <span style={{ width: "54%", height: 8, borderRadius: 2, background: p }} />
        <span style={{ width: "38%", height: 4, borderRadius: 2, background: line }} />
        <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
          <span style={{ width: 26, height: 11, borderRadius: 3, background: surface, border: `1px solid ${lineSoft}`, boxShadow: dark ? "none" : "0 1px 2px rgba(15,23,42,.08)" }} />
          <span style={{ width: 26, height: 11, borderRadius: 3, background: surface, border: `1px solid ${lineSoft}`, boxShadow: dark ? "none" : "0 1px 2px rgba(15,23,42,.08)" }} />
        </div>
        <span style={{ width: 34, height: 8, borderRadius: 99, background: `linear-gradient(90deg, ${p}, ${s})`, marginTop: 1 }} />
      </div>
    </div>
  );
}

const GALLERY_SLIDES = [
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

// Live preview gallery — iframes /template-preview (real layout + mock data),
// scaled to fit. Copied from PageDesignTab.
function TemplateGallery({ slug }) {
  const FRAME_W = 1280;
  const FRAME_H = 860;
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(0.55);
  const wrapRef = useRef(null);

  useEffect(() => { setIdx(0); }, [slug]);
  useEffect(() => { setLoading(true); }, [idx, slug]);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setScale(el.clientWidth / FRAME_W);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const slide = GALLERY_SLIDES[idx];
  const src = getPath(`/template-preview?slug=${slug}&page=${slide.page}${slide.variant ? `&variant=${slide.variant}` : ""}`);
  const go = (d) => setIdx((i) => (i + d + GALLERY_SLIDES.length) % GALLERY_SLIDES.length);

  return (
    <div>
      <div ref={wrapRef} className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-[#0b0b08]" style={{ height: FRAME_H * scale }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/30">
            <Loader2 className="w-6 h-6 text-white/80 animate-spin" />
          </div>
        )}
        <iframe
          key={src}
          src={src}
          title={slide.label}
          onLoad={() => setLoading(false)}
          scrolling="no"
          style={{ width: FRAME_W, height: FRAME_H, border: 0, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}
        />
        <div className="absolute top-2 left-2 z-20 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur text-white text-[11px] font-bold tracking-wide">
          {idx + 1}/{GALLERY_SLIDES.length} · {slide.label}
        </div>
        <button type="button" onClick={() => go(-1)} aria-label="ก่อนหน้า" className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-slate-700 transition-colors">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="ถัดไป" className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-slate-700 transition-colors">
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>
      <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2.5">
        {GALLERY_SLIDES.map((s, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)} aria-label={s.label} title={s.label}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-[#8A2680]" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`} />
        ))}
      </div>
      {["verdure", "studio-dark", "gumroad"].includes(BUILT_IN_TEMPLATES[slug]?.layoutFamily) && (
        <a href={getPath(`/template-playground?slug=${slug}`)} target="_blank" rel="noopener noreferrer"
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#8A2680] hover:bg-[#9333EA] text-white text-sm font-bold transition-colors">
          <ExternalLink className="w-4 h-4" /> เปิดแบบโต้ตอบ — กดเล่นได้จริง
        </a>
      )}
    </div>
  );
}

// ── One big card per layout family ────────────────────────────────────────────
function ChooserCard({ rep, themes, activeSlug, onApply, onPreview }) {
  const isActive = themes.some((t) => t.slug === activeSlug);
  const shown = themes.find((t) => t.slug === activeSlug) || rep;
  const primary = shown.colorSwatch?.primary || "#8A2680";
  const bg = shown.colorSwatch?.background || "#F8F9FD";
  const multiTheme = themes.length > 1;
  const isClassic = (rep.layoutFamily || "classic") === "classic";

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border-2 bg-white overflow-hidden transition-all duration-200 ${isActive ? "shadow-lg" : "border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
      style={isActive ? { borderColor: primary } : undefined}
    >
      {isActive && (
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-md" style={{ backgroundColor: primary }}>
          <Check className="w-3.5 h-3.5" strokeWidth={3} /> กำลังใช้อยู่
        </div>
      )}

      {/* hero preview */}
      <button type="button" onClick={() => onPreview(shown.slug)} className="block w-full text-left" title="ดูตัวอย่างเต็ม">
        <div className="flex items-center justify-center px-6 py-6 cursor-zoom-in" style={{ background: bg, minHeight: 132 }}>
          <div style={{ width: 210, maxWidth: "85%" }}>
            <TemplateHomeThumb tpl={shown} />
          </div>
        </div>
      </button>

      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-base text-slate-800 leading-tight">{rep.name}</div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wide mt-0.5">{rep.layoutFamily || rep.slug}</div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 min-h-[2rem]">{rep.description}</p>

        {/* colour themes (classic family) */}
        {multiTheme && (
          <div className="mt-3">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">ธีมสี ({themes.length})</div>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => {
                const on = t.slug === activeSlug;
                const a = t.colorSwatch?.primary || "#8A2680";
                const b = t.colorSwatch?.secondary || a;
                return (
                  <button key={t.slug} type="button" title={t.name} aria-label={`ใช้ธีม ${t.name}`} onClick={() => onApply(t.slug, t.name)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${on ? "scale-110" : "hover:scale-105"}`}
                    style={{ background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)`, borderColor: on ? primary : "#ffffff", boxShadow: on ? `0 0 0 2px ${primary}55` : "0 1px 2px rgba(15,23,42,.18)" }} />
                );
              })}
            </div>
          </div>
        )}

        {/* editable-scope + counts */}
        <div className="flex items-center flex-wrap gap-1.5 mt-3">
          {isClassic ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
              <Check className="w-2.5 h-2.5" /> แก้รายชิ้นได้ (โหมดขั้นสูง)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-md">
              <Palette className="w-2.5 h-2.5" /> ปรับสี + ข้อความกลาง
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
            <FileText className="w-2.5 h-2.5" /> {shown.pageCount ?? "—"} หน้า
          </span>
        </div>

        {/* actions */}
        <div className="flex items-center gap-2 mt-4 pt-1">
          <button type="button" onClick={() => onPreview(shown.slug)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95">
            <Sparkles className="w-4 h-4 text-purple-500" /> ดูตัวอย่าง
          </button>
          {isActive ? (
            <span className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 cursor-default">
              <Check className="w-4 h-4" /> ใช้อยู่
            </span>
          ) : (
            <button type="button" onClick={() => onApply(rep.slug, rep.name)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all active:scale-95 hover:brightness-110"
              style={{ backgroundColor: primary }}>
              ใช้ธีมนี้
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplateChooserTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState(null);
  const [previewSlug, setPreviewSlug] = useState(null);
  const [pending, setPending] = useState(null); // { slug, name }
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
      setActiveSlug(layout.activeTemplateId || "classic");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const families = useMemo(() => {
    const FAMILY_ORDER = ["classic", "gumroad", "studio-dark", "verdure", "original"];
    const REP = { classic: "classic", gumroad: "gumroad", "studio-dark": "studio-dark", verdure: "verdure", original: "original" };
    const groups = {};
    for (const t of templates) {
      const fam = t.layoutFamily || "classic";
      (groups[fam] || (groups[fam] = [])).push(t);
    }
    return Object.entries(groups)
      .map(([family, themes]) => {
        const rep = themes.find((t) => t.slug === (REP[family] || family)) || themes[0];
        return { family, rep, themes: [rep, ...themes.filter((t) => t !== rep)] };
      })
      .sort((a, b) => {
        const ai = FAMILY_ORDER.indexOf(a.family), bi = FAMILY_ORDER.indexOf(b.family);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
  }, [templates]);

  const activeName = useMemo(
    () => templates.find((t) => t.slug === activeSlug)?.name || activeSlug,
    [templates, activeSlug]
  );

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
      <div className="flex items-start gap-3 mb-1">
        <div className="bg-purple-50 text-[#8A2680] p-2.5 rounded-xl shrink-0">
          <Palette className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-800">เลือกธีมเว็บไซต์</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            เลือกหน้าตาของระบบเลือกตั้ง — กด “ใช้ธีมนี้” แล้ว <strong className="text-slate-600">หน้าเว็บสาธารณะเปลี่ยนทันที</strong>
          </p>
        </div>
      </div>

      {/* current */}
      {!loading && (
        <div className="flex items-center gap-2 mt-3 mb-6 text-sm">
          <span className="text-slate-400">กำลังใช้:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8A2680] text-white font-bold text-xs">
            <Check className="w-3.5 h-3.5" /> {activeName}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดธีม...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {families.map((fam) => (
            <ChooserCard
              key={fam.family}
              rep={fam.rep}
              themes={fam.themes}
              activeSlug={activeSlug}
              onApply={(slug, name) => setPending({ slug, name })}
              onPreview={(slug) => setPreviewSlug(slug)}
            />
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-8 border-t border-slate-100 pt-4">
        แต่ละธีมรองรับครบทุกหน้า · เนื้อหา (ชื่อ/ปี/ผู้สมัคร) แก้ที่แท็บ “ตั้งค่าทั่วไป” และ “จัดการผู้สมัคร”
      </p>

      {/* preview modal */}
      {previewSlug && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setPreviewSlug(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                ตัวอย่าง: {templates.find((t) => t.slug === previewSlug)?.name || previewSlug}
              </h3>
              <button type="button" onClick={() => setPreviewSlug(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <TemplateGallery slug={previewSlug} />
            <div className="flex items-center gap-2 mt-4">
              <button type="button" onClick={() => setPreviewSlug(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                ปิด
              </button>
              {previewSlug !== activeSlug && (
                <button type="button"
                  onClick={() => { const t = templates.find((x) => x.slug === previewSlug); setPreviewSlug(null); setPending({ slug: previewSlug, name: t?.name || previewSlug }); }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#8A2680] text-white font-bold text-sm hover:bg-[#751f6c]">
                  ใช้ธีมนี้
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* confirm apply */}
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

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-xl animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}
