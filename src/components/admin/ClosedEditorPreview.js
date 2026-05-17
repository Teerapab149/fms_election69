"use client";

import { Lock } from 'lucide-react';
import Navbar from '../Navbar';
import SiteFooter from '../SiteFooter';
import EditorElement from './editor/EditorElement';

const STATE_MESSAGES = {
  waiting: {
    title: "ยังไม่เปิดรับลงคะแนน",
    description: "การลงคะแนนเสียงจะเริ่มในเร็วๆ นี้",
    detail: "วันที่ 6 กุมภาพันธ์ 2569 เวลา 08.30 น. - 17.00 น.",
  },
  ended: {
    title: "สิ้นสุดระยะเวลาลงคะแนน",
    description: "ขอขอบคุณที่ใช้สิทธิ์ลงคะแนนเสียง",
    detail: "ติดตามผลการเลือกตั้งได้ที่หน้า ผลคะแนน",
  },
  paused: {
    title: "ระบบปิดรับลงคะแนน",
    description: "ระบบกำลังปรับปรุง กรุณารอสักครู่",
    detail: "ขออภัยในความไม่สะดวก",
  },
};

export default function ClosedEditorPreview({
  simMode = "waiting",
  elementConfigs = {},
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const message = STATE_MESSAGES[simMode] || STATE_MESSAGES.waiting;

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 lg:p-12 max-w-md w-full text-center">
          {elementConfigs?.['closed-lock-icon']?.config?.visible !== false && (
            <Wrap id="closed-lock-icon">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-slate-500" />
              </div>
            </Wrap>
          )}

          <Wrap id="closed-title">
            <h1 className="text-xl lg:text-2xl font-black text-slate-800 mb-2">
              {message.title}
            </h1>
          </Wrap>

          <Wrap id="closed-description">
            <p className="text-sm text-slate-600 mb-3">
              {message.description}
            </p>
          </Wrap>

          <Wrap id="closed-detail">
            <p className="text-xs text-slate-500">
              {message.detail}
            </p>
          </Wrap>

          <div className="mt-6">
            <Wrap id="closed-back-btn">
              <button className="px-6 py-2 rounded-md bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
                กลับสู่หน้าหลัก
              </button>
            </Wrap>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
