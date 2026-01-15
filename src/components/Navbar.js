// components/Navbar.js
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, X, Sparkles, LogIn, Users } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    window.location.href = "/";
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">

        {/* ================= โซนโลโก้ ================= */}
        <Link href="/" className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:block transition-transform hover:scale-105 duration-300 flex-shrink-0">
            <Image
              src="/images/logo/fms_logo50_color.png"
              alt="FMS 50th"
              width={480}
              height={480}
              className="w-auto h-9 md:h-14 lg:h-16 object-contain"
              priority
            />
          </div>
          <div className="hidden md:block h-6 md:h-10 w-[1px] bg-gray-300/50 mx-1"></div>
          <Image
            src="/images/logo/FMS_Standard_Logo_PNG.png"
            alt="FMS Name"
            width={1200}
            height={384}
            className="block w-auto h-8 md:h-10 lg:h-12 object-contain filter hover:brightness-110 transition-all"
            priority
          />
        </Link>

        {/* ================= เมนู Desktop ================= */}
        <div className="hidden lg:flex items-center gap-4">

          <div className="flex items-center gap-1">
            <NavButton
              href="/"
              label="หน้าแรก"
              isActive={pathname === '/'}
            />
            <NavButton
              href="/results"
              label="ผลการลงคะแนนเสียง"
              isActive={pathname === '/results'}
            />
          </div>

          {/* ✅ MEET CANDIDATES (NEW DESIGN: Playful Gradient) */}
          <Link
            href="/candidates"
            className={`
              group relative flex items-center gap-2 px-5 py-2 rounded-full ml-2 transition-all duration-300
              ${pathname.startsWith('/candidates') || pathname.startsWith('/party')
                ? 'bg-gradient-to-r from-purple-100 to-pink-50 text-[#8A2680] shadow-inner font-bold' // Active
                : 'bg-white hover:bg-purple-50 text-slate-600 hover:text-[#8A2680] hover:shadow-md hover:shadow-purple-200/50 hover:-translate-y-0.5' // Normal
              }
            `}
          >
            {/* Gradient Border Trick: ใช้ div ซ้อนด้านหลังทำเป็นขอบสีรุ้ง */}
            <div className={`absolute inset-0 rounded-full p-[1.5px] bg-gradient-to-r from-[#8A2680] via-purple-400 to-pink-400 opacity-20 group-hover:opacity-100 transition-opacity duration-300 -z-10 ${pathname.startsWith('/candidates') ? 'opacity-100' : ''}`}>
              <div className="w-full h-full rounded-full bg-white group-hover:bg-purple-50 transition-colors"></div>
            </div>

            {/* Icon: เปลี่ยนเป็น Users และเพิ่ม Animation ดุ๊กดิ๊ก */}
            <Users
              size={18}
              className={`
                transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12 
                ${pathname.startsWith('/candidates') ? 'text-[#8A2680] fill-purple-200' : 'text-slate-400 group-hover:text-[#8A2680]'}
              `}
            />

            <span className="relative z-10 text-sm font-bold tracking-tight">
              Meet Candidates
            </span>
          </Link>

          {/* User Profile / Login Logic */}
          {user ? (
            <div className="relative ml-2 pl-4 border-l border-gray-200" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100/80 transition-all duration-200 border border-transparent hover:border-gray-200 group"
              >
                <div className="hidden xl:block text-right mr-1">
                  <p className="text-sm font-bold text-gray-700 group-hover:text-[#8A2680] leading-none transition-colors">{user.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{user.studentId}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8A2680] to-purple-400 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all transform group-hover:scale-105">
                  <User size={20} />
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.studentId}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <LogOut size={18} />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Desktop Login Button (Black)
            <Link
              href="/login"
              className="ml-3 flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-black hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <LogIn size={18} strokeWidth={2.5} />
              <span>เข้าสู่ระบบ</span>
            </Link>
          )}

        </div>

        {/* ================= Hamburger Button ================= */}
        <button
          className="lg:hidden p-2 text-[#8A2680] rounded-xl hover:bg-purple-50 transition-colors focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X size={28} />
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 12H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 18H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

      </div>

      {/* ================= Mobile Menu Dropdown ================= */}
      <div className={`lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl transition-all duration-300 ease-in-out origin-top overflow-hidden ${isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col p-4 space-y-2 pb-6">

          {user && (
            <div className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-2xl mb-4 border border-purple-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#8A2680] flex items-center justify-center text-white shadow-sm border border-grey-200">
                <User size={24} />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500 font-mono bg-white px-2 py-0.5 rounded-lg inline-block mt-1 border border-gray-100">{user.studentId}</p>
              </div>
            </div>
          )}

          <MobileNavLink href="/" label="หน้าแรก" isActive={pathname === '/'} onClick={() => setIsMenuOpen(false)} />
          <MobileNavLink
            href="/candidates"
            label="Meet the Candidates"
            isActive={pathname.startsWith('/candidates') || pathname.startsWith('/party')}
            onClick={() => setIsMenuOpen(false)}
          />
          <MobileNavLink href="/results" label="ผลการลงคะแนนเสียง" isActive={pathname === '/results'} onClick={() => setIsMenuOpen(false)} />

          {user ? (
            <>
              <div className="h-px bg-gray-100 my-2 mx-2"></div>
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all active:bg-red-100">
                <LogOut size={20} />
                ออกจากระบบ
              </button>
            </>
          ) : (
            // Mobile Login Button (Black)
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md active:scale-95 transition-all mt-2"
            >
              <LogIn size={20} />
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavButton({ href, label, isActive }) {
  return (
    <Link
      href={href}
      className="relative px-4 py-2 group"
    >
      <span className={`relative z-10 text-sm font-bold transition-colors duration-300 
        ${isActive ? 'text-[#8A2680]' : 'text-gray-500 group-hover:text-[#8A2680]'}`}
      >
        {label}
      </span>
      <span className={`absolute inset-0 bg-[#8A2680]/5 rounded-lg transform transition-all duration-300 ease-out origin-center
        ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}>
      </span>
      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-[#8A2680] transition-all duration-300 ease-in-out
        ${isActive ? 'w-1/2 opacity-100' : 'w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50'}`}>
      </span>
    </Link>
  );
}

// ✅ FIX: MobileNavLink ดีไซน์ใหม่ (แบบมีแถบโค้งมนด้านซ้าย)
function MobileNavLink({ href, label, onClick, isActive }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      // ใช้ relative เพื่อให้วางแถบ indicator ได้
      className={`
        relative flex items-center w-full px-5 py-3 text-sm font-bold transition-all duration-200 rounded-xl overflow-hidden
        ${isActive
          ? 'bg-purple-50 text-[#8A2680]' // Active: พื้นม่วงจางๆ
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' // Normal
        }
      `}
    >
      <span className={`absolute left-0 top-0 h-full w-1.5 bg-[#8A2680] rounded-r-full transition-all duration-300 ease-out origin-left
         ${isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}>
      </span>

      {/* ขยับข้อความหนีแถบเล็กน้อยเมื่อ Active */}
      <span className={`transition-all duration-200 ${isActive ? 'pl-2' : ''}`}>
        {label}
      </span>
    </Link>
  );
}