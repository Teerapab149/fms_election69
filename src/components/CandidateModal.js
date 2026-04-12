'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import { ELECTION_CONFIG, ELECTION_YEAR, ELECTION_SLOGAN } from '../utils/electionConfig';
import SimpleLightbox from './vote/SimpleLightbox';
import { getPath } from '../utils/basePath';

export default function CandidateModal({ member, onClose }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [displayImage, setDisplayImage] = useState(member?.modalImageUrl || member?.imageUrl);

  // สีพื้นหลังหลักที่ดึงมาจากรูปภาพ
  const BRAND_BLUE = "#2e3a59";

  useEffect(() => {
    if (member) {
      let img = member.modalImageUrl || member.imageUrl;
      if (img && img.startsWith('/images/')) {
        img = getPath(img);
      }
      setDisplayImage(img);
    }
  }, [member]);

  if (!member) return null;

  // ดึงเลข 3 ตัวท้ายของ Student ID
  const idSuffix = member.studentId ? member.studentId.slice(-3) : "000";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
      {/* 1. Seamless Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* 2. Modal Container */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl flex flex-col md:flex-row min-h-[350px] md:min-h-[500px]"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        {/* SVG Grain Texture Overlay */}
        <div className="pointer-events-none absolute inset-0 z-50 opacity-[0.04] mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

        {/* Giant Background ID (Typography Depth) */}
        <div className="absolute inset-0 z-0 overflow-hidden flex items-end justify-end pointer-events-none pr-6">
          <span className="text-[8rem] md:text-[11rem] font-black text-white opacity-[0.05] leading-none select-none translate-y-2">
            {idSuffix}
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] p-2 text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* LEFT: Image Section with Gradient Mask */}
        <div
          className="relative w-full md:w-[45%] h-[320px] md:h-auto overflow-hidden cursor-zoom-in group"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={displayImage}
            alt={member.name}
            className="w-full h-full object-cover object-top [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] md:[mask-image:linear-gradient(to_right,black_90%,transparent_100%)] group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Zoom Hint */}
          <div className="absolute top-4 left-4 z-20 bg-black/20 backdrop-blur-md p-2 rounded-full text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={20} />
          </div>
        </div>

        {/* RIGHT: Content Section */}
        <div className="relative z-10 w-full md:w-[55%] p-5 md:p-10 flex flex-col justify-center -mt-10 md:mt-0">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-blue-300 text-[10px] font-bold tracking-[0.3em] uppercase mb-3 block">
              Candidate Profile
            </span>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-none tracking-tighter uppercase italic drop-shadow-lg">
              {member.name}
            </h2>

            {/* Info Section - Clean Typography */}
            <div className="mt-6 flex flex-col gap-3 md:gap-6">

              {/* Student ID */}
              <div>
                <p className="text-[10px] font-bold text-blue-200/50 uppercase tracking-[0.2em] mb-1">Student ID</p>
                <p className="text-3xl md:text-4xl font-mono font-bold text-white/90 tracking-widest tabular-nums">
                  {member.studentId || "-"}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:gap-6 w-full">
                {/* Position */}
                <div>
                  <p className="text-[10px] font-bold text-blue-200/50 uppercase tracking-[0.2em] mb-1">Position</p>
                  <p className="text-xl md:text-3xl font-bold text-white leading-tight">
                    {member.position || "Member"}
                  </p>
                </div>

                {/* Major */}
                <div>
                  <p className="text-[10px] font-bold text-blue-200/50 uppercase tracking-[0.2em] mb-1">Major</p>
                  <p className="text-lg md:text-2xl text-white/80 leading-tight">
                    {member.major || "Management"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Watermark */}
            <div className="mt-10 flex items-center space-x-3 text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">
              <div className="h-[1px] w-6 bg-white/20" />
              <span>FMS Election {ELECTION_YEAR}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <SimpleLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={[displayImage || member?.imageUrl || member?.modalImageUrl]}
      />
    </div>
  );
}