# STYLED_BLOCKS_ARCHITECTURE.md
# ระบบ "Styled Blocks" — Block-based Page Editor with Visual Config

## 🎯 เป้าหมาย
สร้างระบบให้ Admin (รุ่นน้อง) สามารถปรับแต่งหน้าเว็บได้ผ่าน **Live Preview UI** โดยไม่ต้องแก้โค้ด
แนวคิดคือ "LEGO blocks ที่มีหน้าตาเหมือน Canva" — ยังเรียง sections บนลงล่าง (responsive safe)
แต่ UI ของ editor ทำให้รู้สึกเหมือน design tool (คลิก block → panel ด้านข้าง → ปรับค่า → เห็นผลทันที)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Panel                           │
│  ┌──────────────────────┬──────────────────────────────┐│
│  │   Live Preview       │   Config Panel               ││
│  │   (iframe or inline) │   (sidebar editor)           ││
│  │                      │                              ││
│  │   ┌──────────────┐   │   Block: Hero                ││
│  │   │  Hero Block   │◄─┤   ├─ Style: [Gradient ▼]     ││
│  │   └──────────────┘   │   ├─ Title: "SAMO 49"        ││
│  │   ┌──────────────┐   │   ├─ Subtitle: "โครงการ..."  ││
│  │   │  Stats Block  │◄─┤   ├─ Primary Color: [●]      ││
│  │   └──────────────┘   │   └─ Show Countdown: [✓]     ││
│  │   ┌──────────────┐   │                              ││
│  │   │  CTA Block    │  │   [▲] [▼] Reorder            ││
│  │   └──────────────┘   │   [👁] Toggle Visibility      ││
│  │                      │   [🎨] Style Presets           ││
│  └──────────────────────┴──────────────────────────────┘│
│                        [💾 Publish]                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

เพิ่ม 2 fields ใน SystemConfig ที่มีอยู่แล้ว (ไม่ต้องสร้าง table ใหม่):

```prisma
model SystemConfig {
  id            Int      @id @default(1)
  isVoteOpen    Boolean  @default(false)
  showResult    Boolean  @default(false)
  systemMode    String   @default("AUTO")
  googleFormUrl String?
  updatedAt     DateTime @updatedAt

  // ⭐ NEW: Styled Blocks
  pageLayout    Json?    // Section ordering + per-block config
  themeConfig   Json?    // Global theme (colors, fonts)
}
```

---

## 📦 pageLayout JSON Schema

```typescript
// Type definition (for reference — stored as JSON in DB)
interface PageLayout {
  // หน้า Home
  home: HomeBlock[];

  // หน้า Vote (Multi-party specific config)
  vote: {
    multiParty: MultiPartyConfig;
  };

  // Global theme overrides
  theme: ThemeConfig;
}

interface HomeBlock {
  type: "hero" | "stats" | "meetCandidates" | "electionBanner" | "voteCTA";
  visible: boolean;
  order: number;
  config: Record<string, any>; // block-specific config
}

interface MultiPartyConfig {
  gridCols: "2" | "3" | "auto";       // จำนวนคอลัมน์ grid
  cardVariant: "grid" | "compact";     // style ของ PartyCard
  showDivider: boolean;                // แสดงเส้น "หรือ" หรือไม่
  abstainStyle: "standard" | "compact" | "minimal";
  // ⛔ LOCKED (ไม่มีใน config — hardcoded เสมอ):
  // - ต้องแสดงทุกพรรค + งดออกเสียง ครบ
  // - ห้ามมีปุ่ม "ไม่รับรอง" ใน multi-party
  // - onSelect logic ห้ามแก้
}

interface ThemeConfig {
  primaryColor: string;    // default: "#8A2680"
  accentColor: string;     // default: "#9333EA"
  borderRadius: "sharp" | "rounded" | "pill"; // default: "rounded"
}
```

### Default pageLayout (สะท้อน UI ปัจจุบัน):

