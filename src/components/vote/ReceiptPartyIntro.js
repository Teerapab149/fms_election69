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
// The identity here is the PRINT ITSELF, not a card that happens to be on paper:
// the party is issued as a receipt. A thermal head travels down the slip and every
// line appears under it in steps() — never a fade — with dotted leaders and
// right-aligned values the way a till prints an itemisation. The numeral lands as
// an ink stamp with a ghost double-print offset behind it (the family's rcSoak /
// rcGhostOut language), the ship mark is blind-embossed into the stock, and the
// slip ends in a barcode + serial above the perforation.
//
// Colours are var(--rc-*) from ReceiptBaseStyles on .rc-root. Every reveal is
// clip-path/transform/opacity, so it all runs on the compositor.
//
// reduced motion: ทั้ง family เล่นม่านนี้เสมอ เป็นการตัดสินใจเชิงผลิตภัณฑ์เดียวกับ
// GumroadPartyIntro (ดูคอมเมนต์ `const reduce = false` ในไฟล์นั้น) — ม่านกินเวลา
// ไม่ถึง 4 วินาที ข้ามได้ด้วยการแตะ/Esc และเนื้อหาข้างล่างมองเห็นครบอยู่แล้วโดยไม่ต้องรอ

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getPath } from "../../utils/basePath";
import { ReceiptShipMark } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

