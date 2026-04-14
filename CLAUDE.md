# CLAUDE.md — FMS Online Voting System (SAMO 49)

## Project Overview
ระบบเลือกตั้งออนไลน์ คณะกรรมการบริหารสโมสรนักศึกษา คณะวิทยาการจัดการ มหาวิทยาลัยสงขลานครินทร์ (FMS PSU)
ใช้งานจริงในการเลือกตั้งประจำปีการศึกษา 2569 (SAMO 49)

## Tech Stack
- **Framework:** Next.js (App Router) with React
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js (PSU SSO OAuth — OpenID Connect)
- **Styling:** Tailwind CSS (utility-first, NO separate CSS files per component)
- **Animation:** Framer Motion (`motion`, `useSpring`, `useMotionValue`, `AnimatePresence`)
- **Charts:** Recharts (`BarChart`, `PieChart`, `ResponsiveContainer`)
- **Icons:** Lucide React
- **Deployment:** Docker with subpath `/fms-ovs`

## Directory Structure
```
src/
├── app/
│   ├── page.js                    # Home (SSR → HomeContent)
│   ├── admin/
│   │   ├── login/page.js          # Admin login (RSA-encrypted token)
│   │   └── page.js                # Admin console (tabs: overview, candidates, settings)
│   ├── candidates/page.js         # Party listing page
│   ├── party/page.js              # Single party detail (cinematic design)
│   ├── results/page.js            # Vote results + demographics
│   ├── vote/page.js               # Voting page
│   └── api/
│       ├── admin/
│       │   ├── candidates/route.js   # CRUD candidates + members
│       │   ├── config/route.js       # System config GET/PUT
│       │   └── dashboard/route.js    # Admin dashboard stats + actions
│       ├── check-status/route.js     # Election status check
│       ├── home-info/route.js        # Home page data (SSR)
│       ├── party/route.js            # Public party data
│       ├── results/route.js          # Vote results
│       └── vote/route.js             # Submit vote
├── components/
│   ├── HomeContent.js             # ⭐ Main home page (hardcoded sections — refactor target)
│   ├── Navbar.js                  # Public navigation bar
│   ├── CountdownTimer.js          # Election countdown with phase detection
│   ├── MeetCandidatesCard.js      # CTA card linking to candidates
│   ├── ResultCard.js              # Individual candidate result display
│   ├── DynamicListEditor.js       # Reusable drag list editor (reorder + edit items)
│   ├── EditCandidateModal.js      # Admin: edit party info modal
│   ├── EditCandidateMemberModal.js # Admin: edit member modal
│   ├── SmartImage.js              # Next/Image wrapper with fallback
│   ├── Providers.js               # SessionProvider wrapper
│   └── vote/
│       ├── LiquidMeshHeroBackground.js  # Animated blob background
│       ├── LiquidHero.js               # Party page hero with member photos
│       ├── CinematicNavbar.js           # Floating capsule navbar for party pages
│       └── AutoIntro.js                # Cinematic intro animation
├── hooks/
│   └── useVoteSystem.js           # Vote logic hook
├── utils/
│   ├── basePath.js                # ⚠️ CRITICAL: getPath() — ALL internal URLs must use this
│   ├── electionConfig.js          # Election dates + year constants
│   ├── auth.js                    # RSA encryption for admin token
│   └── PartyTheme.js             # Party-specific color themes
├── lib/
│   ├── db.js                      # Prisma client singleton
│   └── auth.js                    # NextAuth config (PSU SSO + DB sync)
prisma/
├── schema.prisma                  # Database schema
├── seed.js                        # Seed data (parties, members, mock voters)
└── migrations/                    # Migration history
```

## Database Schema (Key Models)
```prisma
model User {
  id, studentId (unique), name, email, facultyId, departmentId
  role ("student" | "ADMIN"), year, major, gender
  isVoted (Boolean), isFormCompleted (Boolean), isAdmin (Boolean)
  candidateId? → Candidate
}

model Candidate {
  id, name (unique), number (unique), slogan?, logoUrl?
  groupImageUrls (Json?), officialImageUrl?, mobileHeroImage (Json?)
  logoMeaning?, missions (Json?), policies (Json?)
  members → Member[], voters → User[], score (Int)
}

model Member {
  id, studentId (unique), name, number, imageUrl, modalImageUrl?
  major?, position?, candidateId → Candidate
}

model SystemConfig {
  id (always 1), isVoteOpen, showResult, systemMode ("AUTO"|"MANUAL_OPEN"|"PAUSE"|"ENDED")
  googleFormUrl?, updatedAt
}
```

## Critical Conventions — MUST FOLLOW

