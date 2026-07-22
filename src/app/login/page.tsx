import { Suspense } from "react";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.login;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-shell"><div className="login-card">…</div></div>}>
      <AuthLoginForm />
    </Suspense>
  );
}
