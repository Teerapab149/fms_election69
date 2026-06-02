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

// slug → layout component. Absent slug = classic layout (HomeContent).
const HOME_LAYOUTS = {
  gumroad: GumroadHome,
};

export default function HomeRenderer(props) {
  const slug = props?.resolvedTemplate?.slug || props?.resolvedTemplate?.id;
  const Layout = HOME_LAYOUTS[slug] || HomeContent;
  return <Layout {...props} />;
}
