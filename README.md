# FMS Online Voting System (FMS-OVS)

ระบบเลือกตั้งออนไลน์ คณะกรรมการบริหารสโมสรนักศึกษา คณะวิทยาการจัดการ ม.สงขลานครินทร์ (SAMO · FMS PSU)
ออกแบบมาให้ใช้ซ้ำได้ทุกปีโดยแทบไม่ต้องแก้โค้ด — admin ตั้งค่าปี/วันเลือกตั้ง/ข้อความผ่านหน้า admin
และเลือก "template" หน้าตาเว็บได้จากชุดสำเร็จรูป 4 ตระกูล (gumroad / studio-dark / verdure สลับสีได้หลายธีม ·
original เป็นงาน craft สีม่วง SAMO เวอร์ชันเดียว)

> 🧭 **dev ใหม่เริ่มที่ไฟล์นี้** แล้วไปต่อ: [docs/TEMPLATE-SYSTEM-STATE.md](docs/TEMPLATE-SYSTEM-STATE.md)
> (สถานะระบบ + checklist ก่อน deploy) → [CLAUDE.md](CLAUDE.md) (กติกาการแก้โค้ด) →
> [DECISIONS.md](DECISIONS.md) (บทเรียน/pitfall ทั้งหมด P-LOG-001..077)

## ✨ ความสามารถหลัก

- **โหวตปลอดภัย ครั้งเดียวต่อคน** — login ผ่าน PSU Passport (SSO/OpenID Connect), กันโหวตซ้ำระดับ DB
- **2 โหมดอัตโนมัติตามจำนวนพรรค** — หลายพรรค = grid เลือกพรรค · พรรคเดียว = หน้า showcase พรรค
  + 3 ตัวเลือก (รับรอง / ไม่รับรอง / งดออกเสียง)
- **ผลคะแนน real-time + demographics** (Recharts) เปิด/ปิดการแสดงผลได้จาก admin
- **ระบบ template**: original (SAMO คลาสสิก) · gumroad (นีโอบรูทัล) · studio-dark (ดาร์ก editorial) ·
  verdure (เซริฟ เขียว) — เปลี่ยนทั้งเว็บได้ในคลิกเดียว พร้อม preview แบบโต้ตอบก่อน apply
- **โหมดระบบ**: `AUTO` (ตามเวลา) / `MANUAL_OPEN` / `PAUSE` / `ENDED` — ทุกหน้า react ตาม
- **เครื่องมือประจำปี**: import รายชื่อนักศึกษา, archive ผลปีเก่า, preflight เช็คก่อนเปิดปีใหม่

## 🛠 Tech Stack

Next.js (App Router) · React · PostgreSQL + Prisma · NextAuth (PSU SSO) · Tailwind CSS ·
Framer Motion · Recharts · Lucide · Deploy ด้วย Docker ใต้ subpath **`/fms-ovs`**

## 🚀 เริ่มพัฒนา (Quick Start)

```bash
git clone <repo> && cd fms_election69
npm install

# 1) ตั้งค่า env — สร้าง .env (ดูตารางด้านล่าง)
# 2) เตรียมฐานข้อมูล
npx prisma migrate dev
node prisma/seed.js            # พรรคตัวอย่าง + mock voters

# 3) รัน
npm run dev                    # http://localhost:3000/fms-ovs
```

| ตัวแปร env | ใช้ทำอะไร |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | key เข้ารหัส session NextAuth |
| `NEXT_PUBLIC_BASE_PATH` | subpath deploy (default `/fms-ovs`) |
| `ADMIN_JWT_SECRET` | เซ็น/ตรวจ `admin_token` JWT cookie (auth แอดมิน — P0-1) |
| `ADMIN_PASSWORD_AUTH_EXTRA` | bootstrap password แอดมินครั้งแรก (ดู `/api/admin/login`) |
| `ADMIN_STUDENT_IDS` | รหัส นศ. ที่เป็นแอดมิน (คั่นด้วย `,`) |
| `ELECTION_BALLOT_PUBLIC_KEY` / `BALLOT_CHAIN_SECRET` | กุญแจบัตรลงคะแนน v2-SEC (ดู §v2-SEC ด้านล่าง) |
| `NEXT_PUBLIC_ENABLE_MOCK_LOGIN` | `true` = โชว์ปุ่ม Mock Login (**DEV เท่านั้น — ห้ามเปิดบน production**) |

> ⚠️ **เลิกใช้แล้ว (P0-1):** `ADMIN_PRIVATE_KEY` / `ADMIN_AUTH_SECRET` /
> `NEXT_PUBLIC_ADMIN_*` — ระบบ admin auth เก่าฝัง secret ใน client bundle ถูกถอดออกแล้ว

**เข้าระบบตอน dev:** หน้า login มีช่อง Mock Login (ใส่รหัสนักศึกษาจาก seed) ·
admin: `node scripts/dev-admin-login.js` แล้วเข้า `/fms-ovs/admin`

