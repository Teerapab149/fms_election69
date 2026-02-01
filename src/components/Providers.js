"use client";

import { SessionProvider } from "next-auth/react";

// ✅ รับ session เข้ามาเป็น props
export default function Providers({ children, session }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <SessionProvider
      session={session}
      basePath={`${basePath}/api/auth`}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchOnMount={false}
    >
      {children}
    </SessionProvider>
  );
}