### 1. Base Path
**ทุก URL ภายในต้องผ่าน `getPath()`** — ห้ามใช้ path ตรงๆ
```js
import { getPath } from "../utils/basePath";
// ✅ getPath("/api/vote")  → "/fms-ovs/api/vote"
// ✅ getPath("/images/logo.png")  → "/fms-ovs/images/logo.png"
// ❌ "/api/vote" (จะพังใน Docker deployment)
```

### 2. Admin Authentication
Admin API ใช้ RSA-encrypted token ส่งผ่าน header `x-admin-token`
```js
import { getEncryptedToken } from "../utils/auth";
const token = getEncryptedToken();
fetch(getPath("/api/admin/..."), {
  headers: { 'x-admin-token': token }
});
```

### 3. Design System Colors
- **Primary:** `#8A2680` (deep purple — FMS brand)
- **Primary Gradient:** `from-[#8A2680] to-[#601A59]`
- **Accent:** `#9333EA` (lighter purple for hover)
- **Background:** `#F8F9FD` or `bg-gray-50`
- **Card bg:** `bg-white` with `border border-gray-100 rounded-xl shadow-sm`
- **เมื่อ component เป็นของเฉพาะ Party:** ใช้ theme จาก `PartyTheme.js`

### 4. Component Patterns
- ใช้ `"use client"` directive เสมอสำหรับ client components
- ใช้ `Framer Motion` สำหรับ animation (ไม่ใช้ CSS animation โดยตรง ยกเว้น keyframes ง่ายๆ)
- ใช้ `Lucide React` สำหรับ icons
- Modal pattern: `{showModal && <ModalComponent onClose={() => setShowModal(false)} />}`
- Loading state: `<Loader2 className="animate-spin" />` จาก lucide-react

### 5. Responsive Design
- Mobile-first approach
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Admin Panel: sidebar ซ่อนบน mobile (`hidden md:flex`)
- Public pages: full responsive ทุกหน้า

### 6. API Route Patterns
- GET routes ดึงข้อมูลปกติ ไม่ต้อง auth (public data)
- Admin routes ต้อง `verifyAdminToken(request)` ก่อนทำอะไร
- ใช้ `db` จาก `../../lib/db` (Prisma singleton)
- Response format: `NextResponse.json({ ... })`
- Error format: `NextResponse.json({ error: "message" }, { status: 500 })`

### 7. Election System Modes
```
AUTO         → ใช้เวลาจาก electionConfig.js ตัดสิน
MANUAL_OPEN  → เปิดรับโหวตแบบ force (ไม่สนเวลา)
PAUSE        → หยุดชั่วคราว (maintenance)
ENDED        → ปิดอย่างเป็นทางการ
```

## Current Home Page Sections (HomeContent.js)
เรียงลำดับปัจจุบัน (hardcoded):
1. **Navbar** — Navigation bar
2. **Hero Section** — SAMO 49 title + countdown + election status badge
3. **MeetCandidatesCard** — CTA ไปหน้า candidates
4. **Stats Panel** — จำนวนผู้ใช้สิทธิ์ (real-time) + percentage + total eligible
5. **Election Banner Image** — ภาพโปรโมท "เลือกตั้ง"
6. **Vote/Login CTA Button** — Dynamic button ตาม election status + login state
7. **Footer** — Copyright

## Existing Reusable Patterns
- `DynamicListEditor.js` — มี drag-and-drop reorder อยู่แล้ว (ArrowUp/ArrowDown + edit inline) ใช้เป็น reference ได้
- `SystemConfig` model — เก็บ config แบบ single-row (id=1) + Json fields รองรับอยู่แล้ว
- Admin tab system — เพิ่ม tab ใหม่ได้ง่าย (array `menuItems` ใน `admin/page.js`)

## File Naming
- Components: PascalCase (`HomeContent.js`, `ResultCard.js`)
- Utils/hooks: camelCase (`basePath.js`, `useVoteSystem.js`)
- API routes: `route.js` ใน folder structure
- Images: stored in `public/images/` organized by type

## Environment Variables
```
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # NextAuth encryption key
NEXT_PUBLIC_BASE_PATH # Subpath for deployment (default: /fms-ovs)
ADMIN_PRIVATE_KEY     # RSA private key for admin auth
ADMIN_AUTH_SECRET     # Secret for admin token validation
```

## Important Notes
- `Candidate.number = 0` → งดออกเสียง (No Vote)
- `Candidate.number = -1` → ไม่รับรอง (Disapprove) — ใช้เฉพาะเมื่อมีพรรคเดียว
- `Candidate.number > 0` → พรรคจริง
- Valid voter years: `['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4']` เท่านั้น
- Score ใน DB คือ actual vote count (increment on vote)
- Election dates ตั้งค่าใน `utils/electionConfig.js` ไม่ได้อยู่ใน DB
