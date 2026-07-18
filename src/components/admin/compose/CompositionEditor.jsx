"use client";

// CompositionEditor — the Layer-2 visual composition surface (Canva-like, v1).
//
// Standalone/sandbox editor for a composition DESCRIPTOR (the data model built in
// elements/_composer). Three panes: palette + layers tree (left) · live canvas
// (center, <Composition editorMode>) · inspector (right). Selecting a node (canvas
// click via data-node-path delegation, or a layers-tree row) lets you edit its
// props live → the descriptor updates → the canvas re-renders.
//
// Built additive — does NOT touch PageDesignTab / the named-slot editor. Proves the
// 3-layer model is manipulable; integration into the page editor comes later.

import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { Layers, Square, Type, MousePointerClick, Plus, Minus, Trash2, ChevronUp, ChevronDown, Save, Package, X, GripVertical, Undo2, Redo2, Copy } from "lucide-react";
import { loadComponents, saveComponent, removeComponent } from "./componentStore";
import { PRESETS } from "./presets";
import Composition, {
  getNodeAtPath, updateNodeAtPath, ROOT_PATH,
  parentPath, indexInParent, insertChild, removeAtPath, moveAtPath,
  groupSiblings, ungroupAtPath,
} from "../../elements/_composer/Composition";
import { ATOMS, variantsOf } from "../../elements/_composer/registry";
import { TextInput, ColorPickerInput, PxSlider, WeightToggle, AlignSelect, SelectInput } from "../editor/controls/SharedInputs";

const TEXT_ATOMS = new Set(["text-title", "text-label", "text-body", "text-meta", "text-stat", "text-plain"]);

const ATOM_TYPES = Object.keys(ATOMS);

// path = "0/3/1" → [0,3,1]. Compare DESCENDING (deepest / highest-index first) so a
// batch of removals can run sequentially without invalidating the remaining paths.
const pathSegs = (p) => p.split("/").map(Number);
const cmpPathDesc = (a, b) => {
  const A = pathSegs(a), B = pathSegs(b), n = Math.max(A.length, B.length);
  for (let i = 0; i < n; i++) { const x = A[i] ?? -1, y = B[i] ?? -1; if (x !== y) return y - x; }
  return 0;
};
// selection outline CSS for one path (frame outlines itself; atom outlines its child)
const outlineCss = (p, color = "#8A2680", w = "1.5px") =>
  `[data-node-path="${p}"]:not(.cmp-node--atom){ outline:${w} solid ${color}; outline-offset:1px; border-radius:1px; }
   .cmp-node--atom[data-node-path="${p}"] > *{ outline:${w} solid ${color}; outline-offset:1px; }`;

// default node when an atom is inserted from the palette
const ATOM_DEFAULTS = {
  image: { props: { empty: true }, style: { width: 80, height: 80 } },
  badge: { props: { children: "1" } },
  "text-title": { props: { children: "หัวข้อ", as: "h3" } },
  "text-label": { props: { children: "LABEL" } },
  "text-body": { props: { children: "ข้อความเนื้อหา" } },
  "text-meta": { props: { children: "META" } },
  "text-stat": { props: { children: "100" } },
  "text-plain": { props: { children: "ข้อความ" } },
  chip: { props: { children: "แท็ก", tone: "lime" } },
  "button-primary": { props: { children: "ปุ่ม", as: "span" } },
};
const makeAtom = (type) => ({ kind: "atom", type, ...(ATOM_DEFAULTS[type] || { props: {} }) });

// live mini-preview of an atom (for the palette + drag ghost)
function AtomPreview({ type }) {
  const def = ATOM_DEFAULTS[type] || { props: {} };
  return <Composition node={{ kind: "atom", type, props: def.props }} />;
}

// fit-to-box thumbnail of a whole descriptor (for preset / saved-component cards).
// Renders the composition at its natural layout width (capped at maxDesign so long
// text wraps like the real component), measures it, then scales to fill the box —
// so small atoms read big and big cards still fit. Neutral bg makes content pop.
function NodePreview({ node, pad = 11, maxDesign = 340, minH = 74, maxH = 150 }) {
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const [t, setT] = useState({ scale: 1, h: 96, ready: false });

  useLayoutEffect(() => {
    const box = boxRef.current, content = contentRef.current;
    if (!box || !content) return;
    const measure = () => {
      const innerW = box.clientWidth - pad * 2;            // box width is fixed by the panel
      const cw = content.offsetWidth, ch = content.offsetHeight; // layout size (ignores transform)
      if (!cw || !ch || innerW <= 0) return;
      // pick a box height that lets the content fill the width, clamped to a sane range,
      // so a tall card (CTA) gets a tall thumbnail instead of being squashed unreadable.
      const h = Math.max(minH, Math.min(maxH, ch * (innerW / cw) + pad * 2));
      const innerH = h - pad * 2;
      setT({ scale: Math.min(innerW / cw, innerH / ch, 1.6), h, ready: true });
    };
    measure();
    const ro = new ResizeObserver(measure); // re-fit once Thai fonts/images settle
    ro.observe(content); ro.observe(box);
    return () => ro.disconnect();
  }, [node, pad, minH, maxH]);

  return (
    <div ref={boxRef} className="relative overflow-hidden grid place-items-center bg-slate-50 fms-app pointer-events-none" style={{ height: t.h }}>
      <div ref={contentRef} style={{ width: "fit-content", maxWidth: maxDesign, transform: `scale(${t.scale})`, transformOrigin: "center", opacity: t.ready ? 1 : 0, transition: "opacity .14s ease" }}>
        <Composition node={node} />
      </div>
    </div>
  );
}

