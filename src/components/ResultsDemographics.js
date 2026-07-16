"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, Medal, Activity, PieChart as PieIcon } from 'lucide-react';

const COLORS_BAR = '#8A2680';

function getGenderColor(name) {
  const lowerName = String(name).toLowerCase();
  if (['ชาย', 'm', 'male'].includes(lowerName)) return '#3b82f6';
  if (['หญิง', 'f', 'female'].includes(lowerName)) return '#ec4899';
  return '#94a3b8';
}

export default function ResultsDemographics({
  demographics,
  isMobile = false,
  isRevealed = false,
  isEnded = false,
  isNotStarted = false
}) {
  const byMajor = demographics?.byMajor || [];
  const byYear = demographics?.byYear || [];
  const byGender = demographics?.byGender || [];

  if (isEnded || isRevealed) {
    if (isRevealed) {
      return (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 animate-fade-in-up">
          <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4 lg:mb-8">
              <div className="bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] p-2 rounded-lg"><BarChart3 className="w-5 h-5 text-[var(--color-primary,#8A2680)]" /></div>
              <h3 className="text-base lg:text-xl font-bold text-slate-700">แยกตามสาขา</h3>
            </div>
            <div className="h-[400px] lg:h-[600px] w-full text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMajor} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: isMobile ? 11 : 14, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="value" fill={COLORS_BAR} radius={[0, 4, 4, 0]} barSize={isMobile ? 24 : 40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="order-1 lg:order-2 grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-8 h-full">
            <div className="col-span-1 bg-white p-3 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 lg:mb-6">
                <div className="bg-yellow-100 p-1.5 lg:p-2 rounded-lg"><Medal className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" /></div>
                <h3 className="text-sm lg:text-xl font-bold text-slate-700">ชั้นปี</h3>
              </div>
              <div className="h-[160px] lg:h-[250px] w-full text-xs font-medium">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byYear} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: isMobile ? 10 : 14 }} interval={0} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={isMobile ? 24 : 50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-1 bg-white p-3 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 lg:mb-6">
                <div className="bg-blue-100 p-1.5 lg:p-2 rounded-lg"><PieIcon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" /></div>
                <h3 className="text-sm lg:text-xl font-bold text-slate-700">เพศ</h3>
              </div>
              <div className="h-[160px] lg:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byGender} cx="50%" cy="50%" innerRadius={isMobile ? 30 : 60} outerRadius={isMobile ? 50 : 90} paddingAngle={5} dataKey="value" stroke="none">
                      {byGender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getGenderColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign={isMobile ? "bottom" : "middle"} align={isMobile ? "center" : "right"} layout={isMobile ? "horizontal" : "vertical"} iconType="circle" wrapperStyle={{ fontSize: isMobile ? '10px' : '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 lg:py-32 bg-white/50 border border-dashed border-slate-300 rounded-[2rem] text-center px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100 animate-pulse">
          <Activity className="w-10 h-10 lg:w-12 lg:h-12 text-blue-600" />
        </div>
        <h3 className="text-xl lg:text-3xl font-black text-slate-700 mb-2">กำลังนับคะเเนนเสียงชาว FMS</h3>
        <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm lg:text-base">
          กรุณารอประกาศผลอย่างเป็นทางการ <br className="hidden md:block" />
          จากคณะกรรมการการเลือกตั้ง
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-16 bg-white/50 border border-dashed border-slate-300 rounded-3xl">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="text-slate-400" size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-600">สถิติยังไม่เปิดเผย</h3>
      <p className="text-slate-400 text-sm">ข้อมูลสถิติจะแสดงหลังจากปิดโหวตแล้วเท่านั้น</p>
    </div>
  );
}
