# Snadai — Technical Project Recap

## 1. What this is

Snadai is a single-page React web app for a contemporary art gallery/auction house ("Curated Contemporary" / "Artsy"-styled copy appears in places). It lets visitors browse a catalog of artworks, save favorites, place bids in a live auction, submit their own art for curatorial review, and buy pieces through a cart → checkout → payment flow backed by Supabase for auth, data, and file storage.

It is a front-end-only client (no custom backend server) that talks directly to a Supabase project for auth, Postgres data, realtime, and storage.

## 2. Tech stack

- **React 19.2** (function components, hooks only, no class components)
- **Vite 8** as the build tool / dev server (`@vitejs/plugin-react`)
- **React Router DOM 7** (`BrowserRouter`, all routes declared in `src/App.jsx`)
- **Supabase JS SDK 2.116** (`@supabase/supabase-js`) — Auth, Postgres (via PostgREST), Realtime (Postgres change subscriptions), Storage
- **lucide-react** for icons
- **ESLint 10** with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`
- No CSS framework, no component library, no TypeScript, no test framework configured
- No state management library — auth state is the only global state (React Context); everything else is local component state or `localStorage`

Scripts (`package.json`): `dev`, `build`, `lint`, `preview` — standard Vite scaffolding.

## 3. Styling approach

There is no consistent styling system:
- Some components use **JS style objects** passed via the `style` prop (`Login.jsx`, `SignUp.jsx`, `resetpassword.jsx`, `Catalog.jsx`).
- Most later components (`Auction.jsx`, `Cart.jsx`, `Checkout.jsx`, `Payment.jsx`, `Profile.jsx`, `CollectorProfile.jsx`, `Submissions.jsx`, `ArtworkDetail.jsx`, `Home.jsx`, `About.jsx`, `Footer.jsx`) inject a `<style>{`...`}</style>` block directly into JSX with component-prefixed class names (`au-`, `cart-`, `ck-`, `pm-`, `cp-`, `sub-`, `ad-`, etc.) and hand-rolled responsive breakpoints (`@media (min-width: 768px)`, `@media (min-width: 1100px)`).
- Every page repeats its own header/nav/footer markup and CSS almost verbatim (same nav links array, same icon buttons) rather than sharing a layout component — only `Footer.jsx` is actually extracted as a shared component; a shared header/nav is not.
- Visual language: serif ("Times New Roman"/Georgia) for headings/editorial copy, sans ("Helvetica Neue"/Arial) for UI chrome, palette of near-black (`#1a1c1c`), warm gold accent (`#ac834b`), and off-white background (`#f9f9f9`).
- `src/App.css` is empty; `src/index.css` has minimal global resets (28 lines).

## 4. Routing (`src/App.jsx`)

All routes are flat (no nested routes, no route guards at the router level):

