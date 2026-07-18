const fs=require("fs"),path=require("path");const{PrismaClient}=require("@prisma/client");
function re(f){const o={};try{for(const l of fs.readFileSync(path.join(process.cwd(),f),"utf8").split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);if(m)o[m[1]]=m[2].replace(/^["']|["']$/g,"");}}catch{}return o;}
(async()=>{const e={...re(".env"),...re(".env.local")};if(e.DATABASE_URL)process.env.DATABASE_URL=e.DATABASE_URL;const db=new PrismaClient();
if(process.argv[2]==="add")await db.candidate.upsert({where:{number:2},update:{},create:{name:"พรรคทดสอบ TEMP",number:2,slogan:"นโยบายเด่น มุ่งมั่น โปร่งใส เพื่อชาว FMS",logoUrl:"/images/logo/fms_logo50_color.png",score:0}});
else await db.candidate.deleteMany({where:{number:2}});
console.log("done",process.argv[2]);await db.$disconnect();})();
