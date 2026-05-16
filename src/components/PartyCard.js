'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getPath } from "../utils/basePath";
import { Check, Users, UserX, Ban, PlayCircle } from 'lucide-react';

// ─── DESIGN.md Tokens ─────────────────────────────────────────────────────────
// Surface Hierarchy: Layer 0 (#fff3fe) → Layer 1 (#f9e0ff) → Layer 2 (#ffffff)
// On-Surface: #3d2549 — ใช้แทน text-slate-700/900
// Primary: #7244a8 — gradient to #c392fc
// Ambient shadows: tinted #3d2549 at 6%, blur 32px
// No-Line Rule: ห้ามใช้ 1px border — ใช้ tonal shift + ghost border (15% opacity)
// Party Accent: 4px vertical accent stripe ที่ขอบซ้าย

export default function PartyCard({ party, isSelected, onSelect, onViewDetails, variant = 'grid' }) {
  const isHero = variant === 'hero';

  const isVoteNo = party.number === 0 || party.number === '0';
  const isDisapprove = party.number === -1 || party.number === '-1';
  const isSpecialOption = isVoteNo || isDisapprove;

  const [imageError, setImageError] = useState(false);

  // 🎨 COLOR THEME — mapped to DESIGN.md tokens
  let themeColor = 'purple';
  if (isVoteNo) themeColor = 'orange';
  if (isDisapprove) themeColor = 'red';

  const colorMap = {
    purple: {
      text: 'text-[#7244a8]',
      badge: 'bg-[#7244a8]',
      accent: '#7244a8',         // Party Accent stripe
      selectedBg: '#f9e0ff',     // Layer 1 surface
      glowShadow: '0 8px 32px rgba(61,37,73,0.10)',    // Ambient shadow
      selectedShadow: '0 12px 40px rgba(114,68,168,0.15)',
    },
    red: {
      text: 'text-red-600',
      badge: 'bg-red-500',
      accent: '#ef4444',
      selectedBg: '#fef2f2',
      glowShadow: '0 8px 32px rgba(239,68,68,0.08)',
      selectedShadow: '0 12px 40px rgba(239,68,68,0.12)',
    },
    orange: {
      text: 'text-orange-600',
      badge: 'bg-orange-500',
      accent: '#f97316',
      selectedBg: '#fff7ed',
      glowShadow: '0 8px 32px rgba(249,115,22,0.08)',
      selectedShadow: '0 12px 40px rgba(249,115,22,0.12)',
    }
  };

  const theme = colorMap[themeColor];
  const SpecialIcon = isDisapprove ? UserX : Ban;

  // ── compact variant ───────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div
        onClick={() => onSelect(party.id)}
        className={`
          relative group cursor-pointer select-none
          transition-all duration-500 ease-out
          rounded-3xl overflow-hidden flex
        `}
        style={{
          backgroundColor: isSelected ? theme.selectedBg : '#ffffff',
          boxShadow: isSelected ? theme.selectedShadow : '0 4px 24px rgba(61,37,73,0.04)',
        }}
      >
        {/* Party Accent Stripe — left */}
        <div
          className="w-1 flex-shrink-0 transition-all duration-500"
          style={{ backgroundColor: isSelected ? theme.accent : 'transparent' }}
        />

        <div className="flex items-center gap-3 p-3.5 flex-1 min-w-0">
          {/* Logo */}
          <div className={`
            w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden
            bg-white transition-all duration-300
          `}
            style={{
              boxShadow: isSelected
                ? `0 0 0 2px ${theme.accent}25, 0 4px 12px rgba(61,37,73,0.06)`
                : '0 2px 8px rgba(61,37,73,0.04)',
            }}
          >
            {isSpecialOption ? (
              <SpecialIcon className={`w-5 h-5 ${isSelected ? theme.text : 'text-[#3d2549]/30'}`} />
            ) : (party.logoUrl && !imageError) ? (
              <img
                src={getPath(party.logoUrl)}
                alt={party.name}
                className="w-full h-full object-contain p-1.5"
                onError={() => setImageError(true)}
              />
            ) : (
              <Users className="w-5 h-5 text-[#3d2549]/25" />
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <span className={`
              text-[9px] font-bold uppercase tracking-[0.12em]
              ${isSelected ? theme.text : 'text-[#3d2549]/40'}
            `}>
              {isVoteNo ? 'NO VOTE' : isDisapprove ? 'NO' : `NO. ${party.number}`}
            </span>
            <h3 className={`
              font-bold text-[13px] leading-snug truncate
              ${isSelected ? 'text-[#3d2549]' : 'text-[#3d2549]/80'}
            `}>
              {party.name}
            </h3>
          </div>

          {/* Check */}
          {isSelected && (
            <div className={`flex-shrink-0 p-1.5 rounded-xl ${theme.badge} text-white`}
              style={{ boxShadow: `0 4px 12px ${theme.accent}40` }}
            >
              <Check size={12} strokeWidth={3.5} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── grid variant (default) ─────────────────────────────────────────────────
  // DESIGN.md: No borders, tonal layering, 4px left accent, XL radius,
  // Ambient shadows (tinted #3d2549), hover scale 1.02x
  return (
    <div
      onClick={() => onSelect(party.id)}
      className={`
        relative group cursor-pointer select-none
        transition-all duration-500 ease-out overflow-hidden
        rounded-3xl flex h-full
      `}
      style={{
        backgroundColor: isSelected ? theme.selectedBg : '#ffffff',
        boxShadow: isSelected
          ? theme.selectedShadow
          : '0 4px 24px rgba(61,37,73,0.04)',
        transform: isSelected ? 'scale(1.02)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = theme.glowShadow;
          e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(61,37,73,0.04)';
          e.currentTarget.style.transform = '';
        }
      }}
    >
      {/* ── Party Accent Stripe (DESIGN.md: 4px vertical accent, left side) ── */}
      <div
        className="w-1 md:w-1.5 flex-shrink-0 transition-all duration-500 rounded-l-3xl"
        style={{
          backgroundColor: isSelected ? theme.accent : 'rgba(61,37,73,0.06)',
        }}
      />

      {/* ── Card Content ──────────────────────────────────────────────────── */}
      <div className={`
        flex-1 flex flex-col
        ${isHero ? 'p-4 md:p-6' : 'p-3 md:p-5'}
      `}>

        {/* Large Image/Logo Container — Layer 2 surface (#ffffff) on Layer 1 background */}
        <div className={`
          relative flex items-center justify-center w-full aspect-video md:aspect-[4/3]
          rounded-2xl md:rounded-[20px]
          mb-4 md:mb-5 overflow-hidden
          transition-all duration-500 bg-white
        `}
          style={{
            boxShadow: isSelected
              ? `0 0 0 2.5px ${theme.accent}30, 0 12px 32px rgba(61,37,73,0.08)`
              : '0 4px 16px rgba(61,37,73,0.05)',
          }}
        >
          {/* The Image */}
          {isSpecialOption ? (
            <SpecialIcon className={`w-1/3 h-1/3 transition-colors duration-300 ${isSelected ? theme.text : 'text-[#3d2549]/20 group-hover:text-[#3d2549]/30 group-hover:scale-110'}`} />
          ) : (party.logoUrl && !imageError) ? (
            <img
              src={getPath(party.logoUrl)}
              alt={party.name}
              className={`w-full h-full object-contain p-4 md:p-6 transition-transform duration-700 ease-out group-hover:scale-105 ${isSelected ? 'scale-105' : ''}`}
              onError={() => setImageError(true)}
            />
          ) : (
            <Users className="w-1/3 h-1/3 text-[#3d2549]/15 group-hover:text-[#3d2549]/25 transition-colors group-hover:scale-110 duration-500" />
          )}

          {/* Number Badge — Floating Top Left (Label-MD style) */}
          <div className={`
            absolute top-2 left-2 md:top-3 md:left-3
            px-2.5 py-1 md:px-3 md:py-1.5
            rounded-lg md:rounded-xl
            text-[10px] md:text-xs font-black tracking-[0.12em] uppercase
            transition-all duration-300 backdrop-blur-md
          `}
            style={{
              backgroundColor: isSelected ? theme.accent : 'rgba(61,37,73,0.85)',
              color: '#ffffff',
              boxShadow: isSelected
                ? `0 4px 12px ${theme.accent}40`
                : '0 4px 12px rgba(61,37,73,0.15)',
            }}
          >
            {isVoteNo ? 'NO VOTE' : isDisapprove ? 'NO' : `NO. ${party.number}`}
          </div>

          {/* Checkmark Overlay — Moved to Top Right to NOT obscure the logo */}
          {isSelected && (
            <div className="absolute top-2 right-2 md:top-3 md:right-3 transition-all duration-500 animate-in zoom-in-50 fade-in-50">
              <div className={`p-1.5 md:p-2 rounded-xl text-white`}
                style={{ 
                  background: 'linear-gradient(135deg, #7244a8, #c392fc)', // Using signature primary gradient
                  boxShadow: `0 6px 20px rgba(114,68,168,0.4)`
                }}
              >
                <Check size={18} strokeWidth={4} />
              </div>
            </div>
          )}
          
          {/* Subtle gradient overlay at bottom for depth */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </div>

        {/* Party Name — Headline-MD (DESIGN.md) */}
        <h3 className={`
          font-bold leading-tight line-clamp-2 w-full px-1 transition-colors duration-300
          ${isHero ? 'text-base md:text-xl' : 'text-sm md:text-base'}
          ${isSelected ? 'text-[#3d2549]' : 'text-[#3d2549]/80 group-hover:text-[#3d2549]'}
        `}>
          {party.name}
        </h3>

        {/* Slogan */}
        {party.slogan && !isSpecialOption && (
          <p className={`
            text-[10px] md:text-xs font-medium italic line-clamp-1 px-1 mt-1
            transition-colors duration-300
            ${isSelected ? 'text-[#3d2549]/50' : 'text-[#3d2549]/30'}
          `}>
            "{party.slogan}"
          </p>
        )}

        {/* ดูรายละเอียด — Button with gradient (DESIGN.md: primary gradient CTA, pill rounding) */}
        {!isSpecialOption && (
          <div className="mt-3 md:mt-4 z-30">
            {onViewDetails ? (
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(party); }}
                className="flex items-center gap-1.5 px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, #7244a8, #c392fc)'
                    : '#f9e0ff',
                  color: isSelected ? '#ffffff' : '#7244a8',
                  boxShadow: isSelected ? '0 4px 16px rgba(114,68,168,0.25)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #7244a8, #c392fc)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(114,68,168,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f9e0ff';
                    e.currentTarget.style.color = '#7244a8';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <span>ดูรายละเอียด</span>
                <PlayCircle size={12} className="md:w-3.5 md:h-3.5" />
              </button>
            ) : (
              <Link
                href={`/party?id=${party.number}&source=vote`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, #7244a8, #c392fc)'
                    : '#f9e0ff',
                  color: isSelected ? '#ffffff' : '#7244a8',
                }}
              >
                <span>ดูรายละเอียด</span>
                <PlayCircle size={12} className="md:w-3.5 md:h-3.5" />
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  );
}