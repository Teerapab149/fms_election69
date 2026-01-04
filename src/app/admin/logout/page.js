"use client";
import { useEffect } from "react";

export default function AdminLogout() {
  
  useEffect(() => {
    // 1. ล้างข้อมูลให้เกลี้ยง
    localStorage.removeItem("currentUser");
    
    // 2. ใช้ window.location.href ดีดออกทันที
    window.location.href = "/";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-500">Signing out...</p>
      </div>
    </div>
  );
}