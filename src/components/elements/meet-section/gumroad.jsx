"use client";

// meet-section · variant "gumroad" — the ink "meet the candidates" CTA tile on the
// home mosaic. Library element; host owns the grid-area + supplies href/copy.

import { ArrowRight } from "lucide-react";

export default function MeetSectionGumroad({ href, title = "รู้จักผู้สมัครของคุณหรือยัง?", partyCount = 0 }) {
  return (
    <a href={href} className="gh-meet" data-element="meet-section" data-variant="gumroad">
      <div>
        <h3 className="gh-meet__title">{title}</h3>
        <p className="gh-meet__sub">{partyCount} พรรคในปีนี้ · ดูวิสัยทัศน์ก่อนลงคะแนน</p>
      </div>
      <span className="gh-meet__go">ดูผู้สมัคร <ArrowRight size={20} strokeWidth={2.6} /></span>
      <style jsx global>{`
        .gh-meet{ height:100%; display:flex; align-items:center; justify-content:space-between; gap:18px; background:var(--meet-bg, #26271c);
          border:2.5px solid var(--meet-border, #26271c); border-radius:22px; box-shadow:5px 5px 0 var(--meet-border, #26271c); padding:clamp(22px,2.4cqw,32px);
          text-decoration:none; transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gh-meet:hover{ transform:translate(-2px,-2px); box-shadow:8px 8px 0 var(--meet-border, #26271c); }
        .gh-meet__title{ margin:0; font-size:clamp(19px,2.2cqw,26px); font-weight:800; line-height:1.2; color:var(--meet-text, #FFF6EC); }
        .gh-meet__sub{ margin:6px 0 0; font-size:clamp(13px,1.5cqw,15px); font-weight:500; color:#bdb9aa; }
        .gh-meet__go{ display:inline-flex; align-items:center; gap:9px; flex-shrink:0; font-size:clamp(17px,1.9cqw,22px); font-weight:900; color:var(--meet-accent, #C2F47E); }
        .gh-meet:hover .gh-meet__go svg{ transform:translateX(4px); }
        .gh-meet__go svg{ transition:transform .15s ease-out; }
      `}</style>
    </a>
  );
}
