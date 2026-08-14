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

import { useMemo } from "react";
import { ArrowRight, Users } from "lucide-react";
import { getPath } from "../../utils/basePath";
import FmsOfficialShell from "./FmsOfficialShell";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { fmsMeta } from "../home/FmsOfficialChrome";

const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

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
            return (
              <li key={p.id}>
                <a
                  href={editorMode ? undefined : getPath(`/party?id=${p.id}`)}
                  className="fo-pcard"
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
           reads as a register, which is what it is. */
        .fo-pcard {
          display: grid; grid-template-columns: 84px 1fr auto; align-items: center; gap: 20px;
          padding: 18px 22px; border-radius: 12px;
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
          font-size: 14.5px; font-weight: 500; color: var(--fo-brand);
        }

        @media (max-width: 760px) {
          /* The go-link drops out below 760: at that width it competed with the
             party name for the same line and both truncated. The whole card is the
             link anyway, so losing the label costs nothing. */
          .fo-pcard { grid-template-columns: 68px 1fr; gap: 14px; padding: 16px; }
          .fo-pcard__logo { width: 68px; height: 68px; border-radius: 10px; }
          .fo-pcard__name { font-size: 17px; }
          .fo-pcard__go { display: none; }
        }
        @media (max-width: 380px) {
          .fo-pcard { grid-template-columns: 56px 1fr; gap: 12px; padding: 14px; }
          .fo-pcard__logo { width: 56px; height: 56px; }
          .fo-pcard__name { font-size: 16px; }
          .fo-pcard__slogan { font-size: 13px; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
