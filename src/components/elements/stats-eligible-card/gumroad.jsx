"use client";

// stats-eligible-card · variant "gumroad" — the lime "ELIGIBLE" stat tile (total
// eligible voters) with the turnout progress bar. Library element; host owns the
// grid-area. Shares the .gh-stat base (kept self-contained here too).

export default function StatsEligibleGumroad({ eligible = 0, pct = "0.00" }) {
  const width = Math.max(2, Math.min(100, parseFloat(pct) || 0));
  return (
    <div className="gh-stat gh-stat--lime" data-element="stats-eligible-card" data-variant="gumroad">
      <div className="gh-stat__lbl">ผู้มีสิทธิ์รวม · ELIGIBLE</div>
      <div className="gh-stat__val">{Number(eligible).toLocaleString()}<span className="gh-stat__unit">คน</span></div>
      <div className="gh-stat__foot">
        <div className="gh-stat__sub">ความคืบหน้า · {pct}%</div>
        <div className="gh-stat__bar"><span style={{ width: `${width}%` }} /></div>
      </div>
      <style jsx global>{`
        .gh-stat{ position:relative; overflow:hidden; height:100%; display:flex; flex-direction:column; justify-content:space-between; gap:10px;
          border:2.5px solid var(--stat-border, var(--ink, #26271c)); border-radius:22px; padding:clamp(20px,2.2cqw,30px); box-shadow:5px 5px 0 var(--stat-border, var(--ink, #26271c)); }
        .gh-stat--lime{ background:var(--stat-bg-2, var(--lime, #C2F47E)); }
        .gh-stat__foot{ position:relative; z-index:1; display:flex; flex-direction:column; gap:8px; }
        .gh-stat__bar{ height:15px; background:var(--paper, #FFFDFA); border:2.5px solid var(--ink, #26271c); border-radius:999px; overflow:hidden; }
        .gh-stat__bar > span{ display:block; height:100%; min-width:8px; background:var(--ink, #26271c); border-radius:999px 0 0 999px; transition:width .8s cubic-bezier(.2,.8,.2,1); }
      `}</style>
    </div>
  );
}
