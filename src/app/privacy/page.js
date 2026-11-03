// /privacy: the privacy notice. A server component on purpose: it is plain text
// that must read the same under every template family, and it needs only one
// value from the config (the contact e-mail the faculty sets on ตั้งค่าทั่วไป).
//
// It deliberately does NOT use any template's chrome, theme tokens or fonts from
// a family: the colours below are the project's fixed design-system colours
// (CLAUDE.md, Design System Colors), so the page is legible whichever template
// is active. Every statement here describes what the code actually does; when
// the code changes (cookies, new third-party requests, retention), change this
// page in the same commit.

import { ChevronLeft, Mail } from "lucide-react";
import { getSiteConfig } from "../../lib/cache/siteData";
import { privacyEmailOf } from "../../lib/privacyContact.mjs";
import { getPath } from "../../utils/basePath";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว | FMS Election",
  description: "ระบบเลือกตั้งออนไลน์เก็บข้อมูลอะไรจากนักศึกษา เก็บไว้เพื่ออะไร นานแค่ไหน และติดต่อใครได้",
};

const BRAND = "#8A2680";

// Each cookie as the code sets it. Lifetimes are the ones in lib/auth.js
// (session maxAge 3600 s), NextAuth's defaults (state 900 s, the rest end with
// the browser session) and api/admin/login (admin_token 2 h).
const COOKIES = [
  {
    name: "next-auth.session-token",
    note: "ขึ้นต้นด้วย __Secure- เมื่อเปิดผ่าน https",
    what: "เก็บว่าคุณเข้าสู่ระบบแล้ว ประกอบด้วยรหัสนักศึกษา ชื่อ อีเมล รหัสคณะและสาขา กลุ่มผู้ใช้ สถานะว่าลงคะแนนแล้วหรือยัง และโทเคนจากมหาวิทยาลัยที่ใช้ตอนออกจากระบบ เนื้อหาถูกเข้ารหัส และสคริปต์ในหน้าเว็บอ่านคุกกี้นี้ไม่ได้",
    life: "1 ชั่วโมงนับจากเข้าสู่ระบบ แล้วต้องเข้าสู่ระบบใหม่",
  },
  {
    name: "next-auth.csrf-token",
    note: "ขึ้นต้นด้วย __Host- เมื่อเปิดผ่าน https",
    what: "ค่าสุ่มกันไม่ให้เว็บอื่นส่งคำสั่งเข้าสู่ระบบแทนคุณ",
    life: "จนกว่าจะปิดเบราว์เซอร์",
  },
  {
    name: "next-auth.callback-url",
    note: "ขึ้นต้นด้วย __Secure- เมื่อเปิดผ่าน https",
    what: "จำว่าหลังเข้าสู่ระบบแล้วจะพากลับไปหน้าไหนของเว็บนี้",
    life: "จนกว่าจะปิดเบราว์เซอร์",
  },
  {
    name: "next-auth.state",
    note: "ขึ้นต้นด้วย __Secure- เมื่อเปิดผ่าน https",
    what: "ค่าสุ่มที่ใช้ตรวจว่าคำตอบที่กลับมาจาก PSU Passport เป็นของการเข้าสู่ระบบที่คุณเพิ่งกดจริง",
    life: "15 นาที",
  },
  {
    name: "admin_token",
    note: "ตั้งเฉพาะเมื่อผู้ดูแลระบบเข้าสู่ระบบผู้ดูแล นักศึกษาทั่วไปไม่ได้รับ",
    what: "ยืนยันตัวตนผู้ดูแลระบบ",
    life: "2 ชั่วโมง",
  },
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 sm:p-7">
      <h2 className="text-lg sm:text-xl font-bold mb-3" style={{ color: BRAND }}>{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-gray-700">{children}</div>
    </section>
  );
}

