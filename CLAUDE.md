# EasySafe – Claude Code Instructions

## Project Overview

EasySafe is a **Vite + React + TypeScript** single-page application for managing firearms, ammunition, suppressors, and NFA trust documents. It uses **HashRouter** for client-side routing and **Supabase** for authentication, database, and file storage.

The app is deployed to **Vercel** via automatic deploys triggered by pushes to the `main` branch of `luketeeler-cmyk/easysafe`. Do **NOT** use GitHub Pages or the old `EasySafe.html` single-file approach — that architecture is deprecated.

## Live URL

**Vercel Production:** `https://easysafe-luketeeler-cmyks-projects.vercel.app`
(Note: Vercel deployment protection may be enabled — check Vercel dashboard if you get a 401.)

**Legacy GitHub Pages (deprecated):** `https://luketeeler-cmyk.github.io/easysafe/`

## Credentials & Config

| Key | Value |
|---|---|
| **GitHub Repo** | `luketeeler-cmyk/easysafe` |
| **GitHub Token** | Ask Luke — starts with `ghp_w83A`, has repo write access. Store as env var `GITHUB_TOKEN`. |
| **Supabase URL** | `https://cngrtzoyncmxfcakesio.supabase.co` |
| **Supabase Anon Key** | `sb_publishable_nwCsqQ46vrd3HElgzNoP5Q_qPVHB49d` |

Supabase credentials are hardcoded in `src/config/supabase.ts` (no `.env` files). This is safe because Row Level Security (RLS) policies enforce per-user data isolation. The anon key only grants access through RLS.

## Project Structure

```
src/
├── App.tsx                     # Root router — all routes defined here
├── main.tsx                    # React entry point
├── config/
│   └── supabase.ts             # Supabase client initialization
├── types/
│   ├── index.ts                # Re-exports
│   └── database.ts             # All database type definitions
├── styles/
│   ├── variables.css           # Design tokens (colors, fonts, spacing)
│   ├── global.css              # Global reset, typography, animations
│   └── forms.css               # Shared form & button styles
├── stores/                     # Zustand state management
│   ├── authStore.ts
│   ├── firearmsStore.ts
│   ├── ammunitionStore.ts
│   ├── suppressorsStore.ts
│   ├── magazinesStore.ts
│   ├── partsStore.ts
│   ├── roundCountsStore.ts
│   └── trustDocumentsStore.ts
├── hooks/
│   ├── useAuth.ts              # Auth store convenience wrapper
│   ├── useSearch.ts            # Generic search/filter/sort hook
│   └── usePhotoUpload.ts       # Photo upload with compression
├── services/                   # Supabase CRUD operations
│   ├── firearmService.ts
│   ├── ammunitionService.ts
│   ├── suppressorService.ts
│   ├── magazineService.ts
│   ├── partsService.ts
│   ├── roundCountService.ts
│   ├── photoService.ts         # Image compression & signed URL upload
│   ├── trustDocumentService.ts
│   └── scrapeService.ts
├── data/
│   └── gunData.ts              # Make/Model autocomplete data
├── components/
│   ├── auth/                   # Auth screens (LoginScreen, SignIn/Up, OTP, etc.)
│   ├── layout/
│   │   ├── Layout.tsx          # Root layout with <Outlet/>
│   │   ├── Header.tsx          # Top bar with logo & sign out
│   │   └── CategoryNav.tsx     # Main navigation tabs
│   └── ui/                     # Reusable UI (Button, Input, Modal, Toast, etc.)
├── pages/
│   ├── dashboard/
│   │   ├── Dashboard.tsx       # Homepage dashboard with stats & r/gundeals feed
│   │   └── Dashboard.module.css
│   ├── firearms/
│   │   ├── FirearmList.tsx
│   │   ├── FirearmForm.tsx
│   │   ├── FirearmDetail.tsx
│   │   ├── NfaFields.tsx
│   │   └── tabs/               # Sub-tabs (AvailableAmmo, Magazines, Parts, RoundCount)
│   ├── ammunition/
│   │   ├── AmmunitionList.tsx
│   │   ├── AmmunitionForm.tsx
│   │   └── AmmunitionDetail.tsx
│   ├── suppressors/
│   │   ├── SuppressorList.tsx
│   │   ├── SuppressorForm.tsx
│   │   └── SuppressorDetail.tsx
│   └── trust/
│       ├── TrustDocumentList.tsx
│       └── TrustDocumentForm.tsx
```

