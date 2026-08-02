"use client";

import { usePathname } from "next/navigation";
import { AdminChatWidget } from "@/components/chat/AdminChatWidget";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <AdminChatWidget />
    </>
  );
}