| Path | Component | Notes |
|---|---|---|
| `/` | `Login` | Also the app's default landing page |
| `/sign-up` | `SignUp` | |
| `/reset-password` | `ResetPassword` | Dual-mode: request link vs. set new password |
| `/privacy-policy` | ` PrivacyPolicy` | **Filename has a leading space**: `src/ PrivacyPolicy.jsx` |
| `/catalog` | `Catalog` | Artwork grid with filter/search |
| `/artwork/:id` | `ArtworkDetail` | |
| `/home-page` | `Home` | Marketing home page (not `/`) |
| `/auction` | `Auction` | Live bidding |
| `/about` | `About` | |
| `/exhibitions` | `Submissions` | Artist submission form (route path doesn't match component name) |
| `/collector-profile` | `CollectorProfile` | Saved/favorited artworks |
| `/cart` | `Cart` | |
| `/checkout` | `Checkout` | |
| `/payment` | `Payment` | |
| `/Profile` | `Profile` | **Capitalized path** — account/orders page |

`ScrollToTop` (a route-change listener using `useLocation`) is mounted once at the top of the tree to reset scroll position on navigation. `AuthProvider` wraps `AuthGateProvider` wraps the router's `Routes`, so both auth state and the "please log in" modal are available app-wide.

No route requires authentication to *view*; auth is instead enforced at the point of *action* (see §6).

## 5. Data model

### 5.1 Static/demo data
`src/ArtworkData.jsx` exports a hardcoded `artworks` array (17 items) with `id, title, medium, year, dimensions, price (string, e.g. "$10,000"), image (bundled asset), artist, artistLocation, note`. All artworks are attributed to a single artist, "Meng Long, Cambodia" (except the auction's featured lot, which is a separate hardcoded piece, "The Silence of Form" by "Elena Rossi", defined inline in `Auction.jsx`). This is placeholder/seed content, not a CMS or database table — the catalog, home page, artwork detail, and checkout all import this same array. Note item id 10 still has literal placeholder text: `"Your New Title Here"`, `"$X,XXX"`.

Prices are stored as formatted strings (`"$10,000"`) and parsed back to numbers via `Number(price.replace(/[^0-9.]/g, ""))` wherever arithmetic is needed (`Cart.jsx`, `Checkout.jsx`).

### 5.2 Supabase Postgres tables
Two SQL migration files under `supabase/migrations/` (meant to be pasted into the Supabase SQL editor — this project does not use the Supabase CLI migration runner in an automated way, judging by the `supabase/.temp/cli-latest` being the only CLI artifact present):

**`0001_create_bids_table.sql`**
- `public.bids(id uuid pk, lot_id text, user_id uuid fk→auth.users, bidder_name text, amount numeric check(>0), created_at timestamptz)`
- Index on `(lot_id, created_at desc)`
- Trigger `bids_check_amount` (via `check_bid_amount()` function, `security definer`) rejects any insert whose `amount` doesn't exceed the current max bid for that `lot_id` — server-side race-safe "must beat current bid" rule.
- RLS enabled: anyone can `select`; only `authenticated` users can `insert`, and only with `auth.uid() = user_id`.
- Adds `bids` to the `supabase_realtime` publication (idempotently) so bid inserts can be subscribed to live.

**`0002_secure_orders_favorites_submissions.sql`**
- Enables RLS on `orders`, `favorites`, `submissions` (these tables are assumed to already exist — no `create table` here, only policies).
- `orders`: authenticated users can `select`/`insert` their own rows (`auth.uid() = user_id`); **no update/delete policy**, i.e. orders are append-only/immutable once placed, even by their owner.
- `favorites`: owner can `select`/`insert`/`delete` their own rows.
- `submissions`: owner can `select`/`insert` their own rows.
- Storage policies on `storage.objects` for a `submissions` bucket: a user may `insert`/`select` only under a path prefixed with their own `auth.uid()` (i.e., files live at `${user.id}/${filename}`).

So the full expected schema is: `bids`, `orders`, `favorites`, `submissions` tables plus a `submissions` storage bucket — `orders`/`favorites`/`submissions` table *creation* isn't in these migrations, only their RLS policies, implying they were created manually or in a migration not present in this repo.

### 5.3 Client-side persistence
- **Cart**: not in Supabase — stored in `localStorage` under key `snadai_cart` via `src/cartStorage.js` (`getCartItems`, `addToCart`, `removeFromCart`). Cart survives reload but is per-browser, not per-account, and never syncs to the server until checkout hands it off via router state.
- **Favorites**: stored in Supabase `favorites` table (`src/favorites.js`), keyed by `user_id` + `artwork_id`; requires auth — returns `[]` for anonymous users.

## 6. Auth architecture

- `src/supabaseClient.js` creates the single Supabase client from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Vite env vars, see `.env.example`), logging a console error (not throwing) if missing.
- `src/authContexts.js` defines two raw `createContext`s: `AuthContext` and `AuthGateContext`.
- `src/AuthContext.jsx` (`AuthProvider`) loads the current session via `supabase.auth.getSession()` on mount and subscribes to `supabase.auth.onAuthStateChange`, exposing `{ session, user, loading }`.
- `src/useAuth.js` / `src/useAuthGate.js` are thin `useContext` hooks that throw if used outside their provider.
- **"Auth gate" pattern**: `src/AuthGate.jsx` (`AuthGateProvider`) renders a modal ("Join the Collection" — log in / sign up prompt) that any component can trigger via `requestAuth()`. `src/useRequireAuth.js` wraps this into a single helper:
  ```js
  const requireAuth = useRequireAuth();
  requireAuth(() => doProtectedThing());
  ```
  If there's a logged-in user, the callback runs immediately; otherwise the modal opens and the callback is dropped. This is the mechanism used everywhere instead of route guards — e.g. adding to cart, favoriting, bidding, checking out, submitting art, and opening the account/collector pages all funnel through `requireAuth`.
- `Profile.jsx` and `CollectorProfile.jsx` additionally have a `useEffect` that redirects to `/home-page` and calls `requestAuth()` if `!loading && !user` — so unlike the rest of the app, these two pages *do* act like protected routes (soft redirect) once auth state resolves, on top of being wrapped by `requireAuth` elsewhere.
- Supabase Auth is used directly (email+password): `signUp`, `signInWithPassword`, `resetPasswordForEmail`, `updateUser` (for password reset and for editing email/shipping address in `Profile.jsx`), `signOut`, and `onAuthStateChange` listening for the `PASSWORD_RECOVERY` event to switch `resetpassword.jsx` from "request" to "update" mode.
- No social/OAuth login despite `Login.jsx`'s legal copy mentioning "Apple, Google, or Facebook" — that text (and an "Artsy" Terms link) appears to be leftover template copy, not implemented functionality.

## 7. Feature walkthroughs

### Catalog (`Catalog.jsx`)
Client-side filtering only (no pagination/server query): a medium checkbox filter (`Oil` / `Mixed Media`, single-select toggle) combined with a text search (`searchArtworks.js`'s `artworkMatchesQuery`, a case-insensitive substring match across title/artist/medium/location/price/dimensions/year). Favorite state is loaded once per `user` change. Clicking a card or "Purchase" navigates to `/artwork/:id`.

### Artwork Detail (`ArtworkDetail.jsx`)
Looks up the artwork by numeric `id` from the static array. "Add to Cart" writes to `localStorage` then routes to `/cart`; "Purchase" routes straight to `/checkout` with a single-item cart passed via router `state` (bypassing the persisted cart entirely — the two purchase paths, cart-based and direct, are independent). Shows up to 4 "related works" (simply the other artworks in the array, not a real recommendation engine) and a generic artist bio block.

### Auction (`Auction.jsx`)
Single hardcoded lot (`LOT_ID = "lot-042"`, `STARTING_BID = RESERVE_PRICE = 15000`). A local countdown timer (`setInterval`, purely client-side and resets on refresh — not tied to a real deadline in the DB) starts at 4h22m12s. Bids load from `public.bids` filtered by `lot_id`, newest-first, limited to 10, and the component subscribes to a Supabase Realtime channel (`postgres_changes`, `INSERT` on `bids`) to append new bids live from any client. Placing a bid inserts a row with the current user's id/display name; the DB trigger enforces the "must exceed current highest bid" rule (client also does basic validation: non-empty, finite, > 0 — the real economic guarantee lives in Postgres, not the client).

### Cart / Checkout / Payment (multi-step flow)
1. `Cart.jsx` reads `localStorage` cart, computes `subtotal + SHIPPING_COST ($1,250 flat)`, and on "Go to Checkout" passes `cartItems` via router `state` to `/checkout` (gated by `requireAuth`).
2. `Checkout.jsx` collects shipping info (name/address/city/country, pre-filled with hardcoded sample defaults) and a "White Glove Installation" checkbox (visual only — doesn't change price). Falls back to a hardcoded `sampleCartItems` if opened without router state (e.g. direct navigation/refresh). Submits by pushing the whole order draft (shipping info + totals) to `/payment` via router `state`.
3. `Payment.jsx` collects card number/expiry/CVC and billing address fields, but **there is no real payment processor integration** (no Stripe/PayPal SDK) — submitting simply validates the three card fields are non-empty and does `supabase.from("orders").insert(...)` with `status: "paid"` directly. This is a mocked/demo checkout: entering any non-empty card details "pays" successfully. On success, navigates to `/collector-profile`.

This is an important gap to flag for documentation/stakeholders: **payment is simulated, not integrated with a real processor**, and no server-side validation of amounts happens before marking an order "paid".

### Profile (`Profile.jsx`)
Shows the logged-in user's email (editable, triggers Supabase email-change confirmation flow) and a "shipping residence" stored in `user_metadata.shipping_address` (editable via `supabase.auth.updateUser({ data })`). Fetches `orders` for the user and flattens each order's `items` array into a purchase history list. Also renders three cosmetic account-setting checkboxes (email notifications, marketing, 2FA) that are **not wired to anything** — `defaultChecked` only, no `onChange`, no persistence. Includes logout.

### Collector Profile (`CollectorProfile.jsx`)
Lists artworks whose `id` is in the user's favorites (joined against the static `artworks` array client-side). Soft-redirects unauthenticated users to `/home-page`.

### Submissions (`Submissions.jsx`)
Artist-submission form (name, email, statement, artwork title/medium/dimensions/year) plus a drag-and-drop / click-to-browse multi-file uploader with live image previews (`URL.createObjectURL`, properly revoked on unmount/change via `useEffect` cleanup). On submit: uploads each file to the Supabase Storage `submissions` bucket at `${user.id}/${timestamp}-${filename}`, then inserts one row into `public.submissions` with the form fields and a comma-joined list of the uploaded file paths (`file_path` is a single text column, not a relational file list).

### Home (`Home.jsx`)
Marketing landing page — hero, search (same `artworkMatchesQuery` filter as Catalog), curated collections grid, and an "auction preview" link (`handleViewPreview`) that fakes a 300ms loading transition (`setAuctionLinkFilled`) before navigating to `/auction` — purely cosmetic, not tied to real data loading.

### About / Privacy Policy
Static informational pages (mission/story copy, contact block); `PrivacyPolicy.jsx` is the simplest page (no local state beyond nav).

## 8. Notable quirks / tech debt worth knowing before writing docs

- **Filename with a leading space**: `src/ PrivacyPolicy.jsx` (imported everywhere as `from './ PrivacyPolicy'`). Works, but fragile/easy to break with tooling that trims whitespace.
- **Inconsistent route casing/naming**: `/Profile` (capitalized) vs. lowercase everywhere else; `/exhibitions` renders the `Submissions` component; `/home-page` is the "home" route while `/` is the login screen.
- **No shared header/layout component** — every page hand-duplicates the same nav bar markup, styles, and `navLinks` array (10+ copies), which is the single biggest maintenance risk in the codebase (a nav change means editing ~10 files).
- **Payment is a stub**: no real processor; any non-empty card fields succeed and immediately mark the order `"paid"` in the DB.
- **Cart is per-browser (`localStorage`), not per-account** — doesn't merge/sync on login, doesn't clear after a successful order.
- **Auction countdown is fake/local** — resets every page load, not backed by a real end-time column.
- **Placeholder content still in place**: artwork id 10 ("Your New Title Here" / "$X,XXX"), sample checkout defaults hardcoded to a specific name/address ("Hor kimly", Phnom Penh), Login page's legal copy references "Artsy" and social logins that don't exist.
- **Two Postgres migrations describe partial schema**: `orders`, `favorites`, `submissions` tables are policy-only (RLS) in the repo — their `create table` statements aren't checked in, so the full schema can't be reconstructed from this repo alone.
- **Account settings toggles in `Profile.jsx` are non-functional UI** (no state wiring).
- No automated tests, no CI config, and no TypeScript — everything is JS + PropTypes-free.
- `dist/` (a built output) is checked into the working tree alongside source, which is typically gitignored — worth confirming whether this project intends to track build output (this repo also isn't a git repository as of this recap).

## 9. Environment / setup

Required env vars (`.env`, see `.env.example`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
Standard Vite dev flow: `npm install`, `npm run dev`. Supabase-side setup requires running both SQL files in `supabase/migrations/` against the target project (plus manually creating `orders`/`favorites`/`submissions` tables and a `submissions` storage bucket, since their `CREATE TABLE`/bucket-creation statements are not present in this repo).
