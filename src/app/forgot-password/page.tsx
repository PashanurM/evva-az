import { AuthForgotPasswordForm } from "@/components/auth/AuthForgotPasswordForm";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.forgotPassword;

export default function ForgotPasswordPage() {
  return <AuthForgotPasswordForm />;
}
