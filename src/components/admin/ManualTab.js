'use client';

/**
 * ManualTab (ADM-MANUAL) — in-app operating manual for a first-time admin.
 *
 * READ-ONLY BY CONSTRUCTION: no fetch, no mutation, no action buttons. The only
 * interactive affordances are `onGoTab` jumps to sibling admin tabs.
 *
 * ⚠️ Every claim here is sourced from real code. Do NOT edit the copy without
 * re-reading the source it describes:
 *   • field names/groups          → src/utils/globalConfigDefaults.js (GLOBAL_CONFIG_FIELDS)
 *   • mode meanings               → src/app/admin/page.js (SYSTEM_MODES)
 *   • action guards               → src/app/api/admin/dashboard/route.js (POST)
 *   • readiness coverage          → src/app/api/admin/readiness/route.js
 *   • single-party redirect       → src/app/candidates/page.js (realParties.length === 1)
 *   • results gate                → src/app/api/results/route.js (showResult)
 */

import {
  BookOpen, Settings, Users, Palette, ShieldCheck, CalendarClock,
  PieChart as PieIcon, AlertTriangle, Power, Zap, Hourglass, CalendarDays,
  LifeBuoy, Lock, ArrowRight, Vote, Building2, Link as LinkIcon, Copyright,
} from 'lucide-react';

/* ── small presentational helpers ─────────────────────────────────────────── */

