"use client";
import { getPath } from "../../utils/basePath";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, User, LogOut, X } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

/**
 * CinematicNavbar component - Floating Capsule Style
 * 
 * DESIGN UPDATE (Step 573):
 * Responsive Split Design.
 * 1. Mobile (< lg): Unified Center Dropdown (relative to Capsule).
 * 2. Desktop (>= lg): Right Anchored Dropdown (relative to Button).
 */

const CinematicNavbar = React.memo(function CinematicNavbar({ onScrollTo, partyName, partyLogoUrl, user, scrollContainerRef, theme = "dark" }) {
    const { data: session } = useSession(); // ✅ Use session to get id_token for logout
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // ✅ Shared Logout Logic
    const handleLogout = async () => {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/fms-ovs';
        const origin = window.location.origin;
        const baseUrl = `${origin}${basePath}`;

        // PSU SSO Logout URL
        let psuLogoutUrl = `https://psusso.psu.ac.th/application/o/fms-ovs/end-session/?post_logout_redirect_uri=${encodeURIComponent(baseUrl)}`;

        // ✅ Append id_token_hint if available (Crucial for skipping logout confirmation and ensuring true logout)
        if (session?.id_token) {
            psuLogoutUrl += `&id_token_hint=${session.id_token}`;
        }

        try {
            // ✅ Clear Local Session first (no redirect)
            await signOut({ redirect: false });
            // ✅ Then Force Redirect to PSU SSO Logout
            window.location.href = psuLogoutUrl;
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = psuLogoutUrl;
        }
    };

    // Optimized Scroll Listener (Internal)
    useEffect(() => {
        const container = scrollContainerRef?.current;
        if (!container) return;

        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrolled(container.scrollTop > 50);
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Close menu on scroll if open
        const handleScrollInteraction = () => {
            if (menuOpen) setMenuOpen(false);
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        container.addEventListener("scroll", handleScrollInteraction, { passive: true });

        // Initial check
        handleScroll();

        return () => {
            container.removeEventListener("scroll", handleScroll);
            container.removeEventListener("scroll", handleScrollInteraction);
        };
    }, [scrollContainerRef, menuOpen]);

    const navItems = [
        { label: "Overview", id: "hero" },
        { label: "Identity", id: "symbol" },
        { label: "Mission", id: "mission" },
        { label: "Policies", id: "policy" },
        { label: "Gallery", id: "gallery" },
        { label: "Team", id: "team" },
        { label: "Vote", id: "vote" }
    ];

    // Helper for text color based on theme
    // Themed via --spv-* (emitted at :root by SinglePartyBaseStyles): this navbar
    // renders inside the cinematic portal, OUTSIDE .fms-app, so Layer-1 --color-*
    // never reaches it — --spv-* is the only themable channel here.
    const getTextColor = () => {
        if (scrolled) return "text-[var(--spv-deep)] hover:text-[var(--spv-accent)]";
        return theme === 'light' ? "text-[var(--spv-dark)] hover:text-[var(--spv-vote-glow)]" : "text-white hover:text-white/80";
    };

    const getDividerColor = () => {
        if (scrolled) return "bg-[color-mix(in_srgb,var(--spv-deep)_10%,transparent)]";
        return theme === 'light' ? "bg-black/10" : "bg-white/20";
    };

    // Shared Menu Content Component
    const MenuContent = ({ showNav }) => (
        <div className="flex flex-col gap-2">
            {/* User Profile */}
            {user ? (
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-black/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--spv-vote-glow)] to-[var(--spv-nav-accent)] text-white flex items-center justify-center text-lg shadow-md font-bold">
                            {user.name?.[0] || <User size={18} />}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-black text-sm truncate">{user.name}</p>
                            <p className="text-[10px] text-black/50 uppercase tracking-wider">{user.studentId}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 text-xs font-bold text-red-500 bg-white hover:bg-red-50 rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-100 shadow-sm"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            ) : (
                <Link
                    href="/login"
                    className="w-full py-3 rounded-2xl bg-[var(--spv-dark)] hover:bg-gradient-to-r hover:from-[var(--spv-vote-glow)] hover:to-[var(--spv-nav-accent)] text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                >
                    <User size={16} /> Login
                </Link>
            )}

            {/* Navigation Links (Conditional) */}
            {showNav && (
                <>
                    <div className="h-px w-full bg-black/5 my-1" />
                    <div className="flex flex-col gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { onScrollTo(item.id); setMenuOpen(false); }}
                                className="text-left font-bold text-black/70 hover:text-[var(--spv-vote-glow)] hover:bg-[color-mix(in_srgb,var(--spv-brand)_6%,white)] rounded-xl px-4 py-3 text-xs w-full transition-all uppercase tracking-wider flex items-center justify-between group"
                            >
                                {item.label}
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--spv-vote-glow)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <>
            {/* === FLOATING CAPSULE CONTAINER (Sticky) === */}
            <nav
                className={`sticky top-3 lg:top-6 left-0 right-0 mx-auto z-[100] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] mb-[-5rem] flex justify-center
                ${scrolled
                        ? "scale-100 translate-y-0"
                        : "scale-105 translate-y-0"
                    }
                `}
                style={{ width: 'auto', maxWidth: '95vw' }}
            >
                {/* CAPSULE DIV - Relative for Mobile Center Dropdown */}
                <div className={`
                    relative flex items-center gap-1 p-2 pl-3 pr-2 
                    transition-all duration-500
                    ${scrolled
                        ? "bg-white/95 backdrop-blur-2xl backdrop-saturate-200 border border-white/60 shadow-[0_8px_32px_rgba(9,5,18,0.1)]"
                        : "bg-transparent border-transparent shadow-none"
                    }
                    rounded-full
                `}>

                    {/* 1. HOME / LOGO BUTTON (Full PSU Logo) */}
                    <Link
                        href="/"
                        className="h-10 px-4 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300 group ring-1 ring-black/5"
                        title="Back to Home"
                    >
                        <div className="relative w-[100px] md:w-[130px] h-6 md:h-7">
                            <Image
                                src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")}
                                alt="PSU FMS"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </Link>

                    {/* Divider */}
                    <div className={`w-px h-6 mx-1 hidden lg:block transition-colors ${getDividerColor()}`} />

                    {/* 2. DESKTOP MENU (Text Links - Visible on Large Screens) */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onScrollTo(item.id)}
                                className={`px-5 py-2 rounded-full text-xs font-extraBold uppercase tracking-wider transition-all duration-300 ${getTextColor()}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className={`w-px h-6 mx-1 hidden lg:block transition-colors ${getDividerColor()}`} />

                    {/* 3. HAMBURGER MENU BUTTON */}
                    <div className="relative pl-1">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                ${menuOpen
                                    ? "bg-black text-white shadow-lg rotate-90"
                                    : scrolled
                                        ? "bg-black/5 hover:bg-black/10 text-black/70 hover:text-black"
                                        : theme === 'light' ? "bg-black/5 hover:bg-black/10 text-black/80" : "bg-white/10 hover:bg-white/20 text-white shadow-sm"
                                }
                            `}
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* 
                           === DESKTOP DROPDOWN (Right Anchored) === 
                           Visible ONLY on Desktop (hidden lg:block).
                           Positioned relative to BUTTON.
                           NO NAV LINKS (showNav={false})
                        */}
                        {menuOpen && (
                            <div className="hidden lg:block absolute top-full right-0 mt-4 w-72 max-w-[92vw] bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] rounded-[2rem] p-5 animate-in fade-in slide-in-from-top-4 origin-top-right z-[105]">
                                <MenuContent showNav={false} />
                            </div>
                        )}
                    </div>

                    {/* 
                        === MOBILE DROPDOWN (Center Anchored) === 
                        Visible ONLY on Mobile (lg:hidden).
                        Positioned relative to CAPSULE.
                        HAS NAV LINKS (showNav={true})
                    */}
                    {menuOpen && (
                        <div className="lg:hidden absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 max-w-[92vw] bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] rounded-[2rem] p-5 animate-in fade-in slide-in-from-top-4 origin-top z-[105]">
                            <MenuContent showNav={true} />
                        </div>
                    )}

                </div>
            </nav>
        </>
    );
});

export default CinematicNavbar;
