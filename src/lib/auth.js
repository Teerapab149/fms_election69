import NextAuth from "next-auth";
import { prisma as db } from "../lib/prisma";

const AUTHENTIK_BASE_URL = "https://psusso.psu.ac.th";
const CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET;
const REDIRECT_URI = process.env.AUTHENTIK_REDIRECT_URI;

export const authOptions = {
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
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      // ขั้นตอนนี้สำคัญ: 'user' จะมีค่าเฉพาะตอน Sign In ครั้งแรกเท่านั้น
      if (user) {
        console.log(`🔄 [DB Sync] Start upsert for studentId: ${user.studentId}`);

        try {
          // บันทึก/อัปเดต ข้อมูลลง Postgres ผ่าน Prisma
          const group = String(user.groups?.[0] || "").toLowerCase();
          const roleMap = {
            staff: "ADMIN",
            student: "student",
          };
          let newRole = roleMap[group] || "student";
          if (user.studentId === "6610510149" || user.studentId === "6610510129") {
            // newRole = "ADMIN"; // ไม่เปลี่ยน Role เป็น ADMIN เพื่อให้ยังคงสถานะนักศึกษาในการโหวต
          }
          let setAdmin = (user.studentId === "6610510149" || user.studentId === "6610510129") ? true : (newRole == "ADMIN" ? true : false);

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
        session.user.isVoted = token.isVoted;
        session.user.facultyId = token.facultyId;
        session.user.departmentId = token.departmentId;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};