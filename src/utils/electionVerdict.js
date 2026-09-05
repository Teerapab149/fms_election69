/**
 * ตัดสินผลการเลือกตั้ง — จุดเดียวในระบบ
 *
 * ทำไมต้องมีไฟล์นี้ (2026-09-05): ตรรกะตัดสินผู้ชนะเคยถูกเขียนซ้ำในไฟล์
 * presentation ของทุกธีม ธีมละชุด ผลคือ **ผลเลือกตั้งชุดเดียวกันให้คำตอบต่างกัน
 * ตามธีมที่แอดมินเลือกไว้** พิสูจน์สดบน container แล้วทั้งสองเคส:
 *
 *   • Gumroad — `parties = filter(number > 0)` แล้วหาผู้ชนะจาก pool นั้น แปลว่า
 *     "ไม่รับรอง" ไม่เคยเข้าสมการ ป้อนพรรค 3 คะแนน vs ไม่รับรอง 10 คะแนน
 *     หน้าเว็บขึ้น "👑 ผู้ชนะ NO.1 พรรคเดียวในสนาม"
 *   • Studio Dark / Verdure — `(party.score||0) >= (disapprove.score||0)` ใช้ `>=`
 *     และไม่มีด่านเช็คว่ามีคะแนนไหม ป้อน 0 ทุกฝ่าย (ยังไม่มีใครโหวตเลย)
 *     หน้าเว็บขึ้น "It's a yes. ผลการลงคะแนน รับรอง ... ด้วยคะแนน 0 เสียง"
 *   • Blossom / Receipt — pool ถูก แต่ใช้ `>` เดินหาตัวสูงสุด พอเสมอกันจึงได้
 *     "ตัวแรกใน array" เป็นผู้ชนะเงียบ ๆ โดยไม่มีอะไรบอกว่าเสมอ
 *   • FMS Official — จัดการเสมอถูกต้อง แต่ pool รวม "งดออกเสียง" ด้วย ถ้างดออกเสียง
 *     มาเป็นที่หนึ่งมันจะได้ 🏆 ผู้ชนะ
 *
 * ตั้งแต่นี้ทุกธีมต้องเรียก resolveVerdict() ห้ามคำนวณผู้ชนะเองในไฟล์ธีม
 * ธีมมีหน้าที่ "แสดงผลที่ตัดสินมาแล้ว" ไม่ใช่ "ตัดสิน"
 *
 * ── กติกาที่ไฟล์นี้ยึด (ทุกข้อคือการตัดสินใจ ไม่ใช่ผลข้างเคียงของโค้ด) ──
 *
 * 1. งดออกเสียง (number = 0) ไม่มีวันชนะ — มันคือการไม่เลือก ไม่ใช่ตัวเลือกที่แข่ง
 *    นับรวมใน totalVotes และแสดงในตารางได้ แต่ไม่เข้า pool ตัดสิน
 * 2. ไม่รับรอง (number = -1) เข้า pool เฉพาะบัตรพรรคเดียว ตรงตาม CLAUDE.md
 *    ที่ระบุว่าใช้เฉพาะกรณีมีพรรคเดียว หลายพรรคแล้วมีแถวนี้ = ข้อมูลผิดปกติ ไม่เอามาตัดสิน
 * 3. ไม่มีคะแนนเลย = ไม่มีผล ไม่ใช่ "รับรอง" (outcome: 'no-votes')
 * 4. เสมอกันที่หัวตาราง = ไม่ประกาศใคร (outcome: 'tie')
 *
 *    ⚠️ ข้อ 4 เป็นจุดที่ต้องให้คณะกรรมการยืนยัน: ระบบเดิมแต่ละธีมเดาเอาเอง
 *    (บ้างให้รับรองชนะ บ้างเอาตัวแรกใน array) ซึ่งไม่มีอะไรรองรับ ไฟล์นี้เลือก
 *    "ไม่ตัดสิน" เพราะการประกาศผู้ชนะที่คะแนนไม่ได้รองรับคือการกล่าวอ้างเกินข้อมูล
 *    ถ้าระเบียบสโมฯ กำหนดวิธีตัดสินเสมอไว้ (เช่น จับสลาก/ให้ประธานชี้ขาด)
 *    ให้แก้ที่ไฟล์นี้ไฟล์เดียว แล้วทุกธีมเปลี่ยนตาม
 */

export const ABSTAIN_NUMBER = 0;
export const DISAPPROVE_NUMBER = -1;

const numberOf = (c) => {
  const n = parseInt(c?.number, 10);
  return Number.isNaN(n) ? null : n;
};
const scoreOf = (c) => {
  const s = Number(c?.score);
  return Number.isFinite(s) && s > 0 ? s : 0;
};

