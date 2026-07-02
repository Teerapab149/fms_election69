"use client";

// candidates-head · variant "gumroad" — the candidates/party-listing page header.
// Its OWN identity (NOT the home pink-box stamp): a small lead word + a huge
// "ผู้สมัคร" with a hard pink offset echo + a sparkle, floated over chunky pastel
// confetti. Library element (Lego brick): self-contained scoped CSS, exposes
// --ch-* vars → ละมุน gumroad literals. Copy + the live party count are data (props).

export default function CandidatesHeadGumroad({
  lead = "ทำความรู้จัก",
  big = "ผู้สมัคร",
  count = 0,
  unit = "พรรค",
  subtitleLead = "ปีนี้มี",
  subtitleTail = "ให้ทำความรู้จัก",
  subtitleLine = "เลือกคนที่ใช่ ดูวิสัยทัศน์และนโยบายก่อนตัดสินใจลงคะแนน",
}) {
  return (
    <div className="gc-head" data-element="candidates-head" data-variant="gumroad">
      {/* chunky pastel confetti — gumroad energy (straight, soft, behind text) */}
      <span className="gc-deco gc-deco--sq" aria-hidden="true" />
      <span className="gc-deco gc-deco--dot" aria-hidden="true" />
      <span className="gc-deco gc-deco--ring" aria-hidden="true" />
      <span className="gc-deco gc-deco--star" aria-hidden="true">★</span>
      <span className="gc-deco gc-deco--plus" aria-hidden="true">✦</span>
      <h1 className="gc-title">
        <span className="gc-title__lead">{lead}</span>
        <span className="gc-title__big">{big}<i className="gc-title__star">✦</i></span>
      </h1>
      <p className="gc-subtitle">
        {subtitleLead} <span className="gc-hl">{count} {unit}</span> {subtitleTail}
        <span className="gc-subtitle__line">{subtitleLine}</span>
      </p>

      <style jsx global>{`
        .gc-head{ position:relative; text-align:center; max-width:760px; margin:0 auto 48px; padding-top:8px;
          --ch-ink:var(--ink, #26271c); --ch-ink2:var(--ink2, #5c5a4b); --ch-accent:var(--pink, #FF9CE9);
          --ch-lime:var(--lime, #C2F47E); --ch-sky:var(--sky, #B6E6FF); --ch-coral:var(--coral, #FF8A8A);
          --ch-fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif; }
        .gc-title, .gc-subtitle{ position:relative; z-index:1; }
        /* confetti decorations — chunky pop shapes (ink border + hard shadow), straight */
        .gc-deco{ position:absolute; z-index:0; pointer-events:none; line-height:1; }
        .gc-deco--sq{ width:34px; height:34px; background:var(--ch-lime); border:2.5px solid var(--ch-ink); border-radius:10px; box-shadow:3px 3px 0 var(--ch-ink); top:2%; left:5%; }
        .gc-deco--dot{ width:26px; height:26px; background:var(--ch-sky); border:2.5px solid var(--ch-ink); border-radius:50%; box-shadow:3px 3px 0 var(--ch-ink); top:-2%; right:6%; }
        .gc-deco--ring{ width:30px; height:30px; background:transparent; border:6px solid var(--ch-coral); border-radius:50%; bottom:6%; left:7%; }
        .gc-deco--star{ font-size:26px; color:var(--ch-accent); top:0; right:23%; }
        .gc-deco--plus{ font-size:20px; color:var(--ch-sky); bottom:10%; right:8%; }
        /* candidates headline — its OWN identity (NOT the home pink-box stamp):
           small lead word + huge "ผู้สมัคร" with a hard pink offset echo + sparkle */
        .gc-title{ font-family:var(--ch-fd); margin:0; line-height:1; text-transform:uppercase; letter-spacing:-.03em; }
        .gc-title__lead{ display:block; font-size:clamp(22px,3.6cqw,40px); line-height:1; color:var(--ch-ink2); letter-spacing:-.01em; }
        .gc-title__big{ position:relative; display:inline-block; margin-top:clamp(4px,1.2cqw,12px); font-size:clamp(58px,11.5cqw,128px); line-height:.9;
          color:var(--ch-ink); text-shadow:0.06em 0.06em 0 var(--ch-accent); }
        .gc-title__star{ position:absolute; top:-.16em; right:-.42em; font-style:normal; font-size:.36em; color:var(--ch-accent); text-shadow:none; }
        .gc-subtitle{ margin:20px auto 0; font-size:clamp(16px,2.1cqw,21px); font-weight:600; line-height:1.5; color:var(--ch-ink); max-width:520px; text-wrap:balance; }
        /* the count gets the SAME pink offset-echo as the headline (no line, no box) —
           a mini echo so the count reads as part of the same family, cohesive. */
        .gc-subtitle .gc-hl{ font-weight:900; color:var(--ch-ink); font-size:1.12em; letter-spacing:-.01em;
          text-shadow:0.045em 0.045em 0 var(--ch-accent); }
        .gc-subtitle__line{ display:block; margin-top:11px; font-size:clamp(13px,1.7cqw,15px); font-weight:500; color:var(--ch-ink2); }
      `}</style>
    </div>
  );
}
