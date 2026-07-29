'use client';

/**
 * หัวข้อย่อยในฟอร์มยาว ๆ ของหน้าแอดมิน
 *
 * ฟอร์มเพิ่มพรรคกับเพิ่มสมาชิกมีช่องกรอกอย่างละ 8-10 ช่องเรียงลงมาเป็นแถวเดียว
 * คนที่เปิดครั้งแรกจึงไม่รู้ว่าต้องกรอกถึงไหนถึงจะกดบันทึกได้ และไม่รู้ว่าเลื่อนลงไป
 * อีกไกลแค่ไหน การตัดเป็นหัวข้อที่มีเลขกำกับกับป้าย "จำเป็น/ไม่บังคับ" ตอบทั้งสองคำถาม
 * ตั้งแต่ยังไม่ต้องอ่านรายละเอียด
 */
export default function FormSection({ n, title, hint, required = false, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 overflow-hidden">
      <header className="flex items-start gap-3 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8A2680] text-xs font-black text-white">
          {n}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-slate-700">{title}</h4>
            {required ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">จำเป็น</span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">ไม่บังคับ</span>
            )}
          </div>
          {hint && <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{hint}</p>}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
