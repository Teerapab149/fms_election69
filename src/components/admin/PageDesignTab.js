'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPath } from '../../utils/basePath';
import { getEncryptedToken } from '../../utils/auth';
import CompletedActionModal from '../CompletedActionModal';
import ErrorActionModal from '../ErrorActionModal';
import ConfirmModal from '../ConfirmModal';
import {
  ArrowUp, ArrowDown, Eye, EyeOff, Save, Loader2, RefreshCw,
  ChevronDown, Info, LayoutGrid, Timer, Users, BarChart3,
  Image as ImageIcon, Vote, Ban, Palette
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────

// Block type metadata for display
const BLOCK_META = {
  hero:            { label: 'Hero (Countdown + Title)',     icon: Timer,      color: 'bg-purple-100 text-purple-600' },
  meetCandidates:  { label: 'Meet Candidates',              icon: Users,      color: 'bg-blue-100 text-blue-600' },
  stats:           { label: 'สถิติผู้โหวต (Stats)',           icon: BarChart3,  color: 'bg-emerald-100 text-emerald-600' },
  electionBanner:  { label: 'Election Banner',              icon: ImageIcon,  color: 'bg-amber-100 text-amber-600' },
  voteCTA:         { label: 'ปุ่มโหวต (Vote CTA)',            icon: Vote,       color: 'bg-pink-100 text-pink-600' },
};

// Fallback when API returns null or malformed data
const DEFAULT_HOME_BLOCKS = [
  { type: 'hero',           visible: true, order: 1, config: { showCountdown: true, showStatusBadge: true } },
  { type: 'meetCandidates', visible: true, order: 2, config: {} },
  { type: 'stats',          visible: true, order: 3, config: { showPercentage: true, showTotalEligible: true } },
  { type: 'electionBanner', visible: true, order: 4, config: {} },
  { type: 'voteCTA',        visible: true, order: 5, config: {} },
];

const DEFAULT_VOTE_CONFIG = {
  gridCols: 'auto',
  cardVariant: 'grid',
  showDivider: false,
  abstainStyle: 'standard',
};

// ─── Sub-Components ─────────────────────────────────────────────

/** Toggle Switch — reusable inline toggle */
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
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          checked ? 'bg-purple-600' : 'bg-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

/** Config form rendered inside the accordion for a specific block */
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

  // Blocks with no configurable options
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-slate-400">
      <Info className="w-4 h-4 shrink-0" />
      <span className="text-xs">Block นี้ไม่มีตัวเลือกให้ปรับแต่ง (logic locked)</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function PageDesignTab() {
  // ── State ──
  const [homeBlocks, setHomeBlocks] = useState(DEFAULT_HOME_BLOCKS);
  const [voteConfig, setVoteConfig] = useState(DEFAULT_VOTE_CONFIG);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track which block is expanded for config editing (-1 = none)
  const [expandedIndex, setExpandedIndex] = useState(-1);

  // Modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ title: '', msg: '' });

  // ── Ref for original state (to detect changes) ──
  const [originalJSON, setOriginalJSON] = useState('');

  // ── Fetch ──
  const fetchLayout = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getPath('/api/admin/page-layout'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Defensive: ensure home array exists and has valid structure
      const home = Array.isArray(data?.home) && data.home.length > 0
        ? data.home.map((b, i) => ({
            type: b.type || 'hero',
            visible: b.visible !== false,
            order: b.order ?? (i + 1),
            config: b.config || {},
          }))
        : DEFAULT_HOME_BLOCKS;

      const vote = data?.vote?.multiParty || DEFAULT_VOTE_CONFIG;

      setHomeBlocks(home);
      setVoteConfig({
        gridCols: vote.gridCols || 'auto',
        cardVariant: vote.cardVariant || 'grid',
        showDivider: vote.showDivider ?? false,
        abstainStyle: vote.abstainStyle || 'standard',
      });

      // Store snapshot for dirty-checking
      const snapshot = JSON.stringify({ home, vote });
      setOriginalJSON(snapshot);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to fetch page-layout:', err);
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLayout(); }, [fetchLayout]);

  // ── Dirty check ──
  useEffect(() => {
    if (!originalJSON) return;
    const currentJSON = JSON.stringify({ home: homeBlocks, vote: voteConfig });
    setHasChanges(currentJSON !== originalJSON);
  }, [homeBlocks, voteConfig, originalJSON]);

  // ── Actions ──

  const handleMove = (index, direction) => {
    const sorted = [...homeBlocks].sort((a, b) => a.order - b.order);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    // Swap the order values
    const temp = sorted[index].order;
    sorted[index] = { ...sorted[index], order: sorted[newIndex].order };
    sorted[newIndex] = { ...sorted[newIndex], order: temp };

    setHomeBlocks(sorted);
    // Move expanded index if needed
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

  const handleSave = async () => {
    setSaving(true);
    setConfirmOpen(false);

    try {
      const encryptedToken = getEncryptedToken();
      if (!encryptedToken) {
        throw new Error('Auth token generation failed');
      }

      // Re-normalize order values 1..N before save
      const normalizedBlocks = [...homeBlocks]
        .sort((a, b) => a.order - b.order)
        .map((block, i) => ({ ...block, order: i + 1 }));

      const payload = {
        home: normalizedBlocks,
        vote: { multiParty: voteConfig },
        // Preserve theme as-is (not editable in Phase 1)
        theme: {
          primaryColor: '#8A2680',
          accentColor: '#9333EA',
          borderRadius: 'rounded',
        },
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

      // Update local state to match saved data
      setHomeBlocks(normalizedBlocks);
      setOriginalJSON(JSON.stringify({ home: normalizedBlocks, vote: voteConfig }));
      setHasChanges(false);
      setSuccessOpen(true);
    } catch (err) {
      console.error('Save failed:', err);
      setErrorMsg({ title: 'บันทึกล้มเหลว', msg: err.message || 'เกิดข้อผิดพลาดในการบันทึก' });
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──

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

      {/* ─── Section A: Home Page Blocks ─────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">Sections หน้าหลัก</h3>
              <p className="text-xs text-slate-400 mt-0.5">จัดลำดับ เปิด/ปิด และปรับแต่ง Section ต่างๆ บนหน้า Home</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                ● ยังไม่ได้บันทึก
              </span>
            )}
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:bg-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>

        {/* Block List */}
        <div className="space-y-2">
          {sortedBlocks.map((block, index) => {
            const meta = BLOCK_META[block.type] || { label: block.type, icon: LayoutGrid, color: 'bg-slate-100 text-slate-600' };
            const IconComp = meta.icon;
            const isExpanded = expandedIndex === index;
            const isFirst = index === 0;
            const isLast = index === sortedBlocks.length - 1;

            return (
              <div
                key={block.type}
                className={`rounded-xl border transition-all duration-200 ${
                  isExpanded
                    ? 'border-purple-200 bg-purple-50/30 shadow-sm ring-1 ring-purple-100'
                    : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                } ${!block.visible ? 'opacity-60' : ''}`}
              >
                {/* Row Header */}
                <div className="flex items-center gap-3 p-3 sm:p-4">

                  {/* Move Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMove(index, -1)}
                      disabled={isFirst}
                      aria-label={`Move ${meta.label} up`}
                      className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-0 disabled:cursor-default transition-all"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMove(index, 1)}
                      disabled={isLast}
                      aria-label={`Move ${meta.label} down`}
                      className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-0 disabled:cursor-default transition-all"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Icon + Label */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0 group"
                  >
                    <div className={`p-2 rounded-lg ${meta.color} transition-transform group-hover:scale-105`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-700 block truncate">{meta.label}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                        {block.type}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-auto shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Visibility Toggle */}
                  <button
                    onClick={() => handleToggleVisible(index)}
                    aria-label={`Toggle visibility for ${meta.label}`}
                    className={`p-2 rounded-lg transition-all ${
                      block.visible
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {block.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                {/* Expanded Config Panel (Accordion) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 ml-[52px]">
                    <BlockConfigForm
                      block={block}
                      onConfigChange={(newConfig) => handleConfigChange(index, newConfig)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Section B: Vote Page Config ─────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <Vote className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-700">ตั้งค่าหน้าลงคะแนน (Multi-Party)</h3>
            <p className="text-xs text-slate-400 mt-0.5">ปรับแต่ง layout ของหน้าเลือกพรรค</p>
          </div>
        </div>

        <div className="space-y-5">

          {/* Grid Columns */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-700">Grid Columns</h4>
              <p className="text-xs text-slate-400 mt-0.5">จำนวนคอลัมน์ของ grid แสดงพรรค</p>
            </div>
            <select
              value={voteConfig.gridCols}
              onChange={(e) => setVoteConfig({ ...voteConfig, gridCols: e.target.value })}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
            >
              <option value="auto">Auto (ตามจำนวนพรรค)</option>
              <option value="2">2 คอลัมน์</option>
              <option value="3">3 คอลัมน์</option>
            </select>
          </div>

          {/* Card Variant */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-700">Card Variant</h4>
              <p className="text-xs text-slate-400 mt-0.5">รูปแบบการ์ดพรรค</p>
            </div>
            <select
              value={voteConfig.cardVariant}
              onChange={(e) => setVoteConfig({ ...voteConfig, cardVariant: e.target.value })}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
            >
              <option value="grid">Grid (โลโก้ + ชื่อ + ลิงก์)</option>
              <option value="compact">Compact (โลโก้เล็ก + ชื่อ)</option>
            </select>
          </div>

          {/* Abstain Style */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-700">Abstain Style</h4>
              <p className="text-xs text-slate-400 mt-0.5">รูปแบบปุ่มงดออกเสียง</p>
            </div>
            <select
              value={voteConfig.abstainStyle}
              onChange={(e) => setVoteConfig({ ...voteConfig, abstainStyle: e.target.value })}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
            >
              <option value="standard">Standard (เต็ม)</option>
              <option value="compact">Compact (เล็ก)</option>
              <option value="minimal">Minimal (text link)</option>
            </select>
          </div>

          {/* Hard Lock Notice */}
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

      {/* ─── Modals ──────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSave}
        title="บันทึกการตั้งค่าหน้าเว็บ?"
        message="การเปลี่ยนแปลงจะมีผลกับหน้า Home และหน้าลงคะแนนทันทีหลังบันทึก"
        variant="primary"
        isLoading={saving}
      />

      <CompletedActionModal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="บันทึกสำเร็จ!"
        message="การตั้งค่าหน้าเว็บได้รับการอัปเดตเรียบร้อยแล้ว"
      />

      <ErrorActionModal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        title={errorMsg.title}
        message={errorMsg.msg}
      />
    </div>
  );
}
