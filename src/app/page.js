// src/app/page.js

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth"; // ✅ Import authOptions
import HomeContent from "../components/HomeContent"; // ✅ เรียกใช้ Component ที่แยกไป

// ฟังก์ชันดึงข้อมูลจาก API (รันบน Server)
async function getHomeData() {
  try {
    // ⚠️ ตรงนี้สำคัญ: การ Fetch ใน Server Component ต้องใช้ URL เต็ม
    // ถ้าคุณรัน localhost ให้ใช้ http://localhost:3000
    // ถ้าขึ้น Production ต้องเปลี่ยนเป็น domain จริง หรือใช้ logic database ตรงนี้แทน fetch ก็ได้ครับ
    
    // ใช้ process.env.NEXTAUTH_URL ถ้าตั้งไว้ หรือ fallback ไป localhost
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"; 
    const res = await fetch(`${baseUrl}/api/home-info`, { cache: 'no-store' });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Server Fetch Error:", error);
    return null;
  }
}

export default async function Home() {
  // 1. ดึง Session จาก Server (0 Request Client)
  const session = await getServerSession(authOptions);

  // 2. ดึงข้อมูล Home จาก Server
  const homeData = await getHomeData();

  return (
    <main>
       {/* 3. ส่งข้อมูลทั้งหมดไปให้ Client Component */}
       <HomeContent session={session} initialData={homeData} />
    </main>
  );
}