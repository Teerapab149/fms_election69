-- scripts/sql/annual-reset.sql — ล้างข้อมูลเพื่อเริ่มปีการศึกษาใหม่
--
-- รันด้วยบัญชี fms_migrate (หรือ superuser) เท่านั้น — บัญชีที่เว็บใช้ (fms_app)
-- ลบบัตรไม่ได้โดยตั้งใจ ดู ballot-grants.sql · หน้าแอดมินจึงไม่มีปุ่มนี้ให้กด
--
--   ⚠️ สำรองฐานข้อมูลก่อนเสมอ — คำสั่งด้านล่างกู้คืนไม่ได้
--       sh scripts/backup.sh
--       (หรือ pg_dump ตามมาตรฐานของคณะ)
--
--   วิธีรัน:
--       psql "postgresql://fms_migrate:...@host:5432/fms_election" -f scripts/sql/annual-reset.sql
--
-- ตรวจก่อนรัน ว่ากำลังต่อฐานข้อมูลถูกตัว:
--       SELECT current_database();
--
-- ลำดับสำคัญ: ล้างบัตรก่อน แล้วค่อยแตะคะแนน/พรรค เพื่อไม่ให้เหลือบัตรที่ชี้ไปยัง
-- พรรคที่ถูกลบไปแล้ว

BEGIN;

-- 1. กล่องบัตร + โซ่ตรวจสอบ กลับสู่จุดเริ่มต้น
--    (บัตรของปีก่อนต้องถูกสำรองไว้แล้ว — เมื่อลบแล้วนับใหม่ไม่ได้อีก)
DELETE FROM "Ballot";
ALTER SEQUENCE "Ballot_seq_seq" RESTART WITH 1;
UPDATE "ChainHead" SET head = 'GENESIS', seq = 0 WHERE id = 1;

-- 2. คืนสิทธิ์โหวตให้นักศึกษาปี 1-4 (เท่ากับที่ระบบเคยทำในปุ่ม "ล้างคะแนน")
UPDATE "User"
   SET "isVoted" = false, "votedAt" = NULL
 WHERE year IN ('ปี 1', 'ปี 2', 'ปี 3', 'ปี 4');

-- 3. คะแนนทุกพรรคกลับเป็นศูนย์
UPDATE "Candidate" SET score = 0;

-- 4. ปลดธงรับรองผลของปีก่อน (ไม่งั้นเครื่องมือตรวจสอบจะยังถือว่าคะแนนถูกล็อกอยู่)
UPDATE "SystemConfig"
   SET "globalConfig" = jsonb_set(
         COALESCE("globalConfig", '{}')::jsonb, '{ballotsAnonymized}', 'false'::jsonb, true)
 WHERE id = 1;

-- ── ถึงตรงนี้: คะแนนศูนย์ กล่องบัตรว่าง ทุกคนโหวตใหม่ได้ แต่รายชื่อพรรคยังอยู่ ──
-- ถ้าต้องการเก็บรายชื่อพรรคปีเก่าไว้ ให้ COMMIT ตรงนี้แล้วหยุด
-- ถ้าจะเริ่มกรอกพรรคชุดใหม่ทั้งหมด ให้รันสามคำสั่งต่อไปนี้ด้วย:

-- DELETE FROM "Member";
-- DELETE FROM "Candidate";
-- INSERT INTO "Candidate" (name, number, score) VALUES ('งดออกเสียง', 0, 0);

COMMIT;

-- ตรวจผลหลังรัน (ควรได้ 0 ทั้งสามค่า):
--   SELECT (SELECT count(*) FROM "Ballot")                              AS ballots,
--          (SELECT count(*) FROM "User" WHERE "isVoted")                AS voted,
--          (SELECT COALESCE(sum(score),0) FROM "Candidate")             AS scores;
--
-- แล้วยืนยันด้วยเครื่องมือของระบบอีกชั้น:
--   npm run preflight
