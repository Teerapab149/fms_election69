"use client";

// ReceiptPartyIntro — cinematic "single-party presentation" opener for the
// Receipt · Paper Materiality family (ReceiptSingleParty mounts it).
//
// Same contract as GumroadPartyIntro / StudioDarkPartyIntro / BlossomPartyIntro:
//   <ReceiptPartyIntro party={party} onDone={fn} durationMs? />
//   - an OVERLAY on already-rendered content; it never gates the ballot. No JS,
//     no motion, editor preview → the booth underneath is complete on its own.
//   - auto-dismisses after durationMs, or on click / Esc, calling onDone exactly once
//   - the parent flips `introDone` on onDone, which adds .is-live to the root so the
//     booth's own entrance choreography plays AFTER this lifts, not behind it
//
// FORM: a letterpress BROADSIDE — the sheet a faculty would paste on a board to
// announce who is standing. Not a till receipt.
//
// The first cut WAS a till receipt: an itemised slip that printed line by line.
// It was pretty and it was the wrong object. A receipt is a transaction record —
// its whole grammar is small mono type, label-left/value-right, made to be filed.
// This screen has to PRESENT a candidate. Measured against the other families the
// mismatch was plain: the party name landed at 13.5px here while gumroad sets it
// up to 96px and fms-official to 54px, the slip held 24% of a 1440px viewport,
// and eight staggered steps() reveals meant nothing was fully readable until
// 2.55s of a 3.4s curtain — the owner's screenshot caught half-printed lines.
//
// So: three things only — numeral, name, slogan — each landing whole, nothing
// typing on, everything readable by ~1.5s and then simply HELD. The family's
// material language does the identity work instead: real paper stock (.rc-grain),
// the desk's laid texture and vignette (.rc-desk), ink rules, a foil hairline,
// the faculty ship blind-embossed into the sheet, and a deckle bottom edge.
//
// Motion is a PRESS, not a fade: each block lands from slightly oversized with a
// hard-out ease and an ink bite behind it (the same double-print ghost the family
// uses for its stamps) — the impression of a platen striking paper.
//
// Colours are var(--rc-*) from ReceiptBaseStyles on .rc-root. transform/opacity only.
//
// reduced motion: ทั้ง family เล่นม่านนี้เสมอ เป็นการตัดสินใจเชิงผลิตภัณฑ์เดียวกับ
// GumroadPartyIntro (ดูคอมเมนต์ `const reduce = false` ในไฟล์นั้น) — ม่านกินเวลา
// ไม่ถึง 4 วินาที ข้ามได้ด้วยการแตะ/Esc และเนื้อหาข้างล่างมองเห็นครบอยู่แล้วโดยไม่ต้องรอ

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ReceiptShipMark } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

const EASE = [0.16, 1, 0.3, 1];
const EASE_IO = [0.76, 0, 0.24, 1];
// แท่นพิมพ์กระแทกลงกระดาษ: ออกตัวเร็ว หยุดแน่น ไม่มีเด้งกลับ
const PRESS = [0.2, 0.9, 0.2, 1];

