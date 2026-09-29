"use client";

// GardenPlate — the one object of the voter-garden family, drawn like a
// botanical plate: ink lines on a pale sheet, a thin wash on the leaves.
//
// It shows the election's CONDITION, not a statistic:
//   before  bare soil, the seeds waiting under it
//   open    sprouts come up as people vote (more turnout → more of the plate
//           grows); flowers stay in bud
//   paused  as open, faded — nothing is growing right now
//   ended   everything up, the flowers open in faculty plum
//
// It grows from the TOTAL turnout only. There is no plot, colour or plant per
// party, so nothing here can hint at who is ahead (rule 7).
//
// Deterministic: the layout comes from a seeded PRNG, so the same garden draws
// on the server, on every reload and in every screenshot.

import { useMemo } from "react";
import { motion } from "framer-motion"; // Motion for React

const W = 1200;
const H = 440;
const G = 372; // ground line
const EASE = [0.16, 1, 0.3, 1];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n) => Math.round(n * 10) / 10;

// a point along the quadratic stem at t (0 = ground, 1 = tip)
function onStem(p, t) {
  const u = 1 - t;
  return [
    u * u * p.x + 2 * u * t * p.cx + t * t * p.tx,
    u * u * G + 2 * u * t * p.cy + t * t * p.ty,
  ];
}

function leaf(px, py, dir, s, lift = 0.55) {
  const a = [px + dir * s * 0.55, py - s * lift];
  const b = [px + dir * s, py - s * 0.18];
  const c = [px + dir * s * 0.5, py + s * 0.12];
  return {
    blade: `M${f1(px)} ${f1(py)} Q${f1(a[0])} ${f1(a[1])} ${f1(b[0])} ${f1(b[1])} Q${f1(c[0])} ${f1(c[1])} ${f1(px)} ${f1(py)}Z`,
    rib: `M${f1(px)} ${f1(py)} L${f1(px + dir * s * 0.82)} ${f1(py - s * 0.2)}`,
  };
}

// one plant: its line paths (drawn), leaf blades (washed) and, for flowers,
// the head. Kinds are picked by the PRNG, never by data.
function plant(i, x, r, scale = 1) {
  const roll = r();
  const kind = roll < 0.22 ? "grass" : roll < 0.52 ? "sprout" : roll < 0.74 ? "fern" : "flower";
  const h = scale * (kind === "grass" ? 50 + r() * 50 : kind === "flower" ? 170 + r() * 110 : 110 + r() * 120);
  const lean = (r() - 0.5) * 36;
  const p = { x, cx: x + lean * 0.2 + (r() - 0.5) * 20, cy: G - h * 0.55, tx: x + lean, ty: G - h };
  const lines = [];
  const blades = [];

  if (kind === "grass") {
    const n = 3 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const dx = (k - (n - 1) / 2) * (10 + r() * 8) + (r() - 0.5) * 10;
      const hh = h * (0.6 + r() * 0.5);
      lines.push(`M${f1(x + dx * 0.2)} ${G} Q${f1(x + dx * 0.35)} ${f1(G - hh * 0.6)} ${f1(x + dx)} ${f1(G - hh)}`);
    }
    return { i, kind, x, lines, blades, head: null, tip: [p.tx, p.ty] };
  }

  lines.push(`M${f1(p.x)} ${G} Q${f1(p.cx)} ${f1(p.cy)} ${f1(p.tx)} ${f1(p.ty)}`);

  if (kind === "fern") {
    const pairs = 6 + Math.floor(r() * 3);
    for (let k = 1; k <= pairs; k++) {
      const t = 0.18 + (k / (pairs + 1)) * 0.78;
      const [px, py] = onStem(p, t);
      const s = (1 - t * 0.7) * (22 + r() * 8);
      for (const dir of [-1, 1]) {
        const l = leaf(px, py, dir, s, 0.35);
        blades.push(l.blade);
      }
    }
  } else {
    const n = kind === "flower" ? 2 : 2 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const t = 0.25 + k * (0.5 / n) + r() * 0.08;
      const [px, py] = onStem(p, t);
      const l = leaf(px, py, k % 2 ? 1 : -1, 26 + r() * 22);
      blades.push(l.blade);
      lines.push(l.rib);
    }
  }
  const head = kind === "flower" ? { cx: p.tx, cy: p.ty, r: 13 + r() * 6, turn: r() * 72 } : null;
  return { i, kind, x, lines, blades, head, tip: [p.tx, p.ty] };
}

