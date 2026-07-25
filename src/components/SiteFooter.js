"use client";

import { useGlobalConfig } from '../contexts/GlobalConfigContext';

export default function SiteFooter({ className = "" }) {
  const config = useGlobalConfig();

  return (
    <footer className={`text-center py-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm ${className}`}>
      {/* slate-400 measured 2.56:1 over the translucent footer wash (AA needs 4.5
          for 14px); slate-500 lands at 4.76:1 and still reads as a quiet footer */}
      <p className="text-slate-500 text-sm">
        © {config.facultyShortEn}@{config.university} {config.copyrightYear}. All Rights Reserved.
      </p>
    </footer>
  );
}
