import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma as db } from "../lib/prisma";

const AUTHENTIK_BASE_URL = "https://psusso.psu.ac.th";
const CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET;
const REDIRECT_URI = process.env.AUTHENTIK_REDIRECT_URI;

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

      authorization: {
        url: `${AUTHENTIK_BASE_URL}/application/o/authorize/`,
        params: {
          scope: "openid email profile",
          redirect_uri: REDIRECT_URI,
        },
      },

      token: {
        async request(context) {
          const { params } = context;
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
    ...(process.env.NODE_ENV !== "production" ? [
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
          // SSO group → privilege. The PSU "staff"/"faculty" groups are
          // faculty-controlled (membership is small + known), so we trust them to
          // grant ADMIN/STAFF. Scan the WHOLE groups array (order-independent) and
          // take the highest privilege present — the old `groups[0]` only looked at
          // the first entry, so a real admin whose "staff" group wasn't first
          // silently fell back to "student". A non-staff PSU account is in neither
          // group → "student" (no admin). To grant admin WITHOUT an SSO group, add
          // the studentId to ADMIN_STUDENT_IDS below.
          // Privilege tiers: "staff" → ADMIN (full); "faculty" → STAFF (also counts
          // as admin via adminCheck). STAFF could later be narrowed to an explicit
          // STAFF_STUDENT_IDS allowlist if the faculty group widens (see runbook §10).
          const groups = Array.isArray(user.groups)
            ? user.groups.map((g) => String(g).toLowerCase())
            : [];
          let newRole = "student";
          if (groups.includes("staff")) newRole = "ADMIN";
          else if (groups.includes("faculty")) newRole = "STAFF";
          // Designated admin student IDs come from env ADMIN_STUDENT_IDS (comma-
          // separated) so they aren't hardcoded (those students graduate). Falls
          // back to the legacy pair if unset — set the env in prod to override.
          const ADMIN_IDS = process.env.ADMIN_STUDENT_IDS
            ? process.env.ADMIN_STUDENT_IDS.split(",").map((s) => s.trim()).filter(Boolean)
            : ["6610510149", "6610510129"];
          const isDesignatedAdmin = ADMIN_IDS.includes(user.studentId);
          // Keep their voting role as "student"; only the isAdmin flag is granted.
          let setAdmin = isDesignatedAdmin || newRole === "ADMIN" || newRole === "STAFF";

          const dbUser = await db.user.upsert({
            where: { studentId: user.studentId },
            update: {
              name: user.name,
              email: user.email,
              facultyId: user.facultyId,
              departmentId: user.departmentId,
              // ไม่ update year, major, gender หากมีค่าจาก dump file แล้ว
              // จะถูก merge ใน logic ด้านล่าง
              role: newRole,
              isAdmin: setAdmin
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
              isFormCompleted: false,
              isAdmin: setAdmin
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