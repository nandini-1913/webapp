# Web App ↔ Backend API Reference

This document describes the API calls made by the current Vite/React web app and the API routes implemented by the FastAPI backend in `backend/server.py`. It is intended as a contract checklist when comparing the frontend and backend.

## Server and base URL

The backend router is mounted under `/api`. The web app's catalog client builds request URLs as:

```text
{API_BASE_URL}/api/{endpoint}
```

`API_BASE_URL` is read from the Vite environment variable `VITE_API_BASE_URL`. If it is unset, the current default is:

```text
http://187.127.148.44
```

For another environment, set the origin (no `/api` suffix) in `frontend/.env.local`, for example:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Restart Vite after changing an environment variable. The API must be reachable from the user's browser. The FastAPI app currently enables CORS for all origins.

## Standard response envelope

Backend endpoints normally return JSON in this shape:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errors normally use the same shape and a non-2xx HTTP status:

```json
{
  "success": false,
  "data": null,
  "error": "Reason"
}
```

The frontend must check both the HTTP status and `success`; a successful HTTP response alone does not imply the operation succeeded.

## Calls currently made by the storefront

At this checkout, product search and Pipes & Fitting browsing are connected to the FastAPI backend. Their requests are implemented in `frontend/src/services/catalog/pipesFittingRepository.ts`.

When the Pipes & Fitting screen opens:

1. The app sends `GET /api/categories`.
2. It matches the category name, ignoring case, from this list:
   - `Pipes & Fitting`
   - `Pipes & Fittings`
   - `Pipes & Tubing`
   - `Plumbing Pipes & Fittings`
3. It sends the following requests concurrently, using the matched category's exact name:
   - `GET /api/catalog?category={URL-encoded-category-name}`
   - `GET /api/subcategories`
4. It joins product `subcategoryId` values to subcategory `id` values, and groups the product list for browsing. Requests use `cache: "no-store"`; reopening the screen fetches fresh data. The current request is cancelled if the screen unmounts.

### Global text, voice, and barcode search

The app-wide search route (`/search`) submits `GET /api/catalog?search={URL-encoded-query}`, plus `GET /api/categories` and `GET /api/subcategories` to label and enrich returned products. The web app also normalizes simple plurals (for example, “pipes” to “pipe”) and recognizes a search that matches a category name; category searches such as “pipes”, “fittings”, or “pipes and fitting” fetch and display that category’s live products using `GET /api/catalog?category={URL-encoded-category-name}`. Selecting **Add to cart** adds that backend product ID to the local cart.

- Dashboard and desktop-header search fields accept text directly; submitting with Enter or the search icon opens `/search` with the query and immediately shows results. Category/configurator search controls open `/search` for text entry.
- The home microphone opens `/search` and starts browser speech recognition when supported; the recognized phrase uses the same catalog search call.
- The home QR/barcode action opens the camera scanner on `/search`. A decoded code is searched as product text/code. Scanning requires camera permission and browser `BarcodeDetector` support; unsupported browsers show a text-search fallback.
- Search inputs inside Pipes & Fitting filter dropdowns locally filter the already loaded backend data.

### Location address lookup

Browser GPS coordinates are reverse-geocoded using OpenStreetMap Nominatim's `GET https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={latitude}&lon={longitude}&zoom=18&addressdetails=1`. This is an external geocoding service, not an endpoint on the app's FastAPI backend. Coordinates and map-selected points are sent to Nominatim to obtain `display_name`; the resulting address is saved with the location in browser local storage. The app shows coordinates if address lookup fails and spaces requests to comply with Nominatim's one-request-per-second usage limit. © OpenStreetMap contributors.

Example URLs with the current default base:

```text
GET http://187.127.148.44/api/categories
GET http://187.127.148.44/api/catalog?category=PIPES%20%26%20FITTING
GET http://187.127.148.44/api/subcategories
```

### Data expected by the Pipes & Fitting screen

`GET /api/categories` must return an array in `data` containing an object with `id` and `name` for one of the accepted category names.

`GET /api/catalog` must return an array in `data`. The screen uses these product fields:

| Field | Required by screen | Use |
|---|---:|---|
| `id` | Yes | Stable backend product ID used by the cart |
| `name` | Yes | Displayed product name |
| `productName` | No | Display name when present; `name` is the fallback |
| `category` | Yes | Must match the selected category name |
| `unit` | Yes | Displayed price unit |
| `standardRate` | Yes | Display price (currently treated as MRP) |
| `productCode` | No | SKU/product code |
| `brandId`, `brand` | No | Cart brand identity and filter |
| `productClass` | No | Product class/group used to form catalog groups |
| `imageUrl` | No | Product image URL; the category card uses a product image from its group, and the configurator uses the selected product's image |
| `subcategoryId` | No | Joined to `/api/subcategories`; absent/unmatched products appear under `Other` |
| `discount`, `regularDiscount` | No | Discount label; `discount` takes precedence |
| `size`, `length`, `stdPkg`, `type`, `class` | No | Display/filter details if present; `size`, `length`, `type`, and `class` can be inferred from `name` when absent |

