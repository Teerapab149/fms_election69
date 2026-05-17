"use client";

import MeetCandidatesCard from "../MeetCandidatesCard";

// MeetCandidatesBlock — wrapper รอบ MeetCandidatesCard
// config props: (ยังไม่มี config เฉพาะ, reserved สำหรับ Phase 4)
// editor props: passed through to MeetCandidatesCard so meet-title / meet-cta Wraps work
export default function MeetCandidatesBlock({
  config = {},
  editorMode = false,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
  elementConfigs = null,
}) {
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 pt-0 pb-4 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
      <MeetCandidatesCard
        editorMode={editorMode}
        selectedElement={selectedElement}
        hoveredElement={hoveredElement}
        onSelectElement={onSelectElement}
        onHoverElement={onHoverElement}
        onHoverEnd={onHoverEnd}
        elementConfigs={elementConfigs}
      />
    </div>
  );
}
