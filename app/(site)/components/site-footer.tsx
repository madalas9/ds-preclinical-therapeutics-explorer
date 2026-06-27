import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-8 md:gap-10 lg:gap-14 items-start">
          {/* COLUMN 1 — SUPPORTED BY */}
          <div>
            <p className="text-xs uppercase tracking-wider text-text-tertiary mb-4">
              Supported by
            </p>
            <div className="flex flex-wrap items-center gap-3 md:gap-6">
              <Link
                href="https://udayton.edu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="University of Dayton"
                className="block transition-opacity opacity-80 hover:opacity-100 dark:opacity-90 dark:hover:opacity-100"
              >
                <Image
                  src="/logos/udayton.png"
                  alt="University of Dayton"
                  width={96}
                  height={108}
                  className="object-contain h-14 md:h-20 lg:h-24 w-auto mb-[-0.75rem] md:mb-[-1rem]"
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
                  width={64}
                  height={64}
                  className="object-contain h-10 md:h-14 lg:h-16 w-auto"
                />
              </Link>
            </div>
          </div>

          {/* COLUMN 2 — APP DESCRIPTION */}
          <div className="max-w-md lg:max-w-lg">
            <h3 className="text-sm md:text-base lg:text-lg font-semibold text-text-primary mb-2 md:mb-3">
              DS Preclinical Therapeutics Explorer
            </h3>
            <p className="text-xs md:text-sm lg:text-base text-text-secondary leading-relaxed mb-2 md:mb-3">
              A curated database of preclinical drug interventions tested in
              Down syndrome animal models. Built and maintained by the
              Sathyanesan Lab at the University of Dayton.
            </p>
            <p className="text-xs md:text-sm lg:text-base text-text-tertiary leading-relaxed">
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
                  Ask AI
                </Link>
              </li>
              <li>
                <Link
                  href="/contribute"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Contribute Data
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM STRIP */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-text-tertiary">
          <p>© 2026 <a href="https://sathyanesan-lab.github.io" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary underline-offset-2 hover:underline transition-colors">Sathyanesan Lab</a> · University of Dayton</p>
          <div className="flex items-center gap-2">
            <a
              href="https://doi.org/10.5281/zenodo.20848332"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://zenodo.org/badge/DOI/10.5281/zenodo.20848332.svg"
                alt="DOI: 10.5281/zenodo.20848332"
                className="h-5"
              />
            </a>
            <a
              href="https://github.com/madalas9/ds-preclinical-therapeutics-explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white"
                alt="GitHub repository"
                className="h-5"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
