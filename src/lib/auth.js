import NextAuth from "next-auth";
import { prisma as db } from "../lib/prisma";

// ✅ 1. ประกาศตัวแปรเหมือนโค้ดมหาลัยเป๊ะๆ (เพื่อให้คุณสบายใจและเช็คง่าย)
const AUTHENTIK_BASE_URL = "https://psusso.psu.ac.th"; // หรือใช้ process.env.AUTHENTIK_ISSUER ก็ได้แต่มหาลัยให้ base url มา
const CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET;
const REDIRECT_URI = process.env.AUTHENTIK_REDIRECT_URI; // ต้องตรงกับ .env เป๊ะๆ

export const authOptions = {
  providers: [
    {
      id: "authentik",
      name: "PSU Passport",
      type: "oauth",
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,

      // ส่วนที่ 1: หน้า Login (Authorization)
      authorization: {
        url: `${AUTHENTIK_BASE_URL}/application/o/authorize/`,
        params: { scope: "openid email profile" },
      },

      // ✅ ส่วนที่ 2: ขอ Token 
      token: {
        async request(context) {

          const { params } = context; 
          
          const body = new URLSearchParams({
            grant_type: "authorization_code",
            code: params.code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI, //
          });

          const response = await fetch(`${AUTHENTIK_BASE_URL}/application/o/token/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            body: body,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token request failed: ${errorText}`);
          }
          const tokens = await response.json();
          return { tokens };
        },
      },

      // ✅ ส่วนที่ 3: ดึงข้อมูลผู้ใช้
      userinfo: {
        async request(context) {
          const { tokens } = context;
          
          const response = await fetch(`${AUTHENTIK_BASE_URL}/application/o/userinfo/`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          if (!response.ok) {
            throw new Error("User info request failed");
          }

          return await response.json();
        },
      },

      // ✅ ส่วนที่ 4: Map ข้อมูล + เช็ค Role (เลียนแบบ Logic userRole = groups[2])
      profile(profile) {
        console.log("🔥 Raw Profile:", profile);

        // ดึง Role ตามสูตรมหาลัย (Array ตัวที่ 3)
        // หมายเหตุ: ต้องเช็คดีๆ ว่า groups มีค่าเสมอไหม ผมใส่ ? กัน error ไว้
        const uniRole = profile.groups?.[2]; 
        
        let systemRole = 'student'; // ค่า Default ของเรา

        // เทียบ Role แบบที่มหาลัยทำ
        if (uniRole === 'Staff' || uniRole === 'staff') {
            systemRole = 'admin'; // (เปิดบรรทัดนี้ถ้าจะให้ Staff เป็น Admin เลย)
        }

        return {
          id: profile.sub || profile.preferred_username,
          name: profile.name || profile.given_name,
          email: profile.email,
          studentId: profile.preferred_username, // รหัสนักศึกษา
          
          // ส่ง Role ที่แกะได้จากกลุ่ม ไปให้ jwt callback ใช้งานต่อ
          uniRole: uniRole, 
        };
      },
    },
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // ✅ ส่วนที่ 5: บันทึกลง Database (ส่วนนี้มหาลัยไม่มี แต่เราต้องทำ)
    async jwt({ token, user }) {
      if (user) {
        try {
          console.log(`🔄 Syncing: ${user.studentId} | Uni Role: ${user.uniRole}`);

          // Sync ลง DB
          const dbUser = await db.user.upsert({
            where: { studentId: user.studentId },
            update: {
                name: user.name,
                email: user.email,
            },
            create: {
                studentId: user.studentId,
                name: user.name,
                email: user.email,
                role: 'student', // บังคับเป็น student ก่อน (หรือจะใช้ user.uniRole มาเทียบก็ได้)
                isVoted: false,
                isFormCompleted: false
            }
          });

          // เอาข้อมูลจาก DB จริงๆ ใส่กลับเข้าไปใน Session
          token.id = dbUser.id;
          token.studentId = dbUser.studentId;
          token.role = dbUser.role;
          token.isVoted = dbUser.isVoted;
          token.isFormCompleted = dbUser.isFormCompleted;

        } catch (error) {
          console.error("❌ Sync Error:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.studentId = token.studentId;
        session.user.role = token.role;
        session.user.isVoted = token.isVoted;
        session.user.isFormCompleted = token.isFormCompleted;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/login',
  },
};