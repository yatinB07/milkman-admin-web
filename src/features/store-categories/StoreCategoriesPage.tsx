import { Edit3, ImageIcon, ListTree, Plus, Trash2 } from 'lucide-react'
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
import type { PaginationMeta } from '../../lib/apiTypes'
import { getModuleActionPermission } from '../../routes/adminModules'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { StoreCategoryForm } from './StoreCategoryForm'
import {
  createStoreCategory,
  deleteStoreCategory as removeStoreCategory,
  listStoreCategories,
  listStoreCategoryStores,
  updateStoreCategory,
} from './storeCategoryRepository'
import { toStoreCategoryPayload, toStoreOptions } from './storeCategoryService'
import type { StoreCategoryFormValues, StoreCategoryListRow, StoreCategoryRow } from './storeCategoryTypes'

type StoreCategoryFormErrors = Partial<Record<'store_id' | 'title', string>>

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

export function StoreCategoriesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingCategory, setEditingCategory] = useState<StoreCategoryRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<StoreCategoryFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<
    (ConfirmDialogOptions & { category: StoreCategoryRow }) | null
  >(null)
  const canCreate = adminStore.can(getModuleActionPermission('store-categories', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('store-categories', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('store-categories', 'delete'))

  const storeCategories = useQuery({
    queryKey: ['admin-store-categories', search, page, listPerPage],
    queryFn: () => listStoreCategories({ page, perPage: listPerPage, search }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-store-category-store-options'],
    queryFn: listStoreCategoryStores,
    retry: false,
  })

  const storeOptions = useMemo(() => toStoreOptions(stores.data), [stores.data])

  const saveCategory = useMutation({
    mutationFn: async (values: StoreCategoryFormValues) => {
      const payload = toStoreCategoryPayload(values)

      return editingCategory
        ? updateStoreCategory(editingCategory.id, payload)
        : createStoreCategory(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-store-categories'] })
      toast.success(editingCategory ? 'Store category updated successfully.' : 'Store category created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data as { errors?: Record<string, string[]> }
        setFormErrors({
          store_id: data.errors?.store_id?.[0],
          title: data.errors?.title?.[0],
        })
        return
      }

      toast.error('Store category could not be saved.')
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (category: StoreCategoryRow) => removeStoreCategory(category.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-store-categories'] })
      toast.success('Store category deleted successfully.')
    },
    onError: () => {
      toast.error('Store category could not be deleted. Try again.')
    },
  })

  const apiRows = storeCategories.data?.data ?? []
  const filteredRows =
    status === 'all'
      ? apiRows
      : apiRows.filter((category) => category.is_active === (status === 'active'))
  const meta = storeCategories.data?.meta ?? { ...defaultMeta, perPage: listPerPage }
  const rows: StoreCategoryListRow[] = filteredRows.map((category, index) => ({
    ...category,
    serialNumber: (meta.from || 1) + index,
  }))

  const columns = useMemo<MasterTableColumn<StoreCategoryListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (category) => category.serialNumber, width: '90px' },
      {
        key: 'title',
        header: 'Menu Category',
        render: (category) => (
          <span className="stacked-cell">
            <strong>{category.title}</strong>
            <small>{category.store?.title ?? `Store #${category.store_id}`}</small>
          </span>
        ),
      },
      {
        key: 'image',
        header: 'Image',
        align: 'center',
        render: (category) => (
          <StoreCategoryImagePreview src={category.image_path} alt={`${category.title} image`} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (category) => (
          <StatusPill tone={category.is_active ? 'success' : 'danger'}>
            {category.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      { key: 'updated', header: 'Updated', render: (category) => formatDate(category.updated_at) },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (category) => (
          <span className="row-actions">
            {canUpdate ? (
              <button
                type="button"
                aria-label="Edit store category"
                data-tooltip="Edit store category"
                title="Edit store category"
                onClick={() => openEditForm(category)}
              >
                <Edit3 aria-hidden="true" size={16} />
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                aria-label="Delete store category"
                data-tooltip="Delete store category"
                title="Delete store category"
                onClick={() => {
                  setConfirmDelete({
                    title: 'Delete store category',
                    message: `Delete ${category.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    category,
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
    dirtyFormStore.reset()
    setEditingCategory(null)
    setFormErrors({})
    setIsFormOpen(true)
  }

  function openEditForm(category: StoreCategoryRow) {
    dirtyFormStore.reset()
    setEditingCategory(category)
    setFormErrors({})
    setIsFormOpen(true)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingCategory(null)
    setFormErrors({})
    setIsFormOpen(false)
  }

  function handleSubmit(values: StoreCategoryFormValues) {
    const nextErrors: StoreCategoryFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      title: values.title ? undefined : 'Category Name is required.',
    }

    if (nextErrors.store_id || nextErrors.title) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveCategory.mutate(values)
  }

  return (
    <>
      <MasterPageHeader
        title="Store Categories"
        description="Manage per-store menu categories used by products."
        actions={canCreate ? (
          <Button variant="primary" size="compact" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Store Category
          </Button>
        ) : null}
      />

      <MasterFilterBar
        searchLabel="Search store categories"
        searchPlaceholder="Search categories or stores..."
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
              { label: 'All categories', value: 'all' },
              { label: 'Publish', value: 'active' },
              { label: 'Unpublish', value: 'inactive' },
            ],
          },
        ]}
      />

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Store Category Directory</h3>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(category) => category.id}
          emptyState={
            <span className="master-empty-state">
              <ListTree aria-hidden="true" size={30} />
              No store categories found
            </span>
          }
          isLoading={storeCategories.isLoading}
          minWidth={900}
        />

        {storeCategories.isError ? (
          <div className="master-error">Store categories could not be loaded.</div>
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
          <section className="store-form-modal" role="dialog" aria-modal="true" aria-labelledby="store-category-title">
            <div className="modal-header">
              <div>
                <h3 id="store-category-title">
                  {editingCategory ? 'Edit Store Category' : 'Add Store Category'}
                </h3>
              </div>
              <Button variant="secondary" onClick={() => closeForm()}>
                Close
              </Button>
            </div>

            <StoreCategoryForm
              category={editingCategory}
              storeOptions={storeOptions}
              formErrors={formErrors}
              optionError={stores.isError}
              isSaving={saveCategory.isPending}
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
            deleteCategory.mutate(confirmDelete.category)
          }
          setConfirmDelete(null)
        }}
      />
    </>
  )
}

function StoreCategoryImagePreview({ src, alt }: { src: string | null; alt: string }) {
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
  if (/^https?:\/\//i.test(path)) return path
  return `/${path.replace(/^\/+/, '')}`
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    : 'Never'
}
