#!/usr/bin/env bash
# scripts/setup.sh — ติดตั้ง/ตรวจระบบเลือกตั้งให้พร้อมใช้งาน ด้วยคำสั่งเดียว
#
#   sh scripts/setup.sh --check                 ตรวจอย่างเดียว ไม่แก้อะไรเลย (ปลอดภัย รันได้ตลอด)
#   sh scripts/setup.sh                         ติดตั้ง/อัปเดตให้พร้อมใช้
#   sh scripts/setup.sh --admin 6610510149      ติดตั้ง แล้วตั้งคนนี้เป็นแอดมิน + ออกรหัสกลาง
#
# สคริปต์นี้ทำ 6 อย่างตามลำดับ หยุดทันทีที่เจอปัญหา พร้อมบอกวิธีแก้:
#   1. ตรวจว่ามีเครื่องมือที่ต้องใช้ (node / npm / docker / psql)
#   2. ตรวจว่า .env มีค่าครบทุกตัวที่ระบบต้องใช้
#   3. ติดตั้ง dependency (ถ้ายังไม่มี)
#   4. สร้าง/อัปเดตโครงสร้างฐานข้อมูล + ล็อกสิทธิ์ตารางบัตร
#   5. เปิดระบบด้วย docker
#   6. ตรวจว่าเว็บตอบจริง + สรุปสิ่งที่ต้องทำต่อ
#
# สิ่งที่สคริปต์นี้ "ไม่ทำ" โดยตั้งใจ — ต้องทำเอง:
#   · พิธีสร้างกุญแจบัตร (ต้องทำต่อหน้าอาจารย์ที่ปรึกษา — ดูคู่มือ §3)
#   · นำเข้ารายชื่อนักศึกษา (ต้องมีไฟล์รายชื่อ: npm run import-students -- <ไฟล์>)
#   · ลบข้อมูล (scripts/sql/annual-reset.sql — ทำเองพร้อมสำรองข้อมูล)

set -u

CHECK_ONLY=0
ADMIN_ID=""
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK_ONLY=1 ;;
    --admin) shift; ADMIN_ID="${1:-}" ;;
    -h|--help) sed -n '2,26p' "$0"; exit 0 ;;
    *) echo "ไม่รู้จักตัวเลือก: $1  (ดูวิธีใช้: sh scripts/setup.sh --help)"; exit 1 ;;
  esac
  shift
done

PASS=0; FAIL=0; WARN=0
ok()   { printf '  [ ผ่าน ] %s\n' "$1"; PASS=$((PASS+1)); }
warn() { printf '  [ เตือน ] %s\n' "$1"; WARN=$((WARN+1)); }
bad()  { printf '  [ ไม่ผ่าน ] %s\n' "$1"; FAIL=$((FAIL+1)); }
step() { printf '\n== %s ==\n' "$1"; }
die()  { printf '\nหยุดทำงาน: %s\n\n' "$1"; exit 1; }

cd "$(dirname "$0")/.." || die "หาโฟลเดอร์โปรเจกต์ไม่เจอ"

printf '\n'
printf '========================================================================\n'
printf '  ระบบเลือกตั้งออนไลน์ FMS — ติดตั้ง/ตรวจความพร้อม\n'
[ "$CHECK_ONLY" = "1" ] && printf '  โหมดตรวจอย่างเดียว: จะไม่แก้ไขอะไรทั้งสิ้น\n'
printf '========================================================================\n'

# ── 1. เครื่องมือ ───────────────────────────────────────────────────────────
step "1. เครื่องมือที่ต้องมี"
command -v node >/dev/null 2>&1 && ok "node $(node -v)" || bad "ไม่มี node — ติดตั้ง Node.js 20 ก่อน"
command -v npm  >/dev/null 2>&1 && ok "npm $(npm -v)"   || bad "ไม่มี npm"
if command -v docker >/dev/null 2>&1; then ok "docker พร้อม"; HAS_DOCKER=1; else warn "ไม่มี docker — ข้ามขั้นตอนเปิดระบบ (ข้อ 5)"; HAS_DOCKER=0; fi
if command -v psql >/dev/null 2>&1; then ok "psql พร้อม"; HAS_PSQL=1; else warn "ไม่มี psql — ต้องล็อกสิทธิ์ตารางบัตรเองภายหลัง (ข้อ 4)"; HAS_PSQL=0; fi
[ "$FAIL" -gt 0 ] && die "ติดตั้งเครื่องมือที่ขาดก่อน แล้วรันใหม่"

