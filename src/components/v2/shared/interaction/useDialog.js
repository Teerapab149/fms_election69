"use client";

// Dialog behaviour every v2 template shares, whatever its dialogs look like:
// Escape closes, focus moves into the dialog (to the element marked
// data-dialog-focus) and back to where it was, and the page behind stops
// scrolling. Attach the returned ref to the dialog's root.

import { useEffect, useRef } from "react";

export function useDialog(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    ref.current?.querySelector("[data-dialog-focus]")?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (prev?.isConnected) prev.focus();
    };
  }, [open, onClose]);
  return ref;
}
