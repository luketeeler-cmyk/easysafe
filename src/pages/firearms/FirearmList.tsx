import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useFirearmsStore } from '../../stores/firearmsStore';
import type { Firearm, FirearmCategory } from '../../types';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatsBar } from '../../components/ui/StatsBar';
import { SortableTable } from '../../components/ui/SortableTable';
import { ConditionBadge } from '../../components/ui/ConditionBadge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import styles from './FirearmList.module.css';

/* ------------------------------------------------------------------ */
/*  Category display helpers                                            */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  handgun: 'Handguns',
  rifle: 'Rifles',
  shotgun: 'Shotguns',
  nfa_firearm: 'NFA Firearms',
};

const CATEGORY_SINGULAR: Record<string, string> = {
  handgun: 'Handgun',
  rifle: 'Rifle',
  shotgun: 'Shotgun',
  nfa_firearm: 'NFA Firearm',
};

/* ------------------------------------------------------------------ */
/*  Search helper                                                       */
/* ------------------------------------------------------------------ */

const SEARCH_KEYS: (keyof Firearm)[] = [
  'make',
  'model',
  'serial',
  'caliber',
  'notes',
  'storage_location',
];

function matchesSearch(firearm: Firearm, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return SEARCH_KEYS.some((key) => {
    const val = firearm[key];
    return typeof val === 'string' && val.toLowerCase().includes(q);
  });
}

/* ------------------------------------------------------------------ */
/*  Sort helper                                                         */
/* ------------------------------------------------------------------ */

function sortFirearms(
  list: Firearm[],
  field: string,
  dir: 'asc' | 'desc',
): Firearm[] {
  const sorted = [...list].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    if (field === 'price') {
      aVal = a.price ?? 0;
      bVal = b.price ?? 0;
    } else {
      aVal = String((a as any)[field] ?? '').toLowerCase();
      bVal = String((b as any)[field] ?? '').toLowerCase();
    }

    if (aVal < bVal) return dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return dir === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/* ------------------------------------------------------------------ */
/*  Currency formatter                                                  */
/* ------------------------------------------------------------------ */

const fmtCurrency = (val: number | null | undefined): string => {
  if (val == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const FirearmList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = (searchParams.get('category') as FirearmCategory) || undefined;

  const { firearms, loading, error, fetchFirearms } = useFirearmsStore();

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('make');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* Fetch on mount + category change */
  useEffect(() => {
    fetchFirearms(category);
  }, [category, fetchFirearms]);

  /* Filter + sort */
  const filtered = useMemo(
    () => sortFirearms(firearms.filter((f) => matchesSearch(f, search)), sortField, sortDir),
    [firearms, search, sortField, sortDir],
  );

  /* Stats */
  const totalValue = useMemo(
    () => filtered.reduce((sum, f) => sum + (f.price ?? 0), 0),
    [filtered],
  );

  /* Sort handler */
  const handleSort = useCallback(
    (key: string) => {
      if (key === sortField) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(key);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  /* Table columns */
  const columns = useMemo(
    () => [
      {
        key: 'photo',
        label: '',
        sortable: false,
        width: '56px',
        render: (f: Firearm) =>
          f.photos && f.photos.length > 0 ? (
            <img
              src={f.photos[0].url}
              alt={`${f.make} ${f.model}`}
              className={styles.thumb}
            />
          ) : (
            <span className={styles.thumbPlaceholder}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
          ),
      },
      { key: 'make', label: 'Make', sortable: true },
      { key: 'model', label: 'Model', sortable: true },
      { key: 'caliber', label: 'Caliber', sortable: true },
      {
        key: 'serial',
        label: 'Serial',
        sortable: false,
        render: (f: Firearm) => (
          <span className={styles.mono}>{f.serial || '--'}</span>
        ),
      },
      {
        key: 'condition',
        label: 'Condition',
        sortable: false,
        render: (f: Firearm) =>
          f.condition ? <ConditionBadge condition={f.condition} /> : '--',
      },
      {
        key: 'price',
        label: 'Value',
        sortable: true,
        render: (f: Firearm) => fmtCurrency(f.price),
      },
    ],
    [],
  );

  /* Derived labels */
  const pluralLabel = category ? CATEGORY_LABELS[category] : 'Firearms';
  const singularLabel = category ? CATEGORY_SINGULAR[category] : 'Firearm';

  /* ---- Loading state ---------------------------------------------- */
  if (loading && firearms.length === 0) {
    return (
      <div className={styles.centered}>
        <Spinner size={32} />
      </div>
    );
  }

  /* ---- Error state ------------------------------------------------ */
  if (error) {
    return (
      <div className={styles.centered}>
        <p className={styles.error}>Failed to load firearms: {error}</p>
      </div>
    );
  }

  /* ---- Main render ------------------------------------------------ */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{pluralLabel}</h1>
        <Link
          to={`/firearms/new${category ? `?category=${category}` : ''}`}
          className={styles.addLink}
        >
          <Button variant="primary" size="sm">
            + Add {singularLabel}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={`Search ${pluralLabel.toLowerCase()}...`}
      />

      {/* Stats */}
      <StatsBar
        stats={[
          { label: 'Items', value: filtered.length },
          { label: 'Total Value', value: fmtCurrency(totalValue) },
        ]}
      />

      {/* Table or empty state */}
      {filtered.length === 0 && !loading ? (
        <EmptyState
          title={search ? 'No matches found' : `No ${pluralLabel.toLowerCase()} yet`}
          description={
            search
              ? 'Try adjusting your search terms.'
              : `Add your first ${singularLabel.toLowerCase()}!`
          }
          action={
            !search ? (
              <Link to={`/firearms/new${category ? `?category=${category}` : ''}`}>
                <Button variant="primary" size="sm">
                  + Add {singularLabel}
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <SortableTable<Firearm & Record<string, unknown>>
          columns={columns}
          data={filtered as (Firearm & Record<string, unknown>)[]}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={(f) => navigate(`/firearms/${f.id}`)}
        />
      )}
    </div>
  );
};

export { FirearmList };
