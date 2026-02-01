"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import SmartImage from "../SmartImage";
import { getPath } from "../../utils/basePath";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- CONSTANTS ---
const SPOTLIGHT_SIZE = 280; // Smaller spotlight for "Secret" feel
const GRID_COLS = 5; // Tighter grid
const GRID_ROWS = 3;

// --- GRID LOGIC : STRICT BOUNDS ---
// We calculate position to be strictly within a "Safe Box" of user screen (e.g. 15% - 85%)
const generateSafeGridPositions = (count) => {
    const totalSlots = GRID_COLS * GRID_ROWS;
    const slots = Array.from({ length: totalSlots }, (_, i) => i);

    // Fisher-Yates Shuffle
    for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const assignedSlots = slots.slice(0, Math.min(count, totalSlots));

    return assignedSlots.map(slotIndex => {
        const col = slotIndex % GRID_COLS;
        const row = Math.floor(slotIndex / GRID_COLS);

        // Normalize 0-1
        const u = col / (GRID_COLS - 1);
        const v = row / (GRID_ROWS - 1);

        // Interpolate into Safe Zone (20% to 80%)
        // This guarantees NO image touches the 0% or 100% edge
        const left = 20 + (u * 60) + (Math.random() * 5 - 2.5); // +/- 2.5% Jitter
        const top = 20 + (v * 60) + (Math.random() * 5 - 2.5);

        return {
            left: left + "%",
            top: top + "%",
            rotate: (Math.random() - 0.5) * 12, // Subtle rotation
            scale: Math.random() * 0.15 + 0.85, // Consistent sizing
            depth: Math.random() * 0.5 + 0.5,
            floatDuration: Math.random() * 5 + 5,
            floatDelay: Math.random() * 2,
        };
    });
};

