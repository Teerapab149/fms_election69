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
    setSelectedElement(null);
  }, [baseline, baselineVariants]);

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
  const hasUnsavedChanges = elementConfigsDirty || statefulDirty || elementVariantsDirty;

  const commitBaseline = useCallback(() => {
    setBaseline(elementConfigs);
    setBaselineVariants(elementVariants);
    setStatefulDirty(false);
  }, [elementConfigs, elementVariants]);

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
