-- Data fix: สาขา "การจัดการเเละความเป็นผู้ประกอบการ" ถูกพิมพ์ด้วย สระเอ สองตัว (เ+เ)
-- แทน สระแอ (แ) ใน dropdown ของ EditCandidateMemberModal ค่าที่เลือกถูกเก็บลง
-- Member.major ตรง ๆ และแสดงต่อสาธารณะใน modal ของผู้สมัคร จึงแก้แถวเดิมให้ตรงกับ
-- ตัวเลือกที่สะกดถูกแล้ว (idempotent: รันซ้ำไม่มีแถวให้แก้)
UPDATE "Member" SET "major" = replace("major", 'เเ', 'แ') WHERE "major" LIKE '%เเ%';
