'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResultCard from "../../components/ResultCard";
import CandidateCard from "../../components/CandidateCard";
import EditCandidateModal from "../../components/EditCandidateModal";
import CompletedActionModal from "../../components/CompletedActionModal";
import ConfirmModal from "../../components/ConfirmModal";
import { AlertTriangle, CalendarDays, Power, PieChart as PieIcon, BarChart3, Medal, Trash2, CalendarPlus2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const OverviewTab = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState('LOADING'); // LOADING, WAITING, RUNNING, ENDED

  const ELECTION_START = new Date('2026-02-06T08:00:00'); // เริ่ม 6 ก.พ. 08:00
  const ELECTION_END = new Date('2026-02-06T17:30:00'); // จบ 6 ก.พ. 16:00

  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [demographics, setDemographics] = useState({
    totalEligible: 0,
    byMajor: [],
    byYear: [],
    byGender: []
  });

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/results");
      const data = await res.json();

      if (data.candidates) {
        const sortedCandidates = data.candidates.sort((a, b) => b.score - a.score);
        setCandidates(sortedCandidates);
        setTotalVotes(data.candidates.reduce((acc, curr) => acc + curr.score, 0));
      }

      if (data.stats) {
        const yearOrder = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'อื่นๆ'];
        const sortedByYear = data.stats.byYear ? [...data.stats.byYear].sort((a, b) => {
          const indexA = yearOrder.indexOf(a.name);
          const indexB = yearOrder.indexOf(b.name);
          return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        }) : [];

        const genderOrder = ['ชาย', 'หญิง'];
        const sortedByGender = data.stats.byGender ? [...data.stats.byGender].sort((a, b) => {
          return genderOrder.indexOf(a.name) - genderOrder.indexOf(b.name);
        }) : [];

        setDemographics({
          ...data.stats,
          byYear: sortedByYear,
          byGender: sortedByGender
        });
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      if (now < ELECTION_START) {
        setPhase('WAITING');
        return ELECTION_START - now;
      } else if (now >= ELECTION_START && now < ELECTION_END) {
        setPhase('RUNNING');
        return ELECTION_END - now;
      } else {
        setPhase('ENDED');
        return 0;
      }
    };

    const timer = setInterval(() => {
      const diff = calculate();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);
    const interval = setInterval(fetchResults, 5000);
    fetchResults();
    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };

  }, []);

  const isEnded = phase === 'ENDED';

  let theme = "Loading...";
  if (phase === 'WAITING') theme = "Starts In";
  if (phase === 'RUNNING') theme = "Time Left";
  if (phase === 'ENDED') theme = "Status";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{demographics.totalEligible > 0 ? ((totalVotes / demographics.totalEligible) * 100).toFixed(2) : 0}%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Votes</h3>
          <p className="text-3xl font-black text-gray-800 mt-1">{totalVotes.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">จากผู้มีสิทธิทั้งหมด {demographics.totalEligible.toLocaleString()} คน</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Candidates</h3>
          <p className="text-3xl font-black text-gray-800 mt-1">{candidates.filter((e) => e.number != 0).length} Teams</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${isEnded ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isEnded ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
              {phase}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{theme}</h3>
          <p className="text-3xl font-black text-gray-800 mt-1">
            {isEnded ? (
              <span className="text-red-500">Ended</span>
            ) : (
              <>
                {timeLeft.days > 0 && (
                  <span className="mr-2">{timeLeft.days} วัน</span>
                )}
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
};

// 2. หน้าจัดการผู้สมัคร
const CandidatesTab = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', msg: '' });

  const fetchResults = async () => {
    setCandidates([]);
    try {
      const res = await fetch("/api/results");
      const data = await res.json();

      if (data.candidates) {
        const sortedCandidates = data.candidates.sort((a, b) => a.id - b.id);
        setCandidates(sortedCandidates);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuccess = (actionType) => {
    fetchResults();

    let title = "ดำเนินการสำเร็จ";
    let msg = "ข้อมูลได้ถูกบันทึกเรียบร้อยแล้ว";

    if (actionType === 'DELETE') {
      title = "ลบข้อมูลสำเร็จ";
      msg = "ข้อมูลผู้สมัครถูกลบออกจากระบบแล้ว";
    } else if (actionType === 'CREATE') {
      title = "เพิ่มข้อมูลสำเร็จ";
      msg = "เพิ่มผู้สมัครรายใหม่เรียบร้อยแล้ว";
    } else if (actionType === 'UPDATE') {
      title = "แก้ไขข้อมูลสำเร็จ";
      msg = "ข้อมูลผู้สมัครได้รับการอัปเดตแล้ว";
    }

    setSuccessMessage({ title, msg });
    setIsSuccessOpen(true);
  };

  const handleEditClick = (candidate = null) => {
    setSelectedCandidate(candidate);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
          <h3 className="text-base lg:text-xl font-bold text-slate-700">พรรคผู้สมัคร</h3>
          <button
            onClick={() => handleEditClick(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-green-200 text-green-600 hover:bg-green-600 hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95" >
            <CalendarPlus2 className="w-4 h-4" />
            New
          </button>
        </div>

        <div>
          {/* Candidates */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400">Loading...</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl overflow-hidden sm:overflow-visible border sm:border-0 border-slate-100 shadow-sm sm:shadow-none">
              {
                candidates.filter(e => e.number != 0).map((candidate, index) => {
                  return (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onClick={() => handleEditClick(candidate)}
                    />
                  );
                })}
            </div>
          )}
        </div>

        <CompletedActionModal
          isOpen={isSuccessOpen}
          onClose={() => setIsSuccessOpen(false)}
          title={successMessage.title}
          message={successMessage.msg}
        />

        <ConfirmModal
          isOpen={activeModal === 'DELETE'}
          onClose={() => setActiveModal(null)}
          title="Confirmation"
          message="ต้องการจะลบผู้สมัครนี้ใช่หรือไม่"
          variant="danger"
          isLoading={processing}
        />

        <EditCandidateModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          candidate={selectedCandidate}
          onUpdate={(actionType) => handleUpdateSuccess(actionType)}
        />

      </div>

      <div className="p-3" />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
          <h3 className="text-base lg:text-xl font-bold text-slate-700">สมาชิกพรรค</h3>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-green-200 text-green-600 hover:bg-green-600 hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95" >
            <CalendarPlus2 className="w-4 h-4" />
            New
          </button>
        </div>

        <div>

        </div>

      </div>
    </div>
  )
};

// 3. หน้าตั้งค่า
const SettingsTab = () => {
  const [isVoteOpen, setIsVoteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [activeModal, setActiveModal] = useState(null);

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', msg: '' });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        if (data.stats) setIsVoteOpen(data.stats.isVoteOpen);
      } catch (error) {
        console.error("Failed to fetch config", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleConfirmAction = async () => {
    if (!activeModal) return;

    setProcessing(true);

    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: activeModal }),
      });

      setActiveModal(null);

      if (res.ok) {

        if (activeModal === 'TOGGLE_VOTE') {
          setSuccessMessage({ title: 'บันทึกสำเร็จ!', msg: 'สถานะการโหวตได้ถูกเปลี่ยนแปลงเรียบร้อยแล้ว' });
          setIsVoteOpen(!isVoteOpen);
        } else {
          if (activeModal === 'RESET_VOTES') {
            setSuccessMessage({ title: 'ล้างข้อมูลสำเร็จ!', msg: 'ระบบได้ทำการรีเซ็ตคะแนนทั้งหมดเป็น 0 เรียบร้อยแล้ว' });
          } else {
            if (activeModal === 'RESET_CANDIDATES') {
              setSuccessMessage({ title: 'ล้างข้อมูลสำเร็จ!', msg: 'ระบบได้ทำการรีเซ็ตข้อมูลพรรคผู้สมัครและสมาชิกพรรคทั้งหมด เรียบร้อยแล้ว' });
            } else {
              setSuccessMessage({ title: '???', msg: '???' });
            }
          }
        }

        setIsSuccessOpen(true);
      }
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
        <h3 className="text-base lg:text-xl font-bold text-slate-700">ตั้งค่าระบบ</h3>
      </div>
      <div className='p-3 gap-3'>
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Power className="w-5 h-5 text-purple-600" />
              สถานะระบบเลือกตั้ง
            </h4>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-sm font-bold transition-colors ${isVoteOpen ? 'text-green-600' : 'text-red-500'}`}>
              {loading ? '' : (isVoteOpen ? '🟢 เปิดรับคะแนน' : '🔴 ปิดรับคะแนน')}
            </span>

            {/* ปุ่ม Switch */}
            {loading ? '' : (
              <button
                onClick={() => setActiveModal('TOGGLE_VOTE')}
                disabled={loading || processing}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isVoteOpen ? 'bg-green-500' : 'bg-gray-300'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
              >
                <span className={`${isVoteOpen ? 'translate-x-9' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md`} />
              </button>
            )}
          </div>
        </div>

        <div className='p-3' />

        <div className="flex items-center justify-between p-6 bg-red-50 rounded-xl border border-red-100 transition-colors hover:border-red-300">
          <div>
            <h4 className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ล้างคะแนนโหวตทั้งหมด และรีเซ็ตสิทธิ์การโหวตทั้งหมด
            </h4>
          </div>

          <button
            onClick={() => setActiveModal('RESET_VOTES')}
            disabled={processing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </button>
        </div>

        <div className='p-3' />

        <div className="flex items-center justify-between p-6 bg-red-50 rounded-xl border border-red-100 transition-colors hover:border-red-300">
          <div>
            <h4 className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ล้างข้อมูลพรรคผู้สมัครและสมาชิกพรรคทั้งหมด
            </h4>
          </div>

          <button
            onClick={() => setActiveModal('RESET_CANDIDATES')}
            disabled={processing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <CompletedActionModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title={successMessage.title}
        message={successMessage.msg}
      />

      <ConfirmModal
        isOpen={activeModal === 'TOGGLE_VOTE'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title={isVoteOpen ? "ต้องการปิดระบบโหวต?" : "ต้องการเปิดระบบโหวต?"}
        message={isVoteOpen
          ? "เมื่อปิดระบบ นักศึกษาจะไม่สามารถลงคะแนนได้อีก แต่ยังสามารถดูผลคะแนนได้"
          : "เมื่อเปิดระบบ นักศึกษาจะสามารถเริ่มลงคะแนนได้ทันที"}
        variant="primary" // สีม่วง
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'RESET_VOTES'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title="⚠️ ยืนยันการล้างระบบ?"
        message={`ผลคะแนนทั้งหมดและสิทธิ์การโหวตของผู้ใช้ทุกคนจะถูกรีเซ็ต`}
        variant="danger" // สีแดง
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'RESET_CANDIDATES'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title="⚠️ ยืนยันการล้างระบบ?"
        message={`ข้อมูลพรรคผู้สมัครและสมาชิกพรรคทั้งหมดจะถูกลบ`}
        variant="danger" // สีแดง
        isLoading={processing}
      />

    </div>
  )
};

// 4. หน้า Monitor
const MonitorTab = () => {
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [demographics, setDemographics] = useState({
    totalEligible: 0,
    byMajor: [],
    byYear: [],
    byGender: []
  });

  const COLORS_GENDER = ['#3b82f6', '#ec4899'];
  const COLORS_BAR = '#8A2680';

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/results");
      const data = await res.json();

      if (data.candidates) {
        const sortedCandidates = data.candidates.sort((a, b) => b.score - a.score);
        setCandidates(sortedCandidates);
        setTotalVotes(data.candidates.reduce((acc, curr) => acc + curr.score, 0));
      }

      if (data.stats) {
        const yearOrder = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'อื่นๆ'];
        const sortedByYear = data.stats.byYear ? [...data.stats.byYear].sort((a, b) => {
          const indexA = yearOrder.indexOf(a.name);
          const indexB = yearOrder.indexOf(b.name);
          return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        }) : [];

        const genderOrder = ['ชาย', 'หญิง'];
        const sortedByGender = data.stats.byGender ? [...data.stats.byGender].sort((a, b) => {
          return genderOrder.indexOf(a.name) - genderOrder.indexOf(b.name);
        }) : [];

        setDemographics({
          ...data.stats,
          byYear: sortedByYear,
          byGender: sortedByGender
        });
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  const ELECTION_START = new Date(2024, 1, 6, 8, 0, 0);
  const ELECTION_END = new Date(2024, 1, 6, 16, 0, 0);
  const now = currentTime;
  let electionStatus = "WAITING";
  let targetDate = ELECTION_START;

  if (now < ELECTION_START) {
    electionStatus = "WAITING";
    targetDate = ELECTION_START;
  } else if (now >= ELECTION_START && now < ELECTION_END) {
    electionStatus = "ONGOING";
    targetDate = ELECTION_END;
  } else {
    electionStatus = "ENDED";
  }

  const IS_ELECTION_ENDED = (electionStatus === "ENDED");
  const timeDiff = targetDate - now;
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
  const seconds = Math.floor((timeDiff / 1000) % 60);

  let countdownText = "";
  if (days > 0) countdownText = `${days} วัน ${hours} ชม. ${minutes} น.`;
  else if (hours > 0) countdownText = `${hours} ชม. ${minutes} น. ${seconds} วิ.`;
  else countdownText = `${minutes} น. ${seconds} วิ.`;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-green-50 text-green-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
        <h3 className="text-base lg:text-xl font-bold text-slate-700">ผลคะแนนสด</h3>
      </div>

      <div>
        {/* Candidates */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400">Loading...</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl overflow-hidden sm:overflow-visible border sm:border-0 border-slate-100 shadow-sm sm:shadow-none">
            {candidates.map((candidate, index) => {
              return (
                <ResultCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                  totalVotes={totalVotes}
                  isElectionEnded={IS_ELECTION_ENDED}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className='p-3'></div>

      <div>
        {/* === Section 3: กราฟสถิติ === */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8">

          <div className="order-1 lg:order-2 grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-8 h-full">

            {/* กราฟชั้นปี */}
            <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-2 lg:mb-6">
                <div className="bg-yellow-100 p-1.5 lg:p-2 rounded-lg"><Medal className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" /></div>
                <h3 className="text-sm lg:text-xl font-bold text-slate-700">ชั้นปี</h3>
              </div>
              <div className="h-[160px] lg:h-[250px] w-full text-xs font-medium">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographics.byYear} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 14 }}
                      interval={0}
                    />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* กราฟเพศ */}
            <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-2 lg:mb-6">
                <div className="bg-blue-100 p-1.5 lg:p-2 rounded-lg"><PieIcon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" /></div>
                <h3 className="text-sm lg:text-xl font-bold text-slate-700">เพศ</h3>
              </div>
              <div className="h-[160px] lg:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographics.byGender}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value" stroke="none"
                    >
                      {demographics.byGender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Legend
                      verticalAlign={"middle"}
                      align={"right"}
                      layout={"vertical"}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '14px', paddingTop: '0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* กราฟสาขา (ด้านล่างสุด) */}
          <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4 lg:mb-8">
              <div className="bg-purple-100 p-2 rounded-lg"><BarChart3 className="w-5 h-5 text-[#8A2680]" /></div>
              <h3 className="text-base lg:text-xl font-bold text-slate-700">แยกตามสาขา</h3>
            </div>
            <div className="h-[400px] lg:h-[600px] w-full text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={demographics.byMajor}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={50}
                    tick={{ fontSize: 14, fill: '#64748b' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    fill={COLORS_BAR}
                    radius={[0, 4, 4, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
};


export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // รายการเมนูสำหรับ Sidebar
  const menuItems = [
    { id: 'overview', label: 'ภาพรวม', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'candidates', label: 'จัดการผู้สมัคร', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'monitor', label: 'ผลคะแนนสด', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">

      {/* ✅ 3. Sidebar (เมนูด้านซ้าย) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#8A2680] to-[#3B82F6] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
            A
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-tight">Admin Console</h1>
            <p className="text-[10px] text-gray-500">FMS Election 2026</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === item.id
                ? 'bg-purple-50 text-[#8A2680] shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ✅ 4. Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Top Bar (สำหรับ Mobile หรือแสดงสถานะ) */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 md:static">
          <div className="md:hidden font-bold text-gray-800">Admin Console</div> {/* Mobile Title */}
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">Administrator</p>
              <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
            {/* ปุ่ม Logout แบบเดิม (โชว์เฉพาะ Mobile เพราะ Desktop อยู่ใน Sidebar แล้ว) */}
            <button onClick={handleLogout} className="md:hidden p-2 text-gray-500 hover:text-red-600 bg-gray-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 bg-gray-50">
          {/* ✅ 5. แสดงผลตาม activeTab ที่เลือก */}
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'candidates' && <CandidatesTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'monitor' && <MonitorTab />}
        </main>
      </div>

    </div>
  );
}