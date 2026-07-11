import { Edit3, ImageIcon, Plus, Store, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useMemo, useState } from 'react'
import {
  MasterDataTable,
  MasterFilterBar,
  MasterPageHeader,
  MasterPagination,
  type MasterTableColumn,
} from '../../components/master'
import { Button, toast } from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import type { PaginatedResponse, PaginationMeta } from '../../lib/apiTypes'
import { getModuleActionPermission } from '../../routes/adminModules'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { StoreForm } from './StoreForm'
import {
  createStore,
  deleteStore as removeStore,
  listStoreCategories,
  listStores,
  listStoreZones,
  updateStore,
} from './storeRepository'
import {
  serialNumber,
  storeValidationFields,
  toSelectOptions,
  toStorePayload,
} from './storeService'
import type { StoreFormErrors, StoreFormTabId, StoreFormValues, StoreListRow, StoreRow } from './storeTypes'

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

export function StoresPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingStore, setEditingStore] = useState<StoreRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<StoreFormErrors>({})
  const [activeStoreTab, setActiveStoreTab] = useState<StoreFormTabId>('basic')
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { store: StoreRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('stores', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('stores', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('stores', 'delete'))

  const stores = useQuery<PaginatedResponse<StoreRow>>({
    queryKey: ['admin-stores', search, page, listPerPage],
    queryFn: () => listStores({ page, perPage: listPerPage, search }),
    retry: false,
  })

  const zones = useQuery({
    queryKey: ['admin-store-zone-options'],
    queryFn: listStoreZones,
    retry: false,
  })

  const categories = useQuery({
    queryKey: ['admin-store-category-options'],
    queryFn: listStoreCategories,
    retry: false,
  })

  const saveStore = useMutation({
    mutationFn: async (values: StoreFormValues) => {
      const payload = toStorePayload(values, Boolean(editingStore))

      return editingStore ? updateStore(editingStore.id, payload) : createStore(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      toast.success(editingStore ? 'Store updated successfully.' : 'Store created successfully.')
      closeForm()
    },
    onError: (error) => {
      const validationError = extractStoreApiValidationError(error)

      if (validationError) {
        setActiveStoreTab(validationError.tab)
        setFormErrors(validationError.errors)
        return
      }

      toast.error('Store could not be saved. Check the highlighted fields and try again.')
    },
  })

  const deleteStore = useMutation({
    mutationFn: async (store: StoreRow) => removeStore(store.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      toast.success('Store deleted successfully.')
    },
    onError: () => {
      toast.error('Store could not be deleted. Try again.')
    },
  })

  const apiRows = stores.data?.data ?? []
  const filteredRows =
    status === 'all'
      ? apiRows
      : apiRows.filter((store) => store.is_active === (status === 'active'))
  const meta = stores.data?.meta ?? { ...defaultMeta, perPage: listPerPage }
  const rows: StoreListRow[] = filteredRows.map((store, index) => ({
    ...store,
    serialNumber: serialNumber(meta, index),
  }))
  const categoryOptions = useMemo(() => toSelectOptions(categories.data), [categories.data])
  const zoneOptions = useMemo(() => toSelectOptions(zones.data), [zones.data])

  const columns = useMemo<MasterTableColumn<StoreListRow>[]>(
    () => [
      {
        key: 'serial',
        header: 'Sr No.',
        render: (store) => store.serialNumber,
        width: '90px',
      },
      {
        key: 'store_name',
        header: 'Store Name',
        render: (store) => (
          <span className="stacked-cell">
            <strong>{store.title}</strong>
            <small>{store.zone?.title ?? 'No zone selected'}</small>
          </span>
        ),
      },
      {
        key: 'store_image',
        header: 'Store Image',
        align: 'center',
        render: (store) => <StoreImagePreview src={store.image_path} alt={`${store.title} logo`} />,
      },
      {
        key: 'cover_image',
        header: 'Store Cover Image',
        align: 'center',
        render: (store) => (
          <StoreImagePreview src={store.cover_image_path} alt={`${store.title} cover`} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (store) => (
          <StatusPill tone={store.is_active ? 'success' : 'danger'}>
            {store.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (store) => (
          <span className="row-actions">
            {canUpdate ? (
              <button
                type="button"
                aria-label="Edit store"
                data-tooltip="Edit store"
                title="Edit store"
                onClick={() => openEditForm(store)}
              >
                <Edit3 aria-hidden="true" size={16} />
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                aria-label="Delete store"
                data-tooltip="Delete store"
                title="Delete store"
                onClick={() => {
                  setConfirmDelete({
                    title: 'Delete store',
                    message: `Delete ${store.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    store,
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

  function openCreateForm() {
    setEditingStore(null)
    setFormErrors({})
    setActiveStoreTab('basic')
    setIsFormOpen(true)
  }

  function openEditForm(store: StoreRow) {
    setEditingStore(store)
    setFormErrors({})
    setActiveStoreTab('basic')
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingStore(null)
    setFormErrors({})
    setIsFormOpen(false)
  }

  if (isFormOpen) {
    return (
      <StoreForm
        store={editingStore}
        categoryOptions={categoryOptions}
        zoneOptions={zoneOptions}
        formErrors={formErrors}
        optionError={zones.isError || categories.isError}
        isSaving={saveStore.isPending}
        activeTab={activeStoreTab}
        onActiveTabChange={setActiveStoreTab}
        onFormErrorsChange={setFormErrors}
        onCancel={closeForm}
        onSubmit={(values) => saveStore.mutate(values)}
      />
    )
  }

  return (
    <>
      <MasterPageHeader
        title="Stores"
        description="Manage store onboarding, addresses, service fees, payout details, and status."
        actions={canCreate ? (
          <Button variant="primary" size="compact" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Store
          </Button>
        ) : null}
      />

      <MasterFilterBar
        searchLabel="Search stores"
        searchPlaceholder="Search stores, emails, or locations..."
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
              { label: 'All stores', value: 'all' },
              { label: 'Publish', value: 'active' },
              { label: 'Unpublish', value: 'inactive' },
            ],
          },
        ]}
      />

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Store Management</h3>
            <p>Showing paginated store records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(store) => store.id}
          emptyState={
            <span className="master-empty-state">
              <Store aria-hidden="true" size={30} />
              No stores found
            </span>
          }
          isLoading={stores.isLoading}
          minWidth={980}
        />

        {stores.isError ? (
          <div className="master-error">
            Stores could not be loaded. Confirm the backend is running and your admin session is
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
      <ConfirmDialog
        options={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteStore.mutate(confirmDelete.store)
          }
          setConfirmDelete(null)
        }}
      />
    </>
  )
}

function extractStoreApiValidationError(error: unknown) {
  if (!isAxiosError(error) || error.response?.status !== 422) {
    return null
  }

  const responseData = error.response.data as {
    message?: string
    errors?: Record<string, string[]>
  }
  const errors = responseData.errors

  if (!errors) {
    return null
  }

  const fieldErrors: StoreFormErrors = {}
  let tab: StoreFormTabId | null = null

  for (const field of storeValidationFields) {
    const messages = errors[field.name]

    if (messages?.length) {
      fieldErrors[field.name] = messages[0]
      tab ??= field.tab
    }
  }

  if (tab) {
    return { errors: fieldErrors, tab }
  }

  const firstErrorKey = Object.keys(errors)[0]
  const firstMessage = firstErrorKey ? errors[firstErrorKey]?.[0] : responseData.message

  if (!firstMessage) {
    return null
  }

  return {
    errors: { title: firstMessage },
    tab: 'basic' as StoreFormTabId,
  }
}

function StoreImagePreview({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <span className="store-image-placeholder">
        <ImageIcon aria-hidden="true" size={22} />
        No image
      </span>
    )
  }

  return <img className="store-table-image" src={assetUrl(src)} alt={alt} />
}

function assetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `/${path.replace(/^\/+/, '')}`
}
