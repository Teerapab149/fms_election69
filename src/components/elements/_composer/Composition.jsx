"use client";

// Composition — the Layer-2 renderer (the "Hybrid C" composer).
//
// Walks a composition DESCRIPTOR (a plain JS node tree) and renders it. This is
// what makes a Layer-2 *component* = DATA, not hardcoded JSX: the editor produces/
// manipulates this tree; here we just render it.
//
// Node kinds:
//   - frame  → a responsive container (div / a / section). Its `layout` compiles
//              to flex/grid inline styles → STAYS RESPONSIVE (no absolute canvas,
//              per STYLED_BLOCKS Guardrail #2). Carries children.
//   - atom   → a Layer-1 library element, resolved via the atom registry.
//   - node   → escape hatch: a raw ReactNode (icons / bespoke bits).
//
// editorMode: stamps `data-node-path` on every selectable node so the editor can
// resolve a click (event delegation) or a layers-tree row back to a tree path, and
// highlight the selection via CSS. Public render (editorMode falsy) is UNCHANGED —
// no wrappers, no extra attrs — so the live pages stay byte-faithful.

import React from "react";
import { resolveAtom } from "./registry";

// path helper — root is "0"; children append "/<index>" (e.g. "0/1/0").
export const ROOT_PATH = "0";
const childPath = (path, i) => `${path}/${i}`;

function compileLayout(layout) {
  if (!layout) return {};
  const { display = "flex", direction, gap, align, justify, wrap, columns, ...rest } = layout;
  const s = { display };
  if (display === "flex") {
    if (direction) s.flexDirection = direction;
    if (wrap) s.flexWrap = wrap;
  }
  if (display === "grid" && columns) s.gridTemplateColumns = columns;
  if (gap != null) s.gap = typeof gap === "number" ? `${gap}px` : gap;
  if (align) s.alignItems = align;
  if (justify) s.justifyContent = justify;
  return { ...s, ...rest };
}

function renderNode(node, key, path, editorMode) {
  if (!node) return null;

  // escape hatch → raw ReactNode (not individually selectable in v1)
  if (node.kind === "node") {
    return <React.Fragment key={key}>{node.render}</React.Fragment>;
  }

  // atom leaf → Layer-1 element from the registry
  if (node.kind === "atom") {
    const Atom = resolveAtom(node.type, node.variant);
    if (!Atom) {
      if (typeof console !== "undefined") console.warn(`[composition] unknown atom "${node.type}"`);
      return null;
    }
    const atom = <Atom {...(node.props || {})} style={node.style} />;
    // In the editor, wrap atoms in a layout-neutral (display:contents) span that
    // carries the path → clicks bubble to it, the layers tree maps to it. Public
    // render returns the bare atom (no wrapper) so live pages are unchanged.
    if (editorMode) {
      return (
        <span key={key} className="cmp-node cmp-node--atom" data-node-path={path} style={{ display: "contents" }}>
          {atom}
        </span>
      );
    }
    return <React.Fragment key={key}>{atom}</React.Fragment>;
  }

  // frame → responsive container
  const Tag = node.as || "div";
  const style = { ...compileLayout(node.layout), ...(node.style || {}) };
  const tagProps = {};
  if (node.href != null) tagProps.href = node.href;
  const editorAttrs = editorMode ? { "data-node-path": path } : {};
  return (
    <Tag key={key} className={node.className} style={style} {...(node.attrs || {})} {...tagProps} {...editorAttrs}>
      {(node.children || []).map((child, i) => renderNode(child, i, childPath(path, i), editorMode))}
    </Tag>
  );
}

export default function Composition({ node, editorMode = false }) {
  return renderNode(node, "root", ROOT_PATH, editorMode);
}

