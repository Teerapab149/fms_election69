# HANDOFF — ระบบ colour themes (ต่อจาก session ที่ทำ Task 1–3)

เขียน 2026-07-03 ตอน context จะเต็ม. Branch **`new-version`**. Self-contained.
อ่านคู่กับ `CLAUDE.md` (Engineering Discipline) เสมอ.

---

## 0) TL;DR — สถานะปัจจุบัน

Product = 4 templates × colour themes (ไม่ใช่ web editor). ตอนนี้ **ทั้ง 4 template
มี parity สมบูรณ์** (หน้า preview = หน้าจริงหลัง apply) และ 3 ใน 4 มีโทนสีให้เลือก:

| Template | layoutFamily | โทนสี (variants) |
|---|---|---|
| **gumroad** (นีโอบรูทัล) | `gumroad` | 5: base / cyber / retro / acid / **premium** |
| **verdure** (เซริฟ เอดิทอเรียล) | `verdure` | 4: คลาสสิก / อะคาเดมิก / ครีเอทีฟ / มินิมอล |
| **original** (SAMO คลาสสิก) | `original` | 4: **ม่วง FMS / ราชนาวี / ป่าลึก / เลือดหมู** |
| **studio-dark** (ดาร์ก+ไลม์) | `studio-dark` | **1 (ยังไม่มี variants ← Task 4)** |

- **active template ในDBตอนนี้ = `original`** (ต้องคงไว้เป็น `original` เสมอหลังทดสอบ).
- Git tree clean. commit ล่าสุด = `a3271c0`.

### commits ของ arc นี้ (ใหม่→เก่า)
```
a3271c0 feat(original): theme classic inner pages (Task 3b)
c7c288c fix(original): audit fixes — variant font + [var]/opacity bug
cb283f4 feat(original): 4 formal colour themes — home tokenised (Task 3a)
ada889a fix(verdure): one palette source + full-build variants
1c7a4e4 fix(apply): applying a template clears retired editor's overrides
ad3c66a fix(gumroad): one palette source — applied tokens match preview
964cd7e feat(gumroad): add cyber-pop-premium theme
be7516a feat(gumroad): full-palette colour themes + 3 new palettes
```

---

## 1) สถาปัตยกรรม — "single-source palette" (ต้องเข้าใจก่อนทำต่อ)

ทุก template ที่มี variants ยึด **pattern เดียวกัน** (เกิดจากการแก้บั๊ก "preview ≠ หน้าจริง"):

**ราก 1 ที่เคยพัง:** palette ถูกเขียน 2 ที่ไม่ตรงกัน — (a) component layout (สีที่ preview),
(b) `builtIn/*.js` Layer-1 tokens/element-configs (สีที่ inject ตอน apply บนหน้าจริงเท่านั้น).
**วิธีแก้ = palette แหล่งเดียว** ที่ทั้ง client + server import:

```
src/utils/gumroadPalettes.js   → GUMROAD_THEMES + gumroadTheme(slug)
src/utils/verdurePalettes.js   → VERDURE_THEMES + verdureTheme(slug) + hexToRgbTriple()
src/utils/originalPalettes.js  → ORIGINAL_THEMES + originalTheme(slug)
```
(เป็น plain module ไม่มี `"use client"` เพราะ server `builtIn/*.js` ต้อง import ได้)

**ชิ้นส่วนที่ต่อจาก palette แหล่งเดียว:**

1. **BaseStyles component** (client) — อ่าน active slug แล้วยิง CSS vars ลง root class:
   - `src/components/home/GumroadTheme.js` → `GumroadBaseStyles` → `.fms-app.gum-root`
     (specificity สูงกว่า local block `.g*-root` ของแต่ละหน้า → ชนะโดยไม่ต้องลบของเดิม)
   - `src/components/home/VerdureChrome.js` → `VerdureBaseStyles` → `.vd-root`
   - `src/components/home/OriginalTheme.js` → `OriginalBaseStyles` → `.orig-root`
   - ทุกตัวอ่าน `useActiveTemplateId()` + effect อ่าน `?slug=` ของ /template-preview
     (initial render ต้องตรง SSR แล้วค่อย re-tint — **ห้ามใช้ useSearchParams** จะ hydration mismatch)