function buildGarden(seed) {
  const r = rng(seed);
  const plants = [];
  // two rows: a pale back row gives the plate depth, the front row carries it.
  // `order` is when a plant comes up as turnout rises — random, so growth fills
  // the whole plate rather than sweeping left to right.
  for (const [row, slots, scale] of [["back", 30, 0.72], ["front", 34, 1.12]]) {
    for (let k = 0; k < slots; k++) {
      const x = 30 + (k + 0.5) * ((W - 60) / slots) + (r() - 0.5) * 28;
      const pl = plant(plants.length, x, r, scale);
      pl.row = row;
      pl.order = r();
      plants.push(pl);
    }
  }
  // soil: a hand-drawn line and stippling under it
  const soil = [];
  let d = `M0 ${G}`;
  for (let x = 0; x <= W; x += 60) d += ` Q${x + 30} ${f1(G + (r() - 0.5) * 6)} ${x + 60} ${G}`;
  const dots = [];
  for (let k = 0; k < 170; k++) dots.push([f1(r() * W), f1(G + 8 + Math.pow(r(), 1.6) * 52), f1(0.7 + r() * 1.1)]);
  soil.push(d);
  return { plants, soil, dots };
}

/**
 * @param {"before"|"open"|"paused"|"ended"} phase
 * @param {number} turnout 0–1, total turnout only
 * @param {boolean} still  no entrance (editor, reduced motion)
 */
