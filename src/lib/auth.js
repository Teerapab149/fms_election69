import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma as db } from "../lib/prisma";
import { roleFromSsoGroups } from "./auth/roleFromSso.mjs";

const AUTHENTIK_BASE_URL = "https://psusso.psu.ac.th";
const CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET;
const REDIRECT_URI = process.env.AUTHENTIK_REDIRECT_URI;

// ─── SEC-MOCK2 · แหล่งความจริงเดียวของ "mock-login provider ถูก register หรือยัง" ───
// เงื่อนไขนี้คือสิ่งที่ "ให้สิทธิ์เข้าระบบ" จริง (ไม่ใช่ NEXT_PUBLIC_ENABLE_MOCK_LOGIN
// ซึ่งคุมแค่การแสดงปุ่มบนหน้า login). readiness check และ badge ในหน้า settings
// ต้องอ่านจากฟังก์ชันนี้เท่านั้น เพื่อไม่ให้ "ตัวตรวจ" มองคนละตัวแปรกับ "ตัวกั้น"
export function isMockLoginProviderRegistered() {
  return (
    process.env.NODE_ENV !== "production" ||
    (process.env.E2E_MOCK_LOGIN === "true" &&
      /_e2e(\?|$)/.test(process.env.DATABASE_URL || ""))
  );
}

