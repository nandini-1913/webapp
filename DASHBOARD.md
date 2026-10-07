# Dashboard Handoff Guide

## What This Project Is

This repository contains a Vite/React storefront, a FastAPI + MongoDB backend, and handoff notes for the separate admin workflow of a sanitary-ware and building-material business. The current browser app lives under `frontend/src`; it is not the React Native + Expo layout described in the older repository map below.

The system manages:

- Categories and subcategories
- Brands and products
- Product groups
- Warehouse racks and product locations
- Purchases and stock receipts
- Referral partners and KYC
- RFQs and quotation approval
- Dispatch and retail billing
- Inventory and stock reports
- Team users and role metadata
- Partner reward balances and ledger history

The product domain is sanitary ware, bathroom fittings, plumbing supplies, and building materials. Use realistic domain data such as toilets, wash basins, taps, mixers, CPVC pipes, fittings, cement, tiles, and construction supplies.

## Important Working Rule

The requester quotation/RFQ workflow must be preserved. Do not remove it when adding admin features.

The current RFQ flow is:

1. A requester or admin creates an RFQ.
2. The RFQ starts with status `pending`.
3. An admin reviews the products, quantities, discount, delivery mode, and schedule.
4. Admin approval calculates reward points server-side.
5. Rewards are written to the `reward_ledger` collection once per RFQ.
6. Approved RFQs can later become dispatches.

The reward design document is a blueprint for ledger-based rewards. It does not require removing RFQ. The current implementation uses RFQ approval as the reward-triggering business decision.

## Current Phase Status

- Phase 1: Category Management complete
- Phase 2: Subcategory Management complete
- Phase 3: Brand Management complete
- Phase 4: Product Management complete
- Phase 5: Product Groups complete
- Phase 6: Rack Locations complete
- Phase 7: Purchase Management complete
- Phase 8: Referral Partner KYC complete
- Phase 9: Referral Partner Management complete
- Phase 10: RFQ Management complete
- Phase 11: Dispatch Management complete
- Phase 12: Inventory Management complete
- Phase 13: Team Management metadata complete

Future work should be based on the specification files and the existing API contract. Do not assume a phase is complete merely because a screen exists; verify backend behavior and tests too.

## Legacy Admin Handoff Layout

The tree below documents the older Expo admin client and is not the current Vite storefront source.

```text
backend/
  server.py                         FastAPI app, MongoDB models, routes, logic
  requirements.txt                  Python dependencies
  tests/test_quotation_api.py       API regression tests

frontend/
  app/
    index.tsx                       Bootstrap route
    (admin)/
      dashboard.tsx                 Admin dashboard navigation
      categories.tsx                Category management
      subcategories.tsx             Subcategory management
      brands.tsx                    Brand management
      catalog.tsx                   Product management
      product-groups.tsx             Product group management
      racks.tsx                     Warehouse rack management
      purchases.tsx                  Purchase entry and history
      rfqs.tsx                      RFQ review and approval
      dispatches.tsx                 Dispatch and retail billing
      inventory.tsx                  Inventory reports
      partners.tsx                  Partner list, KYC, reward passbook
      team.tsx                      Team users and roles
      csv-import.tsx                Catalog CSV import
      money-config.tsx              Discount/GST configuration
    src/
      api/client.ts                 Fetch wrapper and bearer token handling
      api/endpoints.ts              Typed API functions and data types
      components/UI.tsx             Shared React Native components
      state/session.ts              Admin session persistence
      state/draft.ts                Quotation draft and totals calculation
      utils/csv.ts                  CSV parser and Excel binary blocking
      utils/storage/                 Storage abstraction
      theme.ts                      Design tokens

PART 1 WEB ADMIN PANEL.txt          Product requirements and phase list
Reward_System_Design_Spec.md        Reward ledger blueprint
README.md                           Original quotation-generator README
DASHBOARD.md                        This handoff guide
```

