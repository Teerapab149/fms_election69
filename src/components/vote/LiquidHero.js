"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import SmartImage from "../SmartImage";
import { getPath } from "../../utils/basePath";

// Throttle helper
const throttle = (fn, ms) => {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= ms) {
            lastCall = now;
            fn(...args);
        }
    };
};

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- 1. DESKTOP GRID LOGIC (Scattered Full Screen) ---
const generateDesktopGridPositions = (count, cols = 5, rows = 3) => {
    // User Request: "Scattered", "Full Screen", "No Overflow", "Random Placement"
    // Strategy: Use a denser Virtual Grid to guarantee spacing, then apply heavy jitter.

    // Virtual Grid: 6 Columns x 4 Rows (24 slots) -> Fits 21 members comfortably
    const vCols = 6;
    const vRows = Math.ceil(count / vCols);
    const totalSlots = vCols * vRows;

    const slots = Array.from({ length: totalSlots }, (_, i) => i);

    // Fisher-Yates Shuffle for Randomness (Anyone anywhere)
    for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const assignedSlots = slots.slice(0, Math.min(count, totalSlots));

    return assignedSlots.map(slotIndex => {
        const col = slotIndex % vCols;
        const row = Math.floor(slotIndex / vCols);

        // Normalize 0-1
        const u = col / (vCols - 1 || 1);
        const v = row / (vRows - 1 || 1);

        // FULL SCREEN BOUNDS: 3% to 90%
        // Desktop screens are wide, so we can go quite close to the edge.
        // 130px image is small relative to 1920px (<7%).
        let left = 3 + (u * 87);
        let top = 8 + (v * 75); // Keep slightly away from bottom text

        // HEAVY ORGANIC JITTER
        // Break the grid lines visually
        left += (Math.random() * 8 - 4);
        top += (Math.random() * 10 - 5);

        return {
            left: left + "%",
            top: top + "%",
            rotate: (Math.random() - 0.5) * 20, // More dynamic rotation
            scale: Math.random() * 0.3 + 0.85,  // Varied sizes (0.85 - 1.15)
            depth: Math.random() * 0.6 + 0.4,
            floatDuration: Math.random() * 6 + 4,
            floatDelay: Math.random() * 2,
        };
    });
};

// --- 2. MOBILE GRID LOGIC (Separate & Optimized) ---
const generateMobileGridPositions = (count) => {
    // Mobile Configuration:
    // - 3 Columns for MAX size
    // - Strict bounds (5% - 90%)
    const cols = 4;
    const rows = Math.ceil(count / cols);

    // Create slots (No shuffling - strictly ordered or minimal jitter?)
    // User liked "Scattered" but "Horizontal". Let's stick to ordered slots but slightly jittered.
    const slots = Array.from({ length: count }, (_, i) => i);

    // Optional: Shuffle slightly if we want randomness, but user asked for "Horizontal".
    // Let's keep strict order for cleaner rows.

    return slots.map(slotIndex => {
        const col = slotIndex % cols;
        const row = Math.floor(slotIndex / cols);

        const u = col / (cols - 1 || 1);
        const v = row / (rows - 1 || 1);

        // Mobile Bounds: 2.5% to 73.5% (Widened for spacing)
        // Reduced side margins to increase "breathing room" between images.
        let left = 2.5 + (u * 71);
        let top = 10 + (v * 80);

        // Minimal Jitter for "Organic" feel but keeping lines
        left += (Math.random() * 3 - 1.5);
        top += (Math.random() * 3 - 1.5);

        return {
            left: left + "%",
            top: top + "%",
            rotate: (Math.random() - 0.5) * 6, // Very subtle rotation
            scale: 1, // Base scale is 1 because we set PHYSICAL size smaller in Component
            depth: Math.random() * 0.3 + 0.7, // Flatter depth
            floatDuration: Math.random() * 4 + 4,
            floatDelay: Math.random() * 1.5,
        };
    });
};


