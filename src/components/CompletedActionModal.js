'use client';

import { Check, X } from "lucide-react";

export default function CompletedActionModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = "ปิด" 
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl transform scale-100 transition-all animate-scale-up border border-gray-100 overflow-hidden">

                {/* Header & Icon */}
                <div className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[#0EB23E] hover:bg-[#0C8A31] text-white`}>
                        <Check className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p className="text-gray-500 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className={`w-full py-2.5 px-4 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 bg-[#0EB23E] hover:bg-[#0C8A31] text-white disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        ปิด
                    </button>
                </div>

            </div>
        </div>
    );
}