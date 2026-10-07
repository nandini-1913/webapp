# Backend and database inventory (read-only)

**Baseline snapshot:** 2026-10-04 (sections 1–8 below)  
**Changelog:** 2026-10-06 (read this first before migration or mobile integration)  
**Migration pointer:** `migration/STATUS.md`  
**Expo UI delta:** [docs/migration/INVENTORY.md](migration/INVENTORY.md) → **Migration delta (2026-10-06)**

**Baseline facts (still mostly true):** `backend_refactor/` only; **76** JSON `/api` routes and **18** collections in the body below; no multi-document transactions.  
**After 2026-10-06:** add **4** service-request routes and **1** collection → **~80 routes**, **19 collections** (full RTE/COL tables below not renumbered).

**Scope:** FastAPI `backend_refactor/server.py`, routers, services, `utils.py`.  
**Tests:** `tests/test_service_requests_api.py`, `tests/test_admin_login_team.py` (and legacy `backend/tests/` if present).

Production: VPS runs `backend_refactor` (`migration/bug_fix/README.md`).  
Every JSON route returns `{ success, data, error }`.

---

## Changelog since 2026-10-04

| Date | Area | What changed | Files / routes |
|------|------|--------------|----------------|
| 2026-10-06 | **COL-19** `service_requests` | Plumber/electrician requests: `serviceType`, customer fields, `status`, `recommendedName/Phone`, `adminNote`, `history[]` | `services/service_requests_service.py`, `routers/service_requests.py`, indexes in `utils.py` |
| 2026-10-06 | **RTE (new)** | `POST /service-requests` (public/mobile), `GET /service-requests`, `GET /service-requests/{id}`, `PATCH /service-requests/{id}`, `GET /service-requests/{id}/history` | Contract: `docs/SERVICE-REQUESTS-API.md` |
| 2026-10-06 | **Auth** | `POST /auth/admin/login` accepts `admin`, `store_manager`, `staff` in `users`; inactive users → 401 | `services/auth_service.py` |
| 2026-10-06 | **Racks** | `PUT /racks/{id}/assign` — safer product resolution / slot update (FIX-01) | `services/product_groups_racks_service.py` |
| 2026-10-05–06 | **Expo only** | No new catalog/RFQ/purchase *routes*; UI and exports on admin app | See INVENTORY migration delta |

**Not changed (by policy):** master/prices/stock import semantics (FIX-03/04/11 deferred). Partner mobile auth paths unchanged.

**Agent rule:** Do not re-scan all 76+ RTE rows unless debugging. For new work, append to this changelog and add COL/RTE rows in section 1/5 when you have time.

---

## 1. MongoDB collections (baseline 2026-10-04)

Names come from `db.<name>` in `backend_refactor/utils.py` and `backend_refactor/services/*.py`. `db.command` is the Mongo ping, not a collection. **Eighteen** collections are documented below; add **COL-19 `service_requests`** per changelog above.

Local counts are `estimated_document_count()` on database `quotation_db` at `mongodb://127.0.0.1:27017` on 2026-10-04 (no `.env` file in the repo; the code default is this URI and this database name). A second local database, `quotation_db_refactor`, has the same 18 names and 0 documents in each. Hosted Render counts: unknown.

