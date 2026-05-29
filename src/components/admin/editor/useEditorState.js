"use client";

import { useCallback, useMemo, useState } from "react";

// Editor state hook — manages selection, hover, and element config edits.
// initialConfigs: the baseline configs (from DB or elementRegistry defaults).
// Step 1 keeps this self-contained; elementRegistry integration lands in Step 2.
export default function useEditorState(initialConfigs = {}) {
  const [selectedElement, setSelectedElement] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [elementConfigs, setElementConfigs] = useState(initialConfigs);
  const [baseline, setBaseline] = useState(initialConfigs);

  // H-4: stateful element override state
  const [sourceTemplate, setSourceTemplate] = useState('classic');
  const [elementOverrides, setElementOverrides] = useState({});
  const [backgroundId, setBackgroundId] = useState('gradient-purple-light');
  const [statefulDirty, setStatefulDirty] = useState(false);

  // Day 10: per-element variant overrides — { [elementId]: variantId }.
  // Cascade at render time: elementVariants[id] > template default > 'default'.
  // Reset deletes the key so the element re-inherits the template default.
  const [elementVariants, setElementVariants] = useState({});
  const [baselineVariants, setBaselineVariants] = useState({});

  // Day 11 Tier 1: theme token overrides (Layer 1) — sparse map of only the
  // tokens the admin changed, e.g. { "--color-primary": "#123456" }.
  // Cascade at render time: themeTokens[k] > template.theme.tokens[k].
  // Reset (single key) deletes it so it re-inherits the template token.
  const [themeTokens, setThemeTokens] = useState({});
  const [baselineThemeTokens, setBaselineThemeTokens] = useState({});

  // Day 11 Tier 2: per-element Layer 2 var overrides — nested sparse map,
  // e.g. { "voteCTA-button": { "--btn-bg": "#123456" } }.
  // Cascade: elementVars[id][k] > template.elements[id].vars[k] > Layer 1 token.
  const [elementVars, setElementVars] = useState({});
  const [baselineElementVars, setBaselineElementVars] = useState({});

  const updateElementConfig = useCallback((elementId, key, value) => {
    setElementConfigs((prev) => {
      const current = prev[elementId] || {};
      return {
        ...prev,
        [elementId]: {
          ...current,
          config: {
            ...(current.config || {}),
            [key]: value,
          },
        },
      };
    });
  }, []);

  const replaceAllConfigs = useCallback((next, markAsBaseline = false) => {
    setElementConfigs(next || {});
    if (markAsBaseline) setBaseline(next || {});
  }, []);

  const resetToDefaults = useCallback(() => {
    setElementConfigs(baseline);
    setElementVariants(baselineVariants);
    setThemeTokens(baselineThemeTokens);
    setElementVars(baselineElementVars);
    setSelectedElement(null);
  }, [baseline, baselineVariants, baselineThemeTokens, baselineElementVars]);

  const resetElement = useCallback(
    (elementId) => {
      setElementConfigs((prev) => ({
        ...prev,
        [elementId]: baseline[elementId] || prev[elementId],
      }));
    },
    [baseline]
  );

  // Day 10: variant slice setters --------------------------------------
  // Set one element's variant. No-op when unchanged (avoids spurious dirty).
  const setElementVariant = useCallback((elementId, variantId) => {
    setElementVariants((prev) => {
      if (prev[elementId] === variantId) return prev;
      return { ...prev, [elementId]: variantId };
    });
  }, []);

  // Reset = delete the key so the element falls back to the template default.
  const resetElementVariant = useCallback((elementId) => {
    setElementVariants((prev) => {
      if (!(elementId in prev)) return prev;
      const next = { ...prev };
      delete next[elementId];
      return next;
    });
  }, []);

  // Load variants from DB (mirror of replaceAllConfigs). markAsBaseline keeps
  // the freshly-loaded map as the "saved" snapshot so the editor isn't dirty.
  const replaceAllVariants = useCallback((next, markAsBaseline = false) => {
    setElementVariants(next || {});
    if (markAsBaseline) setBaselineVariants(next || {});
  }, []);

  // Day 11 Tier 1: theme token slice setters -------------------------------
  // Set one Layer 1 token override. No-op when unchanged.
  const setThemeToken = useCallback((tokenKey, value) => {
    setThemeTokens((prev) => {
      if (prev[tokenKey] === value) return prev;
      return { ...prev, [tokenKey]: value };
    });
  }, []);

  // Reset one token → delete key so it re-inherits the template default.
  const resetThemeToken = useCallback((tokenKey) => {
    setThemeTokens((prev) => {
      if (!(tokenKey in prev)) return prev;
      const next = { ...prev };
      delete next[tokenKey];
      return next;
    });
  }, []);

  // Reset ALL token overrides → whole map back to template defaults.
  const resetAllThemeTokens = useCallback(() => {
    setThemeTokens((prev) => (Object.keys(prev).length === 0 ? prev : {}));
  }, []);

  // Load token overrides from DB (mirror of replaceAllConfigs).
  const replaceAllThemeTokens = useCallback((next, markAsBaseline = false) => {
    setThemeTokens(next || {});
    if (markAsBaseline) setBaselineThemeTokens(next || {});
  }, []);

  // Day 11 Tier 2: per-element Layer 2 var slice setters -------------------
  // Set one var on one element. No-op when unchanged.
  const setElementVar = useCallback((elementId, varKey, value) => {
    setElementVars((prev) => {
      if (prev[elementId]?.[varKey] === value) return prev;
      return {
        ...prev,
        [elementId]: { ...(prev[elementId] || {}), [varKey]: value },
      };
    });
  }, []);

  // Reset one var → delete key; drop the element entry when it becomes empty.
  const resetElementVar = useCallback((elementId, varKey) => {
    setElementVars((prev) => {
      if (!(varKey in (prev[elementId] || {}))) return prev;
      const nextEl = { ...prev[elementId] };
      delete nextEl[varKey];
      const next = { ...prev };
      if (Object.keys(nextEl).length === 0) delete next[elementId];
      else next[elementId] = nextEl;
      return next;
    });
  }, []);

  // Reset all vars for one element → delete the element entry.
  const resetElementVars = useCallback((elementId) => {
    setElementVars((prev) => {
      if (!(elementId in prev)) return prev;
      const next = { ...prev };
      delete next[elementId];
      return next;
    });
  }, []);

  // Load Layer 2 var overrides from DB (mirror of replaceAllConfigs).
  const replaceAllElementVars = useCallback((next, markAsBaseline = false) => {
    setElementVars(next || {});
    if (markAsBaseline) setBaselineElementVars(next || {});
  }, []);

  const getElementConfig = useCallback(
    (elementId) => elementConfigs?.[elementId]?.config || {},
    [elementConfigs]
  );

  const getElementMeta = useCallback(
    (elementId) => {
      const el = elementConfigs?.[elementId];
      if (!el) return null;
      return { type: el.type, label: el.label, section: el.section };
    },
    [elementConfigs]
  );

  const hoverElement = useCallback((id) => setHoveredElement(id), []);
  const clearHover = useCallback(() => setHoveredElement(null), []);
  const selectElement = useCallback((id) => setSelectedElement(id), []);
  const clearSelection = useCallback(() => setSelectedElement(null), []);

  const elementConfigsDirty = useMemo(() => {
    try {
      return JSON.stringify(elementConfigs) !== JSON.stringify(baseline);
    } catch {
      return false;
    }
  }, [elementConfigs, baseline]);
  // Day 10: variant changes also mark the editor dirty.
  const elementVariantsDirty = useMemo(() => {
    try {
      return JSON.stringify(elementVariants) !== JSON.stringify(baselineVariants);
    } catch {
      return false;
    }
  }, [elementVariants, baselineVariants]);
  // Day 11: theme token + Layer 2 var changes also mark the editor dirty.
  const themeTokensDirty = useMemo(() => {
    try {
      return JSON.stringify(themeTokens) !== JSON.stringify(baselineThemeTokens);
    } catch {
      return false;
    }
  }, [themeTokens, baselineThemeTokens]);
  const elementVarsDirty = useMemo(() => {
    try {
      return JSON.stringify(elementVars) !== JSON.stringify(baselineElementVars);
    } catch {
      return false;
    }
  }, [elementVars, baselineElementVars]);
  const hasUnsavedChanges =
    elementConfigsDirty ||
    statefulDirty ||
    elementVariantsDirty ||
    themeTokensDirty ||
    elementVarsDirty;

  const commitBaseline = useCallback(() => {
    setBaseline(elementConfigs);
    setBaselineVariants(elementVariants);
    setBaselineThemeTokens(themeTokens);
    setBaselineElementVars(elementVars);
    setStatefulDirty(false);
  }, [elementConfigs, elementVariants, themeTokens, elementVars]);

  // H-4 handlers — stateful element overrides
  const updateStatefulOverride = useCallback((elementId, stateId, key, value) => {
    setElementOverrides(prev => {
      const next = { ...prev };
      if (!next[elementId]) next[elementId] = {};
      next[elementId] = {
        ...next[elementId],
        [stateId]: {
          ...(next[elementId][stateId] || {}),
          [key]: value
        }
      };
      return next;
    });
    setStatefulDirty(true);
  }, []);

  const resetStatefulState = useCallback((elementId, stateId) => {
    setElementOverrides(prev => {
      const next = { ...prev };
      if (!next[elementId]) return prev;
      const copy = { ...next[elementId] };
      delete copy[stateId];
      if (Object.keys(copy).length === 0) {
        delete next[elementId];
      } else {
        next[elementId] = copy;
      }
      return next;
    });
    setStatefulDirty(true);
  }, []);

  const applyTemplateToElement = useCallback((elementId, templateId) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getTemplate } = require('./templateEngine');
    const template = getTemplate(templateId);
    if (!template) return;
    const elementStates = template.elements?.[elementId];
    if (!elementStates) return;
    setElementOverrides(prev => ({
      ...prev,
      [elementId]: { ...elementStates }
    }));
    setStatefulDirty(true);
  }, []);

  const applyGlobalTemplate = useCallback((templateId) => {
    setSourceTemplate(templateId);
    setElementOverrides({});
    setStatefulDirty(true);
  }, []);

  return {
    selectedElement,
    hoveredElement,
    elementConfigs,
    hasUnsavedChanges,
    selectElement,
    clearSelection,
    hoverElement,
    clearHover,
    updateElementConfig,
    replaceAllConfigs,
    resetToDefaults,
    resetElement,
    getElementConfig,
    getElementMeta,
    commitBaseline,
    // Day 10 — variant slice
    elementVariants,
    setElementVariant,
    resetElementVariant,
    replaceAllVariants,
    // Day 11 — Tier 1 theme tokens (Layer 1)
    themeTokens,
    setThemeToken,
    resetThemeToken,
    resetAllThemeTokens,
    replaceAllThemeTokens,
    // Day 11 — Tier 2 per-element vars (Layer 2)
    elementVars,
    setElementVar,
    resetElementVar,
    resetElementVars,
    replaceAllElementVars,
    // H-4 new
    sourceTemplate,
    elementOverrides,
    backgroundId,
    updateStatefulOverride,
    resetStatefulState,
    applyTemplateToElement,
    applyGlobalTemplate,
    setBackgroundId,
    setSourceTemplate,
    setElementOverrides,
  };
}
