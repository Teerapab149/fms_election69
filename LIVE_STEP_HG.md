# LIVE_STEP_HG.md — Global Config Foundation

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
"SAMO 49", "ประจำปีการศึกษา 2569", "© FMS@PSU 2026", "คณะวิทยาการจัดการ" 
are hardcoded across 30+ locations in 12+ files. Diagnosis confirmed:
- No existing config field for these strings
- ELECTION_YEAR (2027) is "next year" placeholder, not academic year
- HeroBlock is dead code (HomeContent renders inline)
- Footer JSX duplicated across 6 pages

This step adds the FOUNDATION for global config:
1. DB schema field `globalConfig Json?` on SystemConfig
2. React Context provider for distribution
3. Admin tab "ตั้งค่าทั่วไป" with form + save
4. API route GET/PUT `/api/admin/global-config`
5. NO consumer migration yet — that comes in next steps

After this step, the system supports global config but no page reads it yet. 
Hardcoded strings still display. Subsequent steps replace them one at a time.

## SCOPE (DO NOT EXCEED)
Modify exactly 4 files, create 4 new files:

CREATE:
1. `src/contexts/GlobalConfigContext.js` — Context + provider + hook
2. `src/utils/globalConfigDefaults.js` — Default values + field metadata
3. `src/app/api/admin/global-config/route.js` — GET/PUT API
4. `src/components/admin/GlobalConfigTab.js` — Admin UI

MODIFY:
5. `prisma/schema.prisma` — add globalConfig field
6. `src/components/Providers.js` — wrap with GlobalConfigProvider
7. `src/app/layout.js` — fetch globalConfig SSR + pass to Providers
8. `src/app/admin/page.js` — add new tab to admin sidebar

Run prisma migration after schema change.

Do NOT modify:
- Any component that uses hardcoded strings (those are migrated in next steps)
- electionConfig.js (legacy still used)
- Any page that displays the hardcoded strings

## PART 1: Update `prisma/schema.prisma`

Find the `SystemConfig` model. Add `globalConfig` field:

```prisma
model SystemConfig {
  id            Int      @id @default(1)
  isVoteOpen    Boolean  @default(false)
  showResult    Boolean  @default(false)
  systemMode    String   @default("AUTO")
  googleFormUrl String?
  pageLayout    Json?
  themeConfig   Json?
  globalConfig  Json?    // ← NEW
  updatedAt     DateTime @updatedAt
}
```

Run migration:
```bash
npx prisma migrate dev --name add-global-config
npx prisma generate
```

If using a non-dev environment (production), use:
```bash
npx prisma db push
```

## PART 2: CREATE `src/utils/globalConfigDefaults.js`