export default function GardenPlate({ phase = "open", turnout = 0, still = false, seed = 50 }) {
  const garden = useMemo(() => buildGarden(seed), [seed]);
  // how much of the plate is up: a garden, not a meter — even a quiet morning
  // shows a few sprouts, and it only fills completely when the box closes
  const growth = phase === "before" ? 0 : phase === "ended" ? 1 : 0.22 + 0.66 * Math.min(1, Math.max(0, turnout));
  const bloom = phase === "ended";

  const draw = (delay, dur = 1.1) => (still
    ? { initial: false }
    : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { pathLength: { duration: dur, ease: EASE, delay }, opacity: { duration: 0.2, delay } } });
  const wash = (delay) => (still
    ? { initial: false }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.8, delay } });

  return (
    <svg className={`gp gp--${phase}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" role="img" aria-hidden>
      <g className="gp__soil">
        <path d={garden.soil[0]} className="gp__ground" />
        {garden.dots.map(([x, y, rr], k) => <circle key={k} cx={x} cy={y} r={rr} className="gp__dot" />)}
      </g>

      {garden.plants.map((p) => {
        const up = p.order < growth;
        if (!up) {
          // not up yet: the plant is only pencilled in on the plate — every vote
          // inks one — and, in the front row, its seed waits under the soil
          return (
            <g key={p.i} className={`gp__sketch gp__plant--${p.row}`}>
              {p.lines.map((l, k) => <path key={`l${k}`} d={l} />)}
              {p.blades.map((b, k) => <path key={`o${k}`} d={b} />)}
              {p.row === "front" && (
                <ellipse cx={p.x} cy={G + 16 + (p.order * 20) % 18} rx="5.5" ry="3.4"
                  transform={`rotate(${Math.round(p.order * 90 - 45)} ${p.x} ${G + 20})`} className="gp__seed" />
              )}
            </g>
          );
        }
        // plants come up in turnout order, left edge first within a beat
        const delay = still ? 0 : 0.35 + p.order * 1.6 + (p.x / W) * 0.25;
        return (
          <g key={p.i} className={`gp__plant gp__plant--${p.kind} gp__plant--${p.row}`}>
            {p.blades.map((b, k) => <motion.path key={`b${k}`} d={b} className="gp__blade" {...wash(delay + 0.6)} />)}
            {p.lines.map((l, k) => <motion.path key={`l${k}`} d={l} className="gp__line" {...draw(delay + k * 0.06)} />)}
            {p.blades.map((b, k) => <motion.path key={`o${k}`} d={b} className="gp__line gp__line--leaf" {...draw(delay + 0.3 + k * 0.05, 0.8)} />)}
            {p.head && (bloom ? (
              <motion.g className="gp__bloom" {...(still ? { initial: false } : { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.7, ease: EASE, delay: delay + 1.1 } })}
                style={{ transformOrigin: `${p.head.cx}px ${p.head.cy}px`, transformBox: "view-box" }}>
                {[0, 1, 2, 3, 4].map((k) => (
                  <ellipse key={k} cx={p.head.cx} cy={p.head.cy - p.head.r * 0.62} rx={p.head.r * 0.42} ry={p.head.r * 0.66}
                    transform={`rotate(${p.head.turn + k * 72} ${p.head.cx} ${p.head.cy})`} className="gp__petal" />
                ))}
                <circle cx={p.head.cx} cy={p.head.cy} r={p.head.r * 0.26} className="gp__eye" />
              </motion.g>
            ) : (
              <motion.path className="gp__bud"
                d={`M${f1(p.head.cx)} ${f1(p.head.cy + 2)} Q${f1(p.head.cx - 7)} ${f1(p.head.cy - 9)} ${f1(p.head.cx)} ${f1(p.head.cy - 19)} Q${f1(p.head.cx + 7)} ${f1(p.head.cy - 9)} ${f1(p.head.cx)} ${f1(p.head.cy + 2)}Z`}
                {...draw(delay + 0.9, 0.6)} />
            ))}
          </g>
        );
      })}

      <style jsx global>{`
        /* the drawing stays inside the plate's frame, cropped to its middle on phones */
        .gp { display: block; width: 100%; height: 100%; overflow: hidden; }
        .gp__ground { fill: none; stroke: var(--vg-ink); stroke-width: 1.6; stroke-linecap: round; }
        .gp__dot { fill: var(--vg-ink); opacity: .22; }
        .gp__seed { fill: color-mix(in srgb, var(--vg-leaf) 18%, transparent); stroke: var(--vg-ink); stroke-width: 1.2; }
        .gp__line { fill: none; stroke: var(--vg-ink); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
        .gp__line--leaf { stroke-width: 1.5; }
        .gp__blade { fill: color-mix(in srgb, var(--vg-leaf) 34%, transparent); stroke: none; }
        /* pencilled in, waiting to be inked by a vote */
        .gp__sketch path { fill: none; stroke: var(--vg-muted); stroke-width: 1; stroke-dasharray: 2 4; stroke-linecap: round; opacity: .38; }
        .gp__sketch.gp__plant--back path { opacity: .22; }
        /* the back row: the same drawing, further away */
        .gp__plant--back { opacity: .42; }
        .gp__plant--back .gp__line { stroke-width: 1.5; }
        .gp__bud { fill: color-mix(in srgb, var(--vg-leaf) 30%, transparent); stroke: var(--vg-ink); stroke-width: 1.3; }
        .gp__petal { fill: color-mix(in srgb, var(--vg-bloom) 78%, white); stroke: var(--vg-bloom); stroke-width: 1.2; }
        .gp__eye { fill: #F4D35E; stroke: var(--vg-ink); stroke-width: 1; }
        /* paused: nothing grows right now — the plate fades, it does not vanish */
        .gp--paused .gp__plant { opacity: .45; }
        .gp--paused .gp__line { stroke-dasharray: 3 5; }
      `}</style>
    </svg>
  );
}
