import { Edit3, ImageIcon, ListTree, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { type FormEvent, type ReactNode, useMemo, useState } from 'react'
import {
  MasterDataTable,
  MasterFilterBar,
  MasterPageHeader,
  MasterPagination,
  type MasterTableColumn,
} from '../components/master'
import { ConfirmDialog, type ConfirmDialogOptions } from '../components/common/ConfirmDialog'
import { AdminFilePicker } from '../components/forms/AdminFilePicker'
import { AdminSelect, type AdminSelectOption } from '../components/forms/AdminSelect'
import { StatusPill } from '../components/StatusPill'
import { api } from '../lib/api'
import {
  normalizePaginationMeta,
  toApiListParams,
  type PaginatedResponse,
  type PaginationMeta,
} from '../lib/apiTypes'
import { getModuleActionPermission } from '../routes/adminModules'
import { adminStore, useAdminStore } from '../store/adminStore'

type StoreCategoryRow = {
  id: number
  store_id: number
  title: string
  image_path: string | null
  is_active: boolean
  store?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

type StoreOption = { id: number; title: string }
type OptionsApiResponse = { data: StoreOption[] }
type StoreCategoriesApiResponse = {
  data: StoreCategoryRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}

type StoreCategoryFormValues = {
  store_id: string
  title: string
  image_path: string
  is_active: boolean
}

type StoreCategoryListRow = StoreCategoryRow & { serialNumber: number }

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

const statusOptions: AdminSelectOption[] = [
  { label: 'Publish', value: '1' },
  { label: 'Unpublish', value: '0' },
]

export function StoreCategoriesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingCategory, setEditingCategory] = useState<StoreCategoryRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formStoreId, setFormStoreId] = useState('')
  const [formStatus, setFormStatus] = useState('1')
  const [imagePath, setImagePath] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<
    (ConfirmDialogOptions & { category: StoreCategoryRow }) | null
  >(null)
  const canCreate = adminStore.can(getModuleActionPermission('store-categories', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('store-categories', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('store-categories', 'delete'))

  const storeCategories = useQuery<PaginatedResponse<StoreCategoryRow>>({
    queryKey: ['admin-store-categories', search, page, listPerPage],
    queryFn: async () => {
      const response = await api.get<StoreCategoriesApiResponse>('/api/v1/admin/store-categories', {
        params: toApiListParams({ page, perPage: listPerPage, search }),
      })

      return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
    },
    retry: false,
  })

  const stores = useQuery<StoreOption[]>({
    queryKey: ['admin-store-category-store-options'],
    queryFn: async () => {
      const response = await api.get<OptionsApiResponse>('/api/v1/admin/stores', {
        params: toApiListParams({ perPage: 100 }),
      })

      return response.data.data
    },
    retry: false,
  })

  const storeOptions = useMemo(
    () => stores.data?.map((store) => ({ label: store.title, value: String(store.id) })) ?? [],
    [stores.data],
  )

  const saveCategory = useMutation({
    mutationFn: async (values: StoreCategoryFormValues) => {
      const payload = toStoreCategoryPayload(values)

      if (editingCategory) {
        const response = await api.put<{ data: StoreCategoryRow }>(
          `/api/v1/admin/store-categories/${editingCategory.id}`,
          payload,
        )
        return response.data.data
      }

      const response = await api.post<{ data: StoreCategoryRow }>('/api/v1/admin/store-categories', payload)
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-store-categories'] })
      closeForm()
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data as { errors?: Record<string, string[]> }
        setFormError(data.errors?.store_id?.[0] ?? data.errors?.title?.[0] ?? 'Check required fields.')
        return
      }

      setFormError('Store category could not be saved.')
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (category: StoreCategoryRow) => {
      await api.delete(`/api/v1/admin/store-categories/${category.id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-store-categories'] })
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
    setEditingCategory(null)
    setFormStoreId('')
    setFormStatus('1')
    setImagePath('')
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(category: StoreCategoryRow) {
    setEditingCategory(category)
    setFormStoreId(String(category.store_id))
    setFormStatus(category.is_active ? '1' : '0')
    setImagePath(category.image_path ?? '')
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingCategory(null)
    setFormStoreId('')
    setFormStatus('1')
    setImagePath('')
    setFormError(null)
    setIsFormOpen(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()

    if (!formStoreId || !title) {
      setFormError('Store and Category Name are required.')
      return
    }

    setFormError(null)
    saveCategory.mutate({
      store_id: formStoreId,
      title,
      image_path: imagePath,
      is_active: formStatus === '1',
    })
  }

  return (
    <>
      <MasterPageHeader
        title="Store Categories"
        description="Manage per-store menu categories used by products."
        actions={canCreate ? (
          <button className="primary-button is-compact" type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Store Category
          </button>
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
              <button type="button" className="secondary-button" onClick={closeForm}>
                Close
              </button>
            </div>

            <form className="store-form" onSubmit={handleSubmit}>
              <FormSection title="Store Category Information" columns={2}>
                <label className="form-field">
                  <FieldLabel label="Store" required />
                  <AdminSelect
                    options={storeOptions}
                    placeholder="Search and select store"
                    value={formStoreId}
                    onChange={setFormStoreId}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Category Name" required />
                  <input name="title" maxLength={255} defaultValue={editingCategory?.title ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Category Image" />
                  <AdminFilePicker
                    name="image_path"
                    label="Category image"
                    value={imagePath}
                    onChange={setImagePath}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Status" />
                  <AdminSelect
                    isSearchable={false}
                    options={statusOptions}
                    value={formStatus}
                    onChange={setFormStatus}
                  />
                </label>
              </FormSection>

              {formError ? <div className="form-error">{formError}</div> : null}
              {stores.isError ? <div className="form-error">Stores could not be loaded.</div> : null}

              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button className="primary-button is-compact" type="submit" disabled={saveCategory.isPending}>
                  {saveCategory.isPending ? 'Saving...' : editingCategory ? 'Save Category' : 'Add Category'}
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
            deleteCategory.mutate(confirmDelete.category)
          }
          setConfirmDelete(null)
        }}
      />
    </>
  )
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <span>
      {label} {required ? <span className="required-mark" aria-hidden="true">*</span> : null}
    </span>
  )
}

function FormSection({ title, columns = 2, children }: { title: string; columns?: 1 | 2 | 3; children: ReactNode }) {
  return (
    <section className="store-form-section">
      <h4>{title}</h4>
      <div className="form-grid" data-columns={columns}>
        {children}
      </div>
    </section>
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

function toStoreCategoryPayload(values: StoreCategoryFormValues) {
  return {
    store_id: Number(values.store_id),
    title: values.title,
    image_path: values.image_path.trim() || null,
    is_active: values.is_active,
  }
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
