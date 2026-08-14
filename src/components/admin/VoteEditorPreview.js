"use client";

import { useRef, useCallback } from 'react';
import Navbar from '../Navbar';
import VoteFooter from '../vote/VoteFooter';
import MultiPartyView from '../vote/MultiPartyView';
import SinglePartyView from '../vote/SinglePartyView';
import GumroadVote from '../vote/GumroadVote';
import StudioDarkVote from '../vote/StudioDarkVote';
import VerdureVote from '../vote/VerdureVote';
import FmsOfficialVote from '../vote/FmsOfficialVote';
import EditorElement from './editor/EditorElement';
import {
  DUMMY_PARTIES_MULTI,
  DUMMY_PARTIES_SINGLE,
  DUMMY_SPECIAL_OPTIONS,
  DUMMY_USER,
} from '../../utils/editorDummyData';

export default function VoteEditorPreview({
  simMode = "multi",
  templateSlug = null,
  pageLayout = null,
  elementConfigs = {},
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  // Per-template layout: these families have their own distinct vote layouts.
  // Anything not listed here still falls through to the classic view below —
  // which is what an admin on FMS Official was seeing: the right template
  // selected, the original page rendered.
  if (templateSlug === 'gumroad' || templateSlug === 'studio-dark'
      || templateSlug === 'verdure' || templateSlug === 'fms-official') {
    const single = simMode === 'single';
    const VoteLayout = templateSlug === 'studio-dark' ? StudioDarkVote
      : templateSlug === 'verdure' ? VerdureVote
      : templateSlug === 'fms-official' ? FmsOfficialVote : GumroadVote;
    return (
      <VoteLayout
        editorMode
        regularParties={single ? DUMMY_PARTIES_SINGLE : DUMMY_PARTIES_MULTI}
        specialOptions={DUMMY_SPECIAL_OPTIONS}
        isSingleParty={single}
        selectedPartyId={null}
        onSelect={() => {}}
        onViewDetails={() => {}}
        user={DUMMY_USER}
        elementConfigs={elementConfigs}
        selectedElement={selectedElement}
        hoveredElement={hoveredElement}
        onSelectElement={onSelectElement}
        onHoverElement={onHoverElement}
        onHoverEnd={onHoverEnd}
      />
    );
  }
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
    <div className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden">
      {/* Full-bleed themed background — mirrors the real vote page. */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] md:w-[40%] h-[40%] rounded-full blur-[80px] md:blur-[120px]"
          style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-accent) 12%, transparent))' }} />
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] md:w-[35%] h-[35%] rounded-full blur-[80px] md:blur-[120px]"
          style={{ background: 'linear-gradient(to top right, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-primary) 10%, transparent))' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-50"><Navbar /></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
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