```json
{
  "home": [
    {
      "type": "hero",
      "visible": true,
      "order": 1,
      "config": {
        "style": "gradient",
        "showCountdown": true,
        "showStatusBadge": true,
        "title": "SAMO 49",
        "subtitle": "โครงการเลือกตั้งคณะกรรมการบริหาร"
      }
    },
    {
      "type": "meetCandidates",
      "visible": true,
      "order": 2,
      "config": {
        "style": "card"
      }
    },
    {
      "type": "stats",
      "visible": true,
      "order": 3,
      "config": {
        "style": "gradient",
        "showPercentage": true,
        "showTotalEligible": true
      }
    },
    {
      "type": "electionBanner",
      "visible": true,
      "order": 4,
      "config": {
        "style": "image"
      }
    },
    {
      "type": "voteCTA",
      "visible": true,
      "order": 5,
      "config": {}
    }
  ],
  "vote": {
    "multiParty": {
      "gridCols": "auto",
      "cardVariant": "grid",
      "showDivider": true,
      "abstainStyle": "standard"
    }
  },
  "theme": {
    "primaryColor": "#8A2680",
    "accentColor": "#9333EA",
    "borderRadius": "rounded"
  }
}
```

---

## 🧱 Block Types — Home Page

### 1. Hero Block
- **Renders:** CountdownTimer + SAMO title + election status badge
- **Style presets:** `"gradient"` (ปัจจุบัน), `"minimal"`, `"image-bg"`, `"cinematic"`
- **Editable config:**
  - `title` (string) — ชื่อหลัก เช่น "SAMO 49"
  - `subtitle` (string) — คำอธิบาย
  - `showCountdown` (boolean)
  - `showStatusBadge` (boolean)
  - `style` (preset select)
- **Locked:** Countdown logic, election phase detection, responsive layout

### 2. Stats Block
- **Renders:** จำนวนผู้ใช้สิทธิ์ + percentage + total eligible
- **Style presets:** `"gradient"` (ปัจจุบัน), `"card"`, `"minimal"`, `"live-counter"`
- **Editable config:**
  - `showPercentage` (boolean)
  - `showTotalEligible` (boolean)
  - `style` (preset select)
- **Locked:** ข้อมูลตัวเลขดึงจาก DB เท่านั้น, real-time polling logic

### 3. MeetCandidates Block
- **Renders:** MeetCandidatesCard component
- **Style presets:** `"card"` (ปัจจุบัน), `"banner"`, `"minimal"`
- **Editable config:**
  - `style` (preset select)
- **Locked:** Link ไปหน้า candidates

### 4. ElectionBanner Block
- **Renders:** ภาพโปรโมท "เลือกตั้ง"
- **Editable config:**
  - `style` (preset select): `"image"`, `"illustration"`, `"hidden"`
- **Locked:** ภาพมาจาก static assets

### 5. VoteCTA Block
- **Renders:** ปุ่ม Vote/Login ที่เปลี่ยนตาม election status + login state
- **Editable config:** (minimal — ปุ่มนี้ซับซ้อนเชิง logic มาก)
  - สีปุ่มตาม theme เท่านั้น
- **Locked:** ทุก logic ของปุ่ม (redirect, election status check, login flow)

---

## 🗳️ Block Types — Vote Page (Multi-Party)

### MultiPartyView Config

