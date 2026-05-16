"use client";

import HeroBlock from "./HeroBlock";
import StatsBlock from "./StatsBlock";
import MeetCandidatesBlock from "./MeetCandidatesBlock";
import ElectionBannerBlock from "./ElectionBannerBlock";
import VoteCTABlock from "./VoteCTABlock";

// Map type string → component
const BLOCK_MAP = {
  hero:            HeroBlock,
  stats:           StatsBlock,
  meetCandidates:  MeetCandidatesBlock,
  electionBanner:  ElectionBannerBlock,
  voteCTA:         VoteCTABlock,
};

// BlockRenderer — วนลูป blocks[], กรอง visible, เรียงตาม order, render ตาม type
// blocks: HomeBlock[] จาก pageLayout.home
// data:   object ที่แต่ละ block component ดึง props จาก (session, stats, initialData, ...)
export default function BlockRenderer({ blocks = [], data = {} }) {
  const sorted = [...blocks]
    .filter((b) => b.visible !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map((block) => {
        const Component = BLOCK_MAP[block.type];
        if (!Component) return null;
        return (
          <Component
            key={block.type}
            config={block.config || {}}
            data={data}
          />
        );
      })}
    </>
  );
}
