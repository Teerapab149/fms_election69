'use client';
import { getPath } from "../../utils/basePath";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResultCard from "../../components/ResultCard";
import CandidateCard from "../../components/CandidateCard";
import EditCandidateModal from "../../components/EditCandidateModal";
import EditCandidateMember from "../../components/EditCandidateMember";
import EditCandidateMemberModal from "../../components/EditCandidateMemberModal";
import CompletedActionModal from "../../components/CompletedActionModal";
import ErrorActionModal from "../../components/ErrorActionModal";
import ConfirmModal from "../../components/ConfirmModal";
import PageDesignTab from "../../components/admin/PageDesignTab";
import GlobalConfigTab from "../../components/admin/GlobalConfigTab";
import { AlertTriangle, CalendarDays, Power, PieChart as PieIcon, BarChart3, Medal, Trash2, CalendarPlus2, Hourglass, Zap, Link as LinkIcon, Save, Palette, Settings, PanelLeftClose, PanelLeftOpen, Menu, X, LogOut } from "lucide-react";
import Image from 'next/image';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { resolveElectionDates } from "../../utils/electionConfig";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

const OverviewTab = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState('LOADING');

  const globalConfig = useGlobalConfig();
  const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);

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
      // Admin identity = httpOnly admin_token cookie (sent automatically) — the
      // old client-minted x-admin-token header was removed (P0-1).
      const res = await fetch(getPath("/api/results"), { credentials: 'include' });

      const data = await res.json();

      if (data.candidates) {
        const sortedCandidates = data.candidates.sort((a, b) => b.score - a.score);
        setCandidates(sortedCandidates);

        if (typeof data.totalVotes !== 'undefined') {
          setTotalVotes(data.totalVotes);
        } else {
          setTotalVotes(data.candidates.reduce((acc, curr) => acc + curr.score, 0));
        }
      }

      if (data.stats) {
        const yearOrder = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];

        const sortedByYear = data.stats.byYear
          ? data.stats.byYear
            .filter(item => item.name !== 'อื่นๆ')
            .sort((a, b) => {
              const indexA = yearOrder.indexOf(a.name);
              const indexB = yearOrder.indexOf(b.name);
              return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
            })
          : [];

        // Mapping Names (M -> Male, F -> Female)
        const genderMap = {
          'm': 'Male',
          'f': 'Female',
          'ชาย': 'Male',
          'หญิง': 'Female',
          'male': 'Male',
          'female': 'Female'
        };

        const processedGender = data.stats.byGender ? data.stats.byGender.map(g => ({
          ...g,
          name: genderMap[String(g.name).toLowerCase()] || g.name
        })) : [];

        const genderOrder = ['Male', 'Female'];
        const sortedByGender = processedGender.sort((a, b) => {
          const indexA = genderOrder.indexOf(a.name);
          const indexB = genderOrder.indexOf(b.name);
          const valA = indexA === -1 ? 999 : indexA;
          const valB = indexB === -1 ? 999 : indexB;
          return valA - valB;
        });

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

    fetchResults();
    const interval = setInterval(fetchResults, 5000);

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
          <p className="text-3xl font-black text-gray-800 mt-1">
            {candidates.filter((e) => parseInt(e.number) > 0).length} Teams
          </p>
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

