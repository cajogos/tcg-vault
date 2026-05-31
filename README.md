# TCG Vault Tracker

A modern Pokémon TCG collection tracker built to manage card inventory, valuations, tags, and eBay listing prep.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4, Lucide React (icons), shadcn/ui, Radix UI
- **Backend**: Express.js 5 (integrated as server middleware inside Vite)
- **Database**: SQLite (via `better-sqlite3`), Drizzle ORM
- **Testing**: Vitest, React Testing Library, jsdom, supertest
- **Package Manager**: `pnpm`

---

## 🛠️ Key Architectural Decisions

1. **Embedded SQLite API**: The database and API endpoints are handled under a `/api` prefix directly within the Vite dev server (`vite.config.ts`) using Vite's `configureServer` middleware hook. This simplifies local development by eliminating the need to manage and run separate client and server processes.
2. **Testable Route Factory**: Express handlers live in `src/backend/routes/inventory.ts` as a `createInventoryRouter(db)` factory so they can be mounted with a real disk DB (in `vite.config.ts`) or an in-memory SQLite instance (in tests) without any mocking.
3. **Synchronized Asset Inspection**: Utilizes a centralized React Context (`InspectorContext`) to handle real-time hover/selection synchronization between binder grid views or ledger lists and the right-side `InspectorPanel`, eliminating prop drilling.
4. **JSON Config Files**: UI dropdowns and DB schema types are both driven by the same JSON files in `src/config/`. Adding a new tag or storage location only requires editing a JSON file — no migration or code change needed.
5. **Sleek Aesthetic**: Built with a dark mode first design system (using custom slate/indigo gradients) and smooth CSS animations.

---

## 📦 Data Model

### `cards` columns

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `sdk_id` | TEXT | TCGdex card ID |
| `name` | TEXT | Card name |
| `supertype` | TEXT | e.g. Pokémon, Trainer |
| `subtypes` | TEXT (JSON) | Array of subtypes |
| `rarity` | TEXT | Card rarity |
| `set_number` | TEXT | Number within set |
| `set_name` | TEXT | Set name |
| `language` | TEXT | EN or JP |
| `image_url` | TEXT | TCGdex image URL |
| `set_symbol` | TEXT | Set symbol image URL |
| `artist` | TEXT | Card illustrator |

### `inventory_items` columns

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `card_id` | TEXT FK | References `cards.id` |
| `storage_type` | TEXT | `raw` or `graded` |
| `condition` | TEXT | Null for graded cards |
| `grading_company` | TEXT | PSA / BGS / CGC |
| `grade` | REAL | Null for raw cards |
| `cert_number` | TEXT | Grading cert number |
| `is_misprint` | INTEGER | Boolean flag |
| `notes` | TEXT | Free-form notes |
| `tags` | TEXT (JSON) | Array of tag IDs, e.g. `["sealed","miscentered"]` |
| `storage_location` | TEXT | Where the card physically is |
| `status` | TEXT | `vaulted`, `listed`, or `sold` |

**No acquisition price or date is stored.** The focus is current collection state for selling.

### `sales_ledger` columns

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `inventory_item_id` | TEXT FK | References `inventory_items.id` |
| `platform` | TEXT | e.g. eBay |
| `listing_url` | TEXT | URL to the listing |
| `listed_price_gbp` | REAL | Listed price |
| `date_listed` | TEXT | ISO date listed |
| `date_sold` | TEXT | ISO date sold |
| `final_sale_price_gbp` | REAL | Final sale price |
| `platform_fees_gbp` | REAL | Platform fees |
| `shipping_cost_gbp` | REAL | Shipping cost |

### Tags (`src/config/tags.json`)
Special attributes that affect a card's condition or value:
- `sealed` — factory-sealed (can apply to raw or graded items)
- `pokemon-center-stamp` — Pokémon Center exclusive stamp variant
- `miscentered` — visibly off-center print
- `1st-edition` — first edition print run
- `cosmos-holo` — cosmos/galaxy-foil background
- `reverse-holo` — reverse holofoil variant
- `stamped-promo` — card has a stamped promo mark
- `metal` — card is made of metal

### Storage Locations (`src/config/storageLocations.json`)
Physical locations for cards (edit this file to change locations):
- `office-wardrobe`, `zapdos-tin`, `jolteon-tin`

### Valuations
Price history is tracked separately in `valuation_history`. Items start with no valuation — add entries via the item detail page after adding a card.

---

## 📂 Project Structure