# ── 2. ค่าใน .env ───────────────────────────────────────────────────────────
step "2. ค่าใน .env"
[ -f .env ] || die ".env ไม่มีในโฟลเดอร์นี้ — คัดลอกตัวอย่างจากคู่มือเจ้าหน้าที่ §3 แล้วเติมค่าให้ครบ"

envval() { grep -E "^[[:space:]]*$1[[:space:]]*=" .env 2>/dev/null | head -1 | sed "s/^[^=]*=//; s/^\"//; s/\"$//"; }
need() {
  v="$(envval "$1")"
  if [ -n "$v" ]; then ok "$1"; else bad "$1 ยังไม่ได้ตั้ง — $2"; fi
}
need DATABASE_URL              "connection string ของฐานข้อมูล (บัญชี fms_app)"
need NEXTAUTH_SECRET           "สุ่มด้วย: openssl rand -base64 32"
need NEXTAUTH_URL              "URL จริงของระบบ เช่น https://xxx.psu.ac.th/fms-ovs"
need ADMIN_JWT_SECRET          "สุ่มด้วย: openssl rand -hex 32"
need AUTHENTIK_CLIENT_ID       "ขอจาก IT ม.อ. (PSU SSO)"
need AUTHENTIK_CLIENT_SECRET   "ขอจาก IT ม.อ. (PSU SSO)"
need AUTHENTIK_REDIRECT_URI    "ขอจาก IT ม.อ. (PSU SSO)"
need ELECTION_BALLOT_PUBLIC_KEY "ได้จากพิธีสร้างกุญแจ: node scripts/generate-election-keys.js"
need BALLOT_CHAIN_SECRET        "ได้จากพิธีสร้างกุญแจเดียวกัน"
[ "$FAIL" -gt 0 ] && die "เติมค่าที่ขาดใน .env ให้ครบก่อน (ถ้าไม่มีกุญแจสองตัวท้าย ระบบจะไม่รับโหวตเลย)"

MIGRATE_URL="${MIGRATE_DATABASE_URL:-$(envval MIGRATE_DATABASE_URL)}"
if [ -z "$MIGRATE_URL" ]; then
  MIGRATE_URL="$(envval DATABASE_URL)"
  warn "ไม่ได้ตั้ง MIGRATE_DATABASE_URL — จะใช้ DATABASE_URL แทน (ปกติสำหรับเครื่องทดสอบ)"
fi

# ── 3. dependency ───────────────────────────────────────────────────────────
step "3. Dependency"
if [ -d node_modules ]; then
  ok "node_modules มีอยู่แล้ว"
elif [ "$CHECK_ONLY" = "1" ]; then
  warn "ยังไม่ได้ติดตั้ง node_modules (โหมดตรวจ ไม่ติดตั้งให้)"
else
  printf '  กำลังติดตั้ง (ใช้เวลา 1-3 นาที)...\n'
  npm ci >/dev/null 2>&1 || npm install >/dev/null 2>&1 || die "npm ci ไม่สำเร็จ — รัน 'npm ci' เองเพื่อดู error"
  ok "ติดตั้ง dependency แล้ว"
fi

# ── 4. ฐานข้อมูล ────────────────────────────────────────────────────────────
step "4. ฐานข้อมูล"
if [ "$CHECK_ONLY" = "1" ]; then
  if DATABASE_URL="$MIGRATE_URL" npx prisma migrate status >/dev/null 2>&1; then
    ok "โครงสร้างฐานข้อมูลเป็นปัจจุบัน"
  else
    warn "โครงสร้างยังไม่ครบ/ต่อฐานข้อมูลไม่ได้ — รันสคริปต์นี้แบบไม่ใส่ --check เพื่อสร้างให้"
  fi
