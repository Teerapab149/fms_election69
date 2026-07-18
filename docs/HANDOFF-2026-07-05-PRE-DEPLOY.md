# HANDOFF 2026-07-05 — สถานะโปรเจกต์ + แผนก่อน Deploy

> สำหรับ Claude session ใหม่ (บัญชีใหม่): อ่านไฟล์นี้ → CLAUDE.md (Engineering Discipline) →
> memory dir (ถ้ามี) ตามลำดับ. Branch `new-version`, ทุกอย่าง push แล้วถึง `673eef4`.

## 1. ภาพรวมระบบ (product)
ระบบเลือกตั้ง SAMO (FMS PSU). Product = **4 template ตระกูล × colour themes** (ไม่ใช่ web editor):
- **original** (classic layout + OriginalHome) — template หลักที่ ACTIVE อยู่ — **5 ธีม**: ม่วง FMS (default) / กรมท่า-ทอง / มรกต-แชมเปญ / เลือดหมู-แพลทินัม / ม่วงมะเขือ-ทองแดง
- **gumroad** (5 ธีม) · **verdure** (4 ธีม) · **studio-dark** (⚠️ ยังมีธีมเดียว — งานค้างใหญ่สุด)

สถาปัตยกรรมธีม (single-source, ห้าม drift):
```
utils/<family>Palettes.js  →  <Family>BaseStyles (client vars)  →  builtIn/<family>.js (Layer-1 tokens ตอน apply)
                            →  utils/injectTemplateTheme.js (preview morph: chooser + full-screen)
dispatch ทุกหน้า: activeTemplateId.startsWith('<family>')   ← studio-dark ยังใช้ === (ต้องแก้ตอนเพิ่มธีม)
```
- Layer-1 `--color-*` ถูก SSR scope ที่ `.fms-app` (layout.js) จาก template ที่ apply ใน DB
- **บทเรียนสำคัญ**: component ที่ render ผ่าน `createPortal` → `document.body` **หลุด scope `.fms-app`** — ต้อง emit vars ที่ `:root` (ดู `SinglePartyBaseStyles.js`)

## 2. งานที่เสร็จรอบล่าสุด (ทั้งหมด push แล้ว)
- `b14516a..2f74045` — original 5 ธีมพรีเมียม + inner pages ตามธีมทุกหน้า (แก้ injector + sweep ม่วง hardcode + grid texture ทุกหน้า) + multi-vote redesign (PartyCard theme-aware พรีเมียม, grid เท่าเทียมทุก template กัน primacy bias, declutter, มือถือ 2 คอลัมน์จัดกลาง, ปุ่ม VIEW PROFILE ชิดล่างเสมอ) + fix gumroad hero title
- `97b8ddb` — seam `onSignIn` (optional prop, absent = signIn จริง) ทะลุ home→navbar→voteCTA element + playground home กด login ได้
- `af52277` — **`/template-preview?interact=1`**: full-screen preview กดได้จริง (เลือกพรรค/modal/flow home→login→vote→confirm→success ผ่าน postMessage `tp-nav` ไป chrome bar) — ไม่มีพารามิเตอร์ = static เดิม (สไลด์ chooser ปลอดภัย); `hrefToDest` shared ที่ `utils/previewNav.js`
- `a5edac7` — classic/original vote page ใน interact mode ประกอบจากชิ้น pure จริง (MultiPartyView + VoteFooter + PartyDetailModal showVoteButton=false + VoteConfirmationModal) — ห้าม render app route ที่มี auth ดิบ (P-LOG-002)
- `c47af13` — สีปุ่มโหวต single-vote เป็น **semantic คงที่ไม่ตามธีม** (จิตวิทยาสี): รับรอง=เขียวนุ่ม / ไม่รับรอง=แดงละมุน / งดออกเสียง=ส้มอำพัน, จูนต่อ surface, icon ไม่หาย; verdure ใช้ class `vd-tone--*` (กัน collision กับ prop abstain)
- `673eef4` — **single-vote cinematic ของ original ตามธีมทั้ง 5**: `SinglePartyBaseStyles` emit ramp `--spv-*` ที่ `:root`, tokenize portal + LiquidHero + LiquidMesh + VoteFooter primary/gold แบบ `var(--x, ค่าเดิมเป๊ะ)` → ธีมม่วง byte-identical; หมายเหตุ: hero จริงคือ `LiquidHero.js` (`LiquidMeshHeroBackground.js` ไม่มีใคร import)

Workflow ที่ใช้: Opus 4.8 เป็น worker ผ่าน subagent + Fable เป็นผู้คุม/ตรวจ (brief มี Task-0 audit บังคับ + verify ritual + ห้าม commit จน review ผ่าน)

## 3. แผนที่เหลือก่อน Deploy (เรียงความสำคัญ)

> **สถานะ 2026-07-06 — P2 เสร็จครบทั้ง 4 ข้อแล้ว (push ถึง `d9d8a85`):**
> #1 studio-dark 4 ธีม (`065cf9c`) · #2 token-bleed แก้ที่ template-preview emit token ของ slug ที่พรีวิวเอง + injector ทุกตระกูล push `--color-*` (`66f7444`) · #3 ticker exempt ใน interact mode (`a5e42ae`) · #4 modal แบบประเมิน tokenized (`d9d8a85`)
> แถม: แก้ morph-staleness ของ element vars ที่เป็น literal — voteCTA ทุกตระกูล (`752f375`, `4f5b173`) + P-LOG-075/076 ใน DECISIONS.md (เลข P-LOG จริงถึง 076 แล้ว ไม่ใช่ 045)
> Backlog ใหม่จาก audit (ยังไม่แก้ ตั้งใจ): banner `--banner-shadow` ที่ baked สีตระกูล (gumroad/verdure) + gumroad Layer-1 `--shadow-card/button` baked ink — stale เฉพาะตอน morph, มองแทบไม่เห็น
> เหลือ: P3 (polish สี guided กับ owner) และ P4 (pre-deploy gate ด้านล่าง — ต้องนัดหยุด server)

