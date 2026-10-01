# Delta Trophies

Production catalogue and lead-management platform for Delta Industries. Public catalogue reads use a versioned CDN snapshot, while authenticated administration and enquiries use the MongoDB API built with TypeScript, Express, Mongoose and Node.js.

## Architecture

```text
backend/
├── scripts/       # Explicit admin and catalogue provisioning jobs
├── src/
│   ├── config/    # Typed environment, database, logging and Cloudinary
│   ├── controllers/
│   ├── middleware/# Authentication, rate limits, validation, errors, uploads
│   ├── models/    # Mongoose schemas and indexes
│   ├── routes/    # Versioned HTTP endpoints
│   ├── services/  # Business logic and integrations
│   ├── validation/# Zod request contracts
│   ├── app.ts     # Express application composition
│   └── server.ts  # Runtime lifecycle and graceful shutdown
└── test/          # Vitest and Supertest checks
frontend/          # Existing React/Vite presentation layer
```

### Public catalogue delivery

`frontend/public/catalogue.json` is a deployment-safe snapshot of all active products and categories. The browser renders this snapshot immediately, then refreshes it in the background from the Cloudinary raw asset at `deltatrophies/catalog/catalogue.json`. Product images continue to load directly from Cloudinary.

Successful product and category mutations automatically republish the Cloudinary snapshot. A failed publication does not roll back or duplicate the database mutation; the admin response shows a warning and the Dashboard's **Publish catalogue** action can retry it. Server-rendered product metadata and the sitemap use the same snapshot with the bundled file as their fallback, so public catalogue pages do not wait for a sleeping Render service.

Refresh the committed fallback after catalogue maintenance with:

```text
npm run catalog:export --prefix backend
```

To refresh both the fallback file and Cloudinary asset, run `npm run catalog:publish --prefix backend`.

## Local development

Requirements: Node.js 22.12+ and access to MongoDB Atlas (or a local MongoDB instance).

1. Copy `backend/.env.example` to `backend/.env` and provide environment-specific secrets.
2. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` to the API origin.
3. Install reproducibly with `npm run install:all`.
4. Seed catalogue categories with `npm run catalog:seed --prefix backend`.
5. Import already-hosted catalogue media with `npm run catalog:import --prefix backend`.
6. Set temporary `ADMIN_USERNAME` and `ADMIN_PASSWORD` variables, then run `npm run admin:create --prefix backend`.
7. Start the API with `npm run dev --prefix backend` and the UI with `npm run dev --prefix frontend`.

The API defaults to port 5000. Its public contract is under `/api/v1`; liveness and readiness probes are `/api/v1/health/live` and `/api/v1/health/ready`.

## Quality and production

Run `npm run check` at the repository root before release. It performs backend type-checking, linting, formatting verification, tests and builds, followed by frontend linting and a production build.

For production, use a unique 32+ character JWT secret, exact frontend origins, TLS-enabled MongoDB Atlas, Cloudinary credentials, and a secret manager supplied by the hosting platform. Build and run the API directly with `npm run build --prefix backend` and `npm start --prefix backend`.

For the Vercel frontend, set `VITE_API_URL` to the public HTTPS backend origin (no `/api/v1` suffix). It is used by admin, lead and enquiry actions; public catalogue reads do not depend on it. `VITE_CATALOGUE_URL` is optional and defaults to Delta Industries' Cloudinary catalogue asset. Set backend `APP_ORIGINS` to the exact production frontend origin, `https://www.deltatrophies.com` (plus any explicitly supported preview origins). The canonical host is `www.deltatrophies.com`; the apex domain should continue redirecting there.

After deployment, confirm that a product URL returns its current product name in `<title>`, an old product slug redirects to the current slug, and `/sitemap.xml` includes all active products and categories. Run `npm run seo:audit --prefix backend` against the production catalogue before release; it must report zero errors and warnings.

Run `npm run db:indexes --prefix backend` as an explicit release step whenever a model index changes; production runtime intentionally does not build indexes during startup.

Never commit `.env` files or deploy credentials pasted into chat/history. Rotate any exposed database password before launch.