const CandidatesTab = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [focusMemberId, setFocusMemberId] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', msg: '' });

  const fetchResults = async () => {
    setCandidates([]);
    try {
      const res = await fetch(getPath(`/api/results?t=${Date.now()}`), {
        cache: 'no-store',
        credentials: 'include',
      });
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
    setFocusMemberId(null);
    setIsEditModalOpen(true);
  };

  const handleEditClickMember = (candidate = null, memberId = null) => {
    setSelectedCandidate(candidate);
    setFocusMemberId(memberId);
    setIsEditMemberModalOpen(true);
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
                candidates.filter(e => e.number > 0).map((candidate) => {
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

        <EditCandidateMemberModal
          isOpen={isEditMemberModalOpen}
          onClose={() => setIsEditMemberModalOpen(false)}
          candidate={selectedCandidate}
          focusMemberId={focusMemberId}
          onUpdate={handleUpdateSuccess}
        />

      </div>

      <div className="p-3" />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
          <h3 className="text-base lg:text-xl font-bold text-slate-700">สมาชิกพรรค</h3>
        </div>

        <div>
          {/* Members */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400">Loading...</p></div>
          ) : (
            <div className="grid grid-cols-1 h-500 sm:grid-cols-2 lg:grid-cols-2 gap-0 sm:gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl overflow-hidden sm:overflow-visible border sm:border-0 border-slate-100 shadow-sm sm:shadow-none">
              {
                candidates.filter(e => e.number > 0).map((candidate, index) => {
                  return (
                    <div key={candidate.id}>
                      <EditCandidateMember
                        candidate={candidate}
                        onClick={(memberId) => handleEditClickMember(candidate, memberId)}
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div>

        </div>

      </div>
    </div>
  )
};

const SettingsTab = () => {
  const [systemMode, setSystemMode] = useState("AUTO");
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [isShowResult, setIsShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', msg: '' });

  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', msg: '' });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(getPath('/api/admin/dashboard'), { credentials: 'include' });
        const data = await res.json();
        if (data.stats) {
          setSystemMode(data.stats.systemMode || "AUTO");
          setGoogleFormUrl(data.stats.googleFormUrl || "");
          setIsShowResult(data.stats.showResult);
        }
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
      let action = activeModal;
      let body = { action };

      if (action === 'SET_MODE') {
        body.mode = pendingMode;
      }

      if (action === 'SET_GOOGLE_FORM') {
        body.url = googleFormUrl;
      }

      const res = await fetch(getPath('/api/admin/dashboard'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setActiveModal(null);

      if (res.ok) {
        if (action === 'SET_MODE') {
          setSuccessMessage({ title: 'บันทึกสำเร็จ!', msg: `เปลี่ยนโหมดระบบเป็น ${pendingMode} เรียบร้อยแล้ว` });
          setSystemMode(pendingMode);
        } else if (action === 'SET_GOOGLE_FORM') {
          setSuccessMessage({ title: 'บันทึกสำเร็จ!', msg: 'อัปเดตลิงก์ Google Form เรียบร้อยแล้ว' });
        } else if (action === 'TOGGLE_SHOW_RESULT') {
          setSuccessMessage({ title: 'บันทึกสำเร็จ!', msg: 'การตั้งค่าการแสดงผลได้ถูกเปลี่ยนแปลงเรียบร้อยแล้ว' });
          setIsShowResult(!isShowResult);
        } else if (action === 'RESET_VOTES') {
          setSuccessMessage({ title: 'ล้างข้อมูลสำเร็จ!', msg: 'ระบบได้ทำการรีเซ็ตคะแนนทั้งหมดเป็น 0 เรียบร้อยแล้ว' });
        } else if (action === 'RESET_CANDIDATES') {
          setSuccessMessage({ title: 'ล้างข้อมูลสำเร็จ!', msg: 'ระบบได้ทำการรีเซ็ตข้อมูลพรรคผู้สมัครและสมาชิกพรรคทั้งหมด เรียบร้อยแล้ว' });
        }
        setIsSuccessOpen(true);
      } else {
        setErrorMessage({ title: `Error ${res.status}`, msg: res.statusText });
        setIsErrorOpen(true);
      }
    } catch (error) {
      console.error("Action failed!", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleModeChange = (newMode) => {
    if (newMode === systemMode) return; // ✅ Prevent redundant actions
    setPendingMode(newMode);
    setActiveModal('SET_MODE');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><Power className="h-6 w-6" /></div>
        <h3 className="text-xl font-bold text-slate-700">ตั้งค่าระบบเลือกตั้ง (System Mode)</h3>
      </div>

      <div className='space-y-6'>
        {/* --- 3-WAY MODE SELECTOR --- */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-800">ระบบการทำงาน</h4>
              <p className="text-sm text-slate-500">เลือกโหมดการทำงานของระบบให้เหมาะสมกับสถานการณ์ปัจจุบัน</p>
            </div>

            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200">
              {[
                { id: 'AUTO', label: 'AUTO (อัตโนมัติ)', color: 'bg-green-500', icon: <CalendarDays className="w-4 h-4" /> },
                { id: 'MANUAL_OPEN', label: 'OPEN (เปิดระบบ)', color: 'bg-blue-600', icon: <Zap className="w-4 h-4" /> },
                { id: 'PAUSE', label: 'PAUSE (ระงับ)', color: 'bg-orange-500', icon: <Hourglass className="w-4 h-4" /> },
                { id: 'ENDED', label: 'ENDED (ปิดระบบ)', color: 'bg-red-500', icon: <Power className="w-4 h-4" /> }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  disabled={systemMode === m.id || processing} // ✅ Disable if same mode or processing
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${systemMode === m.id
                    ? `${m.color} text-white shadow-lg cursor-default`
                    : 'text-slate-500 hover:bg-slate-300 disabled:opacity-50'
                    }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Status Badge */}
          <div className="mt-6 flex items-center gap-3 py-3 px-4 bg-white/60 rounded-xl border border-dashed border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${systemMode === 'AUTO' ? 'bg-green-500' :
                systemMode === 'MANUAL_OPEN' ? 'bg-blue-600' :
                  systemMode === 'PAUSE' ? 'bg-orange-500' : 'bg-red-500'
                }`} />
              <span className="text-sm font-black text-slate-700">
                {systemMode === "AUTO" ? "ระบบทำงานอัตโนมัติตามกำหนดเวลา" :
                  systemMode === "MANUAL_OPEN" ? "เปิดรับคะแนนด้วยตนเอง (Force Open)" :
                    systemMode === "PAUSE" ? "ระงับการโหวตชั่วคราว ( maintenance )" : "ปิดการเลือกตั้งอย่างเป็นทางการ"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-end gap-3 p-6 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-full">
            <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
              <LinkIcon className="w-5 h-5 text-indigo-600" />
              Link Google Form
            </h4>
            <p className="text-xs text-slate-500 mb-2">ลิงก์สำหรับหน้าประเมินผล (Success Page)</p>
            <input
              type="text"
              value={googleFormUrl}
              onChange={(e) => setGoogleFormUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="https://docs.google.com/forms/..."
            />
          </div>
          <button
            onClick={() => setActiveModal('SET_GOOGLE_FORM')}
            className="shrink-0 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Save size={16} />
            Save
          </button>
        </div>

        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-600" />
              การแสดงผลคะแนน
            </h4>
            <p className="text-xs text-slate-500 mt-1">บังคับโชว์ผลคะแนนแบบ Real-time แม้จะยังไม่ถึงเวลาปิดหีบ</p>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-sm font-bold transition-colors ${isShowResult ? 'text-green-600' : 'text-red-500'}`}>
              {loading ? '' : (isShowResult ? '🟢 แสดงผล' : '🔴 ซ่อนผล')}
            </span>

            {loading ? '' : (
              <button
                onClick={() => setActiveModal('TOGGLE_SHOW_RESULT')}
                disabled={loading || processing}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isShowResult ? 'bg-green-500' : 'bg-gray-300'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
              >
                <span className={`${isShowResult ? 'translate-x-9' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md`} />
              </button>
            )}
          </div>
        </div>

        <div className='p-3' />

        <div className="flex items-center justify-between p-6 bg-red-50 rounded-xl border border-red-100 transition-colors hover:border-red-300">
          <div>
            <h4 className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ล้างคะแนนโหวตทั้งหมด
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
              ล้างพรรคและสมาชิกทั้งหมด
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

      <ErrorActionModal
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        title={errorMessage.title}
        message={errorMessage.msg}
      />

      <ConfirmModal
        isOpen={activeModal === 'SET_MODE'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title="เปลี่ยนโหมดการทำงาน?"
        message={`คุณกำลังจะเปลี่ยนโหมดระบบเป็น "${pendingMode}" ยืนยันการดำเนินการหรือไม่?`}
        variant="primary"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'TOGGLE_SHOW_RESULT'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title={isShowResult ? "ซ่อนผลคะแนน?" : "แสดงผลคะแนน?"}
        message={isShowResult
          ? "เมื่อซ่อนผลคะแนน ข้อมูลสถิติและผลโหวตจะถูกปิดกั้น"
          : "เมื่อแสดงผลคะแนน ทุกคนจะสามารถเข้าดูผลโหวตได้ทันที แม้ระบบโหวตจะปิดอยู่"}
        variant="primary"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'RESET_VOTES'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title="⚠️ ยืนยันการล้างระบบ?"
        message={`ผลคะแนนทั้งหมดและสิทธิ์การโหวตของผู้ใช้ทุกคนจะถูกรีเซ็ต`}
        variant="danger"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'RESET_CANDIDATES'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title="⚠️ ยืนยันการล้างระบบ?"
        message={`ข้อมูลพรรคผู้สมัครและสมาชิกพรรคทั้งหมดจะถูกลบ`}
        variant="danger"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'SET_GOOGLE_FORM'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title="บันทึกลิงก์ Google Form?"
        message={`ต้องการอัปเดตลิงก์ Google Form ใช่หรือไม่?`}
        variant="primary"
        isLoading={processing}
      />
    </div >
  )
};


export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  // Collapsible sidebar: icon-rail (collapsed) ↔ full labels (expanded).
  // Auto-collapse on the editor tab to give the canvas room; user can toggle.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => { setSidebarCollapsed(activeTab === 'pageDesign'); }, [activeTab]);
  useEffect(() => { setMobileNavOpen(false); }, [activeTab]);

  const handleLogout = async () => {
    try {
      await fetch(getPath('/api/admin/logout'), { method: 'POST' });
      window.location.href = getPath('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'ภาพรวม', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'globalConfig', label: 'ตั้งค่าทั่วไป', icon: <Settings className="h-5 w-5" /> },
    { id: 'candidates', label: 'จัดการผู้สมัคร', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'pageDesign', label: 'ออกแบบหน้าเว็บ', icon: <Palette className="h-5 w-5" /> },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">

      {/* Mobile drawer backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — collapsible icon-rail (desktop) / slide-in drawer (mobile) */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200 flex flex-col
          transition-[width,transform] duration-300 ease-out
          ${sidebarCollapsed ? 'w-64 md:w-[76px]' : 'w-64'}
          ${mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Brand + toggle */}
        <div className={`h-[68px] shrink-0 border-b border-gray-100 flex items-center gap-2.5 ${sidebarCollapsed ? 'md:justify-center px-3' : 'px-5'}`}>
          <Image
            src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")}
            alt="FMS PSU"
            width={1200}
            height={384}
            className={`w-auto h-7 object-contain ${sidebarCollapsed ? 'md:hidden' : ''}`}
            priority
          />
          <span className={`text-[11px] font-bold tracking-wide text-[#8A2680] bg-purple-50 border border-purple-100 rounded-md px-2 py-0.5 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
            Admin
          </span>
          {/* desktop collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'ขยายเมนู' : 'ยุบเมนู'}
            className="hidden md:flex ml-auto items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#8A2680] hover:bg-purple-50 transition-colors shrink-0"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          {/* mobile close */}
          <button
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden ml-auto flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-medium rounded-xl transition-all
                ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}
                ${activeTab === item.id
                  ? 'bg-purple-50 text-[#8A2680] shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={sidebarCollapsed ? 'md:hidden' : ''}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={sidebarCollapsed ? 'md:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-[margin] duration-300 ease-out ${sidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-64'}`}>

        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-gray-800 md:hidden">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">Administrator</p>
              <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 bg-gray-50">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'globalConfig' && <GlobalConfigTab />}
          {activeTab === 'candidates' && <CandidatesTab />}
          {activeTab === 'pageDesign' && <PageDesignTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>

    </div>
  );
}