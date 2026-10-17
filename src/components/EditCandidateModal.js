'use client';
import { getPath } from "../utils/basePath";

import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Loader2, Upload, Hash, User, Image as ImageIcon, Plus, ChevronDown, Check, AlertCircle, Lock, TriangleAlert } from "lucide-react";
import useBallotLock from "../hooks/useBallotLock";
import ConfirmModal from "./ConfirmModal";
import FormSection from "./FormSection";
import { SOCIAL_PLATFORMS, normalizeSocial } from "../utils/socialLinks";
import { buildPartyTheme } from "../utils/partyColors";
import { normalizeImageUrls } from "../utils/imageUrls";

/** [{title, desc}] → ข้อความบรรทัดละนโยบาย คั่นด้วย "::" (คู่กับ textToPolicyArray ฝั่ง API) */
function policiesToText(policies) {
    if (!policies) return '';
    if (typeof policies === 'string') return policies;
    if (!Array.isArray(policies)) return '';
    return policies
        .map((p) => {
            if (typeof p === 'string') return p;
            if (!p || typeof p !== 'object') return '';
            const title = (p.title || '').trim();
            const desc = (p.desc || p.description || '').trim();
            return desc ? `${title} :: ${desc}` : title;
        })
        .filter(Boolean)
        .join('\n');
}

/**
 * แยกช่องนโยบายเป็นรายข้อด้วยกติกาเดียวกับ textToPolicyArray ใน api/admin/candidates/route.js
 * (แบ่งบรรทัด, trim, ทิ้งบรรทัดว่าง, แยกที่ "::" ตัวแรก) ใช้แสดงตัวอย่างสดและเตือนเท่านั้น
 * ข้อมูลที่ส่งไปบันทึกยังเป็นข้อความดิบในช่องเหมือนเดิม ไม่ได้ผ่านฟังก์ชันนี้
 */
function parsePolicyLines(text) {
    return String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '')
        .map((line) => {
            const i = line.indexOf('::');
            const separators = line.split('::').length - 1;
            if (i === -1) {
                return {
                    title: line, desc: '', separators,
                    warn: /\s[:：]\s/.test(line)
                        ? 'ดูเหมือนใช้เครื่องหมาย : ตัวเดียว ระบบแยกหัวข้อกับรายละเอียดด้วย :: (สองตัวติดกัน) เท่านั้น จึงนับทั้งบรรทัดเป็นหัวข้อ'
                        : 'ไม่มี :: ในบรรทัดนี้ ระบบจะนับทั้งบรรทัดเป็นหัวข้อและไม่มีรายละเอียด',
                };
            }
            const title = line.slice(0, i).trim();
            const desc = line.slice(i + 2).trim();
            let warn = '';
            if (!title) warn = 'ไม่มีหัวข้อก่อน :: หน้าพรรคจะได้หัวข้อว่าง';
            else if (separators > 1) warn = 'มี :: มากกว่าหนึ่งตัว ระบบแยกที่ตัวแรก ส่วนที่เหลือทั้งหมดรวมเป็นรายละเอียด';
            else if (!desc) warn = 'มี :: แต่ไม่มีรายละเอียดหลังเครื่องหมาย';
            return { title, desc, separators, warn };
        });
}

