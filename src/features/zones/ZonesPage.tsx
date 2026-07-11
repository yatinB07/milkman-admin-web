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
import { Button, ListLoadError, PageSkeleton, RecordLoadError, RowActionMenu, toast } from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import { emptyPaginationMeta, type PaginatedResponse } from '../../lib/apiTypes'
import { formatAdminDate } from '../../lib/formatters'
import { getModuleActionPermission } from '../../routes/adminModules'
import { navigateToHash, parseCrudFormRoute, useHashPath } from '../../routes/hashRouting'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { ZoneForm } from './ZoneForm'
import { createZone, deleteZone as removeZone, getZone, listZones, updateZone } from './zoneRepository'
import { toZonePayload } from './zoneService'
import type { ZoneFormErrors, ZoneFormValues, ZoneRow } from './zoneTypes'

export function ZonesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/zones')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingZone, setEditingZone] = useState<ZoneRow | null>(null)
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

  const routeZone = useQuery({
    queryKey: ['admin-zone', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getZone(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingZone = formRoute?.mode === 'edit' ? routeZone.data ?? editingZone : editingZone

  const saveZone = useMutation({
    mutationFn: async (values: ZoneFormValues) => {
      const payload = toZonePayload(values)

      return currentEditingZone ? updateZone(currentEditingZone.id, payload) : createZone(payload)
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
      toast.success(currentEditingZone ? 'Zone updated successfully.' : 'Zone created successfully.')
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
        render: (zone) => formatAdminDate(zone.updated_at, 'Not available'),
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
  const meta = zones.data?.meta ?? emptyPaginationMeta(listPerPage)

  function openCreateForm() {
    dirtyFormStore.reset()
    setEditingZone(null)
    setFormErrors({})
    navigateToHash('/zones/create')
  }

  function openEditForm(zone: ZoneRow) {
    dirtyFormStore.reset()
    setEditingZone(zone)
    setFormErrors({})
    navigateToHash(`/zones/edit/${zone.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingZone(null)
    setFormErrors({})
    navigateToHash('/zones')
  }

  function handleSubmit(values: ZoneFormValues) {
    saveZone.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingZone && routeZone.isLoading) {
      return <PageSkeleton label="Loading zone" />
    }

    if (formRoute.mode === 'edit' && !currentEditingZone) {
      return (
        <RecordLoadError
          title="Edit Zone"
          description="The requested zone could not be loaded."
          message="Zone could not be loaded. Check the record or try again."
          backLabel="Back to Zones"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingZone ? 'Edit Zone' : 'Add Zone'}
          description="Draw the delivery boundary and manage zone status."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Zones
            </Button>
          }
        />
        <section className="data-panel">
          <ZoneForm
            zone={currentEditingZone}
            formErrors={formErrors}
            isSaving={saveZone.isPending}
            onErrorsChange={setFormErrors}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        </section>
      </>
    )
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

        {zones.isError ? <ListLoadError message="Zones could not be loaded." /> : null}

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
