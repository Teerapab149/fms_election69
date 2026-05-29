"use client";

import { X, MousePointerClick } from "lucide-react";
import {
  ColorPickerInput,
  SizeSelect,
  ToggleSwitch,
  TextInput,
  AlignSelect,
  RadiusSelect,
  WeightToggle,
} from "./controls/SharedInputs";
import QuickStyleBar from "./QuickStyleBar";
import VariantPicker from "./VariantPicker.jsx";
import { isStatefulElement, getBinding, getElement } from "./elementCatalog";
import StatefulGallery from "./StatefulGallery";
import { useGlobalConfig, useGlobalConfigUpdate } from "../../../contexts/GlobalConfigContext";

const SECTION_LABELS = {
  hero: "Hero",
  stats: "สถิติ",
  voteCTA: "ปุ่มโหวต",
  meetCandidates: "รู้จักผู้สมัคร",
  electionBanner: "แบนเนอร์",
  successMessage: "ข้อความสำเร็จ",
  googleForm: "ฟอร์มประเมิน",
  header: "ส่วนหัว (Header)",
  partyCardGrid: "กริดรายชื่อพรรค"
};

function Stack({ children }) {
  return <div className="space-y-4">{children}</div>;
}

function TextControls({ config, onChange }) {
  return (
    <Stack>
      <TextInput label="ข้อความ" value={config.text} onChange={(v) => onChange("text", v)} />
      <SizeSelect label="ขนาด" value={config.fontSize} onChange={(v) => onChange("fontSize", v)} />
      <ColorPickerInput label="สี" value={config.color} onChange={(v) => onChange("color", v)} />
      <WeightToggle label="น้ำหนัก" value={config.fontWeight} onChange={(v) => onChange("fontWeight", v)} />
      <AlignSelect label="จัดแนว" value={config.align} onChange={(v) => onChange("align", v)} />
    </Stack>
  );
}

function ButtonControls({ config, onChange }) {
  return (
    <Stack>
      <TextInput label="ข้อความ" value={config.text} onChange={(v) => onChange("text", v)} />
      <ColorPickerInput label="สีพื้นหลัง" value={config.backgroundColor} onChange={(v) => onChange("backgroundColor", v)} />
      <ColorPickerInput label="สีตัวอักษร" value={config.textColor} onChange={(v) => onChange("textColor", v)} />
      <RadiusSelect label="มุมโค้ง" value={config.borderRadius} onChange={(v) => onChange("borderRadius", v)} />
    </Stack>
  );
}

function CardControls({ config, onChange }) {
  return (
    <Stack>
      <ColorPickerInput label="สีพื้นหลัง" value={config.backgroundColor} onChange={(v) => onChange("backgroundColor", v)} />
      <ColorPickerInput label="สีขอบ" value={config.borderColor} onChange={(v) => onChange("borderColor", v)} />
      <RadiusSelect label="มุมโค้ง" value={config.borderRadius} onChange={(v) => onChange("borderRadius", v)} />
      <ToggleSwitch label="แสดง" value={config.visible} onChange={(v) => onChange("visible", v)} />
    </Stack>
  );
}

function ImageControls({ config, onChange }) {
  return (
    <Stack>
      <ToggleSwitch label="แสดง" value={config.visible} onChange={(v) => onChange("visible", v)} />
      <RadiusSelect label="มุมโค้ง" value={config.borderRadius} onChange={(v) => onChange("borderRadius", v)} />
    </Stack>
  );
}

function ToggleControls({ config, onChange }) {
  return (
    <Stack>
      <ToggleSwitch label="แสดง" value={config.visible} onChange={(v) => onChange("visible", v)} />
    </Stack>
  );
}

