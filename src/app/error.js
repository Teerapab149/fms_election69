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
// ⚠️ ไม่ query DB และไม่ fetch อะไรเลย โดยตั้งใจ — หน้าที่ต้องถามอะไรก่อนถึงจะ render ได้
// จะพังซ้ำตอนที่สิ่งนั้นแหละมีปัญหา ซึ่งเป็นเวลาที่ต้องการมันที่สุด
//
// สีและฟอนต์ตามธีมที่แอดมินเลือก โดยไม่ต้องพึ่ง DB เพิ่ม: error ระดับ segment ยัง render อยู่
// ใต้ root layout ซึ่งใส่ token ของธีม (--color-*, --font-*, --radius-*) ไว้บน .fms-app แล้ว
// เราจึงแค่อ่าน var() — ทุกตัวมีค่าสำรองเป็นสีเดิม ถ้า layout ดึงธีมไม่ได้ (DB ล่ม) ก็ได้หน้าเดิม
// (error ที่ root layout เองพังเป็นหน้าที่ของ global-error.js ซึ่งไม่มี token ให้อ่าน จึงคงสีฮาร์ดโค้ด)
//
// เรื่อง contrast: ไม่ใช้ --color-primary เป็นสีตัวอักษร หรือเป็นพื้นปุ่มที่มีตัวอักษรขาว เพราะบางธีม
// primary สว่างมาก (gumroad ชมพู, studio-dark เขียวมะนาว) ตัวอักษรใช้ --color-text / --color-text-muted
// บน --color-surface เสมอ ส่วน primary ใช้เป็นขอบปุ่มและแต้มพื้นปุ่ม

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
        // 100vh ไม่ใช่ 70vh: พื้นหลังเป็นสีธีมแล้ว ถ้าสั้นกว่าจอ ธีมมืดจะเหลือแถบขาวของ body ด้านล่าง
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--color-bg, #F8F9FD)',
        color: 'var(--color-text, #1F2937)',
        fontFamily: 'var(--font-body, inherit)',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'var(--color-surface, #fff)',
          border: '1px solid var(--color-border, #F0F0F4)',
          borderRadius: 'var(--radius-card, 20px)',
          boxShadow: '0 10px 40px color-mix(in srgb, var(--color-primary, #8A2680) 8%, transparent)',
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
            background: 'color-mix(in srgb, #EF4444 10%, var(--color-surface, #fff))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
          }}
          aria-hidden="true"
        >
          ⚠️
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text, #1F2937)', fontFamily: 'var(--font-display, inherit)', margin: '0 0 12px' }}>
          หน้านี้แสดงผลไม่สำเร็จ
        </h1>

        <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--color-text-muted, #6B7280)', margin: '0 0 8px' }}>
          เกิดข้อผิดพลาดระหว่างโหลดข้อมูล ลองกดโหลดใหม่อีกครั้ง
        </p>
        {/* ประโยคนี้สำคัญกว่าที่ดู: คนที่เจอหน้านี้ตอนกำลังจะลงคะแนน ต้องรู้ว่าคะแนนของตัวเอง
            อยู่ในสถานะไหน ไม่งั้นจะกดซ้ำหรือเลิกไปเลย */}
        <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--color-text-muted, #9CA3AF)', margin: '0 0 28px' }}>
          หากคุณกำลังลงคะแนนอยู่ คะแนนจะถูกบันทึกก็ต่อเมื่อระบบแสดงหน้ายืนยันแล้วเท่านั้น
          กลับไปที่หน้าลงคะแนนเพื่อตรวจสอบสถานะของคุณได้
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '11px 24px',
              borderRadius: 'var(--radius-button, 12px)',
              border: '2px solid var(--color-primary, #8A2680)',
              cursor: 'pointer',
              background: 'color-mix(in srgb, var(--color-primary, #8A2680) 12%, var(--color-surface, #fff))',
              color: 'var(--color-text, #1F2937)',
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
              padding: '11px 24px',
              borderRadius: 'var(--radius-button, 12px)',
              border: '2px solid transparent',
              background: 'color-mix(in srgb, var(--color-border, #E5E7EB) 30%, var(--color-surface, #fff))',
              color: 'var(--color-text, #374151)',
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
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted, #9CA3AF)', margin: '24px 0 0', fontFamily: 'monospace' }}>
            รหัสอ้างอิงสำหรับแจ้งเจ้าหน้าที่: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
