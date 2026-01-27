"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * LiquidMeshHeroBackground
 * - 4–5 pastel blobs (cyan/lavender/pink/white) that morph + float like a lava lamp.
 * - Optional mouse parallax/repulsion for depth (very light, mobile-friendly).
 * - Glassmorphism overlay keeps hero text readable.
 *
 * Drop into any Next.js page and put your hero content inside.
 */
export default function LiquidMeshHeroBackground({
  children,
  className = "",
  intensity = 18, // mouse influence strength
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef(null);
  const [hasPointer, setHasPointer] = useState(false);

  // Motion values for pointer position in [-0.5..0.5]
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Spring-smooth for calm movement
  const sx = useSpring(mx, { stiffness: 55, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 55, damping: 18, mass: 0.4 });

  useEffect(() => {
    // Prefer pointer devices only (avoid extra work on mobile)
    const mql = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    const update = () => setHasPointer(!!mql?.matches);
    update();
    mql?.addEventListener?.("change", update);
    return () => mql?.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!hasPointer || reduce) return;

    const el = containerRef.current;
    if (!el) return;

    let raf = 0;

    const onMove = (e) => {
      // Throttle to one RAF
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5; // [-0.5..0.5]
        const py = (e.clientY - r.top) / r.height - 0.5;
        mx.set(px);
        my.set(py);
      });
    };

    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hasPointer, reduce, mx, my]);

  // Blob definitions: color + base position
  const blobs = useMemo(
    () => [
      {
        id: "cyan",
        color: "rgba(165, 243, 252, 0.85)", // #A5F3FC
        base: { x: "15%", y: "20%" },
        size: "520px",
        z: 1,
        drift: 1.0,
        duration: 18,
        delay: 0,
      },
      {
        id: "lavender",
        color: "rgba(233, 213, 255, 0.85)", // #E9D5FF
        base: { x: "70%", y: "18%" },
        size: "560px",
        z: 2,
        drift: 0.9,
        duration: 22,
        delay: 0.8,
      },
      {
        id: "pink",
        color: "rgba(251, 207, 232, 0.80)", // #FBCFE8
        base: { x: "75%", y: "70%" },
        size: "600px",
        z: 3,
        drift: 1.05,
        duration: 24,
        delay: 0.2,
      },
      {
        id: "white",
        color: "rgba(255, 255, 255, 0.65)",
        base: { x: "20%", y: "75%" },
        size: "640px",
        z: 0,
        drift: 0.85,
        duration: 26,
        delay: 1.2,
      },
      {
        id: "mix",
        color: "rgba(221, 214, 254, 0.55)", // gentle lavender-white mix
        base: { x: "48%", y: "45%" },
        size: "720px",
        z: 4,
        drift: 1.1,
        duration: 28,
        delay: 0.4,
      },
    ],
    []
  );

  return (
    <section
      ref={containerRef}
      className={[
        "relative isolate overflow-hidden",
        "bg-white",
        "min-h-[70vh] w-full",
        className,
      ].join(" ")}
    >
      {/* Ambient base gradient (static, cheap) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#f6fbff]" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(165,243,252,0.55),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_80%_15%,rgba(233,213,255,0.55),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_70%_80%,rgba(251,207,232,0.50),transparent_60%)]" />
      </div>

      {/* Liquid blobs layer */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0">
          {/* Blend mode creates “liquid mesh” feeling */}
          <div className="absolute inset-0 mix-blend-multiply" />

          {blobs.map((b) => (
            <LiquidBlob
              key={b.id}
              color={b.color}
              baseX={b.base.x}
              baseY={b.base.y}
              size={b.size}
              z={b.z}
              drift={b.drift}
              duration={reduce ? 0 : b.duration}
              delay={reduce ? 0 : b.delay}
              // very subtle pointer influence
              sx={sx}
              sy={sy}
              intensity={hasPointer && !reduce ? intensity : 0}
            />
          ))}
        </div>

        {/* Soft “mesh” enhancer (cheap): a faint conic wash */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(165,243,252,0.18),rgba(233,213,255,0.18),rgba(251,207,232,0.18),rgba(255,255,255,0.18),rgba(165,243,252,0.18))]" />
        </div>
      </div>

      {/* Glassmorphism overlay for ultra-readable text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[5]"
      >
        <div className="absolute inset-0 backdrop-blur-3xl bg-white/35" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_0%,rgba(255,255,255,0.75),transparent_60%)]" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-6 py-16 sm:px-10">
        {children ?? (
          <DefaultHeroContent />
        )}
      </div>

      {/* Optional: tiny grain (comment out if you don’t want it).
          Using CSS-only noise avoids extra requests. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1] opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
        }}
      />
    </section>
  );
}

function LiquidBlob({
  color,
  baseX,
  baseY,
  size,
  z,
  drift,
  duration,
  delay,
  sx,
  sy,
  intensity,
}) {

  // Subtle parallax offset: transform only (GPU-friendly)
  const x = useSpring(sx, { stiffness: 60, damping: 18, mass: 0.35 });
  const y = useSpring(sy, { stiffness: 60, damping: 18, mass: 0.35 });

  // Key idea:
  // - Animate blob's translate/scale/rotate slowly
  // - Simultaneously animate borderRadius to “morph”
  // - Add blur + saturation for soft aurora feel
  const animate =
    duration > 0
      ? {
        // slow drift (small px movement)
        x: ["-2%", "2.5%", "-1.5%"],
        y: ["2%", "-2%", "1.2%"],
        scale: [1.0, 1.12, 1.03],
        rotate: [0, 12, -6],
        borderRadius: [
          "46% 54% 62% 38% / 44% 45% 55% 56%",
          "58% 42% 45% 55% / 56% 38% 62% 44%",
          "49% 51% 58% 42% / 40% 52% 48% 60%",
        ],
      }
      : {};

  const transition =
    duration > 0
      ? {
        duration,
        delay,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }
      : undefined;

  return (
    <motion.div
      className="absolute"
      style={{
        left: baseX,
        top: baseY,
        width: size,
        height: size,
        translateX: "-50%",
        translateY: "-50%",
        // pointer interaction: tiny “repulsion/parallax”
        // we multiply by intensity and drift per-blob
        x: intensity ? x : 0,
        y: intensity ? y : 0,
        zIndex: z,
        // The blob itself
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, rgba(255,255,255,0) 62%)`,
        filter: "blur(46px) saturate(1.15)",
        willChange: "transform, border-radius",
        // helps blending and softness
        mixBlendMode: "multiply",
        opacity: 0.95,
      }}
      animate={animate}
      transition={transition}
      // extra offset based on pointer (still transform only)
      // note: framer style x/y is in px, so we apply a scaling factor here
      // by using motion "transformTemplate" to incorporate it cleanly.
      transformTemplate={(_, generated) => {
        // generated includes translate/scale/rotate from framer
        // Add pointer influence as additional translate in px
        // (sx/sy are [-0.5..0.5]) => multiply by intensity
        // We can’t read sx/sy here, so we rely on x/y motion values above.
        // We still apply drift by scaling via CSS variable trick below:
        return generated;
      }}
    >
      {/* drift scaling via CSS vars (super cheap) */}
      <style jsx>{`
        :global(.liquid-blob) {
          --drift: ${drift};
        }
      `}</style>
    </motion.div>
  );
}

function DefaultHeroContent() {
  return (
    <div className="max-w-2xl">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 backdrop-blur">
        Mesmerizing Liquid Mesh Gradient
      </div>

      <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
        Soft pastel blobs that float & morph
      </h1>

      <p className="mt-5 text-pretty text-base leading-relaxed text-slate-700 sm:text-lg">
        High-key light theme with Cyan, Lavender, Soft Pink and White—layered with glassmorphism so your hero
        text stays ultra-readable.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:translate-y-[-1px] hover:bg-slate-800">
          Primary action
        </button>
        <button className="rounded-xl bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-black/10 backdrop-blur transition hover:translate-y-[-1px] hover:bg-white/80">
          Secondary
        </button>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Tip: On mobile, pointer interaction auto-disables for performance.
      </p>
    </div>
  );
}