export const authOptions = {
  // 🔇 Disable client-side logging to prevent 404 errors on /api/auth/_log
  logger: {
    error(code, metadata) {
      console.error(code, metadata);
    },
    warn(code) {
      console.warn(code);
    },
    debug(code, metadata) {
      // console.debug(code, metadata);
    },
  },
  providers: [
    {
      id: "authentik",
      name: "PSU Passport",
      type: "oauth",
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      issuer: "https://psusso.psu.ac.th/application/o/fms-ovs/",

      // ประกาศไว้ตรง ๆ ไม่พึ่ง default ของไลบรารี: NextAuth v4 เติม checks: ["state"]
      // ให้เองเมื่อไม่ได้ระบุ (core/lib/providers.js:62) แต่ด่านตรวจ state ด้านล่าง
      // พึ่งค่านี้อยู่ ถ้าวันหนึ่ง default เปลี่ยน ด่านจะเงียบไปโดยไม่มีใครรู้
      checks: ["state"],

      authorization: {
        url: `${AUTHENTIK_BASE_URL}/application/o/authorize/`,
        params: {
          scope: "openid email profile",
          redirect_uri: REDIRECT_URI,
        },
      },

      token: {
        async request(context) {
          const { params, checks } = context;

          // ตรวจ state เอง — จำเป็นเพราะ provider นี้เขียน token.request ของตัวเอง
          //
          // ใน next-auth v4 (core/lib/oauth/callback.js:74-96) `checks.state.use()`
          // แค่ "อ่าน" state จาก cookie มาใส่ `checks` เท่านั้น คนที่ "เทียบ" ว่า
          // state ที่ IdP ส่งกลับมาตรงกับ cookie ไหมคือ openid-client ข้างใน
          // `client.callback()` / `client.oauthCallback()` — แต่พอ provider มี
          // `token.request` ของตัวเอง โค้ดจะแตกไปสาขาบรรทัดที่ 85 แล้วสร้าง TokenSet
          // จากผลลัพธ์ของเราตรง ๆ **ทั้งสองฟังก์ชันนั้นไม่ถูกเรียกเลย** ด่านเทียบ state
          // จึงหายไปทั้งด่าน และ token.request เดิมก็อ่านแต่ params.code ไม่เคยแตะ checks
          //
          // ผลคือ login CSRF: ผู้โจมตีถือ code ที่ใช้ได้ของตัวเองอยู่ หลอกให้เหยื่อเปิด
          // callback URL นั้น เหยื่อก็จะได้ session เป็นบัญชีของผู้โจมตีโดยไม่รู้ตัว
          // ในบริบทเลือกตั้งแปลว่านักศึกษาอาจกำลังดูหน้าจอ/ลงคะแนนในนามคนอื่นอยู่
          //
          // เทียบแบบ constant-time ไม่จำเป็น: ทั้งสองค่าฝั่งเราเป็นคนออกเอง ไม่ใช่ความลับ
          // ที่ต้องกันการเดาทีละไบต์ และการรั่วเวลาที่นี่ไม่ให้ข้อมูลอะไรกับผู้โจมตี
          if (!checks?.state || !params?.state || checks.state !== params.state) {
            throw new Error("OAuth state mismatch — ปฏิเสธการล็อกอินนี้");
          }

          const body = new URLSearchParams({
            grant_type: "authorization_code",
            code: params.code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
          });

          const response = await fetch(`${AUTHENTIK_BASE_URL}/application/o/token/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Mozilla/5.0",
            },
            body: body,
          });

          const text = await response.text();
          if (!response.ok) throw new Error(`Token failed: ${response.status}`);
          return { tokens: JSON.parse(text) };
        },
      },

      userinfo: {
        async request(context) {
          const { tokens } = context;
          const response = await fetch(`${AUTHENTIK_BASE_URL}/application/o/userinfo/`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const text = await response.text();
          return JSON.parse(text);
        },
      },

      profile(profile) {
        // 🔍 ดูข้อมูลดิบจากมหาลัยใน Terminal
        /*console.log("---------- [DEBUG] RAW PROFILE FROM PSU ----------");
        console.log(JSON.stringify(profile, null, 2));
        console.log("--------------------------------------------------");*/

        // Mapping ข้อมูลแบบรองรับหลายเคส (Defensive Mapping)
        const studentId = profile.StudentID || profile.student_id || profile.preferred_username || profile.sub;
        const facultyId = profile.FacultyID || profile.faculty_id || profile.facultyId || profile.office_name_th;
        const departmentId = profile.DepartmentID || profile.department_id || profile.departmentId || profile.department_th;

        // ตรวจสอบว่า studentId มีค่าจริงไหมก่อนส่งต่อ
        if (!studentId) {
          console.error("❌ Critical: StudentID not found in SSO profile!");
        }

        return {
          id: String(profile.sub || studentId),
          name: profile.StudentName || profile.name || profile.given_name || "Unknown Name",
          email: profile.Email || profile.email || "",
          studentId: String(studentId),
          facultyId: facultyId ? String(facultyId) : null,
          departmentId: departmentId ? String(departmentId) : null,
          uniToken: profile.Token || profile.token || null,
          year: null,
          groups: profile.groups,
          isAdmin: false
        };
      },
    },

    // ─── Mock Login — DEV ONLY (ใช้สำหรับทดสอบ local โดยไม่ต้องผ่าน PSU SSO) ───
    // เปิดใช้งานโดยเพิ่มใน .env.local:
    //   NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true
    // Provider นี้จะไม่ถูก register เลยใน production (NODE_ENV === "production")
    // ── ข้อยกเว้นเดียว (v2-R11): e2e gate รัน PROD BUILD (`next start` บังคับ
    // NODE_ENV=production เสมอ) กับ DB ทดสอบแยก — อนุญาต provider เฉพาะเมื่อ
    // เงื่อนไขครบ "ทั้งสอง": runner ตั้ง E2E_MOCK_LOGIN=true อย่างชัดเจน และ
    // DATABASE_URL ชี้ database ที่ชื่อลงท้าย _e2e จริง. deployment จริงไม่มีทาง
    // ผ่านทั้งคู่ (ไม่ตั้ง flag + DB ชื่อจริง) — mock login จึงยังปิดตายบน prod.
    // เงื่อนไขเดียวกันนี้ถูกยกไปเป็น isMockLoginProviderRegistered() ด้านบน (SEC-MOCK2)
    ...(isMockLoginProviderRegistered() ? [
      CredentialsProvider({
        id: "mock-login",
        name: "Mock Login",
        credentials: {
          studentId: { label: "Student ID", type: "text" }
        },
        async authorize(credentials) {
          if (!credentials?.studentId) return null;

          // ลองดึงข้อมูลจริงจาก DB ก่อน (ถ้ามีนักศึกษา import ไว้แล้ว)
          // ห่อด้วย try-catch: ถ้า DB ไม่พร้อม (local dev) ให้ข้ามไป fallback แทนการ throw
          try {
            const dbUser = await db.user.findUnique({
              where: { studentId: credentials.studentId }
            });

            if (dbUser) {
              return {
                id: String(dbUser.id),
                name: dbUser.name || "Mock User",
                email: dbUser.email || `${credentials.studentId}@mock.dev`,
                studentId: dbUser.studentId,
                facultyId: dbUser.facultyId || "30",
                departmentId: dbUser.departmentId || null,
                year: dbUser.year || "ปี 1",
                groups: dbUser.isAdmin ? ["staff"] : ["student"],
                isAdmin: dbUser.isAdmin || false
              };
            }
          } catch (e) {
            // DB ไม่พร้อมใช้งาน (เช่น ยังไม่ได้รัน PostgreSQL ใน local) — ใช้ mock data แทน
            console.warn("[mock-login] DB unavailable, falling back to mock data:", e.message);
          }

          // Fallback: สร้างข้อมูล mock ถ้าไม่พบใน DB หรือ DB ยังไม่พร้อม
          return {
            id: credentials.studentId,
            name: `Mock Student ${credentials.studentId}`,
            email: `${credentials.studentId}@mock.dev`,
            studentId: credentials.studentId,
            facultyId: "30",
            departmentId: null,
            year: "ปี 1",
            groups: ["student"],
            isAdmin: false
          };
        }
      })
    ] : []),
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user, account }) {
      // ✅ Capture ID Token from provider for Logout
      if (account && account.id_token) {
        token.id_token = account.id_token;
      }

      // ขั้นตอนนี้สำคัญ: 'user' จะมีค่าเฉพาะตอน Sign In ครั้งแรกเท่านั้น
      if (user) {
        console.log(`🔄 [DB Sync] Start upsert for studentId: ${user.studentId}`);

        try {
          // บันทึก/อัปเดต ข้อมูลลง Postgres ผ่าน Prisma
          // `role` records which PSU group signed in and grants NOTHING — see the
          // header of roleFromSso.mjs. `isAdmin` is deliberately absent from both
          // branches below: signing in through SSO must never make anyone an
          // admin, and must never un-make one either (that would fight with
          // scripts/admin.js --grant, the single source of truth). New rows start
          // isAdmin=false via the schema default; existing rows keep whatever the
          // script last set.
          const newRole = roleFromSsoGroups(user.groups);

          const dbUser = await db.user.upsert({
            where: { studentId: user.studentId },
            update: {
              name: user.name,
              email: user.email,
              facultyId: user.facultyId,
              departmentId: user.departmentId,
              // ไม่ update year, major, gender หากมีค่าจาก dump file แล้ว
              // จะถูก merge ใน logic ด้านล่าง
              role: newRole
            },
            create: {
              studentId: user.studentId,
              name: user.name,
              email: user.email,
              facultyId: user.facultyId,
              departmentId: user.departmentId,
              role: newRole,
              year: user.year,
              isVoted: false,
              isFormCompleted: false
              // isAdmin: omitted on purpose → schema default false
            }
          });

          // Merge logic: อัปเดต fields เฉพาะที่ยังว่างอยู่ (ไม่ overwrite ข้อมูลจาก dump file)
          const fieldsToMerge = {};
          if (!dbUser.year && user.year) {
            fieldsToMerge.year = user.year;
          }

          // อัปเดตเฉพาะ fields ที่ว่าง
          if (Object.keys(fieldsToMerge).length > 0) {
            await db.user.update({
              where: { studentId: user.studentId },
              data: fieldsToMerge
            });
          }

          console.log(`✅ [DB Sync] Success: User ID ${dbUser.id} updated/created.`);

          // นำข้อมูลจาก DB มาใส่ใน Token
          token.id = dbUser.id;
          token.studentId = dbUser.studentId;
          token.role = dbUser.role;
          token.isAdmin = dbUser.isAdmin;
          token.isVoted = dbUser.isVoted;
          token.facultyId = dbUser.facultyId;
          token.departmentId = dbUser.departmentId;
          token.year = dbUser.year;

        } catch (error) {
          console.error("❌ [DB Sync] Error occurred during Prisma upsert:");
          console.error(error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.studentId = token.studentId;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin === true;
        session.user.isVoted = token.isVoted;
        session.user.facultyId = token.facultyId;
        session.user.departmentId = token.departmentId;
        // ✅ Pass ID Token to client for Logout
        session.id_token = token.id_token;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};