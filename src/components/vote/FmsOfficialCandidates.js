"use client";

// FmsOfficialCandidates — the party listing for the FMS Official template.
//
// Composed as a records index, not a showcase: each party gets an equal card of
// identical height with its number, logo, name, slogan and team size, in ballot
// order. Equal weight is the point — a listing that gives one party a bigger
// card than another is not a neutral document, and this is the one template
// whose entire claim is that it is the faculty's neutral instrument.
//
// The number badge is the anchor because that is what a voter actually carries
// to the ballot: they remember "เบอร์ 2", not a logo.
//
// Each row carries the party's leading policy titles. Without them the row held
// five short facts across 1,092px and left a ~440px hole in its middle, and the
// page came to 497px of content under a 224px plate — thin, and thin in the one
// place a voter is trying to COMPARE parties. The titles were already in the
// payload (/api/party returns the whole Candidate row) and no page was reading
// them. Titles only, never the descriptions: this is the index, and the argument
// for a policy belongs on the party's own page.

import { useMemo } from "react";
import { ArrowRight, Users } from "lucide-react";
import { getPath } from "../../utils/basePath";
import FmsOfficialShell from "./FmsOfficialShell";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { fmsMeta } from "../home/FmsOfficialChrome";

const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

// policies arrive as [{title, desc}] but tolerate the older shapes the party page
// already handles — a bare string, or the key spelled differently by an importer
const policyTitle = (it) =>
  typeof it === "string" ? it : (it?.title ?? it?.text ?? it?.name ?? "");

// Three, not "as many as fit". A fixed count is what keeps every row the same
// height, which is the page's whole claim: a listing that gives one party more
// vertical space than another is not a neutral document.
const MAX_POLICIES = 3;

