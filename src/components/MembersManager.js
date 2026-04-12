'use client';
import { getPath } from "../utils/basePath";

import { useState, useEffect } from 'react';
import { User, ChevronDown, ChevronUp, Pencil, Users } from "lucide-react";

export default function MembersManager({ shouldRefresh, onEditParty }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartyId, setExpandedPartyId] = useState(null); // เก็บ ID พรรคที่เปิดอยู่

  // ฟังก์ชันดึงข้อมูลสมาชิก
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(getPath('/api/admin/members'));
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลเมื่อ component โหลด หรือเมื่อมีสัญญาณ refresh
  useEffect(() => {
    fetchMembers();
  }, [shouldRefresh]);

  // 🛠️ Logic จัดกลุ่มสมาชิกตามพรรค (Group by Candidate)
  const groupedMembers = members.reduce((acc, member) => {
    const candidateId = member.candidateId;

    if (!acc[candidateId]) {
      acc[candidateId] = {
        candidateInfo: member.candidate,
        membersList: []
      };
    }

    acc[candidateId].membersList.push(member);
    return acc;
  }, {});

  // แปลง Object กลับเป็น Array เพื่อเอาไป map แสดงผล และเรียงตามเบอร์พรรค
  const sortedGroups = Object.values(groupedMembers).sort((a, b) =>
    (a.candidateInfo?.number || 999) - (b.candidateInfo?.number || 999)
  );

  // ฟังก์ชันสลับ เปิด/ปิด Accordion
  const toggleAccordion = (candidateId) => {
    setExpandedPartyId(prev => prev === candidateId ? null : candidateId);
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400">กำลังโหลดข้อมูลสมาชิก...</div>;
  }

  if (members.length === 0) {
    return <div className="text-center py-10 text-gray-400">ยังไม่มีข้อมูลสมาชิกในระบบ</div>;
  }

  return (
    <div className="space-y-4">
      {sortedGroups.map((group) => {
        const { candidateInfo, membersList } = group;
        const isOpen = expandedPartyId === candidateInfo.id;

        return (
          <div
            key={candidateInfo.id}
            className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-purple-200 shadow-md bg-white' : 'border-gray-100 bg-white hover:border-purple-100'}`}
          >
            {/* --- Header ของพรรค (กดเพื่อเปิด/ปิด) --- */}
            <div
              onClick={() => toggleAccordion(candidateInfo.id)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Logo พรรค */}
                <div className="w-12 h-12 rounded-lg border border-gray-100 p-1 bg-white shrink-0">
                  {candidateInfo.logoUrl ? (
                    <img src={getPath(candidateInfo.logoUrl)} alt="Logo" className="w-full h-full object-contain rounded-md" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">No Logo</div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 text-lg leading-tight">
                    {candidateInfo.name}
                  </h4>
                  <p className="text-sm text-purple-600 font-medium">
                    เบอร์ {candidateInfo.number} • สมาชิก {membersList.length} คน
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* ปุ่ม Edit (กดแล้วส่ง candidate กลับไปให้ parent จัดการ modal) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // กันไม่ให้ Accordion พับ
                    onEditParty(candidateInfo); // เปิด Modal แก้ไขพรรคนี้
                  }}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
                  title="แก้ไขสมาชิกพรรคนี้"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* ปุ่มลูกศร Expand */}
                <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-gray-100' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* --- เนื้อหารายชื่อสมาชิก (Table) --- */}
            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50/50 animate-fade-in-down">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 font-medium border-b border-gray-100 bg-gray-50">
                      <tr>
                        <th className="py-3 px-6 w-16">รูป</th>
                        <th className="py-3 px-6">รหัสนักศึกษา</th>
                        <th className="py-3 px-6">ชื่อ-นามสกุล</th>
                        <th className="py-3 px-6">ตำแหน่ง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {membersList.map((member) => (
                        <tr key={member.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-3 px-6">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                              {member.imageUrl ? (
                                <img src={member.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-6 font-mono text-gray-600">{member.studentId}</td>
                          <td className="py-3 px-6 font-bold text-gray-800">{member.name}</td>
                          <td className="py-3 px-6">
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                              {member.position}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer ของ Card */}
                <div className="p-3 text-center border-t border-gray-100 bg-white">
                  <button
                    onClick={() => onEditParty(candidateInfo)}
                    className="text-xs text-purple-600 font-bold hover:underline flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> จัดการสมาชิกพรรคนี้
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}