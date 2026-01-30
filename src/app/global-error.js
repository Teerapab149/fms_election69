'use client';

import { useEffect } from 'react';
import { Prompt, Kanit } from 'next/font/google';
import './globals.css';

// Reuse fonts from layout to ensure design consistency
const prompt = Prompt({
    subsets: ['thai', 'latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-prompt',
    display: 'swap',
});

const kanit = Kanit({
    subsets: ['thai', 'latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-kanit',
    display: 'swap',
});

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        // Log the error to console
        console.error('Global Error caught:', error);

        // Auto-recovery for ChunkLoadError
        // This often happens after new deployments when users have stagnant cache
        if (error.message?.includes('Loading chunk') || error.name === 'ChunkLoadError') {
            const storageKey = 'fms-chunk-reload-lock';
            const hasReloaded = sessionStorage.getItem(storageKey);

            if (!hasReloaded) {
                // Set flag to prevent infinite reload loop
                sessionStorage.setItem(storageKey, 'true');
                // Force hard reload to clear cache
                window.location.reload();
            }
        }
    }, [error]);

    return (
        <html lang="th">
            <body className={`${prompt.variable} ${kanit.variable} font-sans antialiased bg-gray-50 flex items-center justify-center min-h-screen p-4`}>
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center border border-gray-100">

                    {/* Error Icon */}
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2 font-head">
                        ขออภัย เกิดข้อผิดพลาดบางอย่าง
                    </h2>

                    <p className="text-gray-500 mb-8 font-body">
                        ระบบตรวจพบปัญหาในการโหลดข้อมูล อาจเกิดจากสัญญาณอินเทอร์เน็ตหรือแคชของเบราว์เซอร์
                        <br />
                        <span className="text-sm text-gray-400 mt-2 block break-all">
                            ({error.message || "Unknown error"})
                        </span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('fms-chunk-reload-lock');
                                reset();
                            }}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200"
                        >
                            ลองใหม่อีกครั้ง
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all active:scale-95"
                        >
                            รีเฟรชหน้าเว็บ
                        </button>
                    </div>

                </div>
            </body>
        </html>
    );
}
