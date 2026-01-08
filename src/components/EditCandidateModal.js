'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Loader2, Upload, Hash, User, Image as ImageIcon } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

export default function EditCandidateModal({ isOpen, onClose, candidate, onUpdate }) {
    const [formData, setFormData] = useState({
        name: '',
        number: '',
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (candidate) {
            setFormData({
                name: candidate.name || '',
                number: candidate.number || '',
            });
            setPreviewUrl(candidate.logoUrl || '');
            setSelectedFile(null);
        } else {
            setFormData({
                name: '',
                number: '',
            });
            setPreviewUrl('');
            setSelectedFile(null);
        }
    }, [candidate, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const isFormValid = formData.name.trim() !== '' && formData.number !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('number', formData.number);
            if (selectedFile) data.append('file', selectedFile);

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

            if (!res.ok) throw new Error('Update failed');

            if (onUpdate) onUpdate(candidate ? 'UPDATE' : 'CREATE');
            onClose();

        } catch (error) {
            console.error(error);
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

            if (!res.ok) throw new Error('Delete failed');

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
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up border border-gray-100">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        แก้ไขข้อมูลผู้สมัคร
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* 1. หมายเลข */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลข (Number)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="number"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                required
                                className="pl-10 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* 2. ชื่อพรรค */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพรรค / ผู้สมัคร</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                    </div>

                    {/* 3. Upload File */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">โลโก้พรรค (รูปภาพ)</label>

                        <div className="flex items-start gap-4">
                            {/* Preview Box */}
                            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-gray-400 text-xs">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                                        No Image
                                    </div>
                                )}
                            </div>

                            {/* Upload Button Area */}
                            <div className="flex-1">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                                    <Upload className="w-4 h-4" />
                                    เลือกรูปภาพ...
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg, image/png"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <p className="text-xs text-gray-400 mt-2">
                                    รองรับไฟล์ .jpg, .png <br />
                                </p>
                                {selectedFile && (
                                    <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                                        ✅ เลือกไฟล์: {selectedFile.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    {candidate == null ? "" :
                        <button
                            onClick={handleDeleteClick}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-[#C40808] hover:bg-[#990C0C] text-white rounded-xl font-medium shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Trash2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            ลบ
                        </button>
                    }
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