## Architecture Notes

- **Routing:** React Router v6 `HashRouter` — all routes use `#/` prefix
- **Auth:** Supabase OTP (email → 6-digit code → set password). Auth state managed in `authStore.ts`
- **Data isolation:** All Supabase tables enforce `user_id` via RLS policies
- **State management:** Zustand stores with `{items[], loading, error}` pattern
- **No build output committed** — Vercel builds from source on each push
- **No `.env` files** — Supabase config is hardcoded in `src/config/supabase.ts`
- **CSS Modules** — each component has a `.module.css` file for scoped styles
- **Photos:** uploaded to Supabase Storage bucket `item-photos`, compressed client-side (max 1MB, 1400px), with 10-year signed URLs

## How to Deploy

### Standard deploy (push to main)

```bash
git add <files>
git commit -m "Describe your change"
git push origin main
```

Vercel automatically builds and deploys on every push to `main`. The build runs `tsc -b && vite build`.

### Verify deployment

1. Check the Vercel dashboard at https://vercel.com for build status
2. Or check GitHub commit status checks on the repo
3. Deployment typically completes within 30–60 seconds of push

## Database Schema

### `firearms` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users, RLS enforced |
| `make` | text | Manufacturer name |
| `model` | text | Model name |
| `serial` | text | Serial number |
| `caliber` | text | Caliber string |
| `category` | text | `handgun`, `rifle`, `shotgun`, `nfa_firearm` |
| `condition` | text | `new`, `excellent`, `good`, `fair`, `poor` |
| `barrel_length` | text | Nullable |
| `feed_type` | text | `internal`, `external` — nullable |
| `internal_mag_capacity` | integer | Nullable |
| `purchase_date` | text | ISO date string, nullable |
| `price` | numeric | Dollar value, nullable |
| `storage_location` | text | Nullable |
| `notes` | text | Nullable |
| `photos` | jsonb | Array of `{id, url, storagePath}` objects |
| `form4_date` | text | NFA only, nullable |
| `tax_stamp_status` | text | `pending`, `approved`, `denied` — nullable |
| `trust_name` | text | NFA only, nullable |
| `nfa_designation` | text | `sbr`, `sbs`, `mg`, `aow`, `dd` — nullable |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-set |

### `ammunition` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | RLS enforced |
| `caliber` | text | |
| `manufacturer` | text | |
| `bullet_type` | text | Nullable |
| `grain` | integer | Nullable |
| `casing_material` | text | `brass`, `steel`, `aluminum`, `nickel`, `polymer`, `other` — nullable |
| `quantity` | integer | Round count |
| `price` | numeric | Nullable |
| `notes` | text | Nullable |
| `photos` | jsonb | Array of `{id, url, storagePath}` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `suppressors` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | RLS enforced |
| `manufacturer` | text | |
| `model` | text | |
| `serial` | text | |
| `calibers_rated` | text[] | Array of caliber strings |
| `length` | text | Nullable |
| `diameter` | text | Nullable |
| `weight` | text | Nullable |
| `mount_type` | text | Nullable |
| `form4_date` | text | Nullable |
| `tax_stamp_status` | text | Nullable |
| `trust_name` | text | Nullable |
| `purchase_date` | text | Nullable |
| `price` | numeric | Nullable |
| `notes` | text | Nullable |
| `photos` | jsonb | Array of `{id, url, storagePath}` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `trust_documents` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | RLS enforced |
| `name` | text | Document name |
| `upload_date` | text | |
| `notes` | text | Nullable |
| `file_path` | text | Storage path |
| `file_size` | integer | Bytes |
| `file_type` | text | MIME type |
| `created_at` | timestamptz | |

