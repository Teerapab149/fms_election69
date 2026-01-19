'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Loader2, Upload, User, Image as ImageIcon, ChevronDown, Check, AlertCircle } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

const PREDEFINED_POSITIONS = [
    "นายกสโมสรนักศึกษา",
    "อุปนายกกิจการภายใน",
    "อุปนายกกิจการภายนอก",
    "เลขานุการ",
    "เหรัญญิก",
    "ประธานฝ่ายประชาสัมพันธ์",
    "ประธานฝ่ายสวัสดิการ",
    "ประธานฝ่ายพัสดุ",
    "ประธานฝ่ายกีฬา",
    "ประธานฝ่ายวิชาการ",
    "ประธานฝ่ายศิลปวัฒนธรรม",
    "ประธานฝ่ายข้อมูลกิจการนักศึกษา",
    "ประธานฝ่ายเทคโนโลยีสารสนเทศ",
    "ประธานฝ่ายประเมินผล",
    "ประธานฝ่ายกิจกรรม",
    "ประธานฝ่ายกราฟิกดีไซน์",
    "ประธานฝ่ายพิธีการ",
    "ประธานฝ่ายครีเอทีฟและสันทนาการ",
    "ประธานฝ่ายสถานที่",
    "ประธานฝ่ายสาธารณสุข"
];

export default function EditCandidateMemberModal({ isOpen, onClose, candidate, onUpdate, focusMemberId }) {
    const [allMembers, setAllMembers] = useState([]);

    const [currentMember, setCurrentMember] = useState({
        name: '',
        studentId: '',
        position: '',
        imageFile: null,
        previewUrl: ''
    });

    const [showPositionList, setShowPositionList] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const sortMembers = (membersList) => {
        return [...membersList].sort((a, b) => {
            const indexA = PREDEFINED_POSITIONS.indexOf(a.position);
            const indexB = PREDEFINED_POSITIONS.indexOf(b.position);
            const priorityA = indexA === -1 ? 999 : indexA;
            const priorityB = indexB === -1 ? 999 : indexB;
            return priorityA - priorityB;
        });
    };

    useEffect(() => {
        if (candidate) {
            const membersList = sortMembers(candidate.members || []);
            setAllMembers(membersList);

            if (focusMemberId) {
                const target = membersList.find(m => m.id === focusMemberId);
                if (target) {
                    setCurrentMember({
                        name: target.name,
                        id: target.id,
                        studentId: target.studentId,
                        position: target.position || '',
                        imageFile: null,
                        previewUrl: target.imageUrl || ''
                    });
                }
            } else {
                setCurrentMember({ name: '', studentId: '', position: '', imageFile: null, previewUrl: '' });
            }
        }
        setError(null);
    }, [candidate, isOpen, focusMemberId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentMember(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
                return;
            }
            setCurrentMember(prev => ({
                ...prev,
                imageFile: file,
                previewUrl: URL.createObjectURL(file)
            }));
        }
    };

    const selectPosition = (pos) => {
        setCurrentMember(prev => ({ ...prev, position: pos }));
        setShowPositionList(false);
    };

    const handleConfirmDelete = async () => {
        setIsLoading(true);
        const updatedMembers = allMembers.filter(m => m.id !== focusMemberId);

        await submitToBackend(updatedMembers);
        setShowDeleteConfirm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentMember.name || !currentMember.studentId) {
            setError("กรุณากรอกชื่อและรหัสนักศึกษา");
            return;
        }
        setIsLoading(true);

        let updatedMembers = [...allMembers];

        if (focusMemberId) {
            const index = updatedMembers.findIndex(m => m.id === focusMemberId);
            if (index !== -1) {
                updatedMembers[index] = {
                    ...updatedMembers[index],
                    ...currentMember
                };
            }
        } else {
            updatedMembers.push({ ...currentMember, tempId: Date.now() });
        }

        updatedMembers = sortMembers(updatedMembers);

        await submitToBackend(updatedMembers);
    };

    const submitToBackend = async (finalMemberList) => {
        try {
            const data = new FormData();
            data.append('name', candidate.name);
            data.append('number', candidate.number);

            const membersPayload = finalMemberList.map(m => {

                let imageUrlToSend = null;
                if (m.previewUrl && !m.previewUrl.startsWith('blob:')) {
                    imageUrlToSend = m.previewUrl;
                } else if (m.imageUrl && !m.imageUrl.startsWith('blob:')) {
                    imageUrlToSend = m.imageUrl;
                }

                return {
                    name: m.name,
                    studentId: m.studentId,
                    position: m.position,
                    existingImageUrl: imageUrlToSend
                };
            });
            data.append('members', JSON.stringify(membersPayload));

            if (currentMember.imageFile && !isLoading) {
                data.append(`member_file_${currentMember.studentId}`, currentMember.imageFile);
            }

            const res = await fetch(`/api/admin/candidates?id=${candidate.id}`, {
                method: 'PUT',
                body: data,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Update failed');
            }

            if (onUpdate) onUpdate('UPDATE');
            onClose();

        } catch (err) {
            console.error(err);
            setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPositions = PREDEFINED_POSITIONS.filter(pos =>
        pos.toLowerCase().includes(currentMember.position.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up border border-gray-100 flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        {focusMemberId ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 animate-shake">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* 1. รูปโปรไฟล์ */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                    {currentMember.previewUrl ? (
                                        <img src={currentMember.previewUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-300" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-white border border-gray-200 p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 text-blue-600">
                                    <Upload className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400">รูปภาพสมาชิก</p>
                        </div>

                        {/* 2. ข้อมูล text */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={currentMember.name}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักศึกษา <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="studentId"
                                        value={currentMember.studentId}
                                        onChange={handleChange}
                                        readOnly={!!focusMemberId}
                                        className={`w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none ${focusMemberId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="relative group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="position"
                                            value={currentMember.position}
                                            onChange={(e) => {
                                                handleChange(e);
                                                setShowPositionList(true);
                                            }}
                                            onFocus={() => setShowPositionList(true)}
                                            onBlur={() => setTimeout(() => setShowPositionList(false), 200)}
                                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="เลือกตำแหน่ง"
                                            autoComplete="off"
                                        />
                                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>

                                    {/* Dropdown ตำแหน่ง */}
                                    {showPositionList && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-scale-in">
                                            {filteredPositions.length > 0 ? (
                                                filteredPositions.map((pos, index) => (
                                                    <div
                                                        key={index}
                                                        onMouseDown={() => selectPosition(pos)}
                                                        className="px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer flex items-center justify-between"
                                                    >
                                                        {pos}
                                                        {currentMember.position === pos && <Check className="w-4 h-4 text-purple-600" />}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2.5 text-xs text-gray-400 text-center">ใช้ตำแหน่งใหม่: "{currentMember.position}"</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center border-t border-gray-100 shrink-0">

                    <div>
                        {focusMemberId && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isLoading}
                                className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> ลบสมาชิก
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
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-[#8A2680] hover:bg-[#701e68] text-white rounded-xl font-medium shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {focusMemberId ? "บันทึก" : "เพิ่มสมาชิก"}
                        </button>
                    </div>
                </div>

            </div>
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="ยืนยันการลบ?"
                message={`คุณต้องการลบผู้สมัคร "${currentMember.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
                variant="danger"
                isLoading={isLoading}
            />
        </div>
    );
}