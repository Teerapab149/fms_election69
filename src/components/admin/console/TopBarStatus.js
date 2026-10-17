'use client';

import { WifiOff } from "lucide-react";
import { useElectionState } from "./ElectionStateContext";
import { TONES, MODE_SHORT, describeElection, formatClock, formatDuration } from "./electionStatus";

// The election's state, pinned in the top bar of every tab: a coloured pill
// (open, waiting, paused, closed), the mode, and the time left when there is
// one. Reads the shared context, so it costs no request of its own.
export default function TopBarStatus() {
  const { stats, now, failed, lastUpdated } = useElectionState();
  const view = describeElection(stats, now);
  const tone = TONES[view.tone];

  return (
    <div className="flex items-center gap-2 min-w-0" role="status" aria-live="polite">
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold whitespace-nowrap ${tone.pill}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${tone.dot}`} aria-hidden />
        {view.label}
      </span>
      {view.mode && (
        <span className="hidden sm:inline text-xs font-medium text-slate-600 whitespace-nowrap">
          โหมด {MODE_SHORT[view.mode]}
        </span>
      )}
      {view.countdown && (
        <span className="hidden md:inline text-xs text-slate-600 whitespace-nowrap tabular-nums">
          {view.countdown.label} <span className="font-semibold text-slate-900">{formatDuration(view.countdown.ms)}</span>
        </span>
      )}
      {failed && (
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 whitespace-nowrap"
          title={lastUpdated ? `อ่านสถานะได้ล่าสุด ${formatClock(lastUpdated)}` : undefined}
        >
          <WifiOff className="w-3.5 h-3.5" aria-hidden />
          <span className="max-sm:sr-only">เชื่อมต่อไม่ได้</span>
        </span>
      )}
    </div>
  );
}
