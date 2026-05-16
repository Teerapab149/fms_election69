"use client";

import Navbar from '../Navbar';
import ResultCard from '../ResultCard';
import ResultsStatsBar from '../ResultsStatsBar';
import ResultsDemographics from '../ResultsDemographics';
import SiteFooter from '../SiteFooter';
import EditorElement from './editor/EditorElement';
import {
  DUMMY_RESULTS_MULTI,
  DUMMY_RESULTS_SINGLE,
  DUMMY_RESULTS_TOTALS,
  DUMMY_RESULTS_DEMOGRAPHICS
} from '../../utils/editorDummyData';
import { useGlobalConfig } from '../../contexts/GlobalConfigContext';

export default function ResultsEditorPreview({
  simMode = "multi",
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

  const status = "ENDED";
  const isRevealed = true;
  const isEnded = true;
  const isNotStarted = false;

  const Wrap = ({ id, children }) => (
    <EditorElement
      id={id}
      isSelected={selectedElement === id}
      isHovered={hoveredElement === id}
      onSelect={onSelectElement}
      onHover={onHoverElement}
      onHoverEnd={onHoverEnd}
    >
      {children}
    </EditorElement>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-12 max-w-6xl w-full mx-auto">
        <Wrap id="results-header">
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-600">REAL-TIME UPDATE</span>
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
            <Wrap key={candidate.id} id={`result-card-${index}`}>
              <ResultCard
                candidate={candidate}
                rank={index + 1}
                totalVotes={totalVotes}
                status={status}
                isRevealed={isRevealed}
                onClick={() => {}}
              />
            </Wrap>
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