## 🎨 ระบบ Template (หัวใจของโปรเจกต์)

หลักการ: **สีทุกเฉดของธีมมาจากไฟล์เดียวต่อตระกูล** แล้วไหลไปทุกที่เอง (client, server, preview)

```
src/utils/<family>Palettes.js   ← แก้สีที่นี่ที่เดียว
   ├→ <Family>BaseStyles        (CSS vars ฝั่ง client ตามธีมที่ active)
   ├→ builtIn/<family>.js       (build template object ต่อธีม → register ใน templates/index.js)
   └→ injectTemplateTheme.js    (morph สีสดๆ ตอน preview)
หน้า live เลือก layout ด้วย activeTemplateId.startsWith('<family>')
```

**เพิ่มธีมสีใหม่ในตระกูลเดิม = 3 จุด:** เพิ่ม entry ใน `<family>Palettes.js` → เพิ่ม export ใน
`builtIn/<family>.js` → register ใน `templates/index.js` — ที่เหลือ (chooser, swatch, preview, dispatch)
ทำงานอัตโนมัติ · เพิ่ม "ตระกูล" ใหม่ทั้ง layout ดู recipe ใน `docs/HANDOFF-NEXT-TEMPLATE-VERDURE.md`

**Preview surfaces:** `/fms-ovs/template-preview?slug=<slug>` (ภาพนิ่ง) · `+&chrome=1` (แถบสลับธีม) ·
`+&interact=1` (กดเล่น flow จริงได้ ไม่แตะ DB) · `/fms-ovs/template-playground`

### ⚠️ กฎเหล็กที่ทำให้ระบบธีมไม่พัง (ละเมิด = บั๊กแน่นอน)

1. URL ภายในทุกเส้นต้องผ่าน `getPath()` จาก `src/utils/basePath.js` — ห้าม hardcode `/fms-ovs`
2. component ที่ render ผ่าน `createPortal` **ห้ามใช้ `var(--color-*)`** (token scope ไปไม่ถึง) —
   ใช้ ramp `--spv-*` ที่ `:root` แทน
3. สีใน element vars ต้อง **reference token** (`var(--color-primary)`) ไม่ใช่ hex ตรงๆ
4. ห้ามแตะ: `PartyTheme.js` (สีประจำพรรค) · สี semantic การโหวต (เขียว=รับรอง แดง=ไม่รับรอง ส้ม=งดออกเสียง)
   · ค่าสีใน Recharts consts
5. ข้อความ UI ห้าม hardcode ปี/ชื่องาน — อ่านจาก `useGlobalConfig()` เสมอ
6. ภาษาไทยใน UI ไม่ลงท้ายประโยคด้วย `.`
7. รายละเอียด+pitfall ทั้งหมด: `DECISIONS.md` (P-LOG) และ `docs/MASTER-DESIGN-PLAN.md` §3

## 📁 โครงสร้างสำคัญ

```
src/app/               หน้า + API routes (vote, results, admin, template-preview, …)
src/components/home/   layout หน้าแรกต่อตระกูล (OriginalHome, GumroadHome, StudioDark*, Verdure*)
src/components/vote/   หน้าโหวต/ผล/ปิดหีบ ต่อตระกูล + single-vote cinematic (SinglePartyView)
src/components/admin/  admin console + TemplateChooserTab (+ editor เก่าที่ retire แล้ว)
src/utils/             basePath, electionConfig, *Palettes, injectTemplateTheme
prisma/                schema + seed + migrations
scripts/               dev-admin-login, import-students, archive-year, preflight-year, smoke/
docs/                  เอกสารทั้งหมด (state, design plan, handoff ราย arc)
```

## 🗓 งานประจำปี (เปลี่ยนปีการศึกษา)

1. `npm run preflight` — เช็คความพร้อมปีใหม่
2. `npm run archive-year` — เก็บผลปีเก่า
3. `npm run import-students -- <ไฟล์รายชื่อ>` — นำเข้าผู้มีสิทธิ์ปีใหม่
4. ตั้งวันเลือกตั้ง + ปี + ชื่องาน ในหน้า admin (ไม่ต้องแก้โค้ด) · เลือก template/ธีมของปีนั้น → apply

## ✅ ทดสอบ

```bash
npm run smoke      # sanity 15 เคส (ต้องมี dev server รันอยู่ :3000)
npm run e2e        # Playwright ครบชุด: vote-flow + invariants + abstain + closed
npm run e2e:gate   # ชุดเร็วสำหรับ gate: vote-flow + invariants
npm run build      # ต้อง GREEN ก่อน deploy เสมอ (หยุด dev server ก่อน — Windows .next lock)
```