// short human label for a node row in the layers tree
function nodeLabel(node) {
  if (!node) return "—";
  if (node.kind === "atom") {
    const txt = typeof node.props?.children === "string" ? `“${node.props.children.slice(0, 18)}”` : "";
    return `${node.type} ${txt}`.trim();
  }
  if (node.kind === "node") return "node (raw)";
  return node.className ? `frame .${String(node.className).split(" ")[0]}` : "frame";
}

// recursive layers-tree rows (multi-select checkbox + draggable to move)
function TreeRows({ node, path, depth, selectedPath, onSelect, checked, onToggleCheck, onDragStartRow }) {
  if (!node) return null;
  const isSel = selectedPath === path;
  const isFrame = node.kind === "frame";
  const isRoot = path === ROOT_PATH;
  return (
    <>
      <div className={`flex items-center rounded-md transition-colors ${isSel ? "bg-[#8A2680]/[0.08]" : "hover:bg-slate-100"}`} style={{ paddingLeft: 4 + depth * 14 }}
        draggable={!isRoot} onDragStart={!isRoot ? onDragStartRow(path) : undefined}>
        {!isRoot && (
          <input type="checkbox" checked={checked.includes(path)} onChange={() => onToggleCheck(path)}
            onClick={(e) => e.stopPropagation()} className="ml-1 w-3 h-3 accent-[#8A2680] shrink-0 opacity-60 hover:opacity-100" title="เลือกเพื่อจัดกลุ่ม" />
        )}
        <button type="button" onClick={() => onSelect(path)}
          className={`flex-1 flex items-center gap-1.5 px-2 py-[5px] text-left text-[11px] ${isSel ? "text-[#8A2680] font-medium" : "text-slate-600"} ${!isRoot ? "cursor-grab active:cursor-grabbing" : ""}`}>
          {isFrame ? <Square className="w-3 h-3 shrink-0 opacity-60" /> : node.kind === "atom" ? <Type className="w-3 h-3 shrink-0 opacity-60" /> : <MousePointerClick className="w-3 h-3 shrink-0 opacity-60" />}
          <span className="truncate">{nodeLabel(node)}</span>
        </button>
      </div>
      {isFrame && (node.children || []).map((c, i) => (
        <TreeRows key={i} node={c} path={`${path}/${i}`} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} checked={checked} onToggleCheck={onToggleCheck} onDragStartRow={onDragStartRow} />
      ))}
    </>
  );
}

