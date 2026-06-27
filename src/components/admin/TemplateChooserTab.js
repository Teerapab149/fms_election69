"use client";

// TemplateChooserTab — staff-facing "pick a theme" surface, showcase style.
//
// Direction (2026-06-27, owner): the product is "choose 1 of N templates", NOT a
// web editor. Each template is shown as its OWN ROW with a live slideshow of the
// REAL pages (iframes /template-preview) — slide through home / candidates / vote
// / results / … — then apply with one click (sets SystemConfig.activeTemplateId,
// live immediately, no draft/publish).
//
// Perf: one iframe per row, only the current slide loads, and each row's iframe
// is lazy-mounted when it scrolls into view — so opening the tab doesn't fire N
// previews at once. Self-contained (no import of the ~2,300-line editor module).

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Palette, Check, FileText, Loader2, ChevronLeft, ChevronRight,
  ExternalLink, AlertTriangle,
} from "lucide-react";
import { getPath } from "../../utils/basePath";
import { BUILT_IN_TEMPLATES } from "./editor/templates";

const FRAME_W = 1280;
const FRAME_H = 860;

// Real pages + key state variations shown in each template's slideshow.
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

// ── One ROW per template family: header + live real-page slideshow ─────────────
function TemplateRow({ rep, themes, activeSlug, onApply }) {
  const multiTheme = themes.length > 1;
  const isClassic = (rep.layoutFamily || "classic") === "classic";

  // The theme being previewed/targeted in this family (classic carries colour
  // themes as swatches). Defaults to whichever theme of this family is active.
  const familyActive = themes.find((t) => t.slug === activeSlug);
  const [selSlug, setSelSlug] = useState((familyActive || rep).slug);
  useEffect(() => {
    if (familyActive && familyActive.slug !== selSlug) setSelSlug(familyActive.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  const sel = themes.find((t) => t.slug === selSlug) || rep;
  const primary = sel.colorSwatch?.primary || "#8A2680";
  const isSelActive = selSlug === activeSlug;

  // slideshow + lazy-mount + responsive scale
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [scale, setScale] = useState(0.5);
  const sectionRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { rootMargin: "250px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setScale(el.clientWidth / FRAME_W);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [inView]);

  useEffect(() => { setLoaded(false); }, [idx, selSlug]);

  const slide = GALLERY_SLIDES[idx];
  const src = getPath(`/template-preview?slug=${selSlug}&page=${slide.page}${slide.variant ? `&variant=${slide.variant}` : ""}`);
  const go = (d) => setIdx((i) => (i + d + GALLERY_SLIDES.length) % GALLERY_SLIDES.length);

  return (
    <section ref={sectionRef} className="py-7 border-b border-slate-100 last:border-0">
      {/* header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-bold text-slate-800">{rep.name}</h3>
            {isSelActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[11px] font-bold" style={{ backgroundColor: primary }}>
                <Check className="w-3 h-3" strokeWidth={3} /> กำลังใช้อยู่
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{rep.layoutFamily || rep.slug}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl line-clamp-1">{rep.description}</p>

          {multiTheme && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">ธีมสี</span>
              {themes.map((t) => {
                const on = t.slug === selSlug;
                const a = t.colorSwatch?.primary || "#8A2680";
                const b = t.colorSwatch?.secondary || a;
                return (
                  <button key={t.slug} type="button" title={t.name} aria-label={`พรีวิวธีม ${t.name}`} onClick={() => setSelSlug(t.slug)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${on ? "scale-110" : "hover:scale-105"}`}
                    style={{ background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)`, borderColor: on ? primary : "#ffffff", boxShadow: on ? `0 0 0 2px ${primary}55` : "0 1px 2px rgba(15,23,42,.18)" }} />
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-1 rounded-md">
            {isClassic ? <><Check className="w-2.5 h-2.5" /> แก้รายชิ้นได้</> : <><Palette className="w-2.5 h-2.5" /> ปรับสี + ข้อความ</>}
          </span>
          {isSelActive ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 cursor-default">
              <Check className="w-4 h-4" /> ใช้อยู่
            </span>
          ) : (
            <button type="button" onClick={() => onApply(sel.slug, sel.name)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-sm transition-all active:scale-95 hover:brightness-110"
              style={{ backgroundColor: primary }}>
              ใช้ธีมนี้
            </button>
          )}
        </div>
      </div>

      {/* slideshow of REAL pages */}
      <div className="w-full max-w-3xl">
        <div ref={wrapRef} className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-[#0b0b08]" style={{ height: FRAME_H * scale }}>
          {!inView || !loaded ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40">
              <Loader2 className="w-6 h-6 text-white/80 animate-spin" />
            </div>
          ) : null}
          {inView && (
            <iframe
              key={src}
              src={src}
              title={`${rep.name} — ${slide.label}`}
              onLoad={() => setLoaded(true)}
              scrolling="no"
              style={{ width: FRAME_W, height: FRAME_H, border: 0, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}
            />
          )}

          <div className="absolute top-2 left-2 z-20 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur text-white text-[11px] font-bold tracking-wide">
            {idx + 1}/{GALLERY_SLIDES.length} · {slide.label}
          </div>
          <button type="button" onClick={() => go(-1)} aria-label="หน้าก่อนหน้า"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="หน้าถัดไป"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-slate-700 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* page dots + open-full link */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex items-center flex-wrap gap-1.5">
            {GALLERY_SLIDES.map((s, i) => (
              <button key={i} type="button" onClick={() => setIdx(i)} aria-label={s.label} title={s.label}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-[#8A2680]" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`} />
            ))}
          </div>
          <a href={getPath(`/template-preview?slug=${selSlug}&page=${slide.page}${slide.variant ? `&variant=${slide.variant}` : ""}`)} target="_blank" rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-[#8A2680] transition-colors">
            <ExternalLink className="w-3 h-3" /> เปิดเต็มจอ
          </a>
        </div>
      </div>
    </section>
  );
}

export default function TemplateChooserTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState(null);
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
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* header */}
      <div className="flex items-start gap-3 mb-1">
        <div className="bg-purple-50 text-[#8A2680] p-2.5 rounded-xl shrink-0">
          <Palette className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-800">เลือกธีมเว็บไซต์</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            เลื่อนดูหน้าจริงของแต่ละธีม แล้วกด “ใช้ธีมนี้” — <strong className="text-slate-600">หน้าเว็บสาธารณะเปลี่ยนทันที</strong>
          </p>
        </div>
      </div>

      {!loading && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          <span className="text-slate-400">กำลังใช้:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8A2680] text-white font-bold text-xs">
            <Check className="w-3.5 h-3.5" /> {activeName}
          </span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดธีม...
        </div>
      ) : (
        <div className="mt-4 bg-white rounded-2xl border border-slate-200 px-5 lg:px-7 divide-y divide-slate-100">
          {families.map((fam) => (
            <TemplateRow
              key={fam.family}
              rep={fam.rep}
              themes={fam.themes}
              activeSlug={activeSlug}
              onApply={(slug, name) => setPending({ slug, name })}
            />
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-6 pt-1">
        แต่ละธีมรองรับครบทุกหน้า · เนื้อหา (ชื่อ/ปี/ผู้สมัคร) แก้ที่แท็บ “ตั้งค่าทั่วไป” และ “จัดการผู้สมัคร”
      </p>

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
