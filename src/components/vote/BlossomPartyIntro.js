"use client";

// BlossomPartyIntro — cinematic "single-party presentation" opener for the
// Blossom Civic / Candy Editorial family (BlossomSingleParty mounts it).
//
// Same contract as GumroadPartyIntro / StudioDarkPartyIntro / FmsOfficialPartyIntro:
//   <BlossomPartyIntro party={party} onDone={fn} durationMs? />
//   - an OVERLAY on already-rendered content; it never gates the ballot. No JS,
//     no motion, editor preview → the booth underneath is complete on its own.
//   - auto-dismisses after durationMs, or on click / Esc, calling onDone exactly once
//   - the parent flips `introDone` on onDone, which adds .is-live to the root so the
//     booth's own entrance choreography plays AFTER this lifts, not behind it
//
// Choreography: the canvas breathes in with the family's dot grid → six petals
// unfurl one by one around the party medallion (logo, or the numeral) → the
// hairline rule draws → party name rises in the family's two-tone display → slogan
// and the tap hint follow → the whole panel wipes up into the booth.
//
// Every colour comes from var(--bl-*) emitted by BlossomBaseStyles on .bl-root, so
// the intro re-themes with the rest of the family. Motion is transform/opacity only.
//
// reduced motion: ทั้ง family เล่นม่านนี้เสมอ เป็นการตัดสินใจเชิงผลิตภัณฑ์เดียวกับ
// GumroadPartyIntro (ดูคอมเมนต์ `const reduce = false` ในไฟล์นั้น) — ม่านกินเวลา
// ไม่ถึง 4 วินาที ข้ามได้ด้วยการแตะ/Esc และเนื้อหาข้างล่างมองเห็นครบอยู่แล้วโดยไม่ต้องรอ

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getPath } from "../../utils/basePath";

const EASE = [0.16, 1, 0.3, 1];
const EASE_IO = [0.76, 0, 0.24, 1];
const PETALS = [0, 60, 120, 180, 240, 300];

