"use client";

import { SessionProvider } from "next-auth/react";

// ✅ รับ session เข้ามาเป็น props
export default function Providers({ children, session }) {
  return (
    <SessionProvider 
      session={session} // 👈 ส่ง session ใส่เข้าไปตรงนี้ (สำคัญ!)
      refetchInterval={0}
      refetchOnWindowFocus={false} 
      refetchWhenOffline={false}
      refetchOnMount={false}
    >
      {children}
    </SessionProvider>
  );
}