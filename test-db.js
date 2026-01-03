// ไฟล์: test-db.js
const { PrismaClient } = require('@prisma/client');

// ลองเชื่อมต่อดูซิ
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // สั่งให้พ่น log ทุกอย่างออกมา
});

async function main() {
  console.log("⏳ กำลังทดสอบการเชื่อมต่อ...");
  try {
    // 1. ลอง Connect
    await prisma.$connect();
    console.log("✅ เชื่อมต่อ Database สำเร็จ!");

    // 2. ลองดึงข้อมูล SystemConfig
    const config = await prisma.systemConfig.findFirst();
    console.log("📄 ข้อมูล Config:", config);

    // 3. ลองนับจำนวน User
    const userCount = await prisma.user.count();
    console.log("👥 จำนวน User:", userCount);

  } catch (e) {
    console.error("\n❌ พังครับ! สาเหตุ:");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();