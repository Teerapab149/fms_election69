"use client";

import PartyCard from "../PartyCard";
import { Ban, Check } from "lucide-react";
import EditorElement from '../admin/editor/EditorElement';
import { SIZE_MAP, RADIUS_MAP, WEIGHT_MAP } from '../../utils/styleMaps';

export default function MultiPartyView({
  regularParties,
  specialOptions,
  selectedPartyId,
  onSelect,
  onViewDetails,
  config = {},
  editorMode = false,
  elementConfigs = null,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const Wrap = ({ id, children }) => editorMode ? (
    <EditorElement
      id={id}
      config={elementConfigs?.[id]}
      isSelected={selectedElement === id}
      isHovered={hoveredElement === id}
      onSelect={onSelectElement}
      onHover={onHoverElement}
      onHoverEnd={onHoverEnd}
    >{children}</EditorElement>
  ) : children;

  const cfg = (id, defaults = {}) => editorMode
    ? { ...defaults, ...(elementConfigs?.[id]?.config || {}) }
    : defaults;

  const partyCount = regularParties.length;

  const {
    gridCols = "auto",
    cardVariant = "auto",
    showDivider = true,
    abstainStyle = "auto"
  } = config;

  const resolvedCardVariant = cardVariant === "auto"
    ? (partyCount <= 3 ? "grid" : "compact")
    : cardVariant;

  const resolvedAbstainStyle = abstainStyle === "auto"
    ? (partyCount <= 3 ? "standard" : "compact")
    : abstainStyle;

  const getGridClasses = () => {
    switch (gridCols) {
      case "2": return "grid-cols-1 sm:grid-cols-2";
      case "3": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      default:  
        if (partyCount <= 2) return "grid-cols-1 sm:grid-cols-2";
        if (partyCount <= 4) return "grid-cols-1 sm:grid-cols-2";
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  };

  return (
    <div className="w-full">
      
      <div className="text-center mb-8 space-y-2">
        <Wrap id="vote-header-title">
          <h1 style={{
            color: cfg('vote-header-title').color || '#1e293b',
            fontSize: SIZE_MAP[cfg('vote-header-title').fontSize] || '1.875rem',
            fontWeight: WEIGHT_MAP[cfg('vote-header-title').fontWeight] || cfg('vote-header-title').fontWeight || 800,
            textAlign: cfg('vote-header-title').align || 'center',
          }}>
            {cfg('vote-header-title').text || 'เลือกตั้งสโมสรนักศึกษา'}
          </h1>
        </Wrap>

        <Wrap id="vote-header-subtitle">
          <p style={{
            color: cfg('vote-header-subtitle').color || '#64748b',
            fontSize: SIZE_MAP[cfg('vote-header-subtitle').fontSize] || '0.875rem',
            fontWeight: WEIGHT_MAP[cfg('vote-header-subtitle').fontWeight] || cfg('vote-header-subtitle').fontWeight || 400,
            textAlign: cfg('vote-header-subtitle').align || 'center',
          }}>
            {cfg('vote-header-subtitle').text || 'คลิกเลือกพรรคที่คุณต้องการ หรือเลือกงดออกเสียง'}
          </p>
        </Wrap>
      </div>

      <div className={`grid ${getGridClasses()} gap-3 sm:gap-4 lg:gap-6 max-w-2xl mx-auto`}>
        {regularParties.map((party, index) => {
          const cardInner = (
            <PartyCard
              party={party}
              isSelected={selectedPartyId === party.id}
              onSelect={onSelect}
              onViewDetails={onViewDetails}
              variant={resolvedCardVariant}
            />
          );
          return (
            <div
              key={party.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
            >
              {index === 0 && editorMode ? (
                <Wrap id="vote-party-card">{cardInner}</Wrap>
              ) : cardInner}
            </div>
          );
        })}
      </div>

      {showDivider && (
        <div className="flex items-center gap-4 py-6 max-w-xs mx-auto opacity-60">
          <div className="h-px bg-slate-300 flex-1"></div>
          <Wrap id="vote-divider-text">
            <span style={{
              color: cfg('vote-divider-text').color || '#64748b',
              fontSize: SIZE_MAP[cfg('vote-divider-text').fontSize] || '0.625rem',
            }} className="font-bold uppercase tracking-wider">
              {cfg('vote-divider-text').text || 'หรือ'}
            </span>
          </Wrap>
          <div className="h-px bg-slate-300 flex-1"></div>
        </div>
      )}
      {!showDivider && <div className="h-4" />}

      {resolvedAbstainStyle === "standard" && (
        <div className="max-w-md mx-auto px-4">
          <Wrap id="vote-abstain-button">
            <button onClick={() => onSelect(specialOptions.abstain.id)}
              style={editorMode ? {
                backgroundColor: cfg('vote-abstain-button').backgroundColor || undefined,
                color: cfg('vote-abstain-button').textColor || undefined,
                borderRadius: RADIUS_MAP[cfg('vote-abstain-button').borderRadius] || undefined,
                borderColor: cfg('vote-abstain-button').borderColor || undefined,
              } : undefined}
              className={`relative w-full rounded-2xl p-4 flex items-center justify-center gap-3
              transition-all duration-300 border-2
              ${selectedPartyId === specialOptions.abstain.id
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200/50 scale-[1.02]'
                : 'bg-white border-slate-100 text-slate-700 hover:border-orange-300 hover:shadow-md'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${selectedPartyId === specialOptions.abstain.id ? 'bg-white/20' : 'bg-orange-50 text-orange-600'}`}>
                <Ban size={22} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <div className="font-bold text-base leading-tight">
                  {cfg('vote-abstain-button').text || 'งดออกเสียง'}
                </div>
                <div className="text-[10px] opacity-70">ไม่ประสงค์ลงคะแนนเสียง</div>
              </div>
              {selectedPartyId === specialOptions.abstain.id && (
                <div className="absolute top-2 right-2 bg-white text-orange-600 p-0.5 rounded-full">
                  <Check size={12} strokeWidth={4} />
                </div>
              )}
            </button>
          </Wrap>
        </div>
      )}

      {resolvedAbstainStyle === "compact" && (
        <div className="flex justify-center">
          <Wrap id="vote-abstain-button">
            <button onClick={() => onSelect(specialOptions.abstain.id)}
              style={editorMode ? {
                backgroundColor: cfg('vote-abstain-button').backgroundColor || undefined,
                color: cfg('vote-abstain-button').textColor || undefined,
                borderRadius: RADIUS_MAP[cfg('vote-abstain-button').borderRadius] || undefined,
                borderColor: cfg('vote-abstain-button').borderColor || undefined,
              } : undefined}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full
              transition-all duration-300 border
              ${selectedPartyId === specialOptions.abstain.id
                ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}>
              <Ban size={18} strokeWidth={2.5} />
              <span className="font-bold text-sm">
                {cfg('vote-abstain-button').text || 'งดออกเสียง'}
              </span>
              {selectedPartyId === specialOptions.abstain.id && (
                <Check size={14} strokeWidth={3} className="text-white" />
              )}
            </button>
          </Wrap>
        </div>
      )}

      {resolvedAbstainStyle === "minimal" && (
        <div className="flex justify-center py-2">
          <Wrap id="vote-abstain-button">
            <button onClick={() => onSelect(specialOptions.abstain.id)}
              style={editorMode ? {
                backgroundColor: cfg('vote-abstain-button').backgroundColor || undefined,
                color: cfg('vote-abstain-button').textColor || undefined,
                borderRadius: RADIUS_MAP[cfg('vote-abstain-button').borderRadius] || undefined,
                borderColor: cfg('vote-abstain-button').borderColor || undefined,
              } : undefined}
              className={`inline-flex items-center gap-2 px-4 py-2 transition-all
              ${selectedPartyId === specialOptions.abstain.id
                ? 'text-orange-600 font-bold'
                : 'text-slate-400 hover:text-orange-500 hover:underline'}`}>
              <Ban size={16} strokeWidth={2} />
              <span className="text-sm font-medium">
                {cfg('vote-abstain-button').text || 'งดออกเสียง'}
              </span>
            </button>
          </Wrap>
        </div>
      )}
    </div>
  );
}