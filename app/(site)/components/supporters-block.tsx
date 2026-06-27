import Link from "next/link";
import Image from "next/image";

export function SupportersBlock() {
  return (
    <section className="max-w-7xl mx-auto px-4 mt-16 md:mt-20">
      <div className="clay-card rounded-3xl p-8 md:p-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-rescue-bg text-accent-rescue text-xs uppercase tracking-wider font-medium border border-accent-rescue/20">
          Supported by
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mt-6">
          <Link
            href="https://udayton.edu"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="University of Dayton"
            className="block transition-opacity opacity-90 hover:opacity-100"
          >
            <Image
              src="/logos/udayton.png"
              alt="University of Dayton"
              width={140}
              height={160}
              className="object-contain h-24 sm:h-28 w-auto"
              style={{ marginBottom: "-1.5rem" }}
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
              width={100}
              height={100}
              className="object-contain h-16 sm:h-20 w-auto"
              priority
            />
          </Link>
        </div>

        <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto mt-8 leading-relaxed">
          This resource is developed and is currently maintained by the{" "}
          <a
            href="https://sathyanesan-lab.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Sathyanesan Lab
          </a>{" "}
          at the University of Dayton, in support of the global
          Down syndrome research community led by the Trisomy 21 Research Society.
        </p>

        <div className="mt-6 sm:mt-7 max-w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-rescue-bg text-accent-rescue text-xs uppercase tracking-wider font-medium border border-accent-rescue/20">
            Cite this resource
          </div>
          <p className="text-text-secondary text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-3 px-2 text-center leading-relaxed">
            Madala, S., Sathyanesan, A., Johnson, L., Cadwell, M., Roper, R. J.,
            Tramutola, A., Maugham-Macan, M., Thyme, S., &amp; Wiseman, F. (2026).{" "}
            <em>madalas9/ds-preclinical-therapeutics-explorer: DS Preclinical
            Therapeutics Explorer v1.0.0</em> (v1.0.0). Zenodo.{" "}
            <a
              href="https://doi.org/10.5281/zenodo.20848332"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline underline-offset-2 hover:text-foreground break-all"
              style={{ overflowWrap: "anywhere" }}
            >
              https://doi.org/10.5281/zenodo.20848332
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
