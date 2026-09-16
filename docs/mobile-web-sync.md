# Mobile and web synchronization

Customer service has full application authorization, including administrator routes, user management, finance, batches, and organisation settings. Existing accounts retain their customer-service role; no role reassignment or user data migration is necessary. Public registration only permits ordinary user accounts. Staff onboarding uses invitations.

Implemented shared workflows:

- Package type, description, weight, price, fragile/insurance flags, receiver details and reference numbers persist on jobs. Package totals are calculated by the server.
- Job creation, editing, drafts, status updates, proof uploads, assignment, payment recording, status reverts and deletion.
- Customer creation, editing and deletion.
- Team member editing, role/location changes, activation, password reset and deletion.
- Batch listing, creation, details and status updates.
- Invoice detail, draft editing, sending, payment confirmation and cancellation.
- Organisation settings backed by the same API on both platforms.
- Finance dashboard, report overview, tracking navigation, and corrected legacy role/status handling.

Mobile refreshes the main lists/dashboard on focus, app foregrounding, and every 60 seconds while active. This is polling, not instant push synchronization. Both clients must target the same backend. Mobile production defaults to https://bestdealshippingapp.com/api; override at build time with EXPO_PUBLIC_API_URL (include /api).

## Rollout

The API now requires additional job columns. Apply the additive SQL before starting the new backend, then generate the Prisma client:

```sh
cd backend
npx prisma db execute --file prisma/mobile-web-sync.sql --schema prisma/schema.prisma
npx prisma generate
```

The SQL adds nullable package/receiver/reference/freight fields and a zero-default paid amount. It does not delete or rewrite existing records. Old package breakdowns cannot be recovered if they were previously stored only as descriptions/totals.

Deploy the backend, rebuild/deploy the web client, then distribute the updated mobile build. No production database changes, deployment, app store upload, or user notifications were performed by this change.

## Validation

```sh
node --test backend/tests/mobile-web-sync.test.js
cd frontend && npm run build
cd mobile && npx expo export --platform all
```

Prisma schema validation and client generation passed. Regression tests cover permissions and denials, public registration, package totals, payment bounds, status normalization, and history-backed reverts. Web and Android/iOS JavaScript bundle exports passed; the web build reports existing lint warnings. Native device, live database, SMTP and cross-device acceptance checks remain to be performed against a migrated staging backend.

Password recovery opens a support email request; there is no automated reset-email endpoint in this project. Invoice payments and job payment receipts remain distinct records, as in the existing client workflows; finance summaries derive from paid invoices. Custom generated reports and customer satisfaction analytics have no backend implementation in the web app and are not supplied by this change.
