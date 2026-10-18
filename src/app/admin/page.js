'use client';
import { getPath } from "../../utils/basePath";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CandidateCard from "../../components/CandidateCard";
import EditCandidateModal from "../../components/EditCandidateModal";
import EditCandidateMember from "../../components/EditCandidateMember";
import EditCandidateMemberModal from "../../components/EditCandidateMemberModal";
import CompletedActionModal from "../../components/CompletedActionModal";
import useBallotLock from "../../hooks/useBallotLock";
import TestToolsTab from "../../components/admin/TestToolsTab";
import TemplateChooserTab from "../../components/admin/TemplateChooserTab";
import GlobalConfigTab from "../../components/admin/GlobalConfigTab";
import ManualTab from "../../components/admin/ManualTab";
import SettingsTab from "../../components/admin/SettingsTab";
import ElectionControl from "../../components/admin/console/ElectionControl";
import TopBarStatus from "../../components/admin/console/TopBarStatus";
import { ElectionStateProvider } from "../../components/admin/console/ElectionStateContext";
import { useToast } from "../../components/admin/console/Toast";
import { useUnsavedGuard } from "../../components/admin/console/useUnsavedGuard";
import { useElectionState } from "../../components/admin/console/ElectionStateContext";
import { Gauge, FlaskConical, ShieldCheck, Settings, Palette, PanelLeftClose, PanelLeftOpen, Menu, X, LogOut, BookOpen, Plus, Users, Flag, UserPlus } from "lucide-react";
import Image from 'next/image';

