"use client";

import CandidatesPage from '../../app/candidates/page';
import GumroadCandidates from '../vote/GumroadCandidates';
import StudioDarkCandidates from '../vote/StudioDarkCandidates';
import VerdureCandidates from '../vote/VerdureCandidates';
import { DUMMY_PARTIES_MULTI } from '../../utils/editorDummyData';

export default function CandidatesEditorPreview({
  templateSlug = null,
  pageLayout = null,
  elementConfigs = {},
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  // Per-template layout: gumroad / studio-dark have their own candidates layouts.
  if (templateSlug === 'gumroad' || templateSlug === 'studio-dark' || templateSlug === 'verdure') {
    const CandidatesLayout = templateSlug === 'studio-dark' ? StudioDarkCandidates
      : templateSlug === 'verdure' ? VerdureCandidates : GumroadCandidates;
    return <CandidatesLayout candidates={DUMMY_PARTIES_MULTI} editorMode />;
  }

  return (
    <CandidatesPage
      editorMode={true}
      candidates={DUMMY_PARTIES_MULTI}
      pageLayout={pageLayout}
      elementConfigs={elementConfigs}
      selectedElement={selectedElement}
      hoveredElement={hoveredElement}
      onSelectElement={onSelectElement}
      onHoverElement={onHoverElement}
      onHoverEnd={onHoverEnd}
    />
  );
}
