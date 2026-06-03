"use client";

// Day 7b: banner-section / minimal-line variant.
//
// Editorial / clean aesthetic — same content (slideshow + dots) as default,
// but a transparent frame with horizontal rules above + below instead of the
// card chrome (border + radius + shadow). Tighter padding and no rounded corners.
//
// Variant contract (per ADR-001):
//   1. Root has data-element="banner-section" → Layer 2 vars resolve here.
//   2. Same prop signature as default ({ config, resolvedTemplate, elementConfigs }).
//   3. Layer 2 vars consumed via fallback chain. `--banner-bg` flows through
//      even though this variant defaults to transparent — admin can still
//      override per-element when the Tier-2 editor lands.
//   4. Self-contained (no globals).
//   5. Layer 3 inline overrides (config.backgroundColor / borderColor) win.

import { useState, useEffect } from "react";
import Image from "next/image";
import { getPath } from "../../../utils/basePath";

export default function MinimalLineBanner({ config = {}, resolvedTemplate = null, elementConfigs = null }) {
  // Dual-channel config read for banner-section.
  const bannerCfg = elementConfigs?.["banner-section"]?.config
    ?? resolvedTemplate?.elements?.["banner-section"]?.config
    ?? null;

  // Layer 3 inline overrides — cfg wins; otherwise transparent + token border.
  // Hairline rules top+bottom; no radius, no shadow.
  const ruleColor = bannerCfg?.borderColor || 'var(--banner-border)';
  const frameStyle = {
    backgroundColor: bannerCfg?.backgroundColor || 'transparent',
    borderTop: `1px solid ${ruleColor}`,
    borderBottom: `1px solid ${ruleColor}`,
    borderRadius: 0
  };

  // Same slideshow as default — content (the campaign image carousel) is
  // shared by all banner variants. Frame differs; content does not.
  const slideshowImages = [getPath("/images/prob/samo49_1.png")];
  const isMultiImage = slideshowImages.length > 1;
  const extendedImages = isMultiImage ? [...slideshowImages, slideshowImages[0]] : slideshowImages;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    if (!isMultiImage) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => prev + 1);
      setIsTransitioning(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isMultiImage]);

  useEffect(() => {
    if (!isMultiImage) return;
    if (currentImageIndex === extendedImages.length - 1) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentImageIndex(0);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [currentImageIndex, extendedImages.length, isMultiImage]);

  return (
    <div className="w-full max-w-2xl mx-auto lg:max-w-none lg:mx-0 pt-0 pb-4 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
      <div
        data-element="banner-section"
        className="w-full relative group overflow-hidden aspect-[16/9] py-2"
        style={frameStyle}
      >
        <div className="relative w-full h-full">
          <div
            className="flex h-full will-change-transform"
            style={{
              transform: `translateX(-${currentImageIndex * 100}%)`,
              transitionDuration: isTransitioning && isMultiImage ? "1500ms" : "0ms",
              transitionProperty: "transform",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {extendedImages.map((src, index) => (
              <div key={index} className="min-w-full h-full relative">
                <Image
                  src={src}
                  alt={`Campaign Poster ${index}`}
                  fill
                  className="object-cover object-top"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {isMultiImage && (
          <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1.5">
            {slideshowImages.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  currentImageIndex % slideshowImages.length === index
                    ? "w-8 bg-[#8A2680]"
                    : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