/**
 * @typedef {Object} Verdict
 * @property {'single'|'multi'|'none'} mode  พรรคเดียว / หลายพรรค / ไม่มีพรรคเลย
 * @property {boolean} revealed              เปิดเผยผลแล้วหรือยัง
 * @property {Array}   parties               ผู้สมัครที่เป็นพรรคจริง (number > 0) เรียงตามเลขพรรค
 * @property {Object|null} abstain           แถวงดออกเสียง ถ้ามี
 * @property {Object|null} disapprove        แถวไม่รับรอง ถ้ามี
 * @property {Array}   leaders               ทุกตัวที่คะแนนสูงสุดใน pool ตัดสิน (>0 เท่านั้น)
 * @property {Object|null} winner            ประกาศได้ก็ต่อเมื่อนำเดี่ยว มิฉะนั้น null
 * @property {Object|null} featured          แถวที่ควรถูกชูเป็น "ผลลัพธ์" บนหน้าจอ
 *   — รับรอง → แถวพรรค · ไม่รับรอง → แถว "ไม่รับรอง" · หลายพรรค → พรรคที่ชนะ
 *   — เสมอ / ยังไม่มีคะแนน → null (ไม่มีอะไรให้ชู ธีมต้องขึ้นข้อความสถานะแทน)
 *   ต่างจาก winner ตรงที่ featured ชี้แถว "ไม่รับรอง" ได้ ส่วน winner ไม่มีวันชี้
 *   เพราะการไม่รับรองไม่ใช่ผู้ชนะ มันคือการที่ไม่มีผู้ชนะ
 * @property {boolean} tie                   เสมอกันที่หัวตาราง
 * @property {boolean|null} approved         บัตรพรรคเดียว: รับรอง/ไม่รับรอง — null = ตัดสินไม่ได้
 * @property {'winner'|'approved'|'disapproved'|'tie'|'no-votes'|null} outcome
 */

/**
 * @param {Array} candidates  แถวผู้สมัครจาก /api/results (ต้องมี number, score)
 * @param {{revealed?: boolean}} [opts]  ยังไม่เปิดผล → คืนโครงเปล่าที่ปลอดภัย
 * @returns {Verdict}
 */
export function resolveVerdict(candidates, { revealed = false } = {}) {
  const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];

  const parties = list
    .filter((c) => (numberOf(c) ?? 0) > 0)
    .sort((a, b) => (numberOf(a) ?? 0) - (numberOf(b) ?? 0));
  const abstain = list.find((c) => numberOf(c) === ABSTAIN_NUMBER) || null;
  const disapprove = list.find((c) => numberOf(c) === DISAPPROVE_NUMBER) || null;

  const mode = parties.length === 0 ? 'none' : parties.length === 1 ? 'single' : 'multi';

  const base = {
    mode,
    revealed: !!revealed,
    parties,
    abstain,
    disapprove,
    leaders: [],
    winner: null,
    featured: null,
    tie: false,
    approved: null,
    outcome: null,
  };

  // ยังไม่เปิดผล = ยังไม่มีอะไรให้ตัดสิน และต้องไม่รั่วลำดับใด ๆ ออกไป
  if (!revealed || mode === 'none') return base;

  // pool ตัดสิน: พรรคทั้งหมด + "ไม่รับรอง" เฉพาะบัตรพรรคเดียว · งดออกเสียงไม่เคยอยู่ในนี้
  const pool = mode === 'single' && disapprove ? [...parties, disapprove] : [...parties];

  const topScore = pool.reduce((max, c) => Math.max(max, scoreOf(c)), 0);
  if (topScore === 0) {
    // ไม่มีใครได้คะแนนเลย — ไม่ประกาศอะไรทั้งสิ้น (เดิม studio-dark/verdure ตอบ "รับรอง" ตรงนี้)
    return { ...base, outcome: 'no-votes' };
  }

  const leaders = pool.filter((c) => scoreOf(c) === topScore);
  const tie = leaders.length > 1;
  const top = tie ? null : leaders[0];

  if (mode === 'single') {
    if (tie) return { ...base, leaders, tie: true, outcome: 'tie' };
    const approved = numberOf(top) > 0;
    return {
      ...base,
      leaders,
      winner: approved ? top : null,
      // ไม่รับรองชนะ → ชูแถว "ไม่รับรอง" เป็นผลลัพธ์ ไม่ใช่ปล่อยหน้าว่างหรือชูพรรคที่แพ้
      featured: top,
      approved,
      outcome: approved ? 'approved' : 'disapproved',
    };
  }

  // หลายพรรค: เสมอกันไม่ประกาศใคร
  if (tie) return { ...base, leaders, tie: true, outcome: 'tie' };
  return { ...base, leaders, winner: top, featured: top, outcome: 'winner' };
}

/**
 * ป้ายชื่อมาตรฐานของแถวผลคะแนน — ธีมเคยเขียนสูตรนี้ซ้ำกันคนละบรรทัด
 * @returns {string} ชื่อพรรค / "งดออกเสียง" / "ไม่รับรอง"
 */
export function candidateLabel(c) {
  const n = numberOf(c);
  if (n !== null && n > 0) return c?.name || '';
  return n === ABSTAIN_NUMBER ? 'งดออกเสียง' : 'ไม่รับรอง';
}
