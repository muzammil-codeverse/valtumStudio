"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Role } from "@/modules/auth/domain/roles";
import { authClient } from "@/modules/auth/ui/auth-client";

import { ChevronDownIcon, LogoutIcon, SessionsIcon } from "../components/icons";

interface AdminAccountMenuProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
}

export function AdminAccountMenu({ user }: AdminAccountMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle keyboard events (Escape to close, focus return)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.assign("/auth/sign-in");
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User Account Menu"
        className="flex items-center gap-2 p-1.5 hover:bg-[var(--admin-surface-hover)] rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2"
      >
        <div className="w-7 h-7 rounded-full bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] font-semibold flex items-center justify-center text-xs">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <ChevronDownIcon className="text-[var(--admin-text-secondary)] w-4 h-4" />
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account options"
          className="absolute right-0 mt-1 w-56 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-md shadow-md py-1 z-50 focus:outline-hidden"
        >
          {/* User profile summary */}
          <div className="px-4 py-2 border-b border-[var(--admin-border)] text-left">
            <p className="text-xs font-semibold text-[var(--admin-text)] truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-[var(--admin-text-muted)] capitalize truncate mt-0.5">
              {user.role}
            </p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/admin/security/sessions"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text)] transition-colors focus:bg-[var(--admin-surface-hover)] focus:outline-hidden"
            >
              <SessionsIcon className="w-4 h-4 text-[var(--admin-text-muted)]" />
              <span>Active Sessions</span>
            </Link>
          </div>

          {/* Action */}
          <div className="border-t border-[var(--admin-border)] py-1">
            <button
              onClick={handleSignOut}
              role="menuitem"
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[var(--admin-danger)] hover:bg-red-50 hover:text-[var(--admin-danger)] transition-colors text-left focus:bg-red-50 focus:outline-hidden"
            >
              <LogoutIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
