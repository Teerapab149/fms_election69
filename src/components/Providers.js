"use client";

import { SessionProvider } from "next-auth/react";
import { GlobalConfigProvider } from "../contexts/GlobalConfigContext";

// ✅ รับ session + globalConfig + activeTemplateId (SSR) เข้ามาเป็น props
export default function Providers({ children, session, globalConfig, activeTemplateId = "classic" }) {
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
      <GlobalConfigProvider value={globalConfig} activeTemplateId={activeTemplateId}>
        {children}
      </GlobalConfigProvider>
    </SessionProvider>
  );
}