`GET /api/subcategories` returns records containing `id`, `name`, and `categoryId`. The web app currently retrieves all subcategories and looks up products by `subcategoryId`; when the ID is not found, it uses the product's `subcategory` field when present.

The backend's `CatalogItemIn` model supports `name`, `category`, `unit`, `standardRate`, `brandId`, `subcategoryId`, `regularDiscount`, and other catalog fields. It does **not** declare `size`, `length`, `stdPkg`, `type`, or `class`; unless the backend adds these fields to its stored product records/API schema, the web app can only infer those details from the product name. `standardRate` is what the current backend provides and what the storefront displays as product price.

### Example cURL checks

```powershell
curl.exe -i "http://187.127.148.44/api/"
curl.exe -i "http://187.127.148.44/api/categories"
curl.exe -i "http://187.127.148.44/api/catalog?category=PIPES%20%26%20FITTING"
curl.exe -i "http://187.127.148.44/api/subcategories"
```

The root check should return an envelope containing `{"service":"quotation-mirror","ok":true}`. If the response is HTML instead of JSON, the request is reaching the web server rather than the FastAPI app, or the configured port/path is wrong.

### Live API check (2026-10-07)

The requested host `http://187.127.148.44` returned a FastAPI JSON envelope from `/api/`, a `PIPES & FITTING` category from `/api/categories`, and 44 catalog products from `/api/catalog?category=PIPES%20%26%20FITTING`. All 44 catalog records returned a non-empty `imageUrl`. The product response uses fields including `productName`, `productClass`, `type`, `subcategory`, `size`, `length`, `standardRate`, `discount`, `brand`, `subcategoryId`, and `imageUrl`; the storefront adapter maps these to its browse models. Product category cards use a backend image URL from the group, and the configurator uses the selected product's own URL.

The earlier Render API URL returned empty category/catalog/subcategory arrays during a previous check. It is not the web app's current target.

## All routes implemented by the backend

The table below is the route inventory from `backend/server.py`. **“Backend only” means the current Vite storefront does not call that route.** It is still available for clients that implement the corresponding feature.

### Authentication and users

| Method | Path | Query/body | Current storefront |
|---|---|---|---|
| POST | `/api/auth/requester/register` | JSON: `name`, `phone`, `address` | Backend only |
| POST | `/api/auth/admin/register` | JSON: `companyName`, `gstin`, `contactNumber`, `passcode` | Backend only |
| POST | `/api/auth/admin/login` | JSON: `contactNumber`, `passcode` | Backend only |
| GET | `/api/team/users` | None | Backend only |
| POST | `/api/team/users` | JSON: `name`, `contactNumber`, `role`, `passcode`, optional `permissions` | Backend only |
| PUT | `/api/team/users/{user_id}` | JSON: `name`, `contactNumber`, `role`, `isActive`, optional `permissions` | Backend only |

Team roles accepted by the backend are `admin`, `store_manager`, and `staff`.

### Categories, brands, subcategories, and catalog

| Method | Path | Query/body | Current storefront |
|---|---|---|---|
| GET | `/api/categories` | None | **Called by Pipes & Fitting** |
| POST | `/api/categories` | JSON: `name` | Backend only |
| PUT | `/api/categories/{category_id}` | JSON: `name`, `isActive` | Backend only |
| GET | `/api/brands` | None | Backend only |
| POST | `/api/brands` | JSON: `name` | Backend only |
| PUT | `/api/brands/{brand_id}` | JSON: `name`, `isActive` | Backend only |
| GET | `/api/subcategories` | Optional query: `category_id` | **Called by Pipes & Fitting** (without query) |
| POST | `/api/subcategories` | JSON: `name`, `categoryId` | Backend only |
| PUT | `/api/subcategories/{subcategory_id}` | JSON: `name`, `categoryId` | Backend only |
| DELETE | `/api/subcategories/{subcategory_id}` | None | Backend only |
| POST | `/api/subcategories/import` | JSON: `items`, each with `name` and `categoryId` or `category` | Backend only |
| GET | `/api/catalog` | Optional queries: `category`, `search`, `group_id` | **Called by Pipes & Fitting** with `category` |
| POST | `/api/catalog` | JSON catalog item; required: `name`, `category`, `unit`, `standardRate`; optional fields per `CatalogItemIn` | Backend only |
| PUT | `/api/catalog/{item_id}` | Same catalog item JSON as POST | Backend only |
| DELETE | `/api/catalog/{item_id}` | None | Backend only |
| POST | `/api/catalog/import` | JSON: `items`, `categoryMode` (`fromCsv`, `overrideExisting`, or `overrideNew`), optional `overrideCategory` | Backend only |
| GET | `/api/product-groups` | None | Backend only |
| POST | `/api/product-groups` | JSON: `name`, `productIds` (at least two valid products) | Backend only |
| PUT | `/api/product-groups/{group_id}` | JSON: `name`, `productIds` | Backend only |
| DELETE | `/api/product-groups/{group_id}` | None | Backend only |

