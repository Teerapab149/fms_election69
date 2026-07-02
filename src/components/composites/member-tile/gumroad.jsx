"use client";

// member-tile · composite (Layer 2) · variant "gumroad"
//
// One committee-member tile in the party page grid: square photo + name + role.
// Composed from Layer-1 atoms (image · text-title · text-meta) via <Composition>.
// The composite owns its frame (.el-member*) and TUNES the atoms for this context
// via scoped class overrides (.el-member .el-title etc.) — no inline-style hacks.
// Clicking opens the member modal (onClick passed through).

import Composition from "../../elements/_composer/Composition";

export function buildMemberTile(member, photo, index, onClick) {
  const ph = photo || null; // host pre-resolves the src
  return {
    kind: "frame", as: "button", className: "el-member",
    attrs: { type: "button", onClick },
    children: [
      {
        kind: "frame", className: "el-member__photo",
        children: [
          { kind: "atom", type: "image", props: { src: ph, alt: member?.name || "", fit: "cover", empty: !ph, emptyContent: `#${String(index + 1).padStart(2, "0")}` }, style: ph ? { position: "absolute", inset: 0 } : undefined },
        ],
      },
      { kind: "atom", type: "text-title", props: { children: member?.name } },
      member?.position ? { kind: "atom", type: "text-meta", props: { children: member.position } } : null,
    ].filter(Boolean),
  };
}

export default function MemberTileGumroad({ member, photo, index = 0, onClick }) {
  return (
    <>
      <Composition node={buildMemberTile(member, photo, index, onClick)} />
      <style jsx global>{`
        .el-member{ display:flex; flex-direction:column; width:100%; padding:0; font-family:inherit; color:inherit; cursor:pointer;
          background:var(--paper, #FFFDFA); border:2.5px solid var(--ink, #26271c); border-radius:18px; box-shadow:3px 3px 0 var(--ink, #26271c); overflow:hidden; text-align:center;
          transition:transform .15s ease-out, box-shadow .15s ease-out; }
        .el-member:hover{ transform:translate(-2px,-2px); box-shadow:5px 5px 0 var(--ink, #26271c); }
        .el-member__photo{ position:relative; aspect-ratio:1; background:var(--cream2, #FFE9D6); display:grid; place-items:center; border-bottom:2px solid var(--ink, #26271c); overflow:hidden;
          background-image:repeating-linear-gradient(45deg,transparent 0 12px,rgba(0,0,0,.04) 12px 14px); }
        /* tune atoms for this tile */
        .el-member .el-title{ padding:10px 8px 4px; font-weight:700; font-size:13px; line-height:1.25; letter-spacing:0; }
        .el-member .el-meta{ display:block; padding:0 8px 12px; font-size:11px; color:var(--ink2, #5c5a4b); letter-spacing:.08em; }
        .el-member__photo .el-img--empty{ color:var(--ink, #26271c); }
        .el-member__photo .el-img--empty{ font-family:var(--font-archivo),'Archivo Black',system-ui,sans-serif; font-size:20px; }
      `}</style>
    </>
  );
}