### P2 (ถัดไป)
1. **StudioDark colour themes 3-4 โทน** (Task 4 จาก HANDOFF-THEME-SYSTEM-CONTINUE.md): สร้าง `utils/studioDarkPalettes.js` → audit ว่า StudioDark* ยิง vars ที่ไหน (`--sd-*` บน `.sd-root`) → StudioDarkBaseStyles → เพิ่ม branch ใน injectTemplateTheme → buildStudioTemplate + variants ใน builtIn → register ใน index.js → **แก้ dispatch `=== 'studio-dark'` → `startsWith('studio-dark')` ที่ ~6 หน้า app (ห้ามลืม)**
2. **บั๊ก token-bleed ใน preview**: พรีวิว template B ขณะ A active → `--color-*` ของ A รั่ว (เช่น ปุ่ม voteCTA ของ studio-dark เป็นม่วง) — ราก: preview ต้อง emit Layer-1 tokens ของ template ที่**พรีวิว** ไม่ใช่ตัว active; audit ว่า StudioDarkHome `buildTemplateStyles(effectiveTemplate)` ทำไมไม่ชนะ/ไม่ครอบ
3. **Gumroad ticker ไม่ขยับในพรีวิว**: ticker ปกติ (`gtickMove 35s infinite`) แต่ `PreviewMotionDamp` (template-preview) บังคับ iteration-count:1 — แก้: ยกเว้น marquee ใน interact mode (live ไม่กระทบ)
4. **Modal แบบประเมิน (Google Form iframe ใน success/page.js) tokenize ระดับ A**: โครง modal hardcode ขาว/slate — เปลี่ยนเป็น `--color-surface/text/primary/border` (ตกลงกับ owner แล้ว); ฟอร์ม Google ข้างใน theme ไม่ได้ (iframe)

### P3 — polish สีรวม (subjective) ทำ guided ทีละ template กับ owner (screenshot ก่อน/หลัง)
### P4 — pre-deploy gate (บังคับ): หยุด dev server ตอน owner ว่าง → `rm -rf .next` → `npm run build` GREEN → `npm run smoke` (15/15) → paste output จริง → merge plan

### Backlog เล็ก (ยอมรับไว้): classic candidates/results/closed ยัง static ใน interact mode · playground ยังไม่มี original ใน TEMPLATES · ปุ่ม admin "เปิดแบบโต้ตอบ" gate 3 ตระกูล

## 4. กติกา/พิธีกรรมที่ห้ามข้าม (จ่ายค่าเรียนมาแล้ว)
- **ห้ามหยุด dev server** (:3000 owner ดู live) · ใช้ preview_start `fms-dev` · ห้าม `npm run build` ขณะ dev รัน
- verify ธีม = **apply จริง → ดูหน้า live → restore `original` เสมอ** (preview≠live คือรากบั๊กเก่า) · ตรวจด้วย computed styles ไม่ใช่ screenshot อย่างเดียว
- admin: `node scripts/dev-admin-login.js` → cookie `admin_token` → `POST /fms-ovs/api/admin/templates/<slug>/apply`
- non-breaking tokenize: `#hex` → `var(--x, #hex)` แล้วพิสูจน์ base byte-identical · sweep ผ่าน Write-tool script exact split/join (ห้าม bash heredoc regex) · ห้าม sweep recharts consts (`COLORS_BAR`/`POPS`) · จัดการ `[#hex]/opacity` ด้วย color-mix
- **ห้ามแตะ**: PartyTheme.js (สีประจำพรรค) · สี semantic (เขียว vote/ฟ้า results/ส้ม maintenance/เขียว-แดง-ส้ม 3  choices) · ภาษาไทยห้ามลงท้ายด้วย `.`
- commit: atomic + explicit paths, ลงท้าย `Co-Authored-By: Claude <รุ่น> <noreply@anthropic.com>`

## 5. แผนที่ไฟล์สำคัญ (เร็ว)
| อะไร | ที่ไหน |
|---|---|
| palettes ต่อตระกูล | `src/utils/{original,gumroad,verdure}Palettes.js` (studio-dark ยังไม่มี) |
| preview morph injector | `src/utils/injectTemplateTheme.js` (มี original/gumroad/verdure) |
| interactive surfaces | `/template-preview?interact=1` + `/template-playground` · seam ลิงก์: `src/utils/previewNav.js` |
| single-vote ramp (:root) | `src/components/vote/SinglePartyBaseStyles.js` |
| login-sim seam | prop `onSignIn` ใน home ทุกตระกูล + `voteCTA-button/{chunky-stamp,minimal-pill}.jsx` + GumroadMobileMenu/StudioDarkRail |
| ปุ่ม 3 ทางเลือก semantic | `GumroadSingleParty` (.gsp-choice--*) · `StudioDarkSingleParty` (--sds-tone) · `VerdureSingleParty` (vd-tone--*) · `SinglePartyView` (emerald/rose/amber) |
| multi-vote การ์ด | `src/components/PartyCard.js` (theme-aware) + `MultiPartyView.js` |
| handoff เก่าที่ยังใช้ | `docs/HANDOFF-THEME-SYSTEM-CONTINUE.md` (§ studio-dark) · `docs/HANDOFF-INTERACTIVE-PREVIEW.md` |
