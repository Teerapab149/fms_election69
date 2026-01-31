"use client";
import { getPath } from "../../utils/basePath";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Lock, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Navbar from "../../components/Navbar";

export default function ClosedPage() {
    const { data: session } = useSession();
    const [statusData, setStatusData] = useState(null);

    useEffect(() => {
        fetch(getPath('/api/check-status')).then(res => res.json()).then(setStatusData);
    }, []);

    const getMessage = () => {
        if (!statusData) return { title: "ระบบปิดรับลงคะแนน", desc: "กำลังตรวจสอบสถานะ..." };
        const { electionStatus, systemMode } = statusData;

        if (electionStatus === "WAITING") {
            return {
                title: "ยังไม่เปิดรับลงคะแนน",
                desc: "ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง กรุณารอประกาศจากเจ้าหน้าที่"
            };
        }
        if (electionStatus === "ENDED" || systemMode === "ENDED") {
            return {
                title: "สิ้นสุดระยะเวลาลงคะแนน",
                desc: "การเลือกตั้งได้สิ้นสุดลงแล้ว ขอบคุณทุกท่านที่ใช้สิทธิ"
            };
        }
        return {
            title: "ระบบปิดรับลงคะแนน",
            desc: "ระบบเลือกตั้งถูกปิดชั่วคราว หรือหมดเวลาการลงคะแนนแล้ว กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย"
        };
    };

    const { title, desc } = getMessage();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">

                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-slate-400" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-black text-slate-800 mb-2">{title}</h1>
                        <p className="text-slate-500">
                            {desc}
                        </p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 w-full">
                        {session ? (
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} /> ออกจากระบบ
                            </button>
                        ) : (
                            <a
                                href="/"
                                className="block w-full py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
                            >
                                กลับสู่หน้าหลัก
                            </a>
                        )}
                    </div>
                </div>

                <p className="mt-6 text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">
                    © FMS@PSU 2026. All Rights Reserved.
                </p>

            </main>
        </div >
    );
}
