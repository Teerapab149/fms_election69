"use client";

import { ShieldCheck } from "lucide-react";

/**
 * แถบรับรองผลอย่างเป็นทางการ — ขึ้นเหนือหน้าผลคะแนนทุกธีม
 *
 * เจ้าหน้าที่คณะเป็นคนกดรับรอง (กรรมการสโมฯ กดไม่ได้ — กันไว้ที่ API) พอกดแล้ว
 * ชื่อกับเวลาจะถูกบันทึกลง SystemConfig และมาโผล่ตรงนี้ เพื่อให้สโมฯ ปรินต์หน้านี้
 * เอาไปแนบรายงานได้เลย ไม่ต้องมีระบบออกเอกสารแยก
 *
 * สั่งพิมพ์แล้วเหลือแค่เนื้อผล — navbar ปุ่ม และ footer ถูกซ่อนด้วย CSS ท้ายไฟล์
 */
export default function CertifiedBanner({ by, at }) {
  if (!by && !at) return null;

  let when = "";
  if (at) {
    const d = new Date(at);
    if (!Number.isNaN(d.getTime())) {
      when = d.toLocaleString("th-TH", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      });
    }
  }

  return (
    <div className="certified-banner w-full px-4 pt-4 print:pt-0">
      <div className="mx-auto max-w-5xl rounded-2xl border border-emerald-600/30 bg-emerald-50 px-5 py-4 shadow-sm print:rounded-none print:border-black print:bg-white print:shadow-none">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 print:text-black" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-emerald-900 print:text-black">
              ผลการเลือกตั้งนี้ได้รับการรับรองอย่างเป็นทางการแล้ว
            </p>
            <p className="mt-1 text-sm text-emerald-800 print:text-black">
              รับรองโดย <span className="font-semibold">{by || "เจ้าหน้าที่คณะ"}</span>
              {when ? <> · {when}</> : null}
            </p>
            <p className="mt-1 text-xs text-emerald-700/80 print:text-black">
              คะแนนถูกล็อกแล้ว ไม่มีการรับคะแนนเพิ่มได้อีก · สั่งพิมพ์หน้านี้เพื่อใช้เป็นเอกสารแนบได้
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          nav,
          header,
          footer,
          button,
          [data-print-hide] {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          .certified-banner {
            padding-left: 0;
            padding-right: 0;
          }
        }
      `}</style>
    </div>
  );
}