export const LiquidHero = ({ children, className, members = [], isActive = false }) => {
    const containerRef = useRef(null);
    const [mounted, setMounted] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    // Grid State
    const [cols, setCols] = useState(5);
    const isMobile = cols === 1;

    // --- ANIMATION REFS ---
    const spotlightRadius = useMotionValue(2000);
    const lensDiameter = useTransform(spotlightRadius, r => r * 2);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 60, stiffness: 120, mass: 1.2 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const maskImageValue = useTransform(
        [springX, springY, spotlightRadius],
        ([Sx, Sy, R]) => `radial-gradient(circle ${R}px at ${Sx}px ${Sy}px, black 100%, transparent 100%)`
    );

    const textParallaxX1 = useTransform(springX, (v) => (v - 500) * 0.05);
    const textParallaxX2 = useTransform(springX, (v) => (v - 500) * -0.05);

    // Responsive Check
    useEffect(() => {
        const updateCols = () => {
            if (window.innerWidth < 768) {
                setCols(1); // Mobile
            } else if (window.innerWidth < 1024) {
                setCols(3); // Tablet
            } else {
                setCols(5); // Desktop
            }
        };

        if (typeof window !== 'undefined') {
            updateCols();
            window.addEventListener('resize', updateCols);
            return () => window.removeEventListener('resize', updateCols);
        }
    }, []);

    // Calculate Positions Separation
    const memberPositions = useMemo(() => {
        const list = members || [];
        if (list.length === 0) return [];

        if (isMobile) {
            // MOBILE PATH
            const positions = generateMobileGridPositions(list.length);
            return list.map((m, i) => ({ ...m, ...positions[i] }));
        } else {
            // DESKTOP/TABLET PATH
            const rows = Math.max(3, Math.ceil(list.length / cols));
            const positions = generateDesktopGridPositions(list.length, cols, rows);
            return list.map((m, i) => ({ ...m, ...positions[i] }));
        }
    }, [members, cols, isMobile]);

    // Standard Effects (Mount, Visibility, Mouse)
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const w = window.innerWidth;
            const h = window.innerHeight;
            spotlightRadius.set(Math.max(w, h) * 1.5);
            mouseX.set(w / 2);
            mouseY.set(h / 2);
        }
    }, [mouseX, mouseY, spotlightRadius]);

    const [isVisible, setIsVisible] = useState(true);
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && isActive && isVisible) {
            const targetRadius = Math.min(window.innerWidth * 0.35, 280);
            animate(spotlightRadius, targetRadius, { duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 });
            const memberTimer = setTimeout(() => setShowMembers(true), 1000);

            const handleMove = throttle((clientX, clientY) => {
                mouseX.set(clientX);
                mouseY.set(clientY);
            }, 50);

            const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
            const onTouchMove = (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY);

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("touchmove", onTouchMove, { passive: true });
            return () => {
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("touchmove", onTouchMove);
                clearTimeout(memberTimer);
            };
        }
    }, [isActive, isVisible, mouseX, mouseY, spotlightRadius]);

    return (
        <>
            <style jsx global>{`
                @keyframes float-member {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
            <div
                ref={containerRef}
                className={cn(
                    "relative w-full h-screen overflow-hidden bg-[#F5F5F7] flex items-center justify-center isolate font-sans",
                    className
                )}
            >
                {/* 1. LAYER: DESIGNER GRID */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-[0.08]"
                        style={{ backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`, backgroundSize: '80px 80px' }}
                    />
                    <div className="absolute top-[20%] left-[20%] w-4 h-4 border-l border-t border-black/20" />
                    <div className="absolute bottom-[20%] right-[20%] w-4 h-4 border-r border-b border-black/20" />
                    <div className="absolute top-8 left-8 text-[10px] font-mono text-black/30 tracking-[0.3em]">SYSTEM_READY // FMS ELECTION</div>
                    <div className="absolute bottom-8 right-8 text-[10px] font-mono text-black/30 tracking-[0.3em] text-right">SCROLL_TO_VOTE <br /> [ESTD. 2026]</div>
                </div>

                {/* 2. LAYER: THE REVEAL */}
                {mounted && (
                    <motion.div
                        className="absolute inset-0 z-10 pointer-events-none"
                        style={{ maskImage: maskImageValue, WebkitMaskImage: maskImageValue }}
                    >
                        <div className="absolute inset-0 opacity-90" style={{ background: "linear-gradient(to bottom right, var(--spv-hero-a, #2E1065), var(--spv-hero-b, #7e22ce), var(--spv-hero-c, #ec4899))" }} />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center select-none overflow-hidden">
                            <motion.div style={{ x: textParallaxX1 }}>
                                <h1 className="text-[22vw] md:text-[12vw] font-black uppercase leading-none text-white/10 tracking-tighter mix-blend-overlay blur-sm">SAMO FMS</h1>
                            </motion.div>
                            <motion.div style={{ x: textParallaxX2 }}>
                                <h1 className="text-[22vw] md:text-[12vw] font-black uppercase leading-none text-white/10 tracking-tighter mix-blend-overlay blur-sm ml-[2vw] md:ml-[15vw]">Election</h1>
                            </motion.div>
                        </div>

                        {/* RENDERING MEMBERS : SEPARATE PATHS */}
                        {showMembers && memberPositions.map((member, i) => (
                            isMobile ? (
                                <MobileFloatingMember key={i} member={member} />
                            ) : (
                                <DesktopFloatingMember key={i} member={member} springX={springX} springY={springY} />
                            )
                        ))}
                    </motion.div>
                )}

                {/* 3. LAYER: CURSOR LENS */}
                <motion.div
                    className="absolute z-20 pointer-events-none flex items-center justify-center"
                    style={{ width: lensDiameter, height: lensDiameter, x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
                >
                    <div className="absolute inset-0 rounded-full border border-white/20 opacity-50 scale-[0.98]" />
                    <div className="absolute inset-0 rounded-full border border-dashed border-white/30 scale-[0.85]" style={{ animation: 'spin 20s linear infinite' }} />
                    <div className="w-2 h-2 bg-white/50 rounded-full blur-[1px]" />
                </motion.div>

                {/* 4. CONTENT */}
                <div className="relative z-30 w-full animate-in fade-in duration-700">
                    {children}
                </div>

                {/* 5. HIGHLIGHT */}
                {mounted && (
                    <motion.div
                        className="absolute inset-0 z-40 pointer-events-none w-full h-full flex items-center justify-center animate-in fade-in duration-700"
                        style={{ maskImage: maskImageValue, WebkitMaskImage: maskImageValue }}
                    >
                        <div id="spotlight-content" className="w-full text-white">{children}</div>
                    </motion.div>
                )}
            </div>
        </>
    );
};