else
  printf '  กำลังสร้าง/อัปเดตตาราง...\n'
  DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy || die "migrate ไม่สำเร็จ — ตรวจว่า connection string ถูกต้องและฐานข้อมูลเปิดอยู่"
  ok "โครงสร้างฐานข้อมูลพร้อม"

  # ล็อกสิทธิ์ตารางบัตร: แอปเพิ่มบัตรได้ แต่แก้/ลบไม่ได้ — หัวใจของความน่าเชื่อถือ
  if [ "$HAS_PSQL" = "1" ] && [ -n "${MIGRATE_DATABASE_URL:-$(envval MIGRATE_DATABASE_URL)}" ]; then
    if psql "$MIGRATE_URL" -f scripts/sql/ballot-grants.sql >/dev/null 2>&1; then
      ok "ล็อกสิทธิ์ตารางบัตรแล้ว (แอปลบบัตรไม่ได้)"
    else
      warn "ล็อกสิทธิ์ไม่สำเร็จ — ถ้ายังไม่ได้สร้าง role fms_app ให้ทำตามหัวไฟล์ scripts/sql/ballot-grants.sql แล้วรันไฟล์นั้นเอง"
    fi
  else
    warn "ข้ามการล็อกสิทธิ์ตารางบัตร (ต้องมี psql + MIGRATE_DATABASE_URL) — บนเครื่องจริงต้องทำ ดูคู่มือ §3"
  fi
fi

# ── 5. เปิดระบบ ─────────────────────────────────────────────────────────────
step "5. เปิดระบบ"
if [ "$CHECK_ONLY" = "1" ] || [ "$HAS_DOCKER" = "0" ]; then
  warn "ข้ามการเปิดระบบ"
else
  printf '  กำลัง build + เปิด container (ครั้งแรกใช้เวลา 3-10 นาที)...\n'
  if docker compose up -d --build; then ok "container ทำงานอยู่"; else die "docker compose ไม่สำเร็จ — ดู log ด้วย: docker compose logs web"; fi
fi

# ── 6. ตรวจว่าเว็บตอบ ───────────────────────────────────────────────────────
step "6. ตรวจว่าเว็บตอบจริง"
BASE_PATH_VAL="$(envval BASE_PATH)"; [ -n "$BASE_PATH_VAL" ] || BASE_PATH_VAL="/fms-ovs"
URL="http://localhost:3000${BASE_PATH_VAL}"
if command -v curl >/dev/null 2>&1; then
  i=0; CODE=""
  while [ $i -lt 20 ]; do
    CODE="$(curl -s -o /dev/null -w '%{http_code}' "$URL" 2>/dev/null || true)"
    [ "$CODE" = "200" ] && break
    i=$((i+1)); sleep 3
  done
  if [ "$CODE" = "200" ]; then ok "เว็บตอบ 200 ที่ $URL"; else warn "เว็บยังไม่ตอบ (ได้ $CODE) — ดู: docker compose logs web"; fi
else
  warn "ไม่มี curl — เปิด $URL ในเบราว์เซอร์เพื่อตรวจเอง"
fi

# ── 7. แอดมิน ───────────────────────────────────────────────────────────────
step "7. แอดมิน"
if [ "$CHECK_ONLY" = "1" ]; then
  node scripts/admin.js --list || warn "อ่านรายชื่อแอดมินไม่ได้ (ต่อฐานข้อมูลไม่ได้?)"
else
  if [ -n "$ADMIN_ID" ]; then
    node scripts/admin.js --grant "$ADMIN_ID" || warn "ตั้งแอดมินไม่สำเร็จ — ตรวจว่ารหัส นศ. นี้มีข้อมูลในระบบแล้ว"
  fi
  node scripts/admin.js --list
  printf '\n  ถ้ายังไม่มีรหัสกลาง หรือจำไม่ได้ ให้ออกใหม่ด้วย:\n    node scripts/admin.js --rotate-password\n'
fi

# ── สรุป ────────────────────────────────────────────────────────────────────
printf '\n========================================================================\n'
printf '  ผ่าน %s · เตือน %s · ไม่ผ่าน %s\n' "$PASS" "$WARN" "$FAIL"
printf '========================================================================\n'
if [ "$CHECK_ONLY" = "1" ]; then
  printf '  โหมดตรวจอย่างเดียว — ไม่มีอะไรถูกแก้ไข\n\n'
else
  cat <<'EOF'
  เหลือทำเอง 3 อย่างก่อนเปิดใช้จริง:
    1. นำเข้ารายชื่อผู้มีสิทธิ์   npm run import-students -- <ไฟล์รายชื่อ>
    2. ตั้งวันเวลา/ชื่องาน/พรรค  ทำในหน้า admin
    3. กด "ตรวจความพร้อมระบบ" ในหน้า admin — ต้องไม่มีข้อสีแดง

  รายละเอียดทั้งหมดอยู่ในไฟล์เดียว: docs/STAFF-HANDBOOK.md

EOF
fi
[ "$FAIL" -gt 0 ] && exit 1
exit 0
