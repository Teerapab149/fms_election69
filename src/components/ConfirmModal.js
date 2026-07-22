'use client';

import { useEffect, useId, useState } from "react";
import { AlertTriangle, X, CheckCircle2, Loader2 } from "lucide-react";

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false,
    variant = 'primary', // 'primary' | 'danger'
    // ADM-TYPECONFIRM · optional type-to-confirm gate.
    // ถ้าไม่ส่ง prop นี้มา modal ทำงานเหมือนเดิมทุกประการ (ผู้เรียกอื่นไม่กระทบ)
    requireTyped = null
}) {
    const [typed, setTyped] = useState('');
    const inputId = useId();

    // ล้างค่าที่พิมพ์ไว้ทุกครั้งที่ modal ปิด — กันไม่ให้ค่าที่ match ค้างข้ามการเปิดครั้งถัดไป
    useEffect(() => {
        if (!isOpen) setTyped('');
    }, [isOpen]);

    if (!isOpen) return null;

    const typeGated = typeof requireTyped === 'string' && requireTyped.length > 0;
    const typedOk = !typeGated || typed.trim() === requireTyped;

    // กำหนดสีตามประเภทการใช้งาน
    const isDanger = variant === 'danger';
    const iconColor = isDanger ? 'text-red-600 bg-red-100' : 'text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_12%,white)]';
    const buttonColor = isDanger
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-[var(--color-primary)] hover:bg-[#701e68] text-white';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl transform scale-100 transition-all animate-scale-up border border-gray-100 overflow-hidden">

                {/* Header & Icon */}
                <div className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconColor}`}>
                        {isDanger ? (
                            <AlertTriangle className="w-8 h-8" />
                        ) : (
                            <CheckCircle2 className="w-8 h-8" />
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p className="text-gray-500 text-sm leading-relaxed">
                        {message}
                    </p>
                    {isDanger ? (
                        <p className="text-sm text-red-600 mt-1">
                            ข้อมูลจะไม่สามารถกู้คืนได้!
                        </p>
                    ) : (
                        ""
                    )}

                    {/* ADM-TYPECONFIRM · ด่านพิมพ์ยืนยัน (แสดงเฉพาะเมื่อผู้เรียกส่ง requireTyped มา) */}
                    {typeGated && (
                        <div className="mt-5 text-left">
                            <label
                                htmlFor={inputId}
                                className="block text-[13px] text-gray-700 leading-relaxed"
                            >
                                ถ้าแน่ใจแล้ว พิมพ์คำว่า{' '}
                                <span className="font-bold text-red-600 whitespace-nowrap">
                                    {requireTyped}
                                </span>{' '}
                                ลงในช่องด้านล่างเพื่อปลดล็อกปุ่มยืนยัน
                            </label>
                            <input
                                id={inputId}
                                type="text"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                disabled={isLoading}
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck={false}
                                aria-label={`พิมพ์คำว่า ${requireTyped} เพื่อยืนยัน`}
                                placeholder={requireTyped}
                                className="mt-2 w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-base placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                            />
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>

                    <button
                        onClick={() => { if (typedOk) onConfirm(); }}
                        disabled={isLoading || !typedOk}
                        className={`w-full py-2.5 px-4 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 ${typedOk ? buttonColor : 'bg-gray-300 text-gray-500 shadow-none'} disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLoading ? 'กำลังประมวลผล...' : 'ยืนยัน'}
                    </button>
                </div>

                {/* Close Icon (Top Right) */}
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>

            </div>
        </div>
    );
}