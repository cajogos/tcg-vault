# CLAUDE.md

## Build & Development Commands
- **Install Dependencies**: `pnpm install`
- **Run Dev Server**: `pnpm dev` (restores SQLite DB and starts Vite dev server)
- **Production Build**: `pnpm build`
- **Preview Build**: `pnpm preview`

## Testing Commands (Vitest)
- **Run Tests**: `pnpm test` (single run, CI-safe)
- **Watch Mode**: `pnpm test:watch` (re-runs on file change)
- **Coverage Report**: `pnpm test:coverage` (generates `coverage/index.html`)
- **Test config**: `vitest.config.ts` (separate from Vite config — does not load Express/SQLite)
- **Test layout**: `src/test/` — `setup.ts`, `vitest-globals.d.ts`, `helpers/`, `frontend/`, `backend/`
- Frontend tests run in **jsdom**; backend tests in `src/test/backend/` run in **node** (auto via `environmentMatchGlobs`)

## Database Commands (SQLite & Drizzle)
- **Backup DB**: `pnpm db:save`
- **Restore DB**: `pnpm db:load`
- **Generate Migrations**: `pnpm db:generate` ⚠️ requires TTY — see note below
- **Apply Migrations**: `pnpm db:migrate`
- **Backfill Set Symbols**: `pnpm db:backfill-symbols` (populates missing set symbols via TCGdex)
- **Sync Card Images**: `pnpm images:sync` (downloads card images from TCGdex to local cache)

> **Migration note**: `drizzle-kit generate` and `drizzle-kit push` require an interactive TTY for column conflict resolution. When running from a non-TTY shell (e.g. Claude Code), write migration SQL manually following the recreate-table pattern used in existing migrations, add it to `drizzle/meta/_journal.json`, then apply it directly with `better-sqlite3` via a Node.js script. See `drizzle/0002_tags_storage_location.sql` for an example.

## Config Files
All configs are JSON files under `src/config/` — they drive both DB schema types and UI dropdowns:
- `conditions.json` — card condition grades (Mint, NM, EX, GD, LP, PL, PR)
- `gradingCompanies.json` — PSA, BGS, CGC
- `languages.json` — EN, JP
- `statuses.json` — vaulted, listed, sold
- `storageTypes.json` — raw, graded (sealed was removed; it is now a tag)
- `tags.json` — special card attributes affecting condition/value (sealed, pokemon-center-stamp, miscentered, 1st-edition, cosmos-holo, reverse-holo, stamped-promo, metal)
- `storageLocations.json` — physical storage locations (Office Wardrobe, Zapdos Tin, Jolteon Tin)

To add new tags or storage locations, edit those JSON files — no schema migration required.

## Coding Style & Architecture Guidelines
- **Project Structure**:
  - `vite.config.ts`: Configuration & Express API Router middleware under `/api/*`
  - `vitest.config.ts`: Vitest test runner config (jsdom default, node for backend tests)
  - `src/backend/`: Drizzle schemas (`schema.ts`), DB sync scripts (`scripts/`), Express routers (`routes/`), shared lib (`lib/`)
  - `src/backend/routes/inventory.ts`: `createInventoryRouter(db)` factory — all `/api/inventory` handlers
  - `src/backend/lib/config.ts`: Config loader for JSON config files
  - `src/backend/lib/imageCache.ts`: Local card image cache management
  - `src/frontend/`: React components, custom contexts, visual interfaces
  - `src/frontend/types.ts`: Shared TypeScript interfaces — never duplicate across component files
  - `src/frontend/context/CollectionContext.tsx`: Global collection state (items, loading, refresh)
  - `src/frontend/lib/cardImage.ts`: Card image URL resolution (local cache → TCGdex fallback)
  - `src/frontend/lib/cardmarket.ts`: Cardmarket search link generator
  - `src/frontend/lib/ebay.ts`: eBay UK sold comps link generator
  - `src/test/`: Test infrastructure — setup, helpers, frontend and backend test suites
- **Imports**: Use explicit relative paths (e.g., `import ... from '../../context/InspectorContext'`).
- **Database**:
  - Access the SQLite database via `better-sqlite3` and `drizzle-orm`.
  - Use Drizzle relational query APIs (e.g. `db.query.inventoryItems.findMany({ with: { ... } })`) where applicable.
  - `tags` column is stored as JSON text (`text('tags', { mode: 'json' }).$type<string[]>()`) — Drizzle handles serialization automatically.
- **Frontend & Styling**:
  - Build UI using React with TypeScript.
  - Implement sleek, highly aesthetic premium dark mode styling (using `slate`/`zinc` colors) with Tailwind CSS.
  - Add micro-animations (e.g. transitions, fades) to enhance interactive elements.
  - Use Lucide React for consistent icons.
- **Backend API**:
  - Express routers inside the Vite middleware handle all HTTP endpoints under the `/api` prefix.
  - Standardize error responses to return JSON in the format `{ error: string }`.

## TypeScript & Code Style
- **Brace style**: Allman — opening `{` always on its own line for function bodies, arrow function bodies, control flow (`if`/`else`/`try`/`catch`/`switch`/`for`/`while`), and interface/type declarations. JSX inline expressions `{{ }}` and single-expression arrow functions (`=> value`) are unaffected.
- **Semicolons**: Always required.
- **Shared types**: All shared frontend TypeScript interfaces live in `src/frontend/types.ts`. Import from there; never redefine in component files.
- **Third-party SDK types**: Import type definitions from the SDK package instead of using `any` or writing local mirrors (e.g. `import type { Card, CardResume } from '@tcgdex/sdk'`).
- **No `as any` casts**: Use proper union type casts (e.g. `e.target.value as 'vaulted' | 'listed' | 'sold'`).

## Active Plans

- **SQLite → PostgreSQL migration**: `~/Desktop/DB_MIGRATION_PLAN.md` — full phase-by-phase plan including schema changes, dependency swap, data migration script, and Jenkins pipeline setup. Not committed to the repo.

## Key Data Model Notes
- `InventoryItem` has no `purchasePrice` or `acquiredDate` — acquisition tracking was removed.
- `storageType` is `'raw' | 'graded'` only. The `'sealed'` value no longer exists.
- "Sealed" state is expressed via `tags: ['sealed']` — this allows raw+sealed and graded+sealed combinations.
- `tags` is a `string[]` on `InventoryItem`; always check against `tags.json` for valid IDs.
- `storageLocation` is nullable — items may have no assigned location.
- Initial valuation is `null` by default. Use `POST /api/inventory/:id/valuations` to add price history after adding a card.
- `CardMetadata` (mapped from the `cards` table) includes `setSymbol` and `artist` fields added in migration `0003_set_symbol.sql`.
- `SalesRecord` (mapped from `salesLedger` table) tracks platform, listing URL, listed price, sale price, fees, shipping, and dates. Retrieved as `salesRecord?` on `InventoryItem`.
