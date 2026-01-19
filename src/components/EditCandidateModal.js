'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Loader2, Upload, Hash, User, Image as ImageIcon, Plus, ChevronDown, Check, AlertCircle } from "lucide-react";
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

export default function EditCandidateModal({ isOpen, onClose, candidate, onUpdate }) {
    const [formData, setFormData] = useState({
        name: '',
        number: '',
        logoMeaning: '',
        slogan: ''
    });

    const [error, setError] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const [members, setMembers] = useState([]);
    const [newMember, setNewMember] = useState({
        name: '',
        studentId: '',
        position: '',
        imageFile: null,
        previewUrl: ''
    });

    const [isLoading, setIsLoading] = useState(false);
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
            setFormData({
                name: candidate.name || '',
                number: candidate.number || '',
                slogan: candidate.slogan || '',
                logoMeaning: candidate.logoMeaning || '',
            });
            setPreviewUrl(candidate.logoUrl || '');
            setSelectedFile(null);
            setMembers(sortMembers(candidate.members || []));
        } else {
            setFormData({
                name: '',
                number: '',
                slogan: '',
                logoMeaning: '',
            });
            setPreviewUrl('');
            setSelectedFile(null);
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
            if (selectedFile) data.append('file', selectedFile);

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

            let res;
            if (candidate) {
                res = await fetch(`/api/admin/candidates?id=${candidate.id}`, {
                    method: 'PUT',
                    body: data,
                });
            } else {
                res = await fetch(`/api/admin/candidates`, {
                    method: 'POST',
                    body: data,
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
            const res = await fetch(`/api/admin/candidates?id=${candidate.id}`, {
                method: 'DELETE',
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

                        {/* รูปโปรไฟล์ */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-300" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-white border border-gray-200 p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 text-blue-600">
                                    <Upload className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400">รูปภาพสมาชิก</p>
                        </div>

                        {/* --- Candidate Info --- */}
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
                                    <input
                                        type="text"
                                        name="logoMeaning"
                                        value={formData.logoMeaning}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">สโลแกน <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="slogan"
                                        value={formData.slogan}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                        </div>

                    </form>
                </div>

                {/* Footer */}
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