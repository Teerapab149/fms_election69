'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPath } from '../../utils/basePath';
import { getEncryptedToken } from '../../utils/auth';
import { EDITABLE_PAGES, getPageById, DEFAULT_PAGE, SECTION_LABELS } from '../../utils/pageRegistry';
import CompletedActionModal from '../CompletedActionModal';
import ErrorActionModal from '../ErrorActionModal';
import ConfirmModal from '../ConfirmModal';
import PagePreviewRenderer from './previews/PagePreviewRenderer';
import ResultsEditorPreview from './ResultsEditorPreview';
import VoteEditorPreview from './VoteEditorPreview';
import CandidatesEditorPreview from './CandidatesEditorPreview';
import ClosedEditorPreview from './ClosedEditorPreview';
import SuccessEditorPreview from './SuccessEditorPreview';
import useEditorState from './editor/useEditorState';
import PropertyPanel from './editor/PropertyPanel';
import HomeRenderer from '../home/HomeRenderer';
import { buildTemplateStyles, buildElementCss } from '../../lib/templateTokens';
import { BUILT_IN_TEMPLATES } from './editor/templates';
import TokenEditor from './editor/TokenEditor';
import ElementLibraryPanel from './editor/ElementLibraryPanel';
import {
  DUMMY_ELECTION,
} from '../../utils/editorDummyData';
import { getPresetDefaults, getElementPresets } from './editor/elementCatalog';
import {
  ArrowUp, ArrowDown, Eye, EyeOff, Save, Loader2,
  ChevronDown, Info, LayoutGrid, Timer, Users, BarChart3,
  Image as ImageIcon, Vote, Ban, Palette, Check, Sparkles,
  Monitor, Smartphone, X, Home, PartyPopper, CheckCircle, Lock,
  ExternalLink, FileText, GripVertical, UploadCloud,
  Calendar, Layers, User
} from 'lucide-react';

const BLOCK_COLOR_BAR = {
  hero: '#8A2680',
  stats: '#059669',
  voteCTA: '#DC2626',
  meetCandidates: '#2563EB',
  electionBanner: '#D97706',
};

const PAGE_ICON_MAP = {
  Home,
  Vote,
  BarChart3,
  Users,
  PartyPopper,
  CheckCircle,
  Lock,
};

const BLOCK_META = {
  hero: { label: 'Hero (Countdown + Title)', icon: Timer, color: 'bg-purple-100 text-purple-600' },
  meetCandidates: { label: 'Meet Candidates', icon: Users, color: 'bg-blue-100 text-blue-600' },
  stats: { label: 'สถิติผู้โหวต (Stats)', icon: BarChart3, color: 'bg-emerald-100 text-emerald-600' },
  electionBanner: { label: 'Election Banner', icon: ImageIcon, color: 'bg-amber-100 text-amber-600' },
  voteCTA: { label: 'ปุ่มโหวต (Vote CTA)', icon: Vote, color: 'bg-pink-100 text-pink-600' },
};

const DEFAULT_HOME_BLOCKS = [
  { type: 'hero', visible: true, order: 1, config: { showCountdown: true, showStatusBadge: true } },
  { type: 'meetCandidates', visible: true, order: 2, config: {} },
  { type: 'stats', visible: true, order: 3, config: { showPercentage: true, showTotalEligible: true } },
  { type: 'electionBanner', visible: true, order: 4, config: {} },
  { type: 'voteCTA', visible: true, order: 5, config: {} },
];

const DEFAULT_VOTE_CONFIG = {
  gridCols: 'auto',
  cardVariant: 'grid',
  showDivider: false,
  abstainStyle: 'standard',
};

const DEFAULT_THEME = {
  primaryColor: '#8A2680',
  accentColor: '#9333EA',
  borderRadius: 'rounded',
  backgroundStyle: 'gradient-light',
};

function ToggleSwitch({ checked, onChange, label, disabled = false }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer select-none group">
      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${checked ? 'bg-purple-600' : 'bg-slate-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
      </button>
    </label>
  );
}

function BlockConfigForm({ block, onConfigChange }) {
  const { type, config = {} } = block;

  if (type === 'hero') {
    return (
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <ToggleSwitch
          label="แสดง Countdown Timer"
          checked={config.showCountdown !== false}
          onChange={(val) => onConfigChange({ ...config, showCountdown: val })}
        />
        <ToggleSwitch
          label="แสดง Status Badge (ปีการศึกษา)"
          checked={config.showStatusBadge !== false}
          onChange={(val) => onConfigChange({ ...config, showStatusBadge: val })}
        />
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <ToggleSwitch
          label="แสดงความคืบหน้า (%)"
          checked={config.showPercentage !== false}
          onChange={(val) => onConfigChange({ ...config, showPercentage: val })}
        />
        <ToggleSwitch
          label="แสดงจำนวนผู้มีสิทธิ์รวม"
          checked={config.showTotalEligible !== false}
          onChange={(val) => onConfigChange({ ...config, showTotalEligible: val })}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-slate-400">
      <Info className="w-4 h-4 shrink-0" />
      <span className="text-xs">Block นี้ไม่มีตัวเลือกให้ปรับแต่ง (logic locked)</span>
    </div>
  );
}

function TemplateCard({ tpl, isActive, onClick, onShowDetail }) {
  const primaryColor = tpl.colorSwatch?.primary || '#8A2680';
  const secondaryColor = tpl.colorSwatch?.secondary || '#9333EA';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={`relative text-left p-3 rounded-xl border-2 bg-white transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${isActive
          ? 'shadow-md ring-2 ring-offset-2'
          : 'border-slate-200 hover:border-slate-300'
        }`}
      style={isActive ? { borderColor: primaryColor, '--tw-ring-color': `${primaryColor}40` } : undefined}
    >
      {isActive && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </div>
      )}
      {tpl.isLocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3 h-3 text-slate-400" />
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: primaryColor }} />
        <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: secondaryColor }} />
      </div>
      <div className="font-bold text-sm text-slate-700 leading-tight">{tpl.name}</div>
      <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wide mt-0.5">
        {tpl.slug}
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">{tpl.description}</p>

      {/* Pillar 2 — metadata chips */}
      <div className="flex items-center flex-wrap gap-1.5 mt-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
          <Layers className="w-2.5 h-2.5" />{tpl.elementCount ?? '—'} element
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
          <FileText className="w-2.5 h-2.5" />{tpl.pageCount ?? '—'} หน้า
        </span>
        {tpl.isBuiltIn && (
          <span className="inline-flex items-center text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-md">
            ต้นฉบับ
          </span>
        )}
      </div>

      {onShowDetail && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShowDetail(tpl.slug); }}
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#8A2680] transition-colors"
        >
          <Info className="w-3 h-3" /> ดูรายละเอียด
        </button>
      )}
    </div>
  );
}