const EASE = [0.16, 1, 0.3, 1];
const EASE_IO = [0.76, 0, 0.24, 1];

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
  const logo = party?.logoUrl ? getPath(party.logoUrl) : null;
  const no = party?.number;
  const hasNo = no != null && no > 0;
  const numeral = hasNo ? String(no).padStart(2, "0") : "—";
  const team = Array.isArray(party?.members) ? party.members.length : 0;
  const prefix = gc.electionNamePrefix || "SAMO";
  const edition = gc.electionNumber ?? "";
  // เลขที่เอกสารต้องคงที่ ห้ามสุ่ม/ห้ามอิงเวลา — ม่านนี้ render ฝั่ง server ด้วย
  const serial = `${prefix}${edition}-P${numeral}`;

  // itemisation ของใบเสร็จ: ป้ายซ้าย · จุดไข่ปลา · ค่าชิดขวา
  const ROWS = [
    ["พรรค", name],
    ["หมายเลข", numeral],
    team ? ["ผู้สมัคร", `${team} คน`] : null,
    ["สถานะ", "ลงสมัครรับเลือกตั้ง"],
  ].filter(Boolean);

  return (
    <motion.div className="rc-intro" role="presentation" onClick={finish}
      initial={{ y: 0 }} animate={{ y: leaving ? "-101%" : 0 }}
      transition={{ duration: 0.6, ease: EASE_IO }}>
      <div className="rc-intro__machine">
        <span className="rc-intro__slot" aria-hidden="true" />

        {/* ใบเสร็จเลื่อนลงมาจากช่องพิมพ์ — ขอบล่างเป็นรอยปรุด้วย clip-path ไม่ใช่รูป */}
        <motion.div className="rc-intro__slip"
          initial={{ y: "-102%" }} animate={{ y: 0 }} transition={{ duration: 0.95, ease: EASE, delay: 0.1 }}>
          {/* ตราเรือสำเภาปั๊มจมลงในเนื้อกระดาษ (blind emboss) ไม่ใช่โลโก้ลอยอยู่บนแผ่น */}
          <span className="rc-intro__emboss" aria-hidden="true"><ReceiptShipMark strokeWidth={2.4} /></span>
          {/* หัวพิมพ์ความร้อนไล่ลงมา บรรทัดโผล่ใต้หัวพิมพ์ทีละบรรทัด */}
          <span className="rc-intro__head" aria-hidden="true" />

          <p className="rc-intro__brand rc-print" style={{ "--at": "0.95s" }}>
            {prefix} {edition} · FMS ELECTION
          </p>
          <span className="rc-intro__rule rc-intro__rule--double" aria-hidden="true" />
          <p className="rc-intro__doctype rc-print" style={{ "--at": "1.12s" }}>ใบแสดงรายการพรรค</p>

          <dl className="rc-intro__items">
            {ROWS.map(([label, value], i) => (
              <div key={label} className="rc-intro__row rc-print" style={{ "--at": `${1.3 + i * 0.14}s` }}>
                <dt>{label}</dt>
                <span className="rc-intro__leader" aria-hidden="true" />
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <span className="rc-intro__rule rc-intro__rule--dashed" aria-hidden="true" />

          <div className="rc-intro__stampline">
            {logo && <img className="rc-intro__logo" src={logo} alt="" />}
            <motion.span className="rc-intro__stamp"
              initial={{ scale: 1.5, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: -4 }}
              transition={{ delay: 1.95, duration: 0.34, ease: [0.34, 1.56, 0.64, 1] }}>
              {/* ghost = รอยปั๊มซ้อนที่จางหายไป เหมือนยกแท่นแล้วหมึกติดค้าง */}
              <span className="rc-intro__stamp-ghost" aria-hidden="true">{numeral}</span>
              <span className="rc-intro__stamp-kick">หมายเลข</span>
              <span className="rc-intro__stamp-no">{numeral}</span>
            </motion.span>
          </div>

          {party?.slogan && (
            <p className="rc-intro__slogan rc-print" style={{ "--at": "2.25s" }}>“{party.slogan}”</p>
          )}

          <span className="rc-intro__barcode rc-print" style={{ "--at": "2.45s" }} aria-hidden="true" />
          <p className="rc-intro__serial rc-print" style={{ "--at": "2.55s" }}>{serial}</p>

          <span className="rc-intro__perf" aria-hidden="true" />
          <p className="rc-intro__hint">แตะเพื่อเข้าสู่หน้าพรรค</p>
        </motion.div>
      </div>

      <style jsx global>{`
        .rc-intro { position:fixed; inset:0; z-index:9000; display:grid; place-items:center;
          padding:24px 20px; cursor:pointer; overflow:hidden;
          background:var(--rc-desk); color:var(--rc-ink); font-family:var(--rc-fr);
          background-image:radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--rc-desk-shade) 60%, transparent), transparent 72%); }

        .rc-intro__machine { position:relative; width:min(352px,88vw); padding-top:16px; }
        /* คานตัดกระดาษของเครื่องพิมพ์ — ใบเสร็จโผล่ออกมาจากใต้เส้นนี้ */
        .rc-intro__slot { position:absolute; top:0; left:-16px; right:-16px; height:13px; border-radius:3px;
          background:var(--rc-ink); box-shadow:0 12px 26px -14px color-mix(in srgb, var(--rc-ink) 75%, transparent); }
        .rc-intro__slot::after { content:""; position:absolute; left:10px; right:10px; bottom:2px; height:2px; border-radius:2px;
          background:color-mix(in srgb, var(--rc-receipt) 45%, transparent); }

        .rc-intro__slip { position:relative; padding:22px 20px 26px; text-align:center; overflow:hidden;
          background:var(--rc-receipt); border:1px solid var(--rc-line); border-top:0;
          box-shadow:0 28px 52px -30px color-mix(in srgb, var(--rc-ink) 65%, transparent);
          clip-path:polygon(0 0,100% 0,100% 98%,96% 100%,92% 98%,88% 100%,84% 98%,80% 100%,76% 98%,72% 100%,68% 98%,64% 100%,60% 98%,56% 100%,52% 98%,48% 100%,44% 98%,40% 100%,36% 98%,32% 100%,28% 98%,24% 100%,20% 98%,16% 100%,12% 98%,8% 100%,4% 98%,0 100%); }

        /* ตราปั๊มจม — ไม่มีสี มีแต่เงาอ่อน ๆ ให้รู้สึกว่ากดลงไปในเนื้อกระดาษ */
        .rc-intro__emboss { position:absolute; inset:auto 0 18% 0; margin:auto; width:58%; opacity:.07;
          color:var(--rc-ink); pointer-events:none; }
        .rc-intro__emboss svg { width:100%; height:auto; display:block; }

        /* หัวพิมพ์: แถบบางที่ไล่ลงตามบรรทัดที่กำลังพิมพ์
           ⚠️ ตัวที่ขยับคือกรอบเต็มความสูงใบเสร็จ ไม่ใช่ตัวแถบ เพราะ translateY เป็น %
           คิดจากความสูงของ element ตัวเอง — ถ้าขยับแถบหนา 2px มันจะเดินได้แค่ 2px
           และถ้า hardcode เป็น px ไว้ หัวพิมพ์จะค้างกลางใบบนจอที่ใบเสร็จสูงกว่า
           (มือถือใบสูง ~504px เดสก์ท็อป ~430px) */
        .rc-intro__head { position:absolute; inset:0; pointer-events:none;
          animation:rcIntroHead 1.75s cubic-bezier(.4,0,.5,1) .85s both; }
        .rc-intro__head::before { content:""; position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg, transparent, var(--rc-accent), transparent);
          box-shadow:0 0 18px 2px color-mix(in srgb, var(--rc-accent) 35%, transparent); }
        @keyframes rcIntroHead {
          0% { transform:translateY(2%); opacity:0; }
          12% { opacity:1; }
          88% { opacity:1; }
          100% { transform:translateY(100%); opacity:0; }
        }

        /* ทุกบรรทัดโผล่แบบ "พิมพ์" ซ้าย→ขวา เป็นสเต็ป ไม่ใช่ fade
           --at คือเวลาที่หัวพิมพ์ผ่านบรรทัดนั้นพอดี */
        .rc-print { animation:rcIntroPrint .3s steps(14) var(--at) both; }
        @keyframes rcIntroPrint { from { clip-path:inset(0 100% 0 0); } to { clip-path:inset(0 0 0 0); } }

        .rc-intro__brand { font-family:var(--rc-fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--rc-ink2); margin:0; }
        .rc-intro__rule { display:block; margin:11px 0; }
        .rc-intro__rule--double { height:3px; border-top:1px solid var(--rc-line); border-bottom:1px solid var(--rc-line); }
        .rc-intro__rule--dashed { border-top:1px dashed var(--rc-line); margin:14px 0 12px; }
        .rc-intro__doctype { font-family:var(--rc-fh); font-weight:700; font-size:15px; letter-spacing:.02em;
          margin:0 0 12px; color:var(--rc-ink); }

        /* itemisation: ป้าย · จุดไข่ปลา · ค่าชิดขวา — ภาษาของใบเสร็จจริง */
        .rc-intro__items { margin:0; text-align:left; }
        .rc-intro__row { display:flex; align-items:baseline; gap:7px; padding:3.5px 0; }
        .rc-intro__row dt { font-family:var(--rc-fm); font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-ink2); white-space:nowrap; }
        .rc-intro__leader { flex:1; border-bottom:1px dotted color-mix(in srgb, var(--rc-ink) 35%, transparent);
          transform:translateY(-3px); min-width:12px; }
        .rc-intro__row dd { margin:0; font-family:var(--rc-fh); font-weight:700; font-size:13.5px; color:var(--rc-ink);
          text-align:right; max-width:62%; }

        .rc-intro__stampline { display:flex; align-items:center; justify-content:center; gap:16px; margin:4px 0 2px; }
        .rc-intro__logo { width:44px; height:44px; object-fit:contain; display:block; }
        .rc-intro__stamp { position:relative; display:inline-flex; flex-direction:column; align-items:center; gap:1px;
          padding:8px 16px 10px; border:2.5px solid var(--rc-accent); border-radius:5px; color:var(--rc-accent);
          transform-origin:center; }
        .rc-intro__stamp-kick { font-family:var(--rc-fm); font-size:9px; letter-spacing:.24em; text-transform:uppercase; }
        .rc-intro__stamp-no { font-family:var(--rc-fm); font-weight:700; font-size:clamp(34px,9vw,46px); line-height:1; }
        .rc-intro__stamp-ghost { position:absolute; left:16px; top:14px; font-family:var(--rc-fm); font-weight:700;
          font-size:clamp(34px,9vw,46px); line-height:1; color:var(--rc-accent); pointer-events:none;
          animation:rcIntroGhost .85s ease-out 2.1s both; }
        @keyframes rcIntroGhost {
          from { opacity:.42; transform:translate(0,0) rotate(0deg) scale(1); }
          to { opacity:0; transform:translate(7px,-5px) rotate(7deg) scale(1.07); }
        }

        .rc-intro__slogan { font-family:var(--rc-fr); font-size:12.5px; line-height:1.5; color:var(--rc-ink2);
          margin:12px auto 0; max-width:30ch; }

        /* บาร์โค้ดเป็น gradient ล้วน ไม่ใช่รูป — ความถี่ไม่สม่ำเสมอเหมือนของจริง */
        .rc-intro__barcode { display:block; height:34px; margin:14px 0 6px;
          background-image:repeating-linear-gradient(90deg,
            var(--rc-ink) 0 2px, transparent 2px 5px,
            var(--rc-ink) 5px 6px, transparent 6px 8px,
            var(--rc-ink) 8px 11px, transparent 11px 13px,
            var(--rc-ink) 13px 14px, transparent 14px 18px); }
        .rc-intro__serial { font-family:var(--rc-fm); font-size:10px; letter-spacing:.26em; color:var(--rc-ink2); margin:0; }

        /* รอยปรุ + สัญลักษณ์กรรไกร ปิดท้ายใบเสร็จ */
        .rc-intro__perf { display:block; position:relative; margin:16px -20px 12px;
          border-top:1px dashed color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-intro__perf::before { content:"✂"; position:absolute; left:14px; top:-9px; font-size:12px;
          line-height:1; color:var(--rc-ink2); background:var(--rc-receipt); padding:0 4px; }
        .rc-intro__hint { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--rc-ink2); margin:0; animation:rcIntroBlink 2s ease-in-out 2.7s infinite; }
        @keyframes rcIntroBlink { 0%,100% { opacity:1; } 55% { opacity:.42; } }

        @media (max-width:380px) {
          .rc-intro__slip { padding:20px 16px 24px; }
          .rc-intro__stampline { gap:12px; }
          .rc-intro__logo { width:38px; height:38px; }
        }
      `}</style>
    </motion.div>
  );
}
