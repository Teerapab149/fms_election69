"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Navbar from '../../components/Navbar';
import PartyCard from '../../components/PartyCard';
import PartyDetailModal from '../../components/PartyDetailModal';
// ✅ 1. Import Modal ยืนยันเข้ามา
import VoteConfirmationModal from '../../components/VoteConfirmationModal'; 
import { XCircle, AlertCircle } from 'lucide-react';

export default function VotePage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // State สำหรับ Modal รายละเอียดพรรค (ดูข้อมูล)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partyForModal, setPartyForModal] = useState(null);

  // ✅ 2. State สำหรับ Modal ยืนยันการโหวต (Confirmation)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem("currentUser");
        if (!userStr) { router.push("/login"); return; }
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        if (user.isVoted) { router.push("/results"); return; }

        const res = await fetch('/api/results');
        const data = await res.json();
        if (data.candidates) {
          setCandidates(data.candidates.sort((a, b) => a.number - b.number));
        }
      } catch (error) { console.error("Error:", error); }
    };
    fetchData();
  }, [router]);

  const handleViewDetails = (party) => {
    setPartyForModal(party);
    setIsModalOpen(true);
  };

  const handleSelectParty = (id) => {
    setSelectedPartyId(prev => prev === id ? null : id);
  };

  // ✅ 3. เปลี่ยนปุ่ม Confirm ให้แค่ "เปิด Modal" (ยังไม่ยิง API)
  const handleConfirmClick = () => {
    if (!currentUser || selectedPartyId === null) return;
    setIsConfirmModalOpen(true);
  };

  // ✅ 4. ฟังก์ชันยิง API จริงๆ (จะถูกเรียกโดย Modal)
  const submitVote = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser.studentId,
          candidateId: selectedPartyId
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedUser = { ...currentUser, isVoted: true };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      
      // ปิด Modal และไปหน้าผลลัพธ์
      setIsConfirmModalOpen(false);
      router.push("/success");

    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
      setIsConfirmModalOpen(false); // ปิด Modal ถ้า Error
    } finally {
      setIsSubmitting(false);
    }
  };

  const regularParties = candidates.filter(c => c.number !== 0);
  const voteNoOption = candidates.find(c => c.number === 0);
  const isFourParties = regularParties.length === 4;

  // เตรียมข้อมูลสำหรับส่งเข้า Modal ยืนยัน
  const selectedParty = candidates.find(c => c.id === selectedPartyId);
  const isVoteNo = selectedParty?.number === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] font-sans selection:bg-purple-100 pb-32 overflow-x-hidden relative">
      <Navbar />

      {/* Background Grid */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}>
      </div>

      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-50/40 via-white/10 to-transparent z-0 pointer-events-none"></div>

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-4xl w-full">
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-black text-[#8A2680] mb-2 tracking-tight drop-shadow-sm">
            เลือกตั้งสโมสรนักศึกษา
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-500 font-medium">
            สวัสดีคุณ <span className="font-bold text-[#8A2680]">{currentUser?.name}</span> โปรดเลือกพรรคที่ต้องการ
          </p>
        </div>

        {/* --- ส่วนที่ 1: รายชื่อผู้สมัคร (Grid) --- */}
        <div className={`
            grid gap-4 md:gap-6 animate-fade-in-up delay-100 mb-10
            grid-cols-2 
            ${isFourParties ? 'lg:grid-cols-2 max-w-3xl mx-auto' : 'lg:grid-cols-3'} 
        `}>
          {regularParties.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              isSelected={selectedPartyId === party.id}
              onSelect={handleSelectParty}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {/* --- ส่วนที่ 2: ช่องไม่ประสงค์ลงคะแนน --- */}
        {voteNoOption && (
          <div className="max-w-md mx-auto animate-fade-in-up delay-200 mb-8 w-full">
            {/* Separator */}
            <div className="relative flex items-center justify-center gap-4 py-6 opacity-60">
              <div className="hidden md:block flex-grow h-px bg-slate-300"></div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider bg-transparent px-3 text-center whitespace-nowrap">
                หากไม่ประสงค์ลงคะแนน
              </span>
              <div className="hidden md:block flex-grow h-px bg-slate-300"></div>
            </div>

            <div
              onClick={() => handleSelectParty(voteNoOption.id)}
              className={`
                        relative w-full rounded-2xl p-4 flex items-center gap-3 md:gap-4 cursor-pointer transition-all duration-200 border-2 group
                        ${selectedPartyId === voteNoOption.id
                  ? 'bg-red-50 border-red-500 shadow-lg ring-1 ring-red-200 scale-[1.02]' 
                  : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-md'
                }
                    `}
            >
              <div className={`
                        w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors shrink-0
                        ${selectedPartyId === voteNoOption.id ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 bg-slate-50 group-hover:border-slate-400 text-slate-300'}
                    `}>
                <XCircle size={28} />
              </div>

              <div className="flex-grow min-w-0">
                <h3 className={`font-bold text-base md:text-xl ${selectedPartyId === voteNoOption.id ? 'text-red-700' : 'text-slate-700'}`}>
                  ไม่ประสงค์ลงคะแนน
                </h3>
                <p className="text-xs text-slate-400 truncate">เลือกช่องนี้หากไม่ต้องการเลือกผู้สมัครใด</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- Footer --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 p-3 md:p-4 shadow-[0_-5px_30px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 md:gap-4">

          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 ml-1">ตัวเลือกของคุณ</p>
            <div className="font-bold text-slate-800 text-base md:text-xl truncate flex items-center gap-2">
              {selectedPartyId === null ? (
                <span className="text-slate-400 flex items-center gap-1 text-sm"><AlertCircle size={16} /> กรุณาเลือก 1 ช่อง</span>
              ) : (
                selectedPartyId === voteNoOption?.id
                  ? <span className="text-red-600 text-base md:text-xl flex items-center gap-1">
                    <XCircle size={18} /> ไม่ประสงค์ลงคะแนน
                  </span>
                  : <span className="text-[#8A2680] text-base md:text-xl truncate">
                    {candidates.find(c => c.id === selectedPartyId)?.name}
                  </span>
              )}
            </div>
          </div>

          <button
            // ✅ เปลี่ยนเป็น handleConfirmClick (เพื่อเปิด Modal)
            onClick={handleConfirmClick}
            disabled={selectedPartyId === null || isSubmitting}
            className={`
                    px-6 py-2.5 md:py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 justify-center text-sm md:text-base min-w-[120px]
                    ${selectedPartyId === null
                ? 'bg-slate-300 cursor-not-allowed shadow-none opacity-70'
                : 'bg-gradient-to-r from-[#8A2680] to-[#701e68] hover:scale-[1.02] active:scale-95 shadow-purple-200'
              }
                `}
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการลงคะแนน'}
          </button>
        </div>
      </div>

      <PartyDetailModal
        party={partyForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showVoteButton={false}
      />

      {/* ✅ 5. ใส่ Modal ยืนยันไว้ตรงนี้ */}
      <VoteConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={submitVote} // เมื่อกดยืนยันใน Modal ให้เรียก submitVote
        party={selectedParty}
        isVoteNo={isVoteNo}
      />
    </div>
  );
}