```js
/**
 * Default values for global config — used when DB is empty or as fallback.
 * Field metadata describes UI grouping + labels for admin tab.
 */

export const GLOBAL_CONFIG_DEFAULTS = {
  // Election identity
  electionName: "SAMO 49",
  electionNamePrefix: "SAMO",
  electionNumber: 49,
  
  // Project / committee titles
  campaignTitle: "โครงการเลือกตั้งคณะกรรมการบริหาร",
  committeeName: "คณะกรรมการบริหาร",
  organizationName: "สโมสรนักศึกษาคณะวิทยาการจัดการ",
  organizationShort: "สโมสรนักศึกษา",
  
  // Faculty / institution
  facultyName: "คณะวิทยาการจัดการ",
  facultyShortEn: "FMS",
  university: "PSU",
  
  // Academic year (Thai BE)
  academicYearTh: 2569,
  
  // Calendar years
  electionCalendarYear: 2026,
  copyrightYear: 2026
};

/**
 * Field metadata for admin form. Groups + labels.
 */
export const GLOBAL_CONFIG_FIELDS = [
  {
    group: "ข้อมูลการเลือกตั้ง",
    fields: [
      { key: "electionName", label: "ชื่อการเลือกตั้ง (เต็ม)", type: "text", hint: "เช่น SAMO 49" },
      { key: "electionNamePrefix", label: "ชื่อย่อ", type: "text", hint: "เช่น SAMO (ส่วนหน้า)" },
      { key: "electionNumber", label: "เลขครั้งที่", type: "number", hint: "เช่น 49" },
      { key: "academicYearTh", label: "ปีการศึกษา (พ.ศ.)", type: "number", hint: "เช่น 2569" },
      { key: "electionCalendarYear", label: "ปีการเลือกตั้ง (ค.ศ.)", type: "number", hint: "เช่น 2026" }
    ]
  },
  {
    group: "ข้อมูลโครงการ",
    fields: [
      { key: "campaignTitle", label: "ชื่อโครงการ", type: "text", hint: "เช่น โครงการเลือกตั้งคณะกรรมการบริหาร" },
      { key: "committeeName", label: "ชื่อคณะกรรมการ", type: "text", hint: "เช่น คณะกรรมการบริหาร" }
    ]
  },
  {
    group: "ข้อมูลองค์กร",
    fields: [
      { key: "organizationName", label: "ชื่อองค์กร (เต็ม)", type: "text", hint: "เช่น สโมสรนักศึกษาคณะวิทยาการจัดการ" },
      { key: "organizationShort", label: "ชื่อย่อ", type: "text", hint: "เช่น สโมสรนักศึกษา" },
      { key: "facultyName", label: "ชื่อคณะ", type: "text", hint: "เช่น คณะวิทยาการจัดการ" },
      { key: "facultyShortEn", label: "ชื่อคณะ (อักษรย่อ EN)", type: "text", hint: "เช่น FMS" },
      { key: "university", label: "มหาวิทยาลัย", type: "text", hint: "เช่น PSU" }
    ]
  },
  {
    group: "ลิขสิทธิ์",
    fields: [
      { key: "copyrightYear", label: "ปีลิขสิทธิ์ (ค.ศ.)", type: "number", hint: "เช่น 2026 (สำหรับ © FMS@PSU 2026)" }
    ]
  }
];

/**
 * Merge user config over defaults — ensures all keys exist.
 */
export function mergeWithDefaults(userConfig) {
  return { ...GLOBAL_CONFIG_DEFAULTS, ...(userConfig || {}) };
}
```

## PART 3: CREATE `src/contexts/GlobalConfigContext.js`

```jsx
"use client";

import { createContext, useContext } from 'react';
import { GLOBAL_CONFIG_DEFAULTS, mergeWithDefaults } from '../utils/globalConfigDefaults';

const GlobalConfigContext = createContext(GLOBAL_CONFIG_DEFAULTS);

/**
 * GlobalConfigProvider — wraps app tree, distributes globalConfig.
 * 
 * Usage in layout.js:
 *   const config = await fetchGlobalConfig();
 *   <GlobalConfigProvider value={config}>...</GlobalConfigProvider>
 * 
 * Usage in components:
 *   const config = useGlobalConfig();
 *   <h1>{config.electionName}</h1>
 */
export function GlobalConfigProvider({ value, children }) {
  // Always merge with defaults to ensure all keys exist
  const merged = mergeWithDefaults(value);
  return (
    <GlobalConfigContext.Provider value={merged}>
      {children}
    </GlobalConfigContext.Provider>
  );
}

/**
 * useGlobalConfig — returns current global config (with defaults merged).
 * Always returns a complete config object — never null/undefined.
 */
export function useGlobalConfig() {
  return useContext(GlobalConfigContext);
}
```

## PART 4: CREATE `src/app/api/admin/global-config/route.js`

Use the same RSA-token admin auth pattern as existing `/api/admin/page-layout`. 
If you don't know the exact pattern, check `src/app/api/admin/page-layout/route.js` 
for reference and mirror it.

