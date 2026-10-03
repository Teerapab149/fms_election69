# FMS Election — แปลง URL postgresql://… เป็นตัวแปร PG* (source ด้วย `. scripts/lib/pgurl.sh`)
# ใช้ร่วมกันโดย scripts/backup.sh และ scripts/restore.sh (โหมด direct) — ที่เดียว แก้ที่เดียว
# ผู้ที่ source ต้องนิยามฟังก์ชัน fail() เอง (รับข้อความ 1 ตัว แล้วจบสคริปต์ด้วยวิธีของตัวเอง)
# ฟังก์ชันไม่พิมพ์ URL หรือรหัสผ่านออกจอเลย

# ── ต่อ DB แบบ direct: แปลง URL เป็นตัวแปร PG* ────────────────────────────────
# ไม่ส่ง URL ให้ pg_dump ตรง ๆ เพราะรหัสผ่านจะอยู่บน command line · และ URL ของ Prisma
# มักมี ?schema=public / connection_limit=… ที่ libpq ไม่รู้จักแล้วปฏิเสธทั้งบรรทัด จึงเก็บไว้
# แค่ sslmode (ความหมายเดียวกันทั้งสองฝั่ง) ที่เหลือทิ้ง
pct_decode() {
  # %XX → ไบต์ · LC_ALL=C ให้ awk พิมพ์เป็นไบต์ดิบ ไม่ใช่อักขระ Unicode
  printf '%s' "$1" | LC_ALL=C awk '
    BEGIN { hex = "0123456789abcdef" }
    { s = $0; out = ""
      while ((i = index(s, "%")) > 0) {
        h = tolower(substr(s, i + 1, 2))
        a = index(hex, substr(h, 1, 1)); b = index(hex, substr(h, 2, 1))
        if (length(h) == 2 && a > 0 && b > 0) {
          out = out substr(s, 1, i - 1) sprintf("%c", (a - 1) * 16 + (b - 1)); s = substr(s, i + 3)
        } else { out = out substr(s, 1, i); s = substr(s, i + 1) }
      }
      printf "%s", out s }'
}

use_url() {
  _url="$1"
  case "$_url" in
    postgres://*|postgresql://*) ;;
    *) fail "$2 ไม่ใช่ URL แบบ postgresql://…" ;;
  esac
  _rest="${_url#*://}"
  _query=""
  case "$_rest" in *\?*) _query="${_rest#*\?}"; _rest="${_rest%%\?*}" ;; esac
  _userinfo=""
  case "$_rest" in *@*) _userinfo="${_rest%@*}"; _rest="${_rest##*@}" ;; esac
  _db=""
  case "$_rest" in */*) _db="${_rest#*/}"; _rest="${_rest%%/*}" ;; esac
  _port=""
  case "$_rest" in
    \[*\]:*) _port="${_rest##*]:}"; _rest="${_rest%]:*}]" ;;
    \[*) ;;
    *:*) _port="${_rest##*:}"; _rest="${_rest%:*}" ;;
  esac
  _rest="${_rest#[}"; _rest="${_rest%]}"
  if [ -n "$_userinfo" ]; then
    case "$_userinfo" in
      *:*) PGUSER="$(pct_decode "${_userinfo%%:*}")"; PGPASSWORD="$(pct_decode "${_userinfo#*:}")"; export PGUSER PGPASSWORD ;;
      *) PGUSER="$(pct_decode "$_userinfo")"; export PGUSER ;;
    esac
  fi
  if [ -n "$_rest" ]; then PGHOST="$(pct_decode "$_rest")"; export PGHOST; fi
  if [ -n "$_port" ]; then PGPORT="$_port"; export PGPORT; fi
  if [ -n "$_db" ]; then PGDATABASE="$(pct_decode "$_db")"; export PGDATABASE; fi
  _old_ifs="$IFS"; IFS='&'; set -f
  for _kv in $_query; do
    case "$_kv" in sslmode=*) PGSSLMODE="${_kv#sslmode=}"; export PGSSLMODE ;; esac
  done
  set +f; IFS="$_old_ifs"
}
