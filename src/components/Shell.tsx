/**
 * App chrome: a slim header with just a hamburger (opens a left aside / drawer).
 * Primary navigation + sign-out live in the drawer (a calcite-sheet). Calcite
 * custom events aren't auto-bound by React, so the sheet's close event is wired
 * via a ref.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Report an incidence", href: "/report" },
  { label: "Get help", href: "/support" },
  { label: "Verify", href: "/verify" },
  { label: "Profile", href: "/profile" },
];

export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLElement | null>(null);

  // Keep React state in sync when the sheet closes itself (scrim/escape/close).
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onClose = () => setOpen(false);
    el.addEventListener("calciteSheetClose", onClose);
    return () => el.removeEventListener("calciteSheetClose", onClose);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? router.pathname === "/" || router.pathname.startsWith("/meters") : router.pathname.startsWith(href);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const displayName = user?.name || user?.email || "Customer";

  // Show the customer's uploaded profile photo in the drawer avatar when present,
  // falling back to initials (via full-name) otherwise.
  const { data: avatarData } = useSWR<{ dataUrl: string | null }>(
    user ? "/api/profile/avatar" : null
  );
  const avatarUrl = avatarData?.dataUrl || null;

  return (
    <div className="app">
      <header className="appbar app-top">
        <calcite-action
          icon="hamburger"
          text="Menu"
          scale="l"
          appearance="transparent"
          onClick={() => setOpen(true)}
        />
      </header>

      <calcite-sheet
        ref={sheetRef}
        open={open || undefined}
        position="inline-start"
        display-mode="overlay"
        width-scale="s"
        label="Menu"
      >
        <calcite-panel>
          <div className="drawer-head">
            <calcite-avatar
              scale="l"
              full-name={displayName}
              thumbnail={avatarUrl || undefined}
            />
            <div>
              <div className="drawer-user-name">{user?.name || "Customer"}</div>
              <div className="drawer-user-email">{user?.email}</div>
            </div>
          </div>
          <nav className="drawer-nav">
            {NAV.map((n) => (
              <a key={n.href} className={isActive(n.href) ? "active" : undefined} onClick={() => go(n.href)}>
                {n.label}
              </a>
            ))}
          </nav>
          <calcite-button
            slot="footer"
            width="full"
            appearance="outline"
            kind="neutral"
            icon-start="sign-out"
            onClick={logout}
          >
            Sign out
          </calcite-button>
        </calcite-panel>
      </calcite-sheet>

      <main className="content">{children}</main>
    </div>
  );
}
