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
| `ADMIN_PRIVATE_KEY` / `ADMIN_AUTH_SECRET` | ระบบ auth ของ admin (JWT cookie) |
| `NEXT_PUBLIC_ENABLE_MOCK_LOGIN` | `true` = โชว์ปุ่ม Mock Login (**DEV เท่านั้น — ห้ามเปิดบน production**) |

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
npm run smoke      # sanity 15 เคส (ต้องมี dev server รันอยู่)
npm run e2e:gate   # Playwright: vote flow + invariants
npm run build      # ต้อง GREEN ก่อน deploy เสมอ (หยุด dev server ก่อน — Windows .next lock)
```

## 🚢 Deploy

Docker + subpath `/fms-ovs` · **ก่อน deploy จริงให้ไล่ checklist ใน
[docs/TEMPLATE-SYSTEM-STATE.md §4](docs/TEMPLATE-SYSTEM-STATE.md)** (build gate, env จริง,
ปิด mock login, เลือก template production, scrub เอกสาร)

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
