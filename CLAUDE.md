# AstroConnect 2026 project notes

This repository is the maintained 2026 website, despite its historical post-doc-forum-2025 folder/remote name. Read README.md before editing.

- Use English interface text and preserve the user-provided committee details.
- The combined Node registration endpoint persists received submissions; standalone abstract links redirect to registration.
- Keep private records, keys, populated environment files, identity exports and generated artifacts out of Git.
- Never claim an email was sent, attendance confirmed or an abstract accepted merely because a record was received.
- Preserve campus-data encryption, conditional passport requirements, photo validation and the 150-word abstract limit.
- Keep identity materials out of browser drafts, receipts, logs and public routes.
- Meeting/deadline configuration is in src/lib/forum.ts. Member names, affiliations and emails are in src/lib/committees.ts.
- Image sources/credits are documented in ASSETS.md. Do not enable static export while submission APIs are present.
