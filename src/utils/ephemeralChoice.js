// ephemeralChoice — a module-level, IN-MEMORY holder for the voter's just-cast
// choice, used ONLY by the Receipt template family's success "printer moment".
//
// BALLOT SECRECY (CONCEPT §2 — LOCKED): the chosen item may be shown to the voter
// exactly ONCE, on the success page, immediately after voting — and must NEVER be
// persisted or re-viewable. This holder is the ONLY sanctioned channel:
//   • NOT localStorage / sessionStorage / cookie / URL / query — memory only.
//   • It lives in the JS module scope of a single tab. Any HARD navigation
//     (window.location) or reload tears down the runtime and the value is GONE,
//     so the success page falls back to the secrecy statement
//     ("บันทึกแล้ว · เป็นความลับ"). That loss IS the desired secrecy behaviour.
//   • consumeEphemeralChoice() returns the value ONCE and immediately clears it,
//     so even a same-runtime re-read can't show it twice.
//
// Set it (setEphemeralChoice) right where a vote POST succeeds, guarded to the
// receipt family; read it (consumeEphemeralChoice) once as the success page mounts.

let _choice = null;

// Store the ephemeral choice label (e.g. a party name / งดออกเสียง / ไม่รับรอง).
// Passing null/undefined clears it.
export function setEphemeralChoice(label) {
  _choice = label != null && String(label).trim() !== "" ? String(label) : null;
}

// Return the stored choice ONCE, then clear it. Returns null when empty (the
// secrecy fallback path). Safe to call unconditionally — it is receipt-only-set.
export function consumeEphemeralChoice() {
  const v = _choice;
  _choice = null;
  return v;
}
