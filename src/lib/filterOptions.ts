import type { MasterFilterOption } from '../components/master'
import type { SelectFieldOption } from '../components/forms/SelectField'

export function publishStatusFilterOptions(allLabel: string): MasterFilterOption[] {
  return [
    { label: allLabel, value: 'all' },
    { label: 'Publish', value: 'active' },
    { label: 'Unpublish', value: 'inactive' },
  ]
}

export const publishStatusSelectOptions: SelectFieldOption[] = [
  { label: 'Publish', value: '1' },
  { label: 'Unpublish', value: '0' },
]

export const yesNoSelectOptions: SelectFieldOption[] = [
  { label: 'Yes', value: '1' },
  { label: 'No', value: '0' },
]
