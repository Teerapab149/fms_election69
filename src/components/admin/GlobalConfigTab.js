"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save, Loader2, CheckCircle2, RotateCcw, Eye,
  Vote, FolderOpen, Building2, CalendarClock, Copyright, Settings2, Link,
} from "lucide-react";
import { GLOBAL_CONFIG_FIELDS, GLOBAL_CONFIG_DEFAULTS } from "../../utils/globalConfigDefaults";
import { getPath } from "../../utils/basePath";
import { useGlobalConfig, useGlobalConfigUpdate } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";

// section-header icons (metadata carries the NAME so the data module stays
// component-free); falls back to a neutral glyph if a group has none.
const GROUP_ICONS = { Vote, FolderOpen, Building2, CalendarClock, Copyright, Link };

// electionName is no longer an editable field — it is auto-derived from the
// prefix + number on save so it can never drift from the "SAMO 50" badge.
// The KEY is kept in the payload because many surfaces read it (hero-title
// default, results title, layout metadata, VerdureChrome number fallback).
//
// ⚠️ CFG-DUAL — this is NOT the only writer of globalConfig.electionName.
// The element editor's `hero-title` instance is bound to it
// (src/components/admin/editor/elementInstances.js → boundTo: "electionName")
// and PropertyPanel writes it straight through updateField(). Deriving on
// EVERY save used to clobber that author's custom title silently, even when
// the admin had only touched an unrelated field. handleSave() below therefore
// re-derives only when prefix/number actually changed (see the comment there).
// If you change either side, change both.
function deriveElectionName(cfg) {
  return [cfg?.electionNamePrefix, cfg?.electionNumber]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

// year-ish display: numeric fields coerce blank → 0, which is never a real
// year, so show an em-dash instead of a bare "0" in previews.
function yearText(v) {
  const s = String(v ?? "").trim();
  return s && s !== "0" ? s : "—";
}

/**
 * GlobalConfigTab — admin form to edit globalConfig.
 * Reads/writes via /api/admin/global-config; admin identity = the httpOnly
 * admin_token cookie (sent automatically — P0-1).
 *
 * Stays in sync with the element editor: initial values come from
 * GlobalConfigContext (so any field already updated via PropertyPanel's bound
 * editor is reflected here), and saving pushes the new config back into the
 * Context via replaceConfig so other surfaces re-render without reload.
 */
export default function GlobalConfigTab() {
  const ctxConfig = useGlobalConfig();
  const { replaceConfig } = useGlobalConfigUpdate();

  const [config, setConfig] = useState(ctxConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  // CFG-DUAL: prefix/number as they stood the last time this form took a value
  // from the server/Context. handleSave compares against this to tell "the admin
  // renamed the election" apart from "the admin saved something else".
  const derivedFromRef = useRef({
    prefix: ctxConfig?.electionNamePrefix,
    number: ctxConfig?.electionNumber,
  });

  // Refresh from server once on mount, then keep tracking Context updates so the
  // form mirrors changes made elsewhere (e.g., bound element editor).
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(getPath("/api/admin/global-config"), {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (data.globalConfig) {
          const merged = { ...GLOBAL_CONFIG_DEFAULTS, ...data.globalConfig };
          setConfig(merged);
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

  // When the Context picks up a change from the element editor (or another tab),
  // mirror it locally so the user sees the synced value.
  useEffect(() => {
    setConfig(ctxConfig);
    derivedFromRef.current = {
      prefix: ctxConfig?.electionNamePrefix,
      number: ctxConfig?.electionNumber,
    };
  }, [ctxConfig]);

  function handleChange(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // auto-derive electionName so it always mirrors the "SAMO 50" badge;
      // keep the KEY (many pages read it) but never edit it directly.
      //
      // CFG-DUAL: only re-derive when the source fields moved. electionName has
      // a second writer (the bound `hero-title` element editor — see the note on
      // deriveElectionName above), and rewriting on every save silently threw
      // that value away. Renaming the election still wins, so CFG-1 holds where
      // it matters; a save that never touched prefix/number now leaves the name
      // alone. A blank stored name is still healed — nothing to lose there.
      const base = derivedFromRef.current;
      const nameSourceChanged =
        String(config.electionNamePrefix ?? "") !== String(base.prefix ?? "") ||
        String(config.electionNumber ?? "") !== String(base.number ?? "");
      const payload = (nameSourceChanged || !String(config.electionName ?? "").trim())
        ? { ...config, electionName: deriveElectionName(config) }
        : { ...config };
      const res = await fetch(getPath("/api/admin/global-config"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalConfig: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      replaceConfig(payload);
      setConfig(payload);
      derivedFromRef.current = {
        prefix: payload.electionNamePrefix,
        number: payload.electionNumber,
      };
      setSavedAt(new Date());
    } catch (e) {
      console.error(e);
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function handleResetField(key) {
    setConfig((prev) => ({ ...prev, [key]: GLOBAL_CONFIG_DEFAULTS[key] }));
    setSavedAt(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#8A2680]" />
      </div>
    );
  }

  // live composed-output preview per section (id set in field metadata) — shows
  // the admin what their inputs BECOME on the real site, so the several
  // name/year/date fields stop reading as redundant and you can see how they
  // assemble. Pure display; reads config, never writes.
  function renderPreview(id) {
    let body = null;

    if (id === "election") {
      const badge = deriveElectionName(config) || "—";
      body = (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#8A2680]/10 text-[#8A2680] text-sm font-black tabular-nums">
            {badge}
          </span>
          <span className="text-xs text-slate-500">
            ประจำปีการศึกษา <b className="text-slate-700 tabular-nums">{yearText(config.academicYearTh)}</b>
            <span className="mx-1.5 text-slate-300">·</span>
            ปีปฏิทิน <b className="text-slate-700 tabular-nums">{yearText(config.electionCalendarYear)}</b>
          </span>
        </div>
      );
    } else if (id === "org") {
      const t = (v) => String(v ?? "").trim() || "—";
      body = (
        <>
          {/* stacked identity block — mirrors how the fields land on the hero */}
          <div className="space-y-0.5">
            <div className="text-sm font-black text-slate-800 whitespace-pre-line break-words leading-snug">
              {t(config.campaignTitle)}
            </div>
            <div className="text-sm font-semibold text-slate-600 break-words">
              {t(config.organizationName)}
            </div>
            <div className="text-xs text-slate-500 break-words">
              {t(config.facultyName)}
              <span className="mx-1 text-slate-300">·</span>
              {t(config.university)}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-400 leading-relaxed break-words">
            ย่อ {t(config.organizationShort)}
            <span className="mx-1 text-slate-300">·</span>
            {t(config.facultyShortEn)}@{t(config.university)}
            <span className="mx-1.5 text-slate-300">|</span>
            โครงการเลือกตั้ง{t(config.committeeName)}
          </div>
        </>
      );
    } else if (id === "schedule") {
      const d = resolveElectionDates(config);
      const rows = [
        { label: "เปิดตัวผู้สมัคร", date: d.CAMPAIGN_START, isDefault: !String(config.campaignStartAt ?? "").trim() },
        { label: "เปิดโหวต", date: d.ELECTION_START, isDefault: !String(config.electionStartAt ?? "").trim() },
        { label: "ปิดโหวต", date: d.ELECTION_END, isDefault: !String(config.electionEndAt ?? "").trim() },
      ];
      body = (
        <div className="space-y-1.5">
          {rows.map((r) => {
            const ds = formatThaiDate(r.date);
            if (!ds) return null; // invalid date → hide the line (never "Invalid Date")
            const ts = formatThaiTime(r.date);
            return (
              <div key={r.label} className="text-xs leading-relaxed break-words">
                <span className="text-slate-400">{r.label} </span>
                <span className="text-slate-700 tabular-nums">{ds} {ts}</span>
                {r.isDefault && (
                  <span className="ml-1.5 text-[10px] text-amber-500 whitespace-nowrap">· ค่าเริ่มต้น</span>
                )}
              </div>
            );
          })}
        </div>
      );
    } else if (id === "form") {
      // ปุ่มแบบประเมินบนหน้าขอบคุณ "แสดงเสมอ" — success/page.js ส่ง onOpenForm ให้ทุก
      // ตระกูลแบบไม่มีเงื่อนไข ค่านี้จึงไม่ได้คุมการมี/ไม่มีปุ่ม เว้นว่าง = กดแล้วเจอ
      // "ไม่พบลิงก์แบบประเมิน" ไม่ใช่ปุ่มหายไป (ข้อความเดิมเขียนผิด)
      const url = String(config.googleFormUrl ?? "").trim();
      body = url ? (
        <div className="text-xs text-slate-600 break-all leading-relaxed">
          ปุ่มบนหน้าขอบคุณจะพาไปที่{" "}
          <span className="font-semibold text-[#8A2680]">{url}</span>
        </div>
      ) : (
        <div className="text-xs text-amber-600">(ยังไม่ตั้ง) — ปุ่มแบบประเมินยังแสดงบนหน้าขอบคุณ แต่กดแล้วจะขึ้นว่าไม่พบลิงก์</div>
      );
    } else if (id === "copyright") {
      const t = (v) => String(v ?? "").trim() || "—";
      body = (
        <div className="text-xs text-slate-600 break-words">
          © {t(config.facultyShortEn)}@{t(config.university)}{" "}
          <span className="tabular-nums">{yearText(config.copyrightYear)}</span> · All Rights Reserved
        </div>
      );
    } else {
      return null;
    }

    return (
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Eye className="w-3.5 h-3.5 text-[#8A2680]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A2680]">
            ตัวอย่างที่จะแสดงจริง
          </span>
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 shrink-0 w-10 h-10 rounded-xl bg-[#8A2680]/10 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-[#8A2680]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">ตั้งค่าทั่วไป</h2>
          <p className="text-sm text-slate-500">
            ข้อมูลที่ใช้ทั่วทั้งเว็บไซต์ — เปลี่ยนที่นี่ที่เดียว ทุกหน้าเปลี่ยนตาม
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form sections */}
      <div className="space-y-5">
        {GLOBAL_CONFIG_FIELDS.map((group) => {
          const GroupIcon = GROUP_ICONS[group.icon] || Settings2;
          return (
            <section key={group.group} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* section header — icon + title + one-line purpose */}
              <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/60">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-[#8A2680]/10 flex items-center justify-center">
                  <GroupIcon className="w-[18px] h-[18px] text-[#8A2680]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">{group.group}</h3>
                  {group.desc && <p className="text-xs text-slate-500 mt-0.5">{group.desc}</p>}
                </div>
              </div>

              {/* fields — 2-col grid; short fields pair up, full-width fields span both */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                  {group.fields.map((field) => (
                    <div key={field.key} className={field.col === "full" ? "sm:col-span-2" : undefined}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">{field.label}</label>
                        <button
                          type="button"
                          onClick={() => handleResetField(field.key)}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#8A2680] transition-colors"
                          title="คืนค่าเริ่มต้นของช่องนี้"
                        >
                          <RotateCcw className="w-3 h-3" /> ค่าเริ่มต้น
                        </button>
                      </div>
                      {field.multiline ? (
                        <textarea
                          rows={2}
                          value={config[field.key] ?? ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#8A2680] focus:ring-2 focus:ring-[#8A2680]/10 focus:outline-none text-sm resize-y leading-relaxed transition-colors"
                        />
                      ) : (
                        <input
                          type={field.type === "datetime" ? "datetime-local" : field.type}
                          value={config[field.key] ?? ""}
                          onChange={(e) =>
                            handleChange(
                              field.key,
                              field.type === "number" ? Number(e.target.value) : e.target.value
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#8A2680] focus:ring-2 focus:ring-[#8A2680]/10 focus:outline-none text-sm transition-colors"
                        />
                      )}
                      {field.hint && (
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{field.hint}</p>
                      )}
                    </div>
                  ))}
                </div>
                {group.preview && renderPreview(group.preview)}
              </div>
            </section>
          );
        })}
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 mt-6 bg-white rounded-2xl border border-slate-200 shadow-lg p-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {savedAt ? (
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" /> บันทึกแล้ว
            </span>
          ) : (
            "ยังไม่ได้บันทึก"
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#8A2680] text-white text-sm font-bold rounded-lg hover:bg-[#7a2270] disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> บันทึก
            </>
          )}
        </button>
      </div>
    </div>
  );
}
