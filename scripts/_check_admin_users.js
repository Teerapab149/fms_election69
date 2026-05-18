const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  try {
    const admins = await p.user.findMany({
      where: { OR: [{ isAdmin: true }, { role: "ADMIN" }, { role: "STAFF" }] },
      select: { id: true, studentId: true, role: true, isAdmin: true, name: true }
    });
    console.log("Admin users:");
    console.log(JSON.stringify(admins, null, 2));
    console.log("Count:", admins.length);
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();
