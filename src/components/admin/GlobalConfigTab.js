"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save, Loader2, CheckCircle2, AlertCircle, AlertTriangle, CircleCheck, CircleDashed,
  ChevronDown, Building2, Upload, RotateCcw, MapPin, PencilLine, Wand2,
} from "lucide-react";
import { GLOBAL_CONFIG_FIELDS, GLOBAL_CONFIG_DEFAULTS } from "../../utils/globalConfigDefaults";
import { DERIVED, isCustom, applyDerived } from "../../utils/globalConfigDerive.mjs";
import { setupChecklist, thaiDuration } from "../../utils/setupChecklist.mjs";
import ThaiDateTimeField from "./ThaiDateTimeField";
import { getPath } from "../../utils/basePath";
import { resolveElectionPosterPath } from "../../utils/electionPoster.mjs";
import { useGlobalConfig, useGlobalConfigUpdate } from "../../contexts/GlobalConfigContext";
import { parseBangkok } from "../../utils/electionConfig";
import { evaluationPromptText } from "../../utils/activityHours";

// ตั้งค่าทั่วไป = the election's DATA (names, years, dates, poster, form link).
// Commanding the system (modes, showing results, certifying) is ตั้งค่าระบบ's
// job and deliberately not here: saving this form never opens or closes polls.
//
// Layout: the things set again every year come first as a checklist — what each
// is now, and whether it is ready — and open in place to edit. The faculty's
// names, which almost never change, fold into one line underneath.

// labels and "แสดงที่" lines live with the field metadata, one source
const FIELD = Object.fromEntries(GLOBAL_CONFIG_FIELDS.flatMap((g) => g.fields.map((f) => [f.key, f])));