### `magazines` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | RLS enforced |
| `firearm_id` | uuid | FK to firearms, nullable |
| `manufacturer` | text | Nullable |
| `capacity` | integer | |
| `quantity` | integer | |
| `notes` | text | Nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `parts_attachments` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | RLS enforced |
| `parent_type` | text | `firearm` or `suppressor` |
| `parent_id` | uuid | FK to parent table |
| `name` | text | Part name |
| `type_category` | text | `optic`, `light`, `laser`, `grip`, `stock`, `muzzle_device`, `rail`, `trigger`, `handguard`, `bipod`, `sling`, `mount`, `other` |
| `manufacturer` | text | Nullable |
| `model` | text | Nullable |
| `serial` | text | Nullable |
| `price` | numeric | Nullable |
| `installed_date` | text | Nullable |
| `notes` | text | Nullable |
| `photos` | jsonb | Nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `round_counts` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | RLS enforced |
| `parent_type` | text | `firearm` or `suppressor` |
| `parent_id` | uuid | FK to parent table |
| `count` | integer | Rounds fired in this entry |
| `date` | text | Date of session |
| `notes` | text | Nullable |
| `created_at` | timestamptz | |

## Design System

### Palette
- **Background:** `--bg: #C5B9A1` (warm beige)
- **Surface:** `--surface: #D4C9B3`, `--surface2: #CCC0AA`
- **Primary (Olive Drab):** `--od: #4B5320`, `--od-light: #5C6630`, `--od-dark: #3A4218`
- **Text:** `--text: #3A3226`, `--text-bright: #2A2418`, `--text-dim: #6B6052`
- **Border:** `rgba(75, 83, 32, 0.25)` / `rgba(75, 83, 32, 0.45)`
- **No blue tones anywhere** (low blue-light by design)

### Condition Colors
| Condition | Color |
|---|---|
| New | `#4A7A4A` |
| Excellent | `#5A8A3A` |
| Good | `#7A8A2A` |
| Fair | `#8A7A2A` |
| Poor | `#8B3A2A` |

### Typography
- **UI text:** `Barlow` (var `--font-sans`)
- **Serial numbers / monospaced:** `JetBrains Mono` (var `--font-mono`)

### Radius & Shadows
- `--radius: 8px`, `--radius-lg: 12px`
- `--shadow: 0 2px 8px rgba(0,0,0,0.08)`

## Common Patterns

### Add a new page
1. Create component in `src/pages/<feature>/<PageName>.tsx`
2. Create corresponding `<PageName>.module.css`
3. Add route in `src/App.tsx` inside the `<Route element={<Layout />}>` block
4. Add nav item in `src/components/layout/CategoryNav.tsx` in the `TABS` array

### Add a new form field
1. Add column to the Supabase table (via Supabase dashboard)
2. Add the field type to the interface in `src/types/database.ts`
3. Add the form input in the relevant `*Form.tsx` component
4. Add the field to the submit handler's data object
5. Add display of the field in the relevant `*Detail.tsx` component

### Add a new Supabase table
1. Create the table in Supabase dashboard with RLS policies (`user_id = auth.uid()`)
2. Add the TypeScript interface in `src/types/database.ts`
3. Create a service file in `src/services/` following existing patterns
4. Create a Zustand store in `src/stores/` following existing patterns
5. Create page components in `src/pages/`

## After Any Code Change

1. **Build locally** to check for TypeScript errors:
   ```bash
   npm run build
   ```
   This runs `tsc -b && vite build`. Fix all errors before pushing.

2. **Push to main:**
   ```bash
   git add <files>
   git commit -m "Describe change"
   git push origin main
   ```

3. **Verify Vercel deployment** completes successfully via the Vercel dashboard or GitHub commit status checks.
