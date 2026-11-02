// src/lib/certificationRecord.js, what "certified" pins down, and how to check it.
//
// Certifying used to set one flag. Nothing recorded WHAT was certified, so a
// number changed in the database afterwards could not be told from the real
// result. The certification step now writes three more keys into
// SystemConfig.globalConfig, in the same transaction that holds the ballot-box
// lock, so they describe one frozen instant:
//
//   certifiedTally      [{ number, name, score }] for every option on the ballot
//   certifiedBallots    how many ballots were in the box
//   certifiedChainHead  the rowHash of the last ballot ("GENESIS" for an empty box)
//
// Staff keep a copy outside the system (formatCertifiedRecordText), and
// scripts/verify-ballot-chain.js compares the live database against these keys.
//
// Pure, no imports: CommonJS so the web app (import) and the node scripts
// (require) load the same code, and node:test loads it directly.

const CERT_KEYS = [
  "ballotsAnonymized",
  "certifiedAt",
  "certifiedBy",
  "certifiedByUsername",
  "certifiedTally",
  "certifiedBallots",
  "certifiedChainHead",
];

// the keys added by the snapshot (the first four predate it)
const RECORD_KEYS = ["certifiedTally", "certifiedBallots", "certifiedChainHead"];

/**
 * @param {{ candidates: {number:number, name:string, score:number|null}[],
 *           ballots: number, head: string }} input
 */
function buildCertifiedRecord({ candidates, ballots, head }) {
  const tally = [...candidates]
    .sort((a, b) => a.number - b.number)
    .map((c) => ({ number: c.number, name: c.name, score: c.score || 0 }));
  return { certifiedTally: tally, certifiedBallots: ballots, certifiedChainHead: head };
}

/** Why the box cannot be certified, in plain Thai, from a verifyChain() result. */
function explainVerifyFailure(verdict) {
  const byName = Object.fromEntries((verdict?.checks || []).map((c) => [c.name, c]));
  const tail = "ให้เจ้าหน้าที่ IT ตรวจด้วย scripts/verify-ballot-chain.js ก่อน แล้วค่อยรับรองใหม่";
  if (byName["chain-integrity"] && !byName["chain-integrity"].ok) {
    const at = verdict.firstBreak?.seq;
    return `โซ่ของบัตรในหีบไม่ผ่านการตรวจ${at != null ? ` (ผิดปกติที่บัตรลำดับที่ ${at})` : ""} จึงรับรองผลไม่ได้ ${tail}`;
  }
  if (byName["head-matches"] && !byName["head-matches"].ok) {
    return `ปลายโซ่ที่บันทึกไว้ไม่ตรงกับบัตรใบสุดท้ายในหีบ จึงรับรองผลไม่ได้ ${tail}`;
  }
  const c = verdict?.counts || {};
  return `จำนวนบัตรในหีบ ${c.ballots} ใบ คะแนนรวมทุกพรรค ${c.scoreSum} คะแนน และผู้ที่ลงคะแนนแล้ว ${c.voted} คน ต้องเท่ากันทั้งสามค่า จึงรับรองผลไม่ได้ ${tail}`;
}

/**
 * The record as the admin screen and the exported copy show it, or null when the
 * election is certified without one (certified before this existed) or not at all.
 */
function readCertifiedRecord(globalConfig) {
  const gc = globalConfig || {};
  if (!gc.ballotsAnonymized || !Array.isArray(gc.certifiedTally)) return null;
  return {
    certifiedAt: gc.certifiedAt ?? null,
    certifiedBy: gc.certifiedBy ?? null,
    certifiedTally: gc.certifiedTally,
    certifiedBallots: gc.certifiedBallots ?? null,
    certifiedChainHead: gc.certifiedChainHead ?? null,
  };
}

