# Participatory AI Atlas

Map-first atlas for vetted participatory AI records.

The site is built from one source dataset:

- `data/raw/participatory_ai_atlas_expanded_2026-03-23.csv`

## What the repo does

- renders the atlas and record pages from the vetted CSV
- rebuilds generated JSON, GeoJSON, schema, and release metadata from that CSV
- accepts public submissions through forms
- sends every form submission into GitHub review
- opens a draft pull request for new project submissions so review happens in the dataset itself

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 3

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The derived atlas files are rebuilt on `postinstall`. To rebuild them manually:

```bash
npm run build:data
```

## Environment variables

Create a local `.env.local` from `.env.example`.

Required for site metadata:

- `NEXT_PUBLIC_SITE_URL`

Required for GitHub-backed moderation:

- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`

Optional moderation settings:

- `GITHUB_BASE_BRANCH`
- `GITHUB_ATLAS_DATASET_PATH`
- `GITHUB_INCLUDE_CONTRIBUTOR_EMAILS`
- `GITHUB_INCLUDE_SENSITIVE_REDACTIONS`

### GitHub token scopes

Use a fine-grained token that can:

- create issues
- write repository contents
- create pull requests

If the moderation repo is public, keep `GITHUB_INCLUDE_SENSITIVE_REDACTIONS=false`.

## Submission workflow

### New project submission

When someone submits a new project:

1. the API validates the form data
2. a GitHub issue is created for review
3. a draft pull request is opened against the atlas CSV
4. the PR adds one draft row to `data/raw/participatory_ai_atlas_expanded_2026-03-23.csv`
5. after review and merge, the site rebuild includes the new record

The inserted row is intentionally marked as under review rather than pretending it is already fully vetted.

### Other forms

These forms create GitHub issues:

- project corrections and disputes
- annotations
- restricted disclosure requests
- schema feedback

They do not auto-publish to the site.

## Vercel deployment

This repo is ready for Vercel as a standard Next.js app.

1. Import the repository into Vercel.
2. Set the environment variables from `.env.example`.
3. Keep the default install command so `postinstall` can rebuild derived data.
4. Deploy.

No writable server filesystem is required for form intake. Moderation state lives in GitHub.

## Project structure

```text
app/                  Next.js routes and API handlers
components/           Atlas UI, forms, layout, and project views
data/raw/             Vetted source CSV
data/generated/       Derived JSON and GeoJSON used by the app
data/releases/        Release snapshots generated from the source CSV
data/runtime/         Checked-in public moderation data read by the site
lib/                  Data loading, filtering, validation, and GitHub moderation helpers
public/downloads/     Downloadable release assets
scripts/build-data.mjs
```

## Build check

```bash
npm run build
```

## License

### Code

MIT. See `LICENSE`.

### Data

See `DATA-LICENSE.md`.
