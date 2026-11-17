# Development setup

This repository contains AstroConnect 2026. Use Node.js 24 LTS (see `.nvmrc`) and npm.

- `npm ci`: install locked dependencies.
- `npm run dev`: start the development server.
- `npm run build`: build the production site and check TypeScript.
- `npm start`: serve the production build.
- `npm run typecheck`: check types independently.

Tailwind and its PostCSS plugin are pinned to 4.1.18; keep the lockfile when installing. The project uses Webpack for compatibility with the local development environment.

For deployment, storage, content editing and isolated verification commands, see README.md and DEPLOYMENT.md. Do not run synthetic-data checks against live registration storage.
