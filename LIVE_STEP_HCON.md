# LIVE_STEP_HCON.md — Migrate Hardcoded Strings to GlobalConfig

## READ FIRST
Read `CLAUDE.md`, `LIVE_EDITOR_ARCHITECTURE.md`, `MASTER_PLAN.md`, and 
`DECISIONS.md`. Follow strictly.

## CONTEXT
H-G (Global Config Foundation) added the foundation: schema, Context, 
admin tab. But NO consumer reads from globalConfig yet — every page still 
displays hardcoded "SAMO 49", "ปีการศึกษา 2569", "© FMS@PSU 2026".

This step migrates ALL hardcoded election strings to `useGlobalConfig()` 
so admin's edits in the "ตั้งค่าทั่วไป" tab actually appear on every page.

After this step: changing "SAMO 49" → "SAMO 51" in admin → entire site 
shows "SAMO 51" everywhere.

## SCOPE (DO NOT EXCEED)
Modify exactly 9 files:

1. `src/components/HomeContent.js` — hero rendering
2. `src/app/results/page.js` — results header
3. `src/components/SiteFooter.js` — copyright text
4. `src/app/vote/page.js` — vote header
5. `src/app/candidates/page.js` — candidates page heading
6. `src/app/closed/page.js` — closed message
7. `src/app/login/page.js` — login footer
8. `src/components/admin/ResultsEditorPreview.js` — match results page
9. `src/components/admin/previews/PagePreviewRenderer.js` — preview tiles

Do NOT modify:
- electionConfig.js (dates stay there until Phase 4)
- elementRegistry.js (preset defaults — stays hardcoded as fallback)
- editorDummyData.js DUMMY_ELECTION (stays — used as default fallback)
- statefulRegistry.js / templateEngine.js / stateResolver.js
- API routes / Prisma schema

