import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from 'react-bootstrap';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Valeur de tri ; sans elle, la colonne n'est pas triable. */
  sortValue?: (row: T) => string | number;
  align?: 'end';
  /** Cellule d'en-tête de ligne (`<th scope="row">`), pour la colonne d'identification. */
  rowHeader?: boolean;
}

type Direction = 'ascending' | 'descending';

interface DataTableProps<T> {
  /** Légende du tableau (lue par les lecteurs d'écran). */
  caption: string;
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string | number;
  actions?: (row: T) => ReactNode;
  initialSort?: { key: string; direction: Direction };
  pageSize?: number;
  emptyMessage?: string;
}

/** Tableau accessible : légende, en-têtes `scope`, tri avec `aria-sort`, pagination. */
export function DataTable<T>({ caption, columns, rows, rowKey, actions, initialSort, pageSize = 8, emptyMessage = 'Aucun résultat.' }: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const column = columns.find((candidate) => candidate.key === sort?.key);
    if (!sort || !column?.sortValue) return [...rows];
    const valueOf = column.sortValue;
    const factor = sort.direction === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = valueOf(a);
      const right = valueOf(b);
      if (left === right) return 0;
      return left < right ? -factor : factor;
    });
  }, [rows, columns, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = sorted.slice((current - 1) * pageSize, current * pageSize);

  function toggleSort(key: string): void {
    setSort((previous) => (previous?.key === key && previous.direction === 'ascending' ? { key, direction: 'descending' } : { key, direction: 'ascending' }));
  }

  if (rows.length === 0) {
    return (
      <p role="status" className="text-body-secondary py-3 mb-0">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-jigi table-striped align-middle mb-2">
          <caption className="caption-top small text-body-secondary">
            {caption} · {sorted.length} {sorted.length > 1 ? 'lignes' : 'ligne'}
          </caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={column.align === 'end' ? 'text-end' : undefined} aria-sort={sort?.key === column.key ? sort.direction : undefined}>
                  {column.sortValue ? (
                    <button type="button" className="sort-btn" onClick={() => toggleSort(column.key)}>
                      {column.header}
                      <i className={`bi ms-1 ${sort?.key === column.key ? (sort.direction === 'ascending' ? 'bi-arrow-up' : 'bi-arrow-down') : 'bi-arrow-down-up'}`} aria-hidden="true" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {actions ? (
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) =>
                  column.rowHeader ? (
                    <th key={column.key} scope="row" className="fw-semibold">
                      {column.render(row)}
                    </th>
                  ) : (
                    <td key={column.key} className={column.align === 'end' ? 'text-end text-nowrap' : undefined}>
                      {column.render(row)}
                    </td>
                  ),
                )}
                {actions ? <td className="text-nowrap">{actions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 ? (
        <nav aria-label="Pagination du tableau" className="d-flex justify-content-between align-items-center">
          <span className="small text-body-secondary">
            Page {current} sur {pageCount}
          </span>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Précédent
            </Button>
            <Button variant="outline-primary" size="sm" disabled={current === pageCount} onClick={() => setPage(current + 1)}>
              Suivant
            </Button>
          </div>
        </nav>
      ) : null}
    </>
  );
}
