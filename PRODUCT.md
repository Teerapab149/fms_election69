# Product

## Register

brand

> **Register note (split surface, brand is the default):** This codebase has two
> faces. The **public election experience** that students see (home, vote,
> candidates, results, party, closed, success) is where *design IS the product* —
> it is a campaign surface a faculty votes on once a year, and impression is the
> deliverable. That is the default register here. The **admin editor** (Canva-grade
> visual editor under `src/components/admin/`) is *product* register: design serves
> the tool. Override to `product` per-task when working inside the editor UI itself.
> The surface in focus when this file was written was the public templates
> (gumroad "Active Pulse" VOTE page), which is brand.

## Users

Two distinct audiences, one shared system:

- **Voters (primary public audience):** FMS PSU students, years 1–4, voting once a
  year on their phones (mobile-first is non-negotiable) during a short election
  window. Thai-first reading. They arrive curious or dutiful; the interface has one
  job — make casting a vote feel legitimate, energizing, and effortless. They see
  the election ~once, so first impression carries the whole experience.
- **Admins (the editor audience):** Student club committee members, rotating year to
  year, with **no coding background**. They compose each year's site by picking a
  template, swapping element variants, and editing visual properties — Canva-style,
  95% no-code. Their context is a calm desk session weeks before voting opens, not
  the live event.

## Product Purpose

An online election system for the Student Committee of the Faculty of Management
Sciences, Prince of Songkla University (SAMO 49/50), used for real annual elections.

Beyond running the vote, the system is a **visual CMS with a generational heritage
goal**: every year's admins design that year's public site through a Canva-grade
editor, and each finished design is snapshotted into a template gallery that the
next cohort inherits. The 10-year ambition is a club-owned design archive that
never needs a core rewrite — "สมบัติของสโมสรนักศึกษา" (property of the student club),
passed down rather than rebuilt.

Success looks like: a voter casts a ballot in under a minute on their phone without
confusion; an admin with zero code skill ships a distinctive, on-brand site for
their year; and a template made in 2570 still renders correctly in 2580.

## Brand Personality

**Civic Catalyst** — democratic engagement given the visual prestige of a premium
lifestyle brand or high-end digital magazine, not the sterile feel of a government
portal. Three words: **energetic, editorial, legitimate.**

- **Voice:** confident and direct, Thai-first. Speaks to students as participants in
  a movement, not applicants filling a form.
- **Emotional goal:** urgency + warmth + trust. The vote should feel like it matters
  and like it is unmistakably real (not a toy form).
- **Per-template identity is deliberate:** the system ships several committed visual
  worlds (e.g. gumroad "Active Pulse" — chunky near-black borders, hard offset
  shadows, cream + pink/lime/yellow pops, Archivo Black display). Each template has a
  strong, named POV. Drift toward a safe shared look across templates is a failure;
  each year's identity should be distinct.

## Anti-references

- **Government / bureaucratic portal.** No sterile gray forms, no "official document"
  coldness. This is the thing DESIGN.md's north star explicitly rejects.
- **Generic AI landing page.** If a viewer can say "AI made that" without hesitation,
  it failed. Safe = invisible.
- **Material Design default look.** No standard drop shadows (use tonal/ambient or the
  template's committed hard-offset shadows), no flat token-default cards.
- **1px gray/black sectioning borders** on the editorial templates. Boundaries come
  from surface shifts and tonal depth, not ink lines (DESIGN.md "No-Line" rule). Note:
  this is template-specific — committed templates like gumroad intentionally use thick
  near-black borders as identity; the ban is on *unintentional* hairline dividers.
- **Generic CMS / code editor surface.** Admins must never feel like they are in
  WordPress or VS Code (except the explicit Tier-3 advanced CSS escape hatch).

## Design Principles

1. **Heritage over haste.** Every design decision is judged against "will this still
   work in 10 years without a core refactor?" Invest in architecture (3-layer tokens,
   additive element schema, snapshots) over shipping features fast. (VISION I5)
2. **Identity-preservation wins on committed templates.** When a template has already
   committed a font, palette, or treatment as its identity (e.g. gumroad's Archivo
   Black + Space Grotesk), preserve it faithfully — port the source 1:1, don't
   re-judge it against greenfield reflex-reject lists. New/greenfield templates get
   the full distinctiveness scrutiny.
3. **Fidelity to the approved design is the bar, not "close enough."** When porting a
   reference (HTML/CSS), match font, scale, letter-spacing, and copy exactly. Declared
   tokens that nothing consumes (a font-family no component reads, a font that is never
   loaded) are bugs, not acceptable gaps. (Origin of the typeset task.)
4. **Mobile-first, voter-first.** The public experience is designed for a phone in a
   student's hand during a short window. Every public surface is fully responsive;
   nothing voter-facing hides on mobile.
5. **95% no-code admin power, with an honest 5% hard limit.** Admins edit everything
   visual without code. Creating new element *types* or new HTML structure is the
   developer's job, done once, then returned to the shared library. Don't pretend the
   limit isn't there; don't let it shrink admin power below 95%.

## Accessibility & Inclusion

- **Contrast:** Body text ≥4.5:1 against its background; large/bold text ≥3:1. The
  bright-pop gumroad palette must keep ink (#1A1A1A) text on light pops to stay
  readable — verify, don't assume.
- **Thai-first typography:** Thai script (Kanit) must always have a real loaded font;
  Latin display fonts are layered on top, never a substitute that drops Thai glyphs.
- **Reduced motion:** Every animation needs a `prefers-reduced-motion: reduce`
  alternative. The public pages lean on Framer Motion; reveals must enhance an
  already-visible default, never gate content visibility on a transition.
- **Smart contrast hint (planned, VISION D4/OQ4):** the editor should *suggest* text
  colors against backgrounds, but the admin always has final override. Not yet
  implemented.
- No formal WCAG conformance level has been committed; AA contrast is the working
  floor.
