'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import HomeContent from '../../components/HomeContent';
import PagePreviewRenderer from '../../components/admin/previews/PagePreviewRenderer';
import SuccessEditorPreview from '../../components/admin/SuccessEditorPreview';
import ResultsEditorPreview from '../../components/admin/ResultsEditorPreview';
import VoteEditorPreview from '../../components/admin/VoteEditorPreview';
import CandidatesEditorPreview from '../../components/admin/CandidatesEditorPreview';
import ClosedEditorPreview from '../../components/admin/ClosedEditorPreview';
import {
    DUMMY_ELECTION,
} from '../../utils/editorDummyData';

function PreviewContent() {
    const searchParams = useSearchParams();
    const pageId = searchParams.get('page') || 'home';

    const [draftLayout, setDraftLayout] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem('preview_draft');
            if (savedDraft) {
                setDraftLayout(JSON.parse(savedDraft));
            }
        } catch (error) {
            console.error("Failed to parse preview draft", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">กำลังโหลดหน้าตัวอย่าง...</p>
                </div>
            </div>
        );
    }

    if (!draftLayout) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-slate-100">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">ไม่พบข้อมูลตัวอย่าง</h1>
                    <p className="text-slate-500 mb-6">กรุณากดปุ่มพรีวิวจากหน้าออกแบบใหม่อีกครั้ง</p>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
                    >
                        ปิดหน้านี้
                    </button>
                </div>
            </div>
        );
    }

    const mockParties = DUMMY_ELECTION?.parties || DUMMY_ELECTION?.candidates || [
        { id: '1', number: 1, name: 'The Unity Concord Of FMS 2', slogan: 'หลากหลายเพื่อรวมเป็นหนึ่ง' },
        { id: '2', number: 2, name: 'อะไรไม่รู้ครับ', slogan: 'ทดสอบ' }
    ];
    const mockSpecial = { abstain: { id: 'abstain', name: 'งดออกเสียง' } };

    return (
        <div className="min-h-screen bg-white">
            {/* ส่วนแถบแจ้งเตือนด้านบนว่านี่คือหน้า Preview */}
            <div className="bg-purple-600 text-white text-[10px] py-1 px-4 flex justify-between items-center sticky top-0 z-[9999] font-bold uppercase tracking-widest shadow-md">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Preview Mode: {pageId} (Draft)
                </div>
                <button onClick={() => window.close()} className="hover:underline">Close Preview</button>
            </div>

            {/* เรนเดอร์เนื้อหาตามประเภทหน้า */}
            <main>
                {pageId === 'home' && (
                    <HomeContent
                        editorMode={false}
                        editorData={DUMMY_ELECTION}
                        pageLayout={draftLayout}
                        theme={draftLayout.theme}
                    />
                )}

                {pageId === 'results' && (
                    <ResultsEditorPreview simMode="multi" />
                )}

                {pageId === 'vote' && (
                    <VoteEditorPreview
                        simMode="multi"
                        pageLayout={draftLayout}
                        elementConfigs={draftLayout?.elementConfigs?.vote || {}}
                    />
                )}

                {pageId === 'candidates' && (
                    <CandidatesEditorPreview
                        pageLayout={draftLayout}
                        elementConfigs={draftLayout?.elementConfigs?.candidates || {}}
                    />
                )}

                {pageId === 'closed' && (
                    <ClosedEditorPreview simMode="waiting" />
                )}

                {pageId === 'success' && <SuccessEditorPreview simMode="locked" />}
                {!['home', 'results', 'vote', 'candidates', 'closed', 'success'].includes(pageId) && (
                    <PagePreviewRenderer
                        pageId={pageId}
                        pageLayout={draftLayout}
                        deviceMode="desktop"
                    />
                )}
            </main>
        </div>
    );
}

export default function PreviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">กำลังโหลด...</p>
                </div>
            </div>
        }>
            <PreviewContent />
        </Suspense>
    );
}
