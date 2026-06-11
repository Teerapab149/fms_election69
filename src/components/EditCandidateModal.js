'use client';
import { getPath } from "../utils/basePath";

import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Loader2, Upload, Hash, User, Image as ImageIcon, Plus, ChevronDown, Check, AlertCircle } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { buildPartyTheme } from "../utils/partyColors";

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
                policies: Array.isArray(candidate.policies) ? candidate.policies.join('\n') : (candidate.policies || ''),
            });
            setPreviewUrl(candidate.logoUrl || '');
            setSelectedFile(null);

            let initialGroupImages = [];
            if (Array.isArray(candidate.groupImageUrls)) {
                initialGroupImages = candidate.groupImageUrls;
            } else if (candidate.groupImageUrl) {
                initialGroupImages = [candidate.groupImageUrl];
            } else if (candidate.groupImageUrls && typeof candidate.groupImageUrls === 'string') {
                try { initialGroupImages = JSON.parse(candidate.groupImageUrls) } catch (e) { }
            }

            // Initialize Official (Mobile Hero) Preview
            setOfficialPreview(candidate.officialImageUrl || '');
            setOfficialFile(null);

            // Initialize Mobile Hero (Vertical Team) - Multiple
            let initialMobileHeroImages = [];
            if (candidate.mobileHeroImage) {
                if (Array.isArray(candidate.mobileHeroImage)) initialMobileHeroImages = candidate.mobileHeroImage;
                else if (typeof candidate.mobileHeroImage === 'string') {
                    try {
                        const parsed = JSON.parse(candidate.mobileHeroImage);
                        initialMobileHeroImages = Array.isArray(parsed) ? parsed : [candidate.mobileHeroImage];
                    } catch (e) { initialMobileHeroImages = [candidate.mobileHeroImage]; }
                }
            }
            setExistingMobileHeroImages(initialMobileHeroImages);
            setMobileHeroPreviews([]);
            setMobileHeroFiles([]);

            setExistingImages(initialGroupImages);
            setNewGroupFiles([]);

            setGroupPreviews(initialGroupImages);
            setGroupFiles([]);

            setMembers(sortMembers(candidate.members || []));
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

    const isFormValid = formData.name.trim() !== '' && formData.number !== '';

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
            data.append('policies', formData.policies);
            if (selectedFile) data.append('file', selectedFile);
            if (officialFile) data.append('officialImage', officialFile);

            // Append Mobile Hero Images
            data.append('existingMobileHeroImages', JSON.stringify(existingMobileHeroImages));
            mobileHeroFiles.forEach((file) => {
                data.append('mobileHeroFiles', file);
            });

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


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-scale-up border border-gray-100 flex flex-col">

                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        แก้ไขข้อมูลผู้สมัคร
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors">
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

                    <form id="candidate-form" onSubmit={handleSubmit} className="space-y-6">

                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl.startsWith('blob:') ? previewUrl : getPath(previewUrl)} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-300" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-white border border-gray-200 p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 text-blue-600">
                                    <Upload className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400">รูปภาพผู้สมัคร (Logo)</p>
                        </div>



                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                รูปภาพรวมพรรค (เลือกได้หลายรูป)
                            </label>

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


                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                                            className={`pl-10 w-full rounded-xl border px-4 py-2 text-gray-900 focus:ring-2 outline-none ${error && error.includes('หมายเลข') ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'}`}
                                            placeholder="1"
                                        />
                                    </div>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ความหมายสัญลักษณ์ <span className="text-red-500">*</span></label>
                                    <textarea
                                        type="text"
                                        name="logoMeaning"
                                        value={formData.logoMeaning}
                                        onChange={handleChange}
                                        rows="4"
                                        required
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">สโลแกน <span className="text-red-500">*</span></label>
                                    <textarea
                                        type="text"
                                        name="slogan"
                                        value={formData.slogan}
                                        onChange={handleChange}
                                        rows="4"
                                        required
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
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
                                            placeholder="#7FC8FF · เว้นว่าง = สีอัตโนมัติ"
                                            className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        {formData.color ? (
                                            <button
                                                type="button"
                                                onClick={() => handleChange({ target: { name: 'color', value: '' } })}
                                                className="text-xs text-gray-500 hover:text-purple-600 whitespace-nowrap"
                                            >
                                                ↺ สีอัตโนมัติ
                                            </button>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">เว้นว่าง = ระบบสร้างสีให้อัตโนมัติตามลำดับพรรค (พรรค 1 ฟ้า · 2 แดง · 3 เขียว · …) · สีที่เลือกจะถูกปรับให้เข้ากับโทนเว็บโดยอัตโนมัติ</p>

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
                                                    <span className="text-[10px] text-gray-400">
                                                        {formData.color ? 'จากสีที่เลือก' : 'อัตโนมัติ'}
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">พันธกิจ (Missions)</label>
                                    <textarea
                                        name="missions"
                                        value={formData.missions}
                                        onChange={handleChange}
                                        rows="8"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">* ขึ้นบรรทัดใหม่เพื่อแยกข้อ</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">นโยบาย (Policies)</label>
                                    <textarea
                                        name="policies"
                                        value={formData.policies}
                                        onChange={handleChange}
                                        rows="8"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">* ขึ้นบรรทัดใหม่เพื่อแยกข้อ</p>
                                </div>
                            </div>

                        </div>

                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">ข้อมูลพิเศษสำหรับ Mobile</label>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-6">
                                {/* Mobile Hero Cover */}
                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-sm font-medium text-gray-600 w-full text-left">1. รูปหมู่แนวตั้ง (Mobile SingleVote Page)*ไม่ต้องใส่ถ้ามีมากกว่า 1 พรรค</p>
                                    <div className="relative group w-full aspect-[3/4] bg-white rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center shadow-sm">
                                        {officialPreview ? (
                                            <img src={officialPreview.startsWith('blob:') ? officialPreview : getPath(officialPreview)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400">
                                                <ImageIcon className="w-8 h-8 mb-1" />
                                                <span className="text-xs">ยังไม่มีรูปภาพ</span>
                                            </div>
                                        )}
                                        <label className="absolute bottom-2 right-2 bg-white border border-gray-200 p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-50 text-blue-600 transition-colors">
                                            <Upload className="w-5 h-5" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleOfficialFileChange} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 text-left w-full">แนะนำขนาด: 3:4 แนวตั้ง (ใช้สำหรับหน้าโหวตบนมือถือ - รูปใหญ่)</p>
                                </div>

                                <hr className="border-gray-200" />

                                {/* Mobile Vertical Team (Multiple) */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium text-gray-600">2. รูปทีมแนวตั้ง (Mobile Vertical Team)</p>
                                            <p className="text-xs text-gray-500">ใส่ได้หลายรูป (แนะนำอัตราส่วน 3:4)</p>
                                        </div>
                                        <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm transition-colors">
                                            <Plus className="w-4 h-4" />
                                            <span>เพิ่มรูปแนวตั้ง</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleMobileHeroFileChange} />
                                        </label>
                                    </div>

                                    {/* Grid for Mobile Vertical Images */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                                        {/* Existing Images */}
                                        {existingMobileHeroImages.map((url, index) => (
                                            <div key={`existing-mh-${index}`} className="relative group aspect-[3/4] bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                                <img src={url.startsWith('blob:') ? url : getPath(url)} alt={`Team Vertical ${index + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingMobileHeroImage(index)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center truncate">
                                                    รูปเดิม
                                                </div>
                                            </div>
                                        ))}

                                        {/* New Files */}
                                        {mobileHeroPreviews.map((item, index) => (
                                            <div key={`new-mh-${index}`} className="relative group aspect-[3/4] bg-white rounded-lg border border-blue-200 overflow-hidden shadow-sm ring-2 ring-blue-50">
                                                <img src={item.url} alt={`New Vertical ${index + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewMobileHeroImage(index)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] p-1 text-center truncate">
                                                    กำลังอัปโหลด
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {existingMobileHeroImages.length === 0 && mobileHeroPreviews.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">ยังไม่มีรูปทีมแนวตั้ง</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>



                    </form>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center border-t border-gray-100 shrink-0">
                    <div>
                        {candidate && (
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                disabled={isLoading}
                                className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
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
                    </div>
                </div>

            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="ยืนยันการลบ?"
                message={`คุณต้องการลบผู้สมัคร "${formData.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
                variant="danger"
                isLoading={isLoading}
            />
        </div>
    );
}