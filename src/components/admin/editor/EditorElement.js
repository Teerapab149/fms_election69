"use client";

export default function EditorElement({
  id,
  type,
  label,
  section,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onHoverEnd,
  children,
}) {
  return (
    <div
      className="relative group/editor cursor-pointer"
      data-editor-wrap="true"
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.(id);
      }}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHoverEnd?.()}
    >
      {children}

      {isHovered && !isSelected && (
        <div className="absolute inset-0 border-2 border-dashed border-[#8A2680]/40 rounded-lg pointer-events-none z-40 transition-all duration-150">
          <span className="absolute -top-6 left-1 text-[9px] font-bold text-[#8A2680] bg-white border border-[#8A2680]/20 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
            {label || id}
          </span>
        </div>
      )}

      {isSelected && (
        <div className="absolute inset-0 border-2 border-[#8A2680] rounded-lg pointer-events-none z-40 transition-all duration-150">
          <span className="absolute -top-6 left-1 text-[9px] font-bold text-white bg-[#8A2680] px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
            {label || id} ✎
          </span>
        </div>
      )}
    </div>
  );
}
