# FMS Online Voting System (FMS-OVS)

ระบบเลือกตั้งออนไลน์ คณะกรรมการบริหารสโมสรนักศึกษา คณะวิทยาการจัดการ
มหาวิทยาลัยสงขลานครินทร์ (SAMO · FMS PSU)

ออกแบบมาให้**ใช้ซ้ำได้ทุกปีโดยแทบไม่ต้องแก้โค้ด** — ทีมสโมสรรุ่นถัดไปตั้งวันเลือกตั้ง
ปีการศึกษา ชื่องาน และเลือกหน้าตาเว็บทั้งระบบจากชุด template สำเร็จรูป
**6 ตระกูล รวม 23 แบบ** ได้จากหน้า admin ทั้งหมด · ใช้จริงครั้งแรกปีการศึกษา 2569 (SAMO 49)

> 🧭 **dev ใหม่เริ่มที่ไฟล์นี้** แล้วไปต่อ:
> [docs/TEMPLATE-SYSTEM-STATE.md](docs/TEMPLATE-SYSTEM-STATE.md) (สถานะระบบ + checklist ก่อน deploy)
> → [CLAUDE.md](CLAUDE.md) (กติกาการแก้โค้ด + engineering discipline)
> → [DECISIONS.md](DECISIONS.md) (บทเรียน/pitfall ทั้งหมด P-LOG-001..103)

---

## ✨ ความสามารถหลัก

**ฝั่งผู้ลงคะแนน**
- **โหวตปลอดภัย ครั้งเดียวต่อคน** — login ผ่าน PSU Passport (SSO / OpenID Connect),
  กันโหวตซ้ำแบบ atomic ระดับ DB (ทดสอบ race สองคำขอพร้อมกันแล้ว: ชนะได้ใบเดียว)
- **บัตรลงคะแนนนิรนามแบบเข้ารหัส + hash chain** (v2-SEC) — โครงสร้างข้อมูล
  กันไม่ให้ใครรู้ว่าใครเลือกพรรคไหน และตรวจจับการแก้บัตรย้อนหลังได้ (ดู §ความปลอดภัย)
- **รองรับ 2-6 พรรค** — ทุก template ผ่านการทดสอบที่ 2/4/5/6 พรรคทั้ง desktop และมือถือ ·
  หลายพรรค = บัตรเลือกพรรค · พรรคเดียว = หน้า showcase + 3 ตัวเลือก
  (รับรอง / ไม่รับรอง / งดออกเสียง)
- **Mobile-first จริง** — จุดสำคัญ (ปุ่มทำแบบประเมินหลังโหวต, บัตรลงคะแนน)
  ยืนยันด้วยการวัดตำแหน่งบนจอ 390×844 ว่าอยู่ในจอแรกโดยไม่ต้องเลื่อน
- **ใบเสร็จยืนยันตัวตนหลังโหวต** — แสดงชื่อ/รหัส/สาขา/เวลาของผู้ใช้สิทธิ์เอง
  (ไม่มีข้อมูลว่าเลือกพรรคไหน — ระบบไม่เก็บ link นั้นเลย)
- **ผลคะแนน + demographics แบบ real-time** (Recharts) พร้อมระบบ embargo:
  คะแนนถูก mask ตั้งแต่ชั้น API จนกว่า admin สั่งเปิดเผย

**ฝั่งผู้ดูแล**
- **ปุ่มตรวจความพร้อม (Readiness Check)** — 14 รายการเช็คอัตโนมัติก่อนเปิดระบบ
  (วันเวลาถูกต้อง, กุญแจครบ, tally ตรง, mock login ปิดหรือยัง ฯลฯ)
- **โหมดระบบ 4 แบบ**: `AUTO` (เปิด-ปิดตามเวลา) / `MANUAL_OPEN` / `PAUSE` / `ENDED`
  — ทุกหน้าปรับตามอัตโนมัติ
- **Audit trail** — ทุกคำสั่งของ admin (เปลี่ยนโหมด, เปิดผล, รีเซ็ต) ถูกบันทึกว่า
  ใครทำ อะไร เมื่อไหร่ ลงตาราง `AdminAuditLog`
- **ตัวล็อกคำสั่งทำลายข้อมูล** — `RESET_VOTES` / `RESET_CANDIDATES` ถูกปฏิเสธ (400)
  ขณะการโหวตยังเปิดอยู่ ป้องกันมือลั่นกลางการเลือกตั้ง
