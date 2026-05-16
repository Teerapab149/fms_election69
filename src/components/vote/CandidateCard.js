'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getPath } from '../../utils/basePath';
import { Check, Users, PlayCircle } from 'lucide-react';
import BaseCard from './BaseCard';

// CandidateCard — composes BaseCard สำหรับ party/candidate voting cards
//
// variant="grid"    (default) — โลโก้วงกลม prominent, ชื่อ + slogan + ปุ่มรายละเอียด
// variant="compact"           — โลโก้วงกลมเล็ก, ชื่อเท่านั้น, ไม่มีปุ่ม (สำหรับ 4+ พรรค)
export default function CandidateCard({ party, isSelected, onSelect, onViewDetails, variant = 'grid' }) {
  const [imageError, setImageError] = useState(false);

  // DESIGN.md Tokens
  const accent      = '#7244a8';
  const selectedBg  = '#f9e0ff';
  const shadows = {
    rest:     '0 4px 24px rgba(61,37,73,0.04)',
    hover:    '0 8px 32px rgba(61,37,73,0.10)',
    selected: '0 12px 40px rgba(114,68,168,0.15)',
  };

  const isCompact = variant === 'compact';

  // ─── Logo sizes per variant ──────────────────────────────────────────────────
  const logoSizeOuter = isCompact
    ? 'w-14 h-14'
    : 'w-20 h-20 md:w-24 md:h-24';
  const logoSizeInner = isCompact
    ? 'w-9 h-9'
    : 'w-12 h-12 md:w-14 md:h-14';
  const fallbackIconSize = isCompact ? 'w-5 h-5' : 'w-7 h-7 md:w-8 md:h-8';

  // ─── Media Slot: Circle logo with gradient bg ────────────────────────────────
  const mediaSlot = (
    <div className="relative flex items-center justify-center w-full py-3 md:py-4">
      {/* Circle container — gradient bg + colored ring */}
      <div
        className={`relative ${logoSizeOuter} rounded-full flex items-center justify-center transition-all duration-500`}
        style={{
          background: isSelected
            ? `linear-gradient(135deg, #f0d6ff, #f9e0ff)`
            : `linear-gradient(135deg, #f9e0ff, #ffffff)`,
          boxShadow: isSelected
            ? `0 0 0 3px ${accent}50, 0 8px 24px rgba(114,68,168,0.12)`
            : `0 0 0 2px rgba(114,68,168,0.12), 0 4px 12px rgba(61,37,73,0.06)`,
        }}
      >
        {party.logoUrl && !imageError ? (
          <img
            src={getPath(party.logoUrl)}
            alt={party.name}
            className={`${logoSizeInner} object-contain transition-transform duration-700 ease-out group-hover:scale-110 ${isSelected ? 'scale-105' : ''}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <Users className={`${fallbackIconSize} text-[#3d2549]/20 group-hover:text-[#3d2549]/30 transition-colors duration-500`} />
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 animate-in zoom-in-50 fade-in-50">
            <div
              className="p-1 rounded-lg text-white"
              style={{
                background: 'linear-gradient(135deg, #7244a8, #c392fc)',
                boxShadow: '0 4px 12px rgba(114,68,168,0.4)',
              }}
            >
              <Check size={isCompact ? 10 : 12} strokeWidth={4} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Badge Slot: Floating number badge (top-left of media area) ───────────────
  const badgeSlot = (
    <div
      className={`absolute top-1.5 left-1.5 z-10 px-2 py-0.5 rounded-md ${isCompact ? 'text-[8px]' : 'text-[9px] md:text-xs'} font-black tracking-[0.1em] uppercase backdrop-blur-md`}
      style={{
        backgroundColor: isSelected ? accent : 'rgba(61,37,73,0.80)',
        color: '#ffffff',
        boxShadow: isSelected ? `0 3px 10px ${accent}40` : '0 2px 8px rgba(61,37,73,0.12)',
      }}
    >
      NO. {party.number}
    </div>
  );

  // ─── Action Slot: "ดูรายละเอียด" (grid variant only) ──────────────────────────
  const detailBtnClass = "flex items-center gap-1 md:gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 min-h-[36px] md:min-h-[44px] rounded-full text-[10px] md:text-xs font-bold transition-all duration-300";

  const actionSlot = (
    <>
      {onViewDetails ? (
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(party); }}
          className={detailBtnClass}
          style={{
            background: isSelected ? 'linear-gradient(135deg, #7244a8, #c392fc)' : '#f9e0ff',
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
          <PlayCircle size={14} />
        </button>
      ) : (
        <Link
          href={`/party?id=${party.number}&source=vote`}
          onClick={(e) => e.stopPropagation()}
          className={detailBtnClass}
          style={{
            background: isSelected ? 'linear-gradient(135deg, #7244a8, #c392fc)' : '#f9e0ff',
            color: isSelected ? '#ffffff' : '#7244a8',
          }}
        >
          <span>ดูรายละเอียด</span>
          <PlayCircle size={14} />
        </Link>
      )}
    </>
  );

  return (
    <BaseCard
      mediaSlot={mediaSlot}
      title={party.name}
      description={party.slogan ? `"${party.slogan}"` : undefined}
      actionSlot={actionSlot}
      badgeSlot={badgeSlot}
      isSelected={isSelected}
      onClick={() => onSelect(party.id)}
      accentColor={accent}
      selectedBg={selectedBg}
      shadows={shadows}
      variant={variant}
    />
  );
}
