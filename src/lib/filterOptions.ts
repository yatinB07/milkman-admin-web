import type { MasterFilterOption } from '../components/master'

export function publishStatusFilterOptions(allLabel: string): MasterFilterOption[] {
  return [
    { label: allLabel, value: 'all' },
    { label: 'Publish', value: 'active' },
    { label: 'Unpublish', value: 'inactive' },
  ]
}
