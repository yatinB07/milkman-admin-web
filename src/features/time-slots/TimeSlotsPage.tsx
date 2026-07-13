import { Clock3, Edit3, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Button, ListLoadError, PageSkeleton, RecordLoadError, RowActionMenu, toast } from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import {
  MasterDataTable,
  MasterFilterBar,
  MasterPageHeader,
  MasterPagination,
  type MasterTableColumn,
} from '../../components/master'
import { emptyPaginationMeta } from '../../lib/apiTypes'
import { publishStatusFilterOptions } from '../../lib/filterOptions'
import { formatDate, serialNumber } from '../../lib/formatters'
import { readFieldErrors } from '../../lib/validationErrors'
import { getModuleActionPermission } from '../../routes/adminModules'
import { navigateToHash, parseCrudFormRoute, useHashPath } from '../../routes/hashRouting'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { TimeSlotForm } from './TimeSlotForm'
import {
  createTimeSlot,
  deleteTimeSlot,
  getTimeSlot,
  listTimeSlots,
  listTimeSlotStores,
  updateTimeSlot,
} from './timeSlotRepository'
import { toInputTime, toTimeSlotPayload, toStoreSelectOptions } from './timeSlotService'
import type { TimeSlotFormValues, TimeSlotListRow, TimeSlotRow } from './timeSlotTypes'

type TimeSlotFormErrors = Partial<Record<'store_id' | 'starts_at' | 'ends_at', string>>

export function TimeSlotsPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/time-slots')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingOption, setEditingOption] = useState<TimeSlotRow | null>(null)
  const [formErrors, setFormErrors] = useState<TimeSlotFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { option: TimeSlotRow }) | null>(
    null,
  )
  const canCreate = adminStore.can(getModuleActionPermission('time-slots', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('time-slots', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('time-slots', 'delete'))

  const options = useQuery({
    queryKey: ['admin-time-slots', search, status, page, listPerPage],
    queryFn: () => listTimeSlots({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-time-slot-store-options'],
    queryFn: listTimeSlotStores,
    retry: false,
  })

  const routeOption = useQuery({
    queryKey: ['admin-time-slot', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getTimeSlot(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingOption = formRoute?.mode === 'edit' ? routeOption.data ?? editingOption : editingOption
  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])

  const saveOption = useMutation({
    mutationFn: async (values: TimeSlotFormValues) => {
      const payload = toTimeSlotPayload(values)

      return currentEditingOption ? updateTimeSlot(currentEditingOption.id, payload) : createTimeSlot(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-time-slots'] })
      toast.success(currentEditingOption ? 'Time slot updated successfully.' : 'Time slot created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      const errors = readFieldErrors<keyof TimeSlotFormErrors>(error, ['store_id', 'starts_at', 'ends_at'])

      if (errors.store_id || errors.starts_at || errors.ends_at) {
        setFormErrors(errors)
        return
      }

      toast.error('Time slot could not be saved.')
    },
  })

  const removeOption = useMutation({
    mutationFn: async (option: TimeSlotRow) => deleteTimeSlot(option.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-time-slots'] })
      toast.success('Time slot deleted successfully.')
    },
    onError: () => {
      toast.error('Time slot could not be deleted. Try again.')
    },
  })

  const apiRows = options.data?.data ?? []
  const meta = options.data?.meta ?? emptyPaginationMeta(listPerPage)
  const rows: TimeSlotListRow[] = apiRows.map((option, index) => ({
    ...option,
    serialNumber: serialNumber(meta, index),
  }))

  const columns = useMemo<MasterTableColumn<TimeSlotListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (option) => option.serialNumber, width: '90px' },
      { key: 'store', header: 'Store', render: (option) => option.store?.title ?? `Store #${option.store_id}` },
      { key: 'starts_at', header: 'Start Time', render: (option) => toInputTime(option.starts_at) },
      {
        key: 'ends_at',
        header: 'End Time',
        render: (option) => toInputTime(option.ends_at),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (option) => (
          <StatusPill tone={option.is_active ? 'success' : 'danger'}>
            {option.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      { key: 'updated', header: 'Updated', render: (option) => formatDate(option.updated_at) },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (option) => (
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit time slot',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(option),
              },
              canDelete && {
                label: 'Delete time slot',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete time slot',
                    message: `Delete ${toInputTime(option.starts_at)}-${toInputTime(option.ends_at)}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    option,
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

  function openCreateForm() {
    dirtyFormStore.reset()
    setEditingOption(null)
    setFormErrors({})
    navigateToHash('/time-slots/create')
  }

  function openEditForm(option: TimeSlotRow) {
    dirtyFormStore.reset()
    setEditingOption(option)
    setFormErrors({})
    navigateToHash(`/time-slots/edit/${option.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingOption(null)
    setFormErrors({})
    navigateToHash('/time-slots')
  }

  function handleSubmit(values: TimeSlotFormValues) {
    const nextErrors: TimeSlotFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      starts_at: values.starts_at ? undefined : 'Start time is required.',
      ends_at:
        values.ends_at && values.starts_at && values.ends_at > values.starts_at
          ? undefined
          : 'End time must be after start time.',
    }

    if (nextErrors.store_id || nextErrors.starts_at || nextErrors.ends_at) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveOption.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingOption && routeOption.isLoading) {
      return <PageSkeleton label="Loading time slot" />
    }

    if (formRoute.mode === 'edit' && !currentEditingOption) {
      return (
        <RecordLoadError
          title="Edit Time Slot"
          description="The requested time slot could not be loaded."
          message="Time slot could not be loaded. Check the record or try again."
          backLabel="Back to Time Slots"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingOption ? 'Edit Time Slot' : 'Add Time Slot'}
          description="Manage store delivery time windows from the live Laravel admin API."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Time Slots
            </Button>
          }
        />

        <section className="data-panel">
          <TimeSlotForm
            option={currentEditingOption}
            storeOptions={storeOptions}
            formErrors={formErrors}
            optionError={stores.isError}
            isSaving={saveOption.isPending}
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
        title="Time Slots"
        description="Manage store delivery time slots used during checkout."
        actions={
          canCreate ? (
            <Button variant="primary" size="compact" onClick={openCreateForm}>
              <Clock3 aria-hidden="true" size={17} />
              Add Time Slot
            </Button>
          ) : null
        }
      />

      <MasterFilterBar
        searchLabel="Search time slots"
        searchPlaceholder="Search time slots or stores..."
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
            options: publishStatusFilterOptions('All time slots'),
          },
        ]}
      />

      {options.isError ? <ListLoadError message="Time slots could not be loaded. Try again." /> : null}

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Time Slot Directory</h3>
            <p>Manage time slot records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(option) => option.id}
          emptyState={
            <span className="master-empty-state">
              <Clock3 aria-hidden="true" size={30} />
              No time slots found
            </span>
          }
          isLoading={options.isLoading}
        />

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
          if (!confirmDelete) return
          removeOption.mutate(confirmDelete.option)
          setConfirmDelete(null)
        }}
      />
    </>
  )
}
