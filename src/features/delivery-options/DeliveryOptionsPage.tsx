import { Edit3, Truck, TruckIcon, Trash2 } from 'lucide-react'
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
import { DeliveryOptionForm } from './DeliveryOptionForm'
import {
  createDeliveryOption,
  deleteDeliveryOption,
  getDeliveryOption,
  listDeliveryOptions,
  listDeliveryOptionStores,
  updateDeliveryOption,
} from './deliveryOptionRepository'
import { toDeliveryOptionPayload, toStoreSelectOptions } from './deliveryOptionService'
import type { DeliveryOptionFormValues, DeliveryOptionListRow, DeliveryOptionRow } from './deliveryOptionTypes'

type DeliveryOptionFormErrors = Partial<Record<'store_id' | 'title' | 'delivery_days', string>>

export function DeliveryOptionsPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/delivery-options')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingOption, setEditingOption] = useState<DeliveryOptionRow | null>(null)
  const [formErrors, setFormErrors] = useState<DeliveryOptionFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { option: DeliveryOptionRow }) | null>(
    null,
  )
  const canCreate = adminStore.can(getModuleActionPermission('delivery-options', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('delivery-options', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('delivery-options', 'delete'))

  const options = useQuery({
    queryKey: ['admin-delivery-options', search, status, page, listPerPage],
    queryFn: () => listDeliveryOptions({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-delivery-option-store-options'],
    queryFn: listDeliveryOptionStores,
    retry: false,
  })

  const routeOption = useQuery({
    queryKey: ['admin-delivery-option', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getDeliveryOption(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingOption = formRoute?.mode === 'edit' ? routeOption.data ?? editingOption : editingOption
  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])

  const saveOption = useMutation({
    mutationFn: async (values: DeliveryOptionFormValues) => {
      const payload = toDeliveryOptionPayload(values)

      return currentEditingOption ? updateDeliveryOption(currentEditingOption.id, payload) : createDeliveryOption(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-delivery-options'] })
      toast.success(currentEditingOption ? 'Delivery option updated successfully.' : 'Delivery option created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      const errors = readFieldErrors<keyof DeliveryOptionFormErrors>(error, ['store_id', 'title', 'delivery_days'])

      if (errors.store_id || errors.title || errors.delivery_days) {
        setFormErrors(errors)
        return
      }

      toast.error('Delivery option could not be saved.')
    },
  })

  const removeOption = useMutation({
    mutationFn: async (option: DeliveryOptionRow) => deleteDeliveryOption(option.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-delivery-options'] })
      toast.success('Delivery option deleted successfully.')
    },
    onError: () => {
      toast.error('Delivery option could not be deleted. Try again.')
    },
  })

  const apiRows = options.data?.data ?? []
  const meta = options.data?.meta ?? emptyPaginationMeta(listPerPage)
  const rows: DeliveryOptionListRow[] = apiRows.map((option, index) => ({
    ...option,
    serialNumber: serialNumber(meta, index),
  }))

  const columns = useMemo<MasterTableColumn<DeliveryOptionListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (option) => option.serialNumber, width: '90px' },
      { key: 'title', header: 'Title', render: (option) => option.title },
      { key: 'store', header: 'Store', render: (option) => option.store?.title ?? `Store #${option.store_id}` },
      {
        key: 'delivery_days',
        header: 'Delivery Days',
        align: 'center',
        render: (option) => option.delivery_days,
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
                label: 'Edit delivery option',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(option),
              },
              canDelete && {
                label: 'Delete delivery option',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete delivery option',
                    message: `Delete "${option.title}"? This can be restored only from the backend.`,
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
    navigateToHash('/delivery-options/create')
  }

  function openEditForm(option: DeliveryOptionRow) {
    dirtyFormStore.reset()
    setEditingOption(option)
    setFormErrors({})
    navigateToHash(`/delivery-options/edit/${option.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingOption(null)
    setFormErrors({})
    navigateToHash('/delivery-options')
  }

  function handleSubmit(values: DeliveryOptionFormValues) {
    const days = Number(values.delivery_days)
    const nextErrors: DeliveryOptionFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      title: values.title.trim() ? undefined : 'Title is required.',
      delivery_days:
        values.delivery_days.trim() && Number.isInteger(days) && days >= 0
          ? undefined
          : 'Delivery days must be a whole number greater than or equal to 0.',
    }

    if (nextErrors.store_id || nextErrors.title || nextErrors.delivery_days) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveOption.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingOption && routeOption.isLoading) {
      return <PageSkeleton label="Loading delivery option" />
    }

    if (formRoute.mode === 'edit' && !currentEditingOption) {
      return (
        <RecordLoadError
          title="Edit Delivery Option"
          description="The requested delivery option could not be loaded."
          message="Delivery option could not be loaded. Check the record or try again."
          backLabel="Back to Delivery Options"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingOption ? 'Edit Delivery Option' : 'Add Delivery Option'}
          description="Manage store delivery promises from the live Laravel admin API."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Delivery Options
            </Button>
          }
        />

        <section className="data-panel">
          <DeliveryOptionForm
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
        title="Delivery Options"
        description="Manage store delivery day options used during checkout."
        actions={
          canCreate ? (
            <Button variant="primary" size="compact" onClick={openCreateForm}>
              <TruckIcon aria-hidden="true" size={17} />
              Add Delivery Option
            </Button>
          ) : null
        }
      />

      <MasterFilterBar
        searchLabel="Search delivery options"
        searchPlaceholder="Search delivery options or stores..."
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
            options: publishStatusFilterOptions('All delivery options'),
          },
        ]}
      />

      {options.isError ? <ListLoadError message="Delivery options could not be loaded. Try again." /> : null}

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Delivery Option Directory</h3>
            <p>Manage delivery option records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(option) => option.id}
          emptyState={
            <span className="master-empty-state">
              <Truck aria-hidden="true" size={30} />
              No delivery options found
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
