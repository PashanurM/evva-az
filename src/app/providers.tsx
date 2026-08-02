"use client";

import { AuthProvider } from "@/providers/AuthProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { UnreadMessagesProvider } from "@/providers/UnreadMessagesProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <UnreadMessagesProvider>{children}</UnreadMessagesProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
