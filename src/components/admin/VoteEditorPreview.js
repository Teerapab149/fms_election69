"use client";

import { useRef, useCallback } from 'react';
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
  // Stable Wrap identity (see HomeContent): inline definition remounts the
  // wrapped subtree on every hover re-render → animation flicker. useCallback
  // pins identity; live state via ref keeps hover a re-render, not a remount.
  const editorStateRef = useRef(null);
  editorStateRef.current = {
    elementConfigs, selectedElement, hoveredElement,
    onSelectElement, onHoverElement, onHoverEnd,
  };
  const Wrap = useCallback(({ id, children }) => {
    const s = editorStateRef.current;
    return (
      <EditorElement
        id={id}
        config={s.elementConfigs?.[id]}
        isSelected={s.selectedElement === id}
        isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement}
        onHover={s.onHoverElement}
        onHoverEnd={s.onHoverEnd}
      >
        {children}
      </EditorElement>
    );
  }, []);

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