function PlaceholderPageSectionList({ page, sections, onMove, onToggleVisible }) {
  if (!page) return null;
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const PageIcon = PAGE_ICON_MAP[page.icon] || LayoutGrid;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-slate-50 text-slate-600 p-2.5 rounded-xl">
          <PageIcon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-700">Sections ของ {page.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{page.description}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {sorted.map((section, index) => {
          const isFirst = index === 0;
          const isLast = index === sorted.length - 1;
          const label = SECTION_LABELS[section.type] || section.type;
          return (
            <div
              key={section.type}
              className={`rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all ${!section.visible ? 'opacity-60' : ''
                }`}
            >
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => onMove(index, -1)} disabled={isFirst} className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-0 disabled:cursor-default transition-all">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={() => onMove(index, 1)} disabled={isLast} className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-0 disabled:cursor-default transition-all">
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-700 block truncate">{label}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                      {section.type}
                    </span>
                  </div>
                </div>
                <button onClick={() => onToggleVisible(index)} className={`p-2 rounded-lg transition-all ${section.visible ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}>
                  {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LivePreview({
  selectedPage,
  deviceMode,
  onDeviceChange,
  pageLayout,
  hoveredSection,
  hasUnsavedChanges,
  editorProps,
  resultsSimMode,
  voteSimMode,
  closedSimMode,
  successSimMode,
  editorTokenStyles,
  resolvedTemplate,
}) {
  const isMobile = deviceMode === 'mobile';
  const currentPage = getPageById(selectedPage);

  // P2.1: fit-to-container canvas. Render the page at a fixed desktop design
  // width, then scale it down to fill the (variable) preview column — readable,
  // responsive, and no horizontal bleed (replaces the fixed scale(0.42)+238% hack).
  const DESIGN_W = 1280;
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const [fit, setFit] = useState({ scale: 0.42, height: 650 });

  useEffect(() => {
    if (isMobile) return;
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;
    const measure = () => {
      const bw = box.clientWidth;
      if (!bw) return;
      const scale = Math.min(bw / DESIGN_W, 1);
      const naturalH = content.scrollHeight || content.offsetHeight || 0;
      const height = Math.max(Math.round(naturalH * scale), 200);
      // Idempotent: bail when nothing meaningfully changed. The home preview
      // animates (countdown tick, Framer Motion) so the ResizeObserver fires
      // continuously — without this guard every fire makes a fresh object and
      // re-renders the whole preview tree => visible flicker. Tolerances absorb
      // sub-pixel reflow (height) and the ~0.012 scale wobble a scrollbar
      // toggle would cause; scrollbar-gutter:stable on the box prevents that
      // toggle in the first place.
      setFit((prev) =>
        Math.abs(prev.scale - scale) < 0.005 && Math.abs(prev.height - height) < 2
          ? prev
          : { scale, height }
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(content);
    return () => ro.disconnect();
    // Deps are stable primitives only. Content/size changes are caught by the
    // ResizeObserver itself — putting unstable objects (pageLayout/editorProps/
    // editorTokenStyles) here tore down + recreated the observer every parent
    // render, compounding the churn.
  }, [isMobile, selectedPage, deviceMode]);

  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      const previewData = {
        ...pageLayout,
        elementConfigs: {
          home: editorProps?.elementConfigs || {}
        }
      };
      localStorage.setItem('preview_draft', JSON.stringify(previewData));
      const previewUrl = getPath(`/preview?page=${selectedPage}`);
      window.open(previewUrl, '_blank');
    }
  };

  const renderPreview = (dm) => {
    if (selectedPage === 'home' && editorProps) {
      return (
        <HomeRenderer
          editorMode={true}
          editorData={DUMMY_ELECTION}
          pageLayout={pageLayout}    // ✅ ส่ง pageLayout ไป (เพื่อให้ซ่อนโชว์ได้)
          theme={pageLayout?.theme}  // ✅ ส่ง theme ไป
          resolvedTemplate={resolvedTemplate}  // P-LOG-051: config-driven designs resolve in editor
          editorTokenStyles={editorTokenStyles}  // Day 11: Layer 1/2 token scope
          elementConfigs={editorProps.elementConfigs}
          selectedElement={editorProps.selectedElement}
          hoveredElement={editorProps.hoveredElement}
          onSelectElement={editorProps.onSelectElement}
          onHoverElement={editorProps.onHoverElement}
          onHoverEnd={editorProps.onHoverEnd}
        />
      );
    }
    if (selectedPage === 'results') {
      return (
        <ResultsEditorPreview
          simMode={resultsSimMode}
          selectedElement={editorProps?.selectedElement}
          hoveredElement={editorProps?.hoveredElement}
          onSelectElement={editorProps?.onSelectElement}
          onHoverElement={editorProps?.onHoverElement}
          onHoverEnd={editorProps?.onHoverEnd}
        />
      );
    }
    if (selectedPage === 'vote') {
      return (
        <VoteEditorPreview
          simMode={voteSimMode}
          pageLayout={pageLayout}
          elementConfigs={editorProps?.elementConfigs}
          selectedElement={editorProps?.selectedElement}
          hoveredElement={editorProps?.hoveredElement}
          onSelectElement={editorProps?.onSelectElement}
          onHoverElement={editorProps?.onHoverElement}
          onHoverEnd={editorProps?.onHoverEnd}
        />
      );
    }
    if (selectedPage === 'candidates') {
      return (
        <CandidatesEditorPreview
          pageLayout={pageLayout}
          elementConfigs={editorProps?.elementConfigs}
          selectedElement={editorProps?.selectedElement}
          hoveredElement={editorProps?.hoveredElement}
          onSelectElement={editorProps?.onSelectElement}
          onHoverElement={editorProps?.onHoverElement}
          onHoverEnd={editorProps?.onHoverEnd}
        />
      );
    }
    if (selectedPage === 'closed') {
      return (
        <ClosedEditorPreview
          simMode={closedSimMode}
          elementConfigs={editorProps?.elementConfigs}
          selectedElement={editorProps?.selectedElement}
          hoveredElement={editorProps?.hoveredElement}
          onSelectElement={editorProps?.onSelectElement}
          onHoverElement={editorProps?.onHoverElement}
          onHoverEnd={editorProps?.onHoverEnd}
        />
      );
    }
    if (selectedPage === 'success') {
      return (
        <SuccessEditorPreview
          simMode={successSimMode}
          elementConfigs={editorProps?.elementConfigs}
          selectedElement={editorProps?.selectedElement}
          hoveredElement={editorProps?.hoveredElement}
          onSelectElement={editorProps?.onSelectElement}
          onHoverElement={editorProps?.onHoverElement}
          onHoverEnd={editorProps?.onHoverEnd}
        />
      );
    }
    return (
      <PagePreviewRenderer
        pageId={selectedPage}
        pageLayout={pageLayout}
        deviceMode={dm}
        hoveredSection={hoveredSection}
      />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-bold text-slate-700">Live Preview</span>
          {currentPage && <span className="text-xs text-slate-400">· {currentPage.name}</span>}
          {hasUnsavedChanges && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="ยังไม่ได้เผยแพร่" />}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => onDeviceChange('desktop')} className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${deviceMode === 'desktop' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
              <Monitor className="w-3 h-3" /> Desktop
            </button>
            <button onClick={() => onDeviceChange('mobile')} className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${deviceMode === 'mobile' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
              <Smartphone className="w-3 h-3" /> Mobile
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>
          <button onClick={handleOpenNewTab} title="เปิดในแท็บใหม่" className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={boxRef}
        className="relative bg-slate-100/50 overflow-y-auto overflow-x-hidden"
        style={{ height: '650px', scrollbarGutter: 'stable' }}
        onClickCapture={(e) => {
          const insideEditorElement = e.target.closest('.group\\/editor');
          if (!insideEditorElement) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {/* Non-home previews don't build their own .fms-app scope (home does via
            HomeContent). Inject the editor's effective token + element-var scope
            here so live (unpublished) Tier 2 edits show in the preview, e.g.
            results-stats-bar --rsb-accent. Scoped `.fms-app [data-element]` rules
            only match preview elements; the admin chrome doesn't consume them. */}
        {selectedPage !== 'home' && editorTokenStyles && (
          <style dangerouslySetInnerHTML={{ __html: editorTokenStyles }} />
        )}
        {isMobile ? (
          <div className="mx-auto py-4" style={{ transform: 'scale(0.55)', transformOrigin: 'top center', width: '375px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="rounded-[2.5rem] border-[6px] border-slate-800 overflow-hidden shadow-2xl bg-white relative mx-auto">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-50" />
              <div className="pt-6">{renderPreview('mobile')}</div>
            </div>
          </div>
        ) : (
          <div style={{ height: `${fit.height}px` }}>
            <div
              ref={contentRef}
              className="origin-top-left"
              style={{ transform: `scale(${fit.scale})`, transformOrigin: 'top left', width: `${DESIGN_W}px` }}
            >
              {renderPreview(deviceMode)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PageDesignTab() {
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState(DEFAULT_PAGE);
  const [homeBlocks, setHomeBlocks] = useState(DEFAULT_HOME_BLOCKS);
  const [voteConfig, setVoteConfig] = useState(DEFAULT_VOTE_CONFIG);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [otherPages, setOtherPages] = useState({});
  const [deviceMode, setDeviceMode] = useState('desktop');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  // Pillar 4 — Save as Template (heritage)
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);
  const [pendingPresetId, setPendingPresetId] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState('classic');
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  // Pillar 2 (gallery slice 1) — template detail modal (lazy-loaded full data)
  const [detailSlug, setDetailSlug] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(-1);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [resultsSimMode, setResultsSimMode] = useState('multi');
  const [voteSimMode, setVoteSimMode] = useState('multi');
  const [closedSimMode, setClosedSimMode] = useState('waiting');
  const [successSimMode, setSuccessSimMode] = useState('locked');

  // Slice 1b: per-page Layer 2/3 overrides. The editor hook holds the ACTIVE
  // page's flat maps (editor.elementVars / editor.elementCss); these records
  // hold every OTHER page's maps. They are merged back over the active page via
  // getElementVarsAllPages/getElementCssAllPages on save/publish/dirty so each
  // page's Tier 2/3 edits persist independently under pageLayout.elementVars[page]
  // (the API already validates that per-page shape). configs/variants stay
  // home-scoped for now — they have no non-home editing surface yet.
  const [elementVarsByPage, setElementVarsByPage] = useState({});
  const [elementCssByPage, setElementCssByPage] = useState({});
  const [originalVarsByPage, setOriginalVarsByPage] = useState('{}');
  const [originalCssByPage, setOriginalCssByPage] = useState('{}');
  const prevPageRef = useRef(DEFAULT_PAGE);

  const editor = useEditorState();
  const {
    replaceAllConfigs: editorReplaceAllConfigs,
    replaceAllVariants: editorReplaceAllVariants,
    replaceAllThemeTokens: editorReplaceAllThemeTokens,
    replaceAllElementVars: editorReplaceAllElementVars,
    replaceAllElementCss: editorReplaceAllElementCss,
    commitBaseline: editorMarkSaved,
    clearSelection: editorClearSelection,
    updateElementConfig: editorUpdateElementConfig,
  } = editor;

  // Slice 1b: live mirrors so the page-switch effect can read the latest active
  // maps + per-page records without putting them in its dep array (which would
  // re-run on every keystroke). Assigned each render.
  const editorVarsRef = useRef(editor.elementVars);
  const editorCssRef = useRef(editor.elementCss);
  const varsByPageRef = useRef(elementVarsByPage);
  const cssByPageRef = useRef(elementCssByPage);
  editorVarsRef.current = editor.elementVars;
  editorCssRef.current = editor.elementCss;
  varsByPageRef.current = elementVarsByPage;
  cssByPageRef.current = elementCssByPage;

  // The active page's live editor map merged over the stashed per-page records.
  // An empty active map drops the page key so we never persist `{ page: {} }`.
  const getElementVarsAllPages = useCallback(() => {
    const all = { ...elementVarsByPage };
    if (Object.keys(editor.elementVars || {}).length > 0) all[selectedPage] = editor.elementVars;
    else delete all[selectedPage];
    return all;
  }, [elementVarsByPage, editor.elementVars, selectedPage]);

  const getElementCssAllPages = useCallback(() => {
    const all = { ...elementCssByPage };
    if (Object.keys(editor.elementCss || {}).length > 0) all[selectedPage] = editor.elementCss;
    else delete all[selectedPage];
    return all;
  }, [elementCssByPage, editor.elementCss, selectedPage]);

  // Slice 1b: when the admin switches pages, stash the outgoing page's Layer 2/3
  // edits into the per-page record, then load the incoming page's edits into the
  // editor hook (re-baselined so a plain switch isn't counted dirty — overall
  // cross-page dirtiness is tracked via originalVarsByPage/originalCssByPage).
  useEffect(() => {
    const prev = prevPageRef.current;
    if (prev === selectedPage) return;
    const outVars = editorVarsRef.current || {};
    const outCss = editorCssRef.current || {};
    setElementVarsByPage((m) => {
      const next = { ...m };
      if (Object.keys(outVars).length > 0) next[prev] = outVars; else delete next[prev];
      return next;
    });
    setElementCssByPage((m) => {
      const next = { ...m };
      if (Object.keys(outCss).length > 0) next[prev] = outCss; else delete next[prev];
      return next;
    });
    // Incoming page ≠ outgoing, so the pre-stash record still holds it correctly.
    editorReplaceAllElementVars(varsByPageRef.current[selectedPage] || {}, true);
    editorReplaceAllElementCss(cssByPageRef.current[selectedPage] || {}, true);
    prevPageRef.current = selectedPage;
  }, [selectedPage, editorReplaceAllElementVars, editorReplaceAllElementCss]);

  // Cross-page dirtiness for Layer 2/3 overrides (the hook only tracks the
  // active page). Folded into the Save gate + the unsaved indicator below.
  const multiPageOverridesDirty = useMemo(
    () =>
      JSON.stringify(getElementVarsAllPages()) !== originalVarsByPage ||
      JSON.stringify(getElementCssAllPages()) !== originalCssByPage,
    [getElementVarsAllPages, getElementCssAllPages, originalVarsByPage, originalCssByPage]
  );

  const handleApplyPresetToElement = useCallback(
    (elementId, presetId) => {
      const presetCfg = getElementPresets(elementId)?.[presetId];
      if (!presetCfg) return;
      for (const [key, value] of Object.entries(presetCfg)) {
        editorUpdateElementConfig(elementId, key, value);
      }
    },
    [editorUpdateElementConfig]
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') editorClearSelection();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editorClearSelection]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ title: '', msg: '' });

  // ✅ เพิ่ม State สำหรับแจ้งเตือนบันทึกฉบับร่าง
  const [draftMsg, setDraftMsg] = useState({ title: '', msg: '' });

  const [originalJSON, setOriginalJSON] = useState('');

  const fetchLayout = useCallback(async () => {
    setLoading(true);
    try {
      const encryptedToken = getEncryptedToken();
      const res = await fetch(getPath('/api/admin/page-layout'), {
        headers: { 'x-admin-token': encryptedToken || '' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const home = Array.isArray(data?.home) && data.home.length > 0
        ? data.home.map((b, i) => ({
          type: b.type || 'hero',
          visible: b.visible !== false,
          order: b.order ?? (i + 1),
          config: b.config || {},
        }))
        : DEFAULT_HOME_BLOCKS;

      const vote = data?.vote?.multiParty || DEFAULT_VOTE_CONFIG;
      const loadedTheme = { ...DEFAULT_THEME, ...(data?.theme || {}) };

      const normalizedVote = {
        gridCols: vote.gridCols || 'auto',
        cardVariant: vote.cardVariant || 'grid',
        showDivider: vote.showDivider ?? false,
        abstainStyle: vote.abstainStyle || 'standard',
      };

      const buildDefaultSections = (pageId) => {
        const page = getPageById(pageId);
        if (!page) return [];
        const all = Object.values(page.columns).flat();
        return all.map((sectionId, i) => ({
          type: sectionId,
          order: i + 1,
          visible: true,
          config: {},
        }));
      };

      const loadedOther = {};
      for (const p of EDITABLE_PAGES) {
        if (p.id === 'home' || p.id === 'vote') continue;
        const raw = data?.[p.id];
        if (Array.isArray(raw) && raw.length > 0) {
          loadedOther[p.id] = raw.map((s, i) => ({
            type: s.type || 'unknown',
            order: s.order ?? i + 1,
            visible: s.visible !== false,
            config: s.config || {},
          }));
        } else {
          loadedOther[p.id] = buildDefaultSections(p.id);
        }
      }

      setHomeBlocks(home);
      setVoteConfig(normalizedVote);
      setTheme(loadedTheme);
      setOtherPages(loadedOther);

      const savedElementConfigs = data?.elementConfigs?.home;
      const loadedTemplateId = data?.activeTemplateId || 'classic';
      setActiveTemplateId(loadedTemplateId);
      const initialElementConfigs = savedElementConfigs || getPresetDefaults(loadedTemplateId);
      editorReplaceAllConfigs(initialElementConfigs, true);
      // Day 10: load saved per-element variant overrides as the baseline.
      editorReplaceAllVariants(data?.elementVariants?.home || {}, true);
      // Day 11: load saved Layer 1 token + Layer 2 var overrides as baseline.
      editorReplaceAllThemeTokens(data?.themeTokens || {}, true);
      // Slice 1b: load EVERY page's Layer 2/3 overrides (the API already stores
      // them keyed by page). The records hold all pages; seed the editor hook
      // from the current page's slice. originals snapshot the cross-page dirty.
      const varsByPage = (data?.elementVars && typeof data.elementVars === 'object') ? data.elementVars : {};
      const cssByPage = (data?.elementCss && typeof data.elementCss === 'object') ? data.elementCss : {};
      setElementVarsByPage(varsByPage);
      setElementCssByPage(cssByPage);
      setOriginalVarsByPage(JSON.stringify(varsByPage));
      setOriginalCssByPage(JSON.stringify(cssByPage));
      prevPageRef.current = selectedPage;
      editorReplaceAllElementVars(varsByPage[selectedPage] || {}, true);
      // Pillar 3: load saved per-element custom CSS (Layer 3) as baseline.
      editorReplaceAllElementCss(cssByPage[selectedPage] || {}, true);

      const snapshot = JSON.stringify({ home, vote: normalizedVote, theme: loadedTheme, other: loadedOther });
      setOriginalJSON(snapshot);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to fetch page-layout:', err);
    } finally {
      setLoading(false);
    }
  }, [editorReplaceAllConfigs, editorReplaceAllVariants, editorReplaceAllThemeTokens, editorReplaceAllElementVars]);

  useEffect(() => { fetchLayout(); }, [fetchLayout]);

  const fetchTemplates = useCallback(() => {
    const encryptedToken = getEncryptedToken();
    return fetch(getPath('/api/admin/templates'), {
      credentials: 'include',
      headers: { 'x-admin-token': encryptedToken || '' },
    })
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(data => { setAvailableTemplates(data.templates || []); })
      .catch(err => console.error('[load templates]', err))
      .finally(() => setLoadingTemplates(false));
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  useEffect(() => {
    if (!originalJSON) return;
    const currentJSON = JSON.stringify({ home: homeBlocks, vote: voteConfig, theme, other: otherPages });
    setHasChanges(currentJSON !== originalJSON);
  }, [homeBlocks, voteConfig, theme, otherPages, originalJSON]);

  const activeTemplate = useMemo(
    () => availableTemplates.find(t => t.slug === activeTemplateId) || null,
    [availableTemplates, activeTemplateId]
  );

  const livePageLayout = useMemo(
    () => ({
      home: homeBlocks,
      vote: { multiParty: voteConfig },
      theme,
      // Day 10: thread variant choices so the live HomeContent preview reflects
      // them immediately (HomeContent reads pageLayout.elementVariants.home).
      elementVariants: { home: editor.elementVariants },
      ...otherPages,
    }),
    [homeBlocks, voteConfig, theme, otherPages, editor.elementVariants]
  );

  // Day 11: compile the editor-preview token scope. Active template's base
  // Layer 1 tokens + Layer 2 element vars, overlaid with the admin's live
  // token edits (themeTokens). HomeContent injects this string as the
  // .fms-app <style> in editor mode — closes P-LOG-051 (editor had no scope).
  // Layer 2 var overrides (editor.elementVars) merge in here in Step F.
  // Active template's base Layer 1 tokens (the 15 defaults) for the TokenEditor.
  const activeBaseTokens = useMemo(
    () => (BUILT_IN_TEMPLATES[activeTemplateId] || BUILT_IN_TEMPLATES.classic).theme?.tokens || {},
    [activeTemplateId]
  );

  // The full effective template the editor preview should render against:
  // active built-in base + Layer 1 token edits + Layer 2 var edits. Used both
  // to emit the `.fms-app` token CSS AND as `resolvedTemplate` for the preview
  // so config-driven designs (voteCTA gradient, stats gradient, etc.) resolve
  // faithfully — closing P-LOG-051 (previously resolvedTemplate was null in the
  // editor, so only hardcoded-identity variants rendered; configs collapsed).
  const editorEffectiveTemplate = useMemo(() => {
    const base = BUILT_IN_TEMPLATES[activeTemplateId] || BUILT_IN_TEMPLATES.classic;
    const mergedElements = { ...(base.elements || {}) };
    for (const id of Object.keys(editor.elementVars || {})) {
      const e = mergedElements[id] || {};
      mergedElements[id] = { ...e, vars: { ...(e.vars || {}), ...editor.elementVars[id] } };
    }
    return {
      ...base,
      theme: {
        ...base.theme,
        tokens: { ...(base.theme?.tokens || {}), ...editor.themeTokens },
      },
      elements: mergedElements,
    };
  }, [activeTemplateId, editor.themeTokens, editor.elementVars]);

  const editorTokenStyles = useMemo(() => {
    const base = buildTemplateStyles(editorEffectiveTemplate, '.fms-app');
    // Pillar 3 Tier 3: append per-element custom CSS (Layer 3) so the editor
    // preview reflects it live, same scope the live page uses (HomeContent).
    const css = buildElementCss(editor.elementCss, '.fms-app');
    return css ? `${base}\n\n${css}` : base;
  }, [editorEffectiveTemplate, editor.elementCss]);

  const requestApplyTemplate = (slug) => setPendingPresetId(slug);

  // Pillar 2 — open the detail modal and lazy-fetch the full template record.
  const openTemplateDetail = async (slug) => {
    setDetailSlug(slug);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const token = getEncryptedToken();
      const res = await fetch(getPath(`/api/admin/templates/${slug}`), {
        credentials: 'include',
        headers: token ? { 'x-admin-token': token } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDetailData(data.template || null);
    } catch (err) {
      console.error('Load template detail failed:', err);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeTemplateDetail = () => {
    setDetailSlug(null);
    setDetailData(null);
    setDetailLoading(false);
  };

  const confirmApplyTemplate = async () => {
    if (!pendingPresetId || isApplying) return;
    setIsApplying(true);
    try {
      const encryptedToken = getEncryptedToken();
      const authHeaders = { 'x-admin-token': encryptedToken || '' };
      const applyResp = await fetch(getPath(`/api/admin/templates/${pendingPresetId}/apply`), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders,
      });
      if (!applyResp.ok) {
        const err = await applyResp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${applyResp.status}`);
      }

      const tplResp = await fetch(getPath(`/api/admin/templates/${pendingPresetId}`), {
        credentials: 'include',
        headers: authHeaders,
      });
      if (!tplResp.ok) throw new Error(`Template fetch failed: ${tplResp.status}`);
      const { template } = await tplResp.json();

      const elementConfigs = {};
      for (const [id, entry] of Object.entries(template.elements || {})) {
        elementConfigs[id] = { config: entry.config || {} };
      }
      editorReplaceAllConfigs(elementConfigs);
      // Day 10: applying a template discards per-element variant overrides —
      // the new template's own variant fields become the source of truth
      // (audit Q2). Cleared (not baselined) so the switch is a pending change.
      editorReplaceAllVariants({});
      // Day 11: applying a template also discards token + var overrides — the
      // new template's own tokens/vars become the truth.
      editorReplaceAllThemeTokens({});
      editorReplaceAllElementVars({});

      if (template.theme) {
        setTheme({ ...DEFAULT_THEME, ...template.theme });
      }

      setActiveTemplateId(pendingPresetId);
      editorClearSelection();
      setExpandedIndex(-1);
      router.refresh();
    } catch (err) {
      console.error('[apply template]', err);
      alert(`Apply failed: ${err.message}`);
    } finally {
      setIsApplying(false);
      setPendingPresetId(null);
    }
  };

  const handleMove = (index, direction) => {
    const sorted = [...homeBlocks].sort((a, b) => a.order - b.order);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const temp = sorted[index].order;
    sorted[index] = { ...sorted[index], order: sorted[newIndex].order };
    sorted[newIndex] = { ...sorted[newIndex], order: temp };
    setHomeBlocks(sorted);
    if (expandedIndex === index) setExpandedIndex(newIndex);
    else if (expandedIndex === newIndex) setExpandedIndex(index);
  };

  const handleToggleVisible = (index) => {
    const sorted = [...homeBlocks].sort((a, b) => a.order - b.order);
    sorted[index] = { ...sorted[index], visible: !sorted[index].visible };
    setHomeBlocks(sorted);
  };

  const handleConfigChange = (index, newConfig) => {
    const sorted = [...homeBlocks].sort((a, b) => a.order - b.order);
    sorted[index] = { ...sorted[index], config: newConfig };
    setHomeBlocks(sorted);
  };

  const handleSectionClick = (index) => {
    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const sorted = [...homeBlocks].sort((a, b) => a.order - b.order);
    const [dragged] = sorted.splice(draggedIndex, 1);
    sorted.splice(dropIndex, 0, dragged);
    const reordered = sorted.map((block, i) => ({ ...block, order: i + 1 }));
    setHomeBlocks(reordered);
    if (expandedIndex === draggedIndex) setExpandedIndex(dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleOtherMove = (pageId, index, direction) => {
    const sorted = [...(otherPages[pageId] || [])].sort((a, b) => a.order - b.order);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const temp = sorted[index].order;
    sorted[index] = { ...sorted[index], order: sorted[newIndex].order };
    sorted[newIndex] = { ...sorted[newIndex], order: temp };
    setOtherPages({ ...otherPages, [pageId]: sorted });
  };

  const handleOtherToggleVisible = (pageId, index) => {
    const sorted = [...(otherPages[pageId] || [])].sort((a, b) => a.order - b.order);
    sorted[index] = { ...sorted[index], visible: !sorted[index].visible };
    setOtherPages({ ...otherPages, [pageId]: sorted });
  };

  // ✅ ฟังก์ชันบันทึกฉบับร่างลง LocalStorage
  const handleSaveDraft = () => {
    const previewData = {
      home: homeBlocks,
      vote: { multiParty: voteConfig },
      theme,
      elementConfigs: { home: editor.elementConfigs },
      elementVariants: { home: editor.elementVariants },
      themeTokens: editor.themeTokens,
      elementVars: getElementVarsAllPages(),
      elementCss: getElementCssAllPages(),
      ...otherPages,
    };
    localStorage.setItem('preview_draft', JSON.stringify(previewData));
    setDraftMsg({ title: 'บันทึกฉบับร่างสำเร็จ', msg: 'ข้อมูลถูกเก็บไว้สำหรับดู Preview แล้ว (ยังไม่ขึ้นเว็บจริง)' });
  };

  // ✅ ฟังก์ชันบันทึกขึ้นเว็บจริง (Database)
  const handlePublish = async () => {
    setSaving(true);
    setConfirmOpen(false);

    try {
      const encryptedToken = getEncryptedToken();
      if (!encryptedToken) throw new Error('Auth token generation failed');

      const normalizedBlocks = [...homeBlocks]
        .sort((a, b) => a.order - b.order)
        .map((block, i) => ({ ...block, order: i + 1 }));

      const normalizedOther = {};
      for (const [pageId, sections] of Object.entries(otherPages)) {
        normalizedOther[pageId] = [...sections]
          .sort((a, b) => a.order - b.order)
          .map((s, i) => ({ ...s, order: i + 1 }));
      }

      const publishedVars = getElementVarsAllPages();
      const publishedCss = getElementCssAllPages();

      const payload = {
        home: normalizedBlocks,
        vote: { multiParty: voteConfig },
        theme,
        elementConfigs: { home: editor.elementConfigs },
        elementVariants: { home: editor.elementVariants },
        themeTokens: editor.themeTokens,
        elementVars: publishedVars,
        elementCss: publishedCss,
        ...normalizedOther,
      };

      const res = await fetch(getPath('/api/admin/page-layout'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': encryptedToken,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      setHomeBlocks(normalizedBlocks);
      setOtherPages(normalizedOther);
      setOriginalJSON(JSON.stringify({ home: normalizedBlocks, vote: voteConfig, theme, other: normalizedOther }));
      // Slice 1b: the published per-page records are now the clean baseline so
      // the Save gate clears for every page, not just the active one.
      setElementVarsByPage(publishedVars);
      setElementCssByPage(publishedCss);
      setOriginalVarsByPage(JSON.stringify(publishedVars));
      setOriginalCssByPage(JSON.stringify(publishedCss));
      setHasChanges(false);
      editorMarkSaved();
      setSuccessOpen(true);
    } catch (err) {
      console.error('Publish failed:', err);
      setErrorMsg({ title: 'เผยแพร่ล้มเหลว', msg: err.message || 'เกิดข้อผิดพลาดในการบันทึกขึ้นฐานข้อมูล' });
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // Pillar 4: assemble a frozen snapshot of the current design (deep copy, D5).
  // base built-in template + admin edits (tokens, variants, configs, vars).
  const buildTemplateSnapshot = () => {
    const base = BUILT_IN_TEMPLATES[activeTemplateId] || BUILT_IN_TEMPLATES.classic;
    const theme = {
      ...JSON.parse(JSON.stringify(base.theme || {})),
      tokens: { ...(base.theme?.tokens || {}), ...editor.themeTokens },
    };
    const baseEls = base.elements || {};
    const ids = new Set([
      ...Object.keys(baseEls),
      ...Object.keys(editor.elementConfigs || {}),
      ...Object.keys(editor.elementVariants || {}),
      ...Object.keys(editor.elementVars || {}),
    ]);
    const elements = {};
    for (const id of ids) {
      const b = baseEls[id] || {};
      const entry = {};
      const variant = editor.elementVariants?.[id] ?? b.variant;
      if (variant !== undefined) entry.variant = variant;
      const config = editor.elementConfigs?.[id]?.config ?? b.config;
      if (config !== undefined) entry.config = JSON.parse(JSON.stringify(config));
      const mergedVars = { ...(b.vars || {}), ...(editor.elementVars?.[id] || {}) };
      if (Object.keys(mergedVars).length > 0) entry.vars = mergedVars;
      elements[id] = entry;
    }
    const pages = JSON.parse(JSON.stringify(base.pages || {}));
    return { pages, elements, theme };
  };

  const handleSaveAsTemplate = async () => {
    const name = newTplName.trim();
    if (!name || savingTpl) return;
    setSavingTpl(true);
    try {
      const encryptedToken = getEncryptedToken();
      if (!encryptedToken) throw new Error('Auth token generation failed');
      const snapshot = buildTemplateSnapshot();
      const slug = `tpl-${Date.now().toString(36)}`;
      const res = await fetch(getPath('/api/admin/templates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': encryptedToken },
        body: JSON.stringify({
          slug,
          name,
          description: `บันทึกจาก ${activeTemplate?.name || activeTemplateId}`,
          forkedFrom: activeTemplateId,
          visibility: 'public',
          ...snapshot,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      await fetchTemplates();
      setSaveTplOpen(false);
      setNewTplName('');
      setDraftMsg({ title: 'บันทึก Template สำเร็จ', msg: `"${name}" ถูกเพิ่มเข้าคลัง Template แล้ว — รุ่นต่อไปหยิบไปใช้ได้` });
    } catch (err) {
      console.error('Save as template failed:', err);
      setErrorMsg({ title: 'บันทึก Template ล้มเหลว', msg: err.message || 'เกิดข้อผิดพลาด' });
      setErrorOpen(true);
    } finally {
      setSavingTpl(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">กำลังโหลดการตั้งค่า...</p>
      </div>
    );
  }

  const sortedBlocks = [...homeBlocks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Sticky action topbar (Phase 1) — pinned Save/Publish + current page */}
      <div className="sticky top-0 z-30 -mx-6 md:-mx-8 px-6 md:px-8 py-3 bg-gray-50/85 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-slate-800 shrink-0">ออกแบบหน้าเว็บ</span>
          <span className="text-slate-300 shrink-0">·</span>
          <span className="text-xs text-slate-500 truncate">
            กำลังแก้ไข <span className="font-semibold text-slate-700">{getPageById(selectedPage)?.name}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(hasChanges || editor.hasUnsavedChanges || multiPageOverridesDirty) && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              ยังไม่เผยแพร่
            </span>
          )}
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 rounded-lg text-sm font-semibold border border-slate-200 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">บันทึกร่าง</span>
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={(!hasChanges && !editor.hasUnsavedChanges && !multiPageOverridesDirty) || saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#8A2680] text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:bg-[#751f6c] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#8A2680]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {saving ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
          </button>
        </div>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePreviewOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:shadow-md transition-shadow"
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          ดู Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] gap-6 items-start">
        {/* LEFT INSPECTOR — 2 modes: element selected → PropertyPanel (edit while
            watching the big canvas); else → setup + page structure. */}
        <div className="space-y-4 lg:max-h-[calc(100vh-90px)] lg:overflow-y-auto lg:pr-1 lg:sticky lg:top-[72px]">

      {editor.selectedElement ? (
        <PropertyPanel
          selectedElement={editor.selectedElement}
          elementConfigs={editor.elementConfigs}
          pageLayout={livePageLayout}
          elementVariants={editor.elementVariants}
          onSetVariant={editor.setElementVariant}
          onResetVariant={editor.resetElementVariant}
          elementVars={editor.elementVars}
          onSetVar={editor.setElementVar}
          onResetVar={editor.resetElementVar}
          elementCss={editor.elementCss}
          onSetCss={editor.setElementCss}
          onUpdateConfig={editor.updateElementConfig}
          onApplyPreset={handleApplyPresetToElement}
          onDeselect={editorClearSelection}
        />
      ) : (
       <>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-purple-50 text-[#8A2680] p-2 rounded-lg">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">เลือก Template</h3>
              <p className="text-[11px] text-slate-400">ธีมสำเร็จรูป ปรับแต่งต่อได้</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200 shrink-0">
            ● {activeTemplate?.name || activeTemplateId}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {loadingTemplates && (
            <div className="col-span-2 flex items-center gap-2 text-sm text-slate-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังโหลด templates...
            </div>
          )}
          {!loadingTemplates && availableTemplates.map((tpl) => (
            <TemplateCard
              key={tpl.slug}
              tpl={tpl}
              isActive={activeTemplateId === tpl.slug}
              onClick={() => requestApplyTemplate(tpl.slug)}
              onShowDetail={openTemplateDetail}
            />
          ))}
        </div>

        {/* Pillar 4 — Save as new template (heritage) */}
        <button
          type="button"
          onClick={() => { setNewTplName(''); setSaveTplOpen(true); }}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#8A2680]/40 text-[#8A2680] text-xs font-bold hover:bg-purple-50 transition-colors active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          บันทึกดีไซน์นี้เป็น Template ใหม่
        </button>
      </div>

      {/* Day 11: Theme Token Editor (Tier 1) — global Layer 1 tokens. */}
      {selectedPage === 'home' && (
        <TokenEditor
          tokens={activeBaseTokens}
          overrides={editor.themeTokens}
          onSetToken={editor.setThemeToken}
          onResetToken={editor.resetThemeToken}
          onResetAll={editor.resetAllThemeTokens}
        />
      )}

      {/* Pillar 1 — Element Library (catalog browser + variant swap) */}
      <ElementLibraryPanel
        elementVariants={editor.elementVariants}
        onSelectVariant={editor.setElementVariant}
        onResetVariant={editor.resetElementVariant}
      />

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="bg-purple-50 text-[#8A2680] p-2 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">เลือกหน้าที่ต้องการแก้ไข</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {EDITABLE_PAGES.map((page) => {
            const IconComp = PAGE_ICON_MAP[page.icon] || LayoutGrid;
            const isActive = selectedPage === page.id;
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => setSelectedPage(page.id)}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200 ${isActive ? 'bg-[#8A2680] text-white border-[#8A2680] shadow-md shadow-purple-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-200 hover:text-purple-700'
                  }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {page.name}
              </button>
            );
          })}
        </div>
      </div>


          {selectedPage === 'home' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-50 text-[#8A2680] p-2.5 rounded-xl">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700">Sections หน้าหลัก</h3>
                  <p className="text-xs text-slate-400 mt-0.5">จัดลำดับ เปิด/ปิด และปรับแต่ง Section ต่างๆ บนหน้า Home</p>
                </div>
              </div>

              <div className="space-y-2">
                {sortedBlocks.map((block, index) => {
                  const meta = BLOCK_META[block.type] || { label: block.type, icon: LayoutGrid, color: 'bg-slate-100 text-slate-600' };
                  const IconComp = meta.icon;
                  const isExpanded = expandedIndex === index;
                  const isFirst = index === 0;
                  const isLast = index === sortedBlocks.length - 1;

                  const barColor = BLOCK_COLOR_BAR[block.type] || '#94a3b8';
                  const isDragTarget = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;
                  const isBeingDragged = draggedIndex === index;

                  return (
                    <div
                      key={block.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onMouseEnter={() => setHoveredSection(block.type)}
                      onMouseLeave={() => setHoveredSection(null)}
                      style={{ borderLeft: `4px solid ${barColor}` }}
                      className={`relative rounded-xl border transition-all duration-200 overflow-hidden cursor-grab active:cursor-grabbing ${isExpanded ? 'border-purple-200 bg-purple-50/30 shadow-sm ring-1 ring-purple-100' : 'border-slate-100 hover:border-slate-200 hover:shadow-md hover:bg-slate-50/40'
                        } ${!block.visible ? 'opacity-60' : ''} ${isDragTarget ? 'border-t-[3px] border-t-[#8A2680]' : ''} ${isBeingDragged ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-2 p-3 sm:p-4">
                        <div className="text-slate-300 hover:text-slate-500 shrink-0" aria-hidden="true"><GripVertical size={16} /></div>
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => handleMove(index, -1)} disabled={isFirst} className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-0 disabled:cursor-default transition-all"><ArrowUp size={14} /></button>
                          <button onClick={() => handleMove(index, 1)} disabled={isLast} className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-0 disabled:cursor-default transition-all"><ArrowDown size={14} /></button>
                        </div>
                        <button onClick={() => handleSectionClick(index)} className="flex-1 flex items-center gap-3 text-left min-w-0 group">
                          <div className={`p-2 rounded-lg ${meta.color} transition-transform group-hover:scale-105`}><IconComp className="w-4 h-4" /></div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-slate-700 block truncate">{meta.label}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{block.type}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-auto shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button onClick={() => handleToggleVisible(index)} className={`p-2 rounded-lg transition-all ${block.visible ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}>
                          {block.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 ml-[52px]">
                          <BlockConfigForm block={block} onConfigChange={(newConfig) => handleConfigChange(index, newConfig)} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedPage === 'vote' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
                  โหมดจำลอง
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoteSimMode('multi')}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
                      voteSimMode === 'multi'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    หลายพรรค
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoteSimMode('single')}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
                      voteSimMode === 'single'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    พรรคเดียว
                  </button>
                </div>
              </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-50 text-[#8A2680] p-2.5 rounded-xl"><Vote className="h-6 w-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700">ตั้งค่าหน้าลงคะแนน (Multi-Party)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ปรับแต่ง layout ของหน้าเลือกพรรค</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Grid Columns</h4>
                    <p className="text-xs text-slate-400 mt-0.5">จำนวนคอลัมน์ของ grid แสดงพรรค</p>
                  </div>
                  <select value={voteConfig.gridCols} onChange={(e) => setVoteConfig({ ...voteConfig, gridCols: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                    <option value="auto">Auto (ตามจำนวนพรรค)</option>
                    <option value="2">2 คอลัมน์</option>
                    <option value="3">3 คอลัมน์</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Card Variant</h4>
                    <p className="text-xs text-slate-400 mt-0.5">รูปแบบการ์ดพรรค</p>
                  </div>
                  <select value={voteConfig.cardVariant} onChange={(e) => setVoteConfig({ ...voteConfig, cardVariant: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                    <option value="grid">Grid (โลโก้ + ชื่อ + ลิงก์)</option>
                    <option value="compact">Compact (โลโก้เล็ก + ชื่อ)</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Abstain Style</h4>
                    <p className="text-xs text-slate-400 mt-0.5">รูปแบบปุ่มงดออกเสียง</p>
                  </div>
                  <select value={voteConfig.abstainStyle} onChange={(e) => setVoteConfig({ ...voteConfig, abstainStyle: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                    <option value="standard">Standard (เต็ม)</option>
                    <option value="compact">Compact (เล็ก)</option>
                    <option value="minimal">Minimal (text link)</option>
                  </select>
                </div>
                <div className="flex items-start gap-3 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
                  <Ban className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 space-y-1">
                    <p className="font-bold">ข้อจำกัดของระบบ (Hard Locks):</p>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-600">
                      <li>ทุกพรรคต้องแสดงครบเสมอ — ซ่อนไม่ได้</li>
                      <li>ปุ่มงดออกเสียงต้องแสดงเสมอ — ซ่อนไม่ได้</li>
                      <li>Logic การโหวต (onSelect / submitVote) ไม่สามารถแก้ได้</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            </div>
          )}

          {selectedPage === 'candidates' && (
            <div className="space-y-4">
              <PlaceholderPageSectionList
                page={getPageById('candidates')}
                sections={otherPages['candidates'] || []}
                onMove={(index, dir) => handleOtherMove('candidates', index, dir)}
                onToggleVisible={(index) => handleOtherToggleVisible('candidates', index)}
              />
            </div>
          )}

          {selectedPage === 'closed' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
                  สถานะระบบ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setClosedSimMode('waiting')}
                    className={`px-2 py-2 rounded-md text-xs font-bold transition-all ${
                      closedSimMode === 'waiting'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    ยังไม่เปิด
                  </button>
                  <button
                    type="button"
                    onClick={() => setClosedSimMode('ended')}
                    className={`px-2 py-2 rounded-md text-xs font-bold transition-all ${
                      closedSimMode === 'ended'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    สิ้นสุด
                  </button>
                  <button
                    type="button"
                    onClick={() => setClosedSimMode('paused')}
                    className={`px-2 py-2 rounded-md text-xs font-bold transition-all ${
                      closedSimMode === 'paused'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    ปิดปรับปรุง
                  </button>
                </div>
              </div>
              <PlaceholderPageSectionList
                page={getPageById('closed')}
                sections={otherPages['closed'] || []}
                onMove={(index, dir) => handleOtherMove('closed', index, dir)}
                onToggleVisible={(index) => handleOtherToggleVisible('closed', index)}
              />
            </div>
          )}

          {selectedPage === 'results' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
                  โหมดจำลอง
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResultsSimMode('multi')}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
                      resultsSimMode === 'multi'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    หลายพรรค
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultsSimMode('single')}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
                      resultsSimMode === 'single'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    พรรคเดียว
                  </button>
                </div>
              </div>
              <PlaceholderPageSectionList
                page={getPageById('results')}
                sections={otherPages['results'] || []}
                onMove={(index, dir) => handleOtherMove('results', index, dir)}
                onToggleVisible={(index) => handleOtherToggleVisible('results', index)}
              />
            </div>
          )}

          {selectedPage === 'success' && (
            <div className="space-y-4">
              {/* Sim mode toggle */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
                  สถานะการปลดล็อค
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSuccessSimMode('locked')}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
                      successSimMode === 'locked'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    ยังไม่ทำฟอร์ม
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuccessSimMode('unlocked')}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${
                      successSimMode === 'unlocked'
                        ? 'bg-[#8A2680] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    ทำฟอร์มแล้ว
                  </button>
                </div>
              </div>

              <PlaceholderPageSectionList
                page={getPageById('success')}
                sections={otherPages['success'] || []}
                onMove={(index, dir) => handleOtherMove('success', index, dir)}
                onToggleVisible={(index) => handleOtherToggleVisible('success', index)}
              />
            </div>
          )}

          {!['home', 'vote', 'results', 'candidates', 'closed', 'success'].includes(selectedPage) && (
            <PlaceholderPageSectionList
              page={getPageById(selectedPage)}
              sections={otherPages[selectedPage] || []}
              onMove={(index, dir) => handleOtherMove(selectedPage, index, dir)}
              onToggleVisible={(index) => handleOtherToggleVisible(selectedPage, index)}
            />
          )}

       </>
       )}
        </div>

        <div className="lg:sticky lg:top-[72px] lg:self-start space-y-4">
          {/* Canvas — desktop only */}
          <div className="hidden lg:block">
          <LivePreview
            selectedPage={selectedPage}
            pageLayout={livePageLayout}
            editorTokenStyles={editorTokenStyles}
            resolvedTemplate={editorEffectiveTemplate}
            deviceMode={deviceMode}
            onDeviceChange={setDeviceMode}
            hoveredSection={hoveredSection}
            hasUnsavedChanges={hasChanges}
            resultsSimMode={resultsSimMode}
            voteSimMode={voteSimMode}
            closedSimMode={closedSimMode}
            successSimMode={successSimMode}
            editorProps={
              ['home', 'results', 'vote', 'candidates', 'closed', 'success'].includes(selectedPage)
                ? {
                  elementConfigs: editor.elementConfigs,
                  selectedElement: editor.selectedElement,
                  hoveredElement: editor.hoveredElement,
                  onSelectElement: editor.selectElement,
                  onHoverElement: editor.hoverElement,
                  onHoverEnd: editor.clearHover,
                }
                : null
            }
          />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={pendingPresetId !== null}
        onClose={() => { if (!isApplying) setPendingPresetId(null); }}
        onConfirm={confirmApplyTemplate}
        title="ใช้ Template นี้หรือไม่?"
        message="การตั้งค่าปัจจุบันจะถูกแทนที่ด้วย Template ที่เลือก อย่าลืมกดเผยแพร่หลังจากปรับแต่งเสร็จ"
        variant="primary"
        isLoading={isApplying}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handlePublish}
        title="เผยแพร่ขึ้นเว็บจริง?"
        message="การเปลี่ยนแปลงนี้จะถูกนำไปแสดงผลบนหน้าเว็บจริงของผู้ใช้ทุกคนทันที ยืนยันการเผยแพร่ใช่หรือไม่?"
        variant="primary"
        isLoading={saving}
      />

      {/* ✅ Modal แจ้งเตือนเวลาเซฟฉบับร่าง */}
      <CompletedActionModal
        isOpen={draftMsg.title !== ''}
        onClose={() => setDraftMsg({ title: '', msg: '' })}
        title={draftMsg.title}
        message={draftMsg.msg}
      />

      <CompletedActionModal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="เผยแพร่สำเร็จ!"
        message="การตั้งค่าหน้าเว็บได้รับการอัปเดตและแสดงผลบนเว็บจริงเรียบร้อยแล้ว"
      />

      <ErrorActionModal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        title={errorMsg.title}
        message={errorMsg.msg}
      />

      {/* Pillar 2 — Template detail modal (gallery slice 1) */}
      {detailSlug && (() => {
        const meta = availableTemplates.find((t) => t.slug === detailSlug) || {};
        const swatch = meta.colorSwatch || detailData?.colorSwatch || {};
        const primaryColor = swatch.primary || '#8A2680';
        const secondaryColor = swatch.secondary || '#9333EA';
        const pages = detailData?.pages ? Object.keys(detailData.pages) : [];
        const elements = detailData?.elements ? Object.entries(detailData.elements) : [];
        const creator = meta.isBuiltIn ? 'ทีมพัฒนาระบบ' : (meta.authorName || 'แอดมิน');
        const createdYear = meta.createdAt
          ? new Date(meta.createdAt).getFullYear() + 543
          : null;
        return (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={closeTemplateDetail}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* header */}
              <div className="p-5 border-b border-slate-100 flex items-start gap-3">
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <span className="w-7 h-7 rounded-full border border-white shadow-sm" style={{ backgroundColor: primaryColor }} />
                  <span className="w-7 h-7 rounded-full border border-white shadow-sm -ml-3" style={{ backgroundColor: secondaryColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-800 leading-tight">{meta.name || detailData?.name || detailSlug}</h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{detailSlug}</p>
                </div>
                <button type="button" onClick={closeTemplateDetail} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {detailLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดรายละเอียด...
                  </div>
                )}

                {!detailLoading && (
                  <>
                    {(meta.description || detailData?.description) && (
                      <p className="text-sm text-slate-600">{meta.description || detailData?.description}</p>
                    )}

                    {/* metadata grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500">ผู้สร้าง</span>
                        <span className="font-semibold text-slate-700 ml-auto truncate">{creator}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500">ปีที่สร้าง</span>
                        <span className="font-semibold text-slate-700 ml-auto">{createdYear ? `พ.ศ. ${createdYear}` : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500">Element</span>
                        <span className="font-semibold text-slate-700 ml-auto">{meta.elementCount ?? elements.length}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500">หน้า</span>
                        <span className="font-semibold text-slate-700 ml-auto">{meta.pageCount ?? pages.length}</span>
                      </div>
                    </div>

                    {/* badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {meta.isBuiltIn && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">ต้นฉบับระบบ</span>
                      )}
                      {meta.isLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"><Lock className="w-2.5 h-2.5" /> ล็อก</span>
                      )}
                      {(meta.forkedFrom || detailData?.forkedFrom) && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">แตกจาก: {meta.forkedFrom || detailData?.forkedFrom}</span>
                      )}
                    </div>

                    {/* pages */}
                    {pages.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-600 mb-1.5">หน้าที่มี ({pages.length})</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {pages.map((pid) => (
                            <span key={pid} className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                              {getPageById(pid)?.name || pid}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* elements */}
                    {elements.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-600 mb-1.5">Element ทั้งหมด ({elements.length})</h4>
                        <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
                          {elements.map(([id, entry]) => (
                            <span key={id} className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                              {id}{entry?.variant && entry.variant !== 'default' ? <span className="text-[#8A2680] font-bold">:{entry.variant}</span> : null}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* footer */}
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={closeTemplateDetail}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ปิด
                </button>
                {activeTemplateId !== detailSlug && (
                  <button
                    type="button"
                    onClick={() => { const s = detailSlug; closeTemplateDetail(); requestApplyTemplate(s); }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#8A2680] text-white shadow-sm hover:bg-[#751f6c] transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> ใช้ Template นี้
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pillar 4 — Save as Template name modal */}
      {saveTplOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => !savingTpl && setSaveTplOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-purple-50 text-[#8A2680] p-2.5 rounded-xl">
                <Save className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">บันทึกเป็น Template ใหม่</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 ml-[52px] -mt-1">
              เก็บดีไซน์ปัจจุบันเข้าคลัง — รุ่นต่อไปหยิบไปใช้ได้
            </p>
            <label className="text-xs font-semibold text-slate-600">ชื่อ Template</label>
            <input
              type="text"
              autoFocus
              value={newTplName}
              onChange={(e) => setNewTplName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAsTemplate(); }}
              placeholder="เช่น Aurora 2569"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#8A2680] focus:ring-2 focus:ring-[#8A2680]/15"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setSaveTplOpen(false)}
                disabled={savingTpl}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={!newTplName.trim() || savingTpl}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#8A2680] text-white shadow-sm hover:bg-[#751f6c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingTpl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingTpl ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}