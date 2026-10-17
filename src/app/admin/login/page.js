'use client';
import { getPath } from "../../../utils/basePath";

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck, Lock, KeyRound } from 'lucide-react';

const ASSURANCES = [
  { icon: Lock, text: 'บัตรลงคะแนนถูกเข้ารหัส และไม่ผูกกับตัวผู้ลงคะแนน' },
  { icon: ShieldCheck, text: 'สิทธิ์แอดมินตรวจจากฐานข้อมูลทุกครั้งที่เรียกใช้' },
  { icon: KeyRound, text: 'เซสชันหมดอายุใน 2 ชั่วโมง และจำกัดจำนวนครั้งที่ลองเข้าสู่ระบบ' },
];

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(getPath('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = getPath("/admin");
      } else {
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err) {
      setError('ระบบขัดข้อง กรุณาลองใหม่ภายหลัง');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus:ring-2 ${
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
      : 'border-slate-300 focus:border-[#8A2680] focus:ring-[#8A2680]/20'
  }`;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* แผงแบรนด์ */}
      <aside className="bg-[#1C0F1B] text-white lg:w-[44%] lg:max-w-[640px] lg:min-h-screen flex flex-col justify-between px-6 py-5 lg:px-12 lg:py-12">
        <div className="flex items-center gap-3">
          <span className="h-8 w-1 rounded-full bg-[#8A2680]" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-wide text-white/90">FMS PSU Election</span>
        </div>

        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d6a3d1]">Admin Console</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">ระบบจัดการการเลือกตั้ง</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            สโมสรนักศึกษาคณะวิทยาการจัดการ มหาวิทยาลัยสงขลานครินทร์
          </p>

          <ul className="mt-10 space-y-4 border-t border-white/10 pt-8">
            {ASSURANCES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/75">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#d6a3d1]" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden lg:block text-xs text-white/40">เฉพาะเจ้าหน้าที่และกรรมการเลือกตั้ง</p>
      </aside>

      {/* ฟอร์ม */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 lg:py-12">
        <div className="w-full max-w-sm">
          <img
            src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")}
            alt="คณะวิทยาการจัดการ มหาวิทยาลัยสงขลานครินทร์"
            className="h-12 w-auto"
          />
          <h1 className="mt-8 text-2xl font-bold text-slate-900">เข้าสู่ระบบจัดการ</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            เฉพาะเจ้าหน้าที่และกรรมการเลือกตั้งที่ได้รับสิทธิ์เท่านั้น
          </p>

          <form onSubmit={handleAdminLogin} className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="admin-username" className="mb-1.5 block text-sm font-medium text-slate-700">
                ชื่อผู้ใช้
              </label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (error) setError(''); }}
                className={inputClass}
                placeholder="รหัสนักศึกษา หรืออีเมล"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                  className={`${inputClass} pr-11`}
                  placeholder="กรอกรหัสผ่าน"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680]/40"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8A2680] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#751F6C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A2680] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  กำลังตรวจสอบ
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#8A2680] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              กลับหน้าเว็บหลัก
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
