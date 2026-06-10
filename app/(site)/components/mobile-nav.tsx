"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/treatments", label: "Treatments" },
  { href: "/experiments", label: "Experiments" },
  { href: "/compare", label: "Compare" },
  { href: "/ask", label: "Ask" },
  { href: "/contribute", label: "Contribute" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sm:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors touch-manipulation"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[min(80vw,320px)] bg-surface border-l border-border shadow-lg sm:hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors touch-manipulation"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-4 px-6 text-base font-medium border-b border-border transition-colors touch-manipulation ${
                      isActive
                        ? "bg-surface-muted text-foreground"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-border mt-auto">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