| ID | Collection | Document fields written by the code | Local count | References |
|---|---|---|---|---|
| COL-01 | `users` | Requester (`POST /auth/requester/register`): `id` str, `role` str `"requester"`, `name` str, `phone` str, `address` str, `createdAt` str. Admin register: `id`, `role` `"admin"`, `companyName`, `gstin`, `contactNumber`, `passcodeHash`, `createdAt`. Team create adds `name`, `contactNumber`, `role` (`admin` / `store_manager` / `staff`), `permissions` list[str], `isActive` bool, `passcodeHash`, `createdAt`, `updatedAt`. | 3 (1 admin, 2 requester) | `id` is stored on COL-02 `adminId` and COL-07 `adminId` |
| COL-02 | `admin_tokens` | `token` str, `adminId` str, `createdAt` str | 4 | `adminId` → COL-01 `id`. Tokens are inserted on login and never read back anywhere except not at all for admin (partner tokens are read on RTE-06) |
| COL-03 | `partners` | From `PartnerIn` plus server fields: `id`, `name`, `phone`, `address`, `businessName`, `pincode`, `city`, `area`, `salesManager`, `documents` list[str], `kycStatus` str, `locationVerified` bool, `appActive` bool, `kycHistory` list of `{status, reviewedBy, reviewedAt, locationVerified, rejectionReason?}`, `rewardPoints` null on create, `createdAt`, `updatedAt`. Mobile register also sets `passcodeHash`, `registeredVia` `"mobile_app"`, `loginCount` int. Login sets `lastAppLoginAt` and increments `loginCount`. KYC review sets `approvedAt`, `approvedBy`, `reviewedAt`, `reviewedBy`, `rejectionReason` | 1 | `id` is stored on COL-04 `partnerId`, COL-14 `partnerId`, COL-16 `requesterId`. `GET /partners/{id}` also queries COL-13 `partnerId`; `POST /purchases` does not set that field |
| COL-04 | `partner_tokens` | `token` str, `partnerId` str, `createdAt` str | 0 | `partnerId` → COL-03 `id`. Read by `GET /auth/partner/me` |
| COL-05 | `categories` | `id`, `name`, `isDefault` bool, `isActive` bool, `productCount` int (0 on create; list recounts), `imageUrl` str or null. Product create that auto-inserts a category omits `productCount` and sometimes `isActive` | 3 | `id` → COL-06 `categoryId`. `name` is copied onto COL-06 `category` and COL-08 `category` (string match, not the id) |
| COL-06 | `subcategories` | `id`, `name`, `categoryId` str, `category` str, `createdAt`, `updatedAt` | 2 | `categoryId` → COL-05 `id`. `id` → COL-08 `subcategoryId`. `name` is also matched to COL-08 `subcategory` and, in subcategory product counts, to COL-08 `type` |
| COL-07 | `money_config` | `id`, `adminId`, `discountPercent` number, `gstPercent` number, `specialDiscountPercent` number, `showDiscount` bool, `showGst` bool, `showSpecialDiscount` bool. Admin register seeds `gstPercent` 18 | 3 | `adminId` → COL-01 `id`. Unique index `money_config_adminId_uq` |
| COL-08 | `catalog` | Create body (`CatalogItemIn`) persisted as: `id`, `name`, `productName`, `category`, `unit`, `standardRate` float, `mrp`, `sellingPrice`, `purchasePrice`, `discount`, `stock` float, `brandId`, `brand`, `productCode`, `qrCode` (copy of `productCode`), `type`, `productClass`, `productGroup`, `productGroupIds` list[str], `subcategory`, `subcategoryId`, `size`, `sizeMm`, `sizeCm`, `sizeInch`, `length`, `aliases` list[str], `multilingualNames` object[str, str], `displaySequence` int, `reorderLevel` float, `regularDiscount` float, `imageUrl`, `imageName`, `stdPkg`, `isActive` bool, `createdAt`, `updatedAt`. Master import also writes `hsnCode`, `gstRate`, `mrpPkg`. Purchase writes `lastPurchasePrice`, `lastPurchaseDiscount`, `rackId`, `rackName`, `rackSlot`. Local 48 documents include the master-import fields. None of those 48 have `rackId`, `aliases` populated, or `lastPurchasePrice` | 48 | `brandId` → COL-09 `id`. `subcategoryId` → COL-06 `id`. `category` string → COL-05 `name`. `type` string → COL-10 `name`. `productGroupIds` → COL-11 `id`. `productCode` → COL-17 and COL-18. `id` is stored on COL-11 `productIds`, COL-12 `slots.productId`, and inside line arrays on COL-13, COL-14, COL-15 |
| COL-09 | `brands` | `id`, `name`, `isActive` bool, `productCount` int, `logoUrl`, `createdAt`, `updatedAt`. Auto-create from a product or import can omit `logoUrl` / `productCount` | 4 | `id` → COL-08 `brandId`. Rename copies `name` onto COL-08 `brand` |
| COL-10 | `product_types` | `id`, `name`, `isActive` bool, `imageUrl`, `productCount` int on the HTTP create path, `createdAt`, `updatedAt`. `ensure_product_type` inserts without `productCount` | 2 | No `typeId` on products. COL-08 `type` matches `name` |
| COL-11 | `product_groups` | `id`, `name`, `productIds` list[str], `createdAt`, `updatedAt`. Import also sets `productCount` int | 0 | `productIds` → COL-08 `id` (many). COL-08 `productGroupIds` stores this `id` (many). COL-08 `productGroup` is the name string |
| COL-12 | `racks` | `id`, `name`, `rows` int, `columns` int, `slots` list of `{code` str, `productId` str or null`}`, `createdAt` | 2 | `slots.productId` → COL-08 `id`. COL-08 `rackId` stores this `id`. Purchase lines store `rackId` + `rackSlot` inside COL-13 |
| COL-13 | `purchases` | `id`, `lines` list of purchase fields plus `productId`, `productName` (`productCode`, `quantity`, `listPrice`, `purchaseDiscount`, `rackId`, `rackSlot`), `createdAt`. No `partnerId` on the insert | 1 | Line `productId` → COL-08 `id`. Line `productCode` → COL-08 `productCode`. Line `rackId` → COL-12 `id` when sent |
| COL-14 | `rfqs` | `id`, `partnerId`, `lines` list of `{productId, productCode, productName, quantity, unitPrice}`, `status` str (`pending`, then `approved` / `rejected` / `dispatched`), `grandTotal` number, `specialDiscountPercent` number, `rewardPoints` int, `deliveryMode` str, `scheduledAt` str or null, `createdAt`, `updatedAt`, `history` list of `{action, actor, details` object, `at}` | 1 | `partnerId` → COL-03 `id`. Line `productId` → COL-08 `id`. `id` → COL-15 `sourceRfqId` and COL-16 `quotationId` |
| COL-15 | `dispatches` | `id`, `sourceRfqId` str or null, `customerName`, `customerPhone`, `lines` list of `{productId, productCode, productName, quantity, unitPrice}`, `createdAt` | 1 | `sourceRfqId` → COL-14 `id`. Line `productId` → COL-08 `id` |
| COL-16 | `reward_ledger` | `id`, `requesterId` str (the RFQ `partnerId`), `quotationId` str (RFQ `id`), `points` int, `type` str (`earned` is the only write; `redeemed` is summed in `reward_balance` and never inserted here), `createdAt` | 1 | `requesterId` → COL-03 `id`. `quotationId` → COL-14 `id` |
| COL-17 | `pricing` | Upsert by `productCode`: `productCode`, `mrp`, `sellingPrice`, `purchasePrice`, `discount`, `updatedAt`. Unique index on `productCode` | 333 | `productCode` → COL-08 `productCode`. 285 of 333 codes are not on the 48 catalog rows. Every catalog code has a pricing row |
| COL-18 | `pricing_history` | Insert on each pricing upsert: `productCode`, `mrp`, `sellingPrice`, `purchasePrice`, `discount`, `updatedAt` | 668 | `productCode` → COL-08 `productCode`. 333 distinct codes; 285 are not on current catalog rows |

Startup creates 54 indexes in `ensure_indexes` (`backend_refactor/utils.py` lines 576–648). Names include unique indexes on `users.id`, `admin_tokens.token`, `partner_tokens.token`, `partners.id`, `partners.phone` (sparse), `categories.id`, `subcategories.id`, `brands.id`, `product_types.id`, `product_groups.id`, `racks.id`, `catalog.id`, `catalog.productCode` (sparse), `pricing.productCode`, `rfqs.id`, `money_config.adminId`. No MongoDB JSON Schema validator was found.

`GET /catalog` (RTE-58) can also write COL-08 (`productClass`, `type`) and insert COL-10 while listing (`services/catalog_service.py` `list_catalog`, approx. lines 57–75).

---

## 2. API endpoints

All paths are prefixed `/api` (each `backend_refactor/routers/*.py` router uses `APIRouter(prefix="/api")`).

**Reads / writes** name collections touched. **Multi-step** means more than one write for that call (including a loop). Detail is in section 3.

### Auth — `backend_refactor/routers/auth.py` (40 lines) → `services/auth_service.py` (144 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-01 | POST | `/auth/requester/register` | write COL-01 | no |
| RTE-02 | POST | `/auth/admin/register` | write COL-01, COL-07 | yes (TXN-01) |
| RTE-03 | POST | `/auth/admin/login` | read COL-01, write COL-02 | no |
| RTE-04 | POST | `/auth/partner/register` | read/write COL-03 | no |
| RTE-05 | POST | `/auth/partner/login` | read/write COL-03, write COL-04 | yes (TXN-02) |
| RTE-06 | GET | `/auth/partner/me` | read COL-04, COL-03, COL-16 | no |

