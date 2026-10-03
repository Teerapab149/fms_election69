// previewPhase — which election phase a /template-preview render stands in.
//
// The template gallery (admin/TemplateChooserTab) and the full-screen preview
// render each page with mock props, but several chromes and status pages judge
// the election from the SCHEDULE in the settings context (Verdure's corner chip,
// the StudioDark rail, Gumroad's hero countdown, Receipt's dispenser, every
// family's closed page, the ballot-official facts). Left on the real schedule,
// a preview made after election day said "closed" on every slide whatever the
// slide was meant to show. So every preview render gets ONE phase from this
// function, and the preview swaps the dates in the settings context for dates
// placed around "now" to match it (template-preview/page.js withPhaseDates).
//
// The answer is a key of the preview's PHASES table:
//   before far open after early overtime paused ended
//
// Pure, no imports — unit tested in scripts/smoke/previewPhase.test.mjs.

// the HOME page's ?variant= names a PHASES key directly; older links used
// ?variant=closed for the paused state
const HOME_PHASES = ["before", "far", "open", "after", "early", "overtime", "paused", "ended"];

/**
 * The phase the RESULTS page shows, read from the props the family actually
 * renders, not from the variant name: the same ?variant=locked renders the
 * not-started card in Verdure/StudioDark/Gumroad and the embargo band in
 * Blossom/Receipt/FmsOfficial, and the dates must agree with whichever it is.
 *   isNotStarted          → before (polls not open yet)
 *   isRevealed            → after  (announced once the polls closed)
 *   finalStatus ONGOING   → open   (polls open, tally sealed)
 *   finalStatus ENDED     → after  (polls closed, not revealed yet)
 *   anything else         → before (WAITING without the flag)
 */
export function resultsPhaseOf({ isNotStarted = false, isRevealed = false, finalStatus = "" } = {}) {
  if (isNotStarted) return "before";
  if (isRevealed) return "after";
  if (finalStatus === "ONGOING") return "open";
  if (finalStatus === "ENDED") return "after";
  return "before";
}

/**
 * previewPhaseFor({ page, variant, results }) → PHASES key.
 *
 *   home       ?variant= when it names a phase (closed → paused), else open
 *   closed     the closed page's own names, never the home table:
 *                waiting / absent / unknown → before
 *                ended                      → after
 *                closed / paused            → paused
 *              (ended → after, not the home table's admin-ENDED case: on this
 *              page only the dates matter and the two share them; systemMode
 *              is applied to the home page only.)
 *   results    resultsPhaseOf(results); null when the props are not given, so
 *              a caller cannot wrap results without saying what it renders
 *   candidates, party, vote, success, login, unknown pages → open
 */
export function previewPhaseFor({ page = "home", variant = "", results = null } = {}) {
  if (page === "home") {
    if (variant === "closed") return "paused";
    return HOME_PHASES.includes(variant) ? variant : "open";
  }
  if (page === "closed") {
    if (variant === "ended") return "after";
    if (variant === "closed" || variant === "paused") return "paused";
    return "before";
  }
  if (page === "results") return results ? resultsPhaseOf(results) : null;
  // pages a student only reaches while the polls are open (success = just voted)
  return "open";
}
