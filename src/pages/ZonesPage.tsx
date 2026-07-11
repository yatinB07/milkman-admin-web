import { Edit3, MapPinned, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useMemo, useState } from 'react'
import {
  MasterDataTable,
  MasterFilterBar,
  MasterPageHeader,
  MasterPagination,
  type MasterTableColumn,
} from '../components/master'
import { ConfirmDialog, type ConfirmDialogOptions } from '../components/common/ConfirmDialog'
import { ZonePolygonMap } from '../components/maps/ZonePolygonMap'
import { StatusPill } from '../components/StatusPill'
import { api } from '../lib/api'
import {
  normalizePaginationMeta,
  toApiListParams,
  type PaginatedResponse,
  type PaginationMeta,
} from '../lib/apiTypes'
import { getModuleActionPermission } from '../routes/adminModules'
import { adminStore } from '../store/adminStore'

type ZoneRow = {
  id: number
  title: string
  coordinates: string
  alias: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type ZoneFormValues = {
  title: string
  coordinates: string
  alias: string
  is_active: boolean
}

type ZoneFormErrors = Partial<Record<keyof ZoneFormValues, string>>

type ZonesApiResponse = {
  data: ZoneRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

export function ZonesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingZone, setEditingZone] = useState<ZoneRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [coordinatesValue, setCoordinatesValue] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<ZoneFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { zone: ZoneRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('zones', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('zones', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('zones', 'delete'))

  const zones = useQuery<PaginatedResponse<ZoneRow>>({
    queryKey: ['admin-zones', search, page],
    queryFn: async () => {
      const response = await api.get<ZonesApiResponse>('/api/v1/admin/zones', {
        params: toApiListParams({
          page,
          perPage: 10,
          search,
        }),
      })

      return {
        data: response.data.data,
        meta: normalizePaginationMeta(response.data.meta),
      }
    },
    retry: false,
  })

  const saveZone = useMutation({
    mutationFn: async (values: ZoneFormValues) => {
      const payload = toZonePayload(values)

      if (editingZone) {
        const response = await api.put<{ data: ZoneRow }>(
          `/api/v1/admin/zones/${editingZone.id}`,
          payload,
        )

        return response.data.data
      }

      const response = await api.post<{ data: ZoneRow }>('/api/v1/admin/zones', payload)

      return response.data.data
    },
    onSuccess: async (savedZone) => {
      queryClient.setQueriesData<PaginatedResponse<ZoneRow>>(
        { queryKey: ['admin-zones'] },
        (currentData) => {
          if (!currentData) {
            return currentData
          }

          return {
            ...currentData,
            data: currentData.data.map((zone) => (zone.id === savedZone.id ? savedZone : zone)),
          }
        },
      )
      await queryClient.invalidateQueries({ queryKey: ['admin-zones'] })
      closeForm()
    },
    onError: () => {
      setFormError('Zone could not be saved. Check the documented required fields and try again.')
    },
  })

  const deleteZone = useMutation({
    mutationFn: async (zone: ZoneRow) => {
      await api.delete(`/api/v1/admin/zones/${zone.id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-zones'] })
    },
  })

  const columns = useMemo<MasterTableColumn<ZoneRow>[]>(
    () => [
      {
        key: 'zone',
        header: 'Zone',
        render: (zone) => (
          <div className="store-cell">
            <span>{zone.title.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{zone.title}</strong>
              <small>#{zone.id}</small>
            </div>
          </div>
        ),
        width: '280px',
      },
      {
        key: 'alias',
        header: 'Alias',
        render: (zone) => zone.alias ?? 'No alias',
      },
      {
        key: 'coordinates',
        header: 'Coordinates',
        render: (zone) => (
          <span className="stacked-cell">
            <strong>{zone.coordinates}</strong>
            <small>Boundary reference</small>
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (zone) => (
          <StatusPill tone={zone.is_active ? 'success' : 'danger'}>
            {zone.is_active ? 'Active' : 'Inactive'}
          </StatusPill>
        ),
      },
      {
        key: 'updated',
        header: 'Updated',
        render: (zone) => formatDate(zone.updated_at),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (zone) => (
          <span className="row-actions">
            {canUpdate ? (
              <button type="button" aria-label="Edit zone" onClick={() => openEditForm(zone)}>
                <Edit3 aria-hidden="true" size={16} />
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                aria-label="Delete zone"
                onClick={() => {
                  setConfirmDelete({
                    title: 'Delete zone',
                    message: `Delete ${zone.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    zone,
                  })
                }}
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            ) : null}
          </span>
        ),
      },
    ],
    [canDelete, canUpdate],
  )

  const apiRows = zones.data?.data ?? []
  const rows =
    status === 'all' ? apiRows : apiRows.filter((zone) => zone.is_active === (status === 'active'))
  const meta = zones.data?.meta ?? defaultMeta

  function openCreateForm() {
    setEditingZone(null)
    setCoordinatesValue('')
    setFormError(null)
    setFormErrors({})
    setIsFormOpen(true)
  }

  function openEditForm(zone: ZoneRow) {
    setEditingZone(zone)
    setCoordinatesValue(zone.coordinates)
    setFormError(null)
    setFormErrors({})
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingZone(null)
    setCoordinatesValue('')
    setFormError(null)
    setFormErrors({})
    setIsFormOpen(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const statusValue = String(form.get('is_active') ?? '')
    const values: ZoneFormValues = {
      title: String(form.get('title') ?? ''),
      coordinates: coordinatesValue,
      alias: resolveZoneAlias(String(form.get('alias') ?? ''), coordinatesValue, editingZone),
      is_active: statusValue === 'true',
    }
    const errors = validateZoneForm(values, statusValue)

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      setFormError('Check the highlighted fields and try again.')
      return
    }

    setFormError(null)
    saveZone.mutate(values)
  }

  return (
    <>
      <MasterPageHeader
        title="Zones"
        description="Manage delivery zones and service boundaries from the live Laravel admin API."
        actions={canCreate ? (
          <button className="primary-button is-compact" type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Zone
          </button>
        ) : null}
      />

      <MasterFilterBar
        searchLabel="Search zones"
        searchPlaceholder="Search zones or aliases..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        filters={[
          {
            label: 'Status',
            value: status,
            onChange: (value) => {
              setStatus(value)
              setPage(1)
            },
            options: [
              { label: 'All zones', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
      />

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Zone Directory</h3>
            <p>Showing paginated zone records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(zone) => zone.id}
          emptyState={
            <span className="master-empty-state">
              <MapPinned aria-hidden="true" size={30} />
              No zones found
            </span>
          }
          isLoading={zones.isLoading}
          minWidth={920}
        />

        {zones.isError ? (
          <div className="master-error">
            Zones could not be loaded. Confirm the backend is running and your admin session is
            valid.
          </div>
        ) : null}

        <MasterPagination meta={meta} onPageChange={setPage} />
      </section>

      {isFormOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="store-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="zone-form-title"
          >
            <div className="modal-header">
              <div>
                <h3 id="zone-form-title">{editingZone ? 'Edit Zone' : 'Add Zone'}</h3>
                <p>Uses the documented ZoneRequest and UpdateZoneRequest contract.</p>
              </div>
              <button type="button" className="secondary-button" onClick={closeForm}>
                Close
              </button>
            </div>

            <form className="store-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field">
                  <span>
                    Zone Title <span className="required-mark" aria-hidden="true">*</span>
                  </span>
                  <input
                    name="title"
                    required
                    maxLength={255}
                    aria-invalid={Boolean(formErrors.title)}
                    aria-describedby={formErrors.title ? 'zone-title-error' : undefined}
                    defaultValue={editingZone?.title ?? ''}
                  />
                  {formErrors.title ? (
                    <small className="field-error" id="zone-title-error">
                      {formErrors.title}
                    </small>
                  ) : null}
                </label>

                <label className="form-field">
                  <span>Alias</span>
                  <input
                    name="alias"
                    maxLength={255}
                    aria-invalid={Boolean(formErrors.alias)}
                    aria-describedby={formErrors.alias ? 'zone-alias-error' : undefined}
                    defaultValue={editingZone?.alias ?? ''}
                  />
                  {formErrors.alias ? (
                    <small className="field-error" id="zone-alias-error">
                      {formErrors.alias}
                    </small>
                  ) : null}
                </label>

                <label className="form-field is-wide">
                  <span>
                    Coordinates <span className="required-mark" aria-hidden="true">*</span>
                  </span>
                  <ZonePolygonMap
                    value={coordinatesValue}
                    onChange={setCoordinatesValue}
                    hasError={Boolean(formErrors.coordinates)}
                    errorId={formErrors.coordinates ? 'zone-coordinates-error' : undefined}
                  />
                  {formErrors.coordinates ? (
                    <small className="field-error" id="zone-coordinates-error">
                      {formErrors.coordinates}
                    </small>
                  ) : null}
                </label>

                <label className="form-field">
                  <span>
                    Status <span className="required-mark" aria-hidden="true">*</span>
                  </span>
                  <select
                    name="is_active"
                    required
                    aria-invalid={Boolean(formErrors.is_active)}
                    aria-describedby={formErrors.is_active ? 'zone-status-error' : undefined}
                    defaultValue={String(editingZone?.is_active ?? true)}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  {formErrors.is_active ? (
                    <small className="field-error" id="zone-status-error">
                      {formErrors.is_active}
                    </small>
                  ) : null}
                </label>
              </div>

              {formError ? <div className="form-error">{formError}</div> : null}

              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button className="primary-button is-compact" type="submit" disabled={saveZone.isPending}>
                  {saveZone.isPending ? 'Saving...' : editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      <ConfirmDialog
        options={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteZone.mutate(confirmDelete.zone)
          }
          setConfirmDelete(null)
        }}
      />
    </>
  )
}

function toZonePayload(values: ZoneFormValues) {
  const coordinates = values.coordinates.trim()
  const alias = values.alias.trim()

  return {
    title: values.title.trim(),
    coordinates,
    alias: alias === '' ? coordinates : alias,
    is_active: values.is_active,
  }
}

function resolveZoneAlias(alias: string, coordinates: string, editingZone: ZoneRow | null) {
  const trimmedAlias = alias.trim()
  const trimmedCoordinates = coordinates.trim()

  if (!editingZone || !trimmedAlias) {
    return trimmedAlias
  }

  const aliasWasNotEdited = trimmedAlias === (editingZone.alias ?? '').trim()
  const polygonChanged =
    trimmedCoordinates !== editingZone.coordinates.trim() &&
    trimmedCoordinates !== (editingZone.alias ?? '').trim()

  return aliasWasNotEdited && polygonChanged ? trimmedCoordinates : trimmedAlias
}

function validateZoneForm(values: ZoneFormValues, statusValue: string) {
  const errors: ZoneFormErrors = {}
  const title = values.title.trim()
  const alias = values.alias.trim()
  const coordinates = values.coordinates.trim()

  if (!title) {
    errors.title = 'Zone title is required.'
  } else if (title.length > 255) {
    errors.title = 'Zone title must be 255 characters or fewer.'
  }

  if (alias.length > 255) {
    errors.alias = 'Alias must be 255 characters or fewer.'
  }

  if (statusValue !== 'true' && statusValue !== 'false') {
    errors.is_active = 'Choose Active or Inactive.'
  }

  if (!coordinates) {
    errors.coordinates = 'Coordinates are required.'
  } else if (countCoordinatePairs(coordinates) < 3) {
    errors.coordinates = 'Coordinates must include at least 3 points.'
  }

  return errors
}

function countCoordinatePairs(value: string) {
  return (
    value.match(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?|-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g)
      ?.length ?? 0
  )
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