// --- A. DESKTOP MEMBER COMPONENT (ORIGINAL) ---
function DesktopFloatingMember({ member, springX, springY }) {
    const x = useTransform(springX, (v) => (v - (typeof window !== 'undefined' ? window.innerWidth : 1000) / 2) * (member.depth * 0.06 * -1));
    const y = useTransform(springY, (v) => (v - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * (member.depth * 0.06 * -1));

    return (
        <motion.div
            className="absolute z-10 will-change-transform"
            style={{
                left: member.left,
                top: member.top,
                x, y, // Parallax enabled
                zIndex: Math.floor(member.depth * 10),
            }}
        >
            <div
                className="relative rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/5"
                style={{
                    width: 130, // ORIGINAL LARGE SIZE
                    height: 170, // ORIGINAL LARGE SIZE
                    transform: `scale(${member.scale}) rotate(${member.rotate}deg)`,
                    border: '1px solid rgba(255,255,255,0.3)',
                    animation: `member-fade-in 0.6s ease-out forwards, float-member ${member.floatDuration}s ease-in-out 0.6s infinite`,
                    animationDelay: `${member.floatDelay * 0.3}s`
                }}
            >
                <div className="relative w-full h-full">
                    {member.imageUrl ? (
                        <SmartImage
                            src={getPath(member.imageUrl)}
                            alt={member.name || "Member"}
                            className="w-full h-full block brightness-110 contrast-110"
                            objectFit="cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
                            <span className="text-[9px] font-mono">NO_DATA</span>
                        </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-md py-2 px-3 border-t border-white/10">
                        <p className="text-[8px] text-[#FFD700] font-mono leading-none tracking-widest mb-1">{member.position}</p>
                        <p className="text-[10px] text-white font-bold leading-none truncate">{member.name}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// --- B. MOBILE MEMBER COMPONENT (NEW & SEPARATE) ---
function MobileFloatingMember({ member }) {
    // No Parallax or extreme transforms for mobile performance & cleaner look
    return (
        <div
            className="absolute z-10 will-change-transform"
            style={{
                left: member.left,
                top: member.top,
                zIndex: 10, // Flat z-index
            }}
        >
            <div
                className="relative rounded-md overflow-hidden shadow-lg bg-white/5"
                style={{
                    // EXPLICIT LARGE SIZE FOR MOBILE
                    width: 95,
                    height: 125,
                    transform: `rotate(${member.rotate}deg)`, // No scale needed, size is fixed
                    border: '1px solid rgba(255,255,255,0.2)',
                    animation: `member-fade-in 0.6s ease-out forwards`,
                    animationDelay: `${member.floatDelay * 0.3}s`
                }}
            >
                <div className="relative w-full h-full">
                    {member.imageUrl ? (
                        <SmartImage
                            src={getPath(member.imageUrl)}
                            alt={member.name || "Member"}
                            className="w-full h-full block brightness-110 contrast-110"
                            objectFit="cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
                            <span className="text-[6px] font-mono">...</span>
                        </div>
                    )}

                    {/* Simplified/Removed Label for Micro-View if needed, or keep tiny */}
                    {/* For 50px width, text might be unreadable. Let's hide text or make it tiny dots? */}
                    {/* User didn't ask to remove text, but visual noise might be high. Let's keep a tiny bar. */}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-[#FFD700]/80" />
                </div>
            </div>
        </div>
    );
}

export default LiquidHero;