```js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/admin-auth'; // adjust import to actual path used in /api/admin/page-layout

// GET /api/admin/global-config
export async function GET(request) {
  // Verify admin token (same pattern as page-layout route)
  const token = request.headers.get('x-admin-token');
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 },
      select: { globalConfig: true }
    });
    
    return NextResponse.json({
      globalConfig: config?.globalConfig || null
    });
  } catch (e) {
    console.error('GET globalConfig error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/admin/global-config
export async function PUT(request) {
  const token = request.headers.get('x-admin-token');
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { globalConfig } = body;
    
    if (typeof globalConfig !== 'object' || globalConfig === null) {
      return NextResponse.json({ error: 'globalConfig must be an object' }, { status: 400 });
    }

    const updated = await prisma.systemConfig.upsert({
      where: { id: 1 },
      create: { id: 1, globalConfig },
      update: { globalConfig }
    });

    return NextResponse.json({
      success: true,
      globalConfig: updated.globalConfig
    });
  } catch (e) {
    console.error('PUT globalConfig error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

CRITICAL: match the EXACT auth pattern of `/api/admin/page-layout/route.js`. 
If the verification function has a different name (e.g. `verifyAdminAuth`, 
`isAdmin`, etc.), use the same one. If the route uses `cookies()` instead of 
`x-admin-token` header, mirror that.

## PART 5: Modify `src/components/Providers.js`

Wrap children with GlobalConfigProvider AFTER SessionProvider.

**Find** the existing Providers component:
```jsx
"use client";
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
```

(Adjust to match actual current implementation.)

**Update** to accept and pass globalConfig:
```jsx
"use client";
import { SessionProvider } from 'next-auth/react';
import { GlobalConfigProvider } from '../contexts/GlobalConfigContext';

export default function Providers({ children, session, globalConfig }) {
  return (
    <SessionProvider session={session}>
      <GlobalConfigProvider value={globalConfig}>
        {children}
      </GlobalConfigProvider>
    </SessionProvider>
  );
}
```

## PART 6: Modify `src/app/layout.js`

Fetch globalConfig server-side and pass to Providers.

**Find** the root layout. It likely has a `getServerSession()` call. Add a 
parallel fetch for globalConfig:

```jsx
import { prisma } from '@/lib/prisma'; // adjust path to actual

