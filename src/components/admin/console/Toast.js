'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

// A message that clears itself after a few seconds. For the routine "saved"
// confirmation, where a dialog that must be closed each time gets in the way
// (adding twenty members meant twenty clicks). Irreversible actions such as
// deletes should keep a dialog.
export function useToast(ms = 4000) {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), ms);
  }, [ms]);
  const node = message ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] max-w-[calc(100vw-2rem)] flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-xl animate-fade-in"
    >
      <Check className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden /> {message}
    </div>
  ) : null;
  return { show, node };
}
