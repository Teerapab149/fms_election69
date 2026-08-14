"use client";

// FmsOfficialSingleParty — the ballot when exactly one party stands.
//
// It carries the same material as /party — the crest, the vision, the policies,
// the team — because a voter cannot honestly endorse or reject a party they
// have been shown nothing about. It is NOT that page with a vote bolted on.
// The two have different jobs and the composition follows the job:
//
//   /party is a RECORD. Sections stacked in a fixed order under heading rules,
//          each one full measure, read top to bottom. Reference material.
//   this   is a DECISION. The party's case runs in one column while the three
//          choices sit in a rail beside it that follows down the page, so the
//          act is never more than a glance away from the evidence. The opening
//          is not an identity card but a QUESTION, put in plum, in the second
//          person. Every field is a bordered panel with a small label, not a
//          heading and a rule — a form being filled, not a document being read.
//
// Three rules, in order of importance:
//   1. The choices are equal in weight, footprint and reach. Colour marks what
//      each one MEANS; it never makes one easier to pick. A ballot that leans is
//      not the faculty's neutral instrument.
//   2. Nothing meaningful hides behind an animation. The intro is an overlay on
//      content that has already rendered. This project has shipped an invisible
//      ballot before by hanging it off a reveal that never fired.
//   3. The submit is irreversible, so it is confirmed, and the confirmation
//      names the choice back in words.
//
// The three colours are the house SEMANTIC system — approve green, disapprove
// red, abstain orange — fixed, never re-tinted by the template's palette,
// exactly as ReceiptSingleParty and VerdureSingleParty hold them. A choice has
// to mean the same thing in every theme.

import { useMemo, useState } from "react";
import { Check, Loader2, ShieldCheck, ArrowRight, Users } from "lucide-react";
import { getPath } from "../../utils/basePath";
import { sortMembersByPosition } from "../../utils/memberSort";
import FmsOfficialShell from "./FmsOfficialShell";
import FmsOfficialPartyIntro from "./FmsOfficialPartyIntro";
import FmsOfficialMemberModal from "./FmsOfficialMemberModal";

const asText = (it) =>
  typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

