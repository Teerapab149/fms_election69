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
import { useState, useEffect, useRef } from 'react';

// ✅ นำเข้าระบบแก้ไขจาก Editor
import EditorElement from '../../components/admin/editor/EditorElement';
import PageThemeOverrides from '../../components/PageThemeOverrides';
import Navbar from '../../components/Navbar';
import GumroadSuccess from '../../components/vote/GumroadSuccess';
import StudioDarkSuccess from '../../components/vote/StudioDarkSuccess';
import VerdureSuccess from '../../components/vote/VerdureSuccess';
import FmsOfficialSuccess from '../../components/vote/FmsOfficialSuccess';
import BlossomSuccess from '../../components/vote/BlossomSuccess';
import OriginalSuccess from '../../components/vote/OriginalSuccess';
import ReceiptSuccess from '../../components/vote/ReceiptSuccess';
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
  // which voter the arrival gate has already run for (see the effect below)
  const gateRanFor = useRef(null);

  // Active template — drives the per-page LAYOUT dispatch (gumroad has its own).
  const [activeTemplateId, setActiveTemplateId] = useState('classic');
  const [templateReady, setTemplateReady] = useState(false);
  const isGumroad = activeTemplateId?.startsWith('gumroad');
  const isStudio = activeTemplateId?.startsWith('studio-dark');
  const isVerdure = activeTemplateId?.startsWith('verdure');
  const isBlossom = activeTemplateId?.startsWith('blossom');
  const isReceipt = activeTemplateId?.startsWith('receipt');
  const isFmsOfficial = activeTemplateId?.startsWith('fms-official');

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
      // Run the gate once per signed-in voter, not once per effect run. The effect
      // depends on the whole `session` object, so anything that hands back a new
      // identity re-runs the body — /api/check-form fired three times on a single
      // mount of this page. It went unnoticed because the other call in here,
      // fetchVoteStatus, dedupes through a module-level cache and so showed up
      // once; check-form is a bare fetch and showed up three times. A ref, not a
      // state flag: it must survive the double-invoke React does in development
      // without adding a render.
      const sid = session.user?.studentId || session.user?.id;
      if (gateRanFor.current === sid) return;
      gateRanFor.current = sid;
      (async () => {
        try {
          // force:true — this is a GATE, and every other gate in the flow already
          // forces (useVoteSystem's ballot gate does). The old un-forced read
          // relied on two assumptions that do not both hold: that the vote always
          // invalidates the cache, and that vote→success is always a hard nav.
          // Receipt reaches this page with a SOFT router.push, so the 15s cache
          // survives the transition — any warm "isVoted:false" entry sent the
          // just-voted user back to /vote, whose own forced gate saw the true
          // "voted" and threw them at /success again. That ping-pong is what the
          // flow looked like from the outside.
          const statusData = await fetchVoteStatus({ force: true });
          const voted = !!statusData?.isVoted;
          setIsVoted(voted);

          if (statusData.googleFormUrl) setGoogleFormUrl(statusData.googleFormUrl);

          // one branch, not two: this block used to be duplicated, so the silent
          // redirect always won and the explanatory modal below it was dead code.
          // Landing on /success without a ballot is a real state (someone opens
          // the URL directly) and deserves the sentence, not a silent bounce.
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

          // v2-R4a: check-status returns a session-gated `voter` block (the user's
          // OWN name / studentId / major / year / votedAt — never anyone else's,
          // never any choice). The receipt success prints this identity; missing
          // fields stay null and the receipt omits those lines cleanly.
          setUser({
            studentId: statusData?.voter?.studentId || session.user?.studentId || session.user?.id || "-",
            name: statusData?.voter?.name || session.user?.name || "นักศึกษา",
            major: statusData?.voter?.major || null,
            year: statusData?.voter?.year || null,
            votedAt: statusData?.voter?.votedAt || null,
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

  // Escape closes the form sheet — the other half of the exit the phone never had.
  // Paired with the X above and the backdrop click that was always there.
  useEffect(() => {
    if (!showModal || editorMode) return;
    const onKey = (e) => { if (e.key === "Escape") setShowModal(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, editorMode]);

  const handleConfirmSubmit = async () => {
    if (!canConfirm) return;
    try {
      const res = await fetch(getPath("/api/complete-form"), { method: "POST" });
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
    <div className={(isGumroad || isStudio || isVerdure || isBlossom || isReceipt || isFmsOfficial) ? "relative" : "min-h-screen flex flex-col font-sans relative overflow-hidden bg-[var(--color-bg)]"}>
      {!editorMode && <PageThemeOverrides page="success" />}

      {/* classic/original chrome. This family mounts <Navbar /> on candidates, closed,
          login, party, results and vote — success was the only page without it, so the
          end of the flow was also the one screen with no way back to anywhere. The
          centring moved onto the inner wrapper below so the bar stays at the top
          instead of being centred together with the card. */}
      {!isGumroad && !isStudio && !isVerdure && !isBlossom && !isReceipt && !isFmsOfficial && !editorMode && <Navbar />}

      {/* RECEIPT layout (own printer-moment chrome); the form + alert modals below stay shared */}
      {isReceipt && (isAuthorized || editorMode) && (
        <ReceiptSuccess
          user={user}
          isUnlocked={isUnlocked}
          onOpenForm={() => setShowModal(true)}
          editorMode={editorMode}
        />
      )}

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

      {/* FMS OFFICIAL layout (faculty chrome); the form + alert modals below stay shared */}
      {isFmsOfficial && (isAuthorized || editorMode) && (
        <FmsOfficialSuccess
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

      {!isGumroad && !isStudio && !isVerdure && !isBlossom && !isReceipt && !isFmsOfficial && (isAuthorized || editorMode) && (
        <OriginalSuccess
          user={user}
          isUnlocked={isUnlocked}
          onOpenForm={() => setShowModal(true)}
          editorMode={editorMode}
          templateId={activeTemplateId}
          showMessage={isSuccessMessageVisible}
          showActions={isGoogleFormLinkVisible}
        />
      )}

      {/* Modal & Alert */}
      {showModal && !editorMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* P2 #4 (level A): shell colours ride the Layer-1 tokens so the modal follows
              the active template; the Google Form inside the iframe cannot be themed
              (accepted). Semantic colours (green copied-state, blue info chip) stay. */}
          <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-text)_60%,transparent)] backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)}></div>
          <div className="bg-[var(--color-surface)] w-full sm:max-w-4xl h-[92vh] sm:h-[90vh] rounded-t-[2rem] sm:rounded-2xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
            <div className="relative bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 shrink-0 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pr-12 md:pr-0">
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
                {/* The exit was `hidden md:block`, so on a phone this sheet had no way
                    out at all: no X, no Escape handler, and the sheet stands 810 of the
                    880px viewport — leaving a 70px strip of backdrop that nothing marks
                    as tappable. The ballot is already cast, so closing costs the voter
                    only their own activity hours; what the missing exit really trapped
                    was the failure path — an unset form URL or a Google Form that will
                    not load leaves a blank panel and killing the tab as the only move,
                    which is exactly when a voter starts doubting their vote went through.
                    Absolutely positioned so the phone's stacked header keeps it in the
                    corner instead of dropping it to the bottom of the stack. */}
                <button onClick={() => setShowModal(false)} aria-label="ปิดแบบประเมิน"
                  className="absolute top-3 right-3 md:static grid place-items-center w-11 h-11 md:w-auto md:h-auto rounded-full md:rounded-none bg-[var(--color-surface)] md:bg-transparent shadow-sm md:shadow-none border border-[var(--color-border)] md:border-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={24} /></button>
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

      {/* Short laptops (classic/original card only). The card fit 1280x800 exactly before
          this page had chrome; the navbar's 75px plus the taller home button put its last
          34px under the fold — measured, not guessed. Trimming the card's own air buys
          64px back, so the whole card lands above the fold again. Nothing changes above
          860px of viewport height. Element selectors (0,1,1) so they outrank the Tailwind
          padding utilities without !important. */}
      <style jsx global>{`
        @media (max-height: 860px) {
          div.success-card { padding: 22px; }
          div.success-cardwrap { padding: 10px; }
        }
        /* 1024x760 is the shortest laptop in the QA set; at one step it still left the
           home button's last pixel under the fold. */
        @media (max-height: 800px) {
          div.success-card { padding: 18px; }
          div.success-cardwrap { padding: 8px; }
        }
      `}</style>
    </div>
  );
}
