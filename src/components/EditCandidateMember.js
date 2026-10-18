'use client';

import { useEffect, useState } from 'react';
import { User, ChevronDown, ChevronUp, Plus, Users, Pencil, Loader2, AlertCircle } from "lucide-react";
import { getPath } from "../utils/basePath";
import { sortMembersByPosition, positionRank } from "../utils/memberSort";

// แสดงกี่คนก่อนกด "ดูทั้งหมด" รายชื่อยาวอยู่ในหน้าเลื่อนอีกชั้นไม่ได้ (เดิมเป็นกล่องเลื่อนซ้อน
// บนมือถือนิ้วแตะผิดว่าเลื่อนกล่องหรือเลื่อนหน้า) จึงตัดที่จำนวนนี้แล้วให้กางเอา
const PREVIEW_COUNT = 8;

/**
 * ลำดับที่หน้าพรรคสาธารณะแสดงจริง:
 *   1) /api/party อ่านสมาชิกตาม id (orderBy id asc)
 *   2) sortMembersByPosition จัดกลุ่มตามตำแหน่ง แล้วคงลำดับ id ภายในกลุ่มเดียวกัน
 * หน้านี้ต้องทำสองขั้นเดียวกัน (เดิมข้ามขั้น 1 เพราะ /api/results ไม่รับประกันลำดับ)
 *
 * ปุ่มเลื่อนขึ้นลงใช้ข้อเท็จจริงที่ว่า PUT ของพรรคสร้างสมาชิกใหม่ตามลำดับใน payload
 * (id ใหม่เรียงตามที่ส่ง) จึงเปลี่ยนลำดับได้โดยไม่แตะ schema และ member.number ซึ่งเป็น
 * กุญแจเรียงของตำแหน่ง ไม่ใช่ลำดับที่แสดง เลื่อนได้เฉพาะภายในกลุ่มตำแหน่งเดียวกัน
 */
