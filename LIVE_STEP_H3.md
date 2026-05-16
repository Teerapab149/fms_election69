# LIVE_STEP_H3.md — Stateful PropertyPanel with State Gallery UI

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
H-1 created foundation. H-2 bridged voteCTA to live page.
H-3 creates the admin UI: when admin clicks voteCTA-button in preview,
PropertyPanel shows a **State Gallery** — all 6 states rendered side by side,
each with its own Simple/Advanced/Expert edit controls.

## SCOPE (DO NOT EXCEED)
Modify exactly 1 file, create 1 new file:
1. CREATE `src/components/admin/editor/StatefulGallery.js` — gallery UI for multi-state elements
2. MODIFY `src/components/admin/editor/PropertyPanel.js` — detect stateful elements and route to gallery

Do NOT modify H-1 foundation files.
Do NOT modify H-2 files (VoteCTABlock, HomeContent, page.js).
Do NOT modify useEditorState.
Do NOT touch elementRegistry.js (static elements unchanged).
Do NOT install packages.

## PART 1: CREATE `src/components/admin/editor/StatefulGallery.js`

```jsx
"use client";
import { useState } from 'react';
import { getStatefulElement } from './statefulRegistry';
import { listTemplates, resolveStatefulConfig } from './templateEngine';
import {
  TextInput, ColorPickerInput, RadiusSelect, SegmentedToggle,
  IconSelect, GradientDirectionSelect, GenericSelect, CollapsibleSection
} from './controls/SharedInputs';

/**
 * StatefulGallery — renders all states of a stateful element as gallery cards.
 * Each card shows the state's current appearance and has edit controls.
 * 
 * Props:
 *   elementId: string — e.g. "voteCTA-button"
 *   sourceTemplate: string — currently active template id
 *   elementOverrides: object — { [stateId]: { ...partial config } }
 *   onUpdateOverride: (stateId, key, value) => void
 *   onResetState: (stateId) => void
 *   onApplyTemplateToElement: (templateId) => void
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
        Element "{elementId}" is not stateful.
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
                <GalleryPreview config={resolvedConfig} type={element.type} />
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
function GalleryPreview({ config, type }) {
  if (type === 'button') {
    const bgStyle = buildPreviewBg(config);
    const radiusStyle = buildPreviewRadius(config);
    const shadowStyle = buildPreviewShadow(config);
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 font-bold text-sm"
        style={{
          ...bgStyle,
          ...radiusStyle,
          ...shadowStyle,
          color: config.textColor || '#ffffff',
          fontSize: '0.875rem',
          borderWidth: config.borderWidth && config.borderWidth !== '0' ? `${config.borderWidth}px` : undefined,
          borderStyle: config.borderWidth && config.borderWidth !== '0' ? 'solid' : undefined,
          borderColor: config.borderColor || undefined
        }}
      >
        {config.text || 'Button'}
      </div>
    );
  }
  return <div className="text-xs text-slate-400">Preview for type "{type}" not implemented</div>;
}

function buildPreviewBg(cfg) {
  if (cfg.backgroundType === 'gradient') {
    const parts = [cfg.gradientFrom];
    if (cfg.gradientVia) parts.push(cfg.gradientVia);
    parts.push(cfg.gradientTo);
    const dir = cfg.gradientDirection?.replace('to-', 'to ').replace('-', ' ') || 'to right';
    return { backgroundImage: `linear-gradient(${dir}, ${parts.join(', ')})` };
  }
  return { backgroundColor: cfg.backgroundColor || '#8A2680' };
}

function buildPreviewRadius(cfg) {
  const map = { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem', full: '9999px' };
  return { borderRadius: map[cfg.borderRadius] || '0.75rem' };
}

function buildPreviewShadow(cfg) {
  if (!cfg.shadow || cfg.shadow === 'none') return {};
  const map = { sm: '0 1px 2px 0', md: '0 4px 6px -1px', lg: '0 10px 15px -3px', xl: '0 20px 25px -5px', '2xl': '0 25px 50px -12px' };
  const col = cfg.shadowColor ? `${cfg.shadowColor}66` : 'rgba(0,0,0,0.25)';
  return { boxShadow: `${map[cfg.shadow]} ${col}` };
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
```

## PART 2: MODIFY `src/components/admin/editor/PropertyPanel.js`

### Goal
When admin selects a stateful element (voteCTA-button), show StatefulGallery 
instead of the old single-config controls.

### Changes

Add imports at top:
```js
import { isStatefulElement } from './statefulRegistry';
import StatefulGallery from './StatefulGallery';
```

Find the main body of PropertyPanel where it decides what to render based on 
selected element. Before the existing type-based routing:

```jsx
// Check if element is stateful first
if (selectedElement && isStatefulElement(selectedElement)) {
  const sourceTemplate = pageLayout?.sourceTemplate || 'classic';
  const elementOverrides = pageLayout?.elementOverrides?.[selectedElement] || {};

  return (
    <StatefulGallery
      elementId={selectedElement}
      sourceTemplate={sourceTemplate}
      elementOverrides={elementOverrides}
      onUpdateOverride={(stateId, key, value) => {
        onUpdateStatefulOverride?.(selectedElement, stateId, key, value);
      }}
      onResetState={(stateId) => {
        onResetStatefulState?.(selectedElement, stateId);
      }}
      onApplyTemplateToElement={(templateId) => {
        onApplyTemplateToElement?.(selectedElement, templateId);
      }}
    />
  );
}

// Fallback to existing static element controls
// (existing switch/if for type "text" | "button" | "card" | etc.)
```

### Add new props to PropertyPanel signature
```js
export default function PropertyPanel({
  selectedElement,
  elementConfigs,
  pageLayout,               // ← NEW
  onUpdateConfig,
  onApplyPreset,
  onDeselect,
  onUpdateStatefulOverride, // ← NEW
  onResetStatefulState,     // ← NEW
  onApplyTemplateToElement  // ← NEW
}) {
```

These new handlers will be implemented in the admin page tab (next step H-4).
For now, they can be optional (checked with `?.` before calling).

## DO NOT
- Do NOT modify statefulRegistry, stateResolver, templateEngine (H-1 files)
- Do NOT modify VoteCTABlock, HomeContent, page.js (H-2 files)
- Do NOT modify useEditorState hook
- Do NOT remove the existing static element controls (still needed for non-stateful elements)
- Do NOT install packages

## VERIFICATION

1. `npm run build` passes exit 0
2. Admin opens page design tab
3. Click voteCTA-button in preview
4. PropertyPanel shows:
   - Header: "ปุ่มโหวต" + "มี 6 สถานะ"
   - Template switcher: [Classic ●] [Neon]
   - 6 state cards each showing:
     - State label (ยังไม่ล็อกอิน / ยังไม่โหวต / etc.)
     - Mini rendered button preview
     - Click card → expand edit controls (Simple / Advanced / Expert tiers)
5. Other elements (static ones like hero-title) still show old flat controls
6. No save/wire action yet — handlers called but no-op (H-4 wires them)

## REPORT FORMAT

```
Created src/components/admin/editor/StatefulGallery.js — gallery with template switcher, state cards, tiered editor (Simple/Advanced/Expert)
Modified src/components/admin/editor/PropertyPanel.js — route stateful elements to StatefulGallery, keep static element controls
Build: PASS
```

No other commentary.
