"use client";
import { useState } from 'react';
import { getStatefulElement } from './statefulRegistry';
import { listTemplates, resolveStatefulConfig } from './templateEngine';
import VoteCTABlock from '../../blocks/VoteCTABlock';
import CountdownTimer from '../../CountdownTimer';
import {
  TextInput,
  ColorPickerInput,
  RadiusSelect,
} from './controls/SharedInputs';

// ─────────────────────────────────────────────────────────────
// Local controls — kept inline so this feature is self-contained
// (SharedInputs.js does not export these yet)
// ─────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
      {children}
    </label>
  );
}

function SegmentedToggle({ label, value, onChange, options }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex gap-1 h-9">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange?.(opt.value)}
            className={`flex-1 h-9 text-[11px] font-semibold rounded-lg border transition-colors ${
              value === opt.value
                ? "border-[#8A2680] bg-[#8A2680]/10 text-[#8A2680]"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GenericSelect({ label, value, onChange, options }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#8A2680]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function GradientDirectionSelect({ label, value, onChange }) {
  const options = [
    { value: 'to-r', label: '→ ขวา' },
    { value: 'to-l', label: '← ซ้าย' },
    { value: 'to-t', label: '↑ บน' },
    { value: 'to-b', label: '↓ ล่าง' },
    { value: 'to-tr', label: '↗ บน-ขวา' },
    { value: 'to-tl', label: '↖ บน-ซ้าย' },
    { value: 'to-br', label: '↘ ล่าง-ขวา' },
    { value: 'to-bl', label: '↙ ล่าง-ซ้าย' },
  ];
  return <GenericSelect label={label} value={value} onChange={onChange} options={options} />;
}

function IconSelect({ label, value, onChange }) {
  const options = [
    { value: 'None', label: 'ไม่มี' },
    { value: 'LogIn', label: 'LogIn' },
    { value: 'Vote', label: 'Vote' },
    { value: 'BarChart3', label: 'BarChart3' },
    { value: 'CheckCircle', label: 'CheckCircle' },
    { value: 'ArrowRight', label: 'ArrowRight' },
    { value: 'Sparkles', label: 'Sparkles' },
  ];
  return <GenericSelect label={label} value={value} onChange={onChange} options={options} />;
}

function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left"
      >
        <span className="text-xs font-bold text-slate-700">{title}</span>
        <span className={`text-slate-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * StatefulGallery — renders all states of a stateful element as gallery cards.
 * Each card shows the state's current appearance and has edit controls.
 */
export default function StatefulGallery({
  elementId,
  sourceTemplate = 'classic',
  elementOverrides = {},
  onUpdateOverride,
  onResetState,
  onApplyTemplateToElement
}) {
  const element = getStatefulElement(elementId);
  const [expandedState, setExpandedState] = useState(null);

  if (!element) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Element &quot;{elementId}&quot; is not stateful.
      </div>
    );
  }

  const templates = listTemplates();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-800">{element.label}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Element นี้มี {element.states.length} สถานะ — แก้ไขแต่ละสถานะได้แยกกัน
        </p>
      </div>

      {/* Template Switcher (element-level) */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">
          ใช้ Template กับ element นี้
        </label>
        <div className="grid grid-cols-2 gap-2">
          {templates.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => onApplyTemplateToElement?.(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold border transition-all ${
                sourceTemplate === t.id
                  ? 'bg-white border-[#8A2680] text-[#8A2680] shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: t.previewColor }}
              />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* State Gallery */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
          ทุกสถานะ ({element.states.length})
        </label>

        {element.states.map(state => {
          const overrides = elementOverrides[state.id] || {};
          const resolvedConfig = resolveStatefulConfig(
            sourceTemplate,
            elementId,
            state.id,
            overrides
          );
          const hasCustomization = Object.keys(overrides).length > 0;
          const isExpanded = expandedState === state.id;

          return (
            <div
              key={state.id}
              className={`rounded-lg border transition-all ${
                isExpanded ? 'border-[#8A2680] bg-white shadow-sm' : 'border-slate-200 bg-white'
              }`}
            >
              {/* Card Header — clickable */}
              <button
                type="button"
                onClick={() => setExpandedState(isExpanded ? null : state.id)}
                className="w-full flex items-start justify-between p-3 hover:bg-slate-50 rounded-t-lg text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800">{state.label}</span>
                    {hasCustomization && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">{state.description}</p>
                </div>
                <span className={`text-slate-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Preview — rendered button with resolved config */}
              <div className="px-3 pb-3 pt-1">
                <GalleryPreview elementId={elementId} stateId={state.id} resolvedConfig={resolvedConfig} type={element.type} />
              </div>

              {/* Controls — expanded only */}
              {isExpanded && (
                <div className="border-t border-slate-200 p-3 space-y-3">
                  {hasCustomization && (
                    <button
                      type="button"
                      onClick={() => onResetState?.(state.id)}
                      className="text-[10px] text-slate-500 hover:text-red-600 font-bold"
                    >
                      ↩ Reset state นี้กลับเป็น template defaults
                    </button>
                  )}

                  <StatefulEditor
                    config={resolvedConfig}
                    elementType={element.type}
                    editableText={element.editableText}
                    onChange={(key, value) => onUpdateOverride?.(state.id, key, value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * GalleryPreview — renders the element at small size showing current state.
 */
function GalleryPreview({ elementId, stateId, resolvedConfig, type }) {
  if (elementId === 'voteCTA-button') {
    return (
      <div className="bg-slate-50 rounded-md p-4 flex items-center justify-center min-h-[80px]">
        <VoteCTABlock config={{}} data={{}} resolvedConfig={resolvedConfig} forceState={stateId} />
      </div>
    );
  }

  if (elementId === 'hero-countdown') {
    return (
      <div className="bg-slate-50 rounded-md p-4 flex items-center justify-center min-h-[80px]">
        <CountdownTimer resolvedConfig={resolvedConfig} forceState={stateId} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-md p-4 flex items-center justify-center text-xs text-slate-400">
      Preview not yet available for {elementId}
    </div>
  );
}

/**
 * StatefulEditor — tiered controls: Simple (always) / Advanced / Expert
 */
function StatefulEditor({ config, elementType, editableText, onChange }) {
  const bgType = config.backgroundType || 'solid';

  return (
    <div className="space-y-3">
      {/* ===== SIMPLE TIER ===== */}
      {editableText && (
        <TextInput
          label="ข้อความ"
          value={config.text || ''}
          onChange={(v) => onChange('text', v)}
        />
      )}

      <SegmentedToggle
        label="ประเภทพื้นหลัง"
        value={bgType}
        onChange={(v) => onChange('backgroundType', v)}
        options={[
          { value: 'solid', label: 'สีเดียว' },
          { value: 'gradient', label: 'ไล่สี' }
        ]}
      />

      {bgType === 'solid' ? (
        <ColorPickerInput
          label="สีพื้นหลัง"
          value={config.backgroundColor}
          onChange={(v) => onChange('backgroundColor', v)}
        />
      ) : (
        <>
          <ColorPickerInput
            label="ไล่สีจาก"
            value={config.gradientFrom}
            onChange={(v) => onChange('gradientFrom', v)}
          />
          <ColorPickerInput
            label="ไล่สีถึง"
            value={config.gradientTo}
            onChange={(v) => onChange('gradientTo', v)}
          />
        </>
      )}

      <ColorPickerInput
        label="สีตัวอักษร"
        value={config.textColor}
        onChange={(v) => onChange('textColor', v)}
      />

      <RadiusSelect
        label="มุมโค้ง"
        value={config.borderRadius}
        onChange={(v) => onChange('borderRadius', v)}
      />

      <GenericSelect
        label="ขนาดตัวอักษร"
        value={config.fontSize}
        onChange={(v) => onChange('fontSize', v)}
        options={[
          { value: 'xs', label: 'เล็กมาก' }, { value: 'sm', label: 'เล็ก' },
          { value: 'base', label: 'ปกติ' }, { value: 'lg', label: 'ใหญ่' },
          { value: 'xl', label: 'ใหญ่มาก' }, { value: '2xl', label: 'ใหญ่พิเศษ' }
        ]}
      />

      {/* ===== ADVANCED TIER ===== */}
      <CollapsibleSection title="ขั้นสูง" defaultOpen={false}>
        {bgType === 'gradient' && (
          <>
            <ColorPickerInput
              label="สีกลาง (ไล่สี)"
              value={config.gradientVia || ''}
              onChange={(v) => onChange('gradientVia', v || null)}
            />
            <GradientDirectionSelect
              label="ทิศทางไล่สี"
              value={config.gradientDirection}
              onChange={(v) => onChange('gradientDirection', v)}
            />
          </>
        )}

        <GenericSelect
          label="ความหนาขอบ"
          value={config.borderWidth}
          onChange={(v) => onChange('borderWidth', v)}
          options={[
            { value: '0', label: 'ไม่มี' }, { value: '1', label: 'บาง' },
            { value: '2', label: 'ปกติ' }, { value: '4', label: 'หนา' }
          ]}
        />
        <ColorPickerInput
          label="สีขอบ"
          value={config.borderColor}
          onChange={(v) => onChange('borderColor', v)}
        />

        <GenericSelect
          label="เงา"
          value={config.shadow}
          onChange={(v) => onChange('shadow', v)}
          options={[
            { value: 'none', label: 'ไม่มี' }, { value: 'sm', label: 'เล็ก' },
            { value: 'md', label: 'ปกติ' }, { value: 'lg', label: 'ใหญ่' },
            { value: 'xl', label: 'ใหญ่มาก' }, { value: '2xl', label: 'ใหญ่พิเศษ' }
          ]}
        />
        <ColorPickerInput
          label="สีเงา"
          value={config.shadowColor}
          onChange={(v) => onChange('shadowColor', v)}
        />

        <GenericSelect
          label="น้ำหนักตัวอักษร"
          value={config.fontWeight}
          onChange={(v) => onChange('fontWeight', v)}
          options={[
            { value: 'normal', label: 'ปกติ' }, { value: 'medium', label: 'กลาง' },
            { value: 'semibold', label: 'กึ่งหนา' }, { value: 'bold', label: 'หนา' },
            { value: 'black', label: 'หนามาก' }
          ]}
        />

        <GenericSelect
          label="ระยะในแนวนอน"
          value={config.paddingX}
          onChange={(v) => onChange('paddingX', v)}
          options={[
            { value: '2', label: '2' }, { value: '4', label: '4' },
            { value: '6', label: '6' }, { value: '8', label: '8' },
            { value: '10', label: '10' }, { value: '12', label: '12' }
          ]}
        />
        <GenericSelect
          label="ระยะในแนวตั้ง"
          value={config.paddingY}
          onChange={(v) => onChange('paddingY', v)}
          options={[
            { value: '1', label: '1' }, { value: '2', label: '2' },
            { value: '3', label: '3' }, { value: '4', label: '4' },
            { value: '5', label: '5' }, { value: '6', label: '6' }
          ]}
        />

        <IconSelect
          label="ไอคอน"
          value={config.iconName}
          onChange={(v) => onChange('iconName', v)}
        />
        <GenericSelect
          label="ตำแหน่งไอคอน"
          value={config.iconPosition}
          onChange={(v) => onChange('iconPosition', v)}
          options={[
            { value: 'none', label: 'ไม่แสดง' },
            { value: 'left', label: 'ซ้าย' },
            { value: 'right', label: 'ขวา' }
          ]}
        />
        <GenericSelect
          label="เอฟเฟกต์ Hover"
          value={config.hoverEffect}
          onChange={(v) => onChange('hoverEffect', v)}
          options={[
            { value: 'none', label: 'ไม่มี' }, { value: 'scale', label: 'ขยาย' },
            { value: 'lift', label: 'ลอยขึ้น' }, { value: 'glow', label: 'เรืองแสง' }
          ]}
        />
      </CollapsibleSection>

      {/* ===== EXPERT TIER (advanced CSS) ===== */}
      <CollapsibleSection title="Expert (CSS)" defaultOpen={false}>
        <TextInput
          label="letter-spacing (เช่น 0.05em)"
          value={config.letterSpacing || ''}
          onChange={(v) => onChange('letterSpacing', v || null)}
        />
        <TextInput
          label="line-height (เช่น 1.5)"
          value={config.lineHeight || ''}
          onChange={(v) => onChange('lineHeight', v || null)}
        />
        <TextInput
          label="text-transform (uppercase/lowercase/capitalize)"
          value={config.textTransform || ''}
          onChange={(v) => onChange('textTransform', v || null)}
        />
      </CollapsibleSection>
    </div>
  );
}
