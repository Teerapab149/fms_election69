"use client";

import { useEffect, useState } from "react";
import { getPath } from "../utils/basePath";

/**
 * ถามเซิร์ฟเวอร์ว่าโครงสร้างบัตรถูกล็อกหรือยัง (มีบัตรในหีบแล้ว หรือรับรองผลแล้ว)
 * ใช้ปิดช่องหมายเลขพรรคและปุ่มลบพรรค ตั้งแต่ยังไม่กรอก
 *
 * เซิร์ฟเวอร์ยังเป็นด่านจริงเสมอ (ballotBoxGuard) hook นี้แค่บอกล่วงหน้า
 * ถ้าถามไม่สำเร็จจึงถือว่ายังไม่ล็อก ปล่อยให้ด่านฝั่งเซิร์ฟเวอร์ตัดสินตอนบันทึก
 */
export default function useBallotLock(enabled = true) {
  const [state, setState] = useState({ locked: false, reason: null, ballots: 0, loading: false, failed: false });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, failed: false }));
    (async () => {
      try {
        const res = await fetch(getPath("/api/admin/ballot-lock"), { credentials: "include", cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setState({
            locked: data.locked === true,
            reason: data.reason || null,
            ballots: Number(data.ballots) || 0,
            loading: false,
            failed: false,
          });
        }
      } catch (e) {
        console.error("ballot-lock check failed:", e);
        if (!cancelled) setState({ locked: false, reason: null, ballots: 0, loading: false, failed: true });
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  return state;
}