export default function PropertyPanel({
  selectedElement,
  elementConfigs,
  pageLayout,
  onUpdateConfig,
  onApplyPreset,
  onDeselect,
  onUpdateStatefulOverride,
  onResetStatefulState,
  onApplyTemplateToElement,
  // Day 10 — variant picker
  elementVariants,
  onSetVariant,
  onResetVariant,
}) {
  const globalConfig = useGlobalConfig();
  const { updateField, isUpdating } = useGlobalConfigUpdate();

  // Day 10: variant picker — renders ABOVE the stateful-vs-flat branch so it
  // works for both voteCTA-button (stateful) and banner-section (flat).
  // VariantPicker self-hides for single-variant/unwired elements, so it is
  // safe to drop into either panel unconditionally.
  const variantPickerEl = selectedElement ? (
    <VariantPicker
      elementId={selectedElement}
      currentVariant={elementVariants?.[selectedElement]}
      isOverridden={!!elementVariants && selectedElement in elementVariants}
      onSelect={(variantId) => onSetVariant?.(selectedElement, variantId)}
      onReset={() => onResetVariant?.(selectedElement)}
    />
  ) : null;

  if (!selectedElement) {
    // On mobile nothing shows — no need for an empty placeholder in the bottom sheet.
    return (
      <div className="hidden lg:flex bg-white border border-slate-100 rounded-xl py-10 px-6 flex-col items-center justify-center">
        <MousePointerClick className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-400 font-medium text-center">
          คลิก element ใน preview เพื่อแก้ไข
        </p>
      </div>
    );
  }

  // Stateful element — route to gallery (multi-state editor)
  if (isStatefulElement(selectedElement)) {
    const sourceTemplate = pageLayout?.sourceTemplate || 'classic';
    const elementOverrides = pageLayout?.elementOverrides?.[selectedElement] || {};

    return (
      <div className="bg-white border border-slate-100 lg:rounded-xl rounded-t-2xl lg:shadow-sm shadow-2xl flex flex-col overflow-hidden fixed inset-x-0 bottom-0 z-[70] max-h-[60vh] lg:static lg:z-auto lg:max-h-none">
        {/* Drag handle — mobile only */}
        <div className="lg:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div className="h-1 w-12 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-start justify-between bg-slate-50 px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 truncate">Stateful Element</p>
            <p className="text-xs text-slate-400 mt-0.5">{selectedElement}</p>
          </div>
          <button
            type="button"
            onClick={() => onDeselect?.()}
            className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {variantPickerEl}

        <div className="px-4 py-4 overflow-y-auto lg:max-h-[calc(100vh-200px)]">
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
        </div>
      </div>
    );
  }

  let element = elementConfigs?.[selectedElement];
  if (!element || !element.type) {
    const catalogElement = getElement(selectedElement);
    if (catalogElement) {
      element = {
        type: catalogElement.type,
        label: catalogElement.name,
        section: catalogElement.section,
        config: element?.config || {}
      };
    }
  }

  if (!element) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-6">
        <p className="text-xs text-slate-400">ไม่พบ element: {selectedElement}</p>
      </div>
    );
  }

  const { type, label, section, config = {} } = element;
  const handleChange = (key, value) => onUpdateConfig?.(selectedElement, key, value);

  const renderControls = () => {
    switch (type) {
      case "text": {
        const binding = getBinding(selectedElement);
        if (binding) {
          const currentValue = globalConfig[binding] ?? '';
          const numericFields = ['electionNumber', 'academicYearTh', 'electionCalendarYear', 'copyrightYear'];
          return (
            <Stack>
              <div className="space-y-2">
                <TextInput
                  label="ข้อความ"
                  value={String(currentValue)}
                  onChange={(v) => {
                    const finalValue = numericFields.includes(binding) ? (Number(v) || v) : v;
                    updateField(binding, finalValue);
                  }}
                  disabled={isUpdating}
                />
                <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-xs">🔗</span>
                  <p className="text-[10px] text-blue-700 leading-tight">
                    ข้อความนี้ใช้ทั่วเว็บ (field: <code className="text-blue-900 font-mono">{binding}</code>) —{" "}
                    แก้ที่นี่หรือใน "ตั้งค่าทั่วไป" ก็ sync เหมือนกัน
                  </p>
                </div>
              </div>
              <SizeSelect label="ขนาด" value={config.fontSize} onChange={(v) => handleChange("fontSize", v)} />
              <ColorPickerInput label="สี" value={config.color} onChange={(v) => handleChange("color", v)} />
              <WeightToggle label="น้ำหนัก" value={config.fontWeight} onChange={(v) => handleChange("fontWeight", v)} />
              <AlignSelect label="จัดแนว" value={config.align} onChange={(v) => handleChange("align", v)} />
            </Stack>
          );
        }
        return <TextControls config={config} onChange={handleChange} />;
      }
      case "button": return <ButtonControls config={config} onChange={handleChange} />;
      case "card":   return <CardControls   config={config} onChange={handleChange} />;
      case "image":  return <ImageControls  config={config} onChange={handleChange} />;
      case "toggle": return <ToggleControls config={config} onChange={handleChange} />;
      default:       return <p className="text-xs text-slate-400">ไม่รองรับประเภท: {type}</p>;
    }
  };

  return (
    <div className="bg-white border border-slate-100 lg:rounded-xl rounded-t-2xl lg:shadow-sm shadow-2xl flex flex-col overflow-hidden fixed inset-x-0 bottom-0 z-[70] max-h-[60vh] lg:static lg:z-auto lg:max-h-none">
      {/* Drag handle — mobile only */}
      <div className="lg:hidden flex justify-center pt-2 pb-1 shrink-0">
        <div className="h-1 w-12 rounded-full bg-slate-300" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between bg-slate-50 px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-800 truncate">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            ใน {SECTION_LABELS[section] || section}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDeselect?.()}
          className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          title="ปิด"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Variant picker (Day 10) — above QuickStyleBar per audit Q5 */}
      {variantPickerEl}

      {/* QuickStyleBar */}
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <QuickStyleBar
          elementId={selectedElement}
          currentConfig={config}
          onApplyPreset={onApplyPreset}
        />
      </div>

      {/* Custom controls label */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          ปรับเอง
        </p>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 space-y-4 overflow-y-auto lg:max-h-[calc(100vh-350px)]">
        {renderControls()}
      </div>
    </div>
  );
}
