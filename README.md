# InvoiceMaster

Self-hosted invoicing application built for ZimaOS.

## Features
- Client Management (CRM)
- Quote Generation & PDF Export
- Invoice Generation & PDF Export
- Dashboard Overview
- Dark Mode Support

## Deployment on ZimaOS

1. **Build the Image** (if not using a pre-built registry):
   You can build the image locally on your ZimaOS device if you have terminal access.
   ```bash
   docker build -t invoicemaster:latest .
   ```

2. **Install via Docker Compose**:
   - Go to ZimaOS Dashboard.
   - Open the App Store or Custom App install.
   - Import the `docker-compose.yml` file content.
   - Ensure the volume mapping for `/app/prisma/dev.db` points to a persistent location on your ZimaOS drive (e.g., `/DATA/AppData/invoicemaster/dev.db`).

   **Note on Database**:
   The app expects `dev.db` to exist. On the first run, if the database file is missing in the volume, the app might crash if it expects it.
   Ideally, place an empty `dev.db` or let the app generate it.
   Since the Dockerfile copies the local `prisma` folder (which might contain your local `dev.db` if you ran `prisma migrate`), it will start with that.
   For persistent storage, map a volume.

## Development

```bash
npm install
npx prisma migrate dev
npm run dev
```
