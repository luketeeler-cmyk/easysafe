import { useState, useMemo, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Generic Search / Filter / Sort Hook                                 */
/* ------------------------------------------------------------------ */

type SortDirection = 'asc' | 'desc';

interface UseSearchReturn<T> {
  filteredItems: T[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: string | null;
  setSortField: (field: string | null) => void;
  sortDir: SortDirection;
  setSortDir: (dir: SortDirection) => void;
  toggleSort: (field: string) => void;
}

/**
 * Provides search filtering and sorting over a list of items.
 *
 * @param items        The full array of items to filter / sort.
 * @param searchFields Property names to match the search query against.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSearch<T extends Record<string, any>>(
  items: T[],
  searchFields: string[],
): UseSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  /* ---- Toggle sort field / direction ----------------------------- */
  const toggleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  /* ---- Computed filtered + sorted list --------------------------- */
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    /* Filter */
    let result = items;

    if (query) {
      result = items.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(query);
        }),
      );
    }

    /* Sort */
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        /* Nulls always sort to the end */
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let comparison: number;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal)
            .toLowerCase()
            .localeCompare(String(bVal).toLowerCase());
        }

        return sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [items, searchQuery, searchFields, sortField, sortDir]);

  return {
    filteredItems,
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    toggleSort,
  };
}