```
tcg-vault/
├── CLAUDE.md              # Build, test, and code guidelines for Claude Code agents
├── config.json            # Runtime config (TCGdex API key, etc.) — gitignored
├── index.html             # React application mount HTML
├── package.json           # Scripts, dependencies, and environment config
├── vite.config.ts         # Vite server configuration & API routing middleware
├── vitest.config.ts       # Vitest test runner (jsdom for frontend, node for backend)
├── components.json        # shadcn/ui component configuration
├── drizzle/               # Drizzle ORM migration SQL files and journal
├── assets/                # Static assets (e.g. pokemon-center-label.png)
├── data/
│   └── vault.db           # SQLite local database (generated on migration/load)
└── src/
    ├── config/            # JSON config files (tags, storageTypes, conditions, etc.)
    ├── backend/
    │   ├── schema.ts      # Drizzle database tables & relational definitions
    │   ├── lib/
    │   │   ├── config.ts      # JSON config file loader
    │   │   └── imageCache.ts  # Local card image cache management
    │   ├── routes/
    │   │   └── inventory.ts   # createInventoryRouter(db) — all /api/inventory handlers
    │   └── scripts/
    │       ├── cli-add.ts              # CLI quick-add card
    │       ├── db-load.ts              # Restore DB from dump
    │       ├── db-save.ts              # Backup DB to dump
    │       ├── backfill-set-symbols.ts # Populate missing set symbols via TCGdex
    │       ├── download-images.ts      # Sync card images to local cache
    │       └── seed.ts                 # Database seeder
    ├── frontend/
    │   ├── types.ts       # Shared TypeScript interfaces (InventoryItem, etc.)
    │   ├── App.tsx        # Main layout framework & routing
    │   ├── index.css      # Global styles and Tailwind directives
    │   ├── main.tsx       # React app entry point
    │   ├── components/
    │   │   ├── forms/
    │   │   │   └── InstanceForm.tsx      # Add card form (TCGdex search + instance config)
    │   │   ├── vault/
    │   │   │   ├── VaultGrid.tsx         # Binder-style card grid view
    │   │   │   ├── VaultTable.tsx        # Ledger table view
    │   │   │   ├── CardVisualOverlay.tsx # Card image with overlays (foil, sealed, graded)
    │   │   │   └── CollectionStats.tsx   # Summary stats bar
    │   │   ├── layout/
    │   │   │   ├── Layout.tsx            # App shell with sidebar + content area
    │   │   │   ├── Sidebar.tsx           # Navigation sidebar
    │   │   │   └── InspectorPanel.tsx    # Visual hover/inspection sidebar
    │   │   └── ui/                       # shadcn/ui primitives (badge, button, input, etc.)
    │   ├── pages/
    │   │   ├── DashboardPage.tsx    # Collection overview and stats
    │   │   ├── AddAssetPage.tsx     # Add new card workflow
    │   │   ├── LedgerPage.tsx       # Full inventory ledger view
    │   │   ├── ExportPage.tsx       # Export collection data
    │   │   └── ItemDetailsPage.tsx  # Full item detail, valuation history, sales record
    │   ├── context/
    │   │   ├── CollectionContext.tsx  # Global collection state (items, loading, refresh)
    │   │   └── InspectorContext.tsx   # Asset preview/inspection state provider
    │   └── lib/
    │       ├── cardImage.ts    # Card image URL resolution (local cache → TCGdex fallback)
    │       ├── cardmarket.ts   # Cardmarket search link generator
    │       ├── ebay.ts         # eBay UK sold comps link generator
    │       └── utils.ts        # Shared utilities (cn classname helper, etc.)
    └── test/
        ├── setup.ts               # jest-dom matchers + DOM cleanup
        ├── vitest-globals.d.ts    # Global type definitions for tests
        ├── helpers/
        │   └── renderWithRouter.tsx  # MemoryRouter wrapper for component tests
        ├── frontend/
        │   ├── Sidebar.test.tsx
        │   └── InspectorPanel.test.tsx
        └── backend/
            └── inventory.integration.test.ts  # In-memory SQLite API integration tests
```

---

## 💻 CLI Commands

### Development
```bash
pnpm dev          # Restore DB backup and start Vite dev server
pnpm build        # Production build
pnpm preview      # Preview production build
```

### Testing
```bash
pnpm test          # Single run (CI-safe)
pnpm test:watch    # Watch mode
pnpm test:coverage # Coverage report → coverage/index.html
```

### Database
```bash
pnpm db:save              # Backup DB to data/vault_dump.sql
pnpm db:load              # Restore DB from backup (replaces vault.db)
pnpm db:generate          # Generate migration from schema changes (requires TTY)
pnpm db:migrate           # Apply pending migrations
pnpm db:backfill-symbols  # Populate missing set symbols via TCGdex
pnpm images:sync          # Download card images from TCGdex to local cache
```

> **Note on migrations**: `drizzle-kit generate` requires an interactive TTY. When running from a non-TTY environment, write migration SQL manually following the recreate-table pattern in existing migrations and apply with `better-sqlite3` directly. See `CLAUDE.md` for details.

### CLI Card Add (quick insert without UI)
```bash
pnpm cli:add --cardId=<id> --type=<raw|graded> [--tags=sealed,miscentered] [--location=zapdos-tin] [--valuation=150.00]
```
