"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { GLOBAL_CONFIG_FIELDS, GLOBAL_CONFIG_DEFAULTS } from "../../utils/globalConfigDefaults";
import { getPath } from "../../utils/basePath";
import { useGlobalConfig, useGlobalConfigUpdate } from "../../contexts/GlobalConfigContext";

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
  }, [ctxConfig]);

  function handleChange(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(getPath("/api/admin/global-config"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalConfig: config }),
      });
      if (!res.ok) throw new Error("Save failed");
      replaceConfig(config);
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 mb-2">ตั้งค่าทั่วไป</h2>
        <p className="text-sm text-slate-500">
          ข้อมูลที่ใช้ทั่วทั้งเว็บไซต์ — เปลี่ยนที่นี่ที่เดียว ทุกหน้าเปลี่ยนตาม
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form sections */}
      <div className="space-y-6">
        {GLOBAL_CONFIG_FIELDS.map((group) => (
          <div key={group.group} className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">{group.group}</h3>
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">{field.label}</label>
                    <button
                      type="button"
                      onClick={() => handleResetField(field.key)}
                      className="text-[10px] text-slate-400 hover:text-[#8A2680]"
                    >
                      ↺ ค่าเริ่มต้น
                    </button>
                  </div>
                  {field.multiline ? (
                    <textarea
                      rows={2}
                      value={config[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#8A2680] focus:outline-none text-sm resize-y leading-relaxed"
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
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#8A2680] focus:outline-none text-sm"
                    />
                  )}
                  {field.hint && (
                    <p className="text-[10px] text-slate-400 mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
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
