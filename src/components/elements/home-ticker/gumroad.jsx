"use client";

// home-ticker · variant "gumroad" — the scrolling ink marquee under the navbar on
// the home page. Library element (Lego brick): self-contained, --tick-* vars →
// gumroad identity. The marquee copy is data (props), not hardcoded.

function Dot() {
  return <span className="gtick__dot" />;
}

export default function HomeTickerGumroad({
  faculty = "FMS",
  calendarYear = "",
  samoPrefix = "SAMO",
  samoNumber = "",
  org = "",
  partyCount = 0,
  uni = "PSU",
}) {
  return (
    <div className="gtick" data-element="home-ticker" data-variant="gumroad">
      <div className="gtick__track">
        {[0, 1].map((k) => (
          <span key={k} className="gtick__item">
            ★ {faculty} ELECTION {calendarYear} <Dot /> {samoPrefix} {samoNumber} <Dot /> CAST YOUR VOTE <Dot /> {org} <Dot /> {partyCount} {partyCount === 1 ? "PARTY" : "PARTIES"} RUNNING <Dot /> POWERED BY {uni} PASSPORT <Dot />
          </span>
        ))}
      </div>
      <style jsx global>{`
        .gtick{
          border-bottom:2.5px solid var(--tick-border, #26271c);
          background:var(--tick-bg, #26271c); color:var(--tick-text, #FFF6EC);
          overflow:hidden; white-space:nowrap;
          font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          font-size:22px; letter-spacing:.02em;
        }
        .gtick__track{ display:inline-flex; align-items:center; gap:32px; padding:12px 0; animation:gtickMove 35s linear infinite; }
        .gtick__item{ display:inline-flex; align-items:center; gap:32px; }
        @keyframes gtickMove{ 0%{ transform:translateX(0); } 100%{ transform:translateX(-50%); } }
        .gtick__dot{ width:12px; height:12px; background:var(--tick-accent, #FF9CE9); border-radius:999px; display:inline-block; }
        @media (max-width:980px){ .gtick{ font-size:18px; } }
      `}</style>
    </div>
  );
}
