"use client";

import { useGlobalConfig } from '../contexts/GlobalConfigContext';

export default function SiteFooter({ className = "" }) {
  const config = useGlobalConfig();

  return (
    <footer className={`text-center py-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm ${className}`}>
      <p className="text-slate-400 text-sm">
        © {config.facultyShortEn}@{config.university} {config.copyrightYear}. All Rights Reserved.
      </p>
    </footer>
  );
}
