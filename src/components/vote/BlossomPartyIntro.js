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
// Choreography: petals are ALREADY drifting down the canvas when the curtain
// appears → the party medallion settles in under a soft halo → the hairline rule
// draws → the name rises in the family's two-tone display → slogan and the tap
// hint follow → the whole panel wipes up into the booth.
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

// กลีบที่ร่วงอยู่ — ตารางค่าคงที่ ไม่ใช่ Math.random()
//
// ม่านนี้ถูก render ฝั่ง server ด้วย (introDone เริ่มที่ false) ถ้าสุ่มค่าตอน render
// markup สองฝั่งจะไม่ตรงกันแล้ว hydration พัง ตารางนี้จึงเขียนมือไว้เลย
//   x     ตำแหน่งแนวนอน (%)
//   w     ความกว้างกลีบ (px)
//   dur   เวลาร่วงหนึ่งรอบ (s) — กลีบเล็กร่วงช้ากว่า ให้รู้สึกว่ามันอยู่ไกลออกไป
//   delay **ติดลบ** เพื่อให้กลีบค้างอยู่กลางทางตั้งแต่เฟรมแรก ไม่ใช่เริ่มโปรยพร้อมกัน
//         ตอนม่านขึ้น (ม่านอยู่แค่ ~3.4s ถ้าเริ่มที่ 0 ทุกใบ ครึ่งแรกจอจะว่าง)
//   sway  ระยะแกว่งซ้ายขวา (px) · spin องศาที่หมุนต่อรอบ · tone เฉดของกลีบ (0-2)
const FALLING = [
  { x: 4, w: 16, dur: 9.5, delay: -6.2, sway: 26, spin: 220, tone: 0 },
  { x: 12, w: 11, dur: 12.0, delay: -2.4, sway: 18, spin: -180, tone: 2 },
  { x: 19, w: 20, dur: 8.2, delay: -4.8, sway: 34, spin: 260, tone: 1 },
  { x: 27, w: 13, dur: 11.0, delay: -8.6, sway: 22, spin: -200, tone: 0 },
  { x: 34, w: 9, dur: 13.5, delay: -1.2, sway: 16, spin: 300, tone: 2 },
  { x: 41, w: 18, dur: 9.0, delay: -5.5, sway: 30, spin: -240, tone: 0 },
  { x: 48, w: 12, dur: 12.6, delay: -9.4, sway: 20, spin: 190, tone: 1 },
  { x: 56, w: 15, dur: 10.2, delay: -3.1, sway: 28, spin: -210, tone: 0 },
  { x: 63, w: 10, dur: 13.0, delay: -7.3, sway: 15, spin: 280, tone: 2 },
  { x: 70, w: 19, dur: 8.6, delay: -2.0, sway: 32, spin: 230, tone: 1 },
  { x: 77, w: 12, dur: 11.5, delay: -10.1, sway: 21, spin: -260, tone: 0 },
  { x: 84, w: 14, dur: 9.8, delay: -4.2, sway: 25, spin: 200, tone: 2 },
  { x: 90, w: 17, dur: 10.8, delay: -6.9, sway: 29, spin: -190, tone: 0 },
  { x: 96, w: 10, dur: 12.2, delay: -1.7, sway: 17, spin: 250, tone: 1 },
  { x: 8, w: 13, dur: 10.6, delay: -0.6, sway: 24, spin: -230, tone: 1 },
  { x: 31, w: 15, dur: 9.2, delay: -11.3, sway: 27, spin: 210, tone: 0 },
  { x: 52, w: 17, dur: 11.8, delay: -5.9, sway: 31, spin: -220, tone: 0 },
  { x: 74, w: 11, dur: 12.8, delay: -8.0, sway: 19, spin: 270, tone: 2 },
];

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

      {/* กลีบร่วง — ซ้อนสามชั้นเพราะแต่ละชั้นกิน transform คนละแบบ: ชั้นนอกร่วงลง
          (linear) ชั้นกลางแกว่งซ้ายขวา (ease-in-out สลับไปกลับ) ชั้นในหมุนรอบตัวเอง
          ถ้ายัดสามอย่างไว้ที่ element เดียว animation ตัวหลังจะทับ transform ตัวหน้า */}
      <div className="bl-intro__fall" aria-hidden="true">
        {FALLING.map((p, i) => (
          <span key={i} className="bl-intro__fp"
            style={{ left: `${p.x}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}>
            <span className="bl-intro__fp-sway"
              style={{ "--sway": `${p.sway}px`, animationDuration: `${(p.dur / 3).toFixed(2)}s`, animationDelay: `${p.delay}s` }}>
              <span className={`bl-intro__fp-petal bl-intro__fp-petal--${p.tone}`}
                style={{ width: `${p.w}px`, "--spin": `${p.spin}deg`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
            </span>
          </span>
        ))}
      </div>

      <div className="bl-intro__stage">
        <motion.p className="bl-intro__eyebrow"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: EASE }}>
          พรรคเดียวที่ลงสมัคร{hasNo ? ` · หมายเลข ${no}` : ""}
        </motion.p>

        <motion.div className="bl-intro__medallion"
          initial={{ scale: 0.72, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.24, duration: 0.62, ease: [0.34, 1.56, 0.64, 1] }}>
          <span className="bl-intro__halo" aria-hidden="true" />
          {logo
            ? <img src={logo} alt="" className="bl-intro__logo" />
            : <em className="bl-intro__no">{hasNo ? no : "—"}</em>}
        </motion.div>

        <motion.span className="bl-intro__rule"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.72, duration: 0.55, ease: EASE }} />

        <motion.h2 className="bl-intro__name"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.86, duration: 0.62, ease: EASE }}>
          {head}{tail && <> <em>{tail}</em></>}
        </motion.h2>

        {party?.slogan && (
          <motion.p className="bl-intro__slogan"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.04, duration: 0.6, ease: EASE }}>
            “{party.slogan}”
          </motion.p>
        )}

        <motion.p className="bl-intro__hint"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0.5, 1] }}
          transition={{ delay: 1.34, duration: 2, repeat: Infinity, repeatDelay: 0.2 }}>
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

        /* ── กลีบร่วง ───────────────────────────────────────────────────────── */
        .bl-intro__fall { position:absolute; inset:0; overflow:hidden; pointer-events:none; }
        .bl-intro__fp { position:absolute; top:0; will-change:transform;
          animation-name:blFallY; animation-timing-function:linear; animation-iteration-count:infinite; }
        .bl-intro__fp-sway { display:block;
          animation-name:blFallX; animation-timing-function:ease-in-out;
          animation-iteration-count:infinite; animation-direction:alternate; }
        /* กลีบทรงหยดน้ำ ปลายแหลมมุมเดียว ไม่ใช่วงรี */
        .bl-intro__fp-petal { display:block; aspect-ratio:1/1.18; background:var(--bl-primary);
          border-radius:100% 8% 100% 100%;
          animation-name:blFallSpin; animation-timing-function:linear; animation-iteration-count:infinite; }
        .bl-intro__fp-petal--1 { background:var(--bl-primary-deep); }
        .bl-intro__fp-petal--2 { background:color-mix(in srgb, var(--bl-primary) 62%, var(--bl-card)); }
        @keyframes blFallY {
          0%   { transform:translate3d(0,-14vh,0); opacity:0; }
          9%   { opacity:.9; }
          86%  { opacity:.75; }
          100% { transform:translate3d(0,112vh,0); opacity:0; }
        }
        @keyframes blFallX {
          from { transform:translate3d(calc(var(--sway) * -1),0,0); }
          to   { transform:translate3d(var(--sway),0,0); }
        }
        @keyframes blFallSpin { from { transform:rotate(0deg); } to { transform:rotate(var(--spin)); } }

        .bl-intro__stage { position:relative; display:flex; flex-direction:column; align-items:center;
          max-width:640px; width:100%; }
        .bl-intro__eyebrow { font-family:var(--bl-fm); font-size:11px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--bl-primary-ink); margin:0 0 30px; }

        .bl-intro__medallion { position:relative; width:clamp(116px,20vw,150px); aspect-ratio:1; border-radius:50%;
          display:grid; place-items:center; background:var(--bl-card); border:1.5px solid var(--bl-ink);
          padding:18px; }
        .bl-intro__halo { position:absolute; inset:-22px; border-radius:50%; pointer-events:none;
          background:radial-gradient(circle, color-mix(in srgb, var(--bl-primary) 30%, transparent) 0%, transparent 66%); }
        .bl-intro__logo { position:relative; width:100%; height:100%; object-fit:contain; display:block; }
        .bl-intro__no { position:relative; font-family:var(--bl-fd); font-style:normal; font-weight:700;
          font-size:clamp(34px,6vw,52px); line-height:1; color:var(--bl-ink); }

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
