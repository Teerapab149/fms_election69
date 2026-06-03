"use client";

// Day 9a: VoteCTABlock is now a thin wrapper around the variant resolver.
// The actual rendering + 6-state logic lives in
// src/components/elements/voteCTA-button/default.jsx (and future siblings).
// This wrapper exists so the legacy import path (blocks/VoteCTABlock) keeps
// working for HomeContent, BlockRenderer, PagePreviewRenderer, StatefulGallery.

import { getVoteCTAVariant } from "../elements/voteCTA-button";

export default function VoteCTABlock({ resolvedTemplate, ...props }) {
  const variantId = resolvedTemplate?.elements?.["voteCTA-button"]?.variant || "default";
  const VariantComponent = getVoteCTAVariant(variantId);
  return <VariantComponent {...props} />;
}