/**
 * Compare the live database with what was certified.
 * @param {object} globalConfig  SystemConfig.globalConfig
 * @param {{ candidates: {number:number, name:string, score:number|null}[], ballots: number, head: string }} current
 * @returns {{ state: "none"|"legacy"|"match"|"mismatch", differences: string[] }}
 *   none      not certified, nothing to compare
 *   legacy    certified before the record existed, nothing to compare
 *   match     every certified number equals the live one
 *   mismatch  something changed after certification
 */
function compareToCertified(globalConfig, current) {
  const gc = globalConfig || {};
  if (!gc.ballotsAnonymized) return { state: "none", differences: [] };
  const missing = RECORD_KEYS.filter((k) => gc[k] === undefined || gc[k] === null);
  if (missing.length === RECORD_KEYS.length) return { state: "legacy", differences: [] };

  const differences = [];
  if (missing.length) {
    differences.push(`ค่าที่บันทึกตอนรับรองไม่ครบ (ขาด ${missing.join(", ")})`);
  }

  if (Array.isArray(gc.certifiedTally)) {
    const live = new Map(current.candidates.map((c) => [c.number, c]));
    const seen = new Set();
    for (const c of gc.certifiedTally) {
      seen.add(c.number);
      const now = live.get(c.number);
      if (!now) {
        differences.push(`ตัวเลือกเบอร์ ${c.number} (${c.name}) รับรองไว้ ${c.score} คะแนน แต่ตอนนี้ไม่มีในระบบ`);
      } else if ((now.score || 0) !== c.score) {
        differences.push(`ตัวเลือกเบอร์ ${c.number} (${c.name}) รับรองไว้ ${c.score} คะแนน ตอนนี้ ${now.score || 0} คะแนน`);
      }
    }
    for (const now of current.candidates) {
      if (!seen.has(now.number)) {
        differences.push(`ตัวเลือกเบอร์ ${now.number} (${now.name}) ไม่อยู่ในรายการที่รับรองไว้ ตอนนี้มี ${now.score || 0} คะแนน`);
      }
    }
  }
  if (gc.certifiedBallots != null && gc.certifiedBallots !== current.ballots) {
    differences.push(`จำนวนบัตรรับรองไว้ ${gc.certifiedBallots} ใบ ตอนนี้ ${current.ballots} ใบ`);
  }
  if (gc.certifiedChainHead != null && gc.certifiedChainHead !== current.head) {
    differences.push(`ปลายโซ่บัตรรับรองไว้ ${gc.certifiedChainHead.slice(0, 16)}... ตอนนี้ ${String(current.head).slice(0, 16)}...`);
  }
  return { state: differences.length ? "mismatch" : "match", differences };
}

/** Plain text staff can paste into a document and keep outside the system. */
function formatCertifiedRecordText(record, { electionName } = {}) {
  const lines = [];
  lines.push(`บันทึกตัวเลขที่รับรองผล${electionName ? ` ${electionName}` : ""}`);
  if (record.certifiedAt) lines.push(`รับรองเมื่อ: ${record.certifiedAt}`);
  if (record.certifiedBy) lines.push(`รับรองโดย: ${record.certifiedBy}`);
  lines.push("");
  lines.push("คะแนนรายตัวเลือก (เบอร์ ชื่อ คะแนน):");
  for (const c of record.certifiedTally) lines.push(`  ${c.number}  ${c.name}  ${c.score}`);
  lines.push("");
  lines.push(`จำนวนบัตรในหีบ: ${record.certifiedBallots}`);
  lines.push(`ปลายโซ่บัตร: ${record.certifiedChainHead}`);
  lines.push("");
  lines.push("ตรวจเทียบกับฐานข้อมูลได้ด้วยคำสั่ง node scripts/verify-ballot-chain.js");
  return lines.join("\n");
}

module.exports = {
  CERT_KEYS,
  RECORD_KEYS,
  buildCertifiedRecord,
  explainVerifyFailure,
  readCertifiedRecord,
  compareToCertified,
  formatCertifiedRecordText,
};