// ── image field ──
// Uploads through /api/admin/global-config/banner and stores only the returned
// path in the config value, so the poster follows the same save/undo flow as
// every text field — the upload happens immediately, the VALUE still needs the
// page's Save button, exactly like typing in a name does.
function ImageField({ value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const hasCustomPoster = Boolean(String(value ?? "").trim());
  const posterSrc = getPath(resolveElectionPosterPath({ electionBannerUrl: value }));

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";              // allow re-picking the same file after an error
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(getPath("/api/admin/global-config/banner"), {
        method: "POST", body: fd, credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "อัปโหลดไม่สำเร็จ");
      onChange(json.url);
    } catch (e2) {
      setErr(e2.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid sm:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={posterSrc} alt={hasCustomPoster ? "โปสเตอร์ที่อัปโหลดไว้" : "โปสเตอร์เริ่มต้นของระบบ"} className="w-full h-auto block" />
      </div>
      <div>
        {/* the fallback is the checked-in generic poster (no date, no edition
            number on it), so using it is fine — just say which one is showing */}
        {!hasCustomPoster && (
          <p className="text-[13px] text-slate-600 mb-3">
            ยังไม่ได้อัปโหลด หน้าเว็บจึงใช้โปสเตอร์เริ่มต้นของระบบ (ภาพนี้) อัปโหลดโปสเตอร์ของปีนี้แทนได้ถ้ามี
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" />
          <button
            type="button" disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8A2680] hover:bg-[#6E1F67] disabled:bg-slate-300 text-white text-sm font-bold transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {hasCustomPoster ? "เปลี่ยนรูป" : "อัปโหลดโปสเตอร์ปีนี้"}
          </button>
          {hasCustomPoster && (
            <button
              type="button" onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-red-300 hover:text-red-600 text-slate-500 text-sm font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> เอาออก
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">JPG, PNG หรือ WebP · ถ้าโปสเตอร์ใหม่มีวันที่ ตรวจว่าตรงกับวันเลือกตั้งจริง</p>
        {err && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
            <AlertCircle className="w-4 h-4" /> {err}
          </p>
        )}
      </div>
    </div>
  );
}

// electionName is no longer an editable field — it is auto-derived from the
// prefix + number on save so it can never drift from the "SAMO 50" badge.
// The KEY is kept in the payload because many surfaces read it (hero-title
// default, results title, layout metadata, VerdureChrome number fallback).
//
// ⚠️ CFG-DUAL — the element editor's `hero-title` instance is bound to it
// (src/components/admin/editor/elementInstances.js → boundTo: "electionName").
// handleSave() therefore re-derives only when prefix/number actually changed,
// so a custom title set there survives unrelated saves. If you change either
// side, change both.
function deriveElectionName(cfg) {
  return [cfg?.electionNamePrefix, cfg?.electionNumber]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

const INPUT = "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-[#8A2680] focus:ring-2 focus:ring-[#8A2680]/15 focus:outline-none text-sm text-slate-800 transition-colors";

const TONE = {
  ok:   { Icon: CircleCheck,   icon: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700" },
  none: { Icon: CircleDashed,  icon: "text-slate-400",   chip: "bg-slate-100 text-slate-600" },
  warn: { Icon: AlertTriangle, icon: "text-amber-500",   chip: "bg-amber-50 text-amber-700" },
  err:  { Icon: AlertCircle,   icon: "text-red-600",     chip: "bg-red-50 text-red-700" },
};

// a labelled control with its "แสดงที่" line
function Field({ k, label, children, aside = null }) {
  const f = FIELD[k] || {};
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={`gc-${k}`} className="text-[13px] font-bold text-slate-800">{label ?? f.label}</label>
        {aside}
      </div>
      {children}
      {f.where && (
        <p className="flex items-start gap-1 text-xs text-slate-500 mt-1.5 leading-relaxed">
          <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" />
          <span>แสดงที่: {f.where}</span>
        </p>
      )}
    </div>
  );
}

/**
 * GlobalConfigTab — admin form to edit globalConfig.
 * Reads/writes via /api/admin/global-config; admin identity = the httpOnly
 * admin_token cookie (sent automatically — P0-1). Saving pushes the new config
 * into GlobalConfigContext so other surfaces re-render without a reload.
 */
export default function GlobalConfigTab() {
  const ctxConfig = useGlobalConfig();
  const { replaceConfig } = useGlobalConfigUpdate();

  // derived keys the admin writes by hand (utils/globalConfigDerive). Seeded from
  // what is stored: a value that differs from the assembled one is the admin's
  // own wording and must never be silently replaced.
  const customKeys = (cfg) => new Set(Object.keys(DERIVED).filter((k) => isCustom(k, cfg)));

  const [config, setConfig] = useState(ctxConfig);
  const [baseline, setBaseline] = useState(ctxConfig);   // what is saved — for "changed" and ยกเลิก
  const [manual, setManual] = useState(() => customKeys(ctxConfig));
  const [open, setOpen] = useState(() => new Set());
  const [orgOpen, setOrgOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  // CFG-DUAL: prefix/number as they stood the last time this form took a value
  // from the server/Context — see deriveElectionName.
  const derivedFromRef = useRef({ prefix: ctxConfig?.electionNamePrefix, number: ctxConfig?.electionNumber });

  function adopt(cfg) {
    setConfig(cfg);
    setBaseline(cfg);
    setManual(customKeys(cfg));
    derivedFromRef.current = { prefix: cfg?.electionNamePrefix, number: cfg?.electionNumber };
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(getPath("/api/admin/global-config"), { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (data.globalConfig) {
          const merged = { ...GLOBAL_CONFIG_DEFAULTS, ...data.globalConfig };
          adopt(merged);
          replaceConfig(merged);
        }
      } catch (e) {
        console.error(e);
        setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }
    load();
    // replaceConfig is stable (useCallback) — safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mirror changes made elsewhere (another tab, the element editor)
  useEffect(() => {
    adopt(ctxConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxConfig]);

  function set(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  }

  // number inputs: some blanks are valid answers (activityHours), never 0; below
  // min is refused outright so the field visibly snaps back
  function setNumber(key, raw) {
    const f = FIELD[key] || {};
    if (f.allowEmpty && raw === "") return set(key, "");
    const num = Number(raw);
    if (f.min !== undefined && (!Number.isFinite(num) || num < f.min)) return;
    set(key, num);
  }

  function setManualKey(key, on) {
    const assembled = applyDerived(config, manual)[key];
    setManual((prev) => {
      const next = new Set(prev);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
    if (on) set(key, assembled);
    setSavedAt(null);
  }

  function toggle(key) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // what the site will show once saved — derived keys filled in
  const view = applyDerived(config, manual);
  const changed = Object.keys({ ...baseline, ...view }).filter(
    (k) => k !== "electionName" && String(view[k] ?? "") !== String(baseline?.[k] ?? "")
  );

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const base = derivedFromRef.current;
      const nameSourceChanged =
        String(view.electionNamePrefix ?? "") !== String(base.prefix ?? "") ||
        String(view.electionNumber ?? "") !== String(base.number ?? "");
      const payload = (nameSourceChanged || !String(view.electionName ?? "").trim())
        ? { ...view, electionName: deriveElectionName(view) }
        : { ...view };
      const res = await fetch(getPath("/api/admin/global-config"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalConfig: payload }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("เซสชันผู้ดูแลหมดอายุหรือยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบผู้ดูแลในแท็บใหม่ แล้วกลับมากดบันทึกอีกครั้ง ข้อมูลที่แก้ไขยังอยู่ในฟอร์มนี้");
        }
        throw new Error(result.error || `บันทึกไม่สำเร็จ (HTTP ${res.status})`);
      }
      const savedConfig = result.globalConfig || payload;
      replaceConfig(savedConfig);
      adopt(savedConfig);
      setSavedAt(new Date());
    } catch (e) {
      setError(e.message || "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setConfig(baseline);
    setManual(customKeys(baseline));
    setError(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#8A2680]" />
      </div>
    );
  }

  const list = setupChecklist(view, new Date());
  const wordmark = deriveElectionName(view);

  // a key assembled from other fields: the result, and the way to take it over.
  // Plain render functions, not components: a component declared inside render
  // is a new type every keystroke, so React would remount the input and drop focus.
  function derived(k) {
    const isManual = manual.has(k);
    return (
      <Field
        k={k}
        aside={isManual
          ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">พิมพ์เอง</span>
          : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#8A2680]/10 text-[#8A2680]">ระบบประกอบให้</span>}
      >
        {isManual ? (
          <>
            <input id={`gc-${k}`} className={INPUT} value={config[k] ?? ""}
              onChange={(e) => (FIELD[k]?.type === "number" ? setNumber(k, e.target.value) : set(k, e.target.value))} />
            <button type="button" onClick={() => setManualKey(k, false)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#8A2680] hover:underline">
              <Wand2 className="w-3.5 h-3.5" /> ให้ระบบประกอบให้ ({String(applyDerived(config)[k] ?? "").trim() || "—"})
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-dashed border-slate-200">
            <span className="text-sm text-slate-700 break-words min-w-0">
              {String(view[k] ?? "").trim() || <span className="text-slate-400">ยังประกอบไม่ได้</span>}
            </span>
            <button type="button" onClick={() => setManualKey(k, true)}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#8A2680] hover:underline">
              <PencilLine className="w-3.5 h-3.5" /> พิมพ์เอง
            </button>
          </div>
        )}
      </Field>
    );
  }

  // ── the faculty's names, as fill-in-the-sentence ──
  // An outsider thinks in whole names ("change the project name"), not in the
  // parts they are assembled from. So each line shows the name exactly as the
  // site will, with only the editable part as a dashed slot sized to its text.

  // one dashed slot inside a sentence, with what it is written under it
  function slot(k, hint) {
    const v = String(config[k] ?? "");
    return (
      <span className="inline-flex flex-col gap-1">
        <input
          id={`gc-${k}`} aria-label={hint} value={v} onChange={(e) => set(k, e.target.value)}
          size={Math.max(3, [...v].length + 1)}
          className="h-10 px-2.5 rounded-lg border border-dashed border-[#8A2680]/50 bg-[#8A2680]/[0.04] text-[17px] text-slate-800 focus:border-solid focus:border-[#8A2680] focus:ring-2 focus:ring-[#8A2680]/15 focus:outline-none max-w-full"
        />
        <small className="text-[11px] text-slate-400 pl-0.5">{hint}</small>
      </span>
    );
  }

  // one line: the sentence (or, once written by hand, the whole name as one
  // field), where it shows up, and the switch between the two
  function sentence({ title, k = null, parts, after = null, where }) {
    const own = k && manual.has(k);
    return (
      <div className="py-4">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className="text-[13px] font-bold text-slate-800">{title}</span>
          {k && (
            <button type="button" onClick={() => setManualKey(k, !own)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#8A2680] hover:underline">
              {own ? <><Wand2 className="w-3.5 h-3.5" /> กลับไปเติมเฉพาะช่อง</> : <><PencilLine className="w-3.5 h-3.5" /> พิมพ์ชื่อเต็มเองทั้งหมด</>}
            </button>
          )}
        </div>
        {own ? (
          <input id={`gc-${k}`} aria-label={title} className={INPUT} value={config[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
        ) : (
          <div className="flex flex-wrap items-start gap-1.5 text-[17px] text-slate-800">{parts}</div>
        )}
        {after}
        {where && (
          <p className="flex items-start gap-1 text-xs text-slate-500 mt-2 leading-relaxed">
            <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" /><span>แสดงที่: {where}</span>
          </p>
        )}
      </div>
    );
  }

  // one date-and-time, picked and shown the Thai way (ThaiDateTimeField)
  function dateField(k) {
    return (
      <Field k={k}>
        <ThaiDateTimeField id={`gc-${k}`} value={config[k] ?? ""} onChange={(v) => set(k, v)} />
      </Field>
    );
  }

  const EDITORS = {
    edition: (
      <div className="grid sm:grid-cols-3 gap-4">
        <Field k="electionNamePrefix">
          <input id="gc-electionNamePrefix" className={INPUT} value={config.electionNamePrefix ?? ""} onChange={(e) => set("electionNamePrefix", e.target.value)} />
        </Field>
        <Field k="electionNumber">
          <input id="gc-electionNumber" type="number" className={INPUT} value={config.electionNumber ?? ""} onChange={(e) => setNumber("electionNumber", e.target.value)} />
        </Field>
        <Field k="academicYearTh">
          <input id="gc-academicYearTh" type="number" className={INPUT} value={config.academicYearTh ?? ""} onChange={(e) => setNumber("academicYearTh", e.target.value)} />
        </Field>
        <div className="sm:col-span-3 grid sm:grid-cols-2 gap-4 pt-1">
          {derived("electionCalendarYear")}
          {derived("copyrightYear")}
        </div>
      </div>
    ),
    schedule: (() => {
      const s = parseBangkok(config.electionStartAt);
      const e = parseBangkok(config.electionEndAt);
      return (
        <div className="grid lg:grid-cols-3 gap-4">
          {dateField("campaignStartAt")}
          {dateField("electionStartAt")}
          {dateField("electionEndAt")}
          {s && e && e > s && (
            <p className="lg:col-span-3 text-[13px] text-slate-600">เปิดรับลงคะแนน <b>{thaiDuration(e - s)}</b></p>
          )}
          <p className="lg:col-span-3 text-xs text-slate-500">
            โหมด AUTO เปิด-ปิดหีบตามเวลานี้ · การสั่งเปิด-ปิดด้วยมืออยู่ที่เมนู ตั้งค่าระบบ
          </p>
        </div>
      );
    })(),
    poster: <ImageField value={config.electionBannerUrl ?? ""} onChange={(v) => set("electionBannerUrl", v)} />,
    form: (
      <Field k="googleFormUrl">
        <input id="gc-googleFormUrl" className={INPUT} placeholder="https://forms.gle/…" value={config.googleFormUrl ?? ""} onChange={(e) => set("googleFormUrl", e.target.value)} />
      </Field>
    ),
    hours: (
      <div className="grid sm:grid-cols-[180px_minmax(0,1fr)] gap-4 items-start">
        <Field k="activityHours">
          <input id="gc-activityHours" type="number" className={INPUT} min={FIELD.activityHours?.min} step={FIELD.activityHours?.step}
            value={config.activityHours ?? ""} onChange={(e) => setNumber("activityHours", e.target.value)} />
        </Field>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-[13px] text-slate-600 sm:mt-6">
          ทุก template จะเขียนว่า <span className="font-semibold text-[#8A2680]">{evaluationPromptText(view)}</span>
        </div>
      </div>
    ),
  };

  const orgSummary = [view.campaignTitle, view.organizationName, `${view.facultyShortEn || "—"}@${view.university || "—"}`]
    .map((x) => String(x ?? "").trim()).filter(Boolean).join(" · ");

  return (
    <div className="max-w-4xl mx-auto p-6 pb-28">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800">ตั้งค่าทั่วไป</h2>
        <p className="text-sm text-slate-500 mt-1">ข้อมูลของการเลือกตั้งที่แสดงบนเว็บ · การสั่งเปิด-ปิดระบบอยู่ที่เมนู ตั้งค่าระบบ</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <a href={getPath("/admin/login")} target="_blank" rel="noopener noreferrer" className="block mt-2 underline font-medium">
            เปิดหน้าเข้าสู่ระบบผู้ดูแลในแท็บใหม่
          </a>
        </div>
      )}

      {/* ── this year's setup ── not overflow-hidden: the date picker opens
          past the card's edge, so the last row rounds its own corners instead */}
      <section className="bg-white rounded-2xl border border-slate-200">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">เตรียมการเลือกตั้ง {wordmark}</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">สิ่งที่ต้องตั้งใหม่ทุกปี · กดแต่ละแถวเพื่อแก้</p>
            </div>
            <p className="text-sm text-slate-600 whitespace-nowrap"><b className="text-lg text-slate-800">{list.ready}</b> / {list.total} พร้อม</p>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={list.total} aria-valuenow={list.ready}>
            <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${(list.ready / list.total) * 100}%` }} />
          </div>
        </div>

        <ul>
          {list.items.map((item) => {
            const t = TONE[item.tone];
            const isOpen = open.has(item.key);
            return (
              <li key={item.key} className="border-t border-slate-100 first:border-t-0 last:[&>button]:rounded-b-2xl">
                <button
                  type="button" onClick={() => toggle(item.key)} aria-expanded={isOpen}
                  className="w-full grid grid-cols-[24px_minmax(0,1fr)_auto_16px] items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <t.Icon className={`w-5 h-5 ${t.icon}`} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-slate-800">{item.title}</span>
                    <span className="block text-[13px] text-slate-500 truncate">{item.value}</span>
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${t.chip}`}>{item.status}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {isOpen && <div className="px-6 pb-6 pt-1 sm:pl-[60px]">{EDITORS[item.key]}</div>}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── the faculty's names: almost never change, so one folded line ── */}
      <section className="mt-5 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          type="button" onClick={() => setOrgOpen((v) => !v)} aria-expanded={orgOpen}
          className="w-full grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <Building2 className="w-5 h-5 text-slate-400" aria-hidden />
          <span className="min-w-0">
            <span className="block text-[15px] font-bold text-slate-800">
              ข้อมูลองค์กร <span className="text-xs font-normal text-slate-400 ml-1">แทบไม่ต้องแก้</span>
            </span>
            <span className="block text-[13px] text-slate-500 truncate">{orgSummary}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] text-slate-500">
            {orgOpen ? "ปิด" : "แก้ไข"} <ChevronDown className={`w-4 h-4 transition-transform ${orgOpen ? "rotate-180" : ""}`} aria-hidden />
          </span>
        </button>
        {orgOpen && (
          <div className="px-6 pb-6 pt-1 sm:pl-[60px] divide-y divide-slate-100">
            <p className="pb-3 text-[13px] text-slate-500">แก้เฉพาะช่องเส้นประ ส่วนที่เหลือระบบเติมให้</p>

            {sentence({
              title: "ชื่อโครงการ", k: "campaignTitle",
              parts: <><span className="py-2">โครงการเลือกตั้ง</span>{slot("committeeName", "ชื่อคณะกรรมการ")}</>,
              where: FIELD.campaignTitle?.where,
            })}

            {sentence({
              title: "ชื่อองค์กร", k: "organizationName",
              parts: <>{slot("organizationShort", "องค์กร")}{slot("facultyName", "คณะ")}</>,
              // written by hand, the full name no longer carries the faculty — which
              // other pages still use on its own — so keep that one slot beside it
              after: manual.has("organizationName") && (
                <div className="mt-3 flex flex-wrap items-start gap-1.5 text-[17px] text-slate-800">{slot("facultyName", "ชื่อคณะ (ใช้ต่อท้ายชื่อโครงการในหน้าอื่น)")}</div>
              ),
              where: `${FIELD.organizationName?.where} · ชื่อคณะต่อท้ายชื่อโครงการในหน้าผู้สมัคร ผลคะแนน พรรค`,
            })}

            {sentence({
              title: "ท้ายเว็บ",
              parts: (
                <>
                  <span className="py-2">©</span>{slot("facultyShortEn", "อักษรย่อคณะ")}
                  <span className="py-2">@</span>{slot("university", "มหาวิทยาลัย")}
                  <span className="py-2 text-slate-500">{String(view.copyrightYear ?? "").trim() || "—"}. All Rights Reserved.</span>
                </>
              ),
              where: "ท้ายทุกหน้า · ปีตั้งที่ \"ครั้งที่และปีการศึกษา\" ด้านบน",
            })}
          </div>
        )}
      </section>

      {/* ── save: only when there is something to save ── */}
      {(changed.length > 0 || savedAt) && (
        <div className="sticky bottom-4 mt-6 bg-white rounded-2xl border border-slate-200 shadow-lg p-4 flex items-center justify-between gap-4">
          {changed.length > 0 ? (
            <>
              <span className="text-sm text-slate-600">แก้ไข {changed.length} ช่อง · ยังไม่ได้บันทึก</span>
              <span className="flex items-center gap-2">
                <button type="button" onClick={handleCancel} disabled={saving}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  ยกเลิก
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="px-6 py-2 bg-[#8A2680] text-white text-sm font-bold rounded-lg hover:bg-[#7a2270] disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก…</> : <><Save className="w-4 h-4" /> บันทึก</>}
                </button>
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" /> บันทึกแล้ว
            </span>
          )}
        </div>
      )}

    </div>
  );
}
