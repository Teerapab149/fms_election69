"use client";

import Navbar from '../Navbar';
import VoteFooter from '../vote/VoteFooter';
import MultiPartyView from '../vote/MultiPartyView';
import SinglePartyView from '../vote/SinglePartyView';
import EditorElement from './editor/EditorElement';
import {
  DUMMY_PARTIES_MULTI,
  DUMMY_PARTIES_SINGLE,
  DUMMY_SPECIAL_OPTIONS,
  DUMMY_USER,
} from '../../utils/editorDummyData';

export default function VoteEditorPreview({
  simMode = "multi",
  pageLayout = null,
  elementConfigs = {},
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const Wrap = ({ id, children }) => (
    <EditorElement
      id={id}
      config={elementConfigs?.[id]}
      isSelected={selectedElement === id}
      isHovered={hoveredElement === id}
      onSelect={onSelectElement}
      onHover={onHoverElement}
      onHoverEnd={onHoverEnd}
    >
      {children}
    </EditorElement>
  );

  if (simMode === "single") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <SinglePartyView
          editorMode={true}
          candidate={DUMMY_PARTIES_SINGLE[0]}
          specialOptions={DUMMY_SPECIAL_OPTIONS}
          selectedPartyId={null}
          onSelect={() => {}}
          user={DUMMY_USER}
          elementConfigs={elementConfigs}
          selectedElement={selectedElement}
          hoveredElement={hoveredElement}
          onSelectElement={onSelectElement}
          onHoverElement={onHoverElement}
          onHoverEnd={onHoverEnd}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <MultiPartyView
          editorMode={true}
          regularParties={DUMMY_PARTIES_MULTI}
          specialOptions={DUMMY_SPECIAL_OPTIONS}
          selectedPartyId={null}
          onSelect={() => {}}
          onViewDetails={() => {}}
          config={pageLayout?.vote?.multiParty || {}}
          pageLayout={pageLayout}
          elementConfigs={elementConfigs}
          selectedElement={selectedElement}
          hoveredElement={hoveredElement}
          onSelectElement={onSelectElement}
          onHoverElement={onHoverElement}
          onHoverEnd={onHoverEnd}
        />
      </div>
    </div>
  );
}