## Running Locally

Backend:

```bash
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

Frontend:

```bash
npm install
npm run dev
```

The Vite storefront uses `VITE_API_BASE_URL` as the backend origin. It defaults to `http://187.127.148.44`; override it in `frontend/.env.local` for another deployment. The FastAPI server must be reachable from the browser and allow the storefront's origin through CORS.

## API Conventions

All backend routes use the `/api` prefix.

Successful response:

```json
{"success": true, "data": {}, "error": null}
```

Failed response:

```json
{"success": false, "data": null, "error": "Reason"}
```

The Vite storefront's Pipes & Fitting catalog and product search calls are implemented in `frontend/src/services/catalog/pipesFittingRepository.ts`. The repository validates the standard response envelope and does not substitute mock products when the API fails. Browser location permission is requested by the storefront and coordinates are saved locally. The location is reverse-geocoded through OpenStreetMap Nominatim so the location screen and dashboard can show a readable address; this sends the selected coordinates to Nominatim, and the app retains coordinates as a fallback if address lookup is unavailable.

## MongoDB

Default connection:

```text
mongodb://127.0.0.1:27017
Database: quotation_db
```

The backend reads `MONGO_URL` and `DB_NAME` from `backend/.env` when present. MongoDB creates most collections lazily when the first document is inserted.

### Collections

Original collections:

- `users`: admin accounts, requester records, and team users
- `categories`: product categories and active/inactive state
- `catalog`: products and product metadata
- `money_config`: discount, GST, and quotation visibility configuration
- `admin_tokens`: opaque admin login tokens

Added business collections:

- `subcategories`: child categories linked by `categoryId`
- `brands`: brands with active/inactive state
- `product_groups`: groups with two or more product IDs
- `racks`: warehouse racks with generated slots
- `purchases`: purchase transactions and received stock
- `rfqs`: requester quotation requests and approval history
- `dispatches`: RFQ conversions and retail dispatches
- `partners`: referral partner profiles and KYC records
- `reward_ledger`: immutable-style earned/redeemed reward events

Demo data, when loaded, uses IDs beginning with `demo-` and can be removed by filtering on that prefix. Never delete unrelated user data while cleaning demo records.

## Product Data

A product may contain:

- `id`
- `productCode`: generated as `PRD-...`
- `qrCode`: currently contains the product code as the scan payload
- `name`
- `aliases`
- `multilingualNames`
- `category`
- `subcategoryId`
- `brandId` and denormalized `brand`
- `unit`
- `standardRate`
- `displaySequence`
- `reorderLevel`
- `regularDiscount`
- `productGroupIds`
- `stock`
- `lastPurchasePrice`
- `rackId`, `rackName`, and `rackSlot`
- `imageUrl` and `imageName`

Product images are currently stored as data URLs in `imageUrl`. This is convenient for the current prototype and makes the field usable by both web and mobile clients. For production, consider object storage and a URL field instead of storing large base64 values in MongoDB.

### Storefront Pipes & Fitting Workflow

1. The user opens Pipes & Fitting from the category browser.
2. On every entry, the screen reads `GET /api/categories`, identifies the Pipes & Fitting category (also accepting the current legacy names Pipes & Tubing and Plumbing Pipes & Fittings), then requests its `GET /api/catalog?category=...` records and `GET /api/subcategories`; responses are not cached.
3. Catalog rows are grouped for the existing type/subcategory/class browsing UI. Names, brand, backend product IDs, rates, units, discounts, and available size/class/type details come from the API response. Brand, size, and class filter options are derived from those fetched products.
4. Selecting a product group opens the configurator; the cart item keeps the backend product and category/subcategory IDs.
5. A request or response error is shown on the page. The screen never falls back to `pipes_fitting_mock_data.json`.

The JSON file beside the Pipes & Fitting screen now contains presentation configuration only (for example sidebar images and sort labels), not product or filter-option data.

