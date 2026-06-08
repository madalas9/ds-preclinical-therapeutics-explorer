import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteFooter } from "./components/site-footer";
import { MobileNav } from "./components/mobile-nav";

const navLinks = [
  { href: "/treatments", label: "Treatments" },
  { href: "/experiments", label: "Experiments" },
  { href: "/compare", label: "Compare" },
  { href: "/ask", label: "Ask" },
];

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              className="font-bold text-foreground hover:text-interactive transition-colors leading-tight"
            >
              <span className="text-[11px] sm:text-base lg:text-lg">
                DS Preclinical Therapeutics Explorer
              </span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <ul className="hidden sm:flex items-center gap-1 sm:gap-2">
                <li>
                  <a
                    href="/"
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-muted rounded-md transition-colors"
                  >
                    Dashboard
                  </a>
                </li>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-muted rounded-md transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <MobileNav />
            </div>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
