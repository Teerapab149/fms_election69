-- scripts/sql/purge-voter-data.sql: ลบข้อมูลรายคนของนักศึกษาเมื่อขึ้นปีใหม่
--
-- แยกจาก annual-reset.sql โดยตั้งใจ: annual-reset.sql ใช้ล้างบัตรซ้อมหลังนำเข้ารายชื่อจริงแล้ว
-- (DEPLOY-CHECKLIST ข้อ 13) ถ้ารวมการลบผู้ใช้ไว้ในนั้น รายชื่อจริงจะหายตอนซ้อม
-- ไฟล์นี้ใช้ครั้งเดียวตอนขึ้นปีใหม่เท่านั้น
--
-- ลำดับตอนขึ้นปีใหม่:
--   1. npm run archive-year      เก็บผลรวมและตัวเลขรับรองของปีนี้
--   2. sh scripts/backup.sh      สำรองฐานข้อมูล
--   3. annual-reset.sql          ล้างหีบบัตร คะแนน ธงรับรอง และคืนสิทธิ์
--   4. ไฟล์นี้                   ลบแถวผู้ใช้ที่ไม่ใช่แอดมินและไม่ใช่เจ้าหน้าที่
--   5. npm run import-students   นำเข้ารายชื่อของปีใหม่
--
-- ลบอะไร:  แถวใน "User" ที่ isAdmin = false และ role ไม่ใช่ 'STAFF'
--          (ชื่อ อีเมล รหัสนักศึกษา ข้อมูลจากทะเบียน สถานะการใช้สิทธิ์)
-- ไม่ลบ:   แอดมินทุกคน (isAdmin = true) และบัญชีเจ้าหน้าที่ role = 'STAFF'
--          ผลรวมคะแนน ตารางพรรค และ AdminAuditLog (บันทึกของผู้ดูแล ไม่ใช่ของนักศึกษา)
-- ตารางที่อ้าง User: มีตารางเดียวคือ "Template"."authorId" ซึ่งเป็น ON DELETE SET NULL
--          คนที่ถูกลบแล้ว template ที่เขาสร้างยังอยู่ แค่ไม่มีเจ้าของ
--
-- ปฏิเสธเมื่อ: หีบยังมีบัตรอยู่ (ยังไม่ได้รัน annual-reset.sql) ทั้ง transaction ถูกยกเลิก ไม่ลบอะไร
--
-- รันด้วยบัญชี fms_migrate (หรือ superuser) เพราะบัญชีของเว็บลบแถวผู้ใช้ไม่ได้:
--   psql "postgresql://fms_migrate:...@host:5432/fms_election" -v ON_ERROR_STOP=1 -f scripts/sql/purge-voter-data.sql
--
-- สำรองฐานข้อมูลก่อนเสมอ คำสั่งนี้กู้คืนไม่ได้ และสำเนา backup เก่ายังมีข้อมูลเหล่านี้
-- จนกว่าจะหมดรอบเก็บของ backup (ดู docs/MAINTENANCE-RUNBOOK.md)

BEGIN;

DO $$
DECLARE
  ballots  integer;
  admins   integer;
  doomed   integer;
BEGIN
  SELECT count(*) INTO ballots FROM "Ballot";
  IF ballots > 0 THEN
    RAISE EXCEPTION 'ยกเลิก: หีบยังมีบัตร % ใบ ต้องรัน scripts/sql/annual-reset.sql ก่อน แล้วค่อยรันไฟล์นี้ (ยังไม่ได้ลบอะไร)', ballots;
  END IF;

  SELECT count(*) INTO admins FROM "User" WHERE "isAdmin" = true OR role = 'STAFF';
  IF admins = 0 THEN
    RAISE EXCEPTION 'ยกเลิก: ไม่พบแอดมินหรือเจ้าหน้าที่เลย ถ้าลบต่อจะไม่มีใครเข้าหน้าแอดมินได้ (ยังไม่ได้ลบอะไร)';
  END IF;

  SELECT count(*) INTO doomed FROM "User" WHERE "isAdmin" = false AND role IS DISTINCT FROM 'STAFF';
  RAISE NOTICE 'จะลบ % แถว เก็บแอดมินและเจ้าหน้าที่ไว้ % แถว', doomed, admins;
END $$;

DELETE FROM "User" WHERE "isAdmin" = false AND role IS DISTINCT FROM 'STAFF';

COMMIT;

-- ตรวจผลหลังรัน (เหลือเฉพาะแอดมินและเจ้าหน้าที่):
--   SELECT count(*) FILTER (WHERE "isAdmin" OR role = 'STAFF') AS kept,
--          count(*) FILTER (WHERE NOT "isAdmin" AND role IS DISTINCT FROM 'STAFF') AS should_be_zero
--     FROM "User";
