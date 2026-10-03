import { test } from "node:test";
import assert from "node:assert/strict";
import { liveSystemStatus, voteRefusal, resultsStatus } from "../../src/lib/election/systemStatus.mjs";

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

// ── T7 (2026-09-30): the four API routes moved onto this file ───────────────
// Each route's OLD inline block, copied verbatim (only the input plumbing is
// wrapped in a function), is the oracle: the move must not change one answer
// for any mode, moment, reveal flag or schedule shape — including modes the
// admin UI cannot set (null, "", "OPEN") and a corrupt inverted schedule.

// api/check-status/route.js before T7 (config.systemMode → sysMode, AUTO ladder)
function oldCheckStatus(config, { ELECTION_START, ELECTION_END }, now) {
    const sysMode = config.systemMode || "AUTO";

    let isSystemOpen = false;
    let electionStatus = "WAITING";

    if (sysMode === "MANUAL_OPEN") {
      isSystemOpen = true;
      electionStatus = "ONGOING";
    } else if (sysMode === "PAUSE") {
      isSystemOpen = false;
      electionStatus = "CLOSED";
    } else if (sysMode === "ENDED") {
      isSystemOpen = false;
      electionStatus = "ENDED";
    } else {
      // AUTO
      if (now < ELECTION_START) {
        isSystemOpen = false; // Voting page will redirect for now, which is expected behavior for 'restricted' pages
        electionStatus = "WAITING";
      } else if (now >= ELECTION_END) {
        isSystemOpen = false;
        electionStatus = "ENDED";
      } else {
        isSystemOpen = true;
        electionStatus = "ONGOING";
      }
    }
    return { isSystemOpen, systemMode: sysMode, electionStatus };
}

// api/home-info/route.js before T7
function oldHomeInfo(config, { ELECTION_START, ELECTION_END }, now) {
    const sysMode = config.systemMode || "AUTO";

    let isSystemOpen = false;
    let electionStatus = "WAITING";

    if (sysMode === "MANUAL_OPEN") {
      isSystemOpen = true;
      electionStatus = "ONGOING";
    } else if (sysMode === "PAUSE") {
      isSystemOpen = false;
      electionStatus = "CLOSED";
    } else if (sysMode === "ENDED") {
      isSystemOpen = false;
      electionStatus = "ENDED";
    } else {
      // AUTO
      if (now < ELECTION_START) {
        isSystemOpen = false;
        electionStatus = "WAITING";
      } else if (now >= ELECTION_END) {
        isSystemOpen = false;
        electionStatus = "ENDED";
      } else {
        isSystemOpen = true;
        electionStatus = "ONGOING";
      }
    }
    return { isSystemOpen, systemMode: sysMode, electionStatus };
}

// api/vote/route.js before T7, after the CERTIFIED check (which stays in the
// route): returns the refusal code, or null when the vote goes on.
function oldVote(systemConfig, { ELECTION_START, ELECTION_END }, now) {
    const mode = systemConfig?.systemMode || "AUTO";
    const refuse = (code) => code;

    // 0.1 Check Manual Modes First
    if (mode === "PAUSE") {
      return refuse("PAUSED", "ระบบหยุดรับลงคะแนนชั่วคราว", 403);
    }

    if (mode === "ENDED") {
      return refuse("ENDED", "ปิดหีบแล้ว ไม่รับลงคะแนนเพิ่ม", 403);
    }

    if (mode === "MANUAL_OPEN") {
      // Pass: Voting is forced open, ignore time check
    }

    // 0.2 Check Auto Mode (Scheduled Time)
    if (mode === "AUTO") {
      if (now < ELECTION_START) {
        return refuse("NOT_STARTED", "ยังไม่ถึงเวลาเปิดหีบ", 403);
      }
      if (now >= ELECTION_END) {
        return refuse("AUTO_CLOSED", "ปิดหีบแล้ว ไม่รับลงคะแนนเพิ่ม", 403);
      }
    }
    return null;
}

// api/results/route.js buildResultsBody before T7 (status only: isPreCampaign
// was computed but never put in the body).
function oldResults(systemConfig, { CAMPAIGN_START, ELECTION_START, ELECTION_END }, now) {
  let status = "WAITING";
  let isPreCampaign = false;

  if (now >= ELECTION_END) {
    status = "ENDED";
  } else if (now >= ELECTION_START) {
    status = "ONGOING";
  } else if (now >= CAMPAIGN_START) {
    status = "WAITING";
  } else {
    status = "PRE_CAMPAIGN";
    isPreCampaign = true;
  }

  // ⚡️ NEW SYSTEM MODES LOGIC: (systemConfig already fetched above for dates)
  const mode = systemConfig?.systemMode || "AUTO";
  const isShowResult = systemConfig?.showResult;

  if (mode === "PAUSE") {
    status = "CLOSED";
  } else if (mode === "ENDED") {
    status = "ENDED";
  } else if (mode === "MANUAL_OPEN") {
    status = "ONGOING";
  } else if (mode === "AUTO") {
    // Keep time-based status calculated at the top
  }

  // 🔵 Show Result Mode Override (Unless strictly CLOSED)
  if (isShowResult && status !== "CLOSED") {
    if (status !== "ENDED") {
      status = "ONGOING";
    }
  }

  if (status === "ONGOING" || status === "ENDED") {
    isPreCampaign = false;
  }
  void isPreCampaign;
  return { status };
}

