'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getPath } from "../utils/basePath";
import { Check, Users, UserX, Ban, ArrowRight } from 'lucide-react';

// Theme-aware party card. Regular parties follow the ACTIVE template theme via
// var(--color-primary)/var(--color-accent) (+ color-mix tints); the special
// options (งดออกเสียง / ไม่รับรอง) keep their semantic orange / red so their
// meaning reads regardless of theme. Design language: soft "logo stage" with a
// themed radial wash + inner ring, a premium number chip, a top accent bar, and
// an ambient lift on hover — no hard 1px borders.

export default function PartyCard({ party, isSelected, onSelect, onViewDetails, variant = 'grid' }) {
  const isHero = variant === 'hero';
  const isVoteNo = party.number === 0 || party.number === '0';
  const isDisapprove = party.number === -1 || party.number === '-1';
  const isSpecialOption = isVoteNo || isDisapprove;
  const [imageError, setImageError] = useState(false);

  const T = isDisapprove
    ? { solid: '#dc2626', grad: 'linear-gradient(135deg,#dc2626,#f87171)', soft: '#fef2f2',
        ring: 'rgba(220,38,38,0.30)', glow: '0 20px 44px -14px rgba(220,38,38,0.40)', wash: 'rgba(220,38,38,0.07)' }
    : isVoteNo
    ? { solid: '#ea580c', grad: 'linear-gradient(135deg,#ea580c,#fb923c)', soft: '#fff7ed',
        ring: 'rgba(234,88,12,0.30)', glow: '0 20px 44px -14px rgba(234,88,12,0.40)', wash: 'rgba(234,88,12,0.07)' }
    : { solid: 'var(--color-primary)', grad: 'linear-gradient(135deg,var(--color-primary),var(--color-accent))',
        soft: 'color-mix(in srgb, var(--color-primary) 9%, white)',
        ring: 'color-mix(in srgb, var(--color-primary) 28%, transparent)',
        glow: '0 22px 48px -16px color-mix(in srgb, var(--color-primary) 50%, transparent)',
        wash: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' };

  const SpecialIcon = isDisapprove ? UserX : Ban;
  const label = isVoteNo ? 'งดออกเสียง' : isDisapprove ? 'ไม่รับรอง' : `NO. ${party.number}`;

  // `pad` is the logo inset. The grid card's stage is ~200px+ so it can afford
  // p-4/md:p-6; the compact row's stage is a fixed 48px box, where that same
  // inset leaves a 16px (mobile) / 0px (md+) content box — i.e. the party logo
  // was invisible on desktop whenever >5 parties flipped the ballot to compact.
  const LogoInner = ({ pad = 'p-4 md:p-6' }) => (
    isSpecialOption ? (
      <SpecialIcon className="w-1/3 h-1/3 transition-all duration-500 group-hover:scale-110"
        style={{ color: isSelected ? T.solid : 'rgba(30,23,45,0.22)' }} />
    ) : (party.logoUrl && !imageError) ? (
      <img src={getPath(party.logoUrl)} alt={party.name}
        className={`w-full h-full object-contain ${pad} transition-transform duration-700 ease-out group-hover:scale-105 ${isSelected ? 'scale-105' : ''}`}
        onError={() => setImageError(true)} />
    ) : (
      <Users className="w-1/3 h-1/3 transition-all duration-500 group-hover:scale-110" style={{ color: 'rgba(30,23,45,0.18)' }} />
    )
  );

  // ── compact variant (used when there are many parties) ──────────────────────
  if (variant === 'compact') {
    return (
      <div onClick={() => onSelect(party.id)}
        role="radio" aria-checked={!!isSelected} tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(party.id); } }}
        className="relative group cursor-pointer select-none transition-all duration-400 ease-out rounded-2xl overflow-hidden flex"
        style={{
          background: isSelected ? T.soft : '#ffffff',
          boxShadow: isSelected ? `0 0 0 1.5px ${T.solid}, ${T.glow}` : '0 4px 20px -8px rgba(30,23,45,0.12)',
        }}>
        <div className="w-1.5 flex-shrink-0 transition-all duration-500" style={{ background: isSelected ? T.grad : T.wash }} />
        <div className="flex items-center gap-3 p-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300"
            style={{ background: `radial-gradient(120% 120% at 50% 0%, ${T.soft}, #fff 72%)`, boxShadow: `inset 0 0 0 1px ${T.ring}` }}>
            <LogoInner pad="p-1.5" />
          </div>
          <div className="flex-1 min-w-0">
            {/* 0.42 alpha put this 9px ballot label at 2.65:1 on the white row —
                well under AA's 4.5. 0.66 composites to 5.57:1 and still reads as a
                quiet caption next to the party name */}
            <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: isSelected ? T.solid : 'rgba(30,23,45,0.66)' }}>{label}</span>
            {/* two lines, not `truncate`: a 53-character party name lost 132px of
                itself (desktop) / 61px (mobile) to the single-line ellipsis, and
                parties sharing a prefix became indistinguishable on the ballot.
                THREE lines, not two: at 768px the >5-party ballot is still 3 columns
                (grid-cols-1 sm:grid-cols-3), which leaves the row 235px wide and the
                name column ~145px — clamp-2 measured scrollHeight−clientHeight = 18px,
                i.e. a whole third line of the longest real name silently dropped. */}
            {/* ink gutter: `line-clamp` forces overflow:hidden, which clips at the
                PADDING box. leading-snug (1.375) is under Anuphan's font box once a
                Thai tone-over-vowel is in play — the tallest legitimate stack
                (ปื๋ ฟื๊ ที่ ชี้ เพื่อ; names are admin-typed free text) puts 0.1202em
                of ink above the clip edge. .18em = that plus a 0.05em cushion, so
                sub-pixel rounding cannot eat it. pt/-mt cancel in layout: the clip box
                grows, the glyphs do not move. No padding-BOTTOM — Chrome paints the
                line that the clamp dropped into bottom padding (receipt, 2026-07-23) */}
            <h3 className="font-bold text-[13px] leading-snug line-clamp-3 pt-[.18em] -mt-[.18em]" style={{ color: isSelected ? '#1e172d' : 'rgba(30,23,45,0.82)' }}>{party.name}</h3>
          </div>
          {isSelected && (
            <div className="flex-shrink-0 p-1.5 rounded-xl text-white" style={{ background: T.grad, boxShadow: `0 6px 16px -4px ${T.solid}` }}>
              <Check size={13} strokeWidth={3.5} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── grid variant (default) ──────────────────────────────────────────────────
  return (
    <div onClick={() => onSelect(party.id)}
      role="radio" aria-checked={!!isSelected} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(party.id); } }}
      className="group relative cursor-pointer select-none rounded-[26px] overflow-hidden h-full flex flex-col transition-all duration-500 ease-out"
      style={{
        background: '#ffffff',
        boxShadow: isSelected ? `0 0 0 2px ${T.solid}, ${T.glow}` : '0 8px 30px -12px rgba(30,23,45,0.16)',
        transform: isSelected ? 'translateY(-2px)' : undefined,
      }}
      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.boxShadow = T.glow; e.currentTarget.style.transform = 'translateY(-6px)'; } }}
      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 8px 30px -12px rgba(30,23,45,0.16)'; e.currentTarget.style.transform = ''; } }}>

      {/* Top accent bar — themed, always present (fills to gradient when selected) */}
      <div className="h-1.5 w-full transition-all duration-500" style={{ background: isSelected ? T.grad : T.wash }} />

      <div className={`flex-1 flex flex-col ${isHero ? 'p-4 md:p-5' : 'p-3.5 md:p-4'}`}>

        {/* Logo stage — themed radial wash + inner ring + corner glow */}
        <div className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden flex items-center justify-center transition-all duration-500"
          style={{
            background: `radial-gradient(125% 120% at 50% 0%, ${isSelected ? T.soft : T.wash}, #ffffff 72%)`,
            boxShadow: isSelected ? `inset 0 0 0 1.5px ${T.ring}, 0 10px 28px -14px ${T.solid}` : `inset 0 0 0 1px ${T.ring}`,
          }}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity duration-500 opacity-70 group-hover:opacity-100" style={{ background: T.wash }} />

          <LogoInner />

          {/* Number chip */}
          <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black tracking-[0.1em] uppercase backdrop-blur-md transition-all duration-300"
            style={{
              background: isSelected ? T.grad : 'rgba(30,23,45,0.82)',
              color: '#ffffff',
              boxShadow: isSelected ? `0 8px 18px -6px ${T.solid}` : '0 4px 12px rgba(30,23,45,0.2)',
            }}>
            {label}
          </div>

          {/* Selected check — top right */}
          {isSelected && (
            <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 animate-in zoom-in-50 fade-in duration-500">
              <div className="p-1.5 md:p-2 rounded-xl text-white" style={{ background: T.grad, boxShadow: `0 8px 22px -6px ${T.solid}` }}>
                <Check size={17} strokeWidth={4} />
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/[0.04] to-transparent pointer-events-none" />
        </div>

        {/* Name */}
        {/* three lines: at 5 parties the mobile grid is 2-up (~139px of name
            width) and the longest real party name needs 3 lines — clamp-2 cut
            the last line off entirely */}
        {/* ink gutter (see the compact row above): leading-tight = 1.25 sits under
            Anuphan's font box, so a Thai tone-over-vowel crosses the clip edge. Sized
            off the same worst-case stack, + a 0.05em cushion. Folded into the existing
            mt-3.5 (0.875rem) so the name does not shift down */}
        <h3 className={`pt-[.24em] mt-[calc(0.875rem-.24em)] font-bold leading-tight line-clamp-3 px-0.5 text-center transition-colors duration-300 ${isHero ? 'text-base md:text-xl' : 'text-[15px] md:text-base'}`}
          style={{ color: isSelected ? '#1e172d' : 'rgba(30,23,45,0.85)' }}>
          {party.name}
        </h3>

        {/* CTA — ดูรายละเอียด */}
        {!isSpecialOption && (
          <div className="mt-auto pt-3.5 z-30 text-center">
            {(() => {
              const inner = (<><span className="tracking-wide">VIEW PROFILE</span><ArrowRight size={13} className="transition-transform duration-300 group-hover/btn:translate-x-0.5" /></>);
              const cls = "group/btn inline-flex items-center gap-1.5 px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[11px] md:text-xs font-bold transition-all duration-300";
              const base = { background: isSelected ? T.grad : T.soft, color: isSelected ? '#ffffff' : T.solid, boxShadow: isSelected ? `0 8px 20px -8px ${T.solid}` : 'none' };
              const enter = (e) => { if (!isSelected) { e.currentTarget.style.background = T.grad; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.boxShadow = `0 8px 20px -8px ${T.solid}`; } };
              const leave = (e) => { if (!isSelected) { e.currentTarget.style.background = T.soft; e.currentTarget.style.color = T.solid; e.currentTarget.style.boxShadow = 'none'; } };
              return onViewDetails ? (
                <button onClick={(e) => { e.stopPropagation(); onViewDetails(party); }} className={cls} style={base} onMouseEnter={enter} onMouseLeave={leave}>{inner}</button>
              ) : (
                <Link href={`/party?id=${party.number}&source=vote`} onClick={(e) => e.stopPropagation()} className={cls} style={base} onMouseEnter={enter} onMouseLeave={leave}>{inner}</Link>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
