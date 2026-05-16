'use client';

import { Ban, Check } from 'lucide-react';

/**
 * AbstainCard — "งดออกเสียง" option.
 *
 * Three visual variants controlled by `variant` prop (from STYLED_BLOCKS_ARCHITECTURE.md):
 *   - "standard" (default): Full card with icon, title, subtitle — editorial glass style
 *   - "compact": Pill button with icon and text
 *   - "minimal": Text-link style
 *
 * DESIGN.md compliance:
 *   - Tertiary color (#f97316 / orange) for abstain
 *   - No-Line Rule: no 1px borders; tonal shift + ambient shadow only
 *   - 44px min touch target
 *   - Party Accent stripe (left) on standard variant
 *
 * HARD LOCK: This component must always be rendered when abstainOption exists.
 *            Cannot be hidden via config.
 *
 * @param {object}   abstainOption — { id, name, ... } — the special "abstain" party data
 * @param {boolean}  isSelected    — Whether abstain is the current selection
 * @param {function} onSelect      — Callback with abstainOption.id
 * @param {string}   [variant]     — "standard" | "compact" | "minimal"
 */
export default function AbstainCard({
  abstainOption,
  isSelected,
  onSelect,
  variant = 'standard',
}) {
  const handleClick = () => onSelect(abstainOption.id);

  // ── compact: pill ─────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="flex justify-center">
        <button
          onClick={handleClick}
          aria-pressed={isSelected}
          className="relative flex items-center justify-center gap-2.5 rounded-full px-8 min-h-[44px] py-3 max-w-xs w-full transition-all duration-500 font-bold text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          style={{
            backgroundColor: isSelected ? '#f97316' : '#ffffff',
            color: isSelected ? '#ffffff' : '#3d2549',
            boxShadow: isSelected
              ? '0 8px 32px rgba(249,115,22,0.20)'
              : '0 4px 20px rgba(61,37,73,0.04)',
            transform: isSelected ? 'scale(1.03)' : undefined,
          }}
        >
          <Ban size={16} strokeWidth={2.5} />
          <span>งดออกเสียง</span>
          {isSelected && (
            <div
              className="absolute top-1.5 right-3 bg-white text-orange-600 p-0.5 rounded-full"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <Check size={10} strokeWidth={4} />
            </div>
          )}
        </button>
      </div>
    );
  }

  // ── minimal: text-link ────────────────────────────────────────────────────
  if (variant === 'minimal') {
    return (
      <div className="flex justify-center">
        <button
          onClick={handleClick}
          aria-pressed={isSelected}
          className="flex items-center gap-2 text-sm font-semibold transition-all duration-300 min-h-[44px] py-2.5 px-5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          style={{
            backgroundColor: isSelected ? '#fff7ed' : 'transparent',
            color: isSelected ? '#ea580c' : '#3d254970',
          }}
        >
          <Ban size={14} strokeWidth={2.5} />
          <span className={!isSelected ? 'underline underline-offset-4 decoration-[#3d254930]' : ''}>
            งดออกเสียง
          </span>
          {isSelected && <Check size={12} strokeWidth={4} />}
        </button>
      </div>
    );
  }

  // ── standard: full editorial card ─────────────────────────────────────────
  return (
    <button
      onClick={handleClick}
      aria-pressed={isSelected}
      className="relative w-full rounded-3xl min-h-[44px] p-5 md:p-6 flex flex-row items-center gap-4 md:gap-5 transition-all duration-500 ease-out overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
      style={{
        backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
        boxShadow: isSelected
          ? '0 12px 40px rgba(249,115,22,0.12)'
          : '0 4px 24px rgba(61,37,73,0.04)',
        transform: isSelected ? 'scale(1.02)' : undefined,
      }}
    >
      {/* Accent stripe — left */}
      <div
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-3xl transition-all duration-500"
        style={{ backgroundColor: isSelected ? '#f97316' : 'transparent' }}
      />

      {/* Icon container */}
      <div
        className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{
          backgroundColor: isSelected ? '#f97316' : '#fff7ed',
          color: isSelected ? '#ffffff' : '#f97316',
          boxShadow: isSelected ? '0 6px 20px rgba(249,115,22,0.25)' : 'none',
        }}
      >
        <Ban size={24} strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="text-left flex-1">
        <div
          className="font-bold text-base md:text-lg leading-tight transition-colors duration-300"
          style={{ color: isSelected ? '#ea580c' : '#3d2549' }}
        >
          งดออกเสียง
        </div>
        <div
          className="text-[11px] md:text-xs font-medium mt-0.5 transition-colors duration-300"
          style={{ color: isSelected ? '#f9731680' : '#3d254960' }}
        >
          ไม่ประสงค์ลงคะแนนเสียง
        </div>
      </div>

      {/* Check badge */}
      {isSelected && (
        <div
          className="flex-shrink-0 bg-orange-500 text-white p-1.5 rounded-xl"
          style={{ boxShadow: '0 4px 16px rgba(249,115,22,0.30)' }}
        >
          <Check size={16} strokeWidth={3.5} />
        </div>
      )}
    </button>
  );
}
