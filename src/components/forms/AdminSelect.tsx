import Select, { type MultiValue, type SingleValue, type StylesConfig } from 'react-select'

export type AdminSelectOption = {
  label: string
  value: string
}

type AdminSelectProps = {
  value: string
  options: AdminSelectOption[]
  ariaLabel?: string
  inputId?: string
  placeholder?: string
  isSearchable?: boolean
  hasError?: boolean
  onChange: (value: string) => void
}

type AdminMultiSelectProps = {
  values: string[]
  options: AdminSelectOption[]
  placeholder?: string
  onChange: (values: string[]) => void
}

export function AdminSelect({
  value,
  options,
  ariaLabel,
  inputId,
  placeholder = 'Select option',
  isSearchable = true,
  hasError = false,
  onChange,
}: AdminSelectProps) {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <Select<AdminSelectOption, false>
      aria-label={ariaLabel}
      className="admin-react-select"
      classNamePrefix="admin-react-select"
      inputId={inputId}
      isSearchable={isSearchable}
      menuPortalTarget={menuPortalTarget}
      menuPosition="fixed"
      options={options}
      placeholder={placeholder}
      styles={selectStyles(hasError)}
      value={selected}
      onChange={(option: SingleValue<AdminSelectOption>) => onChange(option?.value ?? '')}
    />
  )
}

export function AdminMultiSelect({
  values,
  options,
  placeholder = 'Select options',
  onChange,
}: AdminMultiSelectProps) {
  const selected = options.filter((option) => values.includes(option.value))

  return (
    <Select<AdminSelectOption, true>
      className="admin-react-select"
      classNamePrefix="admin-react-select"
      closeMenuOnSelect={false}
      isMulti
      isSearchable
      menuPortalTarget={menuPortalTarget}
      menuPosition="fixed"
      options={options}
      placeholder={placeholder}
      styles={selectStyles(false)}
      value={selected}
      onChange={(nextValues: MultiValue<AdminSelectOption>) => {
        onChange(nextValues.map((option) => option.value))
      }}
    />
  )
}

const selectStyles = (hasError: boolean): StylesConfig<AdminSelectOption, boolean> => ({
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderColor: hasError ? 'var(--color-danger)' : state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    boxShadow: state.isFocused ? '0 0 0 3px rgb(0 121 111 / 14%)' : 'none',
    color: 'var(--color-text)',
    cursor: 'pointer',
    ':hover': {
      borderColor: 'var(--color-primary)',
    },
  }),
  input: (base) => ({
    ...base,
    color: 'var(--color-text)',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 40,
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    boxShadow: 'var(--shadow-popover)',
    overflow: 'hidden',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 10000,
  }),
  menuList: (base) => ({
    ...base,
    padding: 6,
  }),
  multiValue: (base) => ({
    ...base,
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-primary-soft)',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'var(--color-primary-strong)',
    fontWeight: 800,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'var(--color-primary-strong)',
    ':hover': {
      backgroundColor: 'var(--color-danger-soft)',
      color: 'var(--color-danger)',
    },
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: 'var(--radius-sm)',
    backgroundColor: state.isSelected
      ? 'var(--color-primary)'
      : state.isFocused
        ? 'var(--color-surface-muted)'
        : 'var(--color-surface)',
    color: state.isSelected ? 'var(--color-on-primary)' : 'var(--color-text)',
    cursor: 'pointer',
    fontWeight: state.isSelected ? 800 : 700,
    ':active': {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-on-primary)',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--color-text-muted)',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--color-text)',
    fontWeight: 800,
  }),
})

const menuPortalTarget = typeof document === 'undefined' ? undefined : document.body