- **เครื่องมือประจำปี**: import รายชื่อนักศึกษา, archive ผลปีเก่า, preflight เช็คปีใหม่

## 🛠 Tech Stack

Next.js (App Router) · React · PostgreSQL + Prisma · NextAuth (PSU SSO + mock-login เฉพาะ dev) ·
Tailwind CSS + styled-jsx ต่อ template · Framer Motion · Recharts · Playwright (e2e) ·
Deploy ด้วย Docker ใต้ subpath **`/fms-ovs`**

---

## 🚀 เริ่มพัฒนา (Quick Start)

```bash
git clone <repo> && cd fms_election69
npm install

# 1) ตั้งค่า env — สร้าง .env (ดูตารางด้านล่าง)
# 2) เตรียมฐานข้อมูล (migration history สมบูรณ์ — fresh DB ใช้ได้เลย)
npx prisma migrate dev
node prisma/seed.js            # พรรคตัวอย่าง + mock voters

# 3) รัน
npm run dev                    # http://localhost:3000/fms-ovs
```

| ตัวแปร env | ใช้ทำอะไร |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | key เข้ารหัส session NextAuth |
| `NEXT_PUBLIC_BASE_PATH` / `BASE_PATH` | subpath deploy (default `/fms-ovs`) |
| `ADMIN_JWT_SECRET` | เซ็น/ตรวจ `admin_token` JWT cookie (auth แอดมิน — P0-1) |
| `ADMIN_PASSWORD_AUTH_EXTRA` | bootstrap password แอดมินครั้งแรก (ดู `/api/admin/login`) |
| `ADMIN_STUDENT_IDS` | รหัส นศ. ที่เป็นแอดมิน (คั่นด้วย `,`) |
| `ELECTION_BALLOT_PUBLIC_KEY` / `BALLOT_CHAIN_SECRET` | กุญแจบัตรลงคะแนน v2-SEC (ดู §ความปลอดภัย) |
| `NEXT_PUBLIC_ENABLE_MOCK_LOGIN` | `true` = โชว์ช่อง Mock Login (**DEV เท่านั้น — ห้ามเปิดบน production**; ปุ่ม readiness จะเตือนถ้าลืมปิด) |

> ⚠️ **เลิกใช้แล้ว (P0-1):** `ADMIN_PRIVATE_KEY` / `ADMIN_AUTH_SECRET` / `NEXT_PUBLIC_ADMIN_*`
> — ระบบ admin auth เก่าฝัง secret ใน client bundle ถูกถอดออกทั้งหมดแล้ว

**เข้าระบบตอน dev:** หน้า login มีช่อง Mock Login (ใส่รหัสนักศึกษาจาก seed) ·
ฝั่ง admin: `node scripts/dev-admin-login.js` แล้วเข้า `/fms-ovs/admin`

---

## 🎨 ระบบ Template (หัวใจของโปรเจกต์)

เลือกหน้าตาเว็บทั้งระบบได้จาก admin ในคลิกเดียว — **6 ตระกูล 23 แบบ**:

| ตระกูล | บุคลิก | ธีมสี |
|---|---|---|
| `original` | งาน craft ม่วง SAMO (ค่า default) | 1 |
| `gumroad` | นีโอบรูทัลลิสม์ เส้นหนา | 6 (รวม premium / bubblegum / acid / cyber / retro) |
| `studio-dark` | ดาร์ก editorial + rail ซ้าย | 4 (lime / amber / cyber / magenta) |
| `verdure` | เซริฟ เขียวธรรมชาติ terrarium | 4 (เขียว / berry / honey / teal) |
| `blossom` | candy editorial สดใส | 4 (ชมพู / butter / mint / sky) |
| `receipt` | "ใบเสร็จ/โต๊ะทำงานกระดาษ" มี materiality | 4 (ม่วง FMS / ink-blue / teal / carbon) |

หลักการ: **สีทุกเฉดของธีมมาจากไฟล์เดียวต่อตระกูล** แล้วไหลไปทุกที่เอง (client, server, preview)

```
src/utils/<family>Palettes.js   ← แก้สีที่นี่ที่เดียว
   ├→ <Family>BaseStyles        (CSS vars ฝั่ง client ตามธีมที่ active)
   ├→ builtIn/<family>.js       (build template object ต่อธีม → register ใน templates/index.js)
   └→ injectTemplateTheme.js    (morph สีสดๆ ตอน preview)
หน้า live เลือก layout ด้วย activeTemplateId.startsWith('<family>')
```

