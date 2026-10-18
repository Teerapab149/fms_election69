import { db } from "../../../../lib/db";

/**
 * เงื่อนไขเดียวที่ตัดสินว่าโครงสร้างบัตรถูกล็อกแล้วหรือยัง
 *
 * ใช้ร่วมกันสองที่ เพื่อไม่ให้มีสองความจริง:
 *   - ballotBoxGuard ใน route.js (ปฏิเสธตอนบันทึก, ตอบ 409)
 *   - GET /api/admin/ballot-lock (ให้หน้าฟอร์มรู้ล่วงหน้า จะได้ไม่ให้กรอกจนจบแล้วค่อยถูกปฏิเสธ)
 *
 * ล็อกเมื่อ (1) รับรองผลแล้ว (globalConfig.ballotsAnonymized) หรือ (2) มีแถวใน Ballot
 * ลำดับการตรวจต้องเป็นรับรองผลก่อนเสมอ ข้อความที่ผู้ใช้เห็นต่างกันตามเหตุผล
 *
 * @returns {Promise<{ locked: boolean, reason: "anonymized" | "ballots" | null, ballots: number }>}
 */
export async function getBallotLock() {
  const [ballots, cfg] = await Promise.all([
    db.ballot.count(),
    db.systemConfig.findUnique({ where: { id: 1 }, select: { globalConfig: true } }),
  ]);

  if (cfg?.globalConfig?.ballotsAnonymized) {
    return { locked: true, reason: "anonymized", ballots };
  }
  if (ballots > 0) {
    return { locked: true, reason: "ballots", ballots };
  }
  return { locked: false, reason: null, ballots };
}
