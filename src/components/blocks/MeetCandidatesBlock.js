"use client";

import MeetCandidatesCard from "../MeetCandidatesCard";

// MeetCandidatesBlock — wrapper รอบ MeetCandidatesCard
// config props: (ยังไม่มี config เฉพาะ, reserved สำหรับ Phase 4)
export default function MeetCandidatesBlock({ config = {} }) {
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 pt-0 pb-4 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
      <MeetCandidatesCard />
    </div>
  );
}
