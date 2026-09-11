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
// Choreography, in the family's own language (a printer on a desk): the slot's
// cutter bar sits on the desk → the slip feeds DOWN out of it, thermal-printed →
// the header line types on → the party numeral lands as an ink stamp → name and
// slogan print → the slip (and the desk with it) lifts away into the booth.
//
// Colours are var(--rc-*) from ReceiptBaseStyles on .rc-root. Motion is
// transform/opacity only; the perforated bottom edge is a clip-path, not an image.
//
// reduced motion: ทั้ง family เล่นม่านนี้เสมอ เป็นการตัดสินใจเชิงผลิตภัณฑ์เดียวกับ
// GumroadPartyIntro (ดูคอมเมนต์ `const reduce = false` ในไฟล์นั้น) — ม่านกินเวลา
// ไม่ถึง 4 วินาที ข้ามได้ด้วยการแตะ/Esc และเนื้อหาข้างล่างมองเห็นครบอยู่แล้วโดยไม่ต้องรอ

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getPath } from "../../utils/basePath";

const EASE = [0.16, 1, 0.3, 1];
const EASE_IO = [0.76, 0, 0.24, 1];

export default function ReceiptPartyIntro({ party = {}, onDone = () => {}, durationMs = 3400 }) {
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

  return (
    <motion.div className="rc-intro" role="presentation" onClick={finish}
      initial={{ y: 0 }} animate={{ y: leaving ? "-101%" : 0 }}
      transition={{ duration: 0.6, ease: EASE_IO }}>
      <div className="rc-intro__machine">
        <span className="rc-intro__slot" aria-hidden="true" />
        {/* ใบเสร็จเลื่อนลงมาจากช่องพิมพ์ — ขอบล่างเป็นรอยปรุด้วย clip-path ไม่ใช่รูป */}
        <motion.div className="rc-intro__slip"
          initial={{ y: "-102%" }} animate={{ y: 0 }} transition={{ duration: 1.05, ease: EASE, delay: 0.12 }}>
          <motion.p className="rc-intro__meta"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.72, duration: 0.3 }}>
            FMS ELECTION · PARTY SLIP
          </motion.p>
          <span className="rc-intro__hr" aria-hidden="true" />

          <motion.div className="rc-intro__stamp"
            initial={{ scale: 1.45, opacity: 0, rotate: -9 }} animate={{ scale: 1, opacity: 1, rotate: -2.5 }}
            transition={{ delay: 0.98, duration: 0.36, ease: [0.34, 1.56, 0.64, 1] }}>
            <span className="rc-intro__stamp-kick">หมายเลข</span>
            <span className="rc-intro__stamp-no">{hasNo ? String(no).padStart(2, "0") : "—"}</span>
          </motion.div>

          {logo && (
            <motion.img className="rc-intro__logo" src={logo} alt=""
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.18, duration: 0.4 }} />
          )}

          <motion.h2 className="rc-intro__name"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.26, duration: 0.55, ease: EASE }}>
            {name}
          </motion.h2>

          {party?.slogan && (
            <motion.p className="rc-intro__slogan"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.42, duration: 0.5, ease: EASE }}>
              {party.slogan}
            </motion.p>
          )}

          <span className="rc-intro__hr rc-intro__hr--dashed" aria-hidden="true" />
          <motion.p className="rc-intro__hint"
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0.45, 1] }}
            transition={{ delay: 1.6, duration: 2, repeat: Infinity, repeatDelay: 0.2 }}>
            แตะเพื่อเข้าสู่หน้าพรรค
          </motion.p>
        </motion.div>
      </div>

      <style jsx global>{`
        .rc-intro { position:fixed; inset:0; z-index:9000; display:grid; place-items:center;
          padding:28px 20px; cursor:pointer; overflow:hidden;
          background:var(--rc-desk); color:var(--rc-ink); font-family:var(--rc-fr);
          background-image:radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--rc-desk-shade) 55%, transparent), transparent 70%); }

        .rc-intro__machine { position:relative; width:min(340px,86vw); padding-top:16px; }
        /* คานตัดกระดาษของเครื่องพิมพ์ — ใบเสร็จโผล่ออกมาจากใต้เส้นนี้ */
        .rc-intro__slot { position:absolute; top:0; left:-14px; right:-14px; height:12px; border-radius:3px;
          background:var(--rc-ink); box-shadow:0 10px 24px -14px color-mix(in srgb, var(--rc-ink) 70%, transparent); }
        .rc-intro__slip { position:relative; padding:26px 22px 30px; text-align:center;
          background:var(--rc-receipt); border:1px solid var(--rc-line); border-top:0;
          box-shadow:0 26px 48px -30px color-mix(in srgb, var(--rc-ink) 60%, transparent);
          clip-path:polygon(0 0,100% 0,100% 97%,96% 100%,92% 97%,88% 100%,84% 97%,80% 100%,76% 97%,72% 100%,68% 97%,64% 100%,60% 97%,56% 100%,52% 97%,48% 100%,44% 97%,40% 100%,36% 97%,32% 100%,28% 97%,24% 100%,20% 97%,16% 100%,12% 97%,8% 100%,4% 97%,0 100%); }

        .rc-intro__meta { font-family:var(--rc-fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--rc-ink2); margin:0; }
        .rc-intro__hr { display:block; height:1px; background:var(--rc-line); margin:14px 0; }
        .rc-intro__hr--dashed { height:0; border-top:1px dashed var(--rc-line); background:none; margin:18px 0 14px; }

        .rc-intro__stamp { display:inline-flex; flex-direction:column; align-items:center; gap:2px;
          padding:10px 20px 12px; border:2.5px solid var(--rc-accent); border-radius:6px;
          color:var(--rc-accent); transform-origin:center; }
        .rc-intro__stamp-kick { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.24em; text-transform:uppercase; }
        .rc-intro__stamp-no { font-family:var(--rc-fm); font-weight:700; font-size:clamp(40px,11vw,58px); line-height:1; }

        .rc-intro__logo { display:block; width:46px; height:46px; object-fit:contain; margin:16px auto 0; }
        .rc-intro__name { font-family:var(--rc-fh); font-weight:700; font-size:clamp(20px,5.2vw,28px); line-height:1.3;
          margin:16px 0 0; color:var(--rc-ink); }
        .rc-intro__slogan { font-family:var(--rc-fr); font-size:13px; line-height:1.5; color:var(--rc-ink2);
          margin:8px auto 0; max-width:30ch; }
        .rc-intro__hint { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--rc-ink2); margin:0; }
      `}</style>
    </motion.div>
  );
}
