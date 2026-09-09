"use client";

// Day 7b: ElectionBannerBlock is now a thin wrapper that delegates to a
// variant component (per ADR-001 v1.2 Element Library + Registry).
//
// All existing import sites (HomeContent, etc.) keep using ElectionBannerBlock
// — no caller refactor needed. The wrapper:
//   1. Reads the active variant ID from resolvedTemplate.elements['banner-section'].variant
//   2. Falls back to "default" when the field is absent or unknown
//   3. Forwards every prop to the resolved variant component
//
// The frame rendering, slideshow state, Layer 2 var consumption, and Layer 3
// inline-override behaviour all live in the variant file (default.jsx).

import { getBannerVariant } from "../elements/banner-section";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionPosterPath } from "../../utils/electionPoster.mjs";

export default function ElectionBannerBlock(props) {
  const globalConfig = useGlobalConfig();
  const variantId = props?.resolvedTemplate?.elements?.["banner-section"]?.variant || "default";
  const VariantComponent = getBannerVariant(variantId);
  const posterPath = resolveElectionPosterPath(globalConfig);
  return <VariantComponent {...props} posterPath={posterPath} />;
}
