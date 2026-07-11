import type { MasterFilterOption } from '../components/master'
import type { AdminSelectOption } from '../components/forms/AdminSelect'

export function publishStatusFilterOptions(allLabel: string): MasterFilterOption[] {
  return [
    { label: allLabel, value: 'all' },
    { label: 'Publish', value: 'active' },
    { label: 'Unpublish', value: 'inactive' },
  ]
}

export const publishStatusSelectOptions: AdminSelectOption[] = [
  { label: 'Publish', value: '1' },
  { label: 'Unpublish', value: '0' },
]
