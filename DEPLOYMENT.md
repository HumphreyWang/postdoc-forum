# Deployment

Deploy AstroConnect 2026 as a Node.js service with private persistent storage. The application includes live registration and passport-upload handlers; it requires server execution.

## Build and run

Use Node.js 24 LTS and install the committed dependencies:

```bash
npm ci
npm run build
```

Configure the service environment:

```dotenv
FORUM_FORMS_ENABLED=true
FORUM_DATA_DIR=/srv/astroconnect-2026/private-data
FORUM_PUBLIC_ORIGIN=https://your-conference-domain.example
```

Use the actual public HTTPS origin, with no trailing slash. The service account must be able to create and write its private data directory. Keep the directory on persistent storage, outside any public document root. Back up the records and `.campus-identity-key` together and restrict access to the service account and authorized organizers.

Start the service under a process manager:

```bash
npm start -- --hostname 127.0.0.1 --port 3000
```

Configure an HTTPS reverse proxy. `nginx.conf` is a local HTTP example: replace its server name and configure TLS for the real domain. Preserve the public Host header and forwarded protocol. The proxy permits 6 MiB request bodies; the application separately enforces a 5 MiB image limit and bounded form metadata.

After deployment, verify the public registration URL and a controlled submission using the configured origin and private storage. Configure deployment-side request throttling appropriate to the server before broad public access.

## Submission handling

Successful submissions are stored with status `received`. Registration and any abstract, campus document details and passport photo are committed in one atomic record. Review records privately and communicate attendance/presentation decisions to participants. Automatic email delivery and a web-based admin interface are not configured.

The event capacity is 50 attendees; submission receipts are not automatic attendance confirmations. Final participant selection remains an organizer workflow.

Set `FORUM_FORMS_ENABLED=false` and restart to close registration. Change dates in `src/lib/forum.ts` and rebuild if deadlines change.

## Storage and maintenance

- Keep live records, keys, environment files and organizer exports out of Git and public directories. `.gitignore` covers the project's documented paths.
- Use `scripts/export-campus.mjs` only from an authorized local/server session. Its JSON and image outputs contain decrypted identity materials and must remain private.
- Keep the encryption key in the backup set. The application cannot recover identity materials without it.
- The file store targets a single service instance with persistent disk. A multi-instance or ephemeral deployment needs shared durable storage and appropriate key management.
- The local offline HTML viewing copy cannot receive registrations. The old static-build scripts stop with an explanation to prevent accidentally removing the server functionality.