// ---- descriptor path helpers (used by the editor) ----------------------------
// Resolve a "/"-separated path to the node it points at within a root descriptor.
export function getNodeAtPath(root, path) {
  if (!path) return null;
  const parts = String(path).split("/").map(Number);
  if (parts[0] !== 0) return null;
  let cur = root;
  for (let i = 1; i < parts.length; i++) {
    if (!cur || !Array.isArray(cur.children)) return null;
    cur = cur.children[parts[i]];
  }
  return cur || null;
}

// Immutably set a node at a path (returns a new root). updater(node) → new node.
export function updateNodeAtPath(root, path, updater) {
  const parts = String(path).split("/").map(Number);
  const recurse = (node, depth) => {
    if (depth === parts.length - 1) return updater(node);
    const idx = parts[depth + 1];
    const children = node.children ? [...node.children] : [];
    children[idx] = recurse(children[idx], depth + 1);
    return { ...node, children };
  };
  return recurse(root, 0);
}

// path of the parent frame, or null for root.
export function parentPath(path) {
  const parts = String(path).split("/");
  return parts.length <= 1 ? null : parts.slice(0, -1).join("/");
}
export function indexInParent(path) {
  const parts = String(path).split("/");
  return Number(parts[parts.length - 1]);
}

// insert a child node into the frame at framePath (at `index`, default end).
// returns { root, path } where path = the new node's path.
export function insertChild(root, framePath, node, index = null) {
  let newIndex = index;
  const next = updateNodeAtPath(root, framePath, (f) => {
    const children = [...(f.children || [])];
    const at = index == null ? children.length : index;
    newIndex = at;
    children.splice(at, 0, node);
    return { ...f, children };
  });
  return { root: next, path: `${framePath}/${newIndex}` };
}

// remove the node at path (cannot remove root). returns new root.
export function removeAtPath(root, path) {
  const pp = parentPath(path);
  if (!pp) return root; // can't remove root
  const idx = indexInParent(path);
  return updateNodeAtPath(root, pp, (f) => {
    const children = [...(f.children || [])];
    children.splice(idx, 1);
    return { ...f, children };
  });
}

// group sibling children (by their indices in the parent frame) into a NEW frame
// inserted at the lowest index. returns { root, path } (path = the new frame).
export function groupSiblings(root, framePath, indices) {
  const sorted = [...indices].sort((a, b) => a - b);
  const lowest = sorted[0];
  let newPath = `${framePath}/${lowest}`;
  const next = updateNodeAtPath(root, framePath, (f) => {
    const children = [...(f.children || [])];
    const picked = sorted.map((i) => children[i]);
    // remove from highest → lowest so indices stay valid
    for (let i = sorted.length - 1; i >= 0; i--) children.splice(sorted[i], 1);
    const group = { kind: "frame", layout: { direction: "column", gap: 10 }, style: { display: "flex" }, children: picked };
    children.splice(lowest, 0, group);
    return { ...f, children };
  });
  return { root: next, path: newPath };
}

// ungroup: replace the frame at framePath with its children, inlined into the parent.
export function ungroupAtPath(root, framePath) {
  const pp = parentPath(framePath);
  if (!pp) return root; // can't ungroup root
  const idx = indexInParent(framePath);
  const frame = getNodeAtPath(root, framePath);
  const kids = (frame && frame.children) || [];
  return updateNodeAtPath(root, pp, (f) => {
    const children = [...(f.children || [])];
    children.splice(idx, 1, ...kids);
    return { ...f, children };
  });
}

// move the node at path within its parent by dir (-1 up / +1 down).
// returns { root, path } (path = the node's new path).
export function moveAtPath(root, path, dir) {
  const pp = parentPath(path);
  if (!pp) return { root, path };
  const idx = indexInParent(path);
  let target = idx;
  const next = updateNodeAtPath(root, pp, (f) => {
    const children = [...(f.children || [])];
    const t = idx + dir;
    if (t < 0 || t >= children.length) return f;
    [children[idx], children[t]] = [children[t], children[idx]];
    target = t;
    return { ...f, children };
  });
  return { root: next, path: `${pp}/${target}` };
}
