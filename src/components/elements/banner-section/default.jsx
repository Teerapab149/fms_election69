"use client";

// Day 7b: banner-section / default variant (extracted 1:1 from ElectionBannerBlock).
// This is the canonical FMS banner: white-by-default card with slideshow + dots.
//
// Variant contract (per ADR-001):
//   1. Renders root with data-element="banner-section" (Layer 2 scope marker).
//   2. Accepts {config, resolvedTemplate, elementConfigs} like the wrapper did.
//   3. Consumes Layer 2 vars (--banner-bg, --banner-border, --banner-radius).
//   4. Self-contained (no globals; reads template via prop).
//   5. Respects Layer 3 inline overrides (config.X wins over var()).

import { useState, useEffect } from "react";
import Image from "next/image";
import { getPath } from "../../../utils/basePath";
import { RADIUS_MAP } from "../../../utils/styleMaps";

// Build inline frame style from a (flat, non-stateful) banner-section config.
// Returns undefined when no fields → legacy Tailwind frame wins (P-LOG-015).
// Day 7a Part 4 (Layer 2 pilot): banner reads element-scope vars.
// Cascade per ADR-001 D10:
//   cfg explicit (Layer 3) > --banner-* (Layer 2) > --color-*/--radius-* (Layer 1)
function buildBannerStyle(cfg) {
  if (!cfg) return undefined;
  const style = {};
  style.borderRadius    = (cfg.borderRadius && RADIUS_MAP[cfg.borderRadius]) || 'var(--banner-radius)';
  style.backgroundColor = cfg.backgroundColor || 'var(--banner-bg)';
  style.borderColor     = cfg.borderColor || 'var(--banner-border)';
  // Layer 2 frame controls (Tier 2). On the override path these inline values
  // replace the Tailwind frame classes (shadow-2xl / border) so the admin can
  // tune them; the var defaults match those classes 1:1 (byte-faithful).
  style.borderWidth     = (cfg.borderWidth ? `${cfg.borderWidth}px` : 'var(--banner-border-width)');
  style.borderStyle     = 'solid';
  style.boxShadow       = 'var(--banner-shadow)';
  return style;
}

export default function DefaultBanner({ config = {}, resolvedTemplate = null, elementConfigs = null }) {
  // Dual-channel config read for banner-section (non-stateful flat config).
  const bannerCfg = elementConfigs?.["banner-section"]?.config
    ?? resolvedTemplate?.elements?.["banner-section"]?.config
    ?? null;
  const hasOverride = !!bannerCfg && Object.keys(bannerCfg).length > 0;
  const frameStyle = hasOverride ? buildBannerStyle(bannerCfg) : undefined;
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
        className={`w-full relative group overflow-hidden aspect-[16/9] transform transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${hasOverride ? "" : "shadow-2xl border hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] rounded-3xl border-white bg-white"}`}
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
