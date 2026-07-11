import type { ReactNode } from 'react'
import { Skeleton } from '../common'

export type MasterTableColumn<Row> = {
  key: string
  header: string
  render: (row: Row) => ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
}

type MasterDataTableProps<Row> = {
  columns: MasterTableColumn<Row>[]
  rows: Row[]
  getRowKey: (row: Row) => string | number
  emptyState: ReactNode
  minWidth?: number
  isLoading?: boolean
}

export function MasterDataTable<Row>({
  columns,
  rows,
  getRowKey,
  emptyState,
  minWidth = 960,
  isLoading = false,
}: MasterDataTableProps<Row>) {
  return (
    <div className="master-table-scroll">
      <table className="master-table" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={column.align ? `is-${column.align}` : undefined}
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td className={column.align ? `is-${column.align}` : undefined} key={column.key}>
                    <Skeleton className="master-table-skeleton" />
                  </td>
                ))}
              </tr>
            ))
          ) : null}

          {!isLoading && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="master-table-empty">{emptyState}</div>
              </td>
            </tr>
          ) : null}

          {!isLoading
            ? rows.map((row) => (
                <tr key={getRowKey(row)}>
                  {columns.map((column) => (
                    <td className={column.align ? `is-${column.align}` : undefined} key={column.key}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  )
}
