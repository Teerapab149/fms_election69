"use client";

import CandidatesPage from '../../app/candidates/page';
import { DUMMY_PARTIES_MULTI } from '../../utils/editorDummyData';

export default function CandidatesEditorPreview({
  pageLayout = null,
  elementConfigs = {},
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
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