export default function ReceiptPartyIntro({ party = {}, onDone = () => {}, durationMs = 3400 }) {
  const gc = useGlobalConfig() || {};
  const calledRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    setLeaving(true);
    setTimeout(onDone, 620);
  };

  useEffect(() => {
    const t = setTimeout(finish, durationMs);
    const onKey = (e) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = (party?.name || "พรรคของคุณ").trim();
  // ขนาดตัวอักษรผูกกับความยาวชื่อพรรค ไม่ใช่ค่าคงที่ค่าเดียว
  //
  // ชื่อจริงยาวกว่าตัวอย่างได้มาก (ปีก่อนใช้ "The Unity Concord Of FMS") ถ้าตรึงไว้
  // ที่ขนาดเดียว ชื่อยาวจะดันสูงจนแผ่นเกิน 94vh แล้วโดน overflow ตัดท้าย — เสียทั้ง
  // เลขที่เอกสารและบรรทัด "แตะเพื่อเข้าสู่หน้าพรรค" · คิดจากจำนวนอักขระตอน render
  // (คงที่ ไม่ต้องวัด DOM) จึงไม่มีปัญหา hydration และไม่มีการกระพริบตอนโหลด
  const density = name.length <= 16 ? "a" : name.length <= 28 ? "b" : name.length <= 44 ? "c" : "d";
  const no = party?.number;
  const hasNo = no != null && no > 0;
  const numeral = hasNo ? String(no).padStart(2, "0") : "—";
  const prefix = gc.electionNamePrefix || "SAMO";
  const edition = gc.electionNumber ?? "";
  // เลขที่เอกสารต้องคงที่ ห้ามสุ่ม/ห้ามอิงเวลา — ม่านนี้ render ฝั่ง server ด้วย
  const serial = `${prefix}${edition}-P${numeral}`;

  return (
    <motion.div className="rc-intro rc-desk" role="presentation" onClick={finish}
      initial={{ y: 0 }} animate={{ y: leaving ? "-101%" : 0 }}
      transition={{ duration: 0.6, ease: EASE_IO }}>
      {/* ตราปั๊มจมบนโต๊ะ — คลาสกลางของ family ไม่ได้วาดใหม่ */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
      </div>

      <motion.div className="rc-intro__sheet rc-grain" data-len={density}
        initial={{ y: 16, scale: 0.985, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE }}>
        <span className="rc-intro__emboss" aria-hidden="true"><ReceiptShipMark strokeWidth={2.4} /></span>

        <motion.div className="rc-intro__masthead"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.42, ease: EASE, delay: 0.16 }}>
          <span>{prefix} {edition} · FMS ELECTION</span>
          <span>พรรคเดียวที่ลงสมัคร</span>
        </motion.div>

        <p className="rc-intro__label">หมายเลขผู้สมัคร · PARTY NUMBER</p>

        {/* จังหวะหลัก: เลขพรรคถูกกระแทกลงกระดาษ พร้อมรอยหมึกซ้อนที่จางออกทันที */}
        <motion.div className="rc-intro__numeral"
          initial={{ scale: 1.22, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.34, ease: PRESS, delay: 0.3 }}>
          <motion.span className="rc-intro__bite" aria-hidden="true"
            initial={{ opacity: 0.5 }} animate={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: "easeOut", delay: 0.56 }}>{numeral}</motion.span>
          <span className="rc-intro__no">{numeral}</span>
        </motion.div>

        <motion.span className="rc-intro__bar" aria-hidden="true"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.38, ease: EASE, delay: 0.62 }}>
          <i className="rc-foil" />
        </motion.span>

        <motion.h2 className="rc-intro__name"
          initial={{ scale: 1.07, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: PRESS, delay: 0.72 }}>
          {name}
        </motion.h2>

        {party?.slogan && (
          <motion.p className="rc-intro__slogan"
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.95 }}>
            “{party.slogan}”
          </motion.p>
        )}

        <motion.div className="rc-intro__foot"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: EASE, delay: 1.15 }}>
          <span className="rc-intro__serial">{serial}</span>
          <span className="rc-intro__hint">แตะเพื่อเข้าสู่หน้าพรรค</span>
        </motion.div>

        <span className="rc-intro__deckle" aria-hidden="true" />
      </motion.div>

      <style jsx global>{`
        .rc-intro { position:fixed; inset:0; z-index:9000; display:grid; place-items:center;
          padding:clamp(16px,4vw,44px); cursor:pointer; overflow:hidden;
          background:var(--rc-desk); color:var(--rc-ink); font-family:var(--rc-fr); }

        /* แผ่นประกาศ — กินพื้นที่จอจริง ไม่ใช่ของเล็ก ๆ วางกลางความว่าง
           (ของเดิมกว้าง 352px = 24% ของจอ 1440px) */
        .rc-intro__sheet { position:relative; width:min(720px,94vw); max-height:94vh; overflow:hidden;
          padding:clamp(22px,3.4vw,40px) clamp(20px,4vw,52px) clamp(30px,4vw,46px);
          text-align:center; border:1px solid var(--rc-line);
          box-shadow:0 40px 80px -48px color-mix(in srgb, var(--rc-ink) 70%, transparent),
                     0 2px 0 color-mix(in srgb, var(--rc-ink) 8%, transparent); }

        /* ตราเรือปั๊มจมในเนื้อกระดาษ — ไม่มีสี มีแต่ร่องรอย */
        .rc-intro__emboss { position:absolute; left:50%; bottom:6%; width:42%; transform:translateX(-50%);
          opacity:.055; color:var(--rc-ink); pointer-events:none; }
        .rc-intro__emboss svg { width:100%; height:auto; display:block; }

        .rc-intro__masthead { display:flex; align-items:baseline; justify-content:space-between; gap:16px;
          padding-bottom:9px; border-bottom:3px double var(--rc-ink); transform-origin:left center;
          font-family:var(--rc-fm); font-size:clamp(9px,1.1vw,11px); letter-spacing:.22em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-intro__masthead span:last-child { letter-spacing:.12em; }

        .rc-intro__label { font-family:var(--rc-fm); font-size:clamp(9px,1.05vw,10.5px); letter-spacing:.3em;
          text-transform:uppercase; color:var(--rc-ink2); margin:clamp(18px,2.6vw,30px) 0 0; }

        /* พระเอกของการ์ด: เลขพรรค — เทียบเท่ากับที่ family อื่นให้ (studio-dark 300px,
           fms-official 520px) ของเดิมอยู่ในตราปั๊มขนาด 46px */
        .rc-intro__numeral { position:relative; display:inline-block; margin:2px 0 0; line-height:.84; }
        /* ชั้นขนาดตามความยาวชื่อพรรค — ชื่อยิ่งยาว เลขและชื่อยิ่งเล็กลงพร้อมกัน
           ทั้งคู่ย่อไปด้วยกันเพื่อให้สัดส่วนของแผ่นยังเป็นใบประกาศเหมือนเดิม
           min(vw,vh) — จอเตี้ย (โน้ตบุ๊ก 768px, มือถือแนวนอน) ต้องหดตามความสูงด้วย */
        .rc-intro__sheet[data-len="a"] { --rc-i-no:clamp(110px, min(30vw,28vh), 260px); --rc-i-nm:clamp(30px,6.2vw,64px); }
        .rc-intro__sheet[data-len="b"] { --rc-i-no:clamp(96px,  min(26vw,24vh), 220px); --rc-i-nm:clamp(26px,5.2vw,52px); }
        .rc-intro__sheet[data-len="c"] { --rc-i-no:clamp(84px,  min(21vw,20vh), 180px); --rc-i-nm:clamp(22px,4.2vw,40px); }
        .rc-intro__sheet[data-len="d"] { --rc-i-no:clamp(72px,  min(17vw,17vh), 148px); --rc-i-nm:clamp(19px,3.4vw,32px); }
        .rc-intro__no, .rc-intro__bite { display:block; font-family:var(--rc-fm); font-weight:700;
          font-size:var(--rc-i-no); line-height:.84; letter-spacing:-.03em; }
        .rc-intro__no { position:relative; color:var(--rc-ink);
          text-shadow:0 1px 0 color-mix(in srgb, var(--rc-receipt) 85%, transparent); }
        /* รอยหมึกซ้อน = แรงกระแทกของแท่นพิมพ์ ภาษาเดียวกับ ghost ของตราปั๊มใน family */
        .rc-intro__bite { position:absolute; inset:0; color:var(--rc-accent); transform:translate(6px,-4px); }

        /* แท่งหมึกหนาคือภาษาของ letterpress ส่วนฟอยล์ (ลายเซ็นของ family) เหลือเป็น
           เส้นบางใต้แท่ง — เต็มแถบแล้วมันกลายเป็นสติกเกอร์สีรุ้งแย่งซีนเลขพรรค */
        .rc-intro__bar { display:block; height:9px; border-radius:1px; margin:clamp(10px,1.6vw,18px) 0 clamp(16px,2.2vw,24px);
          background-color:var(--rc-ink); transform-origin:center; position:relative; }
        .rc-intro__bar i { position:absolute; left:0; right:0; bottom:-5px; height:3px; border-radius:1px; display:block; }

        .rc-intro__name { font-family:var(--rc-fh); font-weight:700; font-size:var(--rc-i-nm);
          line-height:1.12; letter-spacing:-.01em; margin:0; color:var(--rc-ink); overflow-wrap:break-word;
          /* ชื่อพรรคไทยยาว ๆ ตัดบรรทัดกลางวลีแล้วอ่านสะดุด (พรรคตัวอย่าง ร่วม / สร้าง)
             balance เกลี่ยให้สองบรรทัดยาวใกล้กัน เบราว์เซอร์ที่ไม่รองรับก็ตัดแบบเดิม */
          text-wrap:balance; }
        .rc-intro__slogan { font-family:var(--rc-fr); font-size:clamp(13px,1.7vw,19px); line-height:1.5;
          color:var(--rc-ink2); margin:clamp(10px,1.4vw,16px) auto 0; max-width:44ch; }

        .rc-intro__foot { display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;
          margin-top:clamp(20px,3vw,34px); padding-top:12px; border-top:1px solid var(--rc-line);
          font-family:var(--rc-fm); font-size:clamp(9px,1vw,10px); letter-spacing:.24em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-intro__hint { animation:rcIntroBlink 2s ease-in-out 1.6s infinite; }
        @keyframes rcIntroBlink { 0%,100% { opacity:1; } 55% { opacity:.45; } }

        /* ขอบล่างเป็นรอยฉีกของกระดาษ (deckle) — ปิดท้ายแผ่นด้วยวัสดุ ไม่ใช่เส้นตรง */
        .rc-intro__deckle { position:absolute; left:0; right:0; bottom:-1px; height:12px;
          background:var(--rc-desk);
          clip-path:polygon(0 100%,100% 100%,100% 38%,96% 74%,92% 30%,88% 70%,84% 26%,80% 66%,76% 34%,72% 72%,68% 28%,64% 64%,60% 36%,56% 74%,52% 30%,48% 68%,44% 26%,40% 70%,36% 34%,32% 62%,28% 28%,24% 72%,20% 32%,16% 66%,12% 26%,8% 70%,4% 34%,0 64%); }

        @media (max-width:520px) {
          /* บนมือถือให้แผ่นสูงเกือบเต็มจอ เหมือนใบประกาศที่แปะอยู่ตรงหน้า
             ไม่ใช่การ์ดใบเล็กลอยกลางโต๊ะ (วัดของเดิมได้ 338px = 42% ของจอ) */
          .rc-intro__sheet { min-height:72vh; display:flex; flex-direction:column; justify-content:center; }
          .rc-intro__masthead { font-size:8.5px; letter-spacing:.16em; }
          .rc-intro__masthead span:last-child { display:none; }
          .rc-intro__foot { justify-content:center; gap:8px; }
          .rc-intro__emboss { bottom:10%; width:54%; }
        }
      `}</style>
    </motion.div>
  );
}
