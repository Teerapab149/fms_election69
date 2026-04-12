"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "../SmartImage";

/**
 * ThreeDCarousel component - 3D image carousel with auto-play
 */
const ThreeDCarousel = ({ images }) => {
    const [activeIndex, setActiveIndex] = useState(1);

    const displayImages = useMemo(() => {
        if (images.length === 0) return [];
        if (images.length === 1) return [images[0], images[0], images[0]];
        if (images.length === 2) return [images[0], images[1], images[0]];
        return images;
    }, [images]);

    const handleNext = () => setActiveIndex((prev) => (prev + 1) % displayImages.length);
    const handlePrev = () => setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

    useEffect(() => {
        const interval = setInterval(handleNext, 5000);
        return () => clearInterval(interval);
    }, [displayImages.length]);

    if (!displayImages.length) return null;

    const getStyle = (index) => {
        const length = displayImages.length;
        let offset = (index - activeIndex + length) % length;
        if (offset > length / 2) offset -= length;

        if (offset === 0) {
            return {
                zIndex: 20,
                opacity: 1,
                transform: "translateX(0) scale(1)",
                filter: "brightness(100%)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            };
        }
        else if (offset === -1 || (activeIndex === 0 && index === length - 1)) {
            return {
                zIndex: 10,
                opacity: 0.8,
                transform: "translateX(-65%) scale(0.85)",
                filter: "brightness(80%)"
            };
        }
        else if (offset === 1 || (activeIndex === length - 1 && index === 0)) {
            return {
                zIndex: 10,
                opacity: 0.8,
                transform: "translateX(65%) scale(0.85)",
                filter: "brightness(80%)"
            };
        }
        else {
            return {
                zIndex: 0,
                opacity: 0,
                transform: "translateX(0) scale(0.5)"
            };
        }
    };

    return (
        <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
            <div className="relative w-[90%] md:w-[60%] h-[500px] flex items-center justify-center perspective-[1000px]">
                {displayImages.map((src, i) => (
                    <div
                        key={i}
                        className="absolute top-0 w-full h-full rounded-[2rem] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] bg-white border border-black/5"
                        style={getStyle(i)}
                    >
                        <SmartImage src={src} alt={`Slide ${i}`} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>

            <button
                onClick={handlePrev}
                className="absolute left-4 md:left-10 z-30 p-4 bg-white/80 hover:bg-black hover:text-white text-black rounded-full shadow-lg backdrop-blur-md transition-all"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={handleNext}
                className="absolute right-4 md:right-10 z-30 p-4 bg-white/80 hover:bg-black hover:text-white text-black rounded-full shadow-lg backdrop-blur-md transition-all"
            >
                <ChevronRight size={32} />
            </button>

            <div className="absolute bottom-4 flex gap-2 z-30">
                {displayImages.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-12 bg-[#B8860B]" : "w-3 bg-black/20"}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ThreeDCarousel;
