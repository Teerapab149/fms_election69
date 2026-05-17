"use client";

import { Check, Megaphone, CheckCircle2, Tag, Lock, BarChart3, ArrowRight } from 'lucide-react';
import EditorElement from './editor/EditorElement';

export default function SuccessEditorPreview({
  simMode = "locked", // 'locked' | 'unlocked'
  elementConfigs = {},
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const isUnlocked = simMode === "unlocked";

  const Wrap = ({ id, children }) => (
    <EditorElement
      id={id}
      config={elementConfigs?.[id]}
      isSelected={selectedElement === id}
      isHovered={hoveredElement === id}
      onSelect={onSelectElement}
      onHover={onHoverElement}
      onHoverEnd={onHoverEnd}
    >
      {children}
    </EditorElement>
  );

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#8A2680 1px, transparent 1px), linear-gradient(90deg, #8A2680 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur rounded-[2rem] shadow-[0_20px_60px_rgba(138,38,128,0.08)] overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#8A2680] via-purple-500 to-pink-500" />

        <div className="px-6 md:px-8 py-8 md:py-10 text-center">
          {/* Check icon circle */}
          {elementConfigs?.['success-check-icon']?.config?.visible !== false && (
            <Wrap id="success-check-icon">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-emerald-200/40 rounded-full blur-2xl" />
                <div className="relative w-20 h-20 bg-white border-4 border-emerald-100 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.15)]">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-7 h-7 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </Wrap>
          )}

          {/* Title */}
          <Wrap id="success-title">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
              บันทึกคะแนนสำเร็จ!
            </h1>
          </Wrap>

          {/* Subtitle line 1 */}
          <Wrap id="success-subtitle1">
            <p className="text-sm text-slate-500 leading-relaxed px-2">
              ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการขับเคลื่อน
            </p>
          </Wrap>

          {/* Subtitle line 2 */}
          <Wrap id="success-subtitle2">
            <p className="text-sm text-slate-500 mb-6 leading-relaxed px-2">
              กิจกรรมนักศึกษาคณะวิทยาการจัดการ
            </p>
          </Wrap>

          {/* Activity card */}
          {elementConfigs?.['success-megaphone-card']?.config?.visible !== false && (
            <Wrap id="success-megaphone-card">
              <div className="w-full bg-gradient-to-br from-purple-50/80 to-white border border-purple-100/80 rounded-2xl p-5 shadow-[0_2px_15px_rgba(138,38,128,0.05)] relative overflow-hidden text-left pb-6 mb-4">
                {/* Decorative bg icon */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 text-purple-100/50 opacity-20 pointer-events-none">
                  <Megaphone size={100} />
                </div>

                <div className="flex gap-4 items-start relative z-10">
                  {/* Left icon box */}
                  <div className="bg-white p-3 rounded-2xl text-[#8A2680] shadow-sm ring-1 ring-purple-50 shrink-0 mt-1">
                    <Megaphone size={24} strokeWidth={2.5} />
                  </div>

                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Title + subtitle */}
                    <div>
                      <Wrap id="success-megaphone-title">
                        <h3 className="font-bold text-[#8A2680] text-base md:text-lg leading-tight">
                          {elementConfigs?.['success-megaphone-title']?.config?.text ?? 'รับทรานสคริปต์กิจกรรม'}
                        </h3>
                      </Wrap>
                      <Wrap id="success-megaphone-desc">
                        <p className="text-slate-500 text-xs md:text-sm mt-1">
                          {elementConfigs?.['success-megaphone-desc']?.config?.text ?? 'กรุณาทำแบบประเมินให้ครบถ้วน'}
                        </p>
                      </Wrap>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Wrap id="success-chip-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100/80 text-[#8A2680] text-xs font-bold border border-purple-200 whitespace-nowrap">
                          <CheckCircle2 size={12} />
                          <span>{elementConfigs?.['success-chip-1']?.config?.text ?? 'ชั่วโมงกิจกรรม 2 ชม.'}</span>
                        </div>
                      </Wrap>
                      <Wrap id="success-chip-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 whitespace-nowrap">
                          <Tag size={12} />
                          <span>{elementConfigs?.['success-chip-2']?.config?.text ?? 'ประเภทเลือกเข้าร่วม'}</span>
                        </div>
                      </Wrap>
                    </div>
                  </div>
                </div>

                {/* Lock unlock footer */}
                <Wrap id="success-lock-indicator">
                  <div className="relative z-10 mt-4 pt-3 border-t border-purple-100/60">
                    <p className="text-slate-600 text-xs md:text-sm flex items-center justify-center gap-2">
                      <span className="shrink-0">🔓</span>
                      <span className="truncate">
                        และ <span className="font-semibold text-[#8A2680] underline decoration-purple-200 decoration-2 underline-offset-2">ปลดล็อคหน้าสรุปผลคะแนนเสียง</span>
                      </span>
                    </p>
                  </div>
                </Wrap>
              </div>
            </Wrap>
          )}

          {/* Button 1 — primary (form open) */}
          <Wrap id="success-form-btn">
            {!isUnlocked ? (
              <button
                type="button"
                className="w-full px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 mb-2"
                onClick={(e) => e.preventDefault()}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>เปิดแบบประเมิน (คลิกที่นี่)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full px-6 py-3.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm border border-emerald-200 flex items-center justify-center gap-2 mb-2 cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ส่งแบบประเมินเรียบร้อยแล้ว ✓</span>
              </button>
            )}
          </Wrap>

          {/* Button 2 — secondary (results) */}
          {!isUnlocked ? (
            <button
              type="button"
              disabled
              className="w-full px-6 py-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>ล็อค: กรุณาทำแบบประเมินก่อน</span>
            </button>
          ) : (
            <button
              type="button"
              className="w-full px-6 py-3 rounded-xl bg-[#8A2680] text-white font-bold text-sm shadow-lg shadow-[#8A2680]/30 hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
              onClick={(e) => e.preventDefault()}
            >
              <BarChart3 className="w-4 h-4" />
              <span>ไปดูผลคะแนน (Results)</span>
            </button>
          )}

          {/* Back link */}
          <div className="mt-6">
            <Wrap id="success-footer">
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                กลับหน้าหลัก
              </button>
            </Wrap>
          </div>
        </div>
      </div>
    </div>
  );
}