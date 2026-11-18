# AstroConnect 2026

English-language website for the **Beijing Joint Astrophysics Postdoc Forum**, 14–15 December 2026, hosted at KIAA, Peking University, and the Department of Astronomy, Tsinghua University.

This repository now contains the 2026 website. The local folder and existing GitHub repository retain the name `post-doc-forum-2025` to preserve the repository history.

## Website

- Conference overview, scientific scope, programme, venues and committee contacts.
- Approximately 20 research talks (12-minute presentation + 3-minute Q&A) and 25 posters with 1-minute flash talks.
- Attendance limited to 50 participants, no registration fee, lunch and first-day dinner provided.
- Open Registration to register or submit an abstract on Tencent Docs. The button and the supplied QR code lead to the same external form.
- The form owner manages new responses in Tencent Docs. Both former on-site submission endpoints return HTTP 410.

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

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Node deployment. The shareable HTML embeds the QR code and links to the online Tencent Docs form.

## Editing content

- `messages/en.json`: interface copy.
- `src/lib/forum.ts`: meeting dates, deadline dates, programme estimates, attendance limit and upload limits.
- `src/lib/committees.ts`: names, affiliations and member emails. `soc` maps to Advisory Committee; `loc` maps to Organizing Committee. Empty email fields show “To be announced”.
- `src/lib/hero.ts`: cover-image selection and attribution. [ASSETS.md](ASSETS.md) records the image sources.

Talk/poster submissions close on **2026-11-30** and attend-only registration on **2026-12-07**, inclusive through 23:59:59.999 China Standard Time (UTC+8). Set `FORUM_FORMS_ENABLED=false` to hide the website’s registration entry. Manage submission availability and deadlines in Tencent Docs as well. The 50-person event limit is managed through organizer confirmation; a submitted form does not reserve a place automatically.

## Records collected before the switch to Tencent Docs

Existing registrations remain in the original server data directory. Keep this directory and its hidden `.campus-identity-key` file together to retain access to encrypted campus-entry details. The switch does not migrate historical responses to Tencent Docs.

An organizer with filesystem access can export campus-entry materials:

```bash
FORUM_DATA_DIR=/srv/astroconnect-2026/private-data \
  node scripts/export-campus.mjs --output /private/export-location/campus-entries.json
```

The JSON includes decrypted document details. Photos are written to a sibling `campus-entries-passport-photos/` directory. Export files use owner-only permissions and do not overwrite existing output. Keep all exports private and outside public web folders or Git-tracked paths.

## Version-control exclusions

`.gitignore` excludes runtime records, identity keys, uploaded/exported passport materials, populated environment files, dependencies, generated builds, screenshots/test output, local backups and standalone HTML copies. Only `.env.example` is shared. Public JWST images and campus maps are intentional website assets and remain tracked.

Test source scripts and the npm lockfile are retained so changes remain verifiable. Run the site locally for the HTTP checks:

```bash
npm run build
npm run typecheck
npm run test:deadlines
npm start -- --port 3026
# In another terminal:
TEST_BASE_URL=http://localhost:3026 npm run test:smoke
```

`scripts/browser-test.cjs` uses Playwright for external registration and responsive-layout checks. `PLAYWRIGHT_MODULE` and `CHROME_PATH` can reference an existing local installation. Generated results are ignored.

## Offline viewing copy

`scripts/export-preview.cjs` captures the public pages into one self-contained HTML file. It includes navigation and the registration QR code. An internet connection is required to open Tencent Docs. Generated HTML copies are excluded from Git. Regenerate after website changes with `npm run export:preview`, using Playwright and `PREVIEW_BASE_URL` for the running site.