2. **injectTemplateTheme** `src/utils/injectTemplateTheme.js` — สำหรับ preview morph
   (chooser + full-screen). Push palette เป็น **inline vars** ลง root ของ iframe +
   คลาส `.*-theming` (transition). มี branch: `startsWith("verdure"|"gumroad"|"original")`.
   **กติกา:** var ที่ injector push ต้อง = set เดียวกับที่ BaseStyles ยิง (ไม่งั้น morph ค้าง).

3. **builtIn template `buildXTemplate(slug, name, palette)`** — สร้าง Layer-1 tokens
   (`--color-primary` ฯลฯ) + element configs + page backgrounds + colorSwatch **จาก palette**.
   ทุก variant call builder ด้วย palette ของตัวเอง → apply แล้วพก palette เต็ม (ไม่ใช่แค่ swatch).
   - `builtIn/gumroad.js`, `builtIn/verdure.js`, `builtIn/original.js` = แบบนี้หมดแล้ว.

4. **register** ใน `src/components/admin/editor/templates/index.js` → `BUILT_IN_TEMPLATES`
   (import + เพิ่ม entry). Chooser จัดกลุ่มด้วย `layoutFamily` → 1 การ์ด + swatches อัตโนมัติ.

5. **dispatch** — หน้า live ต้องใช้ `startsWith('family')` ไม่ใช่ `=== 'family'`
   (ไม่งั้น variant ไม่ match). ที่แก้ไปแล้ว: `src/app/{vote,candidates,results,party,success,closed}/page.js`
   (`isGumroad`), `src/app/layout.js:225` (`startsWith("original")` — font override).
   HomeRenderer.js dispatch home ด้วย `HOME_LAYOUTS[slug] || HOME_LAYOUTS[fam]` (variant ผ่าน fam).

**"ราก 2 ที่เคยพัง"** = DB `SystemConfig.pageLayout.elementConfigs` มีขยะ 47 ตัวจาก editor เก่า
ทับหน้า live. แก้ที่ `src/app/api/admin/templates/[id]/apply/route.js` — ตอน apply จะ **strip**
`elementConfigs/elementVariants/elementVars/elementCss/themeTokens` ออก (เก็บ structural).
→ apply = ใช้ดีไซน์ template ทั้งชุด. (consumer ทุกตัว fallback เป็น `{}` = ใช้ค่า template → ปลอดภัย)

---

## 2) เหลืออะไร + ทำยังไง (เรียงตามที่ควรทำ)

### ★ Task 4 — studio-dark colour themes (ตัวสุดท้าย ให้ครบสมมาตร)

studio-dark ตอนนี้ **parity สะอาดอยู่แล้ว** (builtIn tokens == layout hardcoded palette เป๊ะ:
`BG#14140F SURFACE#1B1B14 INK#F2EDDF ACCENT#D5FF3F LINE#2E2E22`) แต่มีธีมเดียว.

