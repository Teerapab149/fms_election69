"use client";

// hero-title · variant "gumroad" — the huge SAMO display title with the pink
// offset "number" stamp box. Library element; the host layout resolves the text
// (binding + editor config) and passes titlePart/numberPart/style as props.

export default function HeroTitleGumroad({ titlePart = "", numberPart = "", style }) {
  return (
    <div className="gh-title__fit">
      <h1 className="gh-title" data-element="hero-title" data-variant="gumroad" style={style}>
        {titlePart}
        {numberPart && <><br /><em>{numberPart}</em></>}
      </h1>
      <style jsx global>{`
        /* Container so the title sizes to its OWN tile, not the whole page — fixes
           the SAMO/long-name overflow when the hero sits in the narrow mosaic
           column (13cqw was page-relative → too big for a ~1.6/3.6-width tile). */
        /* width:100% so the container spans the tile even when the hero is
           align-items:center (tablet/phone) — otherwise it shrinks to content
           width and cqi collapses (title would overflow at ≤900). */
        .gh-title__fit{ container-type:inline-size; width:100%; }
        .gh-title{ font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          font-size:clamp(42px, 29cqi, 128px); line-height:.82; letter-spacing:-.045em; color:var(--title-color, #26271c); margin:0;
          text-transform:uppercase; max-width:100%; overflow-wrap:anywhere; }
        .gh-title em{ font-style:normal; font-size:1.15em; background:var(--title-accent, #FF9CE9); display:inline-block; padding:0 14px; margin:10px 0 0;
          border:2.5px solid #26271c; box-shadow:8px 8px 0 #26271c; max-width:100%; }
      `}</style>
    </div>
  );
}
