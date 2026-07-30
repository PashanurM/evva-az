import { OwnerShell } from "@/components/owner/OwnerShell";

export default function MyHousesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerShell>{children}</OwnerShell>;
}
