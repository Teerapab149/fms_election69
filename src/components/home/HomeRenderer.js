"use client";

// HomeRenderer — per-template HOME LAYOUT dispatcher.
//
// The "Layout" half of a template (VISION.md:169 — Template = Layout + Theme +
// Element compositions). Classic (and every token-themed template) renders the
// canonical HomeContent layout. A template with its OWN page structure registers
// a distinct layout component here, keyed by slug.
//
// Drop-in: takes the exact same props HomeContent receives (live + editorMode),
// so both call sites (app/page.js live, PageDesignTab editor preview) just swap
// HomeContent → HomeRenderer. Classic path is byte-identical — no risk.

import HomeContent from "../HomeContent";
import GumroadHome from "./GumroadHome";
import StudioDarkHome from "./StudioDarkHome";
import VerdureHome from "./VerdureHome";
import OriginalHome from "./OriginalHome";
import BlossomHome from "./BlossomHome";
import ReceiptHome from "./ReceiptHome";

// slug → layout component. Absent slug = classic layout (HomeContent).
// Colour-variant slugs (e.g. receipt-blue) resolve via the layoutFamily fallback
// below, so only each family's BASE slug needs an entry here.
const HOME_LAYOUTS = {
  gumroad: GumroadHome,
  "studio-dark": StudioDarkHome,
  verdure: VerdureHome,
  original: OriginalHome,
  blossom: BlossomHome,
  receipt: ReceiptHome,
};

export default function HomeRenderer(props) {
  const slug = props?.resolvedTemplate?.slug || props?.resolvedTemplate?.id;
  // Colour-theme variants (e.g. verdure-honey) share their family's home layout —
  // fall back to layoutFamily so verdure-* → VerdureHome, not the classic HomeContent.
  const fam = props?.resolvedTemplate?.layoutFamily;
  const Layout = HOME_LAYOUTS[slug] || HOME_LAYOUTS[fam] || HomeContent;
  return <Layout {...props} />;
}
