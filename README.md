# Down Syndrome Preclinical Therapeutics Explorer

A curated, searchable database of preclinical drug interventions
tested in Down syndrome animal models. Built for the Sathyanesan Lab
at the University of Dayton, in support of the global Down syndrome
research community led by the Trisomy 21 Research Society (T21RS).

**Live app**: https://ds-preclinical-therapeutics-explore.vercel.app

## Database Snapshot

- **232 experimental conditions** across 38 compounds (DST01 to DST38)
- **71 peer-reviewed publications** with DOI citations
- **4 species**: Mouse, Rat, Fruit Fly, Zebrafish
- **Three measurement axes per experiment**: behavioral, cellular/molecular
  function, and gene/transcript/protein outcomes

## Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard with interactive sunburst (Species to Model to Class to Compound), species coverage, top compounds, outcome distribution |
| `/treatments` | Browse all 38 compounds with filters |
| `/treatments/[id]` | Single compound with full evidence trail |
| `/experiments` | All 232 rows with cascading multi-select filters and CSV export |
| `/compare?ids=DST29,DST16` | Side-by-side multi-compound comparison with downloadable charts |
| `/ask` | Natural-language Q&A (coming soon) |

## Tech Stack

- Next.js 16 (App Router) with TypeScript
- Tailwind CSS v4 with shadcn/ui components
- ECharts (sunburst chart)
- Recharts (most visualizations)
- TanStack Table (data grids)
- Light/dark theme support, mobile responsive

## Local Development

Requires Node.js 20+ and npm.

    git clone https://github.com/YOUR-USERNAME/ds-preclinical-therapeutics-explorer.git
    cd ds-preclinical-therapeutics-explorer
    npm install
    npm run dev

Then visit `http://localhost:3000`.

## Data Source

The canonical dataset lives in `data/interventions.cleaned.json`.

**To add or update interventions**:

1. Edit `data/interventions.cleaned.json`
2. Run `npm run dev` and verify the new entries appear
3. Push changes to `main` — the live site auto-redeploys via Vercel

## Deployment

Auto-deploys to Vercel on every push to `main`.

## Maintainers

- **Original author**: Sanjay Madala (madalas9@udayton.edu)
- **Principal Investigator**: Dr. Aaron Sathyanesan
  Assistant Professor, Department of Biology
  Joint Appointment in Department of Electrical and Computer Engineering
  University of Dayton
  Contact: asathyanesan1@udayton.edu

## Acknowledgments

- **University of Dayton** — institutional support
- **Trisomy 21 Research Society (T21RS)** — research community
- Data curated from peer-reviewed publications. See individual DOIs
  in each compound's detail page for proper citations.

## License

Research tool. Refer to individual publication DOIs for data citation
requirements.
