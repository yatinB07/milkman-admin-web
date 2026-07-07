import { Search } from 'lucide-react'
import type { ChangeEventHandler, ReactNode } from 'react'

export type MasterFilterOption = {
  label: string
  value: string
}

export type MasterFilterSelect = {
  label: string
  value: string
  options: MasterFilterOption[]
  onChange: (value: string) => void
}

type MasterFilterBarProps = {
  searchLabel: string
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: MasterFilterSelect[]
  actions?: ReactNode
}

export function MasterFilterBar({
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters = [],
  actions,
}: MasterFilterBarProps) {
  const handleSearchChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onSearchChange(event.target.value)
  }

  return (
    <section className="master-filter-bar" aria-label="List filters">
      <label className="master-search">
        <span className="sr-only">{searchLabel}</span>
        <Search aria-hidden="true" size={18} />
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={handleSearchChange}
        />
      </label>

      {filters.map((filter) => (
        <label className="master-select" key={filter.label}>
          <span>{filter.label}</span>
          <select value={filter.value} onChange={(event) => filter.onChange(event.target.value)}>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {actions ? <div className="master-filter-actions">{actions}</div> : null}
    </section>
  )
}
