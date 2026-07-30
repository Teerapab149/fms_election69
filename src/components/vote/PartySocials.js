'use client';

import { socialList } from "../../utils/socialLinks";

/**
 * ช่องทางติดต่อของพรรค — มาร์กอัปกลาง สไตล์เป็นของแต่ละตระกูล
 *
 * ทุกตระกูลแสดงข้อมูลชุดเดียวกัน แต่หน้าตาต้องเป็นภาษาของตัวเอง จึงแยกเป็น
 * "โครงร่วม + คลาสตามตระกูล": ส่ง prefix มา แล้วไปเขียน CSS ของ
 * `.<prefix>-social`, `.<prefix>-social__link`, `.<prefix>-social__label` ในไฟล์นั้น
 *
 * ลิงก์ออกนอกเว็บทุกอันต้องมี rel="noopener noreferrer" — ไม่งั้นหน้าปลายทาง
 * แตะ window.opener ของเราได้ และ referrer หลุดไปกับทุกคลิก
 */
export default function PartySocials({ socials, prefix, heading = "ช่องทางติดต่อ" }) {
  const items = socialList(socials);
  if (!items.length) return null;

  return (
    <div className={`${prefix}-social`}>
      {heading ? <span className={`${prefix}-social__label`}>{heading}</span> : null}
      <div className={`${prefix}-social__row`}>
        {items.map((s) => (
          <a
            key={s.key}
            className={`${prefix}-social__link`}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${s.label} · ${s.handle || s.url}`}
          >
            <span className={`${prefix}-social__name`}>{s.label}</span>
            {s.handle ? <span className={`${prefix}-social__handle`}>{s.handle}</span> : null}
          </a>
        ))}
      </div>
    </div>
  );
}
