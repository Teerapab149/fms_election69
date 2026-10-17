'use client';

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * ถามก่อนปิดโมดัลที่มีการแก้ไขค้างอยู่ (ใช้กับโมดัลแก้พรรคและโมดัลสมาชิก)
 * ConfirmModal เปลี่ยนป้ายปุ่มไม่ได้ จึงมีกล่องนี้แยก: "แก้ต่อ" เป็นปุ่มหลัก "ทิ้งการแก้ไข" เป็นปุ่มรอง
 *
 * Esc ในกล่องนี้ = แก้ต่อ (ปิดแค่กล่องนี้) โมดัลแม่ต้องไม่ฟัง Esc ตอนที่กล่องนี้เปิดอยู่
 */
export default function DiscardChangesDialog({ isOpen, onKeepEditing, onDiscard }) {
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') onKeepEditing(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onKeepEditing]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" data-testid="discard-dialog">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <TriangleAlert className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 id="discard-title" className="text-base font-bold text-slate-900">ทิ้งการแก้ไขที่ยังไม่บันทึก?</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">สิ่งที่กรอกหรือเลือกไว้จะหายไป และเรียกคืนไม่ได้</p>
                    </div>
                </div>
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onDiscard}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        ทิ้งการแก้ไข
                    </button>
                    <button
                        type="button"
                        autoFocus
                        onClick={onKeepEditing}
                        className="rounded-xl bg-[#8A2680] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#701e68] transition-colors"
                    >
                        แก้ต่อ
                    </button>
                </div>
            </div>
        </div>
    );
}
