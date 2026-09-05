'use client';

// หน้าเมื่อเกิดข้อผิดพลาดระดับ route segment
//
// มี global-error.js อยู่แล้ว แต่ Next เรียกมันเฉพาะตอนที่ error เกิดใน **root layout**
// เท่านั้น error ที่เกิดในหน้าใดหน้าหนึ่ง (เช่น /results ดึงข้อมูลแล้วพัง) ไม่มีอะไรมารับ
// เลยตกไปที่ default ของ Next ซึ่งบน production คือหน้าเปล่าที่เขียนว่า
// "Application error: a client-side exception has occurred" — ไม่มีบริบท ไม่มีทางไปต่อ
//
// ไฟล์นี้คือชั้นที่ขาดไป: จับ error ของ segment แล้วให้ทางออกที่ใช้ได้จริงกับผู้ใช้
//
// ⚠️ ไม่พึ่ง DB และไม่พึ่งธีมที่แอดมินเลือกไว้ โดยตั้งใจ — หน้าที่ต้อง query อะไรก่อนถึงจะ
// render ได้ จะพังซ้ำตอนที่สิ่งนั้นแหละมีปัญหา ซึ่งเป็นเวลาที่เราต้องการมันที่สุด

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // next.config.mjs ตั้ง removeConsole ให้เก็บ error/warn ไว้บน production
    // บรรทัดนี้จึงยังอยู่ในบิลด์จริง และเป็นร่องรอยเดียวที่เจ้าหน้าที่จะเห็นใน console
    console.error('[route error]', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#F8F9FD',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#fff',
          border: '1px solid #F0F0F4',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(138, 38, 128, 0.08)',
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
          }}
          aria-hidden="true"
        >
          ⚠️
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', margin: '0 0 12px' }}>
          หน้านี้แสดงผลไม่สำเร็จ
        </h1>

        <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#6B7280', margin: '0 0 8px' }}>
          เกิดข้อผิดพลาดระหว่างโหลดข้อมูล ลองกดโหลดใหม่อีกครั้ง
        </p>
        {/* ประโยคนี้สำคัญกว่าที่ดู: คนที่เจอหน้านี้ตอนกำลังจะลงคะแนน ต้องรู้ว่าคะแนนของตัวเอง
            อยู่ในสถานะไหน ไม่งั้นจะกดซ้ำหรือเลิกไปเลย */}
        <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#9CA3AF', margin: '0 0 28px' }}>
          หากคุณกำลังลงคะแนนอยู่ คะแนนจะถูกบันทึกก็ต่อเมื่อระบบแสดงหน้ายืนยันแล้วเท่านั้น
          กลับไปที่หน้าลงคะแนนเพื่อตรวจสอบสถานะของคุณได้
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '13px 26px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #8A2680, #601A59)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '15px',
              fontFamily: 'inherit',
            }}
          >
            ลองใหม่อีกครั้ง
          </button>

          <Link
            href="/"
            style={{
              padding: '13px 26px',
              borderRadius: '12px',
              background: '#F3F4F6',
              color: '#374151',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
            }}
          >
            กลับหน้าแรก
          </Link>
        </div>

        {/* digest คือรหัสที่ Next ใช้จับคู่ error ฝั่งผู้ใช้กับ stack trace ในล็อกฝั่งเซิร์ฟเวอร์
            แสดงไว้เพื่อให้ผู้ใช้แจ้งเจ้าหน้าที่ได้ตรงตัว — ตัว message จริงไม่แสดง
            เพราะอาจมีรายละเอียดภายในระบบติดออกมา */}
        {error?.digest && (
          <p style={{ fontSize: '11px', color: '#C4C7CF', margin: '24px 0 0', fontFamily: 'monospace' }}>
            รหัสอ้างอิงสำหรับแจ้งเจ้าหน้าที่: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
