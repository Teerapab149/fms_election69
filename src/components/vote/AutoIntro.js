"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SmartImage from "../SmartImage";
import { ELECTION_CONFIG, ELECTION_YEAR, ELECTION_SLOGAN } from '../../utils/electionConfig';

// --- Configuration ---
// Removed constant ANIMATION_DURATION to use simpler inline timing for punchier effect
const EASE_CUSTOM = [0.33, 1, 0.68, 1]; // "Cubic Soft" - Butter smooth

// --- Motion Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.3, delayChildren: 0.1 },
    },
    exit: {
        y: "-100%",
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
};

const textRevealVariants = {
    hidden: { y: "110%" },
    show: {
        y: "0%",
        transition: { duration: 1.0, ease: EASE_CUSTOM },
    },
    exit: {
        y: "-110%",
        transition: { duration: 0.6, ease: "easeInOut" },
    },
};

const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE_CUSTOM } },
};

const MaskedText = ({ children, className, delay = 0 }) => (
    <div className="overflow-hidden">
        <motion.div
            initial="hidden"
            animate="show"
            exit="exit"
            variants={{
                hidden: { y: "140%" },
                show: { y: "0%", transition: { duration: 1.2, ease: EASE_CUSTOM, delay: delay } },
                exit: { y: "-110%", transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1], delay: 0 } }
            }}
            className={`block will-change-transform py-[0.4em] -my-[0.3em] ${className}`}
        >
            {children}
        </motion.div>
    </div>
);

// --- Main Component ---
export default function AutoIntro({
    partyName,
    partyLogoUrl,
    onComplete,
    finished,
}) {
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (finished) return;

        // Sequence Timer (Slower for better readability)
        const step1Timer = setTimeout(() => setStep(2), 4000);
        const step2Timer = setTimeout(() => onComplete?.(), 8000);

        return () => {
            clearTimeout(step1Timer);
            clearTimeout(step2Timer);
        };
    }, [finished, onComplete]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FAFAFA] text-black overflow-hidden"
                initial="hidden"
                animate="show"
                variants={containerVariants}
            >
                {/* 1. DYNAMIC AURORA BACKGROUND (No SVG = No Lag) */}
                <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-purple-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none mix-blend-multiply" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-amber-400/10 rounded-full blur-[120px] animate-pulse pointer-events-none mix-blend-multiply delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-pink-500/5 rounded-full blur-[80px] animate-pulse pointer-events-none mix-blend-multiply delay-500" />

                {/* 1.1 NOISE TEXTURE (Lightweight & Performance Friendly) */}
                <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />

                {/* 2. Top Progress Bar */}
                <motion.div
                    className="absolute top-0 left-0 h-1.5 bg-[#1a1a1a] z-50 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 8, ease: "linear" }}
                />

                {/* 3. Content Container */}
                <div className="relative z-10 w-full max-w-7xl px-4 md:px-12 flex flex-col items-center justify-center h-full">
                    <AnimatePresence mode="wait">

                        {/* --- STEP 1: Welcome (Big & Bold) --- */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                className="flex flex-col items-center text-center space-y-4 md:space-y-8"
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                variants={containerVariants}
                            >
                                <motion.div variants={badgeVariants} className="border border-[#1a1a1a] px-5 py-2 rounded-full text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-[#1a1a1a] mb-6 hover:bg-[#1a1a1a] hover:text-white transition-colors cursor-default">
                                    Official Election {ELECTION_YEAR}
                                </motion.div>

                                <MaskedText className="text-3xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-normal text-[#1a1a1a] z-10" delay={0.1}>
                                    ยินดีต้อนรับสู่
                                </MaskedText>
                                <MaskedText className="text-3xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 z-10" delay={0.4}>
                                    การเลือกตั้งสโมสรนักศึกษา
                                </MaskedText>
                                <MaskedText className="text-3xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-normal text-[#1a1a1a] z-10" delay={0.7}>
                                    คณะวิทยาการจัดการ ปี {ELECTION_YEAR}
                                </MaskedText>
                            </motion.div>
                        )}

                        {/* --- STEP 2: Candidate Reveal (Impactful) --- */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                className="flex flex-col items-center text-center space-y-8 w-full"
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                variants={containerVariants}
                            >
                                {partyLogoUrl && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20, opacity: 0 }}
                                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="h-32 w-32 md:h-56 md:w-56 relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] mb-2"
                                    >
                                        <SmartImage
                                            src={partyLogoUrl}
                                            alt="Party Logo"
                                            className="h-full w-full object-contain"
                                            priority={true}
                                        />
                                    </motion.div>
                                )}

                                <div className="flex flex-col items-center w-full">
                                    <MaskedText className="text-sm md:text-2xl font-bold uppercase tracking-[0.4em] text-[#1a1a1a]/40 mb-4 h-8 md:h-10">
                                        INTRODUCING
                                    </MaskedText>

                                    <div className="overflow-hidden w-full px-4 text-center flex justify-center">
                                        <motion.div
                                            variants={textRevealVariants}
                                            className="block w-full py-2" // Added padding to prevent ascender crop
                                        >
                                            <h2 className="text-4xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.8] text-[#1a1a1a] drop-shadow-xl filter">
                                                {partyName}
                                            </h2>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* 4. Skip Button (Corner) */}
                <motion.button
                    onClick={onComplete}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute bottom-10 right-10 z-50 p-4 group"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[#1a1a1a]/50 group-hover:text-[#1a1a1a] transition-colors">Skip Intro</span>
                        <div className="w-10 h-10 rounded-full border border-[#1a1a1a]/20 flex items-center justify-center group-hover:bg-[#1a1a1a] group-hover:border-[#1a1a1a] transition-all">
                            <div className="w-0 h-0 border-l-[6px] border-l-[#1a1a1a] border-y-[4px] border-y-transparent group-hover:border-l-white transition-colors ml-0.5" />
                        </div>
                    </div>
                </motion.button>
            </motion.div>

        </AnimatePresence>
    );
}