export default function BlossomPartyIntro({ party = {}, onDone = () => {}, durationMs = 3400 }) {
  const calledRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    setLeaving(true);
    setTimeout(onDone, 620); // let the wipe-up play out
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
  // the family's signature: the display word carries two tones, one word per tone
  const words = name.split(/\s+/);
  const head = words.length > 1 ? words.slice(0, -1).join(" ") : name;
  const tail = words.length > 1 ? words[words.length - 1] : "";

  return (
    <motion.div className="bl-intro" role="presentation" onClick={finish}
      initial={{ y: 0 }} animate={{ y: leaving ? "-101%" : 0 }}
      transition={{ duration: 0.6, ease: EASE_IO }}>
      <span className="bl-intro__grid" aria-hidden="true" />
      <motion.span className="bl-intro__blob bl-intro__blob--1" aria-hidden="true"
        animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <motion.span className="bl-intro__blob bl-intro__blob--2" aria-hidden="true"
        animate={{ y: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />

      <div className="bl-intro__stage">
        <motion.p className="bl-intro__eyebrow"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: EASE }}>
          พรรคเดียวที่ลงสมัคร{hasNo ? ` · หมายเลข ${no}` : ""}
        </motion.p>

        {/* ดอกไม้คลี่รอบตราพรรค — กลีบละจังหวะ ไม่พร้อมกัน ให้รู้สึกว่ามันค่อย ๆ บาน */}
        <div className="bl-intro__bloom" aria-hidden="true">
          {PETALS.map((angle, i) => (
            <span key={angle} className="bl-intro__petalwrap" style={{ transform: `rotate(${angle}deg)` }}>
              <motion.span className={`bl-intro__petal${i % 2 ? " bl-intro__petal--alt" : ""}`}
                initial={{ scaleY: 0.1, scaleX: 0.5, opacity: 0 }}
                animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.72, ease: EASE }} />
            </span>
          ))}
          <motion.span className="bl-intro__medallion"
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.52, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}>
            {logo
              ? <img src={logo} alt="" className="bl-intro__logo" />
              : <em className="bl-intro__no">{hasNo ? no : "—"}</em>}
          </motion.span>
        </div>

        <motion.span className="bl-intro__rule"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.92, duration: 0.55, ease: EASE }} />

        <motion.h2 className="bl-intro__name"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.04, duration: 0.62, ease: EASE }}>
          {head}{tail && <> <em>{tail}</em></>}
        </motion.h2>

        {party?.slogan && (
          <motion.p className="bl-intro__slogan"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.22, duration: 0.6, ease: EASE }}>
            “{party.slogan}”
          </motion.p>
        )}

        <motion.p className="bl-intro__hint"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0.5, 1] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity, repeatDelay: 0.2 }}>
          แตะเพื่อเข้าสู่หน้าพรรค
        </motion.p>
      </div>

      <style jsx global>{`
        .bl-intro { position:fixed; inset:0; z-index:9000; display:grid; place-items:center;
          padding:32px 24px; text-align:center; cursor:pointer; overflow:hidden;
          background:var(--bl-canvas); color:var(--bl-ink); font-family:var(--bl-fb); }
        .bl-intro__grid { position:absolute; inset:0; pointer-events:none; opacity:.5;
          background-image:radial-gradient(circle, color-mix(in srgb, var(--bl-ink) 8%, transparent) 1px, transparent 1px);
          background-size:28px 28px; }
        .bl-intro__blob { position:absolute; border-radius:50%; filter:blur(60px); pointer-events:none; }
        .bl-intro__blob--1 { width:min(46vw,420px); aspect-ratio:1; top:-12%; right:-8%;
          background:color-mix(in srgb, var(--bl-primary) 26%, transparent); }
        .bl-intro__blob--2 { width:min(38vw,340px); aspect-ratio:1; bottom:-14%; left:-6%;
          background:color-mix(in srgb, var(--bl-sup1) 30%, transparent); }

        .bl-intro__stage { position:relative; display:flex; flex-direction:column; align-items:center;
          max-width:640px; width:100%; }
        .bl-intro__eyebrow { font-family:var(--bl-fm); font-size:11px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--bl-primary-ink); margin:0 0 28px; }

        .bl-intro__bloom { position:relative; width:clamp(170px,30vw,224px); aspect-ratio:1; }
        .bl-intro__petalwrap { position:absolute; inset:0; }
        /* กลีบยาวเลยขอบตราออกไป ดอกจึงใหญ่กว่าตรา ไม่ใช่กลีบเล็ก ๆ เกาะอยู่รอบ ๆ */
        .bl-intro__petal { position:absolute; left:31%; top:-9%; width:38%; height:62%;
          border-radius:50% 50% 46% 46%; transform-origin:50% 92%; display:block;
          background:var(--bl-primary); }
        /* สองโทนของสีเดียวกัน = ดอกเดียวที่มีมิติ ถ้าสลับไปหาสีสนับสนุน (มิ้นต์/ฟ้า)
           มันจะอ่านเป็นดอกไม้สองดอกซ้อนกันมากกว่าดอกเดียว */
        .bl-intro__petal--alt { background:var(--bl-primary-deep); }
        .bl-intro__medallion { position:absolute; inset:26%; border-radius:50%; display:grid; place-items:center;
          background:var(--bl-card); border:1.5px solid var(--bl-ink); overflow:hidden; padding:12px; }
        .bl-intro__logo { width:100%; height:100%; object-fit:contain; display:block; }
        .bl-intro__no { font-family:var(--bl-fd); font-style:normal; font-weight:700; font-size:clamp(34px,6vw,52px);
          line-height:1; color:var(--bl-ink); }

        .bl-intro__rule { display:block; width:min(220px,52%); height:1.5px; background:var(--bl-ink);
          transform-origin:center; margin:30px 0 22px; opacity:.75; }
        .bl-intro__name { font-family:var(--bl-fd); font-weight:700; font-size:clamp(30px,6.4vw,60px);
          line-height:1.18; letter-spacing:-.01em; margin:0; max-width:16ch; color:var(--bl-ink); }
        .bl-intro__name em { font-style:normal; color:var(--bl-primary-ink); }
        .bl-intro__slogan { font-family:var(--bl-fb); font-size:clamp(14px,1.8vw,18px); line-height:1.55;
          color:var(--bl-ink2); margin:16px auto 0; max-width:42ch; }
        .bl-intro__hint { font-family:var(--bl-fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--bl-ink2); margin:34px 0 0; }

        @media (max-width:520px) {
          .bl-intro__rule { margin:24px 0 18px; }
          .bl-intro__hint { margin-top:26px; }
        }
      `}</style>
    </motion.div>
  );
}