### Partners and team — `backend_refactor/routers/partners_team.py` (50 lines) → `services/partners_team_service.py` (101 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-07 | POST | `/partners/register` | read/write COL-03 | no |
| RTE-08 | POST | `/partners` | write COL-03 twice (insert, then KYC approve) | yes (TXN-03) |
| RTE-09 | GET | `/partners` | read COL-03, COL-14, COL-16 | no |
| RTE-10 | GET | `/partners/{partner_id}` | read COL-03, COL-14, COL-16, COL-13 | no |
| RTE-11 | PUT | `/partners/{partner_id}/kyc` | write COL-03 | no |
| RTE-12 | GET | `/team/users` | read COL-01 | no |
| RTE-13 | POST | `/team/users` | read/write COL-01 | no |
| RTE-14 | PUT | `/team/users/{user_id}` | read/write COL-01 | no |

### Categories, brands, product types — `backend_refactor/routers/taxonomy.py` (69 lines) → `services/taxonomy_service.py` (204 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-15 | GET | `/categories` | read COL-05, COL-08 | no |
| RTE-16 | POST | `/categories` | read/write COL-05 | no |
| RTE-17 | PUT | `/categories/{category_id}` | write COL-05; on rename also COL-08 and COL-06 | yes when the name changes (TXN-04) |
| RTE-18 | DELETE | `/categories/{category_id}` | write COL-06, COL-05 | yes (TXN-05) |
| RTE-19 | POST | `/categories/{category_id}/delete-cascade` | write COL-08, COL-06, COL-05 | yes (TXN-06) |
| RTE-20 | GET | `/brands` | read COL-09, COL-08 | no |
| RTE-21 | POST | `/brands` | read/write COL-09 | no |
| RTE-22 | PUT | `/brands/{brand_id}` | write COL-09; on rename also COL-08 | yes when the name changes (TXN-07) |
| RTE-23 | POST | `/brands/{brand_id}/delete-cascade` | write COL-08, COL-09 | yes (TXN-08) |
| RTE-24 | GET | `/product-types` | read COL-10, COL-08; may write COL-08 and COL-10 via `sync_product_types_from_catalog` | yes (TXN-09) |
| RTE-25 | POST | `/product-types` | read/write COL-10 | no |
| RTE-26 | PUT | `/product-types/{type_id}` | write COL-10; on rename also COL-08 | yes when the name changes (TXN-10) |

### Catalog tree, groups, racks — `backend_refactor/routers/product_groups_racks.py` (64 lines) → `services/product_groups_racks_service.py` (182 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-27 | GET | `/catalog/tree` | read COL-10, COL-05, COL-08; same sync writes as RTE-24 | yes (TXN-09) |
| RTE-28 | GET | `/product-groups` | read COL-11 | no |
| RTE-29 | POST | `/product-groups` | write COL-11, COL-08 | yes (TXN-11) |
| RTE-30 | PUT | `/product-groups/{group_id}` | write COL-11, then two COL-08 updates | yes (TXN-12) |
| RTE-31 | DELETE | `/product-groups/{group_id}` | write COL-11, COL-08 | yes (TXN-13) |
| RTE-32 | POST | `/product-groups/{group_id}/delete-cascade` | write COL-08, COL-11 | yes (TXN-14) |
| RTE-33 | GET | `/racks` | read COL-12 | no |
| RTE-34 | POST | `/racks` | read/write COL-12 | no |
| RTE-35 | DELETE | `/racks/{rack_id}` | read/write COL-12 | no |
| RTE-36 | PUT | `/racks/{rack_id}/assign` | write COL-12 twice, COL-08 | yes (TXN-15) |
| RTE-37 | GET | `/racks/{rack_id}/products` | read COL-12, COL-08 | no |

### Purchases and RFQs — `backend_refactor/routers/purchases_rfq.py` (55 lines) → `services/purchases_rfq_service.py` (125 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-38 | GET | `/purchases` | read COL-13 | no |
| RTE-39 | POST | `/purchases` | read COL-08, COL-12; write COL-08, COL-12, COL-13 | yes (TXN-16) |
| RTE-40 | POST | `/purchases/import` | same as RTE-39 (calls `create_purchase`) | yes (TXN-16) |
| RTE-41 | GET | `/rfqs` | read COL-14 | no |
| RTE-42 | POST | `/rfqs` | read COL-08, write COL-14 | no |
| RTE-43 | PUT | `/rfqs/{rfq_id}` | read COL-08, COL-14; write COL-14 | no |
| RTE-44 | POST | `/rfqs/{rfq_id}/approve` | write COL-14; on approve also COL-16 | yes when approved (TXN-17) |
| RTE-45 | GET | `/partners/{partner_id}/rewards` | read COL-16 | no |
| RTE-46 | GET | `/rfqs/{rfq_id}/history` | read COL-14 | no |

### Dispatch and inventory — `backend_refactor/routers/dispatch_inventory.py` (34 lines) → `services/dispatch_inventory_service.py` (74 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-47 | GET | `/dispatches` | read COL-15 | no |
| RTE-48 | POST | `/dispatches` | read COL-14, COL-08; write COL-08 per line, COL-15, and COL-14 when `sourceRfqId` is set | yes (TXN-18) |
| RTE-49 | GET | `/inventory` | read COL-08 | no |
| RTE-50 | GET | `/inventory/low-stock` | read COL-08 (filters RTE-49 in memory) | no |
| RTE-51 | GET | `/inventory/transactions` | read COL-13, COL-15 | no |

### Subcategories — `backend_refactor/routers/subcategories.py` (40 lines) → `services/subcategories_service.py` (145 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-52 | GET | `/subcategories` | read COL-06, COL-08 | no |
| RTE-53 | POST | `/subcategories` | read COL-05, COL-06; write COL-06 | no |
| RTE-54 | PUT | `/subcategories/{subcategory_id}` | read COL-05, COL-06; write COL-06 | no |
| RTE-55 | DELETE | `/subcategories/{subcategory_id}` | write COL-06 | no |
| RTE-56 | POST | `/subcategories/{subcategory_id}/delete-cascade` | write COL-08, COL-06 | yes (TXN-19) |
| RTE-57 | POST | `/subcategories/import` | read COL-05, COL-06; write COL-06 (`insert_many`) | one bulk insert |

