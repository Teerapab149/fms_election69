'use client';

// BaseCard — "Lego brick" พื้นฐานสำหรับ selectable cards ในหน้าโหวต
//
// DESIGN.md compliance:
//   - No-Line Rule: ไม่มี 1px border; ใช้ tonal shift + ambient shadow
//   - Surface Hierarchy: Layer 2 (#ffffff) บน Layer 1 (#f9e0ff) เมื่อ selected
//   - Party Accent: 4px left stripe
//   - Ambient Shadow: tinted #3d2549, 32px blur
//   - Hover: scale(1.02) + translateY(-4px)
//
// variant prop:
//   "grid"    (default) — full card, p-2.5 md:p-5, rounded-3xl
//   "compact"           — small card, p-2, rounded-2xl, no min-height guard
export default function BaseCard({
  mediaSlot,
  title,
  description,
  actionSlot,
  badgeSlot,
  isSelected = false,
  onClick,
  accentColor = '#7244a8',
  selectedBg = '#f9e0ff',
  shadows = {},
  variant = 'grid',
}) {
  const {
    rest     = '0 4px 24px rgba(61,37,73,0.04)',
    hover    = '0 8px 32px rgba(61,37,73,0.10)',
    selected = '0 12px 40px rgba(114,68,168,0.15)',
  } = shadows;

  const isCompact = variant === 'compact';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
      }}
      className={`
        relative group cursor-pointer select-none
        transition-all duration-500 ease-out overflow-hidden
        ${isCompact ? 'rounded-2xl' : 'rounded-3xl'} flex h-full
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7244a8]
      `}
      style={{
        backgroundColor: isSelected ? selectedBg : '#ffffff',
        boxShadow: isSelected ? selected : rest,
        transform: isSelected ? 'scale(1.02)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = hover;
          e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = rest;
          e.currentTarget.style.transform = '';
        }
      }}
    >
      {/* ── Accent Stripe (left side) ──────────────────────────────────────────── */}
      <div
        className={`${isCompact ? 'w-1' : 'w-1 md:w-1.5'} flex-shrink-0 transition-all duration-500 ${isCompact ? 'rounded-l-2xl' : 'rounded-l-3xl'}`}
        style={{
          backgroundColor: isSelected ? accentColor : 'rgba(61,37,73,0.06)',
        }}
      />

      {/* ── Card Body ──────────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col ${isCompact ? 'p-2' : 'p-2.5 md:p-5'}`}>

        {/* Media area */}
        {mediaSlot && (
          <div className={`relative w-full ${isCompact ? 'mb-2' : 'mb-2.5 md:mb-5'}`}>
            {mediaSlot}
            {badgeSlot}
          </div>
        )}

        {/* Text area */}
        <div className={`flex-1 ${isCompact ? '' : 'min-h-[36px] md:min-h-[44px]'} flex flex-col justify-center`}>
          {title && (
            <h3
              className={`
                font-bold leading-tight line-clamp-2 w-full
                ${isCompact ? 'text-[11px] text-center' : 'text-xs md:text-base'}
                transition-colors duration-300
                ${isSelected ? 'text-[#3d2549]' : 'text-[#3d2549]/80 group-hover:text-[#3d2549]'}
              `}
            >
              {title}
            </h3>
          )}
          {!isCompact && description && (
            <p
              className={`
                text-[9px] md:text-xs font-medium italic line-clamp-1 mt-0.5 md:mt-1
                transition-colors duration-300
                ${isSelected ? 'text-[#3d2549]/50' : 'text-[#3d2549]/30'}
              `}
            >
              {description}
            </p>
          )}
        </div>

        {/* Action area (ซ่อนใน compact) */}
        {!isCompact && actionSlot && (
          <div className="mt-3 md:mt-4 z-30">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}