export default function EditCandidateModal({ isOpen, onClose, candidate, onUpdate }) {
    const [formData, setFormData] = useState({
        name: '',
        number: '',
        logoMeaning: '',
        slogan: '',
        color: '',
        missions: '',
        policies: ''
    });

    // Social media ของพรรค — เก็บเป็น "สิ่งที่แอดมินพิมพ์" ระหว่างแก้ไข แล้วค่อยแปลงเป็น URL
    // เต็มตอนบันทึก (utils/socialLinks.js) เพื่อให้พิมพ์ @ชื่อ เฉย ๆ ได้
    const [socials, setSocials] = useState({});

    const [error, setError] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const [officialFile, setOfficialFile] = useState(null);
    const [officialPreview, setOfficialPreview] = useState('');

    // Multiple Mobile Hero Images
    const [mobileHeroFiles, setMobileHeroFiles] = useState([]);
    const [mobileHeroPreviews, setMobileHeroPreviews] = useState([]);
    const [existingMobileHeroImages, setExistingMobileHeroImages] = useState([]);

    const [groupFiles, setGroupFiles] = useState([]);
    const [groupPreviews, setGroupPreviews] = useState([]);

    const [members, setMembers] = useState([]);
    const [newMember, setNewMember] = useState({
        name: '',
        studentId: '',
        position: '',
        imageFile: null,
        previewUrl: ''
    });

    const removeGroupImage = (indexToRemove) => {
        setGroupPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const [existingImages, setExistingImages] = useState([]);
    const [newGroupFiles, setNewGroupFiles] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ถามเซิร์ฟเวอร์ตอนเปิดโมดัล: ถ้ามีบัตรในหีบแล้วหรือรับรองผลแล้ว หมายเลขพรรคแก้ไม่ได้
    // เพิ่มและลบพรรคไม่ได้ ด่านจริงอยู่ที่ ballotBoxGuard ฝั่งเซิร์ฟเวอร์ ตรงนี้บอกล่วงหน้าเฉย ๆ
    const lock = useBallotLock(isOpen);
    const lockReasonText = lock.reason === 'anonymized'
        ? 'รับรองผลการเลือกตั้งแล้ว ผลถูกปิดผนึก'
        : `มีบัตรลงคะแนนในหีบแล้ว ${lock.ballots.toLocaleString('th-TH')} ใบ`;

    const getPositionPriority = (position) => {
        if (!position) return 999;
        const p = position.trim();
        if (p.startsWith("นายก")) return 1;
        if (p.startsWith("อุปนายก")) return 2;
        if (p.startsWith("ประธาน")) return 4;
        return 3;
    };

    const sortMembers = (membersList) => {
        return [...membersList].sort((a, b) => {
            const priorityA = getPositionPriority(a.position);
            const priorityB = getPositionPriority(b.position);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Sub-sorting within same priority group
            if (priorityA === 2) { // VP
                if (a.position?.includes("ภายใน") && !b.position?.includes("ภายใน")) return -1;
                if (!a.position?.includes("ภายใน") && b.position?.includes("ภายใน")) return 1;
                if (a.position?.includes("ภายนอก") && !b.position?.includes("ภายนอก")) return -1;
                if (!a.position?.includes("ภายนอก") && b.position?.includes("ภายนอก")) return 1;
            }
            if (priorityA === 3) { // Unique
                if (a.position?.includes("เลขา") && !b.position?.includes("เลขา")) return -1;
                if (!a.position?.includes("เลขา") && b.position?.includes("เลขา")) return 1;
                if (a.position?.includes("เหรัญญิก") && !b.position?.includes("เหรัญญิก")) return -1;
                if (!a.position?.includes("เหรัญญิก") && b.position?.includes("เหรัญญิก")) return 1;
            }

            return 0;
        });
    };


    useEffect(() => {
        if (candidate) {
            setFormData({
                name: candidate.name || '',
                number: candidate.number || '',
                slogan: candidate.slogan || '',
                color: candidate.color || '',
                logoMeaning: candidate.logoMeaning || '',
                missions: Array.isArray(candidate.missions) ? candidate.missions.join('\n') : (candidate.missions || ''),
                // นโยบายเก็บเป็น [{title, desc}] — .join('\n') เฉย ๆ ได้ "[object Object]"
                // ออกมาเต็มช่อง และถ้ากดบันทึกต่อคือทับนโยบายจริงทิ้งทั้งหมด (แก้ 2026-07-28)
                policies: policiesToText(candidate.policies),
            });
            setSocials(candidate.socials && typeof candidate.socials === 'object' ? { ...candidate.socials } : {});
            setPreviewUrl(candidate.logoUrl || '');
            setSelectedFile(null);

            const initialGroupImages = normalizeImageUrls(
                candidate.groupImageUrls || candidate.groupImageUrl
            );

            // Initialize Official (Mobile Hero) Preview
            setOfficialPreview(candidate.officialImageUrl || '');
            setOfficialFile(null);

            // Initialize Mobile Hero (Vertical Team) - Multiple
            const initialMobileHeroImages = normalizeImageUrls(candidate.mobileHeroImage);
            setExistingMobileHeroImages(initialMobileHeroImages);
            setMobileHeroPreviews([]);
            setMobileHeroFiles([]);

            setExistingImages(initialGroupImages);
            setNewGroupFiles([]);

            setGroupPreviews(initialGroupImages);
            setGroupFiles([]);

            // เรียงตาม id ก่อน เพราะ /api/results ไม่รับประกันลำดับ แต่หน้าพรรคสาธารณะอ่านตาม id
            setMembers(sortMembers([...(candidate.members || [])].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))));
        } else {
            setFormData({
                name: '',
                number: '',
                slogan: '',
                color: '',
                logoMeaning: '',
                missions: '',
                policies: ''
            });
            setSocials({});
            setPreviewUrl('');
            setSelectedFile(null);

            setGroupPreviews([]);
            setGroupFiles([]);

            setOfficialPreview('');
            setOfficialFile(null);

            setExistingMobileHeroImages([]);
            setMobileHeroPreviews([]);
            setMobileHeroFiles([]);

            setExistingImages([]);
            setNewGroupFiles([]);

            setMembers([]);
        }
        setNewMember({ name: '', studentId: '', position: '', imageFile: null, previewUrl: '' });
        setError(null);
    }, [candidate, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleOfficialFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
                return;
            }
            setOfficialFile(file);
            setOfficialPreview(URL.createObjectURL(file));
        }
    };

    const handleMobileHeroFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newFiles = [];
            const newPreviews = [];

            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    newFiles.push(file);
                    newPreviews.push({ file, url: URL.createObjectURL(file) });
                }
            });

            setMobileHeroFiles(prev => [...prev, ...newFiles]);
            setMobileHeroPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeNewMobileHeroImage = (index) => {
        setMobileHeroFiles(prev => prev.filter((_, i) => i !== index));
        setMobileHeroPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMobileHeroImage = (index) => {
        setExistingMobileHeroImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleGroupFilesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const validFiles = files.filter(f => f.type.startsWith('image/'));
            const newFilesWithPreview = validFiles.map(f => ({
                file: f,
                preview: URL.createObjectURL(f)
            }));
            setNewGroupFiles(prev => [...prev, ...newFilesWithPreview]);
        }
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index) => {
        setNewGroupFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleMemberChange = (e) => {
        const { name, value } = e.target;
        setNewMember(prev => ({ ...prev, [name]: value }));
    };

    const handleMemberImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewMember(prev => ({
                ...prev,
                imageFile: file,
                previewUrl: URL.createObjectURL(file)
            }));
        }
    };

    const addMember = () => {
        if (!newMember.name || !newMember.studentId) {
            alert("Please fill in at least Name and Student ID");
            return;
        }
        setMembers(prev => {
            const updatedList = [...prev, { ...newMember, tempId: Date.now() }];
            return sortMembers(updatedList);
        });
        setNewMember({ name: '', studentId: '', position: '', imageFile: null, previewUrl: '' });
        setShowPositionList(false);
    };

    // เบอร์ 0 = งดออกเสียง และ -1 = ไม่รับรอง เป็นตัวเลือกที่ระบบสร้างเอง และเบอร์เป็น
    // unique ในฐานข้อมูล — ถ้าปล่อยให้กรอก 0/-1/ติดลบ จะไปชนของระบบแล้วเด้ง
    // "เลขพรรคซ้ำ" ซึ่งไม่ได้บอกสาเหตุจริงเลย กันไว้ตั้งแต่ในฟอร์มดีกว่า
    const partyNumber = parseInt(formData.number, 10);
    const numberIsValid = Number.isInteger(partyNumber) && partyNumber >= 1;
    const isFormValid = formData.name.trim() !== '' && formData.number !== '' && numberIsValid;

    // ตัวอย่างสดของช่องนโยบายและพันธกิจ (ดู parsePolicyLines) ไม่กระทบสิ่งที่ส่งไปบันทึก
    const policyItems = parsePolicyLines(formData.policies);
    const policyWarnCount = policyItems.filter((it) => it.warn).length;
    const missionCount = String(formData.missions || '').split('\n').filter((l) => l.trim() !== '').length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('number', formData.number);
            data.append('logoMeaning', formData.logoMeaning);
            data.append('slogan', formData.slogan);
            data.append('color', formData.color || '');
            data.append('missions', formData.missions);
            data.append('policies', formData.policies);
            data.append('socials', JSON.stringify(socials));
            if (selectedFile) data.append('file', selectedFile);

            // ไม่ส่ง officialImage / mobileHero* อีกแล้ว (ถอดช่องกรอกออก 2026-07-28)
            // API ทั้งสองฟิลด์นี้จะแตะก็ต่อเมื่อได้รับค่ามาเท่านั้น การไม่ส่งจึงแปลว่า
            // "ไม่เปลี่ยน" — ภาพเก่าที่พรรคเคยอัปไว้ยังอยู่ครบและยังถูกใช้เป็นตัวสำรอง

            data.append('existingGroupImages', JSON.stringify(existingImages));
            newGroupFiles.forEach((item) => {
                data.append('groupFiles', item.file);
            });

            const sortedMembers = sortMembers(members);

            const membersPayload = sortedMembers.map(m => ({
                name: m.name,
                studentId: m.studentId,
                position: m.position,
                existingImageUrl: (m.previewUrl && !m.previewUrl.startsWith('blob:')) ? m.previewUrl : null
            }));
            data.append('members', JSON.stringify(membersPayload));

            sortedMembers.forEach((m) => {
                if (m.imageFile) {
                    data.append(`member_file_${m.studentId}`, m.imageFile);
                }
            });

            // Admin identity = httpOnly admin_token cookie (sent automatically; P0-1)
            let res;
            if (candidate) {
                res = await fetch(getPath(`/api/admin/candidates?id=${candidate.id}`), {
                    method: 'PUT',
                    body: data,
                    credentials: 'include',
                });
            } else {
                res = await fetch(getPath(`/api/admin/candidates`), {
                    method: 'POST',
                    body: data,
                    credentials: 'include',
                });
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Update failed');
            }

            if (onUpdate) onUpdate(candidate ? 'UPDATE' : 'CREATE');
            onClose();

        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(getPath(`/api/admin/candidates?id=${candidate.id}`), {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) {
                throw console.log(res)
            }
            if (onUpdate) onUpdate('DELETE');
            setShowDeleteConfirm(false);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };


    // Esc ปิดหน้าต่าง — คนที่เปิดผิดใบมักกด Esc ก่อนหาปุ่มยกเลิกเสมอ
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-scale-up border border-gray-100 flex flex-col">

                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    {/* หัวข้อต้องบอกว่ากำลังทำอะไรอยู่ — เดิมเขียน "แก้ไข" แม้ตอนสร้างพรรคใหม่
                        ทั้งที่ปุ่มล่างเขียน "สร้าง" ทำให้คนกดเข้ามาครั้งแรกไม่แน่ใจว่ามาถูกที่ */}
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#8A2680]" />
                        {candidate ? 'แก้ไขข้อมูลพรรค' : 'เพิ่มพรรคใหม่'}
                    </h3>
                    {/* type="button" — ไม่ระบุ = submit โดยปริยาย (ดูหมายเหตุเดียวกันใน
                        EditCandidateMemberModal) */}
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 animate-shake">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* ลำดับของฟอร์มนี้เรียงตาม "อะไรจำเป็นก่อน" ไม่ใช่ตามที่โค้ดเคยเขียนไว้:
                        เดิมเปิดมาเจอช่องอัปโหลดรูปสองช่องก่อนจะถามชื่อพรรคด้วยซ้ำ
                        คนกรอกครั้งแรกจึงไม่รู้ว่าต้องมีอะไรบ้างถึงจะกดสร้างได้ */}
                    {lock.locked && candidate && (
                        <div className="mb-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3" data-testid="ballot-lock-banner">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <div className="text-xs leading-relaxed text-amber-900">
                                <p className="font-bold">{lockReasonText}</p>
                                <p className="mt-0.5">
                                    จึงเปลี่ยนหมายเลขพรรคและลบพรรคไม่ได้ เพราะบัตรที่ลงคะแนนไปแล้วอ้างอิงรายชื่อพรรคชุดนี้ ส่วนชื่อ สโลแกน รูป นโยบาย และสมาชิก ยังแก้ได้ตามปกติ
                                </p>
                            </div>
                        </div>
                    )}

                    {lock.locked && !candidate ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5" data-testid="ballot-lock-add-blocked">
                            <div className="flex items-center gap-2 text-amber-800">
                                <Lock className="h-5 w-5 shrink-0" />
                                <h4 className="text-base font-bold">เพิ่มพรรคใหม่ไม่ได้ในตอนนี้</h4>
                            </div>
                            <p className="mt-2 text-sm font-medium text-amber-900">{lockReasonText}</p>
                            <p className="mt-2 text-sm leading-relaxed text-amber-900">
                                การเพิ่มพรรคหลังเริ่มนับบัตรทำให้ชุดตัวเลือกบนบัตรไม่เท่ากัน คนที่ลงคะแนนไปแล้วไม่เคยเห็นพรรคนี้ และผลนับจะไม่ตรงกับบัตรในหีบ
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-amber-900">
                                แก้เนื้อหาของพรรคที่มีอยู่ (ชื่อ สโลแกน รูป นโยบาย สมาชิก) ยังทำได้ กดปิดแล้วคลิกการ์ดของพรรคนั้น
                                ถ้าเป็นการเตรียมการเลือกตั้งรอบใหม่ ให้ล้างข้อมูลปีก่อนตามคู่มือประจำปีก่อน แล้วค่อยเพิ่มพรรค
                            </p>
                        </div>
                    ) : (
                    <form id="candidate-form" onSubmit={handleSubmit} className="space-y-6">

                        <FormSection n="1" title="ข้อมูลหลัก" hint="กรอกหมายเลขกับชื่อพรรคแล้วกดสร้างได้เลย หัวข้อ 2 ถึง 4 มาเติมทีหลังได้" required>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลข <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="number"
                                            name="number"
                                            value={formData.number}
                                            onChange={handleChange}
                                            required
                                            disabled={lock.locked && !!candidate}
                                            className={`pl-10 w-full rounded-xl border px-4 py-2 text-gray-900 focus:ring-2 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${error && error.includes('หมายเลข') ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'}`}
                                            placeholder="1"
                                        />
                                    </div>
                                    {lock.locked && candidate ? (
                                        <p className="mt-1 flex items-start gap-1 text-xs font-medium text-amber-700">
                                            <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
                                            <span>เปลี่ยนหมายเลขไม่ได้แล้ว ({lockReasonText})</span>
                                        </p>
                                    ) : formData.number !== '' && !numberIsValid ? (
                                        <p className="mt-1 text-xs font-medium text-red-500">
                                            ต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ขึ้นไป เบอร์ 0 และ -1 ระบบใช้สำหรับ &ldquo;งดออกเสียง&rdquo; และ &ldquo;ไม่รับรอง&rdquo;
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-xs text-gray-400">เบอร์ที่นักศึกษาจะเห็นบนบัตรเลือกตั้ง สีอัตโนมัติของพรรคก็อิงเบอร์นี้</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพรรค <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ความหมายสัญลักษณ์ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span></label>
                                    <textarea
                                        name="logoMeaning"
                                        value={formData.logoMeaning}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">อธิบายสั้น ๆ ว่าโลโก้สื่อถึงอะไร แสดงในหน้าแนะนำพรรค ถ้าเว้นว่าง หน้าพรรคจะขึ้นข้อความว่ายังไม่ได้ระบุ</p>
                                </div>
                            </div>
                        </FormSection>

                        <FormSection n="2" title="โลโก้ ภาพ และสีของพรรค" hint="ข้ามได้ กลับมาใส่ทีหลังได้ทุกเมื่อ">
                            <div className="space-y-4">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                            {previewUrl ? (
                                                <img src={previewUrl.startsWith('blob:') ? previewUrl : getPath(previewUrl)} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-gray-300" />
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 bg-white border border-gray-200 p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 text-[#8A2680]">
                                            <Upload className="w-4 h-4" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-400">โลโก้พรรค กดที่ปุ่มอัปโหลดมุมขวาล่าง</p>
                                </div>

                                {/* ช่องนี้คือช่องเดียวที่ใช้แล้ว — เดิมมีช่อง "รูปหมู่แนวตั้ง (Mobile SingleVote)"
                                    กับ "รูปทีมแนวตั้งหลายรูป" แยกอยู่อีกหัวข้อ เพราะตอนนั้น original บนมือถือ
                                    ใช้ภาพชุดเดียวกับจอใหญ่ไม่ได้ · ตอนนี้ทุกตระกูลใช้ภาพหมู่แนวนอนชุดเดียวกัน
                                    หมดแล้ว สองช่องนั้นจึงถูกถอดออก (2026-07-28) ข้อมูลเก่าที่เคยอัปไว้ยังอยู่ใน
                                    ฐานข้อมูลและถูกใช้เป็นตัวสำรองต่อไป แค่ไม่ต้องกรอกเพิ่มอีก */}
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ภาพหมู่ / ภาพกิจกรรมพรรค <span className="text-gray-400 font-normal">(เลือกได้หลายรูป ไม่ใส่ก็ได้)</span>
                                    </label>
                                    <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                                        <b>ภาพแรก</b> = ภาพหมู่แนวนอนที่โชว์บนหน้าโหวตและหน้าแนะนำพรรค (แนะนำแนวนอน)
                                        <br />
                                        <b>ภาพที่เหลือ</b> = แกลเลอรีในหน้าแนะนำพรรค เช่น ภาพกิจกรรมหรือภาพหาเสียง
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {existingImages.map((src, idx) => (
                                            <div key={`old-${idx}`} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                                <img src={src.startsWith('blob:') ? src : getPath(src)} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        {newGroupFiles.map((item, idx) => (
                                            <div key={`new-${idx}`} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-green-200 group">
                                                <img src={item.preview} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        <label className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                            <div className="bg-white p-1.5 rounded-full shadow-sm mb-1">
                                                <Plus className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <span className="text-[10px] text-gray-500">เพิ่มรูป</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={handleGroupFilesChange}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">สีประจำพรรค <span className="text-gray-400 font-normal">(ไม่บังคับ)</span></label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            name="color"
                                            value={formData.color || '#7fc8ff'}
                                            onChange={handleChange}
                                            className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer bg-white p-1"
                                            aria-label="เลือกสีประจำพรรค"
                                        />
                                        <input
                                            type="text"
                                            name="color"
                                            value={formData.color || ''}
                                            onChange={handleChange}
                                            placeholder="#7FC8FF เว้นว่าง = สีอัตโนมัติ"
                                            className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        {formData.color ? (
                                            <button
                                                type="button"
                                                onClick={() => handleChange({ target: { name: 'color', value: '' } })}
                                                className="text-xs text-gray-500 hover:text-purple-600 whitespace-nowrap"
                                            >
                                                ใช้สีอัตโนมัติ
                                            </button>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">เว้นว่างได้ ระบบเลือกสีให้เองจากเบอร์พรรค ถ้าเลือกสีเอง ระบบจะปรับความสว่างให้เข้ากับโทนเว็บ</p>
                                    <details className="mt-1">
                                        <summary className="cursor-pointer select-none text-xs font-medium text-[#8A2680] hover:underline">ทำไมสีที่ใช้จริงต่างจากที่เลือก</summary>
                                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                            สีอัตโนมัติไล่ตามเบอร์พรรค (เบอร์ 1 ฟ้า เบอร์ 2 ชมพู เบอร์ 3 เขียว ไม่ซ้ำกัน) ถ้าเลือกสีเอง ระบบใช้เฉพาะ &ldquo;เฉดสี&rdquo; แล้วปรับความสว่างให้เข้าโทนเว็บเสมอ
                                            เช่น เลือกน้ำเงินกรมท่าจะได้ฟ้าพาสเทลเฉดเดียวกัน เพราะสีนี้ถูกใช้เป็นพื้นหลังของตัวหนังสือและเป็นแท่งกราฟบนพื้นครีม ถ้าเข้มหรือจางเกินไปจะอ่านไม่ออก
                                            ดูสีจริงที่จะใช้ได้ในกล่องด้านล่าง
                                        </p>
                                    </details>

                                    {/* Live preview — the full colour SET the site derives from this one pick */}
                                    {(() => {
                                        const t = buildPartyTheme(
                                            { color: formData.color, number: formData.number },
                                            Math.max(0, (parseInt(formData.number) || 1) - 1)
                                        );
                                        const swatches = [
                                            { c: t.soft, label: 'พาสเทล' },
                                            { c: t.main, label: 'เข้ม' },
                                            { c: t.textOnLight, label: 'ตัวอักษร' },
                                        ];
                                        return (
                                            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                        ชุดสีที่ระบบจะใช้กับพรรคนี้
                                                    </span>
                                                    {/* เดิมเขียนว่า "อัตโนมัติตามลำดับพรรค" ทั้งที่ตอนยังไม่กรอกเบอร์
                                                        มันโชว์สีของเบอร์ 1 อยู่ คนเปิดมาเพิ่มพรรคที่สองเลยเห็นฟ้า
                                                        เหมือนพรรคแรกแล้วนึกว่าระบบไม่เปลี่ยนสีให้ */}
                                                    <span className="text-[10px] text-gray-400">
                                                        {formData.color
                                                            ? 'เฉดที่เลือก โทนของระบบ'
                                                            : numberIsValid
                                                                ? `อัตโนมัติจากเบอร์ ${partyNumber}`
                                                                : 'กรอกเบอร์พรรคก่อน'}
                                                    </span>
                                                </div>
                                                <div className="flex items-stretch gap-2">
                                                    {swatches.map((s) => (
                                                        <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                                                            <div className="w-full h-9 rounded-lg border border-gray-300" style={{ backgroundColor: s.c }} />
                                                            <span className="text-[9px] text-gray-500">{s.label}</span>
                                                            <span className="text-[8px] font-mono text-gray-400 uppercase">{s.c}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 h-2.5 rounded-full border border-gray-300" style={{ background: t.gradient }} />
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </FormSection>

                        <FormSection n="3" title="เนื้อหาแนะนำพรรค" hint="ทั้งหมดไม่บังคับ ใส่แล้วจะไปแสดงในหน้าแนะนำพรรคที่นักศึกษาเห็น">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">สโลแกน</label>
                                    <textarea
                                        name="slogan"
                                        value={formData.slogan}
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">เว้นว่างได้ ระบบจะจัดหน้าให้พอดีเอง</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">พันธกิจ (Missions)</label>
                                    <textarea
                                        name="missions"
                                        value={formData.missions}
                                        onChange={handleChange}
                                        rows="8"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        ขึ้นบรรทัดใหม่เพื่อแยกข้อ
                                        {missionCount > 0 ? ` (ตอนนี้ ${missionCount} ข้อ)` : ''}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">นโยบาย (Policies)</label>
                                    <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
                                        หนึ่งบรรทัดต่อหนึ่งนโยบาย คั่นหัวข้อกับรายละเอียดด้วย <code className="rounded bg-slate-100 px-1">::</code>
                                        <br />
                                        ตัวอย่าง <span className="text-slate-400">ยกระดับโครงการเดิม :: ปรับรูปแบบให้เข้ากับยุคสมัย</span>
                                    </p>
                                    <textarea
                                        name="policies"
                                        value={formData.policies}
                                        onChange={handleChange}
                                        rows="8"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">ขึ้นบรรทัดใหม่เพื่อแยกข้อ</p>

                                    {policyItems.length > 0 && (
                                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid="policy-preview">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-[11px] font-semibold text-slate-500">ตัวอย่างที่จะขึ้นหน้าพรรค ({policyItems.length} ข้อ)</span>
                                                {policyWarnCount > 0 && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">ควรตรวจ {policyWarnCount} ข้อ</span>
                                                )}
                                            </div>
                                            <ol className="space-y-2">
                                                {policyItems.map((it, idx) => (
                                                    <li key={idx} className="rounded-lg bg-white border border-slate-200 px-3 py-2" data-testid="policy-item">
                                                        <p className="text-sm font-bold text-slate-800 break-words">
                                                            <span className="mr-1.5 text-xs font-medium text-slate-400 tabular-nums">{idx + 1}.</span>
                                                            {it.title || <span className="text-slate-400 font-normal">(ไม่มีหัวข้อ)</span>}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-slate-600 break-words">
                                                            {it.desc || <span className="text-slate-400">ไม่มีรายละเอียด</span>}
                                                        </p>
                                                        {it.warn && (
                                                            <p className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-amber-700" data-testid="policy-warn">
                                                                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                                                                <span>{it.warn}</span>
                                                            </p>
                                                        )}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FormSection>

                        <FormSection n="4" title="Social media ของพรรค" hint="ใส่ช่องไหนก็ได้ ที่ใส่ไว้จะไปขึ้นในหน้าแนะนำพรรคให้นักศึกษาตามข่าวพรรคต่อได้ ถ้าปล่อยว่างทุกช่อง ส่วนนี้จะไม่แสดงในหน้าพรรคเลย">
                            <div className="space-y-3">
                                {SOCIAL_PLATFORMS.map((p) => {
                                    const typed = socials[p.key] || '';
                                    const preview = normalizeSocial(p.key, typed);
                                    const invalid = typed.trim() !== '' && !preview;
                                    return (
                                        <div key={p.key}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{p.label}</label>
                                            <input
                                                type="text"
                                                value={typed}
                                                onChange={(e) => setSocials((s) => ({ ...s, [p.key]: e.target.value }))}
                                                placeholder={p.placeholder}
                                                className={`w-full rounded-xl border px-4 py-2 text-gray-900 outline-none focus:ring-2 ${invalid ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'}`}
                                            />
                                            {invalid ? (
                                                <p className="mt-1 text-xs font-medium text-red-500">ลิงก์นี้ใช้ไม่ได้ ให้ใส่ชื่อผู้ใช้ หรือลิงก์ที่ขึ้นต้นด้วย https://</p>
                                            ) : preview ? (
                                                <p className="mt-1 text-xs text-slate-400 break-all">จะบันทึกเป็น {preview}</p>
                                            ) : null}
                                        </div>
                                    );
                                })}
                                <p className="text-[11px] leading-relaxed text-slate-400">
                                    พิมพ์แค่ชื่อผู้ใช้ก็ได้ เช่น <code className="rounded bg-slate-100 px-1">@samofms</code> ระบบจะเติมลิงก์ให้เอง 
                                    ลบข้อความในช่องให้ว่างเพื่อเอาช่องทางนั้นออกจากหน้าเว็บ
                                </p>
                                <p className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
                                    ส่วน &ldquo;ช่องทางติดต่อพรรค&rdquo; ในหน้าพรรคจะแสดงก็ต่อเมื่อมีอย่างน้อยหนึ่งช่องที่กรอกไว้ 
                                    ถ้าไม่กรอกเลย หน้าพรรคจะไม่มีส่วนนี้ ไม่ได้ขึ้นเป็นช่องว่าง
                                </p>
                            </div>
                        </FormSection>


                    </form>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center border-t border-gray-100 shrink-0">
                    <div>
                        {candidate && (
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                disabled={isLoading || lock.locked}
                                title={lock.locked ? `ลบพรรคไม่ได้แล้ว (${lockReasonText})` : undefined}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            >
                                <Trash2 className="w-4 h-4" /> ลบพรรค
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>
                        {!(lock.locked && !candidate) && (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !isFormValid}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${!isFormValid
                                ? 'bg-gray-300 text-gray-500'
                                : 'bg-[#8A2680] hover:bg-[#701e68] text-white'
                                }`}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {candidate ? "บันทึก" : "สร้าง"}
                        </button>
                        )}
                    </div>
                </div>

            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="ยืนยันการลบพรรค"
                message={`ต้องการลบพรรค "${formData.name}" ใช่หรือไม่ การกระทำนี้ย้อนกลับไม่ได้`}
                variant="danger"
                isLoading={isLoading}
            />
        </div>
    );
}