### Catalog — `backend_refactor/routers/catalog.py` (112 lines) → `services/catalog_service.py` (725 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-58 | GET | `/catalog` | read COL-09, COL-08, COL-17; may write COL-08 and COL-10 | yes (TXN-20) |
| RTE-59 | POST | `/catalog` | write COL-09 (if brand name is new), COL-08, COL-18, COL-17, COL-05 (if category name is new), COL-10 (if type is new) | yes (TXN-21) |
| RTE-60 | PUT | `/catalog/{item_id}` | write COL-08, maybe COL-05 and COL-10, COL-18, COL-17 | yes (TXN-22) |
| RTE-61 | PATCH | `/catalog/{item_id}/pricing` | write COL-08, COL-18, COL-17 | yes (TXN-23) |
| RTE-62 | POST | `/catalog/pricing-bulk` | per id: write COL-08, COL-18, COL-17 | yes (TXN-24) |
| RTE-63 | DELETE | `/catalog/{item_id}` | write COL-08 | no |
| RTE-64 | POST | `/catalog/{item_id}/delete-secured` | read COL-01, write COL-08 | no |
| RTE-65 | POST | `/catalog/purge-by-field` | read COL-01, write COL-08 | no |
| RTE-66 | DELETE | `/catalog` | `reset_catalog_tree` | yes (TXN-25) |
| RTE-67 | POST | `/catalog/wipe-all` | read COL-01, then TXN-25 | yes (TXN-25) |
| RTE-68 | POST | `/catalog/import` | optional TXN-25, then per row COL-09, COL-11, COL-05, COL-06, COL-08, COL-18, COL-17, COL-10 | yes (TXN-26) |
| RTE-69 | POST | `/catalog/import/master` | same family as RTE-68, master field set (`hsnCode`, `gstRate`, `mrpPkg`, `reorderLevel`); pricing upsert only on insert | yes (TXN-27) |
| RTE-70 | POST | `/catalog/import/pricing` | per row write COL-08, COL-18, COL-17 | yes (TXN-28) |
| RTE-71 | POST | `/catalog/import/stock` | per row write COL-08 `stock` | yes, one collection, many updates (TXN-29) |

### Money, dashboard, health — `backend_refactor/routers/config_dashboard.py` (24 lines) → `services/config_dashboard_service.py` (135 lines); `routers/system.py` (17 lines) → `services/system_service.py` (60 lines)

| ID | Method | Path | Collections | Multi-step |
|---|---|---|---|---|
| RTE-72 | GET | `/money-config/{admin_id}` | read COL-07; insert COL-07 when missing | no (single insert) |
| RTE-73 | PUT | `/money-config/{admin_id}` | upsert COL-07 | no |
| RTE-74 | GET | `/dashboard/snapshot` | read COL-08, COL-05, COL-14, COL-03, COL-15 | no |
| RTE-75 | GET | `/` | none | no |
| RTE-76 | GET | `/media/proxy` | none (HTTP fetch of the `url` query) | no |

76 routes verified in `backend_refactor/routers/` on 2026-10-04. `backend_refactor/models/__init__.py` and `backend_refactor/schemas/__init__.py` are empty (0 lines).

---

## 3. Multi-step operations

No `ClientSession`, `start_transaction`, or `with_transaction` appears under `backend_refactor/`. Each write is its own `await`. If a later write raises, earlier writes stay. There is no compensating rollback.

Implementation lives in `backend_refactor/services/*.py` and shared helpers in `backend_refactor/utils.py` (for example `upsert_pricing`, `reset_catalog_tree`, `sync_product_types_from_catalog`, `verify_admin_passcode`).