**e2e ใช้ test DB แยก + server แยก (v2-R11) — ไม่แตะ dev เลย:**
- globalSetup สร้าง DB `<ชื่อ dev DB>_e2e` อัตโนมัติ (`CREATE DATABASE` + `prisma migrate deploy`
  + seed เล็ก) แล้วรัน `next start` ที่ **:3100** ชี้ DATABASE_URL ไป test DB — dev server :3000
  และ DB `fms_election` ไม่ถูกแตะ; ทุก destructive SQL มี guard บังคับชื่อ DB ลงท้าย `_e2e`
- ต้องมี **prod build** ก่อน (`npm run build`) — ถ้าไม่มี `.next/BUILD_ID` setup จะ fail-fast
  พร้อมบอกวิธี · ลำดับ gate: **build → smoke → e2e:gate**
- e2e gate รันกับ **build local เท่านั้น** (mock login ถูก bake ตอน build ด้วย
  `NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true` ใน .env.local) — build สำหรับ deploy จริงใช้ env prod
  (mock=false) และ**ไม่**รัน e2e กับมัน · รายละเอียด: runbook §4.1-4.2

## 🔐 บัตรลงคะแนนแบบเข้ารหัส + Key Ceremony (v2-SEC)

บัตรทุกใบถูกเก็บใน `Ballot` แบบ **ไม่มี userId + เข้ารหัส + ต่อ hash chain** — โครงสร้าง
กันไม่ให้รู้ว่าใครเลือกพรรคไหน และตรวจจับการแก้บัตรย้อนหลังได้ (ดู
`prisma/migrations/*_v2_sec_anonymous_ballots`, `src/lib/ballotCrypto.js`,
`src/lib/ballotChain.js`)

**ทำ 1 ครั้งต่อปีการเลือกตั้ง (บนเครื่อง offline ที่เชื่อถือได้):**

```bash
node scripts/generate-election-keys.js   # พิมพ์คู่กุญแจ + chain secret ออก stdout เท่านั้น
```

- **private key** → พิมพ์ลงกระดาษ แบ่งเก็บ (อจ.ที่ปรึกษา + ประธานสโมสร) — **ห้ามอยู่บนเซิร์ฟเวอร์/ใน repo**
  ใช้เฉพาะตอนมีข้อพิพาท (`scripts/decrypt-recount.js --key <path>` แบบ offline) · กุญแจหาย =
  เสียแค่ dispute-recount ไม่เสียผลเลือกตั้ง (tally จริง = `Candidate.score`)
- **public key** → ตั้งเป็น env `ELECTION_BALLOT_PUBLIC_KEY` บนเซิร์ฟเวอร์
- **chain secret** → ตั้งเป็น env `BALLOT_CHAIN_SECRET` บนเซิร์ฟเวอร์ + เก็บสำเนานอกเครื่อง
- ถ้า env กุญแจไม่ครบ → `/api/vote` **fail closed** (โหวตไม่ได้ ไม่มีการเก็บ plaintext)

**ระหว่าง/หลังเลือกตั้ง:**

```bash
node scripts/verify-ballot-chain.js      # ตรวจโซ่ทั้งตาราง + score/turnout ตรงกันไหม
node scripts/export-chain-head.js        # เก็บปลายโซ่ไว้นอกเครื่องเป็นระยะ (cron)
node scripts/reconcile-scores.js         # audit ก่อนเปิดผล (runbook §5.1)
```

Production ควรรัน `scripts/sql/ballot-grants.sql` เพื่อให้ role ของแอป **INSERT-only บน `Ballot`**
(แก้/ลบบัตรไม่ได้เชิงโครงสร้าง)

## 🚢 Deploy

Docker + subpath `/fms-ovs` · **deploy จริงปีนี้ให้ไล่ทีละขั้นใน
[docs/DEPLOY-CHECKLIST-2026.md](docs/DEPLOY-CHECKLIST-2026.md)** (key ceremony,
env จริง, ballot-grants.sql, migrate deploy, ปุ่มตรวจความพร้อม ADM-1, เลือก template,
smoke test) · ภาพรวมสถานะระบบ + build gate ดู
[docs/TEMPLATE-SYSTEM-STATE.md §4](docs/TEMPLATE-SYSTEM-STATE.md)

## 📚 แผนที่เอกสาร

| อยากรู้อะไร | ไปที่ |
|---|---|
| สถานะระบบ + เหลืออะไรก่อน deploy | `docs/TEMPLATE-SYSTEM-STATE.md` |
| กติกาแก้โค้ด + engineering discipline | `CLAUDE.md` |
| แผนงานดีไซน์ + รสนิยมเจ้าของ + tickets | `docs/MASTER-DESIGN-PLAN.md` |
| บทเรียน/pitfall ทุกตัวที่เคยเจอ | `DECISIONS.md` (P-LOG-001..077) |
| ประวัติการพัฒนาราย arc | `docs/HANDOFF-*.md` |

---

พัฒนาโดยสโมสรนักศึกษา คณะวิทยาการจัดการ ม.อ. ร่วมกับ Claude (Anthropic) · ใช้จริงครั้งแรกปีการศึกษา 2569 (SAMO 49)
