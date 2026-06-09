"use client";

// info-card · composite (Layer 2) · variant "gumroad"
//
// A centred "status" hero card: a coloured icon box + eyebrow + big title + desc +
// an actions slot. Composed from Layer-1 atoms (text-meta · text-title · text-plain)
// via <Composition>; the icon and action button(s) ride in as escape-hatch `node`s
// (caller-supplied). Reusable for the closed page, empty states, etc.

import Composition from "../../elements/_composer/Composition";

export function buildInfoCard({ icon, accent, eyebrow, title, desc, action }) {
  return {
    kind: "frame", className: "el-infocard", attrs: { "data-component": "info-card", "data-variant": "gumroad" },
    children: [
      { kind: "node", render: <div className="el-infocard__icon" style={{ background: accent }}>{icon}</div> },
      { kind: "atom", type: "text-meta", props: { children: `★ ${eyebrow}` } },
      { kind: "atom", type: "text-title", props: { children: title, as: "h1" } },
      { kind: "atom", type: "text-plain", props: { children: desc } },
      action ? { kind: "node", render: <div className="el-infocard__actions">{action}</div> } : null,
    ].filter(Boolean),
  };
}

export default function InfoCardGumroad(props) {
  return (
    <>
      <Composition node={buildInfoCard(props)} />
      <style jsx global>{`
        .el-infocard{ width:100%; max-width:520px; background:#FFFDFA; border:2.5px solid #26271c; border-radius:26px;
          box-shadow:8px 8px 0 #26271c; padding:44px 36px 40px; text-align:center; }
        .el-infocard__icon{ width:88px; height:88px; margin:0 auto 22px; display:grid; place-items:center; color:#26271c;
          border:2.5px solid #26271c; border-radius:22px; box-shadow:5px 5px 0 #26271c; }
        .el-infocard .el-meta{ display:inline-block; font-size:12px; font-weight:700; letter-spacing:.14em; color:#5c5a4b; }
        .el-infocard .el-title{ font-size:clamp(28px,6cqw,44px); font-weight:400; line-height:1.05; letter-spacing:-.02em; margin:12px 0 0; -webkit-line-clamp:unset; text-transform:none; }
        .el-infocard .el-plain{ margin:16px auto 0; font-size:clamp(14px,2.4cqw,16px); font-weight:500; line-height:1.7; color:#5c5a4b; max-width:400px; }
        .el-infocard__actions{ margin-top:30px; }
        @container (max-width:560px){ .el-infocard{ padding:36px 22px 32px; } }
      `}</style>
    </>
  );
}