```
┌─────────────────────────────────────────┐
│  [Party 1]  [Party 2]  [Party 3]       │ ← PartyGrid block
│  [Party 4]  [Party 5]                  │
├─────────────────────────────────────────┤
│           ─── หรือ ───                  │ ← Divider block (toggle)
│  ┌─────────────────────────────────┐    │
│  │  [Ban] งดออกเสียง               │    │ ← Abstain block
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Configurable:**
| Key | Type | Options | Default |
|-----|------|---------|---------|
| `gridCols` | select | `"2"`, `"3"`, `"auto"` | `"auto"` |
| `cardVariant` | select | `"grid"`, `"compact"` | `"grid"` |
| `showDivider` | boolean | — | `true` |
| `abstainStyle` | select | `"standard"`, `"compact"`, `"minimal"` | `"standard"` |

**⛔ HARD LOCKS (ห้าม config เด็ดขาด):**
1. ทุกพรรค (regularParties) ต้องแสดงครบเสมอ — ห้ามซ่อน
2. ปุ่มงดออกเสียงต้องแสดงเสมอ — ห้ามซ่อน
3. ห้ามมีปุ่ม "ไม่รับรอง" ใน MultiPartyView (ใช้เฉพาะ SinglePartyView)
4. onSelect / submitVote logic ห้ามแก้จาก config
5. VoteFooter + VoteConfirmationModal ไม่ได้เป็น block — ทำงานเหมือนเดิม

---

## 🏗️ Implementation Plan (สำหรับ Claude Code)

### Phase 1 — Database + API (ทำก่อน)
**Scope:** เล็ก, ไม่กระทบ UI ที่มี

1. เพิ่ม `pageLayout Json?` และ `themeConfig Json?` ใน `prisma/schema.prisma` → SystemConfig
2. สร้าง migration: `npx prisma migrate dev --name add_page_layout`
3. สร้าง API route: `src/app/api/admin/page-layout/route.js`
   - `GET` → return pageLayout จาก SystemConfig (ถ้า null → return default)
   - `PUT` → update pageLayout (ต้อง verify admin token)
4. อัปเดต `prisma/seed.js` → ใส่ default pageLayout ใน SystemConfig create

**Files แก้:**
- `prisma/schema.prisma`
- `prisma/seed.js`
- `src/app/api/admin/page-layout/route.js` (NEW)

### Phase 2 — BlockRenderer + HomeContent Refactor
**Scope:** ปานกลาง, แก้ HomeContent.js

1. สร้าง `src/components/blocks/BlockRenderer.js`
   - รับ `blocks[]` array → loop render component ตาม type
   - mapping: `{ hero: HeroBlock, stats: StatsBlock, ... }`
2. แยก sections ใน HomeContent.js ออกเป็น sub-components:
   - `src/components/blocks/HeroBlock.js`
   - `src/components/blocks/StatsBlock.js`
   - `src/components/blocks/MeetCandidatesBlock.js`
   - `src/components/blocks/ElectionBannerBlock.js`
   - `src/components/blocks/VoteCTABlock.js`
3. แก้ HomeContent.js → fetch pageLayout จาก API → ส่งเข้า BlockRenderer
4. **Critical:** ทุก block component ต้องรับ `config` prop แต่มี default ครบ
   หมายความว่าถ้าไม่มี config ส่งมา ต้อง render เหมือนเดิมทุกประการ

**Files แก้:**
- `src/components/HomeContent.js` (refactor)
- `src/components/blocks/BlockRenderer.js` (NEW)
- `src/components/blocks/HeroBlock.js` (NEW — extract จาก HomeContent)
- `src/components/blocks/StatsBlock.js` (NEW — extract จาก HomeContent)
- `src/components/blocks/MeetCandidatesBlock.js` (NEW — extract จาก HomeContent)
- `src/components/blocks/ElectionBannerBlock.js` (NEW — extract จาก HomeContent)
- `src/components/blocks/VoteCTABlock.js` (NEW — extract จาก HomeContent)

### Phase 3 — MultiPartyView LEGO Support
**Scope:** เล็ก, แก้แค่ MultiPartyView.js

1. MultiPartyView รับ `config` prop เพิ่ม (default ครบ)
2. ใช้ config เพื่อปรับ: gridCols, cardVariant, showDivider, abstainStyle
3. **ห้ามแก้:** regularParties loop, specialOptions.abstain rendering, onSelect logic
4. แก้ PartyCard.js → เมื่อ `onViewDetails` prop มี ให้เปิด modal แทน Link

**Files แก้:**
- `src/components/vote/MultiPartyView.js` (refactor)
- `src/components/PartyCard.js` (minor — onViewDetails wiring)

### Phase 4 — Admin UI "Page Design" Tab
**Scope:** ใหญ่ที่สุด, เพิ่ม tab ใน admin

1. เพิ่ม tab "Page Design" ใน `menuItems` array (admin/page.js)
2. สร้าง `src/components/admin/PageDesignTab.js`
   - Left: Live Preview (render BlockRenderer ใน scaled-down container)
   - Right: Config Panel (click block → show config form)
   - Drag-and-drop reorder (reference: DynamicListEditor.js)
   - Style preset selector (thumbnail grid)
   - Color picker (constrained palette)
3. "Publish" button → PUT to `/api/admin/page-layout`

**Files แก้:**
- `src/app/admin/page.js` (เพิ่ม tab)
- `src/components/admin/PageDesignTab.js` (NEW)

---

## ⚙️ MultiPartyView Config — Detailed Behavior

### gridCols
```
"auto" → w-[calc(50%-0.5rem)] sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-1.5rem)]  (ปัจจุบัน)
"2"    → w-[calc(50%-0.5rem)] sm:w-[calc(50%-1.5rem)]  (บังคับ 2 คอลัมน์)
"3"    → w-[calc(50%-0.5rem)] sm:w-[calc(33.33%-1rem)]  (บังคับ 3 ตั้งแต่ sm)
```

### cardVariant
```
"grid"    → PartyCard variant="grid" (ปัจจุบัน — โลโก้ + ชื่อ + link)
"compact" → PartyCard variant="compact" (โลโก้เล็ก + ชื่อ ไม่มี link detail)
```

### abstainStyle
```
"standard" → ปุ่มเต็ม: icon + ชื่อ + subtitle (ปัจจุบัน)
"compact"  → ปุ่มเล็กลง: icon + ชื่อ only, rounded-full, max-w-xs
"minimal"  → text link style: ไม่มี background, แค่ text + icon underline
```

### showDivider
```
true  → แสดงเส้น "─── หรือ ───" (ปัจจุบัน)
false → ไม่แสดง, มีแค่ margin ระหว่าง grid กับ abstain
```

---

## 🔒 Guardrails — สิ่งที่ระบบ MUST enforce

1. **Election Integrity:** ทุกตัวเลือกโหวตต้องแสดงครบเสมอ ไม่ว่า config จะตั้งค่ายังไง
2. **Responsive Safety:** ทุก style preset ต้อง responsive — ไม่มี absolute positioning
3. **Accessibility:** contrast ratio ต้องผ่าน WCAG AA — color picker จำกัด palette
4. **Fallback:** ถ้า pageLayout เป็น null → render default layout เหมือนปัจจุบัน 100%
5. **Backward Compatible:** ทุก component ใหม่ต้องมี default props ครบ ไม่ breaking change

---

## 📁 Final File Structure (After All Phases)

```
src/
├── components/
│   ├── blocks/                          # ⭐ NEW — Block system
│   │   ├── BlockRenderer.js             # Loop render blocks by type
│   │   ├── HeroBlock.js                 # Extracted from HomeContent
│   │   ├── StatsBlock.js                # Extracted from HomeContent
│   │   ├── MeetCandidatesBlock.js       # Extracted from HomeContent
│   │   ├── ElectionBannerBlock.js       # Extracted from HomeContent
│   │   └── VoteCTABlock.js              # Extracted from HomeContent
│   ├── admin/
│   │   └── PageDesignTab.js             # ⭐ NEW — Visual editor tab
│   ├── vote/
│   │   ├── MultiPartyView.js            # 🔧 MODIFIED — accepts config prop
│   │   └── SinglePartyView.js           # UNCHANGED
│   ├── HomeContent.js                   # 🔧 MODIFIED — uses BlockRenderer
│   └── PartyCard.js                     # 🔧 MODIFIED — onViewDetails wiring
├── app/
│   ├── admin/page.js                    # 🔧 MODIFIED — add PageDesign tab
│   └── api/admin/
│       └── page-layout/route.js         # ⭐ NEW — GET/PUT page layout
prisma/
├── schema.prisma                        # 🔧 MODIFIED — add pageLayout, themeConfig
└── seed.js                              # 🔧 MODIFIED — add default layout
```