export const LiquidHero = ({ children, className, members = [], isActive = false }) => {
    const containerRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    // --- ZOOM INTRO STATE ---
    // Start with a massive radius (Full Screen) -> Animate to spotlight size
    const spotlightRadius = useMotionValue(2000);
    const lensDiameter = useTransform(spotlightRadius, r => r * 2);

    // Mouse Interaction
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth Spring Physics (Heavy & Premium feel)
    const springConfig = { damping: 40, stiffness: 250, mass: 0.8 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    // Spotlight Mask (Now dynamic via spotlightRadius)
    const maskImageValue = useTransform(
        [springX, springY, spotlightRadius],
        ([Sx, Sy, R]) => `radial-gradient(circle ${R}px at ${Sx}px ${Sy}px, black 100%, transparent 100%)`
    );

    // Typography Parallax - FIXED: Now at top level
    const textParallaxX1 = useTransform(springX, (v) => (v - 500) * 0.05);
    const textParallaxX2 = useTransform(springX, (v) => (v - 500) * -0.05);

    // Grid Positions
    const memberPositions = useMemo(() => {
        const list = members && members.length > 0 ? members : [];
        if (list.length === 0) return [];
        const positions = generateSafeGridPositions(list.length);
        return list.map((m, i) => ({ ...m, ...positions[i] }));
    }, [members]);

    // 1. MOUNT EFFECT: Initialize to Full Screen
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const w = window.innerWidth;
            const h = window.innerHeight;
            // Start with max radius (full screen reveal) for the "Shrink" effect
            spotlightRadius.set(Math.max(w, h) * 1.5);
            mouseX.set(w / 2);
            mouseY.set(h / 2);
        }
    }, [mouseX, mouseY, spotlightRadius]);

    // 2. ACTIVATION EFFECT: Triggered when isActive becomes true
    useEffect(() => {
        if (typeof window !== 'undefined' && isActive) {
            // INTRO ANIMATION: Smoothly Shrink from Full Screen to Spotlight (Center)
            // Sync with the 800ms slide-up transition of SinglePartyView
            animate(spotlightRadius, 280, {
                duration: 1.2, // Match slide duration + settle time
                ease: [0.76, 0, 0.24, 1], // Match the Bezier of the slide
                delay: 0
            });

            // Enable mouse control immediately after zoom starts
            const handleMouseMove = (e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
            window.addEventListener("mousemove", handleMouseMove);

            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
            };
        }
    }, [isActive, mouseX, mouseY, spotlightRadius]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-screen overflow-hidden bg-[#F5F5F7] flex items-center justify-center isolate font-sans",
                className
            )}
        >
            {/* 1. LAYER: DESIGNER GRID (Visible "Blueprint" Background) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Fine Grid */}
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
                        backgroundSize: '80px 80px'
                    }}
                />
                {/* Crosshairs */}
                <div className="absolute top-[20%] left-[20%] w-4 h-4 border-l border-t border-black/20" />
                <div className="absolute bottom-[20%] right-[20%] w-4 h-4 border-r border-b border-black/20" />

                {/* Typography: "ELECTION 2026" */}
                <div className="absolute top-8 left-8 text-[10px] font-mono text-black/30 tracking-[0.3em]">
                    SYSTEM_READY // FMS ELECTION
                </div>
                <div className="absolute bottom-8 right-8 text-[10px] font-mono text-black/30 tracking-[0.3em] text-right">
                    SCROLL_TO_VOTE <br /> [ESTD. 2026]
                </div>
            </div>

            {/* 2. LAYER: THE REVEAL (Masked Content) */}
            {mounted && (
                <motion.div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                        maskImage: maskImageValue,
                        WebkitMaskImage: maskImageValue,
                    }}
                >
                    {/* A. VIBRANT GRADIENT (The "Future") */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2E1065] via-[#7e22ce] to-[#ec4899] opacity-90" />

                    {/* B. NOISE TEXTURE (Film Grain) */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />

                    {/* C. TYPOGRAPHY (Parallax Depth) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none overflow-hidden">
                        <motion.div style={{ x: textParallaxX1 }}>
                            <h1 className="text-[12vw] font-black uppercase leading-none text-white/10 tracking-tighter mix-blend-overlay blur-sm">
                                SAMO FMS
                            </h1>
                        </motion.div>
                        <motion.div style={{ x: textParallaxX2 }}>
                            <h1 className="text-[12vw] font-black uppercase leading-none text-white/10 tracking-tighter mix-blend-overlay blur-sm ml-[15vw]">
                                Election
                            </h1>
                        </motion.div>
                    </div>

                    {/* D. FLOATING MEMBERS */}
                    {memberPositions.map((member, i) => (
                        <FloatingMember
                            key={i}
                            member={member}
                            springX={springX}
                            springY={springY}
                        />
                    ))}
                </motion.div>
            )}

            {/* 3. LAYER: CURSOR LENS (The "Tool") */}
            <motion.div
                className="absolute z-20 pointer-events-none flex items-center justify-center"
                style={{
                    width: lensDiameter,
                    height: lensDiameter,
                    x: springX,
                    y: springY,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
            >
                {/* Glass Edge */}
                <div className="absolute inset-0 rounded-full border border-white/20 opacity-50 scale-[0.98]" />

                {/* Dynamic Data Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border border-dashed border-white/30 scale-[0.85]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Center Crosshair */}
                <div className="w-2 h-2 bg-white/50 rounded-full blur-[1px]" />
            </motion.div>

            {/* 4. CONTENT (Base Layer - Interactive) */}
            <div className="relative z-30 w-full animate-in fade-in duration-700">
                {children}
            </div>

            {/* 5. CONTENT HIGHLIGHT (Spotlight Overlay - White Text) */}
            {mounted && (
                <motion.div
                    className="absolute inset-0 z-40 pointer-events-none w-full h-full flex items-center justify-center animate-in fade-in duration-700"
                    style={{
                        maskImage: maskImageValue,
                        WebkitMaskImage: maskImageValue,
                    }}
                >
                    {/* 
                      Strategy: Duplicate content to allow specific styling via CSS.
                      We use #spotlight-content ID to target children specifically
                      (e.g., turning buttons Gold, text White) from the parent component.
                    */}
                    <div id="spotlight-content" className="w-full text-white">
                        {children}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// --- MEMBER COMPONENT ---
function FloatingMember({ member, springX, springY }) {
    // Parallax logic: slightly move opposite to scroll/mouse to create depth
    const x = useTransform(springX, (v) => (v - (typeof window !== 'undefined' ? window.innerWidth : 1000) / 2) * (member.depth * 0.06 * -1));
    const y = useTransform(springY, (v) => (v - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * (member.depth * 0.06 * -1));

    return (
        <motion.div
            className="absolute z-10 will-change-transform"
            style={{
                left: member.left,
                top: member.top,
                x, y,
                zIndex: Math.floor(member.depth * 10),
            }}
        >
            <motion.div
                className="relative rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#1a1a1a]"
                style={{
                    width: 130,
                    height: 170,
                    scale: member.scale,
                    rotate: member.rotate,
                    border: '1px solid rgba(255,255,255,0.3)'
                }}
                animate={{
                    y: [0, -8, 0],
                    rotate: [member.rotate, member.rotate + 1.5, member.rotate],
                }}
                transition={{
                    duration: member.floatDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: member.floatDelay
                }}
            >
                <div className="relative w-full h-full transition-all duration-500">
                    {member.imageUrl ? (
                        <SmartImage
                            src={getPath(member.imageUrl)}
                            alt={member.name || "Member"}
                            className="w-full h-full block"
                            objectFit="cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
                            <span className="text-[9px] font-mono">NO_DATA</span>
                        </div>
                    )}

                    {/* Modern Label */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-md py-2 px-3 border-t border-white/10">
                        <p className="text-[8px] text-[#FFD700] font-mono leading-none tracking-widest mb-1">{member.position}</p>
                        <p className="text-[10px] text-white font-bold leading-none truncate">{member.name}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default LiquidHero;