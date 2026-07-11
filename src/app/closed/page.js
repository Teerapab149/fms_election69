"use client";
import { getPath } from "../../utils/basePath";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Lock, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Navbar from "../../components/Navbar";
import SiteFooter from "../../components/SiteFooter";
import PageThemeOverrides from "../../components/PageThemeOverrides";
import GumroadClosed from "../../components/vote/GumroadClosed";
import StudioDarkClosed from "../../components/vote/StudioDarkClosed";
import VerdureClosed from "../../components/vote/VerdureClosed";
import BlossomClosed from "../../components/vote/BlossomClosed";
import { fetchVoteStatus } from "../../hooks/useVoteStatus";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";

export default function ClosedPage() {
    const { data: session } = useSession();
    const globalConfig = useGlobalConfig();
    const [statusData, setStatusData] = useState(null);

    // Active template — drives the per-page LAYOUT dispatch (gumroad has its own).
    const [activeTemplateId, setActiveTemplateId] = useState('classic');
    // Gate render until the template is known — without this the classic light
    // page flashes for a frame before a dark template resolves (same gate the
    // other 5 pages use).
    const [templateReady, setTemplateReady] = useState(false);
    const isGumroad = activeTemplateId?.startsWith('gumroad');
    const isStudio = activeTemplateId?.startsWith('studio-dark');
    const isVerdure = activeTemplateId?.startsWith('verdure');
    const isBlossom = activeTemplateId?.startsWith('blossom');

    useEffect(() => {
        fetchVoteStatus().then(setStatusData).catch(() => {});
        fetch(getPath('/api/admin/page-layout'))
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.activeTemplateId) setActiveTemplateId(d.activeTemplateId); })
            .catch(() => {})
            .finally(() => setTemplateReady(true));
    }, []);

    const getMessage = () => {
        if (!statusData) return { title: "ระบบปิดรับลงคะแนน", desc: "กำลังตรวจสอบสถานะ...", variant: "closed" };
        const { electionStatus, systemMode } = statusData;

        if (electionStatus === "WAITING") {
            const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
            return {
                variant: "waiting",
                title: "ยังไม่เปิดรับลงคะแนน",
                desc: (
                    <>
                        ขณะนี้ยังไม่ถึงเวลาเริ่มการเลือกตั้ง การเลือกตั้งจะเริ่มใน <br />
                        {formatThaiDate(ELECTION_START)} เวลา {formatThaiTime(ELECTION_START)} - {formatThaiTime(ELECTION_END)}
                    </>
                )
            };
        }
        if (electionStatus === "ENDED" || systemMode === "ENDED") {
            return {
                variant: "ended",
                title: "สิ้นสุดระยะเวลาลงคะแนน",
                desc: (
                    <>
                        การเลือกตั้งได้สิ้นสุดลงแล้ว<br />
                        ขอบคุณทุกท่านที่เข้ามาใช้สิทธิ
                    </>
                )
            };
        }
        return {
            variant: "closed",
            title: "ระบบปิดรับลงคะแนน",
            desc: "ระบบเลือกตั้งถูกปิดชั่วคราว หรือหมดเวลาการลงคะแนนแล้ว กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย"
        };
    };

    const handleLogout = async () => {
        // 1. เตรียม URL สำหรับ Redirect กลับมา
        // Hardcode fallback prevention: ถ้าไม่มี env ให้ใช้ '/fms-ovs' ไปเลยเพื่อความชัวร์ใน Local
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/fms-ovs';
        const origin = window.location.origin;
        // ป้องกัน double slash ถ้า basePath มี / นำหน้า และ origin มี / ลงท้าย (ซึ่งปกติ origin ไม่มี)
        const baseUrl = `${origin}${basePath}`;

        // 2. URL สำหรับ Logout ที่ PSU SSO
        let psuLogoutUrl = `https://psusso.psu.ac.th/application/o/fms-ovs/end-session/?post_logout_redirect_uri=${encodeURIComponent(baseUrl)}`;

        // ✅ Append id_token_hint if available (Crucial for skipping logout confirmation and ensuring true logout)
        if (session?.id_token) {
            psuLogoutUrl += `&id_token_hint=${session.id_token}`;
        }

        // 3. ใช้ signOut แบบ redirect ของ NextAuth
        try {
            // ✅ Clear Local Session first (no redirect)
            await signOut({ redirect: false });
            // ✅ Then Force Redirect to PSU SSO Logout
            window.location.href = psuLogoutUrl;
        } catch (error) {
            console.error("Logout failed:", error);
            // Fallback: ถ้า signOut พัง ให้ Force Redirect ไปที่ SSO เลย
            window.location.href = psuLogoutUrl;
        }
    };

    const { title, desc, variant } = getMessage();

    if (!templateReady) return null;

    if (isGumroad) {
        return (
            <>
                <PageThemeOverrides page="closed" />
                <GumroadClosed
                    title={title}
                    desc={desc}
                    variant={variant}
                    session={session}
                    onLogout={handleLogout}
                />
            </>
        );
    }

    // STUDIO DARK layout (own rail/scene chrome) — replaces the classic page entirely.
    if (isStudio) {
        return (
            <>
                <PageThemeOverrides page="closed" />
                <StudioDarkClosed
                    title={title}
                    desc={desc}
                    variant={variant}
                    session={session}
                    onLogout={handleLogout}
                />
            </>
        );
    }

    // BLOSSOM layout (own Candy Editorial chrome) — replaces the classic page entirely.
    if (isBlossom) {
        return (
            <>
                <PageThemeOverrides page="closed" />
                <BlossomClosed
                    title={title}
                    desc={desc}
                    variant={variant}
                    session={session}
                    onLogout={handleLogout}
                />
            </>
        );
    }

    // VERDURE layout (own glass-terrarium chrome) — replaces the classic page entirely.
    if (isVerdure) {
        return (
            <>
                <PageThemeOverrides page="closed" />
                <VerdureClosed
                    title={title}
                    desc={desc}
                    variant={variant}
                    session={session}
                    onLogout={handleLogout}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans relative overflow-hidden">
            <PageThemeOverrides page="closed" />
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px)', backgroundSize: '44px 44px' }}></div>
            <div className="relative z-10"><Navbar /></div>

            <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-4">
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
                                onClick={handleLogout}
                                className="w-full py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} /> ออกจากระบบ
                            </button>
                        ) : (
                            <a
                                href={getPath("/")}
                                className="block w-full py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
                            >
                                กลับสู่หน้าหลัก
                            </a>
                        )}
                    </div>
                </div>

                <SiteFooter className="mt-6" />

            </main>
        </div >
    );
}
