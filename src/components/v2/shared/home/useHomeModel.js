"use client";

// Everything a v2 home page needs to KNOW, none of what it looks like:
//
//   election   phase / action / countdown target, from useElectionStatus (the one
//              source — templates never compare dates themselves, rule 6)
//   text(id)   an editable element's words: bound → globalConfig, else what the
//              admin saved in Page Design, else the family's default (rule 4)
//   Wrap       the Page Design selection wrapper (EditorElement) for that id
//   cta        the voteCTA-button for the current state (resolveStatefulConfig)
//   stats      turnout figures (editor gets sample numbers)
//
// /template-preview passes `previewDates` in initialData so every phase can be
// reviewed without touching the real schedule; the page editor without them is
// pinned to "open".

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { getPath } from "../../../../utils/basePath";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../../../hooks/useVoteStatus";
import { useElectionStatus } from "../../../../hooks/useElectionStatus";
import { voterSignIn } from "../../../../lib/auth/voterSession";
import EditorElement from "../../../admin/editor/EditorElement";
import { getBinding } from "../../../admin/editor/elementCatalog";
import { resolveStatefulConfig } from "../../../admin/editor/templateEngine";

// useElectionStatus action → voteCTA-button state (the catalog's vocabulary)
const CTA_STATE = { signin: "login", vote: "notVoted", voted: "voted", wait: "closed", paused: "paused", results: "ended" };
const CTA_HREF = { vote: "/vote", voted: "/results", results: "/results" };

/**
 * @param props        the home page's props (HomeRenderer contract)
 * @param familyTemplate this family's builtIn template (defaults for text/copy)
 */
export function useHomeModel(props, familyTemplate) {
  const {
    initialData, editorMode = false, editorData = null, elementConfigs = null,
    selectedElement = null, hoveredElement = null, onSelectElement = null,
    onHoverElement = null, onHoverEnd = null, pageLayout = null,
    resolvedTemplate = null, onSignIn = null,
  } = props;

  const { data: session, status: authStatus } = useSession();
  const globalConfig = useGlobalConfig();
  const signedIn = !editorMode && authStatus === "authenticated" && !!session?.user;
  const { isVoted } = useVoteStatus({ enabled: signedIn });
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const previewDates = initialData?.previewDates || null;
  const pinOpen = editorMode && !previewDates;
  const election = useElectionStatus({
    globalConfig,
    systemMode: initialData?.systemMode || initialData?.systemConfig?.systemMode || "AUTO",
    // live data always carries isSystemOpen; previews send only electionStatus
    isSystemOpen: pinOpen ? true
      : initialData?.isSystemOpen ?? initialData?.systemConfig?.isSystemOpen ?? initialData?.electionStatus === "ONGOING",
    electionStatus: pinOpen ? "ONGOING" : initialData?.electionStatus,
    signedIn,
    isVoted: !!(isVoted ?? initialData?.userData?.isVoted),
    tick: !editorMode || !!previewDates,
    previewDates,
  });

  // editor selection wrapper — same contract as the v1 family homes
  const editorRef = useRef(null);
  editorRef.current = { editorMode, elementConfigs, selectedElement, hoveredElement, onSelectElement, onHoverElement, onHoverEnd };
  const Wrap = useCallback(({ id, children, className }) => {
    const s = editorRef.current;
    if (!s.editorMode) return children;
    return (
      <EditorElement id={id} className={className} config={s.elementConfigs?.[id]}
        isSelected={s.selectedElement === id} isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement} onHover={s.onHoverElement} onHoverEnd={s.onHoverEnd}>{children}</EditorElement>
    );
  }, []);

  const template = resolvedTemplate?.elements ? resolvedTemplate : familyTemplate;
  const copy = { ...familyTemplate.copy, ...(template.copy || {}) };
  const saved = editorMode ? elementConfigs : (pageLayout?.elementConfigs?.home || {});
  const text = (id, fallback = "") => {
    const b = getBinding(id);
    if (b && globalConfig?.[b] != null && globalConfig[b] !== "") return String(globalConfig[b]);
    return String(saved?.[id]?.config?.text ?? template.elements?.[id]?.config?.text ?? fallback);
  };
  const visible = (id) => saved?.[id]?.config?.visible !== false;

  const ctaState = CTA_STATE[election.action] || "login";
  const cta = resolveStatefulConfig(template, "voteCTA-button", ctaState, pageLayout?.elementOverrides?.["voteCTA-button"]?.[ctaState] || {});
  const ctaDisabled = election.action === "wait" || election.action === "paused";
  const ctaSignin = election.action === "signin";
  const ctaHref = editorMode || ctaSignin || ctaDisabled ? undefined : getPath(CTA_HREF[election.action] || "/");
  const onAction = (e) => {
    if (editorMode || ctaDisabled) { e.preventDefault(); return; }
    if (ctaSignin) { e.preventDefault(); onSignIn ? onSignIn() : voterSignIn(); }
  };

  const stats = editorMode && !previewDates
    ? { totalVoted: editorData?.totalVoted ?? 342, totalEligible: editorData?.totalEligible ?? 1200 }
    : { totalVoted: initialData?.stats?.totalVoted ?? 0, totalEligible: initialData?.stats?.totalEligible ?? 0 };
  const pct = stats.totalEligible > 0 ? (stats.totalVoted / stats.totalEligible) * 100 : 0;

  return {
    mounted, signedIn, globalConfig, election, Wrap, text, visible, copy, template,
    cta, ctaDisabled, ctaSignin, ctaHref, onAction, stats, pct,
    candidates: initialData?.candidates || [],
  };
}
