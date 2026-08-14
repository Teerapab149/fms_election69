"use client";

// FmsOfficialShell — the shared frame every INNER page of the FMS Official
// template renders inside (candidates, party, vote, results, success, closed).
//
// The home page composes its own hero, so it does NOT use this. Everything else
// does, which is the point: an institutional template earns its credibility by
// being the same on every screen. One header, one page-title treatment, one
// footer, one measure — a student who has seen the home page recognises page
// four without thinking about it.
//
// The page-title band is the faculty site's section-heading motif promoted to
// page scale: bold Thai title, optional deck, thin brand rule underneath. The
// faculty's own INNER pages were not reachable for reference (the site serves
// "Inspector is disabled." to automated browsers), so this is derived from their
// HOME section headings rather than copied from an inner page — worth a second
// look if a real inner-page screenshot ever turns up.

import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import {
  fmsMeta,
  FmsOfficialHeader,
  FmsOfficialFooter,
  FmsOfficialBaseStyles,
} from "../home/FmsOfficialChrome";
import { buildTemplateStyles } from "../../lib/templateTokens";

export default function FmsOfficialShell({
  active = "home",
  title = "",
  desc = "",
  kicker = "",
  // voteState = null → the header strip shows no status pill (see chrome note)
  voteState = null,
  editorMode = false,
  resolvedTemplate = null,
  // `narrow` holds the measure at reading width for text-heavy pages (success,
  // closed); the default is the full grid width the card pages need.
  narrow = false,
  // `plain` drops the title band entirely for pages that own their opening
  // (party, whose hero IS the party's identity)
  plain = false,
  children,
}) {
  const globalConfig = useGlobalConfig();
  const meta = fmsMeta(globalConfig);
  const tokenStylesCss = editorMode ? "" : buildTemplateStyles(resolvedTemplate, ".fms-app");

  return (
    <div className="fms-app fo-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}
      <FmsOfficialBaseStyles paintBody={!editorMode} />

      <FmsOfficialHeader active={active} meta={meta} voteState={voteState} editorMode={editorMode} />

      {!plain && (title || desc) && (
        <div className="fo-pagehead">
          <div className="fo-pagehead__in">
            {title && <h1>{title}</h1>}
            <span className="fo-pagehead__sub">{meta.faculty} {meta.university}</span>
          </div>
        </div>
      )}

      <main className={`fo-main ${narrow ? "is-narrow" : ""}`}>
        {/* The faculty's band carries ONLY the page name and the faculty line —
            never explanatory copy. So the page's own lead sentence lives here, in
            the content area, where a long line can breathe and the band stays a
            clean plate. */}
        {!plain && (kicker || desc) && (
          <div className="fo-lead">
            {kicker && <span className="fo-lead__kicker">{kicker}</span>}
            {desc && <p>{desc}</p>}
          </div>
        )}
        {children}
      </main>

      <FmsOfficialFooter meta={meta} />

      <style jsx global>{`
        /* The faculty's inner-page signature: a solid plum plate spanning the
           viewport, page name centred in white, faculty line beneath it. Taken
           from ประวัติการก่อตั้ง / คณะผู้บริหาร. This is the single element that
           makes an inner page read as theirs, so it is copied closely — full
           bleed, generous height, centred, no border. */
        .fo-pagehead { background: var(--fo-plum); color: #fff; }
        .fo-pagehead__in { max-width: var(--fo-max); margin: 0 auto; padding: 62px 24px 66px; text-align: center; }
        .fo-pagehead h1 { margin: 0; font-size: clamp(30px, 4vw, 46px); font-weight: 600; line-height: 1.25; color: #fff; }
        .fo-pagehead__sub { display: block; margin-top: 10px; font-size: clamp(15px, 1.6vw, 19px); font-weight: 300; color: rgba(255,255,255,.86); }

        .fo-lead { margin-bottom: 30px; }
        .fo-lead__kicker { display: block; font-size: 12.5px; font-weight: 500; letter-spacing: .04em; color: var(--fo-brand-soft); }
        .fo-lead p { margin: 8px 0 0; max-width: 760px; font-size: 15px; font-weight: 300; line-height: 1.7; color: var(--fo-muted); }

        .fo-main { flex: 1; max-width: var(--fo-max); width: 100%; margin: 0 auto; padding: 44px 24px 72px; }
        .fo-main.is-narrow { max-width: 820px; }

        /* shared inner-page furniture, so six files do not each invent a card */
        .fo-card {
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          border-radius: 12px; padding: 22px;
        }
        .fo-note { font-size: 13px; font-weight: 300; color: var(--fo-muted); }
        /* Section rhythm for the party screens. Here rather than in one of them
           because three files set it now — the dossier body, the /party wrapper
           and the single-party ballot — and this family's standing lesson is
           that a rule more than one component uses belongs to the shared frame. */
        .fo-party__sec { margin-top: 42px; }
        .fo-back {
          display: inline-flex; align-items: center; gap: 7px; margin-bottom: 20px;
          font-size: 14px; font-weight: 400; color: var(--fo-muted);
          transition: color .18s;
        }
        .fo-back:hover { color: var(--fo-brand); }

        /* Tablet: the nav drops to its own row here (lockup + nav + auth cannot
           share 768px), so the header grows by ~50px. The plate has to give that
           back or the tablet ends up with MORE chrome than the phone — measured
           at 36% of the viewport against the phone's 30% before this step. */
        @media (max-width: 860px) {
          .fo-pagehead__in { padding: 40px 20px 42px; }
          .fo-pagehead h1 { font-size: clamp(26px, 3.4vw, 34px); }
          .fo-pagehead__sub { font-size: 15px; }
        }

        /* The plate is 152px tall on a phone. Together with the strip and the
           header that was 330px of chrome — 52% of a 360×640 screen — before a
           voter reached any content. Halved here; the plate still reads as a plate,
           it just stops being the page. */
        @media (max-width: 620px) {
          .fo-pagehead__in { padding: 26px 16px 28px; }
          .fo-pagehead h1 { font-size: 24px; line-height: 1.3; }
          .fo-pagehead__sub { margin-top: 6px; font-size: 13px; }
          .fo-main { padding: 26px 16px 52px; }
          .fo-lead { margin-bottom: 22px; }
          .fo-lead p { font-size: 14px; }
        }
        /* 760, not the 620 above: this rhythm has always turned over with the
           party layout's breakpoint rather than the chrome's, and moving it
           would reflow those screens between 621 and 760. */
        @media (max-width: 760px) {
          .fo-party__sec { margin-top: 34px; }
        }
        @media (max-width: 380px) {
          .fo-pagehead__in { padding: 22px 12px 24px; }
          .fo-pagehead h1 { font-size: 21px; }
          .fo-main { padding: 22px 12px 44px; }
        }
      `}</style>
    </div>
  );
}