**วิธีทำ (mirror verdure/gumroad pattern เป๊ะ):**
1. สร้าง `src/utils/studioDarkPalettes.js` — `STUDIO_THEMES` map + `studioDarkTheme(slug)`.
   - ดู slot จาก `builtIn/studio-dark.js` constants (บรรทัด ~41-50): `bg, surface, surface2,
     ink, ink2, ink3, line, accent, accent2`. ใส่ base = ค่าปัจจุบันเป๊ะ (byte-identical).
   - เสนอ 3-4 โทน (dark เหมือนกันแต่เปลี่ยน accent + อุณหภูมิพื้นดำ): เช่น
     ไลม์(เดิม) / ไซเบอร์ฟ้า(#38BDF8) / แมเจนต้า(#F472B6) / ทองอำพัน(#F59E0B).
2. หา layout base-styles ของ studio-dark. เช็คก่อนว่า StudioDark* components ยิง vars ที่ root
   ไหน (`grep -rn "sd-root\|--sd-\|StudioDarkShell" src/components`). ถ้ามี local var block
   ต่อหน้าเหมือน gumroad → ทำ `StudioDarkBaseStyles` + common class + specificity-override,
   หรือถ้ามี shell เดียว (เหมือน verdure) → ยิงที่ shell. **ต้อง audit ก่อนว่าใช้ pattern ไหน.**
   - `grep -rhoE "#(14140F|1B1B14|F2EDDF|D5FF3F|2E2E22|B5B0A2)" src/components/**/StudioDark*.js`
     ดูว่ามี hardcoded เยอะไหม + อยู่ที่ไหน. ถ้า hardcoded เยอะ (เหมือน gumroad elements) →
     sweep `#hex → var(--x, #hexfallback)` (ดู "กติกา sweep ปลอดภัย" ด้านล่าง).
3. injectTemplateTheme: เพิ่ม `else if (themeSlug.startsWith("studio-dark")) injectStudio(...)`.
4. `builtIn/studio-dark.js`: แปลงเป็น `buildStudioTemplate(slug,name,palette)` + export 3-4 variants
   (tokens จาก palette). register ใน index.js.
5. dispatch: หน้า live ใช้ `activeTemplateId === 'studio-dark'` (exact) หลายที่ →
   **ต้องเปลี่ยนเป็น `startsWith('studio-dark')`** ที่ `src/app/{vote,candidates,results,party,
   success,closed}/page.js` (ตัวแปร `isStudio`). **สำคัญ — ไม่งั้น variant ไม่ render.**
6. verify ด้วย apply จริงทุกธีม (ดู "ritual" ด้านล่าง) → restore original.

### ★ Polish original ให้ craft เท่า verdure (ตอบ feedback ประธานสโม "อยากได้ทางการ ประณีต")

เป็น design pass แยก (subjective). ไอเดีย:
- ยกระดับ typography/spacing/rhythm ของ OriginalHome + inner pages.
- เพิ่ม "ceremony moment" สัก 1 จุด (เช่น ตราคณะ intro ตอนเข้าคูหา แบบ wax-seal ของ verdure).
- motion ที่พอดี (ตอนนี้ home มี ping + fade-in-up; อาจเพิ่ม micro-interaction ที่สุขุม).
- **ทำหลัง Task 4** (ให้ระบบครบก่อน).

### ★ Known gaps เล็กๆ (เก็บตกได้ ไม่บล็อก)
- **กราฟ demographic ไม่ตามธีม** — recharts รับสีเป็นค่า JS (`fill` = SVG attr, var() ไม่ทำงาน
  เชื่อถือได้). จุด: `GumroadResults.js` (`const POPS = [...]`, gender funcs) +
  `ResultsDemographics.js` (`COLORS_BAR = '#8A2680'`). ถ้าจะแก้ = อ่าน token ฝั่ง JS
  (เช่น `getComputedStyle(document.querySelector('.fms-app')).getPropertyValue('--color-primary')`)
  แล้วส่งเข้า recharts. **อย่า sweep ค่าพวกนี้เป็น var() เด็ดขาด** (จะพังกราฟ).
- **original**: เหลือ `rgba(138,38,128,X)` glow 4 จุด + `purple-500` shadow 2 จุด (subtle) ยังไม่ theme.
  ถ้าจะเก็บ: `rgba(138,38,128,a)` → `rgba(var(--color-primary-rgb),a)` แต่ต้องเพิ่ม token
  `--color-primary-rgb` (ไม่มีใน allow-list — ดู VALID_TOKEN_KEYS ใน page-layout/route.js) หรือใช้
  `color-mix`. โดยรวม imperceptible.
- **CTA state buttons** ของ OriginalHome (`OriginalHome.js:~237,266`): ปุ่มตอน "เปิดโหวต" = เขียว
  `#10B981`, "ผลคะแนน" = ฟ้า `#0369a1` (semantic state colors — ตั้งใจไม่ theme). ถ้าประธานฯ
  อยากให้ปุ่มหลักตามธีมทุก state → map เป็น `[var(--color-primary)]` gradient. เป็น design call.

### ★ Pre-merge (ก่อน merge `new-version` → main)
- **`next build` เต็ม** (ยังไม่เคยรันครบทั้ง arc). ต้อง **stop dev ก่อน** (Windows `.next` lock):
  `preview_stop` → `npm run build` → ถ้า GREEN → `npm run smoke` (ต้องมี dev รันอยู่ ดู gate).
  ⚠️ เจ้าของดู live :3000 อยู่ — ขออนุญาต/เลือกจังหวะก่อน stop.
- Task C เดิมที่ยังค้าง (จาก handoff เก่า): `schema.prisma activeTemplateId @default("classic")` →
  เปลี่ยนเป็น `"original"`; ลบ `DesignLibrary.js` ที่ orphan.

---

## 3) กติกา "sweep ปลอดภัย" (บทเรียนจาก session นี้ — สำคัญมาก)

**เคยเกิด corruption รอบนึง** เพราะ regex escaping ใน bash heredoc พังกลายเป็น character-class
(`[#C026D3]` → matched ตัวอักษร c,0,2,6,D,3 ทุกตัว). กติกา:

1. **เขียน sweep script ด้วย Write tool ลง scratchpad** (ไม่ใช่ heredoc) — คุม escaping เอง.
2. **ใช้ `split(from).join(to)` (exact string) แทน regex** สำหรับ hex/utility ที่รู้ค่าแน่นอน —
   ไม่มี char-class risk. ถ้าต้อง regex ให้ระวัง `\[` escaping + ทดสอบ.
3. **จัดการ `[#hex]/opacity` ก่อน `[#hex]` ธรรมดา** — เพราะ Tailwind ทำ opacity บน arbitrary var
   ไม่ได้ (`[var(--x)]/5` พัง). แปลงเป็น `[color-mix(in_srgb,var(--x)_5%,transparent)]` แทน.
   (บั๊กนี้เคยหลุดที่ OriginalNavbar.js:260 — แก้ใน c7c288c แล้ว).
4. **fallback pattern (non-breaking):** `#hex → var(--x, #hex)` (CSS) หรือ `[#hex] → [var(--x)]`
   (Tailwind — **ห้ามใส่ comma-fallback ใน Tailwind arbitrary** `[var(--x,#hex)]` Tailwind parse ไม่ได้;
   ให้พึ่งว่า var นิยามบน root/`.fms-app` เสมอ). base คงเดิมเพราะ fallback/token = ค่าเดิม.
5. **light tints / scale** (เช่น `purple-50..400`) ที่ไม่มี ramp token → ใช้ Tailwind arbitrary
   `color-mix`: `bg-[color-mix(in_srgb,var(--color-primary)_6%,white)]` (underscore = space).
   **ยืนยันแล้วว่า Tailwind JIT คอมไพล์ color-mix arbitrary ได้** (ใช้ใน 3b).
6. **หลัง sweep เช็คทันที:** line count เท่าเดิม (ไม่ balloon) + `grep` residual + `grep` หา
   double-nest `var(--x, var(--` + คอมไพล์ (curl 200) + ไม่มี Next error overlay.
7. **อย่า sweep ค่าใน JS/quoted context** (recharts fill, color consts) — ใช้ negative-lookbehind
   `(?<!['"])` หรือ exclude ไฟล์/บรรทัดนั้น. ตรวจก่อนด้วย `grep -nE "['\"]#hex"`.

---

## 4) Verification ritual (ต้องทำทุกครั้งที่แตะ template)

**preview อย่างเดียวไม่พอ — ต้อง apply จริงแล้วดูหน้า live** (นี่คือรากบั๊กทั้งหมด):

```bash
# 1. login (token หมดอายุเรื่อยๆ — login ใหม่ได้เลย)
node scripts/dev-admin-login.js            # เขียน .dev-admin-token.local
TOKEN=$(cat .dev-admin-token.local)
# creds สำหรับ browser: user 6610510129 / pw 6610510129@email.psu.ac.th+ADMIN_FMS2026_2026_secret_9QpZxL

# 2. apply variant ที่จะเทสต์
curl -s -X POST --cookie "admin_token=$TOKEN" \
  "http://localhost:3000/fms-ovs/api/admin/templates/<slug>/apply" --max-time 60

# 3. เปิดหน้า live จริง (ไม่ใช่ /template-preview) แล้วตรวจ computed styles
#    ผ่าน preview_eval: อ่าน .fms-app --color-primary / root vars / residual สีเก่า
#    (เทียบ token ฝั่ง live vs palette — ต้องตรง)

# 4. เทสต์ base ของ template ด้วย (ต้อง byte-identical กับของเดิม — regression)

# 5. ★ RESTORE ★ — apply original กลับทุกครั้ง
curl -s -X POST --cookie "admin_token=$TOKEN" \
  "http://localhost:3000/fms-ovs/api/admin/templates/original/apply" --max-time 60
```

**Verify ด้วย preview_eval computed styles เป็นหลัก** ไม่ใช่ screenshot เพราะ:
- verdure home (wax-seal) + original home (ping) **animate ตลอด → screenshot timeout** (ตั้งใจ, decorative).
  หน้า data (results ฯลฯ) idle → screenshot ได้.
- ตรวจ residual สีเก่า: loop `.fms-app *` เช็ค `rgb(138,38,128)` (FMS purple) / palette เดิม = ต้อง 0.

---

## 5) Environment quirks (Windows) — ย้ำจาก CLAUDE.md
- **ห้าม stop dev server** ระหว่างงาน (เจ้าของดู live :3000). ใช้ `preview_start` ชื่อ `fms-dev`.
  ถ้า server หาย (recycle) → `preview_start fps-dev` ใหม่ (เช็ค port 3000 ว่าง + warm ด้วย curl).
- **อย่า `npm run build` ตอน dev รัน** (.next corrupt).
- dev server serverId เปลี่ยนทุกครั้งที่ start — ใช้ `preview_list` หา id ปัจจุบัน.
- `preview_screenshot` timeout บนหน้า animate → ใช้ `preview_eval` computed styles.
- admin_token JWT หมดอายุ → `node scripts/dev-admin-login.js` ใหม่ได้เลย (ไม่ต้องถามเจ้าของ).
- **restore `activeTemplateId = original` เสมอ** หลังทดสอบ apply.

---

## 6) แผนที่ไฟล์ (where things live)
```
utils/{gumroad,verdure,original}Palettes.js  ← palette แหล่งเดียว (เพิ่ม studioDarkPalettes.js)
components/home/GumroadTheme.js, OriginalTheme.js  ← BaseStyles + re-export
components/home/VerdureChrome.js              ← VerdureBaseStyles + verdure furniture
utils/injectTemplateTheme.js                 ← preview morph (เพิ่ม branch studio-dark)
components/admin/editor/templates/builtIn/{gumroad,verdure,original}.js  ← buildXTemplate + variants
components/admin/editor/templates/index.js   ← BUILT_IN_TEMPLATES (register)
components/admin/TemplateChooserTab.js        ← chooser (จัดกลุ่มด้วย layoutFamily → swatches)
app/api/admin/templates/[id]/apply/route.js  ← apply = strip editor overrides
app/layout.js:225                            ← original font override (startsWith)
app/{vote,candidates,results,party,success,closed}/page.js  ← dispatch (startsWith)
components/home/HomeRenderer.js               ← home dispatch by slug||layoutFamily
```

## 7) Self-audit ที่ทำไปแล้ว (session นี้ — Opus ทำเอง เพราะ Fable rate-limited)
เจอ+แก้ 2 บั๊กใน 3a (`c7c288c`): (1) `layout.js` font override `=== "original"` ไม่ match variant,
(2) `[var(--o-brand)]/5` opacity-on-var พัง. ที่เหลือ CLEAN: injector var parity ครบทั้ง 3 family,
base ทุก template byte-identical, dispatch startsWith ครบ (gumroad/verdure/original — **studio-dark
ยังเป็น `===` เพราะยังไม่มี variant, ต้องแก้ตอน Task 4**), POPS/recharts ไม่โดน sweep, apply-strip ปลอดภัย.

**ก่อนเริ่มงานใหม่:** `git status` (ควร clean, branch new-version), `preview_list` (หา dev id หรือ start ใหม่),
ยืนยัน active=original. แล้วเริ่ม Task 4 ตาม §2.
