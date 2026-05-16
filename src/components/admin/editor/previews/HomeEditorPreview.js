"use client";

import EditorElement from "../EditorElement";

const SIZE_MAP = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
};

// Mobile sizes — each key maps one step smaller
const MOBILE_SIZE_MAP = {
  xs: "0.625rem",
  sm: "0.75rem",
  base: "0.875rem",
  lg: "1rem",
  xl: "1.125rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  "4xl": "1.875rem",
  "5xl": "2.25rem",
};

const RADIUS_MAP = {
  none: "0",
  md: "0.375rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
};

export default function HomeEditorPreview({
  elementConfigs,
  selectedElement,
  hoveredElement,
  onSelectElement,
  onHoverElement,
  onHoverEnd,
  deviceMode = "desktop",
}) {
  const isMobile = deviceMode === "mobile";
  const sizeMap = isMobile ? MOBILE_SIZE_MAP : SIZE_MAP;
  const cfg = (id) => elementConfigs?.[id]?.config || {};
  const isVis = (id) => cfg(id).visible !== false;

  const E = ({ id, children }) => {
    const meta = elementConfigs?.[id] || {};
    return (
      <EditorElement
        id={id}
        type={meta.type}
        label={meta.label}
        section={meta.section}
        isSelected={selectedElement === id}
        isHovered={hoveredElement === id}
        onSelect={onSelectElement}
        onHover={onHoverElement}
        onHoverEnd={onHoverEnd}
      >
        {children}
      </EditorElement>
    );
  };

  const titleText = cfg("hero-title").text || "SAMO 49";
  const titleDigits = titleText.match(/\d+/)?.[0] || "";
  const titleHead = titleDigits ? titleText.replace(titleDigits, "") : titleText;
  const accentColor = cfg("stats-voted-card").backgroundColor || "#8A2680";

  return (
    <div
      className="bg-[#F8F9FD] min-h-[900px]"
      onClick={() => onSelectElement?.(null)}
    >
      {/* Mock Navbar */}
      <div className="bg-white/80 backdrop-blur border-b border-slate-100 px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#8A2680]" />
          <span className="text-[10px] font-bold text-slate-500">FMS PSU</span>
        </div>
        <div className="flex gap-4 text-[9px] text-slate-400">
          <span>หน้าแรก</span>
          <span>ผลคะแนน</span>
          <span>Meet Candidates</span>
        </div>
      </div>

      {/* Main content — 2 column */}
      <div className="px-6 py-8 mx-auto" style={{ maxWidth: "1200px" }}>
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: isMobile
              ? "1fr"
              : "1fr minmax(280px, 35%)",
          }}
        >
          {/* === LEFT COLUMN === */}
          <div className="space-y-4" style={isMobile ? { textAlign: "center" } : undefined}>
            {/* Countdown */}
            {isVis("hero-countdown") && (
              <E id="hero-countdown">
                <div className={`inline-flex px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 gap-2${isMobile ? " justify-center" : ""}`}
                  style={isMobile ? { display: "flex" } : undefined}
                >
                  <span className="text-[9px] font-bold text-[#8A2680]">
                    SEE YOU 2027
                  </span>
                  <span className="text-[9px] text-slate-500">
                    296D : 21H : 47M
                  </span>
                </div>
              </E>
            )}

            {/* Title */}
            <E id="hero-title">
              <h1
                style={{
                  fontSize: sizeMap[cfg("hero-title").fontSize] || (isMobile ? "2.25rem" : "3rem"),
                  fontWeight: cfg("hero-title").fontWeight || 900,
                  color: cfg("hero-title").color || "#1a1a2e",
                  textAlign: isMobile ? "center" : (cfg("hero-title").align || "left"),
                  lineHeight: 1.1,
                }}
              >
                {titleHead}
                {titleDigits && (
                  <span style={{ color: accentColor }}>{titleDigits}</span>
                )}
              </h1>
            </E>

            {/* Subtitle */}
            <E id="hero-subtitle">
              <p
                style={{
                  fontSize: sizeMap[cfg("hero-subtitle").fontSize] || (isMobile ? "0.875rem" : "1rem"),
                  color: cfg("hero-subtitle").color || "#374151",
                  textAlign: isMobile ? "center" : (cfg("hero-subtitle").align || "left"),
                }}
              >
                {cfg("hero-subtitle").text || "โครงการเลือกตั้งคณะกรรมการบริหาร"}
              </p>
            </E>

            {/* Subtitle 2 */}
            <E id="hero-subtitle2">
              <p
                style={{
                  fontSize: sizeMap[cfg("hero-subtitle2").fontSize] || (isMobile ? "0.75rem" : "0.875rem"),
                  color: cfg("hero-subtitle2").color || "#6b7280",
                  textAlign: isMobile ? "center" : (cfg("hero-subtitle2").align || "left"),
                }}
              >
                {cfg("hero-subtitle2").text || "สโมสรนักศึกษาคณะวิทยาการจัดการ"}
              </p>
            </E>

            {/* Year badge */}
            <E id="hero-year-badge">
              <div className="inline-flex px-3 py-1 rounded-full border border-slate-200"
                style={isMobile ? { display: "flex", justifyContent: "center" } : undefined}
              >
                <span
                  style={{
                    fontSize: sizeMap[cfg("hero-year-badge").fontSize] || (isMobile ? "0.625rem" : "0.75rem"),
                    color: cfg("hero-year-badge").color || "#6b7280",
                  }}
                >
                  {cfg("hero-year-badge").text || "ประจำปีการศึกษา 2569"}
                </span>
              </div>
            </E>

            {/* Status badge */}
            {isVis("hero-status-badge") && (
              <E id="hero-status-badge">
                <div className="inline-flex px-4 py-2 rounded-full bg-slate-800 text-white text-[10px] font-bold">
                  อยู่นอกระยะเวลาเลือกตั้ง / Ended
                </div>
              </E>
            )}

            {/* Vote CTA button */}
            <E id="voteCTA-button">
              <button
                style={{
                  backgroundColor:
                    cfg("voteCTA-button").backgroundColor || "#8A2680",
                  color: cfg("voteCTA-button").textColor || "#ffffff",
                  borderRadius:
                    RADIUS_MAP[cfg("voteCTA-button").borderRadius] || "0.75rem",
                  border: cfg("voteCTA-button").borderColor
                    ? `2px solid ${cfg("voteCTA-button").borderColor}`
                    : "none",
                  padding: "0.75rem 1.75rem",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "default",
                }}
              >
                {cfg("voteCTA-button").text || "เข้าสู่ระบบ / Sign In"}
              </button>
            </E>

            {/* Meet Candidates card */}
            {isVis("meet-section") && (
              <E id="meet-section">
                <div
                  style={{
                    backgroundColor:
                      cfg("meet-section").backgroundColor || "#ffffff",
                    borderRadius:
                      RADIUS_MAP[cfg("meet-section").borderRadius] || "1rem",
                    border: `1px solid ${cfg("meet-section").borderColor || "#fecdd3"}`,
                    padding: "1.25rem",
                  }}
                >
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: accentColor }}
                  >
                    FMS ELECTION 2026
                  </span>
                  <E id="meet-title">
                    <p
                      style={{
                        fontSize:
                          sizeMap[cfg("meet-title").fontSize] || "0.875rem",
                        color: cfg("meet-title").color || "#1a1a2e",
                        fontWeight: cfg("meet-title").fontWeight || 700,
                        marginTop: "0.25rem",
                      }}
                    >
                      {cfg("meet-title").text || "รู้จักผู้สมัครของคุณหรือยัง?"}
                    </p>
                  </E>
                  <div className="mt-3">
                    <E id="meet-cta">
                      <span
                        style={{
                          display: "inline-flex",
                          backgroundColor:
                            cfg("meet-cta").backgroundColor || "#1a1a2e",
                          color: cfg("meet-cta").textColor || "#ffffff",
                          borderRadius:
                            RADIUS_MAP[cfg("meet-cta").borderRadius] || "9999px",
                          padding: "0.375rem 1rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "default",
                        }}
                      >
                        {cfg("meet-cta").text || "ดูรายชื่อพรรค →"}
                      </span>
                    </E>
                  </div>
                </div>
              </E>
            )}
          </div>

          {/* === RIGHT COLUMN === */}
          <div className="space-y-4">
            {/* Stats header */}
            <E id="stats-header">
              <p
                style={{
                  fontSize: sizeMap[cfg("stats-header").fontSize] || "0.75rem",
                  color: cfg("stats-header").color || "#374151",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                📊 {cfg("stats-header").text || "สถิติผู้เข้าร่วมลงคะแนนโหวต"}
              </p>
            </E>

            {/* Stats voted card */}
            <E id="stats-voted-card">
              <div
                style={{
                  backgroundColor:
                    cfg("stats-voted-card").backgroundColor || "#8A2680",
                  borderRadius:
                    RADIUS_MAP[cfg("stats-voted-card").borderRadius] || "1rem",
                  border: cfg("stats-voted-card").borderColor
                    ? `2px solid ${cfg("stats-voted-card").borderColor}`
                    : "none",
                  padding: "1.25rem",
                  color: cfg("stats-voted-card").textColor || "#ffffff",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "0.625rem", opacity: 0.8 }}>
                  ใช้สิทธิ์แล้ว (VOTED)
                </p>
                <p style={{ fontSize: "2rem", fontWeight: 900 }}>
                  342 <span style={{ fontSize: "0.75rem" }}>คน</span>
                </p>
              </div>
            </E>

            {/* Stats sub-cards */}
            <div className="grid grid-cols-2 gap-2">
              <E id="stats-progress-card">
                <div
                  style={{
                    backgroundColor:
                      cfg("stats-progress-card").backgroundColor || "#ffffff",
                    borderRadius:
                      RADIUS_MAP[cfg("stats-progress-card").borderRadius] ||
                      "0.75rem",
                    border: `1px solid ${cfg("stats-progress-card").borderColor || "#e2e8f0"}`,
                    padding: "0.75rem",
                  }}
                >
                  <p style={{ fontSize: "0.5rem", color: "#94a3b8" }}>
                    ความคืบหน้า
                  </p>
                  <p
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 900,
                      color: "#1e293b",
                    }}
                  >
                    28.50%
                  </p>
                </div>
              </E>
              <E id="stats-eligible-card">
                <div
                  style={{
                    backgroundColor:
                      cfg("stats-eligible-card").backgroundColor || "#ffffff",
                    borderRadius:
                      RADIUS_MAP[cfg("stats-eligible-card").borderRadius] ||
                      "0.75rem",
                    border: `1px solid ${cfg("stats-eligible-card").borderColor || "#e2e8f0"}`,
                    padding: "0.75rem",
                  }}
                >
                  <p style={{ fontSize: "0.5rem", color: "#94a3b8" }}>
                    ผู้มีสิทธิ์รวม
                  </p>
                  <p
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 900,
                      color: "#1e293b",
                    }}
                  >
                    1,200 คน
                  </p>
                </div>
              </E>
            </div>

            {/* Banner */}
            {isVis("banner-section") && (
              <E id="banner-section">
                <div
                  style={{
                    borderRadius:
                      RADIUS_MAP[cfg("banner-section").borderRadius] || "1rem",
                    overflow: "hidden",
                    height: "200px",
                    background: "linear-gradient(135deg, #8A2680, #EC4899)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <p
                    style={{
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: "1.5rem",
                    }}
                  >
                    เลือกตั้ง
                  </p>
                </div>
              </E>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
