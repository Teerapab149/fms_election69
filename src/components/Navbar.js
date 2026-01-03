"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // State สำหรับเก็บข้อมูล User
  const [user, setUser] = useState(null);

  // 1. เช็ค Login เมื่อโหลดหน้าเว็บ
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // 2. ฟังก์ชัน Logout
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    window.location.href = "/";
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">

        {/* ================= โซนโลโก้ ================= */}
        <Link href="/" className="flex items-center gap-4">
          <div className="hidden md:block transition-transform hover:scale-105 duration-300">
            <Image
              src="/images/logo/fms_logo50_color.png"
              alt="FMS 50th"
              width={120}
              height={120}
              className="w-auto h-16 md:h-20 object-contain"
              priority
            />
          </div>
          <div className="hidden md:block h-12 w-[1px] bg-gray-300/50 mx-2"></div>
          <Image
            src="/images/logo/FMS_Standard_Logo_PNG.png"
            alt="FMS Name"
            width={250}
            height={80}
            className="block w-auto h-10 md:h-14 object-contain filter hover:brightness-110 transition-all"
            priority
          />
        </Link>

        {/* ================= เมนู PC ================= */}
        <div className="hidden md:flex items-center gap-4">
          {/* กลุ่มเมนูนำทาง */}
          <div className="flex items-center gap-1">
            <NavButton 
              href="/" 
              label="หน้าแรก" 
            />
            {pathname !== '/results' && (
              <NavButton href="/results" label="ผลการลงคะแนนเสียง" />
            )}
          </div>

          {/* โชว์ส่วนนี้ "เฉพาะตอน Login แล้ว" */}
          {user && (
            <>
              {/* เส้นคั่น */}
              <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>

              <div className="flex items-center gap-4 animate-fade-in">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-[#8A2680] leading-tight">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.studentId}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full border border-red-100 text-red-500 hover:bg-red-50 text-sm font-bold transition-all hover:shadow-sm"
                >
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}

        </div>

        {/* ================= ปุ่ม Mobile Hamburger ================= */}
        <button
          className="md:hidden p-2 text-gray-600 rounded-xl hover:bg-[#8A2680]/10 hover:text-[#8A2680] transition-colors focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          )}
        </button>

      </div>

      {/* ================= Mobile Menu Dropdown ================= */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white backdrop-blur-xl border-b border-gray-200 shadow-xl transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0'}`}>
        <div className="flex flex-col p-4 space-y-2">
          
          {/* ส่วน User Mobile */}
          {user && (
            <div className="bg-gray-50 p-4 rounded-xl mb-2 border border-gray-100">
              <p className="text-sm font-bold text-[#8A2680]">{user.name}</p>
              <p className="text-xs text-gray-500">{user.studentId}</p>
            </div>
          )}

          <MobileNavLink 
            href="/" 
            label="หน้าแรก" 
            onClick={() => setIsMenuOpen(false)} 
          />

          {pathname !== '/results' && (
             <MobileNavLink 
               href="/results" 
               label="ผลการลงคะแนนเสียง" 
               onClick={() => setIsMenuOpen(false)}
             />
          )}

          {/* ปุ่ม Logout Mobile */}
          {user && (
            <>
              <div className="h-px bg-gray-100 my-2"></div>
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left"
              >
                ออกจากระบบ
              </button>
            </>
          )}

        </div>
      </div>

    </nav>
  );
}

// --- Component ย่อย: NavButton (PC) ---
function NavButton({ href, label }) {
  return (
    // ✅ เพิ่ม className "group" เพื่อให้สั่งงานลูกน้องตอน hover ได้
    <Link href={href} className="relative px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:text-[#8A2680] hover:bg-[#8A2680]/5 transition-all duration-300 group">
      <span className="relative pb-1 text-base">
        {label}
        {/* ✅ เพิ่มเส้นใต้กลับมา: แต่ตั้ง scale-x-0 (ซ่อน) ไว้ก่อน แล้วสั่ง group-hover:scale-x-100 (โผล่มาตอนชี้) */}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-[#8A2680] rounded-full transform transition-transform duration-300 origin-center scale-x-0 group-hover:scale-x-100"></span>
      </span>
    </Link>
  );
}

// --- Component ย่อย: MobileNavLink (Mobile) ---
function MobileNavLink({ href, label, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block w-full px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-[#8A2680]/10 hover:text-[#8A2680] transition-all"
    >
      {label}
    </Link>
  );
}