| ID | Where | Writes, in order | If a later step fails |
|---|---|---|---|
| TXN-01 | RTE-02 → `services/auth_service.py` `admin_register` | COL-01 insert, then COL-07 insert | Admin user can exist with no money config. `GET /money-config/{admin_id}` inserts a default later (RTE-72) |
| TXN-02 | RTE-05 → `services/auth_service.py` `partner_app_login` | COL-04 insert, then COL-03 `$set` / `$inc` | A token can exist if the partner update fails. No token expiry or delete was found |
| TXN-03 | RTE-08 → `services/partners_team_service.py` `create_partner_direct` | COL-03 insert via register, then COL-03 KYC `$set` + `$push` | Partner can remain `kycStatus: pending` if the second update fails. The handler returns the first error response and skips the second write when register fails |
| TXN-04 | RTE-17 → `services/taxonomy_service.py` `update_category` | COL-05 `$set`, then COL-08 `$set` `category`, then COL-06 `$set` `category` | Rename of products or subcategories can stop after the category row changed |
| TXN-05 | RTE-18 → `services/taxonomy_service.py` `delete_category` | COL-06 `delete_many` by `categoryId`, then COL-05 `delete_one` | Subcategories can be removed while the category row remains. Products are left in place |
| TXN-06 | RTE-19 → `services/taxonomy_service.py` `delete_category_cascade` | COL-08 `delete_many` by category name, COL-06 `delete_many`, COL-05 `delete_one` | Products can be deleted while the category or subcategories remain. Passcode is checked first (`verify_admin_passcode`) |
| TXN-07 | RTE-22 → `services/taxonomy_service.py` `update_brand` | COL-09 `$set`, then COL-08 `$set` `brand` where `brandId` matches | Brand name and product copies can diverge |
| TXN-08 | RTE-23 → `services/taxonomy_service.py` `delete_brand_cascade` | COL-08 `delete_many`, then COL-09 `delete_one` | Products can be deleted while the brand remains |
| TXN-09 | RTE-24 / RTE-27 → `utils.py` `sync_product_types_from_catalog` | Per catalog row, optional COL-08 `$set`, then optional COL-10 insert | A list/tree GET mutates data. A failure mid-loop leaves a partial sync. No error wrapper around the loop |
| TXN-10 | RTE-26 → `services/taxonomy_service.py` `update_product_type` | COL-10 `$set`, then COL-08 `$set` `type` | Type name and product `type` strings can diverge |
| TXN-11 | RTE-29 → `services/product_groups_racks_service.py` `create_product_group` | COL-11 insert, then COL-08 `$addToSet` `productGroupIds` | Group can exist while products lack the id |
| TXN-12 | RTE-30 → `services/product_groups_racks_service.py` `update_product_group` | COL-11 `$set`, COL-08 `$pull` old ids, COL-08 `$addToSet` new ids | Membership on the group and on products can disagree |
| TXN-13 | RTE-31 → `services/product_groups_racks_service.py` `delete_product_group` | COL-11 `delete_one`, then COL-08 `$pull` | Group can be gone while `productGroupIds` still holds the id |
| TXN-14 | RTE-32 → `services/product_groups_racks_service.py` `delete_product_group_cascade` | COL-08 `delete_many`, COL-08 `$pull`, COL-11 `delete_one` | Products matching the group can be deleted before the group row is removed |
| TXN-15 | RTE-36 → `services/product_groups_racks_service.py` `assign_rack_slot` | COL-12 set this slot’s `productId`, COL-12 clear that product on other racks, COL-08 `$set` `rackId` / `rackName` / `rackSlot` | Slot and catalog location can disagree. The previous occupant of the slot is not cleared in the first update |
| TXN-16 | RTE-39 / RTE-40 → `services/purchases_rfq_service.py` `create_purchase` | For each line: COL-08 `$inc` `stock` and set last purchase fields; if a rack is sent, COL-12 slot `productId` and COL-08 rack fields. After the loop: COL-13 insert | Stock can increase before the purchase document exists. A failed line leaves earlier lines already incremented. No check that `modified_count` is 1. Does not write reward points |
| TXN-17 | RTE-44 → `services/purchases_rfq_service.py` `approve_rfq` | COL-14 `$set` status and totals, then (only if `approved` and no existing `type: earned` row for that `quotationId`) COL-16 insert | RFQ can be `approved` with no ledger row if the insert fails. A second approve skips a second `earned` row only when the first insert is already visible. Does not change stock |
| TXN-18 | RTE-48 → `services/dispatch_inventory_service.py` `create_dispatch` | Per line: COL-08 `$inc` stock by `-quantity` only when `stock >= quantity`. Then COL-15 insert. If `sourceRfqId`: COL-14 `$set` `status: dispatched` and `$push` history | If a later line’s `modified_count != 1`, the handler returns HTTP 409 `"Stock changed; please retry dispatch"` and does not insert the dispatch. Earlier lines in that request already decremented stock, and those decrements are not put back. If the dispatch insert fails after all decrements, stock is down and no dispatch row exists. Reward points are not written here |
| TXN-19 | RTE-56 → `services/subcategories_service.py` `delete_subcategory_cascade` | COL-08 `delete_many`, then COL-06 `delete_one` | Products can be removed while the subcategory remains |
| TXN-20 | RTE-58 → `services/catalog_service.py` `list_catalog` | While reading, optional COL-08 `$set` of inferred `productClass` / `type`, and COL-10 insert | A GET persists inferred taxonomy. Partial loop on error |
| TXN-21 | RTE-59 → `services/catalog_service.py` `create_catalog` + `utils.py` `upsert_pricing` | Optional COL-09 insert, COL-08 insert, COL-18 insert, COL-17 upsert, optional COL-05 insert, optional COL-10 insert | Product can exist without pricing, or pricing can exist if a later insert fails. `upsert_pricing` always inserts history before the pricing upsert |
| TXN-22 | RTE-60 → `services/catalog_service.py` `update_catalog` + `upsert_pricing` | COL-08 `$set`, optional COL-05 insert, optional COL-10 insert, then `upsert_pricing` | Same split as TXN-21 |
| TXN-23 | RTE-61 → `services/catalog_service.py` `update_catalog_pricing` + `upsert_pricing` | COL-08 `$set`, then `upsert_pricing` | Catalog price can change without a new pricing row if the second step fails |
| TXN-24 | RTE-62 → `services/catalog_service.py` `update_catalog_pricing_bulk` | For each `itemIds` entry: COL-08 `$set` and `upsert_pricing`. Skips unknown ids and continues | Some ids can be updated and others skipped. No all-or-nothing |
| TXN-25 | RTE-66 / RTE-67 → `utils.py` `reset_catalog_tree` | `delete_many` on COL-08, COL-05, COL-06, COL-10, COL-11, COL-09, COL-17, COL-18, then per rack COL-12 `$set` slots’ `productId` to null | A failed delete leaves the later collections intact. Does not delete COL-12, COL-13, COL-14, COL-15, COL-16, COL-01, COL-03. RTE-67 checks the admin passcode first. RTE-66 does not |
| TXN-26 | RTE-68 → `services/catalog_service.py` `import_catalog` | If `replaceExisting`: TXN-25. Then per item: optional inserts of COL-09, COL-11, COL-05, COL-06; COL-08 `replace_one` or `insert_one`; `upsert_pricing`; optional COL-05; optional COL-10. After the loop: COL-11 `$set` `productIds` | Rows already written stay if a later row fails. Response counts `inserted` / `updated` / `skipped` after the loop finishes |
| TXN-27 | RTE-69 → `services/catalog_service.py` `_run_master_catalog_import` | Same pattern as TXN-26 without `replaceExisting`. `upsert_pricing` runs only when the catalog row is inserted, not when it is replaced | Existing products keep their previous COL-17 row on master re-import. New side rows (brand, group, category, subcategory, type) are written as each item is processed |
| TXN-28 | RTE-70 → `services/catalog_service.py` `import_catalog_pricing` | Per pricing row: COL-08 `$set`, then `upsert_pricing`. Response includes up to 50 `warnings` when sent selling price disagrees with MRP and discount by more than 0.02 | One product can be updated and the next skipped (`skipped` counter). Unknown `productCode` is skipped |
| TXN-29 | RTE-71 → `services/catalog_service.py` `import_catalog_stock` | Per stock row: COL-08 `$set` `stock` | Same skip-and-continue behavior. No pricing write |

Passcode gate (`AdminPasscodeIn` + `verify_admin_passcode`, `utils.py` lines 547–564) runs before the writes on RTE-19, RTE-23, RTE-32, RTE-56, RTE-64, RTE-65, RTE-67. It checks COL-01 `role: admin`, `contactNumber`, and `passcodeHash`. It does not check COL-02.

---

## 4. Relationships

Cardinality is how the code stores the link. There is no database-level foreign key.

