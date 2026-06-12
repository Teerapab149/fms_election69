"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { GLOBAL_CONFIG_DEFAULTS, mergeWithDefaults } from "../utils/globalConfigDefaults";
import { getPath } from "../utils/basePath";

const GlobalConfigContext = createContext({
  config: GLOBAL_CONFIG_DEFAULTS,
  updateField: async () => {},
  replaceConfig: () => {},
  isUpdating: false,
  activeTemplateId: "classic",
});

/**
 * GlobalConfigProvider — wraps app tree, distributes globalConfig.
 * Provides read access via useGlobalConfig() and write access via useGlobalConfigUpdate().
 */
export function GlobalConfigProvider({ value: initialValue, activeTemplateId = "classic", children }) {
  const [config, setConfig] = useState(() => mergeWithDefaults(initialValue));
  const [isUpdating, setIsUpdating] = useState(false);

  const isFirstRunRef = useRef(true);

  // Keep local state in sync if SSR-provided value changes (e.g., navigation).
  // Skip the first run — config was already set in useState initializer.
  // Only re-sync when initialValue content actually changes to avoid stomping optimistic updates.
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    const newConfig = mergeWithDefaults(initialValue);
    setConfig((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(newConfig)) {
        return prev;
      }
      return newConfig;
    });
  }, [initialValue]);

  // Used by GlobalConfigTab after a successful bulk save — keeps every consumer
  // (PropertyPanel bound editors, HomeContent, SiteFooter, etc.) in sync without
  // a page reload.
  const replaceConfig = useCallback((nextConfig) => {
    setConfig(mergeWithDefaults(nextConfig));
  }, []);

  const updateSequenceRef = useRef(0);

  const updateField = useCallback(async (fieldKey, newValue) => {
    const mySeq = ++updateSequenceRef.current;

    // Optimistic update
    setConfig((prev) => ({ ...prev, [fieldKey]: newValue }));
    setIsUpdating(true);

    try {
      let nextConfig;
      setConfig((prev) => {
        nextConfig = { ...prev, [fieldKey]: newValue };
        return nextConfig;
      });

      // Admin identity = httpOnly admin_token cookie (sent automatically; P0-1)
      const res = await fetch(getPath("/api/admin/global-config"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalConfig: nextConfig }),
      });

      if (!res.ok) {
        if (mySeq === updateSequenceRef.current) {
          console.error("updateField failed, rolling back:", fieldKey);
          setConfig((prev) => ({ ...prev, [fieldKey]: undefined }));
        } else {
          console.warn("updateField failed but newer update exists, skipping rollback:", fieldKey);
        }
      }
    } catch (e) {
      console.error("Error updating globalConfig:", e);
      if (mySeq === updateSequenceRef.current) {
        setConfig((prev) => ({ ...prev, [fieldKey]: undefined }));
      }
    } finally {
      if (mySeq === updateSequenceRef.current) {
        setIsUpdating(false);
      }
    }
  }, []);

  const contextValue = useMemo(
    () => ({ config, updateField, replaceConfig, isUpdating, activeTemplateId }),
    [config, updateField, replaceConfig, isUpdating, activeTemplateId]
  );

  return (
    <GlobalConfigContext.Provider value={contextValue}>
      {children}
    </GlobalConfigContext.Provider>
  );
}

/**
 * useGlobalConfig — returns the merged globalConfig object (read-only).
 */
export function useGlobalConfig() {
  const ctx = useContext(GlobalConfigContext);
  return ctx.config;
}

/**
 * useActiveTemplateId — the SSR-provided active template slug ("classic" /
 * "gumroad" / "studio-dark" / ...). Known on first paint (rides the layout's
 * server render), so theme-matched loading screens never flash the wrong color.
 */
export function useActiveTemplateId() {
  const ctx = useContext(GlobalConfigContext);
  return ctx.activeTemplateId || "classic";
}

/**
 * useGlobalConfigUpdate — returns updateField + isUpdating for admin surfaces
 * that need to write a single field (e.g., bound element editor).
 */
export function useGlobalConfigUpdate() {
  const ctx = useContext(GlobalConfigContext);
  return {
    updateField: ctx.updateField,
    replaceConfig: ctx.replaceConfig,
    isUpdating: ctx.isUpdating,
  };
}
