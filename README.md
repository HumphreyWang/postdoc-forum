# AstroConnect 2026

English-language website for the **Beijing Joint Astrophysics Postdoc Forum**, 14–15 December 2026, hosted at KIAA, Peking University, and the Department of Astronomy, Tsinghua University.

This repository now contains the 2026 website. The local folder and existing GitHub repository retain the name `post-doc-forum-2025` to preserve the repository history.

## Website

- Conference overview, scientific scope, programme, venues and committee contacts.
- Approximately 20 research talks (15-minute presentation + 3-minute Q&A) and 25 posters with 1-minute flash talks.
- Attendance limited to 50 participants, no registration fee, lunch and first-day dinner provided.
- A combined registration and abstract form. Talk applicants indicate whether they would accept a poster instead.
- A maximum of 150 words for abstracts, optional discussion-topic preferences, and downloadable submission receipts.
- Campus-entry details: ID card or passport number; passport holders also provide nationality and an information-page photo.

The server saves submissions with status `received`. A receipt confirms receipt of the submission; organizers confirm participation and presentation arrangements separately. Automatic confirmation email is not configured.

## Requirements and local development

Use **Node.js 24 LTS** (`.nvmrc`) and npm. The dependency lockfile is committed.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000/en`. The root path redirects to English. Former Chinese links and the former abstract page redirect to the current pages.

For a production build:

```bash
npm run build
npm start
```

The registration endpoint requires a Node server and persistent private storage. See [DEPLOYMENT.md](DEPLOYMENT.md). A static HTML copy is suitable for viewing the site but cannot receive submissions.

## Editing content

- `messages/en.json`: interface copy.
- `src/lib/forum.ts`: meeting dates, deadline dates, programme estimates, attendance limit and upload limits.
- `src/lib/committees.ts`: names, affiliations and member emails. `soc` maps to Advisory Committee; `loc` maps to Organizing Committee. Empty email fields show “To be announced”.
- `src/lib/hero.ts`: cover-image selection and attribution. [ASSETS.md](ASSETS.md) records the image sources.

Talk/poster submissions close on **2026-12-01** and attend-only registration on **2026-12-07**, inclusive through 23:59:59.999 China Standard Time (UTC+8). Set `FORUM_FORMS_ENABLED=false` to close the form explicitly. The 50-person event limit is managed through organizer confirmation; a submitted form does not reserve a place automatically.

## Private records and passport materials

Configure `FORUM_DATA_DIR` as a private, persistent absolute directory on the server. If omitted, the application uses `data/` in its working directory. This directory is ignored by Git and is never served through a public route.

`POST /api/registrations` stores one atomic schema-3 record containing registration details, any abstract, discussion preferences and campus-entry materials. Retrying the same request with identical information returns the same receipt. There is no public records-listing API. The former `POST /api/abstracts` endpoint returns 410 and points to the combined form.

Document numbers, nationality and passport photos are encrypted with AES-256-GCM. The private key is generated as `.campus-identity-key` inside the data directory. Back up records **and this key together**; losing the key prevents recovery of identity materials. The key is stored on the same host, not in an external key-management service.

JPEG/PNG passport uploads are limited to 5 MiB. The server validates file type, signature and successful decoding, limits decoding to 40 megapixels, and re-encodes images as JPEG at up to 2400 pixels with EXIF removed. Sensitive identity details and images are excluded from browser drafts, API responses and downloaded receipts.

An organizer with filesystem access can export campus-entry materials:

```bash
FORUM_DATA_DIR=/srv/astroconnect-2026/private-data \
  node scripts/export-campus.mjs --output /private/export-location/campus-entries.json
```

The JSON includes decrypted document details. Photos are written to a sibling `campus-entries-passport-photos/` directory. Export files use owner-only permissions and do not overwrite existing output. Keep all exports private and outside public web folders or Git-tracked paths.

## Version-control exclusions

`.gitignore` excludes runtime records, identity keys, uploaded/exported passport materials, populated environment files, dependencies, generated builds, screenshots/test output, local backups and standalone HTML copies. Only `.env.example` is shared. Public JWST images and campus maps are intentional website assets and remain tracked.

Test source scripts and the npm lockfile are retained so changes remain verifiable. For checks that submit synthetic data, use a separate service and data directory:

```bash
npm run build
npm run typecheck
npm run test:deadlines
FORUM_DATA_DIR=/tmp/astroconnect-check npm start -- --port 3026
# In another terminal:
TEST_BASE_URL=http://localhost:3026 FORUM_DATA_DIR=/tmp/astroconnect-check npm run test:smoke
```

`scripts/browser-test.cjs` uses Playwright for form and responsive-layout checks. `PLAYWRIGHT_MODULE` and `CHROME_PATH` can reference an existing local installation. Generated results are ignored.

## Offline viewing copy

`scripts/export-preview.cjs` captures the public pages into one self-contained HTML file. It includes navigation and visual form interactions, but does not submit or save information. Generated HTML copies are excluded from Git. Regenerate after website changes with `npm run export:preview`, using Playwright and `PREVIEW_BASE_URL` for the running site.