| ID | From | To | Cardinality | How |
|---|---|---|---|---|
| REL-01 | COL-01 `users.id` | COL-02 `admin_tokens.adminId` | one-to-many | Each admin login inserts another token. No unique index on `adminId` |
| REL-02 | COL-01 `users.id` | COL-07 `money_config.adminId` | one-to-one | Unique index `money_config_adminId_uq` |
| REL-03 | COL-03 `partners.id` | COL-04 `partner_tokens.partnerId` | one-to-many | Each partner login inserts another token |
| REL-04 | COL-03 `partners.id` | COL-14 `rfqs.partnerId` | one-to-many | Required on RFQ create. Partner existence is not checked in `create_rfq` |
| REL-05 | COL-03 `partners.id` | COL-16 `reward_ledger.requesterId` | one-to-many | Written from `current["partnerId"]` on approve |
| REL-06 | COL-05 `categories.id` | COL-06 `subcategories.categoryId` | one-to-many | Required on subcategory create. `category` name is copied onto the subcategory |
| REL-07 | COL-05 `categories.name` | COL-08 `catalog.category` | one-to-many | Name string, not `categories.id`. Rename (TXN-04) copies the new name |
| REL-08 | COL-06 `subcategories.id` | COL-08 `catalog.subcategoryId` | one-to-many | Optional. Cascade delete also matches `subcategory` name and `type` name |
| REL-09 | COL-09 `brands.id` | COL-08 `catalog.brandId` | one-to-many | Optional. `brand` name is copied. Cascade also matches the name |
| REL-10 | COL-10 `product_types.name` | COL-08 `catalog.type` | one-to-many | Name string. No type id on the product |
| REL-11 | COL-11 `product_groups` | COL-08 `catalog` | many-to-many | `productIds` on the group and `productGroupIds` on the product. Both are updated together in TXN-11 and TXN-12. `productGroup` on the product is a separate name string |
| REL-12 | COL-12 `racks` | COL-08 `catalog` | one rack to many products; assign aims at one slot per product | `slots[].productId` and `catalog.rackId` / `rackSlot`. TXN-15 clears the product from other racks |
| REL-13 | COL-08 `catalog` | COL-13 `purchases.lines` | one-to-many | Embedded line `productId` and `productCode`. The purchase document is not keyed by partner |
| REL-14 | COL-08 `catalog` | COL-14 `rfqs.lines` | one-to-many | Embedded `productId`, `productCode`, copied `productName` and `unitPrice` |
| REL-15 | COL-08 `catalog` | COL-15 `dispatches.lines` | one-to-many | Embedded `productId`, `productCode`, `quantity`, `unitPrice` |
| REL-16 | COL-08 `catalog.productCode` | COL-17 `pricing.productCode` | one-to-one | Unique index on pricing `productCode`. Local data: 48 catalog codes, 333 pricing codes |
| REL-17 | COL-08 `catalog.productCode` | COL-18 `pricing_history.productCode` | one-to-many | A new history row on every `upsert_pricing` call |
| REL-18 | COL-14 `rfqs.id` | COL-15 `dispatches.sourceRfqId` | one-to-many in the schema | Optional. Dispatch requires status `approved`. No unique index stops a second dispatch for the same RFQ |
| REL-19 | COL-14 `rfqs.id` | COL-16 `reward_ledger.quotationId` | one earned row per RFQ in code | Lookup `{quotationId, type: "earned"}` before insert. Not a unique index. `redeemed` rows are not created |

COL-13 `partnerId` is indexed (`purchases_partner_created`) and read by RTE-10. The purchase insert does not set it, so that link is unused by the write path.

---

## 5. Data validation

Request bodies use Pydantic v2 models in `backend_refactor/utils.py` (lines 157–566), plus `AdminPasscodeIn` (line 547) and `CatalogFieldPurgeIn` (line 566). `backend_refactor/schemas/` and `backend_refactor/models/` are empty packages (0-line `__init__.py` only).

Invalid bodies become FastAPI’s default validation error. That response is not the `{ success, data, error }` envelope. Handlers that reject a body themselves return the envelope with HTTP 400, 401, 404, or 409.

No MongoDB collection validator was found.

Field rules below are from the class body. `required` means no default. `optional` means a default is set (including `None`). `PartnerRegisterIn` inherits `PartnerIn` and adds `passcode`. `CatalogFieldPurgeIn` inherits `AdminPasscodeIn`.