// What lib/election/liveStatus.js readElectionState does with the row (it
// imports utils/electionConfig.js, which plain node cannot load, so its two
// lines are mirrored here): normalise the mode, then liveSystemStatus.
function newState(config, d, now) {
  const systemMode = config?.systemMode || "AUTO";
  const { isSystemOpen, electionStatus } = liveSystemStatus({
    systemMode, start: d.ELECTION_START, end: d.ELECTION_END, now,
  });
  return { isSystemOpen, systemMode, electionStatus };
}

const H = 3600e3;
const at = (iso) => new Date(iso);
const SCHEDULES = {
  normal: {
    CAMPAIGN_START: at("2027-02-01T08:00:00+07:00"),
    ELECTION_START: at("2027-02-06T08:30:00+07:00"),
    ELECTION_END: at("2027-02-06T17:00:00+07:00"),
  },
  // corrupt: end before start (resolveElectionDates warns but does not throw)
  inverted: {
    CAMPAIGN_START: at("2027-02-01T08:00:00+07:00"),
    ELECTION_START: at("2027-02-06T17:00:00+07:00"),
    ELECTION_END: at("2027-02-06T08:30:00+07:00"),
  },
  campaignAfterStart: {
    CAMPAIGN_START: at("2027-02-06T12:00:00+07:00"),
    ELECTION_START: at("2027-02-06T08:30:00+07:00"),
    ELECTION_END: at("2027-02-06T17:00:00+07:00"),
  },
};
function momentsFor(d) {
  const c = d.CAMPAIGN_START.getTime(), s = d.ELECTION_START.getTime(), e = d.ELECTION_END.getTime();
  return {
    beforeCampaign: c - H,
    campaign: c + 1,
    beforeStart: s - 60e3,
    atStart: s,
    during: s + H,
    atEnd: e,
    afterEnd: e + 60e3,
    // every boundary +-1 ms, so an off-by-one (< vs <=) cannot hide
    cMinus: c - 1, sMinus: s - 1, sPlus: s + 1, eMinus: e - 1, ePlus: e + 1,
  };
}
const MODES = ["AUTO", "MANUAL_OPEN", "PAUSE", "ENDED", null, "", "OPEN", undefined];
const SHOW = [true, false];

function* matrix() {
  for (const [sched, d] of Object.entries(SCHEDULES)) {
    for (const [moment, now] of Object.entries(momentsFor(d))) {
      for (const systemMode of MODES) {
        for (const showResult of SHOW) {
          yield { label: `${sched} ${moment} mode=${JSON.stringify(systemMode)} show=${showResult}`, d, now, config: { systemMode, showResult } };
        }
      }
    }
  }
}

test("check-status + home-info: readElectionState == the old inline blocks", () => {
  let n = 0;
  for (const { label, d, now, config } of matrix()) {
    const got = newState(config, d, now);
    assert.deepEqual(got, oldCheckStatus(config, d, now), `check-status ${label}`);
    assert.deepEqual(got, oldHomeInfo(config, d, now), `home-info ${label}`);
    n++;
  }
  assert.ok(n >= 3 * 7 * 7 * 2, `matrix too small: ${n}`);
});

test("vote: voteRefusal == the old inline ladder (codes)", () => {
  for (const { label, d, now, config } of matrix()) {
    const mode = config?.systemMode || "AUTO"; // the route's normalisation
    assert.equal(
      voteRefusal({ systemMode: mode, start: d.ELECTION_START, end: d.ELECTION_END, now }),
      oldVote(config, d, now),
      `vote ${label}`
    );
  }
});

test("results: resultsStatus == the old buildResultsBody ladder", () => {
  for (const { label, d, now, config } of matrix()) {
    assert.deepEqual(
      resultsStatus({
        systemMode: config?.systemMode || "AUTO",
        start: d.ELECTION_START,
        end: d.ELECTION_END,
        campaignStart: d.CAMPAIGN_START,
        showResult: config.showResult,
        now,
      }),
      oldResults(config, d, now),
      `results ${label}`
    );
  }
});

test("the differences between the ladders are the ones documented", () => {
  const d = SCHEDULES.inverted;
  const now = d.ELECTION_END.getTime() + H; // after end, before start
  // inverted schedule: the live verdict reads the start first, results the end first
  assert.equal(liveSystemStatus({ start: d.ELECTION_START, end: d.ELECTION_END, now }).electionStatus, "WAITING");
  assert.equal(resultsStatus({ systemMode: "AUTO", start: d.ELECTION_START, end: d.ELECTION_END, campaignStart: d.CAMPAIGN_START, now }).status, "ENDED");
  // an unknown mode string: the live verdict follows the schedule, the vote gate does not refuse
  const n = SCHEDULES.normal;
  const after = n.ELECTION_END.getTime() + H;
  assert.equal(liveSystemStatus({ systemMode: "OPEN", start: n.ELECTION_START, end: n.ELECTION_END, now: after }).electionStatus, "ENDED");
  assert.equal(voteRefusal({ systemMode: "OPEN", start: n.ELECTION_START, end: n.ELECTION_END, now: after }), null);
});