**เพิ่มธีมสีใหม่ในตระกูลเดิม = 3 จุด:** เพิ่ม entry ใน `<family>Palettes.js` → เพิ่ม export ใน
`builtIn/<family>.js` → register ใน `templates/index.js` — ที่เหลือ (chooser, swatch, preview,
dispatch) ทำงานอัตโนมัติ · เพิ่ม "ตระกูล" ใหม่ทั้ง layout ดู recipe ใน
`docs/HANDOFF-NEXT-TEMPLATE-VERDURE.md`

**Preview surfaces (ไม่แตะ DB — ใช้ mock ทั้งหมด):**
- `/fms-ovs/template-preview?slug=<slug>&page=<page>` — ภาพนิ่งทุกหน้า ทุกธีม
- ต่อท้าย `&interact=1` — กดเล่น flow จริง (home → login → vote → success)
- ต่อท้าย `&parties=N` (2-6) — จำลองจำนวนพรรค ไว้ทดสอบ layout หลายพรรค
- `/fms-ovs/template-playground` — sandbox สลับ template/หน้า/โหมดพรรคเดียว-หลายพรรค

### ⚠️ กฎเหล็กที่ทำให้ระบบไม่พัง (ละเมิด = บั๊กแน่นอน)

1. URL ภายในทุกเส้นต้องผ่าน `getPath()` จาก `src/utils/basePath.js` — ห้าม hardcode `/fms-ovs`
2. component ที่ render ผ่าน `createPortal` **ห้ามใช้ `var(--color-*)`** (token scope ไปไม่ถึง) —
   ใช้ ramp ที่ประกาศบน `:root` หรือแปะ root class ของตระกูลบน overlay (ดู member modals)
3. สีใน element vars ต้อง **reference token** (`var(--color-primary)`) ไม่ใช่ hex ตรงๆ
4. ห้ามแตะ: `PartyTheme.js` (สีประจำพรรค) · สี semantic การโหวต (เขียว=รับรอง แดง=ไม่รับรอง
   ส้ม=งดออกเสียง) · ค่าสีใน Recharts consts
5. ข้อความ UI ห้าม hardcode ปี/ชื่องาน — อ่านจาก `useGlobalConfig()` เสมอ
6. ภาษาไทยใน UI ไม่ลงท้ายประโยคด้วย `.`
7. **ชื่อพรรคบนบัตรลงคะแนนห้ามตัดเหลือบรรทัดเดียว** — ผู้ลงคะแนนต้องแยกพรรคออก (P-LOG-099)
8. รายละเอียด + pitfall ทั้งหมด: `DECISIONS.md` (P-LOG) และ `docs/MASTER-DESIGN-PLAN.md` §3

---

## 🔐 ความปลอดภัย

**สถาปัตยกรรมบัตรลงคะแนน (v2-SEC)** — บัตรทุกใบเก็บใน `Ballot` แบบ:
- **ไม่มี userId** — ไม่มีคอลัมน์ไหนในระบบผูกผู้ลงคะแนนกับตัวเลือก (ลบทั้งชั้น schema)
- **payload เข้ารหัส** (RSA-OAEP ด้วย public key; private key อยู่กับกรรมการแบบ offline เท่านั้น)
- **hash chain (HMAC)** ต่อท้ายกันทุกใบ — แก้/ลบบัตรย้อนหลัง = โซ่ขาด ตรวจเจอทันที
- **fail closed** — ถ้า env กุญแจไม่ครบ `/api/vote` ปฏิเสธการโหวต ไม่มีการเก็บ plaintext
- คะแนนจริง (tally) = `Candidate.score` เพิ่มแบบ atomic ตอนโหวต — ตรวจสามทางได้เสมอ:
  score = จำนวนบัตร = ความยาวโซ่ (`scripts/reconcile-scores.js`)

**Key Ceremony — ทำ 1 ครั้งต่อปี บนเครื่อง offline ที่เชื่อถือได้:**

```bash
node scripts/generate-election-keys.js   # พิมพ์คู่กุญแจ + chain secret ออก stdout เท่านั้น
```

- **private key** → พิมพ์ลงกระดาษ แบ่งเก็บ (อาจารย์ที่ปรึกษา + ประธานสโมสร) —
  **ห้ามอยู่บนเซิร์ฟเวอร์/ใน repo** · ใช้เฉพาะกรณีข้อพิพาท
  (`scripts/decrypt-recount.js --key <path>` แบบ offline) · กุญแจหาย = เสียแค่
  ความสามารถ recount ไม่เสียผลเลือกตั้ง
