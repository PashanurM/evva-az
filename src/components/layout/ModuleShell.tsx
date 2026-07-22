"use client";

import { SiteShell } from "@/components/layout/SiteShell";

interface ModuleShellProps {
  children: React.ReactNode;
  title: string;
}

export function ModuleShell({ children, title }: ModuleShellProps) {
  return (
    <SiteShell>
      <main className="module-page">
        <div className="container">
          <div className="module-page-head">
            <h1>{title}</h1>
          </div>
          {children}
        </div>
      </main>
    </SiteShell>
  );
}
