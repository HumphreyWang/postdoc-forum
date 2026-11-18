# Deployment

Build with Node 24 and serve the Next.js application behind the existing HTTPS proxy.

```bash
npm ci
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

Registration now opens the organizer’s Tencent Docs form. Its owner manages access permissions, submission deadlines and responses in Tencent Docs. The website displays the same destination as a button and a locally hosted QR image. Verify both after deployment.

The website still honours `FORUM_FORMS_ENABLED=false` and the attend-only deadline for displaying the entry. To close submission itself, close the form in Tencent Docs.

Preserve the previous data volume, access permissions, backups and `.campus-identity-key` for historical registrations. The existing campus-export script works with records collected before the switch. Deploying this update does not transfer, delete or decrypt those records.