const PhaseCard = ({ n, title, subtitle, tone = 'purple', children }) => {
  const tones = {
    purple: 'bg-[#8A2680]/10 text-[#8A2680]',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-start gap-3 mb-5">
        <div className={`${tones[tone]} w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-base font-black`}>
          {n}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-700 break-words">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5 leading-relaxed break-words">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
};

const TabChip = ({ icon: Icon, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 align-middle px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-100 text-[#8A2680] text-xs font-bold hover:bg-purple-100 transition-colors"
  >
    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
    <span className="break-words text-left">{children}</span>
  </button>
);

const Step = ({ n, title, children }) => (
  <div className="flex gap-3">
    <span className="shrink-0 w-6 h-6 mt-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center">
      {n}
    </span>
    <div className="min-w-0 flex-1">
      <h4 className="text-sm font-bold text-slate-800 break-words">{title}</h4>
      <div className="text-xs text-slate-600 mt-1 leading-relaxed break-words space-y-1.5">{children}</div>
    </div>
  </div>
);

const FieldRow = ({ label, hint }) => (
  <li className="flex flex-col sm:flex-row sm:gap-2">
    <span className="font-bold text-slate-700 shrink-0 break-words">{label}</span>
    <span className="text-slate-500 break-words">{hint}</span>
  </li>
);

const Group = ({ icon: Icon, name, children }) => (
  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="w-4 h-4 shrink-0 text-[#8A2680]" />}
      <span className="text-xs font-black text-slate-700 break-words">{name}</span>
    </div>
    <ul className="space-y-1.5 text-xs">{children}</ul>
  </div>
);

const Note = ({ tone = 'slate', icon: Icon = AlertTriangle, children }) => {
  const tones = {
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs leading-relaxed ${tones[tone]}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
};

/* ── the manual ───────────────────────────────────────────────────────────── */

export default function ManualTab({ onGoTab }) {
  const go = (id) => () => { if (typeof onGoTab === 'function') onGoTab(id); };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="bg-[#8A2680]/10 text-[#8A2680] p-2.5 rounded-xl shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-700 break-words">คู่มือใช้งาน · ทำอะไรก่อนหลัง</h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed break-words">
              อ่านจากบนลงล่างครั้งเดียว แล้วทำตามลำดับ ตั้งแต่ตั้งค่าก่อนเลือกตั้ง จนถึงประกาศผลและเตรียมปีถัดไป
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <TabChip icon={CalendarDays} onClick={go('overview')}>ภาพรวม</TabChip>
          <TabChip icon={Settings} onClick={go('globalConfig')}>ตั้งค่าทั่วไป</TabChip>
          <TabChip icon={Users} onClick={go('candidates')}>จัดการผู้สมัคร</TabChip>
          <TabChip icon={Palette} onClick={go('pageDesign')}>เลือกธีม (Template)</TabChip>
          <TabChip icon={Power} onClick={go('settings')}>ตั้งค่าระบบ</TabChip>
        </div>
        <Note tone="slate" icon={LifeBuoy}>
          <span className="font-bold">ถ้าเจอปัญหา ให้ดูตรงนี้ก่อน</span> — ไปแท็บ <span className="font-bold">ตั้งค่าระบบ</span> กล่อง
          <span className="font-bold"> ตรวจความพร้อมระบบ · READINESS</span> แล้วกดปุ่ม <span className="font-bold">ตรวจตอนนี้</span> ระบบจะไล่ตรวจให้ว่าอะไรยังไม่พร้อม
        </Note>
      </div>

      {/* ── ระยะที่ 1 ── */}
      <PhaseCard
        n="1"
        tone="purple"
        title="ระยะที่ 1 · ตั้งค่าก่อนเปิดเลือกตั้ง"
        subtitle="ทำให้ครบก่อนถึงวันจริง เรียงตามลำดับนี้"
      >
        <Step n="1" title="กรอกข้อมูลพื้นฐานที่แท็บ ตั้งค่าทั่วไป">
          <p>ข้อมูลในแท็บนี้คือชื่อและปีที่ไปโผล่ทุกหน้าของเว็บ กรอกให้ครบทีละกลุ่ม แล้วกดบันทึก</p>
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <Group icon={Vote} name="ข้อมูลการเลือกตั้ง">
              <FieldRow label="ชื่อย่อ" hint="ตัวอักษรนำหน้า เช่น SAMO" />
              <FieldRow label="เลขครั้งที่" hint="ครั้งที่จัด เช่น 50 — ระบบรวมกับชื่อย่อเป็นป้าย “SAMO 50” ให้เอง ไม่ต้องพิมพ์เอง" />
              <FieldRow label="ปีการศึกษา (พ.ศ.)" hint="ใส่เป็น พ.ศ. เช่น 2570" />
              <FieldRow label="ปีการเลือกตั้ง (ค.ศ.)" hint="ใส่เป็น ค.ศ. เช่น 2027" />
            </Group>
            <Group icon={Building2} name="ชื่อโครงการและองค์กร">
              <FieldRow label="ชื่อโครงการ" hint="เช่น โครงการเลือกตั้งคณะกรรมการบริหาร" />
              <FieldRow label="ชื่อคณะกรรมการ" hint="เช่น คณะกรรมการบริหาร" />
              <FieldRow label="ชื่อองค์กร (เต็ม)" hint="เช่น สโมสรนักศึกษาคณะวิทยาการจัดการ" />
              <FieldRow label="ชื่อองค์กร (ย่อ)" hint="เช่น สโมสรนักศึกษา" />
              <FieldRow label="ชื่อคณะ" hint="เช่น คณะวิทยาการจัดการ" />
              <FieldRow label="ชื่อคณะ (อักษรย่อ EN)" hint="เช่น FMS" />
              <FieldRow label="มหาวิทยาลัย" hint="เช่น PSU" />
            </Group>
            <Group icon={LinkIcon} name="หน้าประเมินผล · แบบฟอร์ม">
              <FieldRow label="ลิงก์ Google Form" hint="แบบประเมินที่นักศึกษาเห็นบนหน้าขอบคุณหลังลงคะแนนเสร็จ · ต้องใส่ให้ถูกต้อง ห้ามเว้นว่าง" />
            </Group>
            <Group icon={Copyright} name="ลิขสิทธิ์">
              <FieldRow label="ปีลิขสิทธิ์ (ค.ศ.)" hint="ปีที่แสดงท้ายเว็บ เช่น 2027" />
            </Group>
          </div>
          <Note tone="amber">
            <span className="font-bold">ลิงก์ Google Form ต้องใส่ให้ครบและถูกต้อง</span> — ปุ่มแบบประเมินบนหน้าขอบคุณแสดงเสมอ ไม่ได้ผูกกับช่องนี้
            ถ้าเว้นว่างไว้หรือใส่ลิงก์ผิด นักศึกษาจะยังเห็นปุ่มและกดได้ แต่จะเจอข้อความว่า
            <span className="font-bold"> ไม่พบลิงก์แบบประเมิน</span> แทนที่จะเป็นแบบฟอร์ม
          </Note>
        </Step>

        <Step n="2" title="กำหนดวันเวลา 3 ช่อง (ในแท็บ ตั้งค่าทั่วไป เช่นกัน)">
          <div className="pt-1">
            <Group icon={CalendarClock} name="ช่วงเวลาเลือกตั้ง">
              <FieldRow label="เปิดตัวผู้สมัคร" hint="วันเวลาที่เริ่มเผยแพร่รายชื่อผู้สมัครให้นักศึกษาเห็น" />
              <FieldRow label="เปิดหีบ / เริ่มลงคะแนน" hint="วันเวลาที่เริ่มให้โหวต" />
              <FieldRow label="ปิดหีบ / สิ้นสุดลงคะแนน" hint="วันเวลาที่ปิดโหวต" />
            </Group>
          </div>
          <Note tone="amber">
            เวลาทั้ง 3 ช่องนี้ <span className="font-bold">ใช้กับโหมด AUTO เท่านั้น</span> — โหมด AUTO จะเปิดและปิดหีบตามเวลาที่กรอกไว้นี้เอง
            ถ้าเว้นว่างหรือกรอกไม่ถูกต้อง ระบบจะถอยไปใช้ค่าเริ่มต้นที่ฝังอยู่ในโค้ดแทน จึงควรกรอกให้ครบทั้ง 3 ช่อง
            และต้องตั้งเวลาปิดหีบให้หลังเวลาเปิดหีบเสมอ
          </Note>
        </Step>

        <Step n="3" title="เพิ่มพรรคและสมาชิกที่แท็บ จัดการผู้สมัคร">
          <p>
            ในกล่อง <span className="font-bold">พรรคผู้สมัคร</span> กดปุ่ม <span className="font-bold">New</span> เพื่อเพิ่มพรรคใหม่
            กรอกชื่อพรรค เบอร์ สโลแกน โลโก้ รูป นโยบาย และพันธกิจ
            จากนั้นเพิ่มสมาชิกของแต่ละพรรคในกล่อง <span className="font-bold">สมาชิกพรรค</span> ด้านล่าง
          </p>
          <Note tone="slate">
            <span className="font-bold">เบอร์มีความหมาย</span> — เบอร์มากกว่า 0 คือพรรคจริง · เบอร์ 0 คือตัวเลือก งดออกเสียง ·
            เบอร์ -1 คือตัวเลือก ไม่รับรอง ซึ่งใช้เฉพาะกรณีมีพรรคจริงพรรคเดียว
          </Note>
          <Note tone="amber">
            <span className="font-bold">ถ้าปีนี้มีพรรคจริงพรรคเดียว</span> ต้องเพิ่มตัวเลือก ไม่รับรอง (เบอร์ -1) ด้วย
            ไม่อย่างนั้นการตรวจความพร้อมจะขึ้นสีแดง และควรมี งดออกเสียง (เบอร์ 0) ด้วย ·
            กรณีพรรคเดียว หน้ารายชื่อผู้สมัครฝั่งนักศึกษาจะพาไปที่หน้าพรรคนั้นโดยตรง ไม่แสดงหน้ารายการให้เลือก
          </Note>
        </Step>

        <Step n="4" title="เลือกหน้าตาเว็บที่แท็บ เลือกธีม (Template)">
          <p>เลือกธีมที่จะใช้กับหน้าเว็บฝั่งนักศึกษาทั้งหมด เปลี่ยนได้ตลอด ไม่กระทบข้อมูลคะแนน</p>
        </Step>

        <Step n="5" title="กดตรวจความพร้อม แล้วแก้ให้หมดทุกข้อสีแดง">
          <p>
            ไปที่แท็บ <span className="font-bold">ตั้งค่าระบบ</span> กล่อง <span className="font-bold">ตรวจความพร้อมระบบ · READINESS</span>{' '}
            แล้วกด <span className="font-bold">ตรวจตอนนี้</span> ระบบจะตรวจให้ครบทุกด้านโดยไม่แก้ไขข้อมูลใด ๆ
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>ลำดับเวลาเปิด-ปิดหีบ และเวลาเปิดตัวผู้สมัคร ถูกต้องหรือไม่</li>
            <li>ตั้งเวลาไว้ในระบบครบ 3 ช่องหรือยัง หรือยังใช้ค่าเริ่มต้นในโค้ดอยู่</li>
            <li>โหมดที่ใช้อยู่สอดคล้องกับเวลาปัจจุบันหรือไม่</li>
            <li>มีพรรคผู้สมัครหรือยัง · กรณีพรรคเดียวมีตัวเลือกไม่รับรองและงดออกเสียงครบหรือไม่ · ทุกพรรคมีสมาชิกและโลโก้ครบหรือไม่</li>
            <li>มีรายชื่อผู้มีสิทธิ์เลือกตั้ง (นักศึกษาปี 1-4) ในระบบหรือยัง</li>
            <li>คะแนนรวม จำนวนบัตรในหีบ และจำนวนผู้ที่ลงคะแนนแล้ว ตรงกันทั้งสามค่าหรือไม่</li>
            <li>ตั้งลิงก์ Google Form แล้วหรือยัง · เปิดแสดงผลคะแนนค้างไว้ทั้งที่ยังไม่ปิดหีบหรือไม่ · ธีมที่ตั้งไว้มีอยู่จริงหรือไม่</li>
            <li>เส้นทางเข้าสู่ระบบจำลอง (Mock Login) ยังเปิดอยู่หรือไม่</li>
          </ul>
          <Note tone="red">
            <span className="font-bold">ข้อที่ขึ้นสีแดง (fail) ต้องแก้ให้หมดก่อนวันจริง</span> · ข้อสีเหลือง (warn) คือเรื่องที่ควรดูให้แน่ใจ แต่ไม่ได้ปิดกั้นการใช้งาน
          </Note>
        </Step>
      </PhaseCard>

      {/* ── ระยะที่ 2 ── */}
      <PhaseCard
        n="2"
        tone="blue"
        title="ระยะที่ 2 · วันเลือกตั้ง (เฝ้าระบบ)"
        subtitle="วันนี้ไม่ต้องตั้งค่าอะไรเพิ่ม หน้าที่คือเฝ้าดูและแก้เมื่อผิดปกติ"
      >
        <Step n="1" title="ตรวจว่าระบบเปิดตามเวลาจริงหรือไม่">
          <p>
            ไปแท็บ <span className="font-bold">ตั้งค่าระบบ</span> ดูแถบสถานะของ <span className="font-bold">ระบบการทำงาน</span> ว่าโหมดที่ใช้อยู่ตรงกับที่ตั้งใจไว้
            ปกติควรเป็น <span className="font-bold">AUTO</span> และเมื่อถึงเวลาเปิดหีบ นักศึกษาจะเข้าหน้าลงคะแนนได้เอง
          </p>
        </Step>

        <Step n="2" title="ดูยอดผู้ใช้สิทธิ์ที่แท็บ ภาพรวม">
          <p>
            แท็บ <span className="font-bold">ภาพรวม</span> แสดงจำนวนผู้ลงคะแนนแบบเรียลไทม์ และกล่อง
            <span className="font-bold"> ความคืบหน้าการใช้สิทธิ์ (Turnout)</span> ที่แยกตามชั้นปี สาขา และเพศ
            ใช้ดูว่ากลุ่มไหนยังมาใช้สิทธิ์น้อย เพื่อไปตามให้มาโหวต
          </p>
          <Note tone="slate">
            ตัวเลขในแท็บนี้บอกแค่ว่าใครมาใช้สิทธิ์แล้วบ้าง <span className="font-bold">ไม่ได้บอกว่ากลุ่มไหนเลือกพรรคใด</span>
          </Note>
        </Step>

        <Step n="3" title="ถ้ามีปัญหา ให้เปลี่ยนโหมดตามตารางนี้">
          <div className="space-y-2 pt-1">
            {[
              {
                Icon: Zap, tone: 'text-blue-700 bg-blue-50 border-blue-200',
                problem: 'ถึงเวลาเปิดหีบแล้ว แต่ระบบยังไม่เปิดให้โหวต',
                action: 'กดโหมด OPEN (เปิดระบบ)',
                effect: 'บังคับเปิดรับคะแนนทันที ไม่สนวันเวลาที่ตั้งไว้ · นักศึกษาเห็นหน้าลงคะแนนทันที',
              },
              {
                Icon: Power, tone: 'text-red-700 bg-red-50 border-red-200',
                problem: 'ถึงเวลาปิดหีบแล้ว แต่ระบบยังรับคะแนนอยู่',
                action: 'กดโหมด ENDED (ปิดระบบ)',
                effect: 'ปิดหีบอย่างเป็นทางการ ไม่รับคะแนนอีก · นักศึกษาเห็นหน้าปิดหีบ',
              },
              {
                Icon: Hourglass, tone: 'text-orange-700 bg-orange-50 border-orange-200',
                problem: 'ต้องหยุดชั่วคราวเพื่อแก้ข้อมูล แล้วจะกลับมาเปิดต่อ',
                action: 'กดโหมด PAUSE (ระงับ)',
                effect: 'หยุดรับคะแนนชั่วคราว · เมื่อแก้เสร็จให้กดกลับเป็น AUTO หรือ OPEN เพื่อเปิดต่อ',
              },
              {
                Icon: CalendarDays, tone: 'text-green-700 bg-green-50 border-green-200',
                problem: 'ทุกอย่างปกติ ไม่ต้องแตะอะไร',
                action: 'คงโหมด AUTO (อัตโนมัติ)',
                effect: 'ระบบดูวันเวลาในแท็บตั้งค่าทั่วไป แล้วเปิด-ปิดหีบเองตามเวลา',
              },
            ].map((r) => (
              <div key={r.action} className={`p-3 rounded-xl border ${r.tone}`}>
                <div className="flex items-start gap-2">
                  <r.Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold break-words">{r.problem}</p>
                    <p className="text-xs font-black mt-1.5 flex items-start gap-1.5 break-words">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {r.action}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed break-words">{r.effect}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Step>
      </PhaseCard>

      {/* ── ระยะที่ 3 ── */}
      <PhaseCard
        n="3"
        tone="green"
        title="ระยะที่ 3 · หลังปิดหีบ"
        subtitle="ปิดหีบแล้วยังไม่มีใครเห็นผล ต้องเปิดสวิตช์เองอีกขั้นหนึ่ง"
      >
        <Step n="1" title="ยืนยันว่าหีบปิดแล้วจริง">
          <p>
            โหมด AUTO จะปิดหีบเองเมื่อถึงเวลาปิดที่ตั้งไว้ ถ้าเลยเวลาแล้วยังไม่ปิด ให้กดโหมด
            <span className="font-bold"> ENDED (ปิดระบบ)</span> ที่แท็บ <span className="font-bold">ตั้งค่าระบบ</span>
          </p>
        </Step>

        <Step n="2" title="เปิดสวิตช์ การแสดงผลคะแนน">
          <p>
            ที่แท็บ <span className="font-bold">ตั้งค่าระบบ</span> เลื่อนหาหัวข้อ <span className="font-bold">การแสดงผลคะแนน</span> แล้วเปิดสวิตช์
            สถานะจะเปลี่ยนจาก <span className="font-bold">ซ่อนผล</span> เป็น <span className="font-bold">แสดงผล</span>
          </p>
          <Note tone="red" icon={Lock}>
            <span className="font-bold">สวิตช์นี้คือประตูเดียวที่เปิดให้เห็นคะแนน</span> — ถ้าไม่เปิด จะไม่มีใครเห็นคะแนนของแต่ละพรรคเลย
            รวมถึงตัวแอดมินเองด้วย การปิดหีบอย่างเดียวไม่ทำให้ผลปรากฏ
          </Note>
          <Note tone="amber">
            <span className="font-bold">ห้ามเปิดก่อนปิดหีบ</span> — คะแนนที่เห็นระหว่างทางจะชี้นำคนที่ยังไม่ได้โหวต ทำให้การเลือกตั้งไม่ยุติธรรม
            เปิดหลังปิดหีบแล้วเท่านั้นจึงปลอดภัย
          </Note>
        </Step>

        <Step n="3" title="รับรองผลเป็นครั้งสุดท้าย">
          <p>
            ที่แท็บ <span className="font-bold">ตั้งค่าระบบ</span> ใน <span className="font-bold">โซนอันตราย</span> มีรายการ
            <span className="font-bold"> ลบข้อมูลการลงคะแนนรายบุคคล (รับรองผล)</span> กดได้เฉพาะเมื่อปิดหีบแล้วและเปิดการแสดงผลคะแนนแล้วเท่านั้น
          </p>
          <Note tone="indigo" icon={ShieldCheck}>
            การกดปุ่มนี้คือการ <span className="font-bold">ปักธงรับรองผล</span> ว่าคะแนนถูกล็อกแล้ว เครื่องมือตรวจสอบจะไม่แก้ไขฐานข้อมูลอีก ·
            ไม่ได้ลบความเชื่อมโยงระหว่างผู้ลงคะแนนกับพรรค เพราะระบบไม่เคยเก็บความเชื่อมโยงนั้นตั้งแต่แรก บัตรทุกใบถูกบันทึกแบบไม่มีชื่อผู้ลงคะแนนอยู่แล้ว ·
            คะแนนรวมของทุกพรรคยังอยู่ครบ · กดแล้วย้อนกลับไม่ได้
          </Note>
        </Step>
      </PhaseCard>

      {/* ── ระยะที่ 4 ── */}
      <PhaseCard
        n="4"
        tone="amber"
        title="ระยะที่ 4 · ปีถัดไป และข้อควรระวัง"
        subtitle="อ่านให้จบก่อนแตะอะไรในโซนอันตราย"
      >
        <Step n="1" title="เตรียมระบบสำหรับการเลือกตั้งปีถัดไป">
          <p>
            แก้ปี ชื่อ และวันเวลาใหม่ที่แท็บ <span className="font-bold">ตั้งค่าทั่วไป</span> ก่อน
            แล้วจึงล้างข้อมูลเก่าที่แท็บ <span className="font-bold">ตั้งค่าระบบ</span> ในกล่อง <span className="font-bold">โซนอันตราย</span>
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-600 pt-1">
            <li>
              <span className="font-bold text-slate-700">ล้างคะแนนโหวตทั้งหมด</span> — ตั้งคะแนนทุกพรรคกลับเป็น 0
              คืนสิทธิ์โหวตให้นักศึกษาปี 1-4 ทุกคน และล้างบัตรในหีบ ส่วนรายชื่อพรรคและสมาชิกยังอยู่ครบ
              เหมาะกับตอนซ้อมระบบเสร็จแล้วอยากล้างคะแนนทดสอบ
            </li>
            <li>
              <span className="font-bold text-slate-700">ล้างพรรคและสมาชิกทั้งหมด</span> — ลบพรรคและสมาชิกทุกรายการ
              แล้วสร้างตัวเลือก งดออกเสียง ขึ้นใหม่หนึ่งรายการ คะแนนและสิทธิ์โหวตถูกล้างไปพร้อมกัน
              เหมาะกับตอนขึ้นปีการศึกษาใหม่และต้องกรอกรายชื่อพรรคชุดใหม่ทั้งหมด
            </li>
          </ul>
          <Note tone="red">
            ทั้งสองอย่าง <span className="font-bold">กู้คืนไม่ได้</span> · และระบบจะไม่ยอมให้ล้างขณะหีบยังเปิดอยู่
            ต้องสั่งโหมด <span className="font-bold">PAUSE</span> หรือ <span className="font-bold">ENDED</span> ก่อน ไม่อย่างนั้นจะขึ้นข้อความเตือนและไม่ทำงาน
          </Note>
        </Step>

        <Step n="2" title="ปิดการเข้าสู่ระบบจำลอง (Mock Login) ก่อนใช้งานจริง">
          <p>
            การเข้าสู่ระบบจำลองมีไว้ให้นักพัฒนาทดสอบเท่านั้น ถ้าเปิดค้างไว้บนเซิร์ฟเวอร์ที่ใช้จริง
            จะมีเส้นทางเข้าสู่ระบบเป็นนักศึกษาคนใดก็ได้โดยไม่ต้องใช้รหัสผ่าน
          </p>
          <p>
            ตรวจได้ที่แท็บ <span className="font-bold">ตั้งค่าระบบ</span> จากป้ายสถานะด้านบนสุด และจากการกด
            <span className="font-bold"> ตรวจตอนนี้</span> ในกล่องตรวจความพร้อม ซึ่งจะรายงานหัวข้อ
            <span className="font-bold"> การเข้าสู่ระบบจำลอง (Mock Login)</span> ให้
          </p>
          <Note tone="red">
            ถ้าหัวข้อนี้ขึ้นสีแดง <span className="font-bold">ห้ามเปิดให้นักศึกษาใช้</span> ต้องให้ผู้ดูแลเซิร์ฟเวอร์แก้การตั้งค่าและนำระบบขึ้นแบบ production ก่อน ·
            ป้ายสถานะนี้ดูอย่างเดียว ไม่มีปุ่มเปิดปิดในหน้าแอดมินโดยตั้งใจ
          </Note>
        </Step>

        <Step n="3" title="ข้อควรระวังที่เจอบ่อย">
          <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
            <li>อย่าเปิดสวิตช์การแสดงผลคะแนนทิ้งไว้ตั้งแต่ก่อนวันเลือกตั้ง ให้เปิดหลังปิดหีบเท่านั้น</li>
            <li>ถ้าใช้โหมด OPEN หรือ PAUSE เพื่อแก้ปัญหาเฉพาะหน้า อย่าลืมกลับมาเปลี่ยนโหมดให้ถูกต้องเมื่อจบงาน</li>
            <li>เวลาที่กรอกในช่องวันเวลาเป็นเวลาประเทศไทยเสมอ ไม่ต้องคำนวณเวลาของเครื่องเซิร์ฟเวอร์เอง</li>
            <li>ถ้าตัวเลขคะแนนรวม บัตรในหีบ และจำนวนผู้ลงคะแนน ไม่ตรงกันในหน้าตรวจความพร้อม ให้แจ้งผู้ดูแลระบบก่อนประกาศผล</li>
          </ul>
        </Step>
      </PhaseCard>

      <div className="pb-2">
        <Note tone="slate" icon={PieIcon}>
          จำสั้น ๆ — <span className="font-bold">ตั้งค่าทั่วไป</span> ให้ครบ · <span className="font-bold">จัดการผู้สมัคร</span> ให้ครบ ·
          <span className="font-bold"> ตรวจความพร้อม</span> ให้เขียว · วันจริงเฝ้าที่ <span className="font-bold">ภาพรวม</span> ·
          ปิดหีบแล้วค่อยเปิด <span className="font-bold">การแสดงผลคะแนน</span>
        </Note>
      </div>
    </div>
  );
}
