import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFirearmsStore } from '../../stores/firearmsStore';
import * as firearmService from '../../services/firearmService';
import { scrapeProduct, type ScrapedProduct } from '../../services/scrapeService';
import type {
  Firearm,
  FirearmCategory,
  Condition,
  FeedType,
  PhotoEntry,
} from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import { UrlScrapeInput } from '../../components/ui/UrlScrapeInput';
import { NfaFields } from './NfaFields';
import { GUN_DATA } from '../../data/gunData';
import { toast } from '../../components/ui/Toast';
import styles from './FirearmForm.module.css';

/* ------------------------------------------------------------------ */
/*  Category helpers                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_SINGULAR: Record<string, string> = {
  handgun: 'Handgun',
  rifle: 'Rifle',
  shotgun: 'Shotgun',
  nfa_firearm: 'NFA Firearm',
};

/* ------------------------------------------------------------------ */
/*  Select options                                                      */
/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS = [
  { value: 'handgun', label: 'Handgun' },
  { value: 'rifle', label: 'Rifle' },
  { value: 'shotgun', label: 'Shotgun' },
  { value: 'nfa_firearm', label: 'NFA Firearm' },
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const FEED_TYPE_OPTIONS = [
  { value: 'internal', label: 'Internal Magazine' },
  { value: 'external', label: 'Detachable Magazine' },
];

/* ------------------------------------------------------------------ */
/*  Initial state                                                       */
/* ------------------------------------------------------------------ */

interface FormState {
  make: string;
  model: string;
  serial: string;
  caliber: string;
  category: FirearmCategory | '';
  condition: Condition | '';
  barrel_length: string;
  storage_location: string;
  purchase_date: string;
  price: string;
  feed_type: FeedType | '';
  internal_mag_capacity: string;
  notes: string;
  photos: PhotoEntry[];
  /* NFA fields */
  nfa_designation: string;
  form4_date: string;
  tax_stamp_status: string;
  trust_name: string;
}

const INITIAL: FormState = {
  make: '',
  model: '',
  serial: '',
  caliber: '',
  category: '',
  condition: '',
  barrel_length: '',
  storage_location: '',
  purchase_date: '',
  price: '',
  feed_type: '',
  internal_mag_capacity: '',
  notes: '',
  photos: [],
  nfa_designation: '',
  form4_date: '',
  tax_stamp_status: '',
  trust_name: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const FirearmForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const isEdit = Boolean(id);
  const { addFirearm, updateFirearm } = useFirearmsStore();

  const [form, setForm] = useState<FormState>({ ...INITIAL });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [loadingFirearm, setLoadingFirearm] = useState(false);
  const [scraping, setScraping] = useState(false);

  /* Make/Model autocomplete data */
  const makes = useMemo(() => Object.keys(GUN_DATA), []);
  const models = useMemo(
    () => (form.make && GUN_DATA[form.make]) ? GUN_DATA[form.make] : [],
    [form.make],
  );

  /* Pre-set category from query params when creating new */
  useEffect(() => {
    if (!isEdit) {
      const cat = searchParams.get('category') as FirearmCategory | null;
      if (cat) {
        setForm((prev) => ({ ...prev, category: cat }));
      }
    }
  }, [isEdit, searchParams]);

  /* Load existing firearm for edit mode */
  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoadingFirearm(true);

    firearmService.getFirearm(id).then(({ data, error }) => {
      if (cancelled) return;
      setLoadingFirearm(false);

      if (error || !data) {
        toast.error('Failed to load firearm');
        navigate('/firearms');
        return;
      }

      setForm({
        make: data.make ?? '',
        model: data.model ?? '',
        serial: data.serial ?? '',
        caliber: data.caliber ?? '',
        category: data.category ?? '',
        condition: data.condition ?? '',
        barrel_length: data.barrel_length ?? '',
        storage_location: data.storage_location ?? '',
        purchase_date: data.purchase_date ?? '',
        price: data.price != null ? String(data.price) : '',
        feed_type: data.feed_type ?? '',
        internal_mag_capacity:
          data.internal_mag_capacity != null
            ? String(data.internal_mag_capacity)
            : '',
        notes: data.notes ?? '',
        photos: data.photos ?? [],
        nfa_designation: data.nfa_designation ?? '',
        form4_date: data.form4_date ?? '',
        tax_stamp_status: data.tax_stamp_status ?? '',
        trust_name: data.trust_name ?? '',
      });
    });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  /* ---- Field change helpers --------------------------------------- */

  const set = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors],
  );

  const setNfaField = useCallback(
    (field: string, value: string) => {
      set(field as keyof FormState, value);
    },
    [set],
  );

  /* ---- URL scrape handler ----------------------------------------- */

  const handleScrape = useCallback(
    async (url: string) => {
      setScraping(true);

      const { data, error } = await scrapeProduct(url);

      setScraping(false);

      if (error || !data) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't read that URL — please fill in manually",
        );
        return;
      }

      const scraped = data as ScrapedProduct;
      const filled: string[] = [];

      /* Map scraped name into make/model by splitting on first space group */
      if (scraped.name) {
        const parts = scraped.name.trim().split(/\s+/);
        if (parts.length >= 2) {
          setForm((prev) => ({
            ...prev,
            make: prev.make || parts[0],
            model: prev.model || parts.slice(1).join(' '),
          }));
          filled.push('Make', 'Model');
        } else {
          setForm((prev) => ({
            ...prev,
            make: prev.make || scraped.name || '',
          }));
          filled.push('Make');
        }
      }

      if (scraped.manufacturer) {
        setForm((prev) => ({
          ...prev,
          make: prev.make || scraped.manufacturer || '',
        }));
        if (!filled.includes('Make')) filled.push('Make');
      }

      if (scraped.model) {
        setForm((prev) => ({
          ...prev,
          model: prev.model || scraped.model || '',
        }));
        if (!filled.includes('Model')) filled.push('Model');
      }

      if (scraped.caliber) {
        setForm((prev) => ({
          ...prev,
          caliber: prev.caliber || scraped.caliber || '',
        }));
        filled.push('Caliber');
      }

      if (scraped.price != null) {
        setForm((prev) => ({
          ...prev,
          price: prev.price || String(scraped.price),
        }));
        filled.push('Price');
      }

      if (scraped.barrelLength) {
        setForm((prev) => ({
          ...prev,
          barrel_length: prev.barrel_length || scraped.barrelLength || '',
        }));
        filled.push('Barrel Length');
      }

      if (scraped.description) {
        setForm((prev) => ({
          ...prev,
          notes: prev.notes || scraped.description || '',
        }));
        filled.push('Notes');
      }

      if (filled.length > 0) {
        toast.success(`Filled: ${filled.join(', ')}`);
      } else {
        toast.error("Couldn't extract product data — please fill in manually");
      }
    },
    [],
  );

  /* ---- Validate --------------------------------------------------- */

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};

    if (!form.make.trim()) e.make = 'Make is required';
    if (!form.model.trim()) e.model = 'Model is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.feed_type) e.feed_type = 'Feed type is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---- Save ------------------------------------------------------- */

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    const payload: Partial<Firearm> = {
      make: form.make.trim(),
      model: form.model.trim(),
      serial: form.serial.trim(),
      caliber: form.caliber.trim(),
      category: form.category as FirearmCategory,
      condition: (form.condition as Condition) || 'good',
      barrel_length: form.barrel_length.trim() || null,
      storage_location: form.storage_location.trim() || null,
      purchase_date: form.purchase_date || null,
      price: form.price ? parseFloat(form.price) : null,
      feed_type: form.feed_type as FeedType,
      internal_mag_capacity:
        form.feed_type === 'internal' && form.internal_mag_capacity
          ? parseInt(form.internal_mag_capacity, 10)
          : null,
      notes: form.notes.trim() || null,
      photos: form.photos,
    };

    /* NFA fields */
    if (form.category === 'nfa_firearm') {
      payload.nfa_designation = (form.nfa_designation as Firearm['nfa_designation']) || null;
      payload.form4_date = form.form4_date || null;
      payload.tax_stamp_status = (form.tax_stamp_status as Firearm['tax_stamp_status']) || null;
      payload.trust_name = form.trust_name.trim() || null;
    }

    if (isEdit && id) {
      const { error } = await updateFirearm(id, payload);
      setSaving(false);

      if (error) {
        toast.error(`Save failed: ${error}`);
        return;
      }

      toast.success('Firearm updated');
      navigate(`/firearms/${id}`);
    } else {
      const { data, error } = await addFirearm(payload);
      setSaving(false);

      if (error || !data) {
        toast.error(`Save failed: ${error ?? 'Unknown error'}`);
        return;
      }

      toast.success('Firearm added');
      navigate(`/firearms/${data.id}`);
    }
  };

  /* ---- Derived ---------------------------------------------------- */

  const singularLabel = form.category
    ? CATEGORY_SINGULAR[form.category] ?? 'Firearm'
    : 'Firearm';

  /* ---- Loading state for edit ------------------------------------- */

  if (loadingFirearm) {
    return (
      <div className={styles.centered}>
        <Spinner size={32} />
      </div>
    );
  }

  /* ---- Render ----------------------------------------------------- */

  return (
    <form className={styles.page} onSubmit={handleSave} noValidate>
      <h1 className={styles.title}>
        {isEdit ? `Edit ${singularLabel}` : `Add ${singularLabel}`}
      </h1>

      {/* URL Scrape */}
      <UrlScrapeInput
        loading={scraping}
        onSubmit={handleScrape}
        onDataFetched={() => {}}
      />

      {/* Make/Model datalists */}
      <datalist id="make-options">
        {makes.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <datalist id="model-options">
        {models.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      {/* Main grid */}
      <div className={styles.grid}>
        <Input
          label="Make *"
          list="make-options"
          value={form.make}
          onChange={(e) => set('make', e.target.value)}
          error={errors.make}
          placeholder="e.g. Smith & Wesson"
          autoComplete="off"
        />
        <Input
          label="Model *"
          list="model-options"
          value={form.model}
          onChange={(e) => set('model', e.target.value)}
          error={errors.model}
          placeholder="e.g. M&P Shield"
          autoComplete="off"
        />

        <Input
          label="Serial Number"
          value={form.serial}
          onChange={(e) => set('serial', e.target.value)}
          placeholder="e.g. ABC12345"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
        <Input
          label="Caliber"
          value={form.caliber}
          onChange={(e) => set('caliber', e.target.value)}
          placeholder="e.g. 9mm"
        />

        <Select
          label="Category *"
          options={CATEGORY_OPTIONS}
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          error={errors.category}
          placeholder="Select category"
        />
        <Select
          label="Condition"
          options={CONDITION_OPTIONS}
          value={form.condition}
          onChange={(e) => set('condition', e.target.value)}
          placeholder="Select condition"
        />

        <Input
          label="Barrel Length"
          value={form.barrel_length}
          onChange={(e) => set('barrel_length', e.target.value)}
          placeholder='e.g. 4.25"'
        />
        <Input
          label="Storage Location"
          value={form.storage_location}
          onChange={(e) => set('storage_location', e.target.value)}
          placeholder="e.g. Safe A, Shelf 2"
        />

        <Input
          label="Purchase Date"
          type="date"
          value={form.purchase_date}
          onChange={(e) => set('purchase_date', e.target.value)}
        />
        <Input
          label="Price"
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={(e) => set('price', e.target.value)}
          placeholder="0.00"
        />

        <Select
          label="Feed Type *"
          options={FEED_TYPE_OPTIONS}
          value={form.feed_type}
          onChange={(e) => set('feed_type', e.target.value)}
          error={errors.feed_type}
          placeholder="Select feed type"
        />

        {form.feed_type === 'internal' && (
          <Input
            label="Internal Magazine Capacity"
            type="number"
            min="1"
            value={form.internal_mag_capacity}
            onChange={(e) => set('internal_mag_capacity', e.target.value)}
            placeholder="e.g. 5"
          />
        )}

        {form.feed_type === 'external' && (
          <div className={styles.infoField}>
            <p className={styles.infoText}>
              Manage detachable magazines from the detail page after saving.
            </p>
          </div>
        )}
      </div>

      {/* Notes - full width */}
      <Textarea
        label="Notes"
        value={form.notes}
        onChange={(e) => set('notes', e.target.value)}
        rows={4}
        placeholder="Any additional notes about this firearm..."
      />

      {/* NFA fields */}
      {form.category === 'nfa_firearm' && (
        <NfaFields
          values={{
            nfa_designation: form.nfa_designation,
            form4_date: form.form4_date,
            tax_stamp_status: form.tax_stamp_status,
            trust_name: form.trust_name,
          }}
          onChange={setNfaField}
        />
      )}

      {/* Photos */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Photos</h2>
        <PhotoUploader
          photos={form.photos}
          onPhotosChange={(photos) =>
            setForm((prev) => ({ ...prev, photos }))
          }
        />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={saving}
        >
          {isEdit ? `Save ${singularLabel}` : `Save ${singularLabel}`}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export { FirearmForm };
