import Link from "next/link";
import Image from "next/image";

export function SupportersBlock() {
  return (
    <section className="max-w-7xl mx-auto px-4 mt-16 md:mt-20">
      <div className="clay-card rounded-3xl p-8 md:p-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-rescue-bg text-accent-rescue text-xs uppercase tracking-wider font-medium mb-6 border border-accent-rescue/20">
          Supported by
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
          Built in partnership with
        </h2>

        <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          This resource is developed by the Sathyanesan Lab at the University
          of Dayton, in support of the global Down syndrome research community
          led by the Trisomy 21 Research Society.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          <Link
            href="https://udayton.edu"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="University of Dayton"
            className="block transition-opacity opacity-90 hover:opacity-100"
          >
            <Image
              src="/logos/udayton.svg"
              alt="University of Dayton"
              width={280}
              height={84}
              className="object-contain"
              style={{ height: "clamp(64px, 8vw, 80px)", width: "auto" }}
              priority
            />
          </Link>

          <Link
            href="https://www.t21rs.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Trisomy 21 Research Society"
            className="block transition-opacity opacity-90 hover:opacity-100"
          >
            <Image
              src="/logos/t21rs.png"
              alt="Trisomy 21 Research Society"
              width={84}
              height={84}
              className="object-contain"
              style={{ height: "clamp(64px, 8vw, 80px)", width: "clamp(64px, 8vw, 80px)" }}
              priority
            />
          </Link>
        </div>

        <p className="text-xs text-text-tertiary mt-8 max-w-xl mx-auto leading-relaxed">
          Click either logo to visit the institution&apos;s website. Curated
          from peer-reviewed publications; outcomes preserved as reported by
          original authors.
        </p>
      </div>
    </section>
  );
}