- **public key** → env `ELECTION_BALLOT_PUBLIC_KEY` · **chain secret** →
  env `BALLOT_CHAIN_SECRET` (+ สำเนานอกเครื่อง)
- Production ต้องรัน `scripts/sql/ballot-grants.sql` — role ของแอป **INSERT-only บน
  `Ballot`** → การเลือกตั้งที่รับรองแล้วแก้ไม่ได้เชิงสิทธิ์ DB

**ระหว่าง/หลังเลือกตั้ง:**

```bash
node scripts/verify-ballot-chain.js      # ตรวจโซ่ทั้งตาราง + score/turnout ตรงกันไหม
node scripts/export-chain-head.js        # เก็บปลายโซ่ไว้นอกเครื่องเป็นระยะ (cron)
node scripts/reconcile-scores.js         # audit ก่อนเปิดผล (runbook §5.1)
```

**ชั้นอื่นๆ:**
- Admin auth = httpOnly JWT cookie (`admin_token`) หรือ NextAuth session role ADMIN/STAFF —
  ทุก admin route ผ่าน `adminGuard` · ไม่มี secret ใน client bundle
- Rate limit: `/api/vote` 15 req/นาที/คน · admin login 10 ครั้ง/5 นาที/IP
- ทุก mutating action ของ admin ลง `AdminAuditLog` (ใคร/อะไร/เมื่อไหร่)
- คำสั่งรีเซ็ตถูกบล็อกขณะโหวตเปิด + ระบบ certify ผล (`ANONYMIZE_BALLOTS`) ทำได้เฉพาะ
  หลังปิดโหวต + เปิดผลแล้วเท่านั้น

---

## ✅ การทดสอบ

```bash
npm run smoke      # sanity 15 เคส (ต้องมี server รันอยู่ :3000)
npm run e2e        # Playwright ครบชุด 9 เคส: vote-flow + invariants + abstain + closed
npm run e2e:gate   # ชุดเร็วสำหรับ gate: vote-flow + invariants
npm run build      # ต้อง GREEN ก่อน deploy เสมอ (หยุด dev server ก่อน — Windows .next lock)
```

**e2e ใช้ test DB แยก + server แยก — ไม่แตะของจริงเลย (v2-R11):**
- globalSetup สร้าง DB `<ชื่อ dev DB>_e2e` อัตโนมัติ + sync schema + seed เล็ก
  แล้วรัน `next start` ที่ **:3100** ชี้ไป test DB — dev server :3000 และ DB จริงไม่ถูกแตะ
- ทุก destructive SQL มี guard บังคับชื่อ DB ลงท้าย `_e2e` (ตรวจจาก
  `current_database()` บน connection จริง ไม่ใช่แค่ string)
- ต้องมี **prod build** ก่อน (`npm run build`) — ไม่มี `.next/BUILD_ID` จะ fail-fast พร้อมบอกวิธี
- mock-login บน server ทดสอบเปิดด้วย**เงื่อนไขคู่**: `E2E_MOCK_LOGIN=true` **และ**
  DATABASE_URL ชี้ DB `_e2e` — deployment จริงไม่มีทางผ่านทั้งสอง (P-LOG-103)
- ครอบคลุม: โหวตครบวงจรจน HMAC chain verify, โหวตซ้ำ/แข่งกัน, embargo ผลคะแนน,
  สิทธิ์ปี 1-4, admin auth, งดออกเสียง, ระบบปิด
- **ลำดับ gate ก่อน deploy: `build` → `smoke` → `e2e:gate`** · รายละเอียด: runbook §4.1-4.2

**Load test** (2026-07-18, prod build): 300 concurrent อ่านรัว 6,000 requests —
error 0, API หลัก p95 ≤ 1.1s · ที่ 100 concurrent ทุก API p95 < 400ms ·
`/api/home-info` มี micro-cache 8s รับช่วงเปิดระบบ

---

## 🚢 Deploy

Docker + subpath `/fms-ovs` · **deploy จริงให้ไล่ทีละขั้นใน
[docs/DEPLOY-CHECKLIST-2026.md](docs/DEPLOY-CHECKLIST-2026.md)** — สรุปหัวข้อ:

