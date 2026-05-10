"use client";

// ResultsPreview — ตัวอย่างหน้าผลคะแนนแบบ simplified สำหรับ Live Preview
// ใช้ dummy data ล้วน — ไม่ติดต่อ API
// Pure CSS bar chart (ไม่ต้องใช้ recharts)

const DUMMY_RESULTS = [
  { name: "พรรค A", score: 156, color: "#8A2680" },
  { name: "พรรค B", score: 98,  color: "#2563EB" },
  { name: "งดออกเสียง", score: 42,  color: "#F59E0B" },
];

export default function ResultsPreview() {
  const total = DUMMY_RESULTS.reduce((s, r) => s + r.score, 0);
  const maxScore = Math.max(...DUMMY_RESULTS.map((r) => r.score));

  return (
    <div className="bg-[#F8F9FD] min-h-full p-6">
      <div className="text-center mb-6">
        <h1 className="text-xl font-black text-slate-800">ผลการลงคะแนนเสียง</h1>
        <p className="text-xs text-slate-400 mt-1">รวมทั้งหมด {total} คะแนน</p>
      </div>

      <div className="space-y-3 max-w-md mx-auto">
        {DUMMY_RESULTS.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-700">{r.name}</span>
              <span className="text-sm font-black" style={{ color: r.color }}>
                {r.score} คะแนน
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(r.score / maxScore) * 100}%`, backgroundColor: r.color }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {((r.score / total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
