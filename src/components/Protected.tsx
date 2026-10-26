/** Gate + chrome for authenticated pages: shows a loader until the session is
 * confirmed, redirects to /login if absent, otherwise renders inside the Shell. */
import type { ReactNode } from "react";
import { useRequireAuth } from "@/lib/auth";
import Shell from "@/components/Shell";

export default function Protected({ children }: { children: ReactNode }) {
  const { ready, user } = useRequireAuth();
  if (!ready || !user) {
    return (
      <div className="center-pad">
        <calcite-loader label="Loading" />
      </div>
    );
  }
  return <Shell>{children}</Shell>;
}
