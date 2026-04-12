"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Hook สำหรับเช็คว่า element อยู่ใน viewport หรือไม่
 */
export function useInView(options = { threshold: 0.18, rootMargin: "0px 0px -12% 0px" }) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setInView(true);
        }, options);

        obs.observe(el);
        return () => obs.disconnect();
    }, [options.threshold, options.rootMargin]);

    return [ref, inView];
}

/**
 * Component แสดง animation เมื่อ element เข้ามาใน viewport
 */
export const Reveal = React.memo(function Reveal({ children, delay = 0, className = "" }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!ref.current) return;

        // Fallback: If not visible after 100ms, force show (for elements already in view)
        const fallbackTimer = setTimeout(() => {
            setIsVisible(true);
        }, 100);

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                clearTimeout(fallbackTimer);
                setIsVisible(true);
                observer.disconnect();
            }
        }, {
            rootMargin: "500px",  // trigger 500px before entering viewport
            threshold: 0
        });
        observer.observe(ref.current);

        return () => {
            clearTimeout(fallbackTimer);
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={ref}
            className={`transform transition-all duration-400 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
});

/**
 * Component แสดง animation เมื่อ scroll เข้ามา
 */
export const RevealOnScroll = ({ children, className = "" }) => {
    const [wrapRef, inView] = useInView();

    return (
        <div ref={wrapRef} className={className}>
            <div
                className={[
                    "transition-all duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] will-change-transform",
                    inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-[0.92]",
                ].join(" ")}
            >
                {children}
            </div>
        </div>
    );
};

/**
 * ฟังก์ชันแปลงชื่อพรรค - แสดงเรียบง่ายและสวยงาม
 */
export const renderPartyTitle = (name, isHero = false) => {
    if (!name) return "Party Name";

    const gradientClass = "text-transparent bg-clip-text bg-gradient-to-r from-[#6A0DAD] via-[#B8860B] to-[#E6C200] animate-gradient-flow";

    // สำหรับหน้า Intro ใช้ simple fade-in
    if (!isHero) {
        return (
            <span className={`${gradientClass} block animate-in fade-in slide-in-from-bottom-4 duration-1000`}>
                {name}
            </span>
        );
    }

    // สำหรับ Hero section - ใช้การ wrap ตามธรรมชาติของ browser (ไม่บังคับแยกบรรทัด)
    // ถ้าต้องการแยกบรรทัดแบบ manual ให้ใช้ | ในชื่อ
    if (name.includes('|')) {
        const parts = name.split('|');
        return (
            <div className="flex flex-col items-start gap-1">
                {parts.map((part, i) => (
                    <span key={i} className={i === 1 ? gradientClass : ""}>{part.trim()}</span>
                ))}
            </div>
        );
    }

    // Default: แสดงเป็น single line ให้ browser wrap ตามธรรมชาติ
    return <span className={gradientClass}>{name}</span>;
};

/**
 * Optimize: RevealGrid
 * Uses a SINGLE IntersectionObserver for the entire grid, reducing overhead.
 */
export const RevealGrid = React.memo(function RevealGrid({ children, className = "", stagger = 50 }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: "200px" });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={className}>
            {React.Children.map(children, (child, i) => {
                if (!React.isValidElement(child)) return child;
                return React.cloneElement(child, {
                    className: `${child.props.className || ""} transform transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`,
                    style: { ...child.props.style, transitionDelay: `${i * stagger}ms` }
                });
            })}
        </div>
    );
});
