import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuppressorsStore } from '../../stores/suppressorsStore';
import type { Suppressor, TaxStampStatus } from '../../types';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatsBar } from '../../components/ui/StatsBar';
import { SortableTable } from '../../components/ui/SortableTable';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import styles from './SuppressorList.module.css';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const SEARCH_FIELDS: (keyof Suppressor)[] = [
  'manufacturer',
  'model',
  'serial',
  'notes',
];

function matchesSearch(item: Suppressor, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return SEARCH_FIELDS.some((key) => {
    const val = item[key];
    return typeof val === 'string' && val.toLowerCase().includes(q);
  });
}

function sortSuppressors(
  list: Suppressor[],
  field: string,
  dir: 'asc' | 'desc',
): Suppressor[] {
  return [...list].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

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
}

const fmtCurrency = (val: number | null | undefined): string => {
  if (val == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

const STAMP_BADGE_VARIANT: Record<TaxStampStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const SuppressorList: React.FC = () => {
  const navigate = useNavigate();
  const { suppressors, loading, error, fetchSuppressors } = useSuppressorsStore();

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('manufacturer');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchSuppressors();
  }, [fetchSuppressors]);

  const filtered = useMemo(
    () =>
      sortSuppressors(
        suppressors.filter((s) => matchesSearch(s, search)),
        sortField,
        sortDir,
      ),
    [suppressors, search, sortField, sortDir],
  );

  const totalValue = useMemo(
    () => filtered.reduce((sum, s) => sum + (s.price ?? 0), 0),
    [filtered],
  );

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

  const columns = useMemo(
    () => [
      { key: 'manufacturer', label: 'Manufacturer', sortable: true },
      { key: 'model', label: 'Model', sortable: true },
      {
        key: 'serial',
        label: 'Serial',
        sortable: false,
        render: (s: Suppressor) => (
          <span className={styles.mono}>{s.serial || '--'}</span>
        ),
      },
      {
        key: 'calibers_rated',
        label: 'Calibers',
        sortable: false,
        render: (s: Suppressor) =>
          s.calibers_rated && s.calibers_rated.length > 0
            ? s.calibers_rated.join(', ')
            : '--',
      },
      {
        key: 'mount_type',
        label: 'Mount Type',
        sortable: false,
        render: (s: Suppressor) => s.mount_type || '--',
      },
      {
        key: 'tax_stamp_status',
        label: 'Tax Stamp',
        sortable: false,
        render: (s: Suppressor) => {
          if (!s.tax_stamp_status) return '--';
          const variant = STAMP_BADGE_VARIANT[s.tax_stamp_status];
          return (
            <Badge variant={variant}>
              {s.tax_stamp_status.charAt(0).toUpperCase() + s.tax_stamp_status.slice(1)}
            </Badge>
          );
        },
      },
      {
        key: 'price',
        label: 'Value',
        sortable: true,
        render: (s: Suppressor) => fmtCurrency(s.price),
      },
    ],
    [],
  );

  /* ---- Loading state ---------------------------------------------- */
  if (loading && suppressors.length === 0) {
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
        <p className={styles.error}>Failed to load suppressors: {error}</p>
      </div>
    );
  }

  /* ---- Main render ------------------------------------------------ */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Suppressors</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/suppressors/new')}
        >
          + Add Suppressor
        </Button>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search suppressors..."
      />

      {/* Stats */}
      <StatsBar
        stats={[
          { label: 'Total Count', value: filtered.length },
          { label: 'Total Value', value: fmtCurrency(totalValue) },
        ]}
      />

      {/* Table or empty state */}
      {filtered.length === 0 && !loading ? (
        <EmptyState
          title={search ? 'No matches found' : 'No suppressors yet'}
          description={
            search
              ? 'Try adjusting your search terms.'
              : 'Add your first suppressor!'
          }
          action={
            !search ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/suppressors/new')}
              >
                + Add Suppressor
              </Button>
            ) : undefined
          }
        />
      ) : (
        <SortableTable<Suppressor & Record<string, unknown>>
          columns={columns}
          data={filtered as (Suppressor & Record<string, unknown>)[]}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={(s) => navigate(`/suppressors/${s.id}`)}
        />
      )}
    </div>
  );
};

export { SuppressorList };
