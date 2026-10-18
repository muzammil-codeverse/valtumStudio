"use client";

import { useEffect, useRef } from "react";

import type { Role } from "@/modules/auth/domain/roles";

import { CloseIcon } from "../components/icons";
import { AdminSidebar } from "./AdminSidebar";

interface AdminMobileDrawerProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function AdminMobileDrawer({
  user,
  isOpen,
  onClose
}: AdminMobileDrawerProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle native cancel event (when Esc is pressed)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="admin-root fixed inset-y-0 left-0 h-full w-64 m-0 border-r border-[var(--admin-border)] bg-[var(--admin-surface)] p-0 shadow-xl focus:outline-hidden backdrop:bg-black/40 backdrop:backdrop-blur-xs transition-transform duration-200"
    >
      <div className="flex flex-col h-full relative">
        {/* Accessible close button in top right of drawer */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-4 top-4 p-1.5 hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-secondary)] rounded-md focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2 z-50"
        >
          <CloseIcon size={18} />
        </button>

        {/* Sidebar navigation wrapper inside drawer */}
        <div className="flex-1 h-full">
          <AdminSidebar user={user} onCloseMobileDrawer={onClose} />
        </div>
      </div>
    </dialog>
  );
}
