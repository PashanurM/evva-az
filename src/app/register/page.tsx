import { AuthRegisterForm } from "@/components/auth/AuthRegisterForm";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.register;

export default function RegisterPage() {
  return <AuthRegisterForm />;
}
