# SignPost — Project Memory

## What this project is
Multi-tenant sign installation SaaS (Prisma + PostgreSQL).

## Key files
- `prisma/schema.prisma` — full schema (all models defined here)
- `prisma.config.ts` — Prisma v7 CLI config (datasource URL, migrations path, seed command)
- `src/lib/prisma.ts` — Prisma singleton using `PrismaPg` driver adapter (Prisma v7 required)

## Prisma v7 breaking changes (critical)
- `url` is NO LONGER allowed in `datasource db {}` in schema.prisma
- `datasource db { provider = "postgresql" }` — no url field
- PrismaClient REQUIRES a driver adapter: `new PrismaClient({ adapter })` — no-args constructor THROWS
- Adapter: `import { PrismaPg } from "@prisma/adapter-pg"` + `new PrismaPg({ connectionString: process.env.DATABASE_URL! })`
- Seed command configured in `prisma.config.ts` under `migrations.seed`, NOT in package.json
- Both `src/lib/prisma.ts` and `prisma/seed.ts` use the adapter pattern

## App stack
- Next.js 15 App Router, React 19, TypeScript
- NextAuth v5 (beta.30) — two Credentials providers: "staff" (User) and "client" (ClientUser)
- Auth edge split: `src/lib/auth.config.ts` (edge-safe, no bcrypt) + `src/lib/auth.ts` (full, Node.js)
- Tailwind CSS v3, shadcn/ui CSS variable theme
- Zod v4 (not v3) — use `resolver: zodResolver(schema) as any` in react-hook-form
- `export const dynamic = "force-dynamic"` required on EVERY page.tsx and api/route.ts that imports Prisma (does NOT cascade from layouts)

## V1 address policy (critical — do not violate)
- Addresses are stored FLAT on `WorkOrder` (addressLine1/2, city, state, postalCode, country, locationNotes).
- There is NO `Property` or `Location` table.
- Addresses are NEVER deduplicated; two identical addresses → two independent WorkOrder rows.
- NO unique constraint on any address field or combination.
- Lifecycle tracking is by `WorkOrder.id` only.

## Models summary
- Organization (tenant root, has `slug @unique`; now has phone/contactEmail/address/outOfServiceAreaMessage fields)
- User (staff: Admin/Dispatcher/Technician — separate from client portal users)
- Membership (User ↔ Organization, roles: ADMIN/DISPATCHER/TECHNICIAN/CLIENT, @@unique([org, user, role]) — one row per role, user can have multiple roles)
- Client (customer account scoped to an Org)
- ClientUser (portal login scoped to a Client, separate auth from User)
- WorkOrder (address inline + serviceAreaId/serviceAreaFee optional FK to ServiceArea)
- WorkOrderItem (line items, sortOrder field)
- Assignment (User technician ↔ WorkOrder, @@unique([workOrderId, userId]))
- WorkLog (clock-in/out, signed startedAt/endedAt nullable)
- Photo (context enum: BEFORE/DURING/AFTER/ISSUE, uploaded by User)
- InventoryItemType (per-org catalog, sku @@unique([org, sku]) nullable)
- InventoryTransaction (signed quantity ledger, optional workOrderId)
- Invoice (optional workOrderId, denormalised totals, @@unique([org, invoiceNumber]))
- InvoiceLineItem (Decimal quantity for partial units, denormalised amount)
- Payment (multiple per invoice, PaymentMethod enum, reference field)
- ServiceArea (GeoJSON polygon zone per org; pricingAdjustment Decimal?)
- ServiceAreaTechnician (User ↔ ServiceArea join, @@unique([serviceAreaId, userId]))

## Membership unique key change (migration 20260227240000)
- Old: @@unique([organizationId, userId]) → one role per user per org
- New: @@unique([organizationId, userId, role]) → multiple roles allowed per user per org
- findUnique with organizationId_userId is now BROKEN — use findFirst instead
- Upsert where key is now: `organizationId_userId_role: { organizationId, userId, role }`

## Service Areas / Leaflet (settings page)
- Maps use react-leaflet + react-leaflet-draw (SSR disabled via dynamic import)
- `service-area-map.tsx` is the interactive Leaflet component (client, SSR disabled)
- `service-areas-section.tsx` wraps it with `dynamic(..., { ssr: false })`
- GeoJSON polygon stored as Json in DB; coordinates are [lng, lat] pairs (GeoJSON standard)
- PIP check: @turf/boolean-point-in-polygon + @turf/helpers; point([lng, lat])
- Geocoding: src/lib/geocode.ts via Nominatim (User-Agent: SignPost/1.0)
- Staff get override modal when address is out-of-zone; portal clients are blocked

## Design decisions
- `InventoryItemType.currentStock` is denormalised — app layer updates it on each InventoryTransaction insert.
- `InvoiceLineItem.amount` is denormalised (qty × unitPrice) — app recalculates on save.
- Invoice totals (subtotal/taxAmount/discountAmount/total) are denormalised — app recalculates on line item changes.
- Photos uploaded by staff (User) only in V1; client portal uploads deferred to V2.
- All monetary values use `Decimal @db.Decimal(10, 2)`; quantity in InvoiceLineItem uses `Decimal(10,3)`.

## Task panel system
- Tasks are clickable in both the Tasks page and order detail view — opens a `TaskPanel` dialog
- `src/components/staff/task-panels/` contains all 6 panel types + shared GPS/photo upload components
- `Task.completionData` (Json?) stores type-specific completion fields
- `Task.workOrderId` is nullable — supports unlinked anonymous removal requests
- `derivePaymentStatus` lives in `src/lib/utils.ts` (NOT tasks.ts — server action files require all exports to be async)
- Photo uploads go to `/api/upload/task-photo` → `public/uploads/tasks/`
