import React from 'react';
import styles from './SortableTable.module.css';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  keyField?: string;
}

function SortableTable<T extends Record<string, unknown>>({
  columns,
  data,
  sortField,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = 'No items found.',
  keyField = 'id',
}: SortableTableProps<T>) {
  const handleHeaderClick = (col: Column<T>) => {
    if (col.sortable !== false) {
      onSort(col.key);
    }
  };

  const arrow = (key: string) => {
    if (sortField !== key) return null;
    return <span className={styles.arrow}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
  };

  if (data.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  return (
    <>
      {/* Desktop table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${styles.th} ${col.sortable !== false ? styles.sortable : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleHeaderClick(col)}
                >
                  {col.label}
                  {col.sortable !== false && arrow(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr
                key={String(item[keyField] ?? idx)}
                className={`${styles.row} ${onRowClick ? styles.clickable : ''}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={styles.td}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className={styles.cards}>
        {data.map((item, idx) => (
          <div
            key={String(item[keyField] ?? idx)}
            className={`${styles.card} ${onRowClick ? styles.clickable : ''}`}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
          >
            {columns.map((col) => (
              <div key={col.key} className={styles.cardField}>
                <span className={styles.cardLabel}>{col.label}</span>
                <span className={styles.cardValue}>
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export { SortableTable };