export default function FmsOfficialSingleParty({
  party = {}, specialOptions = {},
  selectedPartyId = null, onSelect = () => {},
  user = null, onConfirm = () => {}, isSubmitting = false, editorMode = false,
}) {
  // The intro never gates the ballot: it is an overlay, and everything beneath
  // it is painted from the first frame. Skipped in the editor, where a
  // full-screen curtain over a preview pane is only in the way.
  const [introDone, setIntroDone] = useState(editorMode);
  const [confirming, setConfirming] = useState(false);
  const [member, setMember] = useState(null);

  const missions = useMemo(
    () => (party?.missions || []).map(asText).filter(Boolean),
    [party?.missions]
  );
  const policies = useMemo(
    () => (party?.policies || []).map((it) =>
      typeof it === "string"
        ? { title: it, desc: "" }
        : { title: asText(it), desc: it?.desc ?? it?.description ?? it?.detail ?? "" }
    ).filter((p) => p.title),
    [party?.policies]
  );
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = useMemo(
    () => (party?.logoMeaning || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [party?.logoMeaning]
  );
  const logo = resolveSrc(party?.logoUrl);
  const name = party?.name || "";

  const choices = useMemo(() => {
    const out = [];
    if (party?.id != null) {
      out.push({
        id: party.id, tone: "approve", label: "รับรอง",
        // spaces around the name on purpose: Thai does not space between words,
        // but a Latin party name butted straight against สรรพนาม reads as one
        // unbroken run — "ให้พรรคThe Unity Concord Of FMS 2เข้า"
        sub: name ? `เห็นชอบให้พรรค ${name} เข้าดำรงตำแหน่ง` : "เห็นชอบให้พรรคนี้เข้าดำรงตำแหน่ง",
      });
    }
    if (specialOptions?.disapprove) {
      out.push({
        id: specialOptions.disapprove.id, tone: "disapprove", label: "ไม่รับรอง",
        sub: "ไม่เห็นชอบให้พรรคนี้เข้าดำรงตำแหน่ง",
      });
    }
    if (specialOptions?.abstain) {
      out.push({
        id: specialOptions.abstain.id, tone: "abstain", label: "งดออกเสียง",
        sub: "ใช้สิทธิ์โดยไม่ลงคะแนนให้ฝ่ายใด",
      });
    }
    return out;
  }, [party?.id, name, specialOptions]);

  const chosen = choices.find((c) => c.id === selectedPartyId) || null;

  return (
    <FmsOfficialShell active="vote" plain editorMode={editorMode}>
      {!introDone && !editorMode && (
        <FmsOfficialPartyIntro party={party} onDone={() => setIntroDone(true)} />
      )}

      {/* ── the question ──
          /party opens with an identity card: number, logo, name. This opens by
          ASKING, in plum and in the second person, because that is the whole
          difference between reading about a party and being on the hook for a
          decision about one. */}
      <section className="fo-sb__ask">
        {party?.number != null && (
          <span className="fo-sb__ghost" aria-hidden>{party.number}</span>
        )}
        <div className="fo-sb__ask-in">
          <span className="fo-sb__eyebrow">บัตรลงคะแนน · ผู้สมัครเพียงพรรคเดียว</span>
          <div className="fo-sb__ask-row">
            <span className="fo-sb__crest">
              {logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logo} alt={`ตราสัญลักษณ์พรรค${name}`} />
                : <span aria-hidden>{String(name).trim().charAt(0)}</span>}
            </span>
            <div className="fo-sb__ask-txt">
              {/* the space after พรรค is not optional — Thai does not space
                  between words, but a Latin party name butted against it reads
                  as one run: "ให้พรรคThe Unity Concord Of FMS 2บริหาร" */}
              <h1>
                รับรองให้<span className="fo-sb__party">พรรค {name}</span>
                บริหารสโมสรนักศึกษาหรือไม่
              </h1>
              {party?.slogan && <p className="fo-sb__slogan">{party.slogan}</p>}
            </div>
          </div>
          <div className="fo-sb__facts">
            <span>หมายเลข {party?.number ?? "—"}</span>
            {members.length > 0 && <span>ทีมงาน {members.length} คน</span>}
            {policies.length > 0 && <span>นโยบาย {policies.length} ข้อ</span>}
          </div>
        </div>
      </section>

      <div className="fo-sb__grid">
        {/* ── the case ── every block is a labelled field, not a titled section */}
        <div className="fo-sb__case">
          {policies.length > 0 && (
            <section className="fo-sb__field">
              <h2 className="fo-sb__flabel">นโยบายพรรค</h2>
              <ol className="fo-sb__pol">
                {policies.map((p, i) => (
                  <li key={i}>
                    <span className="fo-sb__pnum" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <b>{p.title}</b>
                      {p.desc && <p>{p.desc}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {missions.length > 0 && (
            <section className="fo-sb__field">
              <h2 className="fo-sb__flabel">วิสัยทัศน์และพันธกิจ</h2>
              <ul className="fo-sb__mis">
                {missions.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </section>
          )}

          {members.length > 0 && (
            <section className="fo-sb__field">
              <h2 className="fo-sb__flabel">ผู้สมัครในทีม · {members.length} คน</h2>
              {/* Portraits, and every one of them opens. A voter deciding whether
                  to hand this team the สโมสร is entitled to see who they are and
                  to check any individual's record — which post, which major,
                  which year. A 40px thumbnail beside a name could not carry that
                  and gave nothing to click. */}
              <ul className="fo-sb__team">
                {members.map((m) => {
                  const img = resolveSrc(m.imageUrl);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        className="fo-sb__mcard"
                        onClick={editorMode ? undefined : () => setMember(m)}
                        aria-label={`ดูรายละเอียดของ ${m.name || "ผู้สมัคร"}`}
                      >
                        <span className="fo-sb__mph">
                          {img
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={img} alt="" aria-hidden />
                            : <Users size={22} aria-hidden />}
                        </span>
                        {m.position && <span className="fo-sb__mplate">{m.position}</span>}
                        <b className="fo-sb__mname">{m.name}</b>
                        {m.major && <span className="fo-sb__mmajor">{m.major}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {story.length > 0 && (
            <section className="fo-sb__field">
              <h2 className="fo-sb__flabel">ความหมายของตราสัญลักษณ์</h2>
              <div
                className="fo-sb__story"
                tabIndex={0}
                role="region"
                aria-label="ความหมายของตราสัญลักษณ์"
              >
                {story.map((para, i) => <p key={i}>{para}</p>)}
                {/* sticky rather than absolute: it resolves against the
                    scrollport, which already excludes the scrollbar, so it needs
                    no guess at that width */}
                <span className="fo-sb__story-fade" aria-hidden />
              </div>
            </section>
          )}

          <a
            href={editorMode ? undefined : getPath(`/party?id=${party?.id ?? ""}`)}
            className="fo-sb__full"
          >
            <b>ดูแฟ้มข้อมูลฉบับเต็มของพรรค</b>
            <span>ภาพกิจกรรม ประวัติทีมงานรายบุคคล และรายละเอียดทั้งหมด</span>
            <span className="fo-sb__full-go">เปิดแฟ้ม <ArrowRight size={15} aria-hidden /></span>
          </a>
        </div>

        {/* ── the decision ──
            A rail that follows the reader down the evidence. This is the single
            structural thing that makes the screen a ballot rather than an
            article: on /party you scroll to the end to act, here the act is
            always in view beside what you are weighing. */}
        <aside className="fo-sb__rail">
          <div className="fo-sb__rail-in">
            <h2 className="fo-sb__rlabel">การลงคะแนน</h2>
            <p className="fo-sb__rnote">เลือกได้หนึ่งข้อ เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้</p>

            {user?.name && (
              <p className="fo-sb__voter">ในนาม <b>{user.name}</b></p>
            )}

            {/* radiogroup, not three buttons: the one fact a voter must be told
                is that these are mutually exclusive and exactly one applies */}
            <div className="fo-sb__opts" role="radiogroup" aria-label="ตัวเลือกการลงคะแนน">
              {choices.map((c) => {
                const selected = c.id === selectedPartyId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`fo-sb__opt fo-tone--${c.tone} ${selected ? "is-selected" : ""}`}
                    onClick={editorMode ? undefined : () => onSelect(c.id)}
                  >
                    <span className="fo-sb__mark" aria-hidden>
                      {selected ? <Check size={15} strokeWidth={3} /> : null}
                    </span>
                    <span className="fo-sb__otxt">
                      <b>{c.label}</b>
                      <span>{c.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`fo-sb__act ${chosen ? `fo-tone--${chosen.tone}` : ""}`}>
              <span className="fo-sb__state">
                {chosen
                  ? <>เลือกไว้ <b>{chosen.label}</b></>
                  : <span className="fo-note">ยังไม่ได้เลือก</span>}
              </span>
              <button
                type="button"
                className="fo-btn fo-btn--primary"
                disabled={!chosen || isSubmitting || editorMode}
                onClick={editorMode ? undefined : () => setConfirming(true)}
              >
                {isSubmitting
                  ? <><Loader2 size={17} className="fo-spin" aria-hidden /> กำลังบันทึก…</>
                  : <>ยืนยันการลงคะแนน</>}
              </button>
            </div>

            <p className="fo-sb__privacy">
              <ShieldCheck size={14} aria-hidden />
              บันทึกเฉพาะตัวเลือกในรูปแบบเข้ารหัส ไม่ผูกกับบัญชีของคุณ
            </p>
          </div>
        </aside>
      </div>

      {/* The narrow-screen half of the rail's promise. Sticking the whole rail
          was the first attempt and it was wrong: with the heading, the note, the
          three choices and the privacy line it pinned ~450px to the foot of an
          844px phone and buried the very evidence it sits beside. Only the act
          pins here, and exactly one of the two is ever displayed — the rail's own
          footer hides at this width — so there is never a second button to
          wonder about. */}
      <div className={`fo-sb__bar ${chosen ? `fo-tone--${chosen.tone}` : ""}`}>
        <span className="fo-sb__state">
          {chosen
            ? <>เลือกไว้ <b>{chosen.label}</b></>
            : <span className="fo-note">ยังไม่ได้เลือก</span>}
        </span>
        <button
          type="button"
          className="fo-btn fo-btn--primary"
          disabled={!chosen || isSubmitting || editorMode}
          onClick={editorMode ? undefined : () => setConfirming(true)}
        >
          {isSubmitting
            ? <><Loader2 size={17} className="fo-spin" aria-hidden /> กำลังบันทึก…</>
            : <>ยืนยันการลงคะแนน</>}
        </button>
      </div>

      <FmsOfficialMemberModal member={member} onClose={() => setMember(null)} />

      {confirming && chosen && (
        <div className="fo-cm" role="dialog" aria-modal="true" aria-labelledby="fo-cm-title">
          <div className="fo-cm__card">
            <h3 id="fo-cm-title">ยืนยันการลงคะแนน</h3>
            {/* names the choice back rather than saying "your selection" — the
                last chance to catch a mis-tap before something irreversible */}
            <p className={`fo-cm__pick fo-tone--${chosen.tone}`}>{chosen.label}</p>
            <p className="fo-cm__warn">เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้</p>
            <div className="fo-cm__acts">
              <button type="button" className="fo-btn fo-btn--ghost" onClick={() => setConfirming(false)}>
                ย้อนกลับ
              </button>
              <button
                type="button"
                className="fo-btn fo-btn--primary"
                disabled={isSubmitting}
                onClick={onConfirm}
              >
                {isSubmitting
                  ? <><Loader2 size={17} className="fo-spin" aria-hidden /> กำลังบันทึก…</>
                  : <>ยืนยัน</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* the .fo-tone--* semantic trio lives in FmsOfficialChrome: both ballots
           use them and only one of the two ever renders */

        /* ── the question ── */
        .fo-sb__ask {
          position: relative; overflow: hidden; border-radius: 4px;
          background: var(--fo-plum); color: #fff;
        }
        .fo-sb__ghost {
          position: absolute; right: -.04em; bottom: -.3em; z-index: 0;
          font-size: clamp(200px, 26vw, 340px); font-weight: 700; line-height: .78;
          letter-spacing: -.06em; color: #fff; opacity: .08;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
          pointer-events: none; user-select: none;
        }
        .fo-sb__ask-in { position: relative; z-index: 1; padding: 34px 38px 32px; }
        .fo-sb__eyebrow {
          display: block; font-size: 12px; font-weight: 500;
          letter-spacing: .14em; color: rgba(255,255,255,.72);
        }
        .fo-sb__ask-row { display: grid; grid-template-columns: 92px 1fr; gap: 24px; align-items: center; margin-top: 20px; }
        .fo-sb__crest {
          width: 92px; height: 92px; border-radius: 10px; overflow: hidden;
          display: inline-flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.94); color: var(--fo-brand);
          font-size: 32px; font-weight: 600;
        }
        .fo-sb__crest img { width: 100%; height: 100%; object-fit: contain; }
        .fo-sb__ask-txt h1 {
          margin: 0; font-size: clamp(22px, 2.9vw, 33px); font-weight: 600;
          line-height: 1.35; color: #fff; text-wrap: balance;
        }
        /* the party's name set apart inside the sentence, so the question stays
           a sentence and the name is still findable in it */
        .fo-sb__party { display: inline; padding: 0 .32em; font-weight: 700; }
        .fo-sb__slogan { margin: 10px 0 0; font-size: 15px; font-weight: 300; color: rgba(255,255,255,.8); }
        .fo-sb__facts {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-sb__facts span {
          padding: 6px 14px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,.32); background: rgba(255,255,255,.08);
          font-size: 12.5px; font-weight: 400; color: rgba(255,255,255,.92);
        }

        /* ── the two tracks ── */
        .fo-sb__grid {
          display: grid; grid-template-columns: minmax(0, 1fr) 366px;
          gap: 26px; align-items: start; margin-top: 26px;
        }
        .fo-sb__case { display: grid; gap: 16px; min-width: 0; }

        /* A field, not a section: a small label over a bordered panel, the way a
           form names what goes in a box. /party uses a heading and a brand rule,
           and the difference is the point — this screen is being filled in. */
        .fo-sb__field {
          border: 1px solid var(--fo-line); border-radius: 4px;
          background: var(--fo-surface); padding: 22px 24px 24px;
        }
        .fo-sb__flabel {
          margin: 0 0 16px; font-size: 12px; font-weight: 600;
          letter-spacing: .12em; color: var(--fo-brand);
        }

        .fo-sb__pol { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
        .fo-sb__pol li { display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; }
        .fo-sb__pnum {
          font-size: 15px; font-weight: 600; color: var(--fo-brand-soft); line-height: 1.6;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-sb__pol b { display: block; font-size: 15.5px; font-weight: 500; color: var(--fo-ink); line-height: 1.5; }
        .fo-sb__pol p { margin: 5px 0 0; font-size: 14px; font-weight: 300; line-height: 1.7; color: var(--fo-muted); }

        .fo-sb__mis { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
        .fo-sb__mis li {
          position: relative; padding-left: 20px;
          font-size: 14.5px; font-weight: 300; line-height: 1.7; color: var(--fo-ink);
        }
        .fo-sb__mis li::before {
          content: ""; position: absolute; left: 0; top: .68em;
          width: 7px; height: 7px; border-radius: 50%; background: var(--fo-brand-soft);
        }

        /* ── the team ──
           Portraits at a size you can actually read a face at, each one a
           button. The position plate straddling the photo's lower edge is the
           faculty's own คณะผู้บริหาร motif, which is what makes the grid
           scannable: you read roles down the page, then names. */
        .fo-sb__team {
          list-style: none; margin: 0; padding: 0; display: grid;
          grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 24px 14px;
        }
        .fo-sb__mcard {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          width: 100%; padding: 0; background: none; border: 0; cursor: pointer;
          font-family: inherit;
        }
        .fo-sb__mph {
          position: relative; width: 100%; aspect-ratio: 3 / 4; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: var(--fo-bg); border: 1px solid var(--fo-line); color: var(--fo-brand-soft);
          transition: border-color .18s;
        }
        .fo-sb__mph img { width: 100%; height: 100%; object-fit: cover; }
        .fo-sb__mcard:hover .fo-sb__mph { border-color: var(--fo-brand); }
        .fo-sb__mcard:focus-visible { outline: none; }
        .fo-sb__mcard:focus-visible .fo-sb__mph { outline: 2px solid var(--fo-brand); outline-offset: 2px; }
        .fo-sb__mplate {
          margin-top: -18px; position: relative; z-index: 1; max-width: 92%;
          padding: 7px 13px; border-radius: 7px;
          background: var(--fo-plum); color: #fff;
          font-size: 12px; font-weight: 500; line-height: 1.35;
          box-shadow: 0 8px 18px -12px rgba(36, 30, 40, .8);
        }
        .fo-sb__mname { margin-top: 10px; font-size: 14px; font-weight: 500; line-height: 1.4; color: var(--fo-ink); }
        .fo-sb__mcard:hover .fo-sb__mname { color: var(--fo-brand); }
        .fo-sb__mmajor { margin-top: 2px; font-size: 11.5px; font-weight: 300; line-height: 1.4; color: var(--fo-muted); }

        /* the crest reading is the longest and least decision-relevant text on
           the screen, so it is bounded and the reader opts into it */
        .fo-sb__story {
          position: relative; max-height: 220px; overflow-y: auto; overscroll-behavior: contain;
          padding-bottom: 42px;
          scrollbar-color: var(--fo-brand-soft) var(--fo-tint);
        }
        .fo-sb__story:focus-visible { outline: 2px solid var(--fo-brand); outline-offset: 3px; }
        .fo-sb__story p { margin: 0; font-size: 14.5px; font-weight: 300; line-height: 1.8; color: var(--fo-ink); }
        .fo-sb__story p + p { margin-top: 13px; }
        .fo-sb__story-fade {
          position: sticky; bottom: -42px; z-index: 1; display: block;
          height: 38px; margin-bottom: -38px; pointer-events: none;
          /* the keyword transparent, never rgba(255,255,255,0): the surface is a
             token and a variant may make it something other than white, at which
             point a hardcoded white start fades through a grey haze */
          background: linear-gradient(to bottom, transparent, var(--fo-surface) 82%);
        }

        .fo-sb__full {
          display: block; padding: 22px 24px; border-radius: 4px;
          background: var(--fo-plum); color: #fff; transition: background .2s;
        }
        .fo-sb__full:hover { background: var(--fo-plum-deep); }
        .fo-sb__full b { display: block; font-size: 17px; font-weight: 600; }
        .fo-sb__full > span { display: block; margin-top: 5px; font-size: 13.5px; font-weight: 300; color: rgba(255,255,255,.8); }
        .fo-sb__full-go {
          display: inline-flex !important; align-items: center; gap: 7px; margin-top: 14px;
          font-size: 14px; font-weight: 400; color: #fff !important;
          border-bottom: 1px solid rgba(255,255,255,.6); padding-bottom: 3px;
        }

        /* ── the rail ── */
        .fo-sb__rail { position: sticky; top: 18px; }
        .fo-sb__rail-in {
          border: 1px solid var(--fo-line); border-top: 6px solid var(--fo-brand);
          border-radius: 4px; background: var(--fo-surface); padding: 22px 22px 20px;
          box-shadow: 0 30px 60px -48px rgba(36, 30, 40, .6);
        }
        .fo-sb__rlabel { margin: 0; font-size: 18px; font-weight: 600; color: var(--fo-ink); }
        .fo-sb__rnote { margin: 6px 0 0; font-size: 13px; font-weight: 300; line-height: 1.6; color: var(--fo-muted); }
        .fo-sb__voter { margin: 12px 0 0; font-size: 13px; font-weight: 300; color: var(--fo-muted); }
        .fo-sb__voter b { font-weight: 500; color: var(--fo-ink); }

        /* Equal rows, whatever anyone types: the รับรอง line carries the party's
           name, so it is as long as the party made it. */
        .fo-sb__opts { display: grid; grid-auto-rows: 1fr; gap: 10px; margin-top: 18px; }
        .fo-sb__opt {
          display: grid; grid-template-columns: 26px 1fr; gap: 12px; align-items: start;
          width: 100%; text-align: left; cursor: pointer; font-family: inherit;
          padding: 15px 16px; border-radius: 10px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          transition: border-color .16s, background .16s, box-shadow .16s;
        }
        .fo-sb__opt:hover { border-color: var(--fo-tone); background: color-mix(in srgb, var(--fo-tone) 5%, var(--fo-surface)); }
        /* Three signals — ring, field, check — because one is not enough on a
           screen someone reads once and commits to. Colour is the fourth, and it
           says what the choice MEANS; it never changes the footprint. */
        .fo-sb__opt.is-selected {
          border-color: var(--fo-tone); box-shadow: inset 0 0 0 1px var(--fo-tone);
          background: color-mix(in srgb, var(--fo-tone) 8%, var(--fo-surface));
        }
        .fo-sb__opt:focus-visible { outline: 2px solid var(--fo-tone); outline-offset: 2px; }
        .fo-sb__mark {
          width: 26px; height: 26px; border-radius: 50%; margin-top: 1px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 2px solid var(--fo-line); background: transparent; color: #fff;
        }
        .fo-sb__opt:hover .fo-sb__mark { border-color: var(--fo-tone); }
        .fo-sb__opt.is-selected .fo-sb__mark { background: var(--fo-tone); border-color: var(--fo-tone); }
        .fo-sb__otxt { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .fo-sb__otxt b { font-size: 16px; font-weight: 600; color: var(--fo-ink); }
        /* the deep tone, not the bright one — this is text, and it sits on the
           choice's own tint once selected */
        .fo-sb__opt.is-selected .fo-sb__otxt b { color: var(--fo-tone-deep); }
        .fo-sb__otxt span { font-size: 12.5px; font-weight: 300; line-height: 1.55; color: var(--fo-muted); }

        .fo-sb__act {
          display: grid; gap: 10px; margin-top: 16px; padding-top: 16px;
          border-top: 1px solid var(--fo-line);
        }
        .fo-sb__state { font-size: 13.5px; font-weight: 300; color: var(--fo-muted); }
        .fo-sb__state b { font-weight: 600; color: var(--fo-tone-deep, var(--fo-ink)); }
        .fo-sb__act .fo-btn { width: 100%; justify-content: center; }
        .fo-spin { animation: fo-spin 1s linear infinite; }
        @keyframes fo-spin { to { transform: rotate(360deg); } }

        .fo-sb__privacy {
          display: flex; align-items: flex-start; gap: 7px; margin: 14px 0 0;
          font-size: 12px; font-weight: 300; line-height: 1.55; color: var(--fo-muted);
        }
        .fo-sb__privacy svg { flex: 0 0 auto; margin-top: 2px; color: var(--fo-brand-soft); }

        /* ── confirm ── */
        .fo-cm {
          position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
          padding: 24px; background: rgba(36, 30, 40, .55);
        }
        .fo-cm__card {
          width: min(430px, 100%); padding: 28px 30px 24px; border-radius: 4px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          border-top: 6px solid var(--fo-brand);
          box-shadow: 0 40px 80px -50px rgba(36, 30, 40, .8);
        }
        .fo-cm__card h3 { margin: 0; font-size: 19px; font-weight: 600; color: var(--fo-ink); }
        .fo-cm__pick {
          margin: 16px 0 0; padding: 14px 18px; border-radius: 8px;
          background: color-mix(in srgb, var(--fo-tone) 8%, var(--fo-surface));
          border: 1px solid var(--fo-tone);
          font-size: 18px; font-weight: 600; color: var(--fo-tone-deep);
        }
        .fo-cm__warn { margin: 14px 0 0; font-size: 13.5px; font-weight: 300; color: var(--fo-muted); }
        .fo-cm__acts { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }

        /* The compact pinned action for narrow screens. Hidden by default so the
           desktop rail owns the act; the media query below swaps which one shows.
           The safe-area pad is not cosmetic: pinned to bottom:0 on iOS the bar
           sits under the home indicator, and the confirm button is the exact
           strip the gesture bar eats. */
        .fo-sb__bar { display: none; }

        /* The rail stops being a rail before it gets too narrow to hold a choice:
           at 980 it was 366 of a 932 measure and the sub-lines wrapped to three. */
        @media (max-width: 1040px) {
          .fo-sb__grid { grid-template-columns: minmax(0, 1fr); }
          /* Static now, and in flow at the end — the reading order a phone wants
             anyway: what is being asked, the case for it, then the choices. */
          .fo-sb__rail { position: static; }
          .fo-sb__rail-in { border-top-width: 6px; }
          .fo-sb__opts { grid-template-columns: repeat(3, 1fr); }
          /* exactly one act is displayed at any width */
          .fo-sb__act { display: none; }
          .fo-sb__bar {
            display: flex; align-items: center; justify-content: space-between;
            gap: 14px; flex-wrap: wrap;
            position: sticky; bottom: 0; z-index: 20; margin-top: 22px;
            padding: 14px 18px calc(14px + env(safe-area-inset-bottom, 0px));
            border-radius: 12px;
            background: var(--fo-surface); border: 1px solid var(--fo-line);
            box-shadow: 0 -8px 26px -18px rgba(36, 30, 40, .55);
          }
        }

        @media (max-width: 760px) {
          .fo-sb__ask-in { padding: 24px 20px 22px; }
          .fo-sb__ask-row { grid-template-columns: 64px 1fr; gap: 16px; margin-top: 16px; }
          .fo-sb__crest { width: 64px; height: 64px; }
          .fo-sb__facts { margin-top: 16px; }
          .fo-sb__field { padding: 18px 18px 20px; }
          /* Lands at two across, 155px a portrait — the same width /party's own
             phone grid gives them, and the point of the change was that a face
             has to be readable. Three would fit at ~100px and would save about
             800px of scroll, but a 100px portrait is not what was asked for.
             The cost is real and stated: the team block is 2,371 of the page's
             5,068 on a phone. */
          .fo-sb__team { grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 20px 10px; }
          .fo-sb__mplate { font-size: 11px; padding: 6px 10px; margin-top: -16px; }
          .fo-sb__mname { font-size: 13px; }
          /* one per row again — three columns of Thai at a third of 358px is two
             words a line, and this is the control that decides an election */
          .fo-sb__opts { grid-template-columns: minmax(0, 1fr); gap: 8px; }
          .fo-sb__opt { padding: 13px 14px; }
          .fo-sb__otxt b { font-size: 15px; }
          .fo-sb__bar { flex-direction: column; align-items: stretch; gap: 10px; }
          .fo-sb__bar .fo-btn { width: 100%; justify-content: center; }
          .fo-cm__acts { flex-direction: column-reverse; }
          .fo-cm__acts .fo-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
