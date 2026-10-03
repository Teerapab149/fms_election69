'use client';

import { useCallback, useEffect, useId, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { useDialog } from "./v2/shared/interaction/useDialog";

// Shared by admin SettingsTab (one "ปิด" that closes) and the vote page (what a
// failed vote means and what to do next). A real dialog, not just a box on a
// scrim: announced as an alert, focus lands on the main button and returns where
// it was, Tab stays on the buttons, Escape runs onClose. Every new prop is
// optional and defaults to the old behaviour, so the admin caller is unchanged.
//
// onAction      → the main button (defaults to onClose)
// secondaryText → a second, quieter button (onSecondary defaults to onClose)
// zClass        → stacking layer; the vote page needs it above its own overlays
export default function ErrorActionModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "ปิด",
  buttonHint = null,
  onAction,
  secondaryText = null,
  secondaryHint = null,
  onSecondary,
  zClass = "z-50",
}) {
  // useDialog re-runs its effect whenever onClose changes identity, and callers
  // pass inline arrows: every parent render would re-steal focus. Hand it one
  // stable function that always calls the latest onClose.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  const stableClose = useCallback(() => closeRef.current?.(), []);
  const ref = useDialog(isOpen, stableClose);
  const titleId = useId();
  const messageId = useId();

  if (!isOpen) return null;

  // Keep Tab on the dialog's own buttons; the page behind is inert while it is up.
  const trapTab = (e) => {
    if (e.key !== "Tab" || !ref.current) return;
    const buttons = [...ref.current.querySelectorAll("button:not([disabled])")];
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!buttons.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
  };

  return (
        <div className={`fixed inset-0 ${zClass} flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in`}>
            <div
                ref={ref}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                onKeyDown={trapTab}
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl transform scale-100 transition-all animate-scale-up border border-gray-100 overflow-hidden"
            >

                {/* Header & Icon */}
                <div className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600`}>
                        <AlertCircle className="w-8 h-8" aria-hidden="true" />
                    </div>

                    <h3 id={titleId} className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p id={messageId} className="text-gray-500 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                    {secondaryText && (
                        <button
                            type="button"
                            onClick={onSecondary || onClose}
                            className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 ${secondaryHint ? "flex-col gap-0" : "gap-2"}`}
                        >
                            <span>{secondaryText}</span>
                            {secondaryHint && <span className="text-[11px] font-medium opacity-70">{secondaryHint}</span>}
                        </button>
                    )}
                    <button
                        type="button"
                        data-dialog-focus
                        onClick={onAction || onClose}
                        className={`w-full py-2.5 px-4 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center bg-red-600 hover:bg-red-700 text-white disabled:opacity-70 disabled:cursor-not-allowed ${buttonHint ? "flex-col gap-0" : "gap-2"}`}
                    >
                        <span>{buttonText}</span>
                        {buttonHint && <span className="text-[11px] font-medium opacity-80">{buttonHint}</span>}
                    </button>
                </div>

            </div>
        </div>
    );
}