export default function EditCandidateMember({ candidate, onClick, onReordered, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);
  const [movingId, setMovingId] = useState(null);
  const [moveError, setMoveError] = useState('');

  useEffect(() => { setMoveError(''); }, [candidate]);

  if (!candidate) return null;
  const members = sortMembersByPosition(
    [...(candidate.members || [])].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  );
  const visible = showAll ? members : members.slice(0, PREVIEW_COUNT);
  const hiddenCount = members.length - visible.length;

  const move = async (index, dir) => {
    const target = index + dir;
    if (movingId !== null || target < 0 || target >= members.length) return;
    if (positionRank(members[index].position) !== positionRank(members[target].position)) return;

    const next = [...members];
    [next[index], next[target]] = [next[target], next[index]];
    setMovingId(members[index].id);
    setMoveError('');
    try {
      const data = new FormData();
      data.append('members', JSON.stringify(next.map((m) => ({
        name: m.name,
        studentId: m.studentId,
        position: m.position,
        major: m.major,
        existingImageUrl: m.imageUrl || null,
        existingModalImageUrl: m.modalImageUrl || null,
      }))));
      const res = await fetch(getPath(`/api/admin/candidates?id=${candidate.id}`), {
        method: 'PUT',
        credentials: 'include',
        body: data,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'เลื่อนลำดับไม่สำเร็จ');
      }
      // การบันทึกสร้างสมาชิกใหม่ทุกคน id จึงเปลี่ยนหมด ต้องโหลดรายชื่อใหม่ก่อนให้กดแก้ต่อได้
      // ถ้าหน้าแม่ไม่ได้ส่ง onReordered มา ใช้การเปิดแท็บนี้ใหม่แทน
      if (onReordered) await onReordered();
      else window.location.assign(getPath('/admin?tab=candidates'));
    } catch (e) {
      console.error(e);
      setMoveError(e.message || 'เลื่อนลำดับไม่สำเร็จ');
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className={`bg-white rounded-xl border transition-colors w-full overflow-hidden ${isExpanded ? 'border-[#8A2680]/30' : 'border-slate-200 hover:border-slate-300'}`}>

      {/* === หัวการ์ด: กดที่ไหนก็เปิด/ปิดได้ === */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680] focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-slate-50 p-1.5 rounded-lg w-12 h-12 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
            {candidate.logoUrl ? (
              <img
                src={getPath(candidate.logoUrl)}
                alt={candidate.name}
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <User className="w-6 h-6 text-slate-300" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 truncate transition-colors group-hover:text-[#8A2680]">
              {candidate.name}
            </h3>
            <p className="text-xs flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3 shrink-0 text-slate-400" />
              {members.length > 0 ? (
                <span className="text-slate-500 tabular-nums">สมาชิก {members.length} คน</span>
              ) : (
                <span className="text-amber-600 font-medium">ยังไม่มีสมาชิก</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* เพิ่มสมาชิกได้โดยไม่ต้องกางการ์ดก่อน งานที่ทำบ่อยที่สุดในหัวข้อนี้ */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick(); } }}
            title="เพิ่มสมาชิก"
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#8A2680] transition-colors hover:border-[#8A2680] hover:bg-[#8A2680] hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่ม
          </span>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#8A2680]' : ''}`}
          />
        </div>
      </button>

      {/* === รายชื่อสมาชิก (ไม่มีกล่องเลื่อนซ้อน ยาวเท่าที่แสดง แล้วให้หน้าเลื่อนเอง) === */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          <div className="p-4 bg-slate-50/60">
            {members.length > 0 && (
              <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
                เรียงตามที่แสดงจริงบนหน้าพรรค ตำแหน่งหลัก (นายก อุปนายก เลขานุการ เหรัญญิก) ระบบเรียงให้เอง
                ส่วนประธานฝ่ายและตำแหน่งอื่น ใช้ปุ่มลูกศรเลื่อนลำดับภายในกลุ่มเดียวกันได้
              </p>
            )}
            {moveError && (
              <p role="alert" className="mb-2 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                <span>{moveError}</span>
              </p>
            )}
            {members.length > 0 ? (
              <>
                <div className="space-y-2" data-testid="member-list">
                  {visible.map((member, idx) => {
                    const rank = positionRank(member.position);
                    const canUp = idx > 0 && positionRank(members[idx - 1].position) === rank;
                    const canDown = idx < members.length - 1 && positionRank(members[idx + 1].position) === rank;
                    const busy = movingId !== null;
                    return (
                      <div
                        key={member.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); onClick(member.id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(member.id); } }}
                        className="group/row flex items-center gap-2 sm:gap-3 p-2 bg-white rounded-lg border border-slate-200 hover:border-[#8A2680]/40 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680]"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          {member.imageUrl ? (
                            <img src={getPath(member.imageUrl)} className="w-full h-full object-cover" alt={member.name} />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{member.position || 'สมาชิก'}</p>
                        </div>

                        {(canUp || canDown) && (
                          <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                            {movingId === member.id ? (
                              <Loader2 className="w-4 h-4 mx-3 animate-spin text-[#8A2680]" aria-label="กำลังบันทึกลำดับ" />
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={!canUp || busy}
                                  onClick={() => move(idx, -1)}
                                  title="เลื่อนขึ้น"
                                  aria-label={`เลื่อน ${member.name} ขึ้น`}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#8A2680] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680]"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!canDown || busy}
                                  onClick={() => move(idx, 1)}
                                  title="เลื่อนลง"
                                  aria-label={`เลื่อน ${member.name} ลง`}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#8A2680] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680]"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        <Pencil className="w-4 h-4 shrink-0 text-slate-300 transition-colors group-hover/row:text-[#8A2680]" />
                      </div>
                    );
                  })}
                </div>

                {members.length > PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    aria-expanded={showAll}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-[#8A2680] transition-colors hover:border-[#8A2680]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680]"
                  >
                    {showAll ? 'แสดงน้อยลง' : `ดูทั้งหมด (อีก ${hiddenCount} คน)`}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">ยังไม่มีสมาชิกในพรรคนี้</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#8A2680] px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#601A59] active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มสมาชิกคนแรก
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
