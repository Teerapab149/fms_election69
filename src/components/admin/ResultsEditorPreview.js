"use client";

import { useRef, useCallback } from 'react';
import Navbar from '../Navbar';
import ResultCard from '../ResultCard';
import ResultsStatsBar from '../ResultsStatsBar';
import ResultsDemographics from '../ResultsDemographics';
import SiteFooter from '../SiteFooter';
import EditorElement from './editor/EditorElement';
import GumroadResults from '../vote/GumroadResults';
import StudioDarkResults from '../vote/StudioDarkResults';
import VerdureResults from '../vote/VerdureResults';
import {
  DUMMY_RESULTS_MULTI,
  DUMMY_RESULTS_SINGLE,
  DUMMY_RESULTS_TOTALS,
  DUMMY_RESULTS_DEMOGRAPHICS
} from '../../utils/editorDummyData';
import { useGlobalConfig } from '../../contexts/GlobalConfigContext';

export default function ResultsEditorPreview({
  simMode = "multi",
  revealed = true, // false → "ปิดผล" locked state (scores hidden, polls ongoing)
  templateSlug = null,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null
}) {
  const globalConfig = useGlobalConfig();
  const candidates = simMode === "single" ? DUMMY_RESULTS_SINGLE : DUMMY_RESULTS_MULTI;
  const totalVotes = simMode === "single"
    ? DUMMY_RESULTS_TOTALS.single
    : DUMMY_RESULTS_TOTALS.multi;
  const totalEligible = DUMMY_RESULTS_DEMOGRAPHICS.totalEligible;

  const status = revealed ? "ENDED" : "ONGOING";
  const isRevealed = revealed;
  const isEnded = revealed;
  const isNotStarted = false;

  // Per-template layout: gumroad / studio-dark have their own results layouts.
  // ⚠️ hook block นี้ต้องอยู่ **เหนือ** early-return ของ template ด้านล่างเสมอ
  //
  // เดิมมันอยู่ใต้ `if (templateSlug === ...) return <ClosedLayout/>` ซึ่งแปลว่าจำนวน hook
  // ที่คอมโพเนนต์นี้เรียก เปลี่ยนไปตามค่า templateSlug — แอดมินสลับธีมทีเดียว React ก็เจอ
  // "Rendered more hooks than during the previous render" แล้วทั้ง subtree ล่ม
  // (react-hooks/rules-of-hooks จับได้ตอนเปิด lint จริงครั้งแรก 2026-09-05)
  //
  // ย้ายขึ้นมาบนสุดปลอดภัย: มันอ่านแต่ props ที่มีอยู่แล้วตั้งแต่ต้นฟังก์ชัน
  // Stable Wrap identity (see HomeContent): inline definition remounts the
  // wrapped subtree on every hover re-render → animation flicker.
  const editorStateRef = useRef(null);
  editorStateRef.current = {
    selectedElement, hoveredElement, onSelectElement, onHoverElement, onHoverEnd,
  };
  const Wrap = useCallback(({ id, children }) => {
    const s = editorStateRef.current;
    return (
      <EditorElement
        id={id}
        isSelected={s.selectedElement === id}
        isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement}
        onHover={s.onHoverElement}
        onHoverEnd={s.onHoverEnd}
      >
        {children}
      </EditorElement>
    );
  }, []);

  if (templateSlug === 'gumroad' || templateSlug === 'studio-dark' || templateSlug === 'verdure') {
    const ResultsLayout = templateSlug === 'studio-dark' ? StudioDarkResults
      : templateSlug === 'verdure' ? VerdureResults : GumroadResults;
    return (
      <ResultsLayout
        editorMode
        candidates={candidates}
        totalVotes={totalVotes}
        demographics={DUMMY_RESULTS_DEMOGRAPHICS}
        finalStatus={status}
        isRevealed={isRevealed}
        isNotStarted={isNotStarted}
        countdownText=""
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-12 max-w-6xl w-full mx-auto">
        <Wrap id="results-header">
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {/* red-600 on the tinted pill measured 4.41:1 at 12px — just under AA;
                  red-700 clears it without changing the "live" read */}
              <span className="text-xs font-bold text-red-700">REAL-TIME UPDATE</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800">
              ผลการเลือกตั้ง <span className="text-[#8A2680]">{globalConfig.electionName}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              ระบบเลือกตั้ง{globalConfig.organizationShort} {globalConfig.facultyName} ประจำปีการศึกษา {globalConfig.academicYearTh}
            </p>
          </div>
        </Wrap>

        <Wrap id="results-stats-bar">
          <ResultsStatsBar
            totalVotes={totalVotes}
            totalEligible={totalEligible}
            isNotStarted={isNotStarted}
          />
        </Wrap>

        <Wrap id="results-candidates-heading">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              🏆 สรุปผลการเลือกตั้ง (Official Results)
            </h2>
          </div>
        </Wrap>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl border sm:border-0 border-slate-100 mb-8 lg:mb-12">
          {candidates.map((candidate, index) => (
            <ResultCard
              key={candidate.id}
              candidate={candidate}
              rank={index + 1}
              totalVotes={totalVotes}
              status={status}
              isRevealed={isRevealed}
            />
          ))}
        </div>

        <Wrap id="results-demographics">
          <ResultsDemographics
            demographics={DUMMY_RESULTS_DEMOGRAPHICS}
            isMobile={false}
            isRevealed={isRevealed}
            isEnded={isEnded}
            isNotStarted={isNotStarted}
          />
        </Wrap>
      </main>

      <SiteFooter className="mt-8 lg:mt-16" />
    </div>
  );
}
