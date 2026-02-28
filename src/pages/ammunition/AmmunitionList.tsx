import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAmmunitionStore } from '../../stores/ammunitionStore';
import type { Ammunition } from '../../types';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatsBar } from '../../components/ui/StatsBar';
import { SortableTable } from '../../components/ui/SortableTable';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import styles from './AmmunitionList.module.css';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const SEARCH_FIELDS: (keyof Ammunition)[] = [
  'caliber',
  'manufacturer',
  'bullet_type',
  'notes',
];

function matchesSearch(item: Ammunition, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return SEARCH_FIELDS.some((key) => {
    const val = item[key];
    return typeof val === 'string' && val.toLowerCase().includes(q);
  });
}

function sortAmmunition(
  list: Ammunition[],
  field: string,
  dir: 'asc' | 'desc',
): Ammunition[] {
  return [...list].sort((a, b) => {
    const numericFields = ['grain', 'quantity', 'price'];
    let aVal: string | number;
    let bVal: string | number;

    if (numericFields.includes(field)) {
      aVal = (a as any)[field] as number ?? 0;
      bVal = (b as any)[field] as number ?? 0;
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

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const AmmunitionList: React.FC = () => {
  const navigate = useNavigate();
  const { ammunition, loading, error, fetchAmmunition } = useAmmunitionStore();

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('caliber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchAmmunition();
  }, [fetchAmmunition]);

  const filtered = useMemo(
    () =>
      sortAmmunition(
        ammunition.filter((a) => matchesSearch(a, search)),
        sortField,
        sortDir,
      ),
    [ammunition, search, sortField, sortDir],
  );

  const totalRounds = useMemo(
    () => filtered.reduce((sum, a) => sum + (a.quantity ?? 0), 0),
    [filtered],
  );

  const totalValue = useMemo(
    () => filtered.reduce((sum, a) => sum + (a.price ?? 0), 0),
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
      { key: 'caliber', label: 'Caliber', sortable: true },
      { key: 'manufacturer', label: 'Manufacturer', sortable: true },
      { key: 'bullet_type', label: 'Bullet Type', sortable: false },
      { key: 'grain', label: 'Grain', sortable: true },
      {
        key: 'casing_material',
        label: 'Casing',
        sortable: false,
        render: (a: Ammunition) =>
          a.casing_material
            ? a.casing_material.charAt(0).toUpperCase() + a.casing_material.slice(1)
            : '--',
      },
      {
        key: 'quantity',
        label: 'Quantity',
        sortable: true,
        render: (a: Ammunition) => a.quantity.toLocaleString(),
      },
      {
        key: 'price',
        label: 'Price',
        sortable: true,
        render: (a: Ammunition) => fmtCurrency(a.price),
      },
    ],
    [],
  );

  /* ---- Loading state ---------------------------------------------- */
  if (loading && ammunition.length === 0) {
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
        <p className={styles.error}>Failed to load ammunition: {error}</p>
      </div>
    );
  }

  /* ---- Main render ------------------------------------------------ */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Ammunition</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/ammunition/new')}
        >
          + Add Ammunition
        </Button>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search ammunition..."
      />

      {/* Stats */}
      <StatsBar
        stats={[
          { label: 'Total Entries', value: filtered.length },
          { label: 'Total Rounds', value: totalRounds.toLocaleString() },
          { label: 'Total Value', value: fmtCurrency(totalValue) },
        ]}
      />

      {/* Table or empty state */}
      {filtered.length === 0 && !loading ? (
        <EmptyState
          title={search ? 'No matches found' : 'No ammunition in your inventory yet'}
          description={
            search
              ? 'Try adjusting your search terms.'
              : 'Add your first ammunition entry!'
          }
          action={
            !search ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/ammunition/new')}
              >
                + Add Ammunition
              </Button>
            ) : undefined
          }
        />
      ) : (
        <SortableTable<Ammunition & Record<string, unknown>>
          columns={columns}
          data={filtered as (Ammunition & Record<string, unknown>)[]}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={(a) => navigate(`/ammunition/${a.id}`)}
        />
      )}
    </div>
  );
};

export { AmmunitionList };