| ID | Schema | Line | Required | Optional (default) |
|---|---|---|---|---|
| VAL-01 | `RequesterRegisterIn` | 200 | `name` str, `phone` str, `address` str | — |
| VAL-02 | `AdminRegisterIn` | 206 | `companyName`, `gstin`, `contactNumber`, `passcode` all str | — |
| VAL-03 | `AdminLoginIn` | 213 | `contactNumber`, `passcode` | — |
| VAL-04 | `PartnerIn` | 218 | `name`, `phone` | `address` `""`, `businessName` `""`, `pincode` `""`, `city` `""`, `area` `""`, `salesManager` `""`, `documents` `[]` |
| VAL-05 | `PartnerLoginIn` | 230 | `phone`, `passcode` | — |
| VAL-06 | `PartnerRegisterIn` | 235 | parent fields plus `passcode` str, `Field(min_length=4)` | parent defaults |
| VAL-07 | `PartnerReviewIn` | 239 | `approved` bool | `locationVerified` `False`, `rejectionReason` `None` |
| VAL-08 | `TeamUserIn` | 245 | `name`, `contactNumber`, `passcode` | `role` `"staff"` pattern `admin\|store_manager\|staff`, `permissions` `[]` |
| VAL-09 | `TeamUserUpdateIn` | 253 | `name`, `contactNumber`, `role` (same pattern), `isActive` bool | `permissions` `[]` |
| VAL-10 | `CatalogItemIn` | 261 | `name`, `category`, `unit`, `standardRate` float | `productCode`, `productName`, `type`, `productClass`, `productGroup`, `size`, `sizeMm`, `sizeInch`, `sizeCm`, `length`, `brand`, `brandId`, `subcategory`, `subcategoryId`, `imageUrl`, `imageName`, `stdPkg`, `mrp`, `sellingPrice`, `purchasePrice`, `discount`, `stock` all default `None`; `aliases` `[]`, `multilingualNames` `{}`, `displaySequence` `0`, `reorderLevel` `0`, `regularDiscount` `0`, `productGroupIds` `[]`, `isActive` `True`. `sizeMm` and `sizeCm` are coerced by `parse_size_mm` |
| VAL-11 | `CategoryIn` | 302 | `name` | `imageUrl` `None` |
| VAL-12 | `CategoryUpdateIn` | 307 | `name`, `isActive` | `imageUrl` `None` |
| VAL-13 | `BrandIn` | 313 | `name` | `logoUrl` `None` |
| VAL-14 | `BrandUpdateIn` | 318 | `name`, `isActive` | `logoUrl` `None` |
| VAL-15 | `ProductTypeIn` | 324 | `name` | `imageUrl` `None` |
| VAL-16 | `ProductTypeUpdateIn` | 329 | `name`, `isActive` | `imageUrl` `None` |
| VAL-17 | `ProductGroupIn` | 335 | `name`, `productIds` list[str] | — |
| VAL-18 | `RackIn` | 340 | `name`, `rows` int, `columns` int | — |
| VAL-19 | `RackAssignmentIn` | 346 | `productId`, `slotCode` | — |
| VAL-20 | `PurchaseLineIn` | 351 | `productCode`, `quantity` float, `listPrice` float | `purchaseDiscount` `0`, `rackId` `None`, `rackSlot` `None` |
| VAL-21 | `PurchaseIn` | 360 | `lines` list[`PurchaseLineIn`] | — |
| VAL-22 | `RfqLineIn` | 364 | `productCode`, `quantity` | — |
| VAL-23 | `RfqIn` | 369 | `partnerId`, `lines` | `deliveryMode` `"storePickup"` pattern `storePickup\|homeDelivery`, `scheduledAt` `None` |
| VAL-24 | `RfqApprovalIn` | 376 | `approved` bool | `specialDiscountPercent` `0`, `deliveryMode` `None` (same pattern), `scheduledAt` `None` |
| VAL-25 | `DispatchLineIn` | 383 | `productCode`, `quantity` | — |
| VAL-26 | `DispatchIn` | 388 | `lines` | `sourceRfqId`, `customerName`, `customerPhone` all `None` |
| VAL-27 | `SubcategoryIn` | 395 | `name`, `categoryId` | — |
| VAL-28 | `SubcategoryUpdateIn` | 400 | `name`, `categoryId` | — |
| VAL-29 | `SubcategoryImportRow` | 405 | `name` | `categoryId` `None`, `category` `None` |
| VAL-30 | `SubcategoryImportIn` | 411 | `items` | — |
| VAL-31 | `ImportItem` | 415 | `name`, `unit`, `standardRate` | `category`, `type`, `productClass`, `productGroup`, `brand`, `productName`, `subcategory`, `size`, `sizeMm`, `sizeCm`, `sizeInch`, `productCode`, `length`, `stdPkg`, `mrp`, `sellingPrice`, `purchasePrice`, `discount`, `stock`, `imageUrl` default `None`; `isActive` `True`. Discount `0 < n < 1` is multiplied by 100 |
| VAL-32 | `CatalogPricingIn` | 460 | — | `mrp`, `sellingPrice`, `discount`, `purchasePrice`, `stock` all `None` |
| VAL-33 | `CatalogBulkPricingIn` | 468 | `itemIds` | `mrp`, `discount`, `stock` `None` |
| VAL-34 | `CatalogImportIn` | 475 | `items`, `categoryMode` pattern `fromCsv\|overrideExisting\|overrideNew` | `overrideCategory` `""`, `replaceExisting` `False` |
| VAL-35 | `MasterImportRow` | 482 | `name` | `unit` `"pcs"`; `category`, `type`, `productClass`, `productGroup`, `brand`, `productName`, `subcategory`, `size`, `sizeMm`, `sizeCm`, `sizeInch`, `productCode`, `length`, `imageUrl`, `hsnCode`, `gstRate`, `stdPkg`, `mrpPkg`, `mrp`, `discount`, `sellingPrice`, `reorderLevel` default `None`; `isActive` `True`. `gstRate` and `discount` in `(0, 1]` are multiplied by 100 |
| VAL-36 | `CatalogMasterImportIn` | 528 | `items` | `categoryMode` `"fromCsv"` (same pattern as VAL-34), `overrideCategory` `""` |
| VAL-37 | `PricingImportRow` | 534 | `productCode` | `mrp`, `discount`, `sellingPrice` `None`. Discount `0 < n < 1` becomes percent |
| VAL-38 | `CatalogPricingImportIn` | 554 | `items` | — |
| VAL-39 | `StockImportRow` | 558 | `productCode`, `stock` float | — |
| VAL-40 | `CatalogStockImportIn` | 563 | `items` | — |
| VAL-41 | `MoneyConfigIn` | 567 | — | `discountPercent` `0`, `gstPercent` `0`, `specialDiscountPercent` `0`, `showDiscount` `True`, `showGst` `True`, `showSpecialDiscount` `False` |
| VAL-42 | `AdminPasscodeIn` | 737 | `contactNumber`, `passcode` | — |
| VAL-43 | `CatalogFieldPurgeIn` | 756 | parent passcode fields, `field` pattern `type\|productClass\|productGroup`, `value` str | — |

Manual checks after Pydantic (non-exhaustive list of the ones that reject the request):

| ID | Where | Check |
|---|---|---|
| VAL-44 | RTE-04, RTE-07 | stripped `name` and `phone` non-empty; phone not already on COL-03 |
| VAL-45 | RTE-13 | name, contact, passcode length ≥ 4; contact not already on COL-01 |
| VAL-46 | RTE-16, RTE-21, RTE-25, RTE-34, RTE-53 | stripped name non-empty; duplicate name returns 409 |
| VAL-47 | RTE-29, RTE-30 | name plus at least two catalog ids that all exist (`valid_product_ids`) |
| VAL-48 | RTE-34 | rows 1–26, columns 1–100 |
| VAL-49 | RTE-39 `validate_purchase_lines` | product code exists; `quantity > 0`, `listPrice >= 0`, `purchaseDiscount >= 0`; rack id and slot exist together |
| VAL-50 | RTE-42 `prepare_rfq_lines` | product code exists, `quantity > 0`, `partnerId` non-empty after strip |
| VAL-51 | RTE-48 `prepare_dispatch_lines` | product exists, `quantity > 0`, `stock >= quantity` using the value read before the writes |
| VAL-52 | RTE-19, RTE-23, RTE-32, RTE-56, RTE-64, RTE-65, RTE-67 | admin passcode via bcrypt against COL-01 |

Query parameters (`search`, `category`, `partner_id`, `status`, and the catalog filters) are plain FastAPI query types, not these models.

---

## 6. Current data volume

Queried 2026-10-04 against local `quotation_db` at `mongodb://127.0.0.1:27017` (code defaults; no `.env` in repo). Document counts were re-confirmed during refactor-only verification on the same date. Live database on Render: unknown.

| ID | Collection | Documents |
|---|---|---|
| VOL-01 | `users` | 3 |
| VOL-02 | `admin_tokens` | 4 |
| VOL-03 | `partners` | 1 |
| VOL-04 | `partner_tokens` | 0 |
| VOL-05 | `categories` | 3 |
| VOL-06 | `subcategories` | 2 |
| VOL-07 | `money_config` | 3 |
| VOL-08 | `catalog` | 48 |
| VOL-09 | `brands` | 4 |
| VOL-10 | `product_types` | 2 |
| VOL-11 | `product_groups` | 0 |
| VOL-12 | `racks` | 2 |
| VOL-13 | `purchases` | 1 |
| VOL-14 | `rfqs` | 1 (`status` `approved`) |
| VOL-15 | `dispatches` | 1 |
| VOL-16 | `reward_ledger` | 1 (`type` `earned`) |
| VOL-17 | `pricing` | 333 |
| VOL-18 | `pricing_history` | 668 |

`quotation_db_refactor` on the same server: 0 documents in each of the same 18 collections.