Example catalog item create/update body:

```json
{
  "name": "Astral CPVC Pipe 20 mm",
  "category": "Pipes & Fitting",
  "unit": "pcs",
  "standardRate": 618,
  "brandId": "brand-id-from-api",
  "subcategoryId": "subcategory-id-from-api",
  "regularDiscount": 0
}
```

### Warehousing, purchases, inventory, and dispatch

| Method | Path | Query/body | Current storefront |
|---|---|---|---|
| GET | `/api/racks` | None | Backend only |
| POST | `/api/racks` | JSON: `name`, `rows`, `columns` | Backend only |
| DELETE | `/api/racks/{rack_id}` | None | Backend only |
| PUT | `/api/racks/{rack_id}/assign` | JSON: `productId`, `slotCode` | Backend only |
| GET | `/api/racks/{rack_id}/products` | None | Backend only |
| GET | `/api/purchases` | None | Backend only |
| POST | `/api/purchases` | JSON: `lines`; each has `productCode`, `quantity`, `listPrice`, optional `purchaseDiscount`, `rackId`, `rackSlot` | Backend only |
| POST | `/api/purchases/import` | Same JSON as `/api/purchases` | Backend only |
| GET | `/api/inventory` | None | Backend only |
| GET | `/api/inventory/low-stock` | None | Backend only |
| GET | `/api/inventory/transactions` | None | Backend only |
| GET | `/api/dispatches` | None | Backend only |
| POST | `/api/dispatches` | JSON: `lines` (`productCode`, `quantity`), optional `sourceRfqId`, `customerName`, `customerPhone` | Backend only |

### Referral partners, RFQs, and rewards

| Method | Path | Query/body | Current storefront |
|---|---|---|---|
| POST | `/api/partners/register` | JSON: `name`, `phone`; optional `address`, `businessName`, `pincode`, `city`, `area`, `salesManager`, `documents` | Backend only |
| POST | `/api/partners` | Same partner JSON; creates an approved partner | Backend only |
| GET | `/api/partners` | Optional queries: `search`, `kyc_status`, `sales_manager` | Backend only |
| GET | `/api/partners/{partner_id}` | None | Backend only |
| PUT | `/api/partners/{partner_id}/kyc` | JSON: `approved`; optional `locationVerified`, `rejectionReason` | Backend only |
| GET | `/api/partners/{partner_id}/rewards` | None | Backend only |
| GET | `/api/rfqs` | Optional queries: `partner_id`, `status`, `search` | Backend only |
| POST | `/api/rfqs` | JSON: `partnerId`, `lines` (`productCode`, `quantity`), optional `deliveryMode`, `scheduledAt` | Backend only |
| PUT | `/api/rfqs/{rfq_id}` | Same body as RFQ create | Backend only |
| POST | `/api/rfqs/{rfq_id}/approve` | JSON: `approved`; optional `specialDiscountPercent`, `deliveryMode`, `scheduledAt` | Backend only |
| GET | `/api/rfqs/{rfq_id}/history` | None | Backend only |

### Money configuration and health

| Method | Path | Query/body | Current storefront |
|---|---|---|---|
| GET | `/api/money-config/{admin_id}` | None | Backend only |
| PUT | `/api/money-config/{admin_id}` | JSON: optional `discountPercent`, `gstPercent`, `specialDiscountPercent`, `showDiscount`, `showGst`, `showSpecialDiscount` | Backend only |
| GET | `/api/` | None | Backend only; useful health check |

## Not yet connected to the backend

The current storefront's authentication, profile, rewards, home category list, cart/checkout, and several screen data sources still use local mock data/services. Their screens do not currently call the matching FastAPI routes. In particular:

- Login/OTP does not call `/api/auth/admin/login` or `/api/auth/requester/register`.
- Rewards do not call `/api/partners/{partner_id}/rewards`.
- The home category list is local and does not call `/api/categories`.
- Cart and checkout do not submit `/api/rfqs` or call purchase/dispatch endpoints.
- Profile details are handled by `mockProfileService`.

The current Pipes & Fitting calls are direct browser `fetch()` requests. They do not send an `Authorization` header or bearer token. The FastAPI handlers in this repository currently use the response envelope described above; coordinate any auth requirement changes between frontend and backend.

## Backend route discovery

FastAPI's interactive docs (when the server is running):

```text
http://187.127.148.44/docs
http://187.127.148.44/openapi.json
```

To run the API locally from the repository root:

```powershell
Set-Location backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```