const CandidatesTab = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [focusMemberId, setFocusMemberId] = useState(null);


  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', msg: '' });
  const toast = useToast();

  // ballot structure locked (ballots in the box, or certified): the add button stays
  // clickable so the modal can explain why, but it looks and reads as unavailable
  const ballotLock = useBallotLock(true);

  // no clearing before the fetch: the member list calls this after a reorder, and
  // emptying the list first flashed the "no parties" state and reset "show all"
  const fetchResults = async () => {
    try {
      const res = await fetch(getPath(`/api/results?t=${Date.now()}`), {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await res.json();

      if (data.candidates) {
        const sortedCandidates = data.candidates.sort((a, b) => a.id - b.id);
        setCandidates(sortedCandidates);
        return sortedCandidates;
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  // opts.keepOpen: the member modal stays open (save and add the next person).
  // Routine saves show a toast that clears itself; a delete keeps the dialog,
  // because it is permanent and should be seen.
  const handleUpdateSuccess = async (actionType, opts) => {
    const list = await fetchResults();

    if (opts?.keepOpen) {
      // the modal is still open on the old party object, hand it the fresh one
      if (list) setSelectedCandidate((prev) => (prev ? (list.find((c) => c.id === prev.id) || prev) : prev));
      toast.show('บันทึกแล้ว');
      return;
    }

    if (actionType === 'DELETE') {
      setSuccessMessage({ title: 'ลบข้อมูลสำเร็จ', msg: 'ข้อมูลผู้สมัครถูกลบออกจากระบบแล้ว' });
      setIsSuccessOpen(true);
    } else if (actionType === 'CREATE') {
      toast.show('เพิ่มผู้สมัครรายใหม่แล้ว');
    } else {
      toast.show('บันทึกการแก้ไขแล้ว');
    }
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

  // พรรคจริงเท่านั้น — เบอร์ 0 (งดออกเสียง) และ -1 (ไม่รับรอง) ระบบสร้างเอง
  // ไม่ใช่สิ่งที่กรรมการต้องมาเพิ่ม/แก้ จึงไม่แสดงในหน้านี้
  const parties = candidates.filter((e) => e.number > 0);
  const memberTotal = parties.reduce((n, c) => n + (c.members?.length || 0), 0);

  return (
    <div>
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <div className="bg-purple-50 text-[#8A2680] p-2 rounded-lg shrink-0">
            <Flag className="h-5 w-5" />
          </div>
          <h3 className="text-base lg:text-xl font-bold text-slate-700">พรรคผู้สมัคร</h3>
          {!loading && parties.length > 0 && (
            <span className="text-xs font-bold text-[#8A2680] bg-purple-50 border border-purple-100 rounded-full px-2.5 py-1">
              {parties.length} พรรค
            </span>
          )}
          <button
            onClick={() => handleEditClick(null)}
            title={ballotLock.locked ? 'เพิ่มพรรคไม่ได้ เพราะมีบัตรในหีบแล้วหรือรับรองผลแล้ว' : undefined}
            className={`ml-auto flex items-center gap-2 px-4 py-2.5 bg-[#8A2680] text-white hover:bg-[#601A59] rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 ${ballotLock.locked ? 'opacity-60' : ''}`}
          >
            <Plus className="w-4 h-4" />
            เพิ่มพรรค
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-5 ml-1">
          ชื่อพรรค เบอร์ โลโก้ สโลแกน และนโยบาย คลิกที่การ์ดเพื่อแก้ไข
        </p>

        <div>
          {/* Candidates */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-100" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : parties.length === 0 ? (
            /* ปีใหม่เริ่มจากศูนย์เสมอ — หน้าว่างเปล่าไม่บอกอะไรเลยคือจุดที่คนใหม่ติด */
            <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300">
                <Flag className="w-6 h-6" />
              </div>
              <p className="mt-4 text-base font-bold text-slate-600">ยังไม่มีพรรคผู้สมัคร</p>
              <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                เริ่มจากเพิ่มพรรคก่อน แล้วค่อยเพิ่มสมาชิกของแต่ละพรรคในหัวข้อด้านล่าง
                <br className="hidden sm:block" />
                ตัวเลือก &ldquo;งดออกเสียง&rdquo; และ &ldquo;ไม่รับรอง&rdquo; ระบบใส่ให้เองอัตโนมัติ ไม่ต้องเพิ่มเอง
              </p>
              <button
                onClick={() => handleEditClick(null)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#8A2680] text-white hover:bg-[#601A59] rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                เพิ่มพรรคแรก
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              {parties.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => handleEditClick(candidate)}
                />
              ))}
            </div>
          )}
        </div>

        {toast.node}

        <CompletedActionModal
          isOpen={isSuccessOpen}
          onClose={() => setIsSuccessOpen(false)}
          title={successMessage.title}
          message={successMessage.msg}
        />

        <EditCandidateModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          candidate={selectedCandidate}
          onUpdate={handleUpdateSuccess}
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

      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <div className="bg-purple-50 text-[#8A2680] p-2 rounded-lg shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-base lg:text-xl font-bold text-slate-700">สมาชิกพรรค</h3>
          {!loading && memberTotal > 0 && (
            <span className="text-xs font-bold text-[#8A2680] bg-purple-50 border border-purple-100 rounded-full px-2.5 py-1">
              {memberTotal} คน
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-5 ml-1">
          เปิดพรรคเพื่อดูรายชื่อ คลิกที่ชื่อสมาชิกเพื่อแก้ไข หรือกดปุ่มเพิ่มสมาชิกในพรรคนั้น
        </p>

        <div>
          {/* Members */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              {[0, 1].map((i) => (
                <div key={i} className="h-[88px] rounded-2xl border border-slate-100 bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : parties.length === 0 ? (
            <div className="text-center py-10 px-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-600">ยังไม่มีพรรคให้เพิ่มสมาชิก</p>
              <p className="mt-1 text-sm text-slate-400">เพิ่มพรรคในหัวข้อด้านบนก่อน แล้วรายชื่อพรรคจะมาโผล่ตรงนี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 items-start">
              {parties.map((candidate) => (
                <EditCandidateMember
                  key={candidate.id}
                  candidate={candidate}
                  defaultExpanded={parties.length === 1}
                  onReordered={fetchResults}
                  onClick={(memberId) => handleEditClickMember(candidate, memberId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

// The console's menu. The `id` values are the deep-link names (?tab=) and what
// ManualTab's onGoTab jumps to, so they must not change; only the labels may.
const NAV_GROUPS = [
  {
    title: 'วันเลือกตั้ง',
    items: [{ id: 'overview', label: 'ศูนย์ควบคุม', Icon: Gauge }],
  },
  {
    title: 'เตรียมการ',
    items: [
      { id: 'globalConfig', label: 'ตั้งค่าทั่วไป', Icon: Settings },
      { id: 'candidates', label: 'จัดการผู้สมัคร', Icon: Users },
      { id: 'pageDesign', label: 'เลือกธีม', Icon: Palette },
    ],
  },
  {
    title: 'ระบบ',
    items: [
      { id: 'settings', label: 'ความพร้อมและระบบ', Icon: ShieldCheck },
      { id: 'manual', label: 'คู่มือใช้งาน', Icon: BookOpen },
    ],
  },
];
// shown only when the server says the test tools are on (ADMIN_TEST_TOOLS=1)
const TEST_TOOLS_ITEM = { id: 'testTools', label: 'เครื่องมือทดสอบ', Icon: FlaskConical };
const TAB_IDS = [...NAV_GROUPS.flatMap((g) => g.items), TEST_TOOLS_ITEM].map((i) => i.id);

function AdminShell() {
  const router = useRouter();
  const { readiness } = useElectionState();
  const testToolsOn = readiness?.testToolsEnabled === true;
  const navGroups = testToolsOn
    ? NAV_GROUPS.map((g) => (g.title === 'ระบบ' ? { ...g, items: [...g.items, TEST_TOOLS_ITEM] } : g))
    : NAV_GROUPS;
  const navItems = navGroups.flatMap((g) => g.items);
  const [activeTab, setActiveTab] = useState('overview');
  // Collapsible sidebar: icon rail (collapsed) or full labels (expanded).
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      // Deep-link a starting tab (e.g. the preview's "Exit" returns to ?tab=pageDesign,
      // the template selector, never the control center). Ignore unknown values.
      const tab = sp.get('tab');
      if (tab && TAB_IDS.includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);
  useEffect(() => { setMobileNavOpen(false); }, [activeTab]);
  // a deep link or leftover state pointing at the test tools while they are off
  useEffect(() => {
    if (readiness && !testToolsOn && activeTab === 'testTools') setActiveTab('overview');
  }, [readiness, testToolsOn, activeTab]);

  // Edits not yet saved in a tab: ask before leaving it. Each tab reports with
  // setDirty(tabId, bool); only the general settings tab does so far.
  const guardLabels = { globalConfig: 'ตั้งค่าทั่วไป' };
  const { setDirty, guard, dialog: unsavedDialog } = useUnsavedGuard(guardLabels);
  const markGlobalConfigDirty = useCallback((v) => setDirty('globalConfig', v), [setDirty]);
  const goTab = useCallback((id) => {
    guard(() => setActiveTab(id));
  }, [guard]);

  // Who is holding this session: asked of the server, not read off the token.
  // A 401/403 means the cookie is gone or the admin flag was taken away since
  // login, and the console has no business staying open: back to the form.
  const [adminUser, setAdminUser] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(getPath('/api/admin/me'), { credentials: 'include', cache: 'no-store' });
        if (res.status === 401 || res.status === 403) {
          window.location.href = getPath('/admin/login');
          return;
        }
        const data = await res.json();
        if (!cancelled && data.user) setAdminUser(data.user);
      } catch (e) {
        console.error('admin identity check failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(getPath('/api/admin/logout'), { method: 'POST', credentials: 'include' });
      window.location.href = getPath('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isDevMachine = process.env.NODE_ENV !== 'production';
  const activeItem = navItems.find((i) => i.id === activeTab) || navItems[0];
  const adminLabel = adminUser ? (adminUser.name || adminUser.studentId) : 'กำลังตรวจสิทธิ์';
  const adminInitial = adminUser ? String(adminLabel).trim().charAt(0).toUpperCase() : '';

  return (
    <div className="min-h-screen bg-[#F7F7F9] font-sans text-slate-900 flex">

      {/* Mobile drawer backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: collapsible icon rail (desktop) or slide-in drawer (mobile) */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 bg-white border-r border-slate-200 flex flex-col
          transition-[width,transform] duration-300 ease-out
          ${sidebarCollapsed ? 'w-64 md:w-[76px]' : 'w-64'}
          ${mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0`}
        aria-label="เมนูหลัก"
      >
        {/* Brand and toggle */}
        <div className={`h-[60px] shrink-0 border-b border-slate-200 flex items-center gap-2.5 ${sidebarCollapsed ? 'md:justify-center px-3' : 'px-5'}`}>
          <Image
            src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")}
            alt="FMS PSU"
            width={1200}
            height={384}
            className={`w-auto h-7 object-contain ${sidebarCollapsed ? 'md:hidden' : ''}`}
            priority
          />
          <span className={`text-[11px] font-semibold whitespace-nowrap shrink-0 text-[#8A2680] bg-purple-50 border border-purple-100 rounded-md px-2 py-0.5 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
            แอดมิน
          </span>
          {/* desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'ขยายเมนู' : 'ยุบเมนู'}
            aria-label={sidebarCollapsed ? 'ขยายเมนู' : 'ยุบเมนู'}
            className="hidden md:flex ml-auto items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#8A2680] hover:bg-purple-50 transition-colors shrink-0"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" aria-hidden /> : <PanelLeftClose className="w-5 h-5" aria-hidden />}
          </button>
          {/* mobile close */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="ปิดเมนู"
            className="md:hidden ml-auto shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={group.title} className={gi === 0 ? '' : 'mt-5'}>
              <p className={`px-3.5 mb-1.5 text-[11px] font-semibold text-slate-400 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
                {group.title}
              </p>
              {sidebarCollapsed && gi > 0 && <div className="hidden md:block mx-3 mb-2 border-t border-slate-200" aria-hidden />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.Icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => { if (item.id !== activeTab) goTab(item.id); }}
                      title={sidebarCollapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors
                        ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}
                        ${active
                          ? 'bg-purple-50 text-[#8A2680]'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className={sidebarCollapsed ? 'md:hidden' : ''}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => guard(handleLogout)}
            title={sidebarCollapsed ? 'ออกจากระบบ' : undefined}
            aria-label="ออกจากระบบ"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            <span className={sidebarCollapsed ? 'md:hidden' : ''}>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-[margin] duration-300 ease-out ${sidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-64'}`}>

        {/* Top bar: where you are, the election's state (every tab), who you are */}
        <header className="bg-white border-b border-slate-200 h-[60px] px-3 sm:px-4 md:px-6 flex items-center gap-3 sticky top-0 z-20">
          {/* mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="เปิดเมนู"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
          >
            <Menu className="w-5 h-5" aria-hidden />
          </button>
          <h1 className="hidden lg:block text-sm font-semibold text-slate-900 whitespace-nowrap">{activeItem.label}</h1>
          <span className="hidden lg:block h-5 w-px bg-slate-200" aria-hidden />
          <TopBarStatus />

          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span
              className="hidden sm:inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-600 whitespace-nowrap"
              title={isDevMachine ? 'รันบนเครื่องพัฒนา ไม่ใช่ระบบจริง' : 'รันเป็นระบบจริง'}
            >
              {isDevMachine ? 'เครื่องพัฒนา' : 'ระบบจริง'}
            </span>
            <div className="flex items-center gap-2.5">
              <div className="hidden md:block text-right min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-tight truncate max-w-[16rem]">{adminLabel}</p>
                <p className="text-xs flex items-center justify-end gap-1.5 leading-tight mt-0.5">
                  {adminUser ? (
                    <>
                      <span className="font-medium text-[#8A2680]">ผู้ดูแลระบบ</span>
                      <span className="text-slate-400 tabular-nums">{adminUser.studentId}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">รอการยืนยันจากเซิร์ฟเวอร์</span>
                  )}
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-full bg-purple-50 border border-purple-100 text-[#8A2680] flex items-center justify-center text-sm font-semibold shrink-0"
                title={adminUser ? `${adminLabel} (ผู้ดูแลระบบ)` : adminLabel}
                aria-label={adminUser ? `ผู้ใช้ ${adminLabel}` : 'กำลังตรวจสิทธิ์'}
              >
                {adminInitial || '?'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {activeTab === 'overview' && <ElectionControl onGoTab={goTab} />}
          {activeTab === 'globalConfig' && <GlobalConfigTab onDirtyChange={markGlobalConfigDirty} />}
          {activeTab === 'candidates' && <CandidatesTab />}
          {activeTab === 'pageDesign' && <TemplateChooserTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'manual' && <ManualTab onGoTab={goTab} />}
          {activeTab === 'testTools' && testToolsOn && <TestToolsTab />}
        </main>
      </div>

      {unsavedDialog}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ElectionStateProvider>
      <AdminShell />
    </ElectionStateProvider>
  );
}