Other local database names seen: `admin`, `config`, `local`, `learning_db`. `learning_db` was not inspected.

---

## 7. Environment and connection

Same row topics as BLD-01–BLD-08 in the admin inventory. IDs here are backend-only.

| ID | Item | Fact | Admin inventory |
|---|---|---|---|
| BLD-01 | Run locally | From repo root: `uvicorn backend_refactor.server:app --host 0.0.0.0 --port 8000`. Or `cd backend_refactor && uvicorn server:app --host 0.0.0.0 --port 8000`. App object is `app` in `backend_refactor/server.py` (lines 23–24 comment on VPS workers) | BLD-01 |
| BLD-02 | Server stack | FastAPI `0.110.1`, Uvicorn `0.25.0`, Motor `3.3.1`, PyMongo `4.6.3`, Pydantic `>=2.6.4`, bcrypt `4.1.3` (`backend_refactor/requirements.txt`, 26 lines; `backend/requirements.txt` matches) | BLD-02 |
| BLD-03 | App config | Title `"Quotation Generator API (Mirror)"`. Routers mounted in `backend_refactor/server.py` lines 75–84. CORS twice: lines 67–73 allow localhost `:5173`, `:3000`, `:8081`; lines 86–92 allow `allow_origins=["*"]` with credentials. Startup calls `ensure_indexes` and `ensure_default_categories` in `utils.py` (latter is a no-op; `DEFAULT_CATEGORIES = []`) | BLD-03 |
| BLD-04 | Env | `load_dotenv(ROOT_DIR / ".env")` in `backend_refactor/utils.py` line 16 (`ROOT_DIR` is the `backend_refactor/` folder). `MONGO_URI` default `mongodb://127.0.0.1:27017`, `DB_NAME` default `quotation_db` (lines 18–22). `.gitignore` ignores `.env`, `.env.*`, and `*.env`. No `.env` file was in the repo on this scan. No other env var is read in the refactor tree | BLD-04 |
| BLD-05 | Hosting | `README.md` live API string: `https://python-api-6aft.onrender.com`. Repo notes say VPS uses `backend_refactor`. No Render blueprint, Procfile, or start script was found in the repo | BLD-05 |
| BLD-06 | Docker / nginx | No Dockerfile and no nginx file found in the repo | BLD-06 |
| BLD-07 | Guards | API routes do not use a shared auth dependency. COL-02 is written on admin login and not read. The only Bearer check is RTE-06 (`Authorization` header, COL-04). Passcode checks are VAL-52. `GET /media/proxy` blocks localhost, private, link-local, reserved IPs, and hosts ending in `.local` or `.internal` (`services/system_service.py` `_blocked_host`, lines 16–27) | BLD-07 |
| BLD-08 | Package manager | `backend_refactor/requirements.txt` pins some packages and uses `>=` on others (boto3, cryptography, pyjwt, pandas, numpy, and others). No `pyproject.toml` or `Pipfile` was found. How production installs dependencies: unknown | BLD-08 |

Connection code:

```18:22:backend_refactor/utils.py
mongo_url = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
db_name = os.getenv("DB_NAME", "quotation_db")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
```

`client.close()` runs on shutdown (`backend_refactor/server.py` line 104). If the ping in `ensure_indexes` fails, index creation is skipped and the process still starts (`utils.py` lines 581–585).

---

## 8. Risks

| ID | Item | Fact |
|---|---|---|
| RSK-01 | No multi-document transaction | Section 3. Dispatch (TXN-18) can decrement stock and then return 409 without restoring those units or writing COL-15. Purchase (TXN-16) increments stock before COL-13 exists |
| RSK-02 | Admin token is not checked | COL-02 is insert-only. Catalog, RFQ, dispatch, purchase, and wipe routes do not read `Authorization`. Wipe and cascade deletes that do check a secret use the passcode body (VAL-52), except RTE-66 `DELETE /catalog`, which calls `reset_catalog_tree` with no passcode |
| RSK-03 | GET handlers write | RTE-24, RTE-27, and RTE-58 update catalog taxonomy and may insert product types |
| RSK-04 | Monolith removed | Only `backend_refactor/` implements the API on disk. Empty `models/` and `schemas/` packages. Stale references to `backend/server.py` remain in some README and demo notes |
| RSK-05 | Pricing rows outnumber products | Local COL-17 has 333 codes and COL-08 has 48. 285 pricing codes are absent from catalog. COL-18 has 668 rows. TXN-25 deletes pricing only as part of a full tree wipe. Single-product delete (RTE-63, RTE-64) does not delete COL-17 or COL-18 |
| RSK-06 | Name links beside id links | Category, type, subcategory, brand, and product group are matched by string as well as by id (REL-07, REL-08, REL-09, REL-10, REL-11). A rename that stops midway leaves both spellings |
| RSK-07 | Partner id on purchases | Index and RTE-10 expect COL-13 `partnerId`. The insert does not set it |
| RSK-08 | Reward redeem path | `reward_balance` subtracts `type: "redeemed"`. The only insert found is `type: "earned"` on RFQ approve. No redeem route was found |
| RSK-09 | Duplicate catalog import | RTE-68 (`/catalog/import`) and RTE-69 (`/catalog/import/master`) both create brands, groups, categories, subcategories, and products. Master import skips pricing upsert on replace; the older import does not |
| RSK-10 | Second dispatch | TXN-18 does not record a unique `sourceRfqId`. After the first success the RFQ status is `dispatched`, and a later call with that id is rejected because status is no longer `approved`. A crash after stock updates and before the status write leaves the RFQ `approved` with stock already reduced |
| RSK-11 | CORS | Two `CORSMiddleware` registrations. The later one allows every origin with credentials |
| RSK-12 | Tests | `backend/tests/test_quotation_api.py` is 557 lines. Default `BASE_URL` is `https://quotation-expo.preview.emergentagent.com`, not `127.0.0.1:8000`. Whether that host still matches this server: unknown |
| RSK-13 | Dependency surface | `requirements.txt` includes boto3, pandas, numpy, python-jose, passlib, jq, typer. Runtime imports in the refactor tree are mainly fastapi, motor, pydantic, bcrypt, requests, dotenv (`server.py`, `utils.py`, services). Unused packages were not traced further |
| RSK-14 | Index note is stale | `demo-notes/2026-09-23-05-mongodb-indexes.md` says 49 indexes. `ensure_indexes` now lists 54 names, including `product_types_id_uq` and `product_types_name` |
| RSK-15 | Envelope bypass | Pydantic failures use FastAPI’s default error body. Callers that only read `{ success, data, error }` do not get that shape |