async function getGlobalConfig() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 },
      select: { globalConfig: true }
    });
    return config?.globalConfig || null;
  } catch (e) {
    console.error('Failed to fetch globalConfig:', e);
    return null;
  }
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions); // existing
  const globalConfig = await getGlobalConfig();         // NEW

  return (
    <html lang="th">
      <body>
        <Providers session={session} globalConfig={globalConfig}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

Adjust to actual structure of layout.js — only ADD the fetch + prop pass, 
don't restructure existing code.

## PART 7: CREATE `src/components/admin/GlobalConfigTab.js`

```jsx
"use client";

import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import { GLOBAL_CONFIG_FIELDS, GLOBAL_CONFIG_DEFAULTS } from '../../utils/globalConfigDefaults';

/**
 * GlobalConfigTab — admin form to edit globalConfig.
 * 
 * Props:
 *   adminToken: string — RSA-encrypted admin auth token
 */
export default function GlobalConfigTab({ adminToken }) {
  const [config, setConfig] = useState(GLOBAL_CONFIG_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  // Initial fetch
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/global-config', {
          headers: { 'x-admin-token': adminToken }
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (data.globalConfig) {
          setConfig({ ...GLOBAL_CONFIG_DEFAULTS, ...data.globalConfig });
        }
      } catch (e) {
        console.error(e);
        setError('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [adminToken]);

  function handleChange(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSavedAt(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/global-config', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': adminToken 
        },
        body: JSON.stringify({ globalConfig: config })
      });
      if (!res.ok) throw new Error('Save failed');
      setSavedAt(new Date());
    } catch (e) {
      console.error(e);
      setError('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  function handleResetField(key) {
    setConfig(prev => ({ ...prev, [key]: GLOBAL_CONFIG_DEFAULTS[key] }));
    setSavedAt(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#8A2680]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 mb-2">ตั้งค่าทั่วไป</h2>
        <p className="text-sm text-slate-500">
          ข้อมูลที่ใช้ทั่วทั้งเว็บไซต์ — เปลี่ยนที่นี่ที่เดียว ทุกหน้าเปลี่ยนตาม
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form sections */}
      <div className="space-y-6">
        {GLOBAL_CONFIG_FIELDS.map(group => (
          <div key={group.group} className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">{group.group}</h3>
            <div className="space-y-4">
              {group.fields.map(field => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">{field.label}</label>
                    <button
                      type="button"
                      onClick={() => handleResetField(field.key)}
                      className="text-[10px] text-slate-400 hover:text-[#8A2680]"
                    >
                      ↺ ค่าเริ่มต้น
                    </button>
                  </div>
                  <input
                    type={field.type}
                    value={config[field.key] ?? ''}
                    onChange={(e) => handleChange(
                      field.key, 
                      field.type === 'number' ? Number(e.target.value) : e.target.value
                    )}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#8A2680] focus:outline-none text-sm"
                  />
                  {field.hint && (
                    <p className="text-[10px] text-slate-400 mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 mt-6 bg-white rounded-2xl border border-slate-200 shadow-lg p-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {savedAt 
            ? <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" /> บันทึกแล้ว
              </span>
            : 'ยังไม่ได้บันทึก'
          }
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#8A2680] text-white text-sm font-bold rounded-lg hover:bg-[#7a2270] disabled:opacity-50 flex items-center gap-2"
        >
          {saving 
            ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
            : <><Save className="w-4 h-4" /> บันทึก</>
          }
        </button>
      </div>
    </div>
  );
}
```

## PART 8: Modify `src/app/admin/page.js`

Add the new tab to admin sidebar.

**Find** the admin tabs definition (likely an array or switch). Add an entry 
for the new tab. Insert before existing tabs, or as the FIRST tab (since 
"ตั้งค่าทั่วไป" is foundational).

```js
import GlobalConfigTab from '../../components/admin/GlobalConfigTab';

// Inside the tabs config or rendering switch:
{ id: 'globalConfig', label: 'ตั้งค่าทั่วไป', icon: Settings }, // adjust icon import

// In the rendering switch:
{activeTab === 'globalConfig' && <GlobalConfigTab adminToken={adminToken} />}
```

Match the existing admin tab pattern in `admin/page.js`. If the file uses 
specific structure (e.g., AdminLayout wrapper, sidebar component), follow that.

## DO NOT
- Do NOT modify any component that currently uses hardcoded "SAMO 49" / "2569" etc.
- Do NOT modify electionConfig.js
- Do NOT touch HeroBlock.js (legacy / dead code)
- Do NOT replace any hardcoded string in this step — that's H-7a-FIX-1 onwards
- Do NOT install new npm packages
- Do NOT change existing API routes

## VERIFICATION

1. `npx prisma migrate dev --name add-global-config` succeeds
2. `npm run build` passes exit 0
3. Real `/` page renders identically (still hardcoded strings, no consumer migrated)
4. Admin → opens new "ตั้งค่าทั่วไป" tab
5. Form loads with default values: SAMO 49, FMS, 2569, etc.
6. Edit any field → save
7. Refresh page → values persist
8. Open `useGlobalConfig()` in any component → returns the saved values (test by adding a temporary console.log somewhere)
9. SystemConfig table in DB has globalConfig column populated

## REPORT FORMAT

```
Modified prisma/schema.prisma — added globalConfig Json? field to SystemConfig
Created src/utils/globalConfigDefaults.js — DEFAULTS + FIELDS metadata + mergeWithDefaults
Created src/contexts/GlobalConfigContext.js — GlobalConfigProvider + useGlobalConfig hook
Created src/app/api/admin/global-config/route.js — GET/PUT with admin token auth
Created src/components/admin/GlobalConfigTab.js — form UI with grouped sections + save
Modified src/components/Providers.js — wrapped with GlobalConfigProvider
Modified src/app/layout.js — fetch globalConfig SSR + pass to Providers
Modified src/app/admin/page.js — added "ตั้งค่าทั่วไป" tab
Migration: PASS
Build: PASS
```

No other commentary. Do not run dev server. Do not auto-test in browser.
