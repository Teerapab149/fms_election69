"use client";

// Day 9b: voteCTA-button / chunky-stamp variant.
// Gumroad-style hand-stamped button — 3px hard border + 5px 5px 0 hard
// shadow (NO blur), bold uppercase text. Hover lifts up-left; active
// presses back down.
//
// 3 primary states styled explicitly (notVoted/voted/ended).
// 3 secondary states (login/closed/paused) derive their styling via
// mapToPrimaryState() — text/icon/href come from the ORIGINAL state.
//
// Variant contract identical to minimal-pill (see header there).

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, Check } from "lucide-react";
import { mapToPrimaryState } from "./stateMap.js";

// Primary-state STYLE blocks. Color sourcing notes:
// - notVoted: bg = --btn-bg (primary fill is the variant's hero state).
//   Border is hardcoded #000 — the "stamp" feel is the variant's identity
//   and the Layer 2 --btn-border-color is set to `transparent` by templates
//   for the default variant's borderless fill.
//   Shadow is hardcoded '5px 5px 0 var(--ink, #000000)' for the same reason: --btn-shadow
//   is calibrated as the default variant's soft drop-shadow and would
//   destroy chunky-stamp's signature mark if used as a fallback.
// - voted: muted surface card with text-color border and a smaller shadow.
// - ended: --color-accent fill with the same hard 5px shadow.
// Layer 3 textColor / backgroundColor (from filled-button state configs)
// DO flow through for chunky-stamp — its identity is "filled + hard shadow"
// so per-state palette overrides remain meaningful. Layer 3 borderColor
// and box-shadow do NOT flow through (variant identity owns these).
const PRIMARY_STYLES = {
  notVoted: {
    backgroundColor: "var(--btn-bg, var(--color-primary))",
    color: "var(--btn-text, var(--color-surface))",
    borderColor: "var(--ink, #000000)",
    borderWidth: "3px",
    borderStyle: "solid",
    boxShadow: "5px 5px 0 var(--ink, #000000)",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  voted: {
    // "voted" is a clickable "view results" CTA (not a dead confirmation). It's a
    // full chunky stamp in gumroad pink so it stays as bold as the other states —
    // NOT a plain white card. Pink is hardcoded (not var(--color-primary)) because
    // PageThemeOverrides resolves --color-primary to the FMS brand purple #8A2680
    // here, which read as dark-on-dark. Ink text/border/shadow keep it on-identity.
    // (A previous white-surface version read as washed-out.)
    backgroundColor: "var(--pink, #FF90E8)",
    color: "var(--ink, #1A1A1A)",
    borderColor: "var(--ink, #000000)",
    borderWidth: "3px",
    borderStyle: "solid",
    boxShadow: "5px 5px 0 var(--ink, #000000)",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  ended: {
    backgroundColor: "var(--color-accent, #9333EA)",
    color: "var(--color-surface, #ffffff)",
    borderColor: "var(--ink, #000000)",
    borderWidth: "3px",
    borderStyle: "solid",
    boxShadow: "5px 5px 0 var(--ink, #000000)",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
};

// Mirror of STATE_RESOLVERS.voteCTA / default.jsx legacy ladder.
function deriveCurrentState(data) {
  const { session, isVotedReal, initialData } = data || {};
  const sysMode = initialData?.systemMode || "AUTO";
  const electionStatus = initialData?.electionStatus;

  if (sysMode === "PAUSE") return "paused";
  if (sysMode === "ENDED" || (sysMode === "AUTO" && electionStatus === "ENDED")) return "ended";
  if (initialData?.isSystemOpen === false && !(sysMode === "AUTO" && electionStatus === "WAITING")) return "closed";
  if (sysMode === "MANUAL_OPEN" && session) return isVotedReal ? "voted" : "notVoted";
  if (session) return isVotedReal ? "voted" : "notVoted";
  return "login";
}

function hrefForState(stateId) {
  if (stateId === "voted" || stateId === "ended") return "/results";
  if (stateId === "notVoted") return "/vote";
  if (stateId === "paused" || stateId === "closed") return "/closed";
  return null;
}

export default function ChunkyStampVoteCTA({ config = {}, data = {}, resolvedConfig = null, onSignIn = null }) {
  const currentState = deriveCurrentState(data);
  const visualState = mapToPrimaryState(currentState);
  const baseStyle = PRIMARY_STYLES[visualState];
  const stateConfig = resolvedConfig || {};

  const style = {
    ...baseStyle,
    borderRadius: stateConfig.borderRadius
      ? mapRadius(stateConfig.borderRadius)
      : "var(--btn-radius, 4px)",
    paddingLeft:   stateConfig.paddingX ? `${parseInt(stateConfig.paddingX) * 0.25}rem` : "var(--btn-padding-x)",
    paddingRight:  stateConfig.paddingX ? `${parseInt(stateConfig.paddingX) * 0.25}rem` : "var(--btn-padding-x)",
    paddingTop:    stateConfig.paddingY ? `${parseInt(stateConfig.paddingY) * 0.25}rem` : "var(--btn-padding-y)",
    paddingBottom: stateConfig.paddingY ? `${parseInt(stateConfig.paddingY) * 0.25}rem` : "var(--btn-padding-y)",
    fontSize:      stateConfig.fontSize ? mapFontSize(stateConfig.fontSize) : "var(--btn-font-size)",
    // Bold + uppercase + tracking locked by baseStyle for variant identity.
    // Layer 3 color overrides DO flow through (filled-variant compatibility) EXCEPT
    // for "voted" — that state is a white surface "card", so a light per-state
    // textColor/backgroundColor (inherited from the classic filled button) would
    // paint white-on-white. Keep voted's own ink text + white surface.
    ...(stateConfig.textColor       && visualState !== "voted" && { color: stateConfig.textColor }),
    ...(stateConfig.backgroundColor && visualState !== "voted" && { backgroundColor: stateConfig.backgroundColor }),
  };

  const text = stateConfig.text || "VOTE NOW";
  const isDisabled = false; // every state is actionable (vote / results / closed / sign-in)
  const isLoginAction = currentState === "login";
  const href = hrefForState(currentState);

  const inner = (
    <button
      data-element="voteCTA-button"
      disabled={isDisabled}
      style={style}
      className="chunky-stamp-btn inline-flex items-center gap-2"
    >
      {visualState === "voted" && <Check size={20} />}
      <span>{text}</span>
      {!isDisabled && <ArrowRight size={20} />}

      <style jsx>{`
        .chunky-stamp-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          will-change: transform;
        }
        .chunky-stamp-btn:not(:disabled):hover {
          transform: translate(-2px, -2px);
          box-shadow: 7px 7px 0 var(--ink, #000000);
        }
        .chunky-stamp-btn:not(:disabled):active {
          transform: translate(0, 0);
          box-shadow: none;
        }
      `}</style>
    </button>
  );

  if (isDisabled) {
    return <div className="w-full flex justify-center lg:justify-start pt-0 pb-4">{inner}</div>;
  }
  if (isLoginAction) {
    return (
      <div className="w-full flex justify-center lg:justify-start pt-0 pb-4">
        <div
          onClick={() =>
            onSignIn
              ? onSignIn()
              : signIn("authentik", {
                  callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/vote",
                })
          }
          className="cursor-pointer inline-block"
        >
          {inner}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full flex justify-center lg:justify-start pt-0 pb-4">
      <Link href={href} className="inline-block">{inner}</Link>
    </div>
  );
}

function mapRadius(key) {
  const m = { none: "0", sm: "0.125rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px" };
  return m[key] || "var(--btn-radius, 4px)";
}
function mapFontSize(key) {
  const m = { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" };
  return m[key] || "var(--btn-font-size)";
}
