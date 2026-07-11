import { Edit3, MapPinned, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  MasterDataTable,
  MasterFilterBar,
  MasterPageHeader,
  MasterPagination,
  type MasterTableColumn,
} from '../../components/master'
import { Button, RowActionMenu, toast } from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import type { PaginatedResponse, PaginationMeta } from '../../lib/apiTypes'
import { getModuleActionPermission } from '../../routes/adminModules'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { ZoneForm } from './ZoneForm'
import { createZone, deleteZone as removeZone, listZones, updateZone } from './zoneRepository'
import { toZonePayload } from './zoneService'
import type { ZoneFormErrors, ZoneFormValues, ZoneRow } from './zoneTypes'

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

export function ZonesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingZone, setEditingZone] = useState<ZoneRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<ZoneFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { zone: ZoneRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('zones', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('zones', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('zones', 'delete'))

  const zones = useQuery<PaginatedResponse<ZoneRow>>({
    queryKey: ['admin-zones', search, status, page, listPerPage],
    queryFn: () => listZones({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const saveZone = useMutation({
    mutationFn: async (values: ZoneFormValues) => {
      const payload = toZonePayload(values)

      return editingZone ? updateZone(editingZone.id, payload) : createZone(payload)
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
      toast.success(editingZone ? 'Zone updated successfully.' : 'Zone created successfully.')
      closeForm(true)
    },
    onError: () => {
      toast.error('Zone could not be saved. Check the highlighted fields and try again.')
    },
  })

  const deleteZone = useMutation({
    mutationFn: async (zone: ZoneRow) => removeZone(zone.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-zones'] })
      toast.success('Zone deleted successfully.')
    },
    onError: () => {
      toast.error('Zone could not be deleted. Try again.')
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
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit zone',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(zone),
              },
              canDelete && {
                label: 'Delete zone',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete zone',
                    message: `Delete ${zone.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    zone,
                  })
                },
              },
            ]}
          />
        ),
      },
    ],
    [canDelete, canUpdate],
  )

  const rows = zones.data?.data ?? []
  const meta = zones.data?.meta ?? { ...defaultMeta, perPage: listPerPage }

  function openCreateForm() {
    dirtyFormStore.reset()
    setEditingZone(null)
    setFormErrors({})
    setIsFormOpen(true)
  }

  function openEditForm(zone: ZoneRow) {
    dirtyFormStore.reset()
    setEditingZone(zone)
    setFormErrors({})
    setIsFormOpen(true)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingZone(null)
    setFormErrors({})
    setIsFormOpen(false)
  }

  function handleSubmit(values: ZoneFormValues) {
    saveZone.mutate(values)
  }

  return (
    <>
      <MasterPageHeader
        title="Zones"
        description="Manage delivery zones and service boundaries from the live Laravel admin API."
        actions={canCreate ? (
          <Button variant="primary" size="compact" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Zone
          </Button>
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

        <MasterPagination
          meta={meta}
          perPage={listPerPage}
          onPageChange={setPage}
          onPerPageChange={(perPage) => {
            adminStore.setListPerPage(perPage)
            setPage(1)
          }}
        />
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
              </div>
              <Button variant="secondary" onClick={() => closeForm()}>
                Close
              </Button>
            </div>

            <ZoneForm
              zone={editingZone}
              formErrors={formErrors}
              isSaving={saveZone.isPending}
              onErrorsChange={setFormErrors}
              onCancel={closeForm}
              onSubmit={handleSubmit}
            />
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
