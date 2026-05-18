const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  try {
    const cfg = await p.systemConfig.findFirst();
    console.log("SystemConfig.activeTemplateId =", cfg?.activeTemplateId);
    const tmplCount = await p.template.count();
    console.log("Template table row count =", tmplCount);
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();