export default function CompositionEditor({ initialNode }) {
  const [node, setNode] = useState(initialNode);
  const [selectedPath, setSelectedPath] = useState(null);
  const [checked, setChecked] = useState([]); // paths multi-selected for grouping

  const toggleCheck = useCallback((path) => {
    setChecked((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
  }, []);

  // group is allowed only when ≥2 nodes share the same parent frame
  const canGroup = checked.length >= 2 && checked.every((p) => parentPath(p) === parentPath(checked[0]));

  // ── history (undo / redo) ── auto-captures: a 400ms debounce coalesces slider /
  // resize / typing bursts into ONE entry; discrete clicks each get their own.
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const prevStable = useRef(initialNode);
  const histTimer = useRef(null);
  const skipHist = useRef(false);
  useEffect(() => {
    if (skipHist.current) { skipHist.current = false; prevStable.current = node; return; }
    clearTimeout(histTimer.current);
    histTimer.current = setTimeout(() => {
      if (prevStable.current !== node) {
        const snap = prevStable.current;
        prevStable.current = node;
        setPast((p) => [...p.slice(-60), snap]);
        setFuture([]);
      }
    }, 400);
    return () => clearTimeout(histTimer.current);
  }, [node]);
  const undo = useCallback(() => {
    if (!past.length) return;
    skipHist.current = true;
    setFuture((f) => [node, ...f]);
    setNode(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }, [past, node]);
  const redo = useCallback(() => {
    if (!future.length) return;
    skipHist.current = true;
    setPast((p) => [...p, node]);
    setNode(future[0]);
    setFuture((f) => f.slice(1));
  }, [future, node]);

  const selected = useMemo(() => (selectedPath ? getNodeAtPath(node, selectedPath) : null), [node, selectedPath]);

  const suppressClick = useRef(false); // set after a marquee drag so the trailing click doesn't re-select
  const onCanvasClick = useCallback((e) => {
    if (suppressClick.current) { suppressClick.current = false; e.preventDefault(); e.stopPropagation(); return; }
    const hit = e.target.closest?.("[data-node-path]");
    if (hit) {
      e.preventDefault();
      setSelectedPath(hit.getAttribute("data-node-path"));
      setChecked([]); // single-click = single select; clears any marquee/checkbox multi-select
      setEditing(false);
    }
  }, []);

  // double-click a text atom → edit its text inline (overlay textarea)
  const onCanvasDblClick = useCallback((e) => {
    const hit = e.target.closest?.("[data-node-path]");
    if (!hit) return;
    const p = hit.getAttribute("data-node-path");
    const n = getNodeAtPath(node, p);
    if (n?.kind === "atom" && TEXT_ATOMS.has(n.type) && typeof n.props?.children === "string") {
      e.preventDefault();
      setSelectedPath(p);
      setEditing(true);
    }
  }, [node]);

  const setProp = useCallback((key, value) => {
    if (!selectedPath) return;
    setNode((prev) => updateNodeAtPath(prev, selectedPath, (n) => ({ ...n, props: { ...(n.props || {}), [key]: value } })));
  }, [selectedPath]);

  // switch the selected atom's variant (gumroad / soft / …)
  const setVariant = useCallback((variant) => {
    if (!selectedPath) return;
    setNode((prev) => updateNodeAtPath(prev, selectedPath, (n) => ({ ...n, variant })));
  }, [selectedPath]);

  // write to the selected node's inline style (overrides the atom's base CSS)
  const setStyle = useCallback((key, value) => {
    if (!selectedPath) return;
    setNode((prev) => updateNodeAtPath(prev, selectedPath, (n) => ({ ...n, style: { ...(n.style || {}), [key]: value } })));
  }, [selectedPath]);

  // write to the selected frame's layout (compiles to responsive flex/grid)
  const setLayout = useCallback((key, value) => {
    if (!selectedPath) return;
    setNode((prev) => updateNodeAtPath(prev, selectedPath, (n) => ({ ...n, layout: { ...(n.layout || {}), [key]: value } })));
  }, [selectedPath]);

  // insert an atom: into the selected frame, or after the selected atom, else root.
  const insertAtom = useCallback((type) => {
    let framePath = ROOT_PATH, index = null;
    if (selectedPath) {
      const sel = getNodeAtPath(node, selectedPath);
      if (sel?.kind === "frame") framePath = selectedPath;
      else { framePath = parentPath(selectedPath) || ROOT_PATH; index = indexInParent(selectedPath) + 1; }
    }
    const { root, path } = insertChild(node, framePath, makeAtom(type), index);
    setNode(root);
    setSelectedPath(path);
  }, [node, selectedPath]);

  const deleteSelected = useCallback(() => {
    // batch delete the marquee/checkbox selection, deepest-first so paths stay valid
    if (checked.length) {
      const order = [...checked].filter((p) => p !== ROOT_PATH).sort(cmpPathDesc);
      let root = node;
      for (const p of order) root = removeAtPath(root, p);
      setNode(root); setChecked([]); setSelectedPath(null); return;
    }
    if (!selectedPath || selectedPath === ROOT_PATH) return;
    setNode(removeAtPath(node, selectedPath));
    setSelectedPath(null);
  }, [node, selectedPath, checked]);

  const moveSelected = useCallback((dir) => {
    if (!selectedPath || selectedPath === ROOT_PATH) return;
    const { root, path } = moveAtPath(node, selectedPath, dir);
    setNode(root);
    setSelectedPath(path);
  }, [node, selectedPath]);

  const groupChecked = useCallback(() => {
    if (!canGroup) return;
    const pp = parentPath(checked[0]);
    const indices = checked.map(indexInParent);
    const { root, path } = groupSiblings(node, pp, indices);
    setNode(root);
    setChecked([]);
    setSelectedPath(path);
  }, [node, checked, canGroup]);

  const ungroupSelected = useCallback(() => {
    if (!selectedPath || selectedPath === ROOT_PATH) return;
    const sel = getNodeAtPath(node, selectedPath);
    if (sel?.kind !== "frame") return;
    setNode(ungroupAtPath(node, selectedPath));
    setSelectedPath(null);
    setChecked([]);
  }, [node, selectedPath]);

  const duplicateSelected = useCallback(() => {
    if (!selectedPath || selectedPath === ROOT_PATH) return;
    const src = getNodeAtPath(node, selectedPath);
    if (!src) return;
    const clone = JSON.parse(JSON.stringify(src));
    const fp = parentPath(selectedPath) || ROOT_PATH;
    const { root, path } = insertChild(node, fp, clone, indexInParent(selectedPath) + 1);
    setNode(root);
    setSelectedPath(path);
  }, [node, selectedPath]);

  // ── copy / paste (Ctrl+C / Ctrl+V) ── clipboard holds deep clones of the selection
  const clipboard = useRef(null);
  const copySelection = useCallback(() => {
    const paths = checked.length ? checked : (selectedPath && selectedPath !== ROOT_PATH ? [selectedPath] : []);
    const clones = paths.map((p) => getNodeAtPath(node, p)).filter(Boolean).map((n) => JSON.parse(JSON.stringify(n)));
    if (clones.length) clipboard.current = clones;
  }, [node, checked, selectedPath]);

  const pasteClipboard = useCallback(() => {
    const clones = clipboard.current;
    if (!clones?.length) return;
    let framePath = ROOT_PATH, index = null;
    if (selectedPath) {
      const sel = getNodeAtPath(node, selectedPath);
      if (sel?.kind === "frame") framePath = selectedPath;             // into the selected frame
      else { framePath = parentPath(selectedPath) || ROOT_PATH; index = indexInParent(selectedPath) + 1; } // after the selected atom
    }
    let root = node, lastPath = null, idx = index;
    for (const c of clones) {
      const res = insertChild(root, framePath, JSON.parse(JSON.stringify(c)), idx);
      root = res.root; lastPath = res.path;
      if (idx != null) idx += 1; // keep the pasted block in order
    }
    setNode(root); setChecked([]); setSelectedPath(lastPath);
  }, [node, selectedPath]);

  // arrow keys nudge the selected node's order within its frame (←/↑ earlier, →/↓ later)
  const nudge = useCallback((dir) => { moveSelected(dir); }, [moveSelected]);

  // keyboard shortcuts (Figma-grade muscle memory)
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "z" || e.key === "Z")) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && (e.key === "y" || e.key === "Y")) { e.preventDefault(); redo(); return; }
      if (e.key === "Escape") { setEditing(false); setSelectedPath(null); setChecked([]); return; }
      if (typing) return;
      if (mod && (e.key === "c" || e.key === "C")) { e.preventDefault(); copySelection(); return; }
      if (mod && (e.key === "v" || e.key === "V")) { e.preventDefault(); pasteClipboard(); return; }
      if (mod && (e.key === "d" || e.key === "D")) { e.preventDefault(); duplicateSelected(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); return; }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { if (selectedPath && selectedPath !== ROOT_PATH) { e.preventDefault(); nudge(-1); } return; }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { if (selectedPath && selectedPath !== ROOT_PATH) { e.preventDefault(); nudge(1); } return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, duplicateSelected, deleteSelected, copySelection, pasteClipboard, nudge, selectedPath]);

  // ── saved-component library (Step 7) ──
  const [saved, setSaved] = useState([]);
  useEffect(() => { setSaved(loadComponents()); }, []);

  // save the selected frame (or the whole composition) as a reusable component.
  const saveAsComponent = useCallback(() => {
    const target = (selectedPath && getNodeAtPath(node, selectedPath)?.kind === "frame") ? getNodeAtPath(node, selectedPath) : node;
    const name = (typeof window !== "undefined" && window.prompt("ตั้งชื่อคอมโพเนนต์", "คอมโพเนนต์ของฉัน")) || null;
    if (name === null) return; // cancelled
    try {
      setSaved(saveComponent(name, target));
    } catch {
      if (typeof window !== "undefined") window.alert("คอมโพเนนต์นี้มีไอคอน/ชิ้นพิเศษที่ยังบันทึกไม่ได้ใน v1");
    }
  }, [node, selectedPath]);

  // insert a saved component (deep clone) into the root frame.
  const insertSaved = useCallback((entry) => {
    const clone = JSON.parse(JSON.stringify(entry.node));
    const { root, path } = insertChild(node, ROOT_PATH, clone);
    setNode(root);
    setSelectedPath(path);
  }, [node]);

  const deleteSaved = useCallback((id) => { setSaved(removeComponent(id)); }, []);

  // ── drag & drop (Hybrid C: snaps to valid slots, never free x/y) ──
  const canvasRef = useRef(null);
  const dragPayload = useRef(null);          // { kind:'new', type } | { kind:'move', path }
  const [dropHint, setDropHint] = useState(null); // { framePath, index, line:{top,left,width} }
  const [selRect, setSelRect] = useState(null);    // selected node's box (for the drag handle)
  const [editing, setEditing] = useState(false);   // inline text edit active
  const [hoveredPath, setHoveredPath] = useState(null); // canvas hover highlight
  const [marquee, setMarquee] = useState(null);    // rubber-band rect {left,top,w,h} while dragging
  const [zoom, setZoom] = useState(1);             // canvas zoom (Ctrl+wheel)
  const [pan, setPan] = useState({ x: 0, y: 0 });  // canvas pan (Space+drag)
  const [panMode, setPanMode] = useState(false);   // Space held → pan cursor
  const spaceDown = useRef(false);

  const onCanvasMove = useCallback((e) => {
    const hit = e.target.closest?.("[data-node-path]");
    const p = hit ? hit.getAttribute("data-node-path") : null;
    setHoveredPath((prev) => (prev === p ? prev : p));
  }, []);

  // ── marquee (rubber-band) select ── start ONLY on the empty canvas (target IS the
  // canvas div, never a node / handle / overlay). Selects nodes FULLY enclosed by the
  // band, then drops wrapping ancestors so you get the items (siblings → groupable).
  const onCanvasMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (spaceDown.current) { // Space held → pan the canvas (works anywhere, even over nodes)
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, p0 = pan;
      const onMove = (ev) => setPan({ x: p0.x + (ev.clientX - sx), y: p0.y + (ev.clientY - sy) });
      const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
      window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
      return;
    }
    if (e.target !== canvasRef.current) return;
    const c = canvasRef.current;
    const cr = c.getBoundingClientRect();
    const x0 = e.clientX - cr.left, y0 = e.clientY - cr.top;
    setSelectedPath(null); setEditing(false);
    const onMove = (ev) => {
      const x1 = ev.clientX - cr.left, y1 = ev.clientY - cr.top;
      setMarquee({ left: Math.min(x0, x1), top: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) });
    };
    const onUp = (ev) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setMarquee(null);
      const x1 = ev.clientX - cr.left, y1 = ev.clientY - cr.top;
      if (Math.abs(x1 - x0) < 5 && Math.abs(y1 - y0) < 5) { setChecked([]); return; } // a click = deselect
      suppressClick.current = true; // it was a drag → swallow the trailing click
      const band = { left: Math.min(x0, x1), top: Math.min(y0, y1), right: Math.max(x0, x1), bottom: Math.max(y0, y1) };
      const enclosed = [];
      for (const el of c.querySelectorAll("[data-node-path]")) {
        const p = el.getAttribute("data-node-path");
        if (p === ROOT_PATH) continue;
        const rectEl = el.classList.contains("cmp-node--atom") ? el.firstElementChild : el;
        if (!rectEl) continue;
        const b = rectEl.getBoundingClientRect();
        const nb = { left: b.left - cr.left, top: b.top - cr.top, right: b.right - cr.left, bottom: b.bottom - cr.top };
        if (nb.left >= band.left - 1 && nb.top >= band.top - 1 && nb.right <= band.right + 1 && nb.bottom <= band.bottom + 1) enclosed.push(p);
      }
      // keep leaves: drop any node that wraps another enclosed node (so chips, not their frame)
      const sel = enclosed.filter((p) => !enclosed.some((q) => q !== p && q.startsWith(`${p}/`)));
      setChecked(sel);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pan]);

  // Space held = pan mode (don't hijack typing); Ctrl/⌘+wheel = zoom (native listener so
  // we can preventDefault the browser page-zoom). Zoom clamps to a sane 25%–300%.
  useEffect(() => {
    const kd = (e) => {
      if (e.code !== "Space") return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault(); spaceDown.current = true; setPanMode(true);
    };
    const ku = (e) => { if (e.code === "Space") { spaceDown.current = false; setPanMode(false); } };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setZoom((z) => Math.min(3, Math.max(0.25, +(z - e.deltaY * 0.0016).toFixed(3))));
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, []);
  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // move an existing node to (framePath, index). guards against dropping into self.
  const moveNodeTo = useCallback((root, sourcePath, framePath, index) => {
    if (framePath === sourcePath || framePath.startsWith(`${sourcePath}/`)) return { root, path: sourcePath };
    const src = getNodeAtPath(root, sourcePath);
    if (!src) return { root, path: sourcePath };
    const afterRemove = removeAtPath(root, sourcePath);
    const sp = parentPath(sourcePath), si = indexInParent(sourcePath);
    let idx = index;
    if (sp === framePath && si < index) idx = index - 1; // removal shifted target left
    return insertChild(afterRemove, framePath, src, idx);
  }, []);

  // figure out the drop slot from the hovered DOM + mouse Y
  const computeDrop = useCallback((e) => {
    const container = canvasRef.current;
    if (!container) return null;
    const cRect = container.getBoundingClientRect();
    const el = e.target.closest?.("[data-node-path]");
    if (!el) {
      const len = (node.children || []).length;
      return { framePath: ROOT_PATH, index: len, line: { top: 12, left: 12, width: cRect.width - 24 } };
    }
    const path = el.getAttribute("data-node-path");
    const isAtom = el.classList.contains("cmp-node--atom");
    const rectEl = isAtom ? el.firstElementChild : el;
    if (!rectEl) return null;
    const r = rectEl.getBoundingClientRect();
    if (isAtom || path !== ROOT_PATH) {
      const before = e.clientY < r.top + r.height / 2;
      const framePath = parentPath(path) || ROOT_PATH;
      const index = indexInParent(path) + (before ? 0 : 1);
      const top = (before ? r.top : r.bottom) - cRect.top;
      return { framePath, index, line: { top, left: r.left - cRect.left, width: r.width } };
    }
    // hovering the root frame itself → append
    const len = (getNodeAtPath(node, path)?.children || []).length;
    return { framePath: path, index: len, line: { top: r.bottom - cRect.top - 8, left: r.left - cRect.left + 12, width: r.width - 24 } };
  }, [node]);

  const onDragOverCanvas = useCallback((e) => {
    if (!dragPayload.current) return;
    e.preventDefault();
    const hint = computeDrop(e);
    if (hint) setDropHint(hint);
  }, [computeDrop]);

  const onDropCanvas = useCallback((e) => {
    e.preventDefault();
    const payload = dragPayload.current;
    const hint = dropHint || computeDrop(e);
    dragPayload.current = null;
    setDropHint(null);
    if (!payload || !hint) return;
    if (payload.kind === "new") {
      const { root, path } = insertChild(node, hint.framePath, makeAtom(payload.type), hint.index);
      setNode(root); setSelectedPath(path);
    } else if (payload.kind === "move") {
      const { root, path } = moveNodeTo(node, payload.path, hint.framePath, hint.index);
      setNode(root); setSelectedPath(path);
    }
  }, [node, dropHint, computeDrop, moveNodeTo]);

  const startDragNew = useCallback((type) => (e) => { dragPayload.current = { kind: "new", type }; e.dataTransfer.effectAllowed = "copy"; }, []);
  const startDragMove = useCallback((path) => (e) => { dragPayload.current = { kind: "move", path }; e.dataTransfer.effectAllowed = "move"; }, []);

  // ── resize handles (Figma/Canva-style box resize, but responsive-safe) ──
  // Drag → sets width/height in px AND maxWidth:100% so the box can never overflow
  // its parent on mobile (snaps to flow, never a fixed canvas that breaks small screens).
  const resizeRef = useRef(null);
  const onResizeMove = useCallback((e) => {
    const rs = resizeRef.current;
    if (!rs) return;
    // screen deltas → design px (startW/H are screen-scaled rects, so divide both by zoom)
    const dx = (e.clientX - rs.startX) / rs.zoom, dy = (e.clientY - rs.startY) / rs.zoom;
    const patch = { maxWidth: "100%" };
    if (rs.dir.includes("e")) patch.width = `${Math.max(40, Math.round(rs.startW / rs.zoom + dx))}px`;
    if (rs.dir.includes("s")) patch.height = `${Math.max(24, Math.round(rs.startH / rs.zoom + dy))}px`;
    setNode((prev) => updateNodeAtPath(prev, rs.path, (n) => ({ ...n, style: { ...(n.style || {}), ...patch } })));
  }, []);
  const onResizeUp = useCallback(() => {
    resizeRef.current = null;
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", onResizeUp);
  }, [onResizeMove]);
  const startResize = useCallback((dir) => (e) => {
    e.preventDefault(); e.stopPropagation();
    const c = canvasRef.current;
    if (!c || !selectedPath) return;
    let el = null;
    try { el = c.querySelector(`[data-node-path="${CSS.escape(selectedPath)}"]`); } catch { el = null; }
    const rectEl = el?.classList?.contains("cmp-node--atom") ? el.firstElementChild : el;
    if (!rectEl) return;
    const r = rectEl.getBoundingClientRect();
    resizeRef.current = { dir, path: selectedPath, startX: e.clientX, startY: e.clientY, startW: r.width, startH: r.height, zoom };
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeUp);
  }, [selectedPath, onResizeMove, onResizeUp, zoom]);

  // measure the selected node's box so we can float a draggable handle over it
  useLayoutEffect(() => {
    const c = canvasRef.current;
    if (!selectedPath || selectedPath === ROOT_PATH || !c) { setSelRect(null); return; }
    let el = null;
    try { el = c.querySelector(`[data-node-path="${CSS.escape(selectedPath)}"]`); } catch { el = null; }
    const rectEl = el?.classList?.contains("cmp-node--atom") ? el.firstElementChild : el;
    if (!rectEl) { setSelRect(null); return; }
    const r = rectEl.getBoundingClientRect();
    const cr = c.getBoundingClientRect();
    setSelRect({ top: r.top - cr.top, left: r.left - cr.left, w: r.width, h: r.height });
  }, [selectedPath, node, zoom, pan]);

  // selection highlight: frame outlines itself; atom (contents span) outlines its child
  const selCss = selectedPath ? outlineCss(selectedPath) : "";
  // marquee/checkbox multi-selection — outline every node in the set
  const multiCss = checked.length ? checked.map((p) => outlineCss(p)).join("\n") : "";
  const hoverCss = (hoveredPath && hoveredPath !== selectedPath && !checked.includes(hoveredPath))
    ? outlineCss(hoveredPath, "rgba(138,38,128,.32)")
    : "";

  const canUndo = past.length > 0, canRedo = future.length > 0;
  const hasSel = selectedPath && selectedPath !== ROOT_PATH;
  const TBtn = ({ onClick, disabled, title, children }) => (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-[12px] font-medium transition-colors ${disabled ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"}`}>
      {children}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* TOOLBAR */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.05)] px-2 py-1.5">
        <TBtn onClick={undo} disabled={!canUndo} title="เลิกทำ (Ctrl+Z)"><Undo2 className="w-4 h-4" /></TBtn>
        <TBtn onClick={redo} disabled={!canRedo} title="ทำซ้ำ (Ctrl+Shift+Z)"><Redo2 className="w-4 h-4" /></TBtn>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <TBtn onClick={duplicateSelected} disabled={!hasSel} title="ทำสำเนา (Ctrl+D)"><Copy className="w-4 h-4" /> สำเนา</TBtn>
        <TBtn onClick={deleteSelected} disabled={!hasSel} title="ลบ (Delete)"><Trash2 className="w-4 h-4" /> ลบ</TBtn>
        <span className="flex-1" />
        <span className="text-[11px] text-slate-400 pr-2 hidden lg:inline">{hasSel ? `เลือก: ${selected?.kind === "atom" ? selected.type : "frame"}` : "ดับเบิลคลิกแก้ข้อความ · ลากคลุมเลือกหลายชิ้น"}</span>
        <div className="flex items-center gap-0.5 rounded-lg bg-slate-50 border border-slate-200/80 px-0.5">
          <TBtn onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))} title="ซูมออก"><Minus className="w-3.5 h-3.5" /></TBtn>
          <button type="button" onClick={resetView} title="รีเซ็ตมุมมอง (100%)" className="h-8 min-w-[46px] px-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md tabular-nums">{Math.round(zoom * 100)}%</button>
          <TBtn onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))} title="ซูมเข้า"><Plus className="w-3.5 h-3.5" /></TBtn>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-[560px]">
      {/* LEFT — palette + layers */}
      <div className="w-56 shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.05)] p-3">
          <h3 className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5"><Square className="w-3.5 h-3.5 text-slate-400" /> คลัง Atom ({ATOM_TYPES.length})</h3>
          <div className="grid grid-cols-2 gap-2 fms-app">
            {ATOM_TYPES.map((t) => (
              <button key={t} type="button" draggable onDragStart={startDragNew(t)} onClick={() => insertAtom(t)} title={`ลาก/คลิกเพื่อเพิ่ม ${t}`}
                className="group/atom flex flex-col items-stretch rounded-lg border border-slate-200 bg-white hover:border-[#8A2680] overflow-hidden cursor-grab active:cursor-grabbing transition-colors">
                <div className="h-12 grid place-items-center overflow-hidden px-1 pointer-events-none" style={{ "--pop": "#B6E6FF" }}>
                  <div style={{ transform: "scale(.62)", transformOrigin: "center" }}><AtomPreview type={t} /></div>
                </div>
                <span className="text-[9px] font-semibold text-slate-500 group-hover/atom:text-[#8A2680] bg-slate-50 group-hover/atom:bg-purple-50 px-1 py-0.5 truncate border-t border-slate-100">{t}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">ลาก preview ลง canvas (เห็นเส้นจุดวาง) หรือคลิกเพื่อเพิ่ม</p>
        </div>

        {/* PRESETS (built-in starter components) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.05)] p-3">
          <h3 className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-slate-400" /> สำเร็จรูป ({PRESETS.length})</h3>
          <div className="space-y-2">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => insertSaved(p)} title="หยิบมาวาง"
                className="group/p w-full text-left rounded-lg border border-slate-200/80 hover:border-[#8A2680] overflow-hidden transition-colors hover:shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
                <NodePreview node={p.node} />
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-slate-600 group-hover/p:text-[#8A2680] border-t border-slate-100">
                  <Plus className="w-2.5 h-2.5 opacity-60" /><span className="truncate">{p.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* MY COMPONENTS (saved Layer-2 library) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.05)] p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-slate-400" /> คอมโพเนนต์ของฉัน ({saved.length})</h3>
            <button type="button" onClick={saveAsComponent} title="บันทึกองค์ประกอบที่เลือก (หรือทั้งหมด) เป็นคอมโพเนนต์"
              className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#8A2680] text-white px-2 py-1 rounded-md"><Save className="w-2.5 h-2.5" /> บันทึก</button>
          </div>
          {saved.length === 0 ? (
            <p className="text-[10px] text-slate-400">ยังไม่มี — เลือก frame แล้วกด “บันทึก” เพื่อเก็บเข้าคลัง แล้วหยิบมาใช้ซ้ำได้</p>
          ) : (
            <div className="space-y-2">
              {saved.map((c) => (
                <div key={c.id} className="relative group/sv rounded-lg border border-slate-200/80 hover:border-[#8A2680] overflow-hidden transition-colors">
                  <button type="button" onClick={() => insertSaved(c)} title="หยิบมาวาง" className="w-full text-left">
                    <NodePreview node={c.node} />
                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-slate-600 group-hover/sv:text-[#8A2680] border-t border-slate-100">
                      <Plus className="w-2.5 h-2.5 opacity-60" /><span className="truncate">{c.name}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => deleteSaved(c.id)} title="ลบ"
                    className="absolute top-1 right-1 p-1 rounded-md bg-white/85 text-slate-400 hover:text-red-500 opacity-0 group-hover/sv:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.05)] p-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> Layers</h3>
            <button type="button" onClick={groupChecked} disabled={!canGroup}
              className={`text-[10px] font-semibold px-2 py-1 rounded-md ${canGroup ? "bg-[#8A2680] text-white" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}>
              จัดกลุ่ม{checked.length ? ` (${checked.length})` : ""}
            </button>
          </div>
          <TreeRows node={node} path={ROOT_PATH} depth={0} selectedPath={selectedPath} onSelect={setSelectedPath} checked={checked} onToggleCheck={toggleCheck} onDragStartRow={startDragMove} />
        </div>
      </div>

      {/* CENTER — canvas (also a drop zone) */}
      <div className="flex-1 min-w-0">
        <div ref={canvasRef} className="relative overflow-hidden rounded-xl ring-1 ring-slate-200 shadow-[0_1px_3px_rgba(16,24,40,0.06)] p-10 min-h-[560px] grid place-items-center fms-app"
          style={{ cursor: panMode ? "grab" : "default", backgroundColor: "#F6F7F9", backgroundImage: "radial-gradient(circle, rgba(15,23,42,0.06) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          onClickCapture={onCanvasClick}
          onMouseDown={onCanvasMouseDown}
          onDoubleClick={onCanvasDblClick}
          onMouseMove={onCanvasMove}
          onMouseLeave={() => setHoveredPath(null)}
          onDragOver={onDragOverCanvas}
          onDrop={onDropCanvas}
          onDragLeave={(e) => { if (e.target === canvasRef.current) setDropHint(null); }}>
          {selCss && <style dangerouslySetInnerHTML={{ __html: selCss }} />}
          {multiCss && <style dangerouslySetInnerHTML={{ __html: multiCss }} />}
          {hoverCss && <style dangerouslySetInnerHTML={{ __html: hoverCss }} />}
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center", transition: "transform .06s linear" }}>
            <Composition node={node} editorMode />
          </div>
          {marquee && (
            <div className="pointer-events-none absolute z-50 rounded-[2px] border border-[#8A2680] bg-[#8A2680]/[0.08]"
              style={{ left: marquee.left, top: marquee.top, width: marquee.w, height: marquee.h }} />
          )}
          {dropHint && (
            <div className="pointer-events-none absolute z-50" style={{ top: dropHint.line.top - 1, left: dropHint.line.left, width: dropHint.line.width }}>
              <div className="h-[3px] bg-[#8A2680] rounded-full shadow-[0_0_0_3px_rgba(138,38,128,0.18)]" />
            </div>
          )}
          {selRect && !editing && (
            <div className="absolute z-50" style={{ top: Math.max(0, selRect.top - 21), left: selRect.left - 1 }}
              draggable onDragStart={startDragMove(selectedPath)} title="ลากเพื่อย้าย">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white bg-[#8A2680] pl-1 pr-1.5 py-[3px] rounded-[5px] shadow-sm cursor-grab active:cursor-grabbing select-none">
                <GripVertical className="w-3 h-3 opacity-80" />{selected?.kind === "atom" ? selected.type : "frame"}
              </span>
            </div>
          )}
          {/* direct body-drag for an atom (drag the element itself, not just the handle) */}
          {selRect && !editing && selected?.kind === "atom" && (
            <div className="absolute z-40" style={{ top: selRect.top, left: selRect.left, width: selRect.w, height: selRect.h, cursor: "move" }}
              draggable onDragStart={startDragMove(selectedPath)}
              onDoubleClick={() => { if (TEXT_ATOMS.has(selected.type) && typeof selected.props?.children === "string") setEditing(true); }} />
          )}
          {/* resize handles (right edge / bottom edge / corner) — responsive-safe */}
          {selRect && !editing && [
            { dir: "e", top: selRect.top + selRect.h / 2 - 5, left: selRect.left + selRect.w - 5, cur: "ew-resize" },
            { dir: "s", top: selRect.top + selRect.h - 5, left: selRect.left + selRect.w / 2 - 5, cur: "ns-resize" },
            { dir: "se", top: selRect.top + selRect.h - 5, left: selRect.left + selRect.w - 5, cur: "nwse-resize" },
          ].map((h) => (
            <div key={h.dir} onMouseDown={startResize(h.dir)} title="ลากปรับขนาด"
              className="absolute z-50 w-2 h-2 bg-white border border-[#8A2680] rounded-[2px] shadow-[0_1px_2px_rgba(16,24,40,0.2)]"
              style={{ top: h.top, left: h.left, cursor: h.cur }} />
          ))}
          {editing && selRect && selected?.kind === "atom" && (
            <textarea autoFocus value={selected.props?.children ?? ""}
              onChange={(e) => setProp("children", e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
              className="absolute z-50 resize-none p-1 rounded border-2 border-[#8A2680] bg-white/95 text-slate-800 shadow-lg outline-none"
              style={{ top: selRect.top, left: selRect.left, width: Math.max(selRect.w, 120), height: Math.max(selRect.h, 28) }} />
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-2 text-center">ลาก atom มาวาง · ลากคลุมที่ว่างเพื่อเลือกหลายชิ้น · ลูกศรเลื่อนลำดับ · Ctrl+เลื่อนเมาส์ซูม · เว้นวรรค(Space)+ลากเพื่อแพน</p>
      </div>

      {/* RIGHT — inspector */}
      <div className="w-72 shrink-0">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.05)] p-4 sticky top-4">
          {!selected ? (
            <p className="text-xs text-slate-400 text-center py-8">คลิก element บน canvas หรือใน Layers เพื่อแก้ไข</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{selected.kind}</div>
                  <div className="text-sm font-bold text-slate-700 truncate">{selected.kind === "atom" ? selected.type : nodeLabel(selected)}</div>
                </div>
                {selectedPath !== ROOT_PATH && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => moveSelected(-1)} title="เลื่อนขึ้น" className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveSelected(1)} title="เลื่อนลง" className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={deleteSelected} title="ลบ" className="p-1 rounded border border-red-200 text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              {selected.kind === "atom" && variantsOf(selected.type).length > 1 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">รูปแบบ (variant)</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {variantsOf(selected.type).map((v) => {
                      const cur = (selected.variant || "gumroad") === v;
                      return (
                        <button key={v} type="button" onClick={() => setVariant(v)}
                          className={`text-[10px] py-1.5 px-2.5 rounded-md border ${cur ? "border-[#8A2680] bg-purple-50 text-[#8A2680] font-bold" : "border-slate-200 text-slate-500"}`}>{v}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              {selected.kind === "atom" && typeof selected.props?.children === "string" && (
                <TextInput label="ข้อความ" value={selected.props.children} onChange={(v) => setProp("children", v)} />
              )}
              {selected.kind === "atom" && ("tone" in (selected.props || {}) || selected.type === "chip" || selected.type === "stat-card") && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">โทนสี (tone)</label>
                  <div className="flex gap-1.5">
                    {["cream", "lime", "pink"].map((tn) => (
                      <button key={tn} type="button" onClick={() => setProp("tone", tn)}
                        className={`flex-1 text-[10px] py-1.5 rounded-md border ${selected.props?.tone === tn ? "border-[#8A2680] bg-purple-50 text-[#8A2680] font-bold" : "border-slate-200 text-slate-500"}`}>
                        {tn}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selected.kind === "atom" && TEXT_ATOMS.has(selected.type) && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สไตล์</div>
                  <ColorPickerInput label="สี" value={selected.style?.color} onChange={(v) => setStyle("color", v)} />
                  <PxSlider label="ขนาด" value={selected.style?.fontSize} min={10} max={96} onChange={(v) => setStyle("fontSize", v)} />
                  <WeightToggle label="น้ำหนัก" value={selected.style?.fontWeight} onChange={(v) => setStyle("fontWeight", v)} />
                  <AlignSelect label="จัดแนว" value={selected.style?.textAlign} onChange={(v) => setStyle("textAlign", v)} />
                </div>
              )}

              {selected.kind === "frame" && (
                <div className="space-y-3">
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">เลย์เอาต์</div>
                    <SelectInput label="ทิศทาง" value={selected.layout?.direction || "row"} onChange={(v) => setLayout("direction", v)}
                      options={[{ value: "row", label: "แนวนอน (row)" }, { value: "column", label: "แนวตั้ง (column)" }]} />
                    <PxSlider label="ระยะห่าง (gap)" value={typeof selected.layout?.gap === "number" ? `${selected.layout.gap}px` : selected.layout?.gap} min={0} max={48} onChange={(v) => setLayout("gap", v)} />
                    <SelectInput label="จัดเรียง (cross)" value={selected.layout?.align || ""} onChange={(v) => setLayout("align", v)}
                      options={[{ value: "", label: "—" }, { value: "flex-start", label: "ต้น" }, { value: "center", label: "กลาง" }, { value: "flex-end", label: "ท้าย" }, { value: "stretch", label: "ยืด" }]} />
                    <SelectInput label="จัดชิด (main)" value={selected.layout?.justify || ""} onChange={(v) => setLayout("justify", v)}
                      options={[{ value: "", label: "—" }, { value: "flex-start", label: "ต้น" }, { value: "center", label: "กลาง" }, { value: "flex-end", label: "ท้าย" }, { value: "space-between", label: "กระจาย" }]} />
                  </div>
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">กล่อง</div>
                    <ColorPickerInput label="พื้นหลัง" value={selected.style?.background} onChange={(v) => setStyle("background", v)} />
                    <PxSlider label="ระยะขอบใน (padding)" value={selected.style?.padding} min={0} max={64} onChange={(v) => setStyle("padding", v)} />
                    <PxSlider label="มุมโค้ง" value={selected.style?.borderRadius} min={0} max={48} onChange={(v) => setStyle("borderRadius", v)} />
                  </div>
                  <p className="text-[11px] text-slate-400">frame · {(selected.children || []).length} ลูก</p>
                  {selectedPath !== ROOT_PATH && (
                    <button type="button" onClick={ungroupSelected}
                      className="w-full text-[11px] font-semibold px-2 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
                      ยุบกลุ่ม (ungroup) — แตกลูกออกไปอยู่ชั้นบน
                    </button>
                  )}
                </div>
              )}
              {selected.kind === "node" && (
                <p className="text-[11px] text-slate-400">raw node (เช่น ไอคอน) — แก้ไม่ได้ใน v1</p>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
