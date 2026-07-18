"use client";

// Day 9b: voteCTA-button / minimal-pill variant.
// Editorial / restrained — thin 1.5px outline, transparent fill, pill radius,
// hover fills with primary color (text inverts to surface).
//
// 3 primary states styled explicitly (notVoted/voted/ended).
// 3 secondary states (login/closed/paused) derive their styling via
// mapToPrimaryState() — text/icon/href come from the ORIGINAL state.
//
// Variant contract (per Day 7b / Day 9a):
//   1. Renders root <button data-element="voteCTA-button"> (Layer 2 scope).
//   2. Accepts {config, data, resolvedConfig} props — matches default.jsx.
//   3. Consumes Layer 2 vars (--btn-text, --btn-border-color, --btn-radius,
//      --btn-padding-x/y, --btn-font-size/weight, --btn-hover-bg,
//      --btn-letter-spacing). NO new Layer 2 vars (17 is the locked count).
//   4. Layer 3 inline overrides preserved (state config color/radius/padding
//      win when explicit) — D10 cascade.
//   5. State detection mirrors STATE_RESOLVERS.voteCTA inline (same as
//      default.jsx) so the variant stays self-contained and matches the
//      legacy contract; no extra prop required from the wrapper.

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, Check } from "lucide-react";
import { mapToPrimaryState } from "./stateMap.js";

// Primary-state STYLE blocks. The secondary states (login/closed/paused)
// borrow one of these via mapToPrimaryState(). No need for 6 entries.
//
// NOTE on color sourcing: minimal-pill's visual identity is "primary-color
// text on transparent bg, hover fills with primary". Therefore we use
// --color-primary directly here rather than --btn-text (which the templates
// set to --color-surface for the filled default variant — using it would
// make the resting text the same color as the fill, i.e. invisible).
// Similarly we ignore stateConfig.{textColor,borderColor,backgroundColor}
// in the render path below: those Layer 3 fields are calibrated for the
// filled default variant (e.g. "white text on green fill"); applying them
// to an outlined variant breaks the variant's contract.
// Layer 3 sizing fields (paddingX/Y, fontSize, fontWeight, borderRadius)
// DO flow through — they are variant-neutral.
const PRIMARY_STYLES = {
  notVoted: {
    backgroundColor: "transparent",
    color: "var(--color-primary)",
    borderColor: "var(--color-primary)",
    borderWidth: "1.5px",
    borderStyle: "solid",
    boxShadow: "none",
  },
  voted: {
    backgroundColor: "transparent",
    color: "var(--color-text-muted, #64748b)",
    borderColor: "var(--color-text-muted, #cbd5e1)",
    borderWidth: "1.5px",
    borderStyle: "solid",
    boxShadow: "none",
    cursor: "not-allowed",
    opacity: 0.75,
  },
  ended: {
    backgroundColor: "transparent",
    color: "var(--color-accent, var(--color-primary))",
    borderColor: "var(--color-accent, var(--color-primary))",
    borderWidth: "1.5px",
    borderStyle: "solid",
    boxShadow: "none",
  },
};

// Mirror of STATE_RESOLVERS.voteCTA + default.jsx legacy ladder.
// Returns one of: 'login' | 'notVoted' | 'voted' | 'ended' | 'closed' | 'paused'.
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

// href per state (mirrors default.jsx). login uses signIn handler, no href.
function hrefForState(stateId) {
  if (stateId === "voted" || stateId === "ended") return "/results";
  if (stateId === "notVoted") return "/vote";
  if (stateId === "paused" || stateId === "closed") return "/closed";
  return null; // login: handled by signIn click
}

export default function MinimalPillVoteCTA({ config = {}, data = {}, resolvedConfig = null, onSignIn = null }) {
  const currentState = deriveCurrentState(data);
  const visualState = mapToPrimaryState(currentState);
  const baseStyle = PRIMARY_STYLES[visualState];

  // resolvedConfig is the FLAT current-state config from
  // resolveStatefulConfig(template, 'voteCTA-button', currentState, overrides).
  // It carries the original-state text/colors — used for Layer 3 overrides.
  const stateConfig = resolvedConfig || {};

  const style = {
    ...baseStyle,
    borderRadius: stateConfig.borderRadius
      ? mapRadius(stateConfig.borderRadius)
      : "var(--btn-radius, 9999px)",
    paddingLeft:   stateConfig.paddingX ? `${parseInt(stateConfig.paddingX) * 0.25}rem` : "var(--btn-padding-x)",
    paddingRight:  stateConfig.paddingX ? `${parseInt(stateConfig.paddingX) * 0.25}rem` : "var(--btn-padding-x)",
    paddingTop:    stateConfig.paddingY ? `${parseInt(stateConfig.paddingY) * 0.25}rem` : "var(--btn-padding-y)",
    paddingBottom: stateConfig.paddingY ? `${parseInt(stateConfig.paddingY) * 0.25}rem` : "var(--btn-padding-y)",
    fontSize:      stateConfig.fontSize ? mapFontSize(stateConfig.fontSize) : "var(--btn-font-size)",
    fontWeight:    stateConfig.fontWeight ? mapFontWeight(stateConfig.fontWeight) : "var(--btn-font-weight)",
    letterSpacing: "var(--btn-letter-spacing)",
    // NOTE: stateConfig.{textColor,borderColor,backgroundColor} intentionally
    // NOT spread here — see header comment on PRIMARY_STYLES for rationale.
  };

  const text = stateConfig.text || "Vote Now";
  const isDisabled = visualState === "voted";
  const isLoginAction = currentState === "login";
  const href = hrefForState(currentState);

  const inner = (
    <button
      data-element="voteCTA-button"
      disabled={isDisabled}
      style={style}
      className="minimal-pill-btn inline-flex items-center gap-2 transition-colors duration-200"
    >
      {visualState === "voted" && <Check size={18} />}
      <span>{text}</span>
      {!isDisabled && <ArrowRight size={18} />}

      <style jsx>{`
        .minimal-pill-btn {
          transition: background-color .2s, color .2s, border-color .2s, transform .2s, box-shadow .2s;
        }
        /* !important: the variant sets background/color/border as INLINE styles
           (transparent fill is its resting identity), and inline styles outrank a
           plain stylesheet :hover rule — so without this the lime fill never
           applied and the button looked inert on hover. */
        .minimal-pill-btn:not(:disabled):hover {
          background-color: var(--btn-hover-bg, var(--color-primary)) !important;
          color: var(--color-surface, #ffffff) !important;
          border-color: var(--btn-hover-bg, var(--color-primary)) !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, .25);
        }
        .minimal-pill-btn:not(:disabled):active { transform: translateY(0); }
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
                  callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "/fms-ovs") + "/vote",
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

// Maps — mirror default.jsx buildButtonStyle.
function mapRadius(key) {
  const m = { none: "0", sm: "0.125rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px" };
  return m[key] || "var(--btn-radius, 9999px)";
}
function mapFontSize(key) {
  const m = { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" };
  return m[key] || "var(--btn-font-size)";
}
function mapFontWeight(key) {
  const m = { normal: "400", medium: "500", semibold: "600", bold: "700", black: "900" };
  return m[key] || "var(--btn-font-weight)";
}
