import Link from "next/link";
import { Search, BookOpen, PenLine } from "lucide-react";

const jokes = [
  {
    setup: "Why did the Ts65Dn mouse refuse to take the maze test?",
    punchline: "It heard the experiment had been trisomy-d and overruled.",
  },
  {
    setup: "What did the cerebellar Purkinje cell say to the DYRK1A kinase?",
    punchline:
      "'Stop phosphorylating me — you're making my dendrites overthink everything.'",
  },
  {
    setup:
      "How many neuroscientists does it take to characterize a Down syndrome mouse model?",
    punchline:
      "Just one — but they'll need 232 experiments, 38 compounds, 71 papers, and an AI that doesn't exist yet to be sure.",
  },
  {
    setup: "Why did the EGCG molecule break up with the Ts65Dn mouse?",
    punchline:
      "It said 'I just don't see a future where I rescue your cognition consistently.'",
  },
  {
    setup: "What's a hippocampus's favorite type of music?",
    punchline: "Long-term potentiation — they can never get enough of it.",
  },
  {
    setup: "Why did the granule cell precursor go to therapy?",
    punchline: "Unresolved mitotic issues from childhood.",
  },
  {
    setup: "What did the chromosome 21 say at the family reunion?",
    punchline: "'Sorry I'm late — there were three of us.'",
  },
  {
    setup: "Why don't researchers ever trust the Morris Water Maze?",
    punchline: "Because it's always full of drips.",
  },
  {
    setup: "What's a dendritic spine's love language?",
    punchline: "Quality synapse time.",
  },
  {
    setup: "How does a fruit fly model express Down syndrome phenotypes?",
    punchline: "Briefly, dramatically, and then it dies in a banana.",
  },
  {
    setup: "Why did the Rapamycin treatment fail in the new study?",
    punchline: "It got mTOR-pedoed.",
  },
  {
    setup:
      "What did the hippocampus say after a long day of encoding memories?",
    punchline: "'I need to consolidate.'",
  },
  {
    setup: "Why did the BDNF gene refuse to leave the lab?",
    punchline: "It had unfinished neurotrophin business.",
  },
  {
    setup: "What's the difference between a postdoc and a Ts65Dn mouse?",
    punchline:
      "One has a 1.5× over-expression of stress hormones. The other is the mouse.",
  },
  {
    setup: "Why did the Dyrk1a kinase get kicked off the committee?",
    punchline: "It kept overphosphorylating the agenda.",
  },
  {
    setup: "What do you call a mouse model that can't be reproduced?",
    punchline: "A startup.",
  },
  {
    setup: "Why was the cellular outcome rating 'NA'?",
    punchline: "Because nobody asked it how it felt.",
  },
  {
    setup: "Why did the SAG agonist apologize to the cerebellum?",
    punchline:
      "It said 'sorry for activating you so early — but someone had to do Sonic Hedgehog signaling.'",
  },
  {
    setup: "What's a neuroscientist's least favorite outcome?",
    punchline:
      "Differential rescue (dose-dependent) — because now they have to read the methods section.",
  },
  {
    setup: "Why did the GABAergic interneuron refuse to cooperate?",
    punchline: "It said 'I'm inhibited by default — leave me alone.'",
  },
  {
    setup:
      "How can you tell a basic researcher from a clinician at a Down syndrome conference?",
    punchline:
      "The clinician asks 'how does this help patients?' The researcher asks 'have you considered the Ts1Cje?'",
  },
  {
    setup: "What did the Polyphenon 60 say to the EGCG?",
    punchline:
      "'We're basically the same compound — but I bring 39 of my cousins.'",
  },
  {
    setup: "Why don't behavioral tests work on first try?",
    punchline:
      "Because the mice haven't been trained on the protocol either.",
  },
  {
    setup:
      "What did the trisomy 21 chromosome say when asked about its productivity?",
    punchline: "'I'm overexpressing.'",
  },
  {
    setup: "How do you know a Down syndrome research paper is from 2010?",
    punchline: "It cites EGCG with hope in its eyes.",
  },
];

export default function AskPage() {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-12">
      {/* HERO SECTION */}
      <section className="text-center">
        <div className="inline-flex items-center bg-accent-rescue-bg text-accent-rescue border border-accent-rescue/20 px-3 py-1 rounded-full text-xs uppercase tracking-wide font-medium mb-6 clay-shadow-sm">
          Coming soon
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          <span className="text-foreground">Ask the </span>
          <span className="text-accent-rescue">database</span>
        </h1>

        <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Soon you&apos;ll be able to ask natural-language questions about Down
          syndrome preclinical research and get answers grounded in our curated
          database of 232 experiments and 71 papers — with full citations.
        </p>
      </section>

      {/* JOKE CARD */}
      <section className="clay-card rounded-3xl text-center">
        <p className="text-text-tertiary text-sm italic mb-4">
          While we build it, here&apos;s a joke:
        </p>
        <p className="text-xl md:text-2xl text-text-primary mb-3">
          {joke.setup}
        </p>
        <p className="text-lg md:text-xl text-text-secondary italic pl-4 border-l-2 border-accent-rescue/30 text-left max-w-xl mx-auto">
          {joke.punchline}
        </p>
      </section>

      {/* WHAT'S COMING SECTION */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-center">
          What the AI will do
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="clay-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-accent-rescue-bg flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-accent-rescue" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Find relevant evidence
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Search across 232 curated experiments to find rows matching your
              question.
            </p>
          </div>

          <div className="clay-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-accent-rescue-bg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-accent-rescue" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Read the source papers
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Reference the full text of cited DOIs for mechanistic context.
            </p>
          </div>

          <div className="clay-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-accent-rescue-bg flex items-center justify-center mx-auto mb-4">
              <PenLine className="w-6 h-6 text-accent-rescue" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Cite every claim</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Every answer includes the DST## and DOI of the supporting
              evidence.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-3">
          <Link
            href="/treatments"
            className="inline-flex items-center justify-center bg-accent-rescue text-white px-6 py-3 rounded-2xl font-medium clay-shadow-sm hover:opacity-90 transition-opacity"
          >
            Browse Treatments
          </Link>
          <Link
            href="/experiments"
            className="inline-flex items-center justify-center border-2 border-accent-rescue text-accent-rescue px-6 py-3 rounded-2xl font-medium clay-shadow-sm hover:bg-accent-rescue-bg transition-colors"
          >
            Explore Experiments
          </Link>
        </div>
        <p className="text-sm text-text-tertiary italic mt-6">
          While we cook up the AI, the rest of the database is fully searchable.
        </p>
      </section>
    </main>
  );
}