function Bullets({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-gray-400">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
}

export default async function PrivacyPage() {
  let email = "";
  try {
    const cfg = await getSiteConfig();
    email = privacyEmailOf(cfg?.globalConfig);
  } catch (e) {
    console.error("[privacy] config unavailable, showing the page without an e-mail:", e?.message);
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#F8F9FD", color: "#1f2937" }} data-privacy-page="">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <a href={getPath("/")} className="inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: BRAND }}>
            <ChevronLeft size={18} aria-hidden="true" /> กลับหน้าแรก
          </a>
          <span className="text-sm text-gray-500 truncate">ระบบเลือกตั้งออนไลน์ FMS PSU</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: BRAND }}>นโยบายความเป็นส่วนตัว</h1>
          <p className="mt-3 text-[15px] leading-7 text-gray-600">
            หน้านี้บอกว่าระบบเลือกตั้งออนไลน์เก็บข้อมูลอะไรจากคุณ เก็บไว้เพื่ออะไร นานแค่ไหน และคุณติดต่อใครได้
          </p>
        </div>

        <Section id="owner" title="ใครดูแลข้อมูลนี้">
          <p>
            ผู้รับผิดชอบข้อมูลคือ คณะวิทยาการจัดการ มหาวิทยาลัยสงขลานครินทร์ ระบบนี้จัดทำเพื่อการเลือกตั้ง
            คณะกรรมการบริหารสโมสรนักศึกษาของคณะ และใช้ได้เฉพาะนักศึกษาที่มีสิทธิ์เลือกตั้ง
          </p>
        </Section>

        <Section id="collect" title="ระบบเก็บข้อมูลอะไรบ้าง">
          <p className="font-semibold text-gray-800">จาก PSU Passport ตอนคุณเข้าสู่ระบบ</p>
          <Bullets items={[
            "รหัสนักศึกษา ชื่อ และอีเมลของบัญชีมหาวิทยาลัย",
            "รหัสคณะและรหัสสาขาที่มหาวิทยาลัยส่งมา",
            "กลุ่มผู้ใช้ที่มหาวิทยาลัยระบุ (เช่น นักศึกษา หรือเจ้าหน้าที่) ใช้บันทึกไว้เท่านั้น ไม่ได้ให้สิทธิ์ใดเพิ่ม",
          ]} />
          <p>ระบบไม่เห็นและไม่เก็บรหัสผ่าน PSU Passport ของคุณ การกรอกรหัสผ่านเกิดที่หน้าเข้าสู่ระบบของมหาวิทยาลัยเท่านั้น</p>

          <p className="font-semibold text-gray-800 pt-2">จากทะเบียนนักศึกษาที่คณะนำเข้า</p>
          <Bullets items={[
            "คำนำหน้า ชื่อ เพศ ชั้นปี สาขาวิชา และสถานะชั้นปี",
            "ข้อมูลนี้ใช้ตัดสินว่าคุณมีสิทธิ์เลือกตั้งหรือไม่ (นักศึกษาชั้นปี 1 ถึง 4) และใช้ทำสถิติรวมของผู้มาใช้สิทธิ์",
          ]} />

          <p className="font-semibold text-gray-800 pt-2">สถานะการใช้สิทธิ์ของคุณ</p>
          <Bullets items={[
            "ลงคะแนนแล้วหรือยัง และเวลาที่ลงคะแนน โดยเก็บเวลาเป็นระดับชั่วโมง ไม่เก็บเวลาที่แน่นอน",
            "คุณกดยืนยันว่าทำแบบประเมินแล้วหรือยัง ระบบเก็บแค่ข้อนี้ ไม่เห็นคำตอบในแบบประเมิน",
          ]} />

          <p className="font-semibold text-gray-800 pt-2">สิ่งที่ระบบจดไว้ชั่วคราว</p>
          <Bullets items={[
            "ตัวนับจำนวนครั้งที่กดลงคะแนนต่อรหัสนักศึกษา เพื่อกันการกดซ้ำรัว ๆ เก็บในหน่วยความจำของเซิร์ฟเวอร์ ไม่ลงฐานข้อมูล และหายไปเมื่อเซิร์ฟเวอร์เริ่มทำงานใหม่",
            "บันทึกการทำงานของเซิร์ฟเวอร์ (log) อาจมีรหัสนักศึกษาตอนเข้าสู่ระบบและข้อความแจ้งข้อผิดพลาด เปิดดูได้เฉพาะเจ้าหน้าที่ที่ดูแลเครื่อง",
            "เว็บเซิร์ฟเวอร์และเครือข่ายของมหาวิทยาลัยอาจบันทึกที่อยู่ IP ของผู้เข้าชมตามปกติของระบบเครือข่าย ระบบเลือกตั้งนี้ไม่ได้นำที่อยู่ IP ไปเก็บเป็นข้อมูลของคุณ",
          ]} />

          <p className="font-semibold text-gray-800 pt-2">ข้อมูลที่ไม่มี</p>
          <Bullets items={[
            "ระบบนี้ไม่มีตัววิเคราะห์การใช้งาน ตัวติดตามโฆษณา หรือคุกกี้การตลาด",
            "ผู้ดูแลระบบมีบันทึกการทำงานของตัวเอง (เช่น เปลี่ยนโหมด ตั้งเวลา รับรองผล) เป็นข้อมูลของผู้ดูแล ไม่ใช่ของผู้ลงคะแนน",
          ]} />
        </Section>

        <Section id="purpose" title="เก็บไปเพื่ออะไร">
          <Bullets items={[
            "ตรวจว่าคุณเป็นนักศึกษาที่มีสิทธิ์เลือกตั้ง",
            "ให้ลงคะแนนได้คนละหนึ่งครั้ง และแสดงให้คุณเห็นว่าใช้สิทธิ์แล้ว",
            "ทำสถิติรวมของผู้มาใช้สิทธิ์ เช่น จำนวนแยกตามชั้นปี สาขา และเพศ ซึ่งแสดงเป็นตัวเลขรวมของกลุ่ม ไม่ระบุตัวบุคคล และไม่บอกว่ากลุ่มใดเลือกอะไร",
            "ให้คณะตรวจสอบความถูกต้องของผลเลือกตั้งและบันทึกการรับรองผล",
            "ยืนยันว่านักศึกษาทำแบบประเมินแล้ว เพื่อให้คณะนับชั่วโมงกิจกรรมได้ (ถ้าคณะเปิดแบบประเมินในปีนั้น)",
          ]} />
        </Section>

        <Section id="ballot" title="บัตรลงคะแนนถูกเก็บอย่างไร">
          <p>
            ตัวเลือกที่คุณเลือกถูกเข้ารหัสแล้วเก็บเป็นบัตรหนึ่งใบในหีบออนไลน์ บัตรไม่มีชื่อ รหัสนักศึกษา หรือเวลาที่แน่นอนของคุณติดอยู่
            กุญแจสำหรับถอดรหัสไม่ได้อยู่บนเซิร์ฟเวอร์ ถอดได้เฉพาะตอนนับหรือตรวจสอบผลที่คณะกำหนด
          </p>
          <p>
            ส่วนที่บอกว่าคุณลงคะแนนแล้วอยู่ในอีกตารางหนึ่งของฐานข้อมูล แยกจากบัตร ระบบจึงแสดงให้คุณเห็นได้ว่าใช้สิทธิ์แล้ว โดยไม่ต้องรู้ว่าคุณเลือกอะไร
          </p>
          <p className="font-semibold text-gray-800">ข้อจำกัดที่ควรรู้</p>
          <Bullets items={[
            "ก่อนที่คณะจะกดรับรองผล ผู้ดูแลฐานข้อมูลที่มีสิทธิ์สูงสุดอาจเชื่อมโยงทางเทคนิคได้ว่าบัตรใบใดถูกบันทึกพร้อมกับผู้ใช้คนใด แต่การรู้ว่าบัตรใบนั้นเลือกอะไรต้องมีกุญแจถอดรหัส ซึ่งเก็บแยกไว้นอกเซิร์ฟเวอร์",
            "เมื่อคณะรับรองผลแล้ว ระบบเขียนข้อมูลผู้ใช้ใหม่เพื่อตัดเส้นทางเชื่อมโยงนั้น",
            "ผลรวมคะแนนของแต่ละตัวเลือกเป็นข้อมูลที่เปิดเผยเมื่อคณะประกาศผล",
          ]} />
        </Section>

        <Section id="cookies" title="คุกกี้และข้อมูลในเบราว์เซอร์">
          <p>เว็บนี้ใช้เฉพาะคุกกี้ที่จำเป็นต่อการเข้าสู่ระบบและความปลอดภัย ไม่มีคุกกี้โฆษณาหรือวิเคราะห์การใช้งาน</p>
          <dl className="space-y-3">
            {COOKIES.map((c) => (
              <div key={c.name} className="rounded-lg border border-gray-100 bg-gray-50 p-3.5" data-cookie={c.name}>
                <dt className="font-mono text-[13px] font-semibold text-gray-900 break-all">{c.name}</dt>
                <dd className="mt-1 text-[13px] text-gray-500">{c.note}</dd>
                <dd className="mt-1.5">{c.what}</dd>
                <dd className="mt-1.5 text-gray-600">อยู่นาน: {c.life}</dd>
              </div>
            ))}
          </dl>
          <p>
            เบราว์เซอร์อาจเก็บค่าเล็ก ๆ ชื่อ fms-chunk-reload-lock ในหน่วยความจำของแท็บชั่วคราว เพื่อกันหน้าโหลดซ้ำวนเมื่อเว็บมีการอัปเดตระหว่างที่คุณเปิดค้างไว้
            ค่านี้ไม่มีข้อมูลของคุณและหายไปเมื่อปิดแท็บ
          </p>
          <p>คุกกี้ด้านบนเป็นของเว็บนี้เอง Google อาจตั้งคุกกี้ของ Google แยกต่างหากในกรอบแบบประเมิน ดูหัวข้อถัดไป</p>
        </Section>

        <Section id="third" title="บริการภายนอกที่เกี่ยวข้อง">
          <p className="font-semibold text-gray-800">PSU Passport</p>
          <p>การเข้าสู่ระบบทำผ่านระบบยืนยันตัวตนของมหาวิทยาลัย (psusso.psu.ac.th) ซึ่งอยู่ภายใต้ข้อกำหนดของมหาวิทยาลัย</p>

          <p className="font-semibold text-gray-800 pt-2">แบบประเมินใน Google Form</p>
          <p>
            ถ้าคณะตั้งลิงก์แบบประเมินไว้ หน้าขอบคุณหลังลงคะแนนจะแสดง Google Form ในกรอบของหน้าเว็บ ส่วนนี้ทำงานบนระบบของ Google
            Google จึงเห็นที่อยู่ IP และข้อมูลเบราว์เซอร์ของคุณ และอาจตั้งคุกกี้ของ Google
            คำตอบที่คุณกรอกถูกส่งไปที่ Google Form ของคณะ ไม่ได้เข้าระบบเลือกตั้งนี้
          </p>
          <p>
            ระบบเลือกตั้งไม่ส่งชื่อหรือรหัสนักศึกษาของคุณไปกับลิงก์ แต่คำถามในแบบประเมินกำหนดโดยคณะ
            ถ้าแบบประเมินถามชื่อหรือรหัสนักศึกษา สิ่งที่คุณกรอกจะอยู่ในผลของแบบประเมิน ไม่ได้อยู่ในหีบบัตร
          </p>

          <p className="font-semibold text-gray-800 pt-2">ภาพประกอบและลิงก์ออกนอกเว็บ</p>
          <Bullets items={[
            "ลิงก์ไปช่องทางของพรรค (Instagram, Facebook, TikTok, เว็บไซต์) พาคุณออกจากเว็บนี้เมื่อกดเท่านั้น และเป็นไปตามนโยบายของเว็บปลายทาง",
            "ตัวอักษรของเว็บถูกเก็บไว้กับระบบเอง เบราว์เซอร์ของคุณไม่ได้ขอฟอนต์จาก Google",
          ]} />
        </Section>

        <Section id="candidates" title="ข้อมูลของผู้สมัคร">
          <p>
            ผู้สมัครและสมาชิกพรรคถูกเผยแพร่ชื่อ รูปถ่าย รหัสนักศึกษา สาขาวิชา และตำแหน่งในพรรค บนหน้าแนะนำผู้สมัคร
            ใครเปิดเว็บก็ดูได้โดยไม่ต้องเข้าสู่ระบบ คณะเผยแพร่ข้อมูลนี้เพื่อให้ผู้มีสิทธิ์รู้จักผู้สมัคร
            หากเป็นผู้สมัครและต้องการแก้ไขหรือขอถอดข้อมูล ติดต่อตามช่องทางด้านล่าง
          </p>
        </Section>

        <Section id="retention" title="เก็บไว้นานแค่ไหน">
          <Bullets items={[
            "ข้อมูลรายคน (ชื่อ อีเมล รหัสนักศึกษา ข้อมูลจากทะเบียน) และสถานะการใช้สิทธิ์ของคุณ จะถูกลบเมื่อคณะเริ่มรอบการเลือกตั้งปีถัดไป ผ่านขั้นตอนล้างข้อมูลประจำปี",
            "หีบบัตรเข้ารหัสถูกล้างในขั้นตอนเดียวกัน หลังจากคณะเก็บผลรวมไว้แล้ว",
            "ผลรวมคะแนนของแต่ละตัวเลือก สถิติรวมของผู้มาใช้สิทธิ์ และบันทึกการรับรองผล ไม่ใช่ข้อมูลรายคน คณะเก็บไว้ต่อเพื่อเป็นหลักฐานของการเลือกตั้งปีนั้น",
            "สำเนาสำรองฐานข้อมูลยังมีข้อมูลรายคนเดิมอยู่จนกว่าสำเนานั้นจะหมดรอบเก็บ ตามค่าเริ่มต้นของระบบสำรองคือ 14 วันในเครื่อง และสำเนานอกเครื่อง (ถ้าคณะตั้งไว้) เก็บตามรอบของที่เก็บนั้น การลบข้อมูลในฐานข้อมูลจึงไม่ทำให้สำเนาเก่าหายทันที",
            "บันทึกการทำงานของเซิร์ฟเวอร์ (log) เก็บตามการตั้งค่าของเครื่องที่ติดตั้งระบบ ซึ่งระบบเลือกตั้งนี้ไม่ได้กำหนดเอง",
            "คุกกี้หมดอายุตามตารางด้านบน",
          ]} />
        </Section>

        <Section id="rights" title="สิทธิ์ของคุณและการติดต่อ">
          <p>คุณขอสิ่งต่อไปนี้จากผู้รับผิดชอบข้อมูลได้ โดยบางข้อมีข้อจำกัดตามธรรมชาติของการเลือกตั้ง</p>
          <Bullets items={[
            "ขอทราบว่าระบบเก็บข้อมูลอะไรของคุณ และขอสำเนา",
            "ขอให้แก้ข้อมูลที่ไม่ถูกต้อง",
            "ขอให้ลบหรือจำกัดการใช้ข้อมูล หรือคัดค้านการใช้ข้อมูล",
            "ร้องเรียนหากเห็นว่าข้อมูลของคุณถูกใช้ไม่เหมาะสม",
          ]} />
          <p>
            ข้อจำกัดที่ต้องบอกไว้ก่อน คือบัตรลงคะแนนไม่มีชื่อติดอยู่ ผู้ดูแลจึงชี้ไม่ได้ว่าบัตรใบใดเป็นของคุณ
            และจะลบหรือแก้ตัวเลือกของคุณหลังลงคะแนนแล้วไม่ได้
          </p>
          <div className="rounded-lg border p-4" style={{ borderColor: `${BRAND}33`, background: `${BRAND}0d` }} data-privacy-contact="">
            <p className="font-semibold text-gray-900">ติดต่อเรื่องข้อมูลส่วนบุคคล</p>
            {email ? (
              <p className="mt-1.5">
                ส่งอีเมลถึง{" "}
                <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 break-all" style={{ color: BRAND }} data-privacy-email="">
                  <Mail size={16} aria-hidden="true" />{email}
                </a>
                {" "}โดยบอกชื่อ รหัสนักศึกษา และสิ่งที่ต้องการให้คณะดำเนินการ
              </p>
            ) : (
              <p className="mt-1.5">
                ติดต่อคณะวิทยาการจัดการ มหาวิทยาลัยสงขลานครินทร์ โดยตรง บอกชื่อ รหัสนักศึกษา และสิ่งที่ต้องการให้คณะดำเนินการ
                หรือแจ้งผ่านเจ้าหน้าที่ของสโมสรนักศึกษาและเจ้าหน้าที่ของคณะ
              </p>
            )}
          </div>
        </Section>
      </main>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 text-center text-sm text-gray-500">
        <a href={getPath("/")} className="underline underline-offset-4 hover:text-gray-700">กลับหน้าแรก</a>
      </footer>
    </div>
  );
}
