"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Lightbox component สำหรับดูรูปแบบเต็มจอ พร้อม navigation
 */
const SimpleLightbox = React.memo(function SimpleLightbox({ isOpen, onClose, images, initialIndex = 0 }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => setCurrentIndex(initialIndex), [initialIndex]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
            if (e.key === "ArrowLeft") setCurrentIndex((p) => (p - 1 + images.length) % images.length);
            if (e.key === "ArrowRight") setCurrentIndex((p) => (p + 1) % images.length);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose, images?.length]);

    if (!isOpen || !images?.length) return null;

    return (
        <div className="fixed inset-0 z-[100000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300" onClick={onClose}>
            <button
                onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                className="absolute top-5 right-5 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
                <X size={24} />
            </button>

            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full z-50 hidden md:block"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full z-50 hidden md:block"
                    >
                        <ChevronRight size={32} />
                    </button>
                </>
            )}

            <div className="relative w-full h-full p-4 md:p-10 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img
                    src={images[currentIndex]}
                    alt="Gallery"
                    className="w-auto h-auto max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-500"
                />
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 px-6 py-2 rounded-full text-xs font-bold text-white/60 tracking-widest">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    );
});

export default SimpleLightbox;
