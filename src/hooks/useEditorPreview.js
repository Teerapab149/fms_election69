"use client";

// useEditorPreview — hook สำหรับหน้า public ที่ต้องรองรับการ preview จาก admin editor
// ทำงานเฉพาะเมื่อ URL มี ?editorPreview=true เท่านั้น
// ฟัง postMessage จาก admin parent → highlight + scroll
// ในหน้า production ปกติ (ไม่มี query) จะ return { isEditorMode: false } และไม่ทำอะไรเลย

import { useEffect, useState } from 'react';

export function useEditorPreview() {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState(null);

  useEffect(() => {
    // Guard: ทำงานเฉพาะใน browser
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('editorPreview') !== 'true') return;

    setIsEditorMode(true);

    const handleMessage = (event) => {
      const { type, payload } = event.data || {};

      if (type === 'EDITOR_HIGHLIGHT') {
        const sectionType = payload?.sectionType || null;
        setHighlightedSection(sectionType);

        // Scroll ไปยัง section ที่ admin hover/click
        if (sectionType) {
          const el = document.querySelector(`[data-editor-section="${sectionType}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }

      if (type === 'EDITOR_RELOAD') {
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { isEditorMode, highlightedSection };
}
