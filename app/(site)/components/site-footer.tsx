import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
          {/* COLUMN 1 — SUPPORTED BY */}
          <div>
            <p className="text-xs uppercase tracking-wider text-text-tertiary mb-4">
              Supported by
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="https://udayton.edu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="University of Dayton"
                className="block transition-opacity opacity-80 hover:opacity-100 dark:opacity-90 dark:hover:opacity-100"
              >
                <Image
                  src="/logos/udayton.svg"
                  alt="University of Dayton"
                  width={160}
                  height={48}
                  className="object-contain"
                  style={{ height: "48px", width: "auto" }}
                />
              </Link>
              <Link
                href="https://www.t21rs.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Trisomy 21 Research Society"
                className="block transition-opacity opacity-80 hover:opacity-100 dark:opacity-90 dark:hover:opacity-100"
              >
                <Image
                  src="/logos/t21rs.png"
                  alt="Trisomy 21 Research Society"
                  width={48}
                  height={48}
                  className="object-contain"
                  style={{ height: "48px", width: "48px" }}
                />
              </Link>
            </div>
          </div>

          {/* COLUMN 2 — APP DESCRIPTION */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">
              DS Preclinical Therapeutics Explorer
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              A curated database of preclinical drug interventions tested in
              Down syndrome animal models. Built and maintained by the
              Sathyanesan Lab at the University of Dayton.
            </p>
            <p className="text-xs text-text-tertiary leading-relaxed">
              232 experiments · 38 compounds · 71 publications · 4 species
            </p>
          </div>

          {/* COLUMN 3 — QUICK LINKS */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
              Quick links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/treatments"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Treatments
                </Link>
              </li>
              <li>
                <Link
                  href="/experiments"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Experiments
                </Link>
              </li>
              <li>
                <Link
                  href="/compare"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Compare
                </Link>
              </li>
              <li>
                <Link
                  href="/ask"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Ask (coming soon)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM STRIP */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-text-tertiary">
          <p>© 2026 Sathyanesan Lab · University of Dayton</p>
          <p>
            Source data curated from peer-reviewed publications. See individual
            DOIs for citations.
          </p>
        </div>
      </div>
    </footer>
  );
}
