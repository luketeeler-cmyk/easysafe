/* ------------------------------------------------------------------ */
/*  EasySafe – Database Type Definitions                              */
/* ------------------------------------------------------------------ */

/* ---------- Shared enums / union types ---------- */

export type FirearmCategory =
  | 'handgun'
  | 'rifle'
  | 'shotgun'
  | 'nfa_firearm';

export type NfaDesignation =
  | 'sbr'
  | 'sbs'
  | 'mg'
  | 'aow'
  | 'dd';

export type Condition =
  | 'new'
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor';

export type CasingMaterial =
  | 'brass'
  | 'steel'
  | 'aluminum'
  | 'nickel'
  | 'polymer'
  | 'other';

export type TaxStampStatus =
  | 'pending'
  | 'approved'
  | 'denied';

export type FeedType =
  | 'internal'
  | 'external';

export type PartCategory =
  | 'optic'
  | 'light'
  | 'laser'
  | 'grip'
  | 'stock'
  | 'muzzle_device'
  | 'rail'
  | 'trigger'
  | 'handguard'
  | 'bipod'
  | 'sling'
  | 'mount'
  | 'other';

/* ---------- Embedded value objects ---------- */

export interface PhotoEntry {
  id: string;
  url: string;
  storagePath: string;
}

/* ---------- Core entities ---------- */

export interface Firearm {
  id: string;
  user_id: string;
  make: string;
  model: string;
  serial: string;
  caliber: string;
  category: FirearmCategory;
  condition: Condition;
  barrel_length: string | null;
  feed_type: FeedType | null;
  internal_mag_capacity: number | null;
  purchase_date: string | null;
  price: number | null;
  storage_location: string | null;
  notes: string | null;
  photos: PhotoEntry[];

  /* NFA-specific fields (optional) */
  form4_date: string | null;
  tax_stamp_status: TaxStampStatus | null;
  trust_name: string | null;
  nfa_designation: NfaDesignation | null;

  created_at: string;
  updated_at: string;
}

export interface Ammunition {
  id: string;
  user_id: string;
  caliber: string;
  manufacturer: string;
  bullet_type: string | null;
  grain: number | null;
  casing_material: CasingMaterial | null;
  quantity: number;
  price: number | null;
  notes: string | null;
  photos: PhotoEntry[];
  created_at: string;
  updated_at: string;
}

export interface Suppressor {
  id: string;
  user_id: string;
  manufacturer: string;
  model: string;
  serial: string;
  calibers_rated: string[];
  length: string | null;
  diameter: string | null;
  weight: string | null;
  mount_type: string | null;
  form4_date: string | null;
  tax_stamp_status: TaxStampStatus | null;
  trust_name: string | null;
  purchase_date: string | null;
  price: number | null;
  notes: string | null;
  photos: PhotoEntry[];
  created_at: string;
  updated_at: string;
}

export interface Magazine {
  id: string;
  user_id: string;
  firearm_id: string | null;
  manufacturer: string | null;
  capacity: number;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartAttachment {
  id: string;
  user_id: string;
  parent_type: 'firearm' | 'suppressor';
  parent_id: string;
  name: string;
  type_category: PartCategory;
  manufacturer: string | null;
  model: string | null;
  serial: string | null;
  price: number | null;
  installed_date: string | null;
  notes: string | null;
  photos: PhotoEntry[];
  created_at: string;
  updated_at: string;
}

export interface RoundCount {
  id: string;
  user_id: string;
  parent_type: 'firearm' | 'suppressor';
  parent_id: string;
  count: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface TrustDocument {
  id: string;
  user_id: string;
  name: string;
  upload_date: string;
  notes: string | null;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}