### Current Location and Search

- On entering the home shell or the location screen, the browser requests a fresh high-accuracy geolocation fix. The user can deny permission; the dashboard shows that location is unavailable rather than a fabricated default address.
- Coordinates and fix accuracy are saved in browser local storage and displayed on the dashboard. Tapping/dragging the map changes the selected coordinates. The app does not send coordinates to an external reverse-geocoding provider.
- Browser geolocation requires a secure context (HTTPS, or localhost during development) and user permission.
- Header/home/category search opens the backend-powered product search. The home microphone invokes browser speech recognition; the QR/barcode control invokes camera scanning when `BarcodeDetector` is supported. Both run their recognized text/code through `GET /api/catalog?search=...`.

## Reward System

Reward points are not stored as a wallet balance. The balance is calculated from `reward_ledger`:

```text
balance = earned points - redeemed points
```

Current reward behavior:

- RFQ creation gives zero points.
- RFQ approval calculates points from the approved RFQ total.
- The current placeholder formula is `floor(grandTotal / 100)`.
- One earned ledger entry is keyed by `quotationId`.
- Repeated approval does not create a second ledger entry.
- Partner reward history is available through the partner rewards endpoint.
- Redemption, payout integrations, fraud detection, and push notifications are not implemented.

If the business changes the formula, change only the server-side calculation and tests. Do not add a stored balance field.

## Admin Permissions

Team users are stored in `users` with roles:

- `admin`: `all`
- `store_manager`: catalog read, purchase write, inventory read, RFQ approval, dispatch write
- `staff`: catalog read and inventory read

Permissions are currently stored as metadata and shown in the team screen. Full route-level authorization middleware is future hardening work and must be added carefully without breaking existing admin login.

## Key API Areas

Authentication:

- `POST /api/auth/admin/register`
- `POST /api/auth/admin/login`
- `POST /api/auth/requester/register`

Master data:

- `/api/categories`
- `/api/subcategories`
- `/api/brands`
- `/api/catalog`
- `/api/product-groups`

Warehouse and stock:

- `/api/racks`
- `/api/purchases`
- `/api/dispatches`
- `/api/inventory`
- `/api/inventory/low-stock`
- `/api/inventory/transactions`

Partners and rewards:

- `/api/partners/register`
- `/api/partners`
- `/api/partners/{id}/kyc`
- `/api/partners/{id}/rewards`
- `/api/rfqs`
- `/api/rfqs/{id}/approve`
- `/api/rfqs/{id}/history`

Team:

- `/api/team/users`

## Validation

Python syntax check:

```bash
/home/lenovo/Dashboard/backend/.venv/bin/python -m py_compile \
  /home/lenovo/Dashboard/backend/server.py \
  /home/lenovo/Dashboard/backend/tests/test_quotation_api.py
```

Backend tests:

```bash
cd /home/lenovo/Dashboard
/home/lenovo/Dashboard/backend/.venv/bin/python -m pytest backend/tests/test_quotation_api.py -q
```

Frontend diagnostics:

```bash
cd /home/lenovo/Dashboard/frontend
npx tsc --noEmit
```

The project environment has sometimes blocked Node commands through the VS Code Snap sandbox. If that happens, use the already-running frontend terminal or run the command from a normal local shell.

## Guidance For Future Agents

1. Read this file first, then read the relevant specification section.
2. Inspect the owning backend route and its frontend screen before editing.
3. Preserve existing data and old records; add compatibility defaults where needed.
4. Use `apply_patch` for source edits.
5. Add focused backend regression tests for new behavior.
6. Run diagnostics and a narrow executable validation after edits.
7. Keep sanitary/building-material terminology in demo data and UI examples.
8. Do not introduce reward redemption or a stored wallet balance without an explicit new requirement.
9. Do not remove the requester quotation/RFQ foundation.
10. Do not commit or reset the repository unless explicitly requested.
