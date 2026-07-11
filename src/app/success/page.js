"use client";
import { getPath } from "../../utils/basePath";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import {
  Check,
  BarChart3,
  ArrowRight,
  X,
  User as UserIcon,
  Loader2, 
  Lock,
  Copy,
  XCircle,
  ShieldCheck,
  Megaphone,
  CheckCircle2,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ✅ นำเข้าระบบแก้ไขจาก Editor
import EditorElement from '../../components/admin/editor/EditorElement';
import PageThemeOverrides from '../../components/PageThemeOverrides';
import GumroadSuccess from '../../components/vote/GumroadSuccess';
import StudioDarkSuccess from '../../components/vote/StudioDarkSuccess';
import VerdureSuccess from '../../components/vote/VerdureSuccess';
import BlossomSuccess from '../../components/vote/BlossomSuccess';
import ThemedLoadingScreen from '../../components/ThemedLoadingScreen';
import { SIZE_MAP, RADIUS_MAP, WEIGHT_MAP } from '../../utils/styleMaps';
import { fetchVoteStatus } from '../../hooks/useVoteStatus';

export default function SuccessPage({ 
  editorMode = false,
  pageLayout = null,
  elementConfigs = null,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [canConfirm, setCanConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "", action: null });
  const [isVoted, setIsVoted] = useState(false);

  // Active template — drives the per-page LAYOUT dispatch (gumroad has its own).
  const [activeTemplateId, setActiveTemplateId] = useState('classic');
  const [templateReady, setTemplateReady] = useState(false);
  const isGumroad = activeTemplateId?.startsWith('gumroad');
  const isStudio = activeTemplateId?.startsWith('studio-dark');
  const isVerdure = activeTemplateId?.startsWith('verdure');
  const isBlossom = activeTemplateId?.startsWith('blossom');

  useEffect(() => {
    if (editorMode) { setTemplateReady(true); return; }
    fetch(getPath('/api/admin/page-layout'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.activeTemplateId) setActiveTemplateId(d.activeTemplateId); })
      .catch(() => {})
      .finally(() => setTemplateReady(true));
  }, [editorMode]);

  const isJustVoted = searchParams.get('voted') === 'true';

  // =========================================================
  // ✅ Editor Wrappers & Visibility Logic (แก้บั๊ก s.type)
  // =========================================================
  const Wrap = ({ id, children }) => editorMode ? (
    <EditorElement
      id={id}
      config={elementConfigs?.[id]}
      isSelected={selectedElement === id}
      isHovered={hoveredElement === id}
      onSelect={onSelectElement}
      onHover={onHoverElement}
      onHoverEnd={onHoverEnd}
    >{children}</EditorElement>
  ) : children;

  const cfg = (id, defaults = {}) => editorMode
    ? { ...defaults, ...(elementConfigs?.[id]?.config || {}) }
    : defaults;

  const isSectionVisible = (typeStr) => {
    if (!pageLayout?.success) return true;
    // เปลี่ยนจาก s.id เป็น s.type เพื่อให้ตรงกับฐานข้อมูลของ Admin
    const section = pageLayout.success.find(s => String(s.type).toLowerCase() === String(typeStr).toLowerCase());
    return section ? section.visible !== false : true;
  };

  const isSuccessMessageVisible = isSectionVisible('SUCCESSMESSAGE');
  // รองรับทั้งชื่อ googleForm และ googleFormLink เผื่อตั้งค่าไว้ต่างกัน
  const isGoogleFormLinkVisible = isSectionVisible('GOOGLEFORMLINK') && isSectionVisible('GOOGLEFORM');

  // =========================================================
  // Auth Logic 
  // =========================================================
  useEffect(() => {
    if (editorMode) return; // บายพาสระบบล็อคตอนเป็น Editor

    if (status === "loading") return;

    if (status === "unauthenticated") {
      setAlertConfig({
        title: "Access Denied",
        message: "กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้",
        action: () => router.push("/login")
      });
      setShowAlertModal(true);
      return;
    }

    if (status === "authenticated" && session) {
      (async () => {
        try {
          // Shared cached status — fresh here because the vote flow invalidates
          // the cache on success (and the vote→success redirect is a hard nav).
          const statusData = await fetchVoteStatus();
          const voted = !!statusData?.isVoted;
          setIsVoted(voted);

          if (statusData.googleFormUrl) setGoogleFormUrl(statusData.googleFormUrl);

          if (!voted) {
            router.replace("/vote");
            return;
          }

          if (!voted) {
            setAlertConfig({
              title: "คุณยังไม่ได้ลงคะแนนเสียง",
              message: "กรุณาทำการเลือกตั้งให้เสร็จสมบูรณ์ก่อน",
              action: () => router.replace("/vote"),
            });
            setShowAlertModal(true);
            return;
          }

          if (session.user?.isFormCompleted) setIsUnlocked(true);

          setUser({
            studentId: session.user?.studentId || session.user?.id || "-",
            name: session.user?.name || "นักศึกษา",
          });

          setIsAuthorized(true);

          const resForm = await fetch(getPath(`/api/check-form?studentId=${session?.user?.studentId}`));
          const formData = await resForm.json();

          if (formData.isFormCompleted) setIsUnlocked(true);

        } catch (err) {
          console.error(err);
          setAlertConfig({
            title: "เกิดข้อผิดพลาด",
            message: "ไม่สามารถตรวจสอบสถานะได้ กรุณาลองใหม่",
            action: () => router.replace("/vote"),
          });
          setShowAlertModal(true);
        }
      })();
    }
  }, [status, session, router, isJustVoted, editorMode]);

  // =========================================================
  // Timer & Handlers
  // =========================================================
  const [timeLeft, setTimeLeft] = useState(15);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (editorMode) return;

    let interval;
    if (showModal) {
      setCanConfirm(false);
      setIsChecked(false);
      setTimeLeft(15);

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanConfirm(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showModal, editorMode]);

  const handleConfirmSubmit = async () => {
    if (!canConfirm) return;
    try {
      const res = await fetch(getPath("/api/complete-form"), { method: "GET" });
      if (!res.ok) throw new Error("Failed to update status");

      await update({ isFormCompleted: true });
      setIsUnlocked(true);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    }
  };

  const copyStudentId = () => {
    if (user?.studentId) {
      navigator.clipboard.writeText(user.studentId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleAlertConfirm = () => {
    setShowAlertModal(false);
    if (alertConfig.action) alertConfig.action();
  }

  if (!editorMode && (!templateReady || status === "loading" || (!isAuthorized && !showAlertModal))) {
    return <ThemedLoadingScreen text="กำลังตรวจสอบข้อมูล..." />;
  }

  // =========================================================
  // Render 
  // =========================================================
  return (
    <div className={(isGumroad || isStudio || isVerdure || isBlossom) ? "relative" : "min-h-screen flex flex-col items-center justify-center font-sans p-4 md:p-6 relative overflow-hidden bg-[var(--color-bg)]"}>
      {!editorMode && <PageThemeOverrides page="success" />}

      {/* BLOSSOM layout (own Candy Editorial chrome); the form + alert modals below stay shared */}
      {isBlossom && (isAuthorized || editorMode) && (
        <BlossomSuccess
          user={user}
          isUnlocked={isUnlocked}
          onOpenForm={() => setShowModal(true)}
          editorMode={editorMode}
        />
      )}

      {/* VERDURE layout (own glass-terrarium chrome); the form + alert modals below stay shared */}
      {isVerdure && (isAuthorized || editorMode) && (
        <VerdureSuccess
          user={user}
          isUnlocked={isUnlocked}
          onOpenForm={() => setShowModal(true)}
          editorMode={editorMode}
        />
      )}

      {/* GUMROAD layout (own chrome); the form + alert modals below stay shared */}
      {isGumroad && (isAuthorized || editorMode) && (
        <GumroadSuccess
          user={user}
          isUnlocked={isUnlocked}
          onOpenForm={() => setShowModal(true)}
          editorMode={editorMode}
        />
      )}

      {/* STUDIO DARK layout (own rail chrome); the form + alert modals below stay shared */}
      {isStudio && (isAuthorized || editorMode) && (
        <StudioDarkSuccess
          user={user}
          isUnlocked={isUnlocked}
          onOpenForm={() => setShowModal(true)}
          editorMode={editorMode}
        />
      )}

      {/* Background Grid */}
      {!isGumroad && !isStudio && !isVerdure && !isBlossom && (
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[300px] w-[300px] md:h-[500px] md:w-[500px] rounded-full bg-[var(--color-primary)] opacity-20 blur-[80px] md:blur-[120px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[300px] w-[300px] md:h-[500px] md:w-[500px] rounded-full bg-emerald-400 opacity-20 blur-[80px] md:blur-[120px]"></div>
      </div>
      )}

      {!isGumroad && !isStudio && !isVerdure && !isBlossom && (isAuthorized || editorMode) && (
        <div className="w-full max-w-lg animate-fade-in-up relative z-10">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 ring-1 ring-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[color-mix(in_srgb,var(--color-primary)_60%,white)]"></div>

            <div className="flex flex-col items-center text-center">
              {isSuccessMessageVisible && (
                <>
                  <div className="relative mb-6 group cursor-default">
                    <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-700"></div>
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-50 relative z-10 animate-bounce-gentle">
                      <Check className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 stroke-[3.5]" />
                    </div>
                  </div>

                  {/* ✅ ห่อ Wrap หัวข้อ */}
                  <Wrap id="success-title">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2" style={{
                      color: cfg('success-title').color || '#1e293b',
                      fontSize: SIZE_MAP[cfg('success-title').fontSize] || undefined,
                    }}>
                      {cfg('success-title').text || 'บันทึกคะแนนสำเร็จ!'}
                    </h1>
                  </Wrap>

                  {/* ✅ ห่อ Wrap Subtitle */}
                  <Wrap id="success-subtitle1">
                    <p className="text-sm md:text-base mb-6 px-2 font-medium" style={{
                      color: cfg('success-subtitle1').color || '#64748b',
                      fontSize: SIZE_MAP[cfg('success-subtitle1').fontSize] || undefined,
                    }}>
                      {cfg('success-subtitle1').text || 'ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการขับเคลื่อนกิจกรรมนักศึกษาคณะวิทยาการจัดการ'}
                    </p>
                  </Wrap>
                </>
              )}

              {isGoogleFormLinkVisible && (
                <>
                  {/* Box: Announcement */}
                  <div className="w-full bg-gradient-to-br from-[color-mix(in_srgb,var(--color-primary)_8%,white)] to-white border border-[color-mix(in_srgb,var(--color-primary)_15%,white)] rounded-2xl p-5 shadow-[0_2px_15px_color-mix(in_srgb,var(--color-primary)_6%,transparent)] relative overflow-hidden text-left pb-6 mb-4">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 text-[color-mix(in_srgb,var(--color-primary)_16%,white)] opacity-20 pointer-events-none">
                      <Megaphone size={100} />
                    </div>
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="bg-white p-3 rounded-2xl text-[var(--color-primary)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--color-primary)_10%,white)] shrink-0 mt-1">
                        <Megaphone size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-3 flex-1 min-w-0">
                        <div>
                          <h3 className="font-bold text-[var(--color-primary)] text-base md:text-lg leading-tight">รับทรานสคริปต์กิจกรรม</h3>
                          <p className="text-slate-500 text-xs md:text-sm mt-1">กรุณาทำแบบประเมินให้ครบถ้วน</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)] text-xs font-bold border border-[color-mix(in_srgb,var(--color-primary)_25%,white)] whitespace-nowrap">
                            <CheckCircle2 size={12} /><span>ชั่วโมงกิจกรรม 2 ชม.</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 whitespace-nowrap">
                            <Tag size={12} /><span>ประเภทเลือกเข้าร่วม</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 mt-4 pt-3 border-t border-[color-mix(in_srgb,var(--color-primary)_15%,white)]">
                      <p className="text-slate-600 text-xs md:text-sm flex items-center justify-center gap-2">
                        <span className="shrink-0">🔓</span>
                        <span className="truncate">และ <span className="font-semibold text-[var(--color-primary)] underline decoration-[color-mix(in_srgb,var(--color-primary)_25%,white)] decoration-2 underline-offset-2">ปลดล็อคหน้าสรุปผลคะแนนเสียง</span></span>
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="w-full space-y-3 pd">
                    
                    {/* ✅ ห่อ Wrap ปุ่ม Google Form */}
                    <Wrap id="success-form-btn">
                      <button
                        onClick={() => !editorMode && setShowModal(true)}
                        disabled={isUnlocked && !editorMode}
                        className={`w-full py-3.5 md:py-4 px-6 rounded-xl font-bold text-sm md:text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group
                          ${isUnlocked && !editorMode ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-none cursor-default' : 'bg-slate-900 text-white hover:bg-black hover:shadow-xl hover:-translate-y-1'}`}
                        style={{
                          backgroundColor: (!isUnlocked || editorMode) ? (cfg('success-form-btn').backgroundColor || undefined) : undefined,
                          color: (!isUnlocked || editorMode) ? (cfg('success-form-btn').textColor || undefined) : undefined,
                          borderRadius: RADIUS_MAP[cfg('success-form-btn').borderRadius] || undefined,
                        }}
                      >
                        {(isUnlocked && !editorMode) ? (
                          <><span>ส่งแบบประเมินเรียบร้อยแล้ว</span> <Check size={18} /></>
                        ) : (
                          <>
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-primary)]"></span>
                            </span>
                            <span>{cfg('success-form-btn').text || 'เปิดแบบประเมิน (คลิกที่นี่)'}</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </Wrap>

                    <div className="relative group/lock">
                      <button
                        onClick={() => { if (isUnlocked && !editorMode) router.push('/results'); }}
                        disabled={!isUnlocked && !editorMode}
                        className={`w-full py-3.5 md:py-4 px-6 rounded-xl font-bold text-sm md:text-base border transition-all duration-500 flex items-center justify-center gap-2
                          ${(isUnlocked || editorMode) ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] hover:-translate-y-1' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        {(isUnlocked || editorMode) ? (
                          <>ไปดูผลคะแนน (Results) <BarChart3 size={18} /></>
                        ) : (
                          <><Lock size={16} /> <span>ล็อค: กรุณาทำแบบประเมินก่อน</span></>
                        )}
                      </button>
                    </div>

                    <Link href="/" className="block pt-2">
                      <button className="text-slate-400 text-xs md:text-sm font-bold hover:text-slate-600 transition-colors py-2 px-4 rounded-lg hover:bg-slate-50">กลับหน้าหลัก</button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal & Alert */}
      {showModal && !editorMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* P2 #4 (level A): shell colours ride the Layer-1 tokens so the modal follows
              the active template; the Google Form inside the iframe cannot be themed
              (accepted). Semantic colours (green copied-state, blue info chip) stay. */}
          <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-text)_60%,transparent)] backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)}></div>
          <div className="bg-[var(--color-surface)] w-full sm:max-w-4xl h-[92vh] sm:h-[90vh] rounded-t-[2rem] sm:rounded-2xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
            <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 shrink-0 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 bg-[var(--color-bg)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                  <UserIcon size={18} className="text-[var(--color-text-muted)]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">ข้อมูลของคุณ</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                      {user && (
                        <>
                          <button onClick={copyStudentId} className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all ${isCopied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                            {user.studentId} {isCopied ? <Check size={12} /> : <Copy size={10} />}
                          </button>
                          <span className="text-[var(--color-border)]">|</span>
                          <span className="truncate max-w-[120px]">{user.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs">
                  <ShieldCheck size={16} /> <span>ไม่จำเป็นต้อง Login Google</span>
                </div>
                <button onClick={() => setShowModal(false)} className="hidden md:block text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={24} /></button>
              </div>
            </div>

            <div className="flex-1 bg-[var(--color-bg)] relative">
              {!isFormLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg)]">
                  <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin mb-3" />
                  <span className="text-[var(--color-text-muted)] text-sm font-medium">กำลังโหลด...</span>
                </div>
              )}
              {googleFormUrl ? (
                <iframe src={`${googleFormUrl}?embedded=true`} className="w-full h-full border-0" onLoad={() => setIsFormLoaded(true)} title="Evaluation Form"></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] p-8 text-center">
                  <div className="bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))] p-4 rounded-full mb-3">
                    <AlertCircle size={32} />
                  </div>
                  <p className="font-bold text-[var(--color-text)]">ไม่พบลิงก์แบบประเมิน</p>
                  <p className="text-sm">กรุณาแจ้งผู้ดูแลระบบให้ตรวจสอบการตั้งค่า</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
                <div className="w-full">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${timeLeft > 0 ? 'opacity-50 pointer-events-none bg-[var(--color-bg)] border-[var(--color-border)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))]'}`}>
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        disabled={timeLeft > 0}
                        className="peer appearance-none w-5 h-5 border-2 border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-primary)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] transition-all"
                      />
                      <Check size={14} className="absolute text-[var(--color-surface)] scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isChecked ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                        ข้าพเจ้าได้ทำแบบประเมินเรียบร้อยแล้ว
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        * กรุณากรอกแบบประเมินให้ครบถ้วนก่อนบันทึก
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => handleConfirmSubmit()}
                  disabled={!canConfirm || !isChecked}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                    ${(!canConfirm || !isChecked)
                      ? 'bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))] text-[var(--color-text-muted)] cursor-not-allowed shadow-none'
                      : 'bg-[var(--color-primary)] text-[var(--color-surface)] hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] hover:shadow-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] hover:-translate-y-0.5'
                    }`}
                >
                  {timeLeft > 0 ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>กรุณาทำแบบประเมิน ({timeLeft} วินาที)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>บันทึกข้อมูล</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl shadow-2xl relative z-10 w-full max-w-sm p-8 text-center animate-in zoom-in-95">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-800 mb-2">{alertConfig.title}</h3>
            <p className="text-slate-500 text-sm mb-6">{alertConfig.message}</p>
            <button onClick={handleAlertConfirm} className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm">ตกลง (OK)</button>
          </div>
        </div>
      )}
    </div>
  );
}