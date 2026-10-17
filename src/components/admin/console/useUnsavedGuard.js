'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

// Stops a tab change, a logout or closing the browser tab from silently
// throwing away edits that were not saved. A tab reports its state with
// setDirty(tabId, bool); the shell wraps every way out in `guard(fn)`:
// nothing unsaved runs fn at once, otherwise a dialog asks first.
// The state is a map per tab, so other tabs can join without changing this.
export function useUnsavedGuard(labels = {}) {
  const [dirtyMap, setDirtyMap] = useState({});
  const [pending, setPending] = useState(null); // { run, tabs }
  const dirtyRef = useRef({});
  dirtyRef.current = dirtyMap;

  const setDirty = useCallback((tabId, value) => {
    setDirtyMap((m) => (!!m[tabId] === !!value ? m : { ...m, [tabId]: !!value }));
  }, []);

  const dirtyTabs = useMemo(() => Object.keys(dirtyMap).filter((k) => dirtyMap[k]), [dirtyMap]);
  const anyDirty = dirtyTabs.length > 0;

  useEffect(() => {
    if (!anyDirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  const guard = useCallback((run) => {
    const tabs = Object.keys(dirtyRef.current).filter((k) => dirtyRef.current[k]);
    if (tabs.length === 0) { run(); return; }
    setPending({ run, tabs });
  }, []);

  const stay = useCallback(() => setPending(null), []);
  const leave = useCallback(() => {
    const p = pending;
    setPending(null);
    setDirtyMap({});
    if (p) p.run();
  }, [pending]);

  const dialog = pending ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50" role="presentation">
      <div role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title" aria-describedby="unsaved-desc"
        className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 id="unsaved-title" className="text-base font-semibold text-slate-900">
                ยังไม่ได้บันทึกการแก้ไขใน{pending.tabs.map((t) => labels[t] || t).join(" และ ")}
              </h3>
              <p id="unsaved-desc" className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                ถ้าออกตอนนี้ ค่าที่แก้ไว้จะหายไป
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button type="button" onClick={leave}
            className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100">
            ออกโดยไม่บันทึก
          </button>
          <button type="button" onClick={stay} autoFocus
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#8A2680] text-white text-sm font-semibold hover:bg-[#7a2270]">
            กลับไปบันทึก
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { setDirty, anyDirty, guard, dialog };
}
