import { test } from "node:test";
import assert from "node:assert/strict";
import { liveSystemStatus } from "../../src/lib/election/systemStatus.mjs";

// The block app/page.js had inline before it moved to liveSystemStatus, copied
// verbatim as the reference: the move must not change a single answer.
function before({ systemMode, start, end, now }) {
  const sysMode = systemMode || "AUTO";
  let isSystemOpen = false;
  let electionStatus = "WAITING";
  if (sysMode === "MANUAL_OPEN") { isSystemOpen = true; electionStatus = "ONGOING"; }
  else if (sysMode === "PAUSE") { isSystemOpen = false; electionStatus = "CLOSED"; }
  else if (sysMode === "ENDED") { isSystemOpen = false; electionStatus = "ENDED"; }
  else {
    if (now < start) { isSystemOpen = false; electionStatus = "WAITING"; }
    else if (now >= end) { isSystemOpen = false; electionStatus = "ENDED"; }
    else { isSystemOpen = true; electionStatus = "ONGOING"; }
  }
  return { isSystemOpen, electionStatus };
}

const START = new Date("2027-02-06T08:30:00+07:00");
const END = new Date("2027-02-06T17:00:00+07:00");
const NOWS = {
  beforeStart: START.getTime() - 60e3,
  atStart: START.getTime(),
  during: START.getTime() + 3600e3,
  atEnd: END.getTime(),
  afterEnd: END.getTime() + 60e3,
};

test("same answer as the inline block it replaced, for every mode and moment", () => {
  for (const systemMode of ["AUTO", "MANUAL_OPEN", "PAUSE", "ENDED", undefined]) {
    for (const [label, now] of Object.entries(NOWS)) {
      assert.deepEqual(
        liveSystemStatus({ systemMode, start: START, end: END, now }),
        before({ systemMode, start: START, end: END, now }),
        `${systemMode} @ ${label}`
      );
    }
  }
});
test("AUTO follows the schedule; the other modes override it", () => {
  assert.equal(liveSystemStatus({ start: START, end: END, now: NOWS.during }).isSystemOpen, true);
  assert.equal(liveSystemStatus({ start: START, end: END, now: NOWS.atEnd }).electionStatus, "ENDED");
  assert.equal(liveSystemStatus({ systemMode: "MANUAL_OPEN", start: START, end: END, now: NOWS.afterEnd }).isSystemOpen, true);
  assert.equal(liveSystemStatus({ systemMode: "PAUSE", start: START, end: END, now: NOWS.during }).isSystemOpen, false);
});