export default function FmsOfficialCandidates({ candidates = [], editorMode = false }) {
  const globalConfig = useGlobalConfig();
  const meta = fmsMeta(globalConfig);

  // Ballot order, real parties only. number <= 0 are the abstain / disapprove
  // ballot options (CLAUDE.md) — they are choices on the vote page, not people
  // standing for election, so they have no place in a candidate index.
  const parties = useMemo(
    () => (candidates || []).filter((p) => p && p.number > 0).sort((a, b) => a.number - b.number),
    [candidates]
  );

  return (
    <FmsOfficialShell
      active="candidates"
      kicker={`${meta.campaign} · ปีการศึกษา ${meta.ay}`}
      title="ผู้สมัครรับเลือกตั้ง"
      desc="รายชื่อพรรคที่ลงสมัครในปีนี้ เรียงตามหมายเลข เลือกดูรายละเอียดเพื่อศึกษานโยบายและทีมงานก่อนตัดสินใจ"
      editorMode={editorMode}
    >
      {parties.length === 0 ? (
        <div className="fo-card fo-empty">
          <b>ยังไม่มีผู้สมัคร</b>
          <p className="fo-note">เมื่อคณะกรรมการประกาศรายชื่อแล้ว รายการจะแสดงที่หน้านี้</p>
        </div>
      ) : (
        <ul className="fo-plist">
          {parties.map((p) => {
            const logo = resolveSrc(p.logoUrl);
            const teamSize = (p.members || []).length;
            const allPolicies = (p.policies || []).map(policyTitle).filter(Boolean);
            const policies = allPolicies.slice(0, MAX_POLICIES);
            const restCount = allPolicies.length - policies.length;
            return (
              <li key={p.id}>
                <a
                  href={editorMode ? undefined : getPath(`/party?id=${p.id}`)}
                  className={`fo-pcard ${policies.length ? "has-pol" : ""}`}
                >
                  {/* Logo leads, number tags it. They used to be the same size
                      (52px each on a phone, leaving the name 192px), which read as
                      two competing badges and made the whole list feel crowded.
                      The logo is the thing a voter recognises; the number is the
                      thing they carry to the ballot, and a tag says that fine. */}
                  <span className="fo-pcard__logo">
                    {logo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={logo} alt="" aria-hidden />
                      : <span className="fo-pcard__logo-fb" aria-hidden>{String(p.name || "").trim().charAt(0)}</span>}
                  </span>

                  <span className="fo-pcard__body">
                    <span className="fo-pcard__tag">เบอร์ {p.number}</span>
                    <b className="fo-pcard__name">{p.name}</b>
                    {p.slogan && <span className="fo-pcard__slogan">{p.slogan}</span>}
                    {teamSize > 0 && (
                      <span className="fo-pcard__team">
                        <Users size={14} aria-hidden /> ทีมงาน {teamSize} คน
                      </span>
                    )}
                  </span>

                  {/* The second field of the register, divided by a hairline
                      rather than boxed — one record, two columns, the way a
                      printed roll separates a name from its particulars. */}
                  {policies.length > 0 && (
                    <span className="fo-pcard__pol">
                      <span className="fo-pcard__pol-h">นโยบายเด่น</span>
                      <ol className="fo-pcard__pol-list">
                        {policies.map((t, i) => (
                          <li key={i}>
                            <i aria-hidden>{String(i + 1).padStart(2, "0")}</i>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ol>
                      {restCount > 0 && (
                        <span className="fo-pcard__pol-more">และอีก {restCount} นโยบาย</span>
                      )}
                    </span>
                  )}

                  <span className="fo-pcard__go">
                    ดูรายละเอียด <ArrowRight size={16} aria-hidden />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <style jsx global>{`
        .fo-empty { text-align: center; padding: 44px 22px; }
        .fo-empty b { display: block; font-size: 17px; font-weight: 500; color: var(--fo-ink); margin-bottom: 6px; }

        .fo-plist { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }

        /* One row per party, identical structure and height. The number sits in a
           fixed-width column so every badge lines up down the page — the listing
           reads as a register, which is what it is.

           This is also the row a party with no filed policies keeps, unchanged
           from before the policy field existed. The .has-pol class opens the
           fourth column, and it is a class rather than a :not(:has(...)) test on
           purpose: where :has() is unsupported that selector simply never
           matches, the four-column track stays, and the go-link renders adrift in
           the middle of the row. A flag the component sets cannot fail that way. */
        .fo-pcard {
          display: grid; grid-template-columns: 84px 1fr auto; align-items: center; gap: 20px;
          padding: 20px 22px; border-radius: 12px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          transition: border-color .18s, background .18s, transform .18s, box-shadow .18s;
        }
        .fo-pcard:hover {
          border-color: var(--fo-brand); background: var(--fo-tint);
          transform: translateY(-1px); box-shadow: 0 12px 26px -20px rgba(110, 31, 103, .7);
        }
        /* the logo grew into the space the number badge used to hold */
        .fo-pcard__logo {
          width: 84px; height: 84px; border-radius: 12px; overflow: hidden;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-bg); border: 1px solid var(--fo-line);
        }
        .fo-pcard__logo img { width: 100%; height: 100%; object-fit: contain; }
        .fo-pcard__logo-fb { font-size: 30px; font-weight: 600; color: var(--fo-brand-soft); }

        .fo-pcard__body { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
        .fo-pcard__tag {
          display: inline-block; padding: 2px 10px; border-radius: 999px;
          background: var(--fo-brand); color: #fff;
          font-size: 12px; font-weight: 500; letter-spacing: .01em;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-pcard__name { font-size: 19px; font-weight: 500; color: var(--fo-ink); }
        .fo-pcard__slogan { font-size: 14px; font-weight: 300; color: var(--fo-muted); }
        .fo-pcard__team {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 2px;
          font-size: 12.5px; font-weight: 300; color: var(--fo-brand-soft);
        }
        .fo-pcard__go {
          display: inline-flex; align-items: center; gap: 7px; white-space: nowrap;
          align-self: center;
          font-size: 14.5px; font-weight: 500; color: var(--fo-brand);
        }

        /* align-items: start, not center: with a policy field present the two
           text columns must share a top edge, or the party's name floats to the
           middle of a block it heads. */
        .fo-pcard.has-pol {
          grid-template-columns: 84px minmax(0, 1fr) minmax(0, 1.1fr) auto;
          align-items: start;
        }

        /* ── the policy field ── */
        .fo-pcard__pol {
          display: flex; flex-direction: column; min-width: 0;
          padding-left: 20px; border-left: 1px solid var(--fo-line);
        }
        .fo-pcard__pol-h {
          font-size: 11.5px; font-weight: 500; letter-spacing: .04em;
          color: var(--fo-brand-soft); margin-bottom: 8px;
        }
        .fo-pcard__pol-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
        .fo-pcard__pol-list li {
          display: grid; grid-template-columns: auto 1fr; gap: 9px; align-items: baseline;
          font-size: 13.5px; font-weight: 300; line-height: 1.5; color: var(--fo-ink);
        }
        /* the same 01/02/03 the party page numbers its policies with, so the two
           screens are recognisably about the same list */
        .fo-pcard__pol-list i {
          font-style: normal; font-size: 11px; font-weight: 500; color: var(--fo-brand-soft);
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        /* two lines is the guard, not the target — real titles run to one. It
           stops a party that typed a paragraph into the title field from setting
           the height of every row on the page. */
        .fo-pcard__pol-list li span {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .fo-pcard__pol-more { margin-top: 8px; font-size: 12px; font-weight: 300; color: var(--fo-muted); }

        /* The policy column stops being a column before the phone does: at 1024
           the two text fields were 300px apiece and every title wrapped to two
           lines. It becomes a band under the identity instead, still divided
           from it — by a rule above rather than beside. */
        @media (max-width: 1080px) {
          .fo-pcard.has-pol { grid-template-columns: 84px 1fr auto; }
          /* Both need explicit placement. The band spans the full width, which
             forces it onto its own row; auto-placement then dropped the go-link
             onto a THIRD row at column 1 — measured 869px from the right edge it
             is supposed to sit against. Pinning the link to row 1 keeps it beside
             the identity where it belongs and leaves row 2 to the band. */
          .fo-pcard__go { grid-row: 1; grid-column: 3; }
          .fo-pcard__pol {
            grid-row: 2; grid-column: 1 / -1;
            padding-left: 0; padding-top: 14px; margin-top: 2px;
            border-left: 0; border-top: 1px solid var(--fo-line);
          }
          .fo-pcard__pol-list { grid-template-columns: repeat(3, 1fr); gap: 16px; }
        }
        @media (max-width: 760px) {
          /* The go-link drops out below 760: at that width it competed with the
             party name for the same line and both truncated. The whole card is the
             link anyway, so losing the label costs nothing. */
          .fo-pcard,
          .fo-pcard.has-pol { grid-template-columns: 68px 1fr; gap: 14px; padding: 16px; }
          .fo-pcard__logo { width: 68px; height: 68px; border-radius: 10px; }
          .fo-pcard__name { font-size: 17px; }
          .fo-pcard__go { display: none; }
          /* back to a stacked list: three columns of Thai at a third of 358px is
             two words a line */
          .fo-pcard__pol-list { grid-template-columns: 1fr; gap: 7px; }
          .fo-pcard__pol { grid-row: 2; padding-top: 12px; }
        }
        @media (max-width: 380px) {
          .fo-pcard,
          .fo-pcard.has-pol { grid-template-columns: 56px 1fr; gap: 12px; padding: 14px; }
          .fo-pcard__logo { width: 56px; height: 56px; }
          .fo-pcard__name { font-size: 16px; }
          .fo-pcard__slogan { font-size: 13px; }
          .fo-pcard__pol-list li { font-size: 13px; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
