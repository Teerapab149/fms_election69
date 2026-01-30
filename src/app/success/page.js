"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // ✅ เพิ่ม useSearchParams
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

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  /* REMOVED CONSTANT URL */
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

  // ตรวจสอบว่าเพิ่ง Redirect มาจากหน้าโหวตหรือไม่
  const isJustVoted = searchParams.get('voted') === 'true';

  // =========================================================
  // Auth Logic (Fix Race Condition)
  // =========================================================
  useEffect(() => {
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
          let res = await fetch(
            `/api/check-status?studentId=${session?.user?.studentId}`,
            { method: "GET" }
          );

          let data = await res.json();
          const voted = !!data?.isVoted;

          setIsVoted(voted);

          if (data.googleFormUrl) {
            setGoogleFormUrl(data.googleFormUrl);
          }

          if (!voted) {
            router.replace("/vote");
            return;
          }

          const hasVoted = voted;

          if (!hasVoted) {
            setAlertConfig({
              title: "คุณยังไม่ได้ลงคะแนนเสียง",
              message: "กรุณาทำการเลือกตั้งให้เสร็จสมบูรณ์ก่อน",
              action: () => router.replace("/vote"),
            });
            setShowAlertModal(true);
            return;
          }

          if (session.user?.isFormCompleted) {
            setIsUnlocked(true);
          }

          setUser({
            studentId: session.user?.studentId || session.user?.id || "-",
            name: session.user?.name || "นักศึกษา",
          });

          setIsAuthorized(true);

          res = await fetch(`/api/check-form?studentId=${session?.user?.studentId}`);
          data = await res.json();

          if (data.isFormCompleted) {
            setIsUnlocked(true);
          };



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
  }, [status, session, router, isJustVoted]); // ✅ เพิ่ม isJustVoted ใน dependency

  // =========================================================
  // Timer & Handlers (คงเดิม)
  // =========================================================
  // =========================================================
  // Timer & Handlers (Visible Countdown + Checkbox)
  // =========================================================
  const [timeLeft, setTimeLeft] = useState(15);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    let interval;
    if (showModal) {
      setCanConfirm(false);
      setIsChecked(false);
      setTimeLeft(15); // ตั้งเวลา 15 วินาที

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
  }, [showModal]);

  const handleConfirmSubmit = async () => {
    if (!canConfirm) return;
    try {
      const res = await fetch("/api/complete-form", { method: "GET" });
      if (!res.ok) throw new Error("Failed to update status");

      // อัปเดต Session ฝั่ง Client
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

  if (status === "loading" || (!isAuthorized && !showAlertModal)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <Loader2 className="w-12 h-12 text-[#8A2680] animate-spin mb-4 relative z-10" />
        <p className="text-slate-500 text-sm font-medium relative z-10">กำลังตรวจสอบข้อมูล...</p>
      </div>
    );
  }

  // =========================================================
  // Render (รักษาองค์ประกอบเดิมของคุณทั้งหมด)
  // =========================================================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans p-4 md:p-6 relative overflow-hidden bg-slate-50">

      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:40px_40px] md:bg-[size:60px_60px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[300px] w-[300px] md:h-[500px] md:w-[500px] rounded-full bg-purple-400 opacity-20 blur-[80px] md:blur-[120px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[300px] w-[300px] md:h-[500px] md:w-[500px] rounded-full bg-emerald-400 opacity-20 blur-[80px] md:blur-[120px]"></div>
      </div>

      {isAuthorized && (
        <div className="w-full max-w-lg animate-fade-in-up relative z-10">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 ring-1 ring-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#8A2680] via-purple-500 to-pink-500"></div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6 group cursor-default">
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-700"></div>
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-50 relative z-10 animate-bounce-gentle">
                  <Check className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 stroke-[3.5]" />
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-2">บันทึกคะแนนสำเร็จ!</h1>
              <p className="text-slate-500 text-sm md:text-base mb-6 px-2 font-medium">
                ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการขับเคลื่อน<br className="hidden sm:block" />กิจกรรมนักศึกษาคณะวิทยาการจัดการ
              </p>

              {/* Box: Announcement */}
              <div className="w-full bg-gradient-to-br from-purple-50/80 to-white border border-purple-100/80 rounded-2xl p-5 shadow-[0_2px_15px_rgba(138,38,128,0.05)] relative overflow-hidden text-left pb-6 mb-4">

                {/* Decorative Background Icon */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 text-purple-100/50 opacity-20 pointer-events-none">
                  <Megaphone size={100} />
                </div>

                {/* ส่วนเนื้อหาด้านบน (มีไอคอนซ้าย + ข้อความขวา) */}
                <div className="flex gap-4 items-start relative z-10">
                  {/* Icon Box */}
                  <div className="bg-white p-3 rounded-2xl text-[#8A2680] shadow-sm ring-1 ring-purple-50 shrink-0 mt-1">
                    <Megaphone size={24} strokeWidth={2.5} />
                  </div>

                  {/* Text Content */}
                  <div className="space-y-3 flex-1 min-w-0"> {/* min-w-0 ช่วยกันข้อความล้นในมือถือจอเล็ก */}

                    {/* Header */}
                    <div>
                      <h3 className="font-bold text-[#8A2680] text-base md:text-lg leading-tight">
                        รับทรานสคริปต์กิจกรรม
                      </h3>
                      <p className="text-slate-500 text-xs md:text-sm mt-1">
                        กรุณาทำแบบประเมินให้ครบถ้วนเพื่อรับสิทธิประโยชน์
                      </p>
                    </div>

                    {/* Tags / Badges Group */}
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100/80 text-[#8A2680] text-xs font-bold border border-purple-200 whitespace-nowrap">
                        <CheckCircle2 size={12} />
                        <span>ชั่วโมงกิจกรรม 2 ชม.</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 whitespace-nowrap">
                        <Tag size={12} />
                        <span>ประเภทเลือกเข้าร่วม</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ ส่วน Footer ย้ายออกมาด้านนอก Flex แล้ว (จะกินเต็มความกว้าง) */}
                <div className="relative z-10 mt-4 pt-3 border-t border-purple-100/60">
                  <p className="text-slate-600 text-xs md:text-sm flex items-center justify-center gap-2">
                    <span className="shrink-0">🔓</span>
                    <span className="truncate">
                      และ <span className="font-semibold text-[#8A2680] underline decoration-purple-200 decoration-2 underline-offset-2">ปลดล็อคหน้าสรุปผลคะแนนเสียง</span>
                    </span>
                  </p>
                </div>

              </div>

              {/* Buttons */}
              <div className="w-full space-y-3 pd">
                <button
                  onClick={() => setShowModal(true)}
                  disabled={isUnlocked}
                  className={`w-full py-3.5 md:py-4 px-6 rounded-xl font-bold text-sm md:text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group
                    ${isUnlocked ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-none cursor-default' : 'bg-slate-900 text-white hover:bg-black hover:shadow-xl hover:-translate-y-1'}`}
                >
                  {isUnlocked ? (
                    <><span>ส่งแบบประเมินเรียบร้อยแล้ว</span> <Check size={18} /></>
                  ) : (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                      </span>
                      <span>เปิดแบบประเมิน (คลิกที่นี่)</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="relative group/lock">
                  <button
                    onClick={() => { if (isUnlocked) router.push('/results'); }}
                    disabled={!isUnlocked}
                    className={`w-full py-3.5 md:py-4 px-6 rounded-xl font-bold text-sm md:text-base border transition-all duration-500 flex items-center justify-center gap-2
                      ${isUnlocked ? 'bg-[#8A2680] border-[#8A2680] text-white shadow-lg shadow-purple-200 hover:bg-[#701e68] hover:-translate-y-1' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    {isUnlocked ? (
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
            </div>
          </div>
        </div>
      )}

      {/* Modal & Alert (คงเดิมตามที่คุณส่งมา) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full sm:max-w-4xl h-[92vh] sm:h-[90vh] rounded-t-[2rem] sm:rounded-2xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">

            {/* Modal Header */}
            <div className="bg-white border-b border-gray-100 p-4 shrink-0 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <UserIcon size={18} className="text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">ข้อมูลของคุณ</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      {user && (
                        <>
                          <button onClick={copyStudentId} className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all ${isCopied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white border-slate-200'}`}>
                            {user.studentId} {isCopied ? <Check size={12} /> : <Copy size={10} />}
                          </button>
                          <span className="text-slate-300">|</span>
                          <span className="truncate max-w-[120px]">{user.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs">
                  <ShieldCheck size={16} /> <span>ไม่จำเป็นต้อง Login Google</span>
                </div>
                <button onClick={() => setShowModal(false)} className="hidden md:block text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 bg-slate-50 relative">
              {!isFormLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                  <Loader2 className="w-10 h-10 text-[#8A2680] animate-spin mb-3" />
                  <span className="text-slate-400 text-sm font-medium">กำลังโหลด...</span>
                </div>
              )}
              {googleFormUrl ? (
                <iframe src={`${googleFormUrl}?embedded=true`} className="w-full h-full border-0" onLoad={() => setIsFormLoaded(true)} title="Evaluation Form"></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <div className="bg-slate-100 p-4 rounded-full mb-3">
                    <AlertCircle size={32} />
                  </div>
                  <p className="font-bold text-slate-600">ไม่พบลิงก์แบบประเมิน</p>
                  <p className="text-sm">กรุณาแจ้งผู้ดูแลระบบให้ตรวจสอบการตั้งค่า</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">

                {/* Visual Timer & Checkbox */}
                <div className="w-full">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${timeLeft > 0 ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-[#8A2680] hover:bg-purple-50'}`}>
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        disabled={timeLeft > 0}
                        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-[#8A2680] checked:bg-[#8A2680] checked:border-[#8A2680] transition-all"
                      />
                      <Check size={14} className="absolute text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isChecked ? 'text-[#8A2680]' : 'text-slate-600'}`}>
                        ข้าพเจ้าได้ทำแบบประเมินเรียบร้อยแล้ว
                      </span>
                      <span className="text-xs text-slate-400">
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
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-[#8A2680] text-white hover:bg-[#701e68] hover:shadow-purple-200 hover:-translate-y-0.5'
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

      {/* Security Alert Modal */}
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