1. Key ceremony (offline) + ตั้ง env กุญแจ
2. `npx prisma migrate deploy` (migration history สมบูรณ์ — พิสูจน์แล้วบน DB เปล่าว่าได้
   schema ตรงกับ `schema.prisma` เป๊ะ) + `scripts/sql/ballot-grants.sql`
3. Build ด้วย env production (mock login ปิด) + smoke
4. Import รายชื่อผู้มีสิทธิ์ + ตั้งวันเลือกตั้ง + เลือก template ของปีนั้น
5. **กดปุ่มตรวจความพร้อม (Readiness) ในหน้า admin เป็นด่านสุดท้าย** — ระบบไล่บอกเอง
   ว่าอะไรยังไม่พร้อม
6. ระหว่างเลือกตั้ง: cron `export-chain-head` + monitor · หลังปิด: reconcile → เปิดผล → certify

ขอ DB จากหน่วยงาน IT: ใบขอสเปกหน้าเดียวอยู่ที่ [docs/STAFF-DB-BRIEF-2026.md](docs/STAFF-DB-BRIEF-2026.md)
(role แยก migrate/app, timezone, backup)

## 🗓 งานประจำปี (เปลี่ยนปีการศึกษา)

1. `npm run preflight` — เช็คความพร้อมปีใหม่
2. `npm run archive-year` — เก็บผลปีเก่า
3. `npm run import-students -- <ไฟล์รายชื่อ>` — นำเข้าผู้มีสิทธิ์ปีใหม่
4. ตั้งวันเลือกตั้ง + ปี + ชื่องานในหน้า admin (ไม่ต้องแก้โค้ด — เวลา pin Asia/Bangkok ทุกชั้น)
5. เลือก template/ธีมของปีนั้น → apply → กด Readiness ตรวจรวบยอด
6. Key ceremony ชุดใหม่ของปีนั้น (กุญแจไม่ reuse ข้ามปี)

## 📁 โครงสร้างสำคัญ

```
src/app/               หน้า + API routes (vote, results, admin, template-preview, …)
src/components/home/   layout หน้าแรก + chrome ต่อตระกูล (Original*, Gumroad*, StudioDark*,
                       Verdure*, Blossom*, Receipt*)
src/components/vote/   หน้าโหวต/ผล/success/ปิดระบบ/party ต่อตระกูล + member modals
src/components/admin/  admin console + TemplateChooserTab + ReadinessCard
src/utils/             basePath, electionConfig (+ resolver วันเลือกตั้งจาก admin),
                       *Palettes, injectTemplateTheme, templatePreviewMocks (makeParties)
src/lib/               db (Prisma singleton), auth (NextAuth), ballotCrypto, ballotChain,
                       rateLimit, auth/adminCheck
prisma/                schema + seed + migrations (history สมบูรณ์ fresh-deploy ได้)
e2e/                   Playwright suite + test-DB harness (guard `_e2e`)
scripts/               dev-admin-login, import-students, archive-year, preflight-year,
                       generate-election-keys, verify-ballot-chain, export-chain-head,
                       reconcile-scores, decrypt-recount, backup/restore, smoke/, sql/
docs/                  เอกสารทั้งหมด (state, deploy checklist, runbook, design plan, handoff)
```

## 📚 แผนที่เอกสาร

| อยากรู้อะไร | ไปที่ |
|---|---|
| สถานะระบบ + เหลืออะไรก่อน deploy | `docs/TEMPLATE-SYSTEM-STATE.md` |
| ขั้นตอน deploy จริงทีละข้อ | `docs/DEPLOY-CHECKLIST-2026.md` |
| คู่มือดูแลระบบ + ballot ops + e2e | `docs/MAINTENANCE-RUNBOOK.md` |
| กติกาแก้โค้ด + engineering discipline | `CLAUDE.md` |
| แผนงานดีไซน์ + รสนิยมเจ้าของ + tickets | `docs/MASTER-DESIGN-PLAN.md` |
| บทเรียน/pitfall ทุกตัวที่เคยเจอ | `DECISIONS.md` (P-LOG-001..103) |
| ประวัติการพัฒนาราย arc | `docs/HANDOFF-*.md` |

---

พัฒนาโดยสโมสรนักศึกษา คณะวิทยาการจัดการ ม.อ. ร่วมกับ Claude (Anthropic) ·
ใช้จริงครั้งแรกปีการศึกษา 2569 (SAMO 49) · ออกแบบให้ส่งต่อได้ 5 ปี