Do NOT install packages.
Do NOT migrate `src/app/layout.js` metadata (that's server component — needs separate handling)
Do NOT migrate `src/app/admin/page.js` admin label
Do NOT touch HeroBlock.js (dead code — Phase 4 cleanup)

## GLOBAL CONFIG FIELDS (Reference)

From `src/utils/globalConfigDefaults.js`:

```js
{
  electionName: "SAMO 49",            // full name "SAMO 49"
  electionNamePrefix: "SAMO",         // prefix only "SAMO"
  electionNumber: 49,                 // number only 49
  campaignTitle: "โครงการเลือกตั้งคณะกรรมการบริหาร",
  committeeName: "คณะกรรมการบริหาร",
  organizationName: "สโมสรนักศึกษาคณะวิทยาการจัดการ",
  organizationShort: "สโมสรนักศึกษา",
  facultyName: "คณะวิทยาการจัดการ",
  facultyShortEn: "FMS",
  university: "PSU",
  academicYearTh: 2569,
  electionCalendarYear: 2026,
  copyrightYear: 2026
}
```

Use `useGlobalConfig()` hook from `src/contexts/GlobalConfigContext.js`.

## MIGRATION PATTERNS

### Pattern 1: Single string replacement
**Before:**
```jsx
<h1>SAMO 49</h1>
```

**After:**
```jsx
import { useGlobalConfig } from '@/contexts/GlobalConfigContext'; // adjust path

function MyComponent() {
  const config = useGlobalConfig();
  return <h1>{config.electionName}</h1>;
}
```

### Pattern 2: Split rendering (Hero "SAMO" + "49" with gradient)
**Before:**
```jsx
<h1>
  <span>SAMO</span>
  <span className="gradient">49</span>
</h1>
```

**After:**
```jsx
const config = useGlobalConfig();
return (
  <h1>
    <span>{config.electionNamePrefix}</span>
    <span className="gradient">{config.electionNumber}</span>
  </h1>
);
```

### Pattern 3: Composite strings
**Before:**
```jsx
<p>ระบบเลือกตั้งสโมสรนักศึกษา คณะวิทยาการจัดการ ประจำปีการศึกษา 2569</p>
```

**After:**
```jsx
const config = useGlobalConfig();
return (
  <p>
    ระบบเลือกตั้ง{config.organizationShort} {config.facultyName} ประจำปีการศึกษา {config.academicYearTh}
  </p>
);
```

### Pattern 4: Footer copyright
**Before:**
```jsx
<p>© FMS@PSU 2026. All Rights Reserved.</p>
```

**After:**
```jsx
const config = useGlobalConfig();
return (
  <p>© {config.facultyShortEn}@{config.university} {config.copyrightYear}. All Rights Reserved.</p>
);
```

### Pattern 5: Hero subtitle with gradient span
**Before:**
```jsx
<h2>โครงการเลือกตั้ง<span className="gradient">คณะกรรมการบริหาร</span></h2>
```

**After:**
```jsx
const config = useGlobalConfig();
// Split: campaignTitle starts with "โครงการเลือกตั้ง" — extract committee part
// Approach: store campaignTitle as full string, use committeeName separately
return (
  <h2>
    {config.campaignTitle.replace(config.committeeName, '')}
    <span className="gradient">{config.committeeName}</span>
  </h2>
);
```

If the replace approach is fragile, use atomic fields:
```jsx
return (
  <h2>
    โครงการเลือกตั้ง<span className="gradient">{config.committeeName}</span>
  </h2>
);
```
(Keep the prefix "โครงการเลือกตั้ง" hardcoded since it's structural — only the committee name varies.)

## FILE-BY-FILE MIGRATION

### File 1: `src/components/HomeContent.js`

**Add import:**
```js
import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
```

**Inside component, get config:**
```js
const globalConfig = useGlobalConfig();
```

**Find `getText('hero-title', ...)` calls** in renderHero around line 205-274.
The current default fallbacks like `'SAMO 49'` should become globalConfig values:

```js
// BEFORE (around line 206):
const heroTitle = getText('hero-title', editorData?.title || 'SAMO 49');

// AFTER:
const heroTitle = getText('hero-title', editorData?.title || globalConfig.electionName);
```

Apply the same pattern for:
- `getText('hero-subtitle', ...)` → fallback to `globalConfig.campaignTitle`
- `getText('hero-subtitle2', ...)` → fallback to `globalConfig.organizationName`
- `getText('hero-year-badge', ...)` → fallback to `'ประจำปีการศึกษา ' + globalConfig.academicYearTh`

**For the split rendering of "SAMO" + "49"** (where the title is rendered with gradient on number):
If the current code splits the literal string "SAMO 49" into two `<span>`, change to use `electionNamePrefix` + `electionNumber` from globalConfig.

If admin overrides via `getText('hero-title')`, that's a single string — render as a single span. Only when using globalConfig defaults do we render split. Make this conditional:

```jsx
const heroTitleText = getText('hero-title', null); // null if not overridden
const useGlobalSplit = !heroTitleText;

return useGlobalSplit ? (
  <h1>
    <span>{globalConfig.electionNamePrefix}</span>
    <span className="gradient">{globalConfig.electionNumber}</span>
  </h1>
) : (
  <h1>{heroTitleText}</h1>
);
```

**For the inline footer** at the bottom of HomeContent (lines ~388-390):
If footer JSX still exists in HomeContent, replace with:
```jsx
import SiteFooter from './SiteFooter';
// ...
<SiteFooter className="..." />
```
(SiteFooter already migrated in this step — see File 3.)

### File 2: `src/app/results/page.js`

This is a **client component** (likely "use client"). Add hook usage.

**Add import:**
```js
import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
```

**Inside the page component:**
```js
const globalConfig = useGlobalConfig();
```

**Find line 385 area:**
```jsx
// BEFORE:
<h1 className="...">
  ผลการเลือกตั้ง <span className="text-[#8A2680]">SAMO 49</span>
</h1>

// AFTER:
<h1 className="...">
  ผลการเลือกตั้ง <span className="text-[#8A2680]">{globalConfig.electionName}</span>
</h1>
```

**Find line 388 area (subtitle):**
```jsx
// BEFORE:
<p>ระบบเลือกตั้งสโมสรนักศึกษา คณะวิทยาการจัดการ ประจำปีการศึกษา 2569</p>

// AFTER:
<p>
  ระบบเลือกตั้ง{globalConfig.organizationShort} {globalConfig.facultyName} ประจำปีการศึกษา {globalConfig.academicYearTh}
</p>
```

### File 3: `src/components/SiteFooter.js`

**Replace entire component:**

```jsx
"use client";

import { useGlobalConfig } from '@/contexts/GlobalConfigContext';

export default function SiteFooter({ className = "" }) {
  const config = useGlobalConfig();
  
  return (
    <footer className={`text-center py-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm ${className}`}>
      <p className="text-slate-400 text-sm">
        © {config.facultyShortEn}@{config.university} {config.copyrightYear}. All Rights Reserved.
      </p>
    </footer>
  );
}
```

This is the FIRST consumer that uses globalConfig — every page that imports SiteFooter now reads from config automatically.

### File 4: `src/app/vote/page.js`

**Add hook + import.**

**Find line 134 area:**
```jsx
// BEFORE:
<h1>เลือกตั้ง<span className="text-[#8A2680]">สโมสรนักศึกษา</span></h1>

// AFTER:
const globalConfig = useGlobalConfig();
// ...
<h1>เลือกตั้ง<span className="text-[#8A2680]">{globalConfig.organizationShort}</span></h1>
```

If there are other hardcoded strings in vote/page.js (e.g. faculty name, year), migrate them too.

### File 5: `src/app/candidates/page.js`

**Add hook + import.**

**Find line 72 area:**
```jsx
// BEFORE:
<h1>Candidates 2026</h1>

// AFTER:
<h1>Candidates {globalConfig.electionCalendarYear}</h1>
```

If footer is inline (line 119 area), replace with `<SiteFooter />`:
```jsx
import SiteFooter from '@/components/SiteFooter';
// Replace inline footer JSX:
<SiteFooter />
```

### File 6: `src/app/closed/page.js`

**Add hook + import.**

**Find line 28 area:**
```jsx
// BEFORE:
<p>วันที่ 6 กุมภาพันธ์ 2569 เวลา 08.30 น. - 17.00 น.</p>
```

This date is tied to ELECTION_CONFIG dates (not globalConfig). Two options:

**Option A — Keep date hardcoded for now (recommended):**
Leave the date string. It's tied to electionConfig.js dates which migrate in Phase 4 (H-ELECTION-DATES). Don't migrate now.

**Option B — Use academicYearTh:**
Replace just the year part:
```jsx
<p>วันที่ 6 กุมภาพันธ์ {globalConfig.academicYearTh} เวลา 08.30 น. - 17.00 น.</p>
```

Pick Option A for cleanliness. Only migrate things that are clear globalConfig values.

If footer is inline (line 119), replace with `<SiteFooter />`.

### File 7: `src/app/login/page.js`

If footer is inline (line 218), replace with `<SiteFooter />`:
```jsx
import SiteFooter from '@/components/SiteFooter';
// Replace inline footer JSX:
<SiteFooter />
```

No other migration needed in login page (no hardcoded election strings beyond footer).

### File 8: `src/components/admin/ResultsEditorPreview.js`

**Add hook + import.**

The preview component should use globalConfig too — when admin changes the 
config, the editor preview also updates immediately.

**Find the header rendering:**
```jsx
// BEFORE:
<h1>ผลการเลือกตั้ง <span>SAMO 49</span></h1>
<p>ระบบเลือกตั้งสโมสรนักศึกษา คณะวิทยาการจัดการ ประจำปีการศึกษา 2569</p>

// AFTER:
const globalConfig = useGlobalConfig();
// ...
<h1>ผลการเลือกตั้ง <span>{globalConfig.electionName}</span></h1>
<p>
  ระบบเลือกตั้ง{globalConfig.organizationShort} {globalConfig.facultyName} ประจำปีการศึกษา {globalConfig.academicYearTh}
</p>
```

### File 9: `src/components/admin/previews/PagePreviewRenderer.js`

This file has small preview tiles for various pages. Migrate the visible 
strings:

**Find line 109 area** (preview tile for home):
```jsx
// BEFORE:
<h1>SAMO<span>49</span></h1>
<p>โครงการเลือกตั้งคณะกรรมการบริหาร</p>
<p>สโมสรนักศึกษาคณะวิทยาการจัดการ</p>
<p>ประจำปีการศึกษา 2569</p>

// AFTER:
const globalConfig = useGlobalConfig();
// ...
<h1>{globalConfig.electionNamePrefix}<span>{globalConfig.electionNumber}</span></h1>
<p>{globalConfig.campaignTitle}</p>
<p>{globalConfig.organizationName}</p>
<p>ประจำปีการศึกษา {globalConfig.academicYearTh}</p>
```

**Find line 194 area** (vote preview tile):
```jsx
// BEFORE:
<h1>เลือกตั้ง<span>สโมสรนักศึกษา</span></h1>

// AFTER:
<h1>เลือกตั้ง<span>{globalConfig.organizationShort}</span></h1>
```

## DO NOT
- Do NOT modify electionConfig.js (dates handled in Phase 4)
- Do NOT modify elementRegistry.js preset defaults (stays as static fallback)
- Do NOT modify DUMMY_ELECTION (stays for editor demo data)
- Do NOT modify layout.js metadata (server component — Phase 4)
- Do NOT modify HeroBlock.js (dead code)
- Do NOT install new packages
- Do NOT change useGlobalConfig hook implementation

## VERIFICATION

After all 9 files migrated:

1. `npm run build` passes exit 0

2. **Test Admin Edit Flow:**
   - Open admin → "ตั้งค่าทั่วไป"
   - Change `electionName` from "SAMO 49" → "SAMO 51"
   - Change `academicYearTh` from 2569 → 2570
   - Change `copyrightYear` from 2026 → 2027
   - Save

3. **Verify Production Pages:**
   - Open `/` → Hero shows "SAMO" + "51" (split) — or single "SAMO 51" if admin overrode
   - Footer shows "© FMS@PSU 2027"
   - Open `/results` → "ผลการเลือกตั้ง SAMO 51" + "ประจำปีการศึกษา 2570"
   - Open `/vote` → check organizationShort updated
   - Open `/candidates` → "Candidates 2027" + footer
   - Open `/closed` → footer updated (date stays as is)
   - Open `/login` → footer updated

4. **Verify Admin Preview:**
   - Admin → ออกแบบหน้าเว็บ → "ผลคะแนน"
   - Header shows "SAMO 51" + "ประจำปีการศึกษา 2570"
   - Footer in preview shows "© FMS@PSU 2027"

5. **Restore values:**
   - Change back to defaults if needed
   - Verify reverts work

6. **No regression:**
   - All pages still render
   - No console errors about missing config fields
   - Hover/click in editor still works

## REPORT FORMAT

```
Migrated 9 files to use useGlobalConfig():

Modified src/components/HomeContent.js — hero title (split SAMO/49), subtitle, year badge use globalConfig fallbacks; replaced inline footer with SiteFooter
Modified src/app/results/page.js — header h1 + subtitle use globalConfig
Modified src/components/SiteFooter.js — first globalConfig consumer; reads facultyShortEn + university + copyrightYear
Modified src/app/vote/page.js — vote header organizationShort
Modified src/app/candidates/page.js — page heading uses electionCalendarYear; replaced footer with SiteFooter
Modified src/app/closed/page.js — replaced footer with SiteFooter (date string kept hardcoded — Phase 4)
Modified src/app/login/page.js — replaced footer with SiteFooter
Modified src/components/admin/ResultsEditorPreview.js — header + subtitle use globalConfig
Modified src/components/admin/previews/PagePreviewRenderer.js — preview tiles use globalConfig

Not migrated (per spec):
- electionConfig.js (Phase 4)
- elementRegistry.js / DUMMY_ELECTION (kept as fallbacks)
- layout.js metadata (server component — separate)
- HeroBlock.js (dead code)
- closed page date (tied to electionConfig dates)

Build: PASS
```

No other commentary.
