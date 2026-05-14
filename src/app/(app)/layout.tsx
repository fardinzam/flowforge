import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      <nav aria-label="FlowForge app navigation">
        <a href="/workflows">Workflows</a>
      </nav>
      {children}
    </main>
  );
}
