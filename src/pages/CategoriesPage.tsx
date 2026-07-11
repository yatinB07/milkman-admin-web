import { Edit3, ImageIcon, Package, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { type FormEvent, useMemo, useState } from 'react'
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

type CategoryRow = {
  id: number
  title: string
  image_path: string | null
  cover_path: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type CategoryFormValues = {
  title: string
  image_path: string
  cover_path: string
  is_active: boolean
}

type CategoriesApiResponse = {
  data: CategoryRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}

type CategoryListRow = CategoryRow & {
  serialNumber: number
}

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

export function CategoriesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formStatus, setFormStatus] = useState('1')
  const [imagePath, setImagePath] = useState('')
  const [coverPath, setCoverPath] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { category: CategoryRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('categories', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('categories', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('categories', 'delete'))

  const categories = useQuery<PaginatedResponse<CategoryRow>>({
    queryKey: ['admin-categories', search, page, listPerPage],
    queryFn: async () => {
      const response = await api.get<CategoriesApiResponse>('/api/v1/admin/categories', {
        params: toApiListParams({
          page,
          perPage: listPerPage,
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

  const saveCategory = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const payload = toCategoryPayload(values)

      if (editingCategory) {
        const response = await api.put<{ data: CategoryRow }>(
          `/api/v1/admin/categories/${editingCategory.id}`,
          payload,
        )

        return response.data.data
      }

      const response = await api.post<{ data: CategoryRow }>('/api/v1/admin/categories', payload)

      return response.data.data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-store-category-options'] }),
      ])
      closeForm()
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data as { errors?: Record<string, string[]> }
        setFormError(errors.errors?.title?.[0] ?? 'Check the highlighted fields and try again.')
        return
      }

      setFormError('Category could not be saved. Check the required fields and try again.')
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (category: CategoryRow) => {
      await api.delete(`/api/v1/admin/categories/${category.id}`)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-store-category-options'] }),
      ])
    },
  })

  const apiRows = categories.data?.data ?? []
  const filteredRows =
    status === 'all'
      ? apiRows
      : apiRows.filter((category) => category.is_active === (status === 'active'))
  const meta = categories.data?.meta ?? { ...defaultMeta, perPage: listPerPage }
  const rows: CategoryListRow[] = filteredRows.map((category, index) => ({
    ...category,
    serialNumber: (meta.from || 1) + index,
  }))

  const columns = useMemo<MasterTableColumn<CategoryListRow>[]>(
    () => [
      {
        key: 'serial',
        header: 'Sr No.',
        render: (category) => category.serialNumber,
        width: '90px',
      },
      {
        key: 'title',
        header: 'Category',
        render: (category) => (
          <span className="stacked-cell">
            <strong>{category.title}</strong>
            <small>#{category.id}</small>
          </span>
        ),
      },
      {
        key: 'image',
        header: 'Image',
        align: 'center',
        render: (category) => (
          <CategoryImagePreview src={category.image_path} alt={`${category.title} image`} />
        ),
      },
      {
        key: 'cover',
        header: 'Cover',
        align: 'center',
        render: (category) => (
          <CategoryImagePreview src={category.cover_path} alt={`${category.title} cover`} />
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
      {
        key: 'updated',
        header: 'Updated',
        render: (category) => formatDate(category.updated_at),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (category) => (
          <span className="row-actions">
            {canUpdate ? (
              <button
                type="button"
                aria-label="Edit category"
                data-tooltip="Edit category"
                title="Edit category"
                onClick={() => openEditForm(category)}
              >
                <Edit3 aria-hidden="true" size={16} />
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                aria-label="Delete category"
                data-tooltip="Delete category"
                title="Delete category"
                onClick={() => {
                  setConfirmDelete({
                    title: 'Delete category',
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
    setFormStatus('1')
    setImagePath('')
    setCoverPath('')
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(category: CategoryRow) {
    setEditingCategory(category)
    setFormStatus(category.is_active ? '1' : '0')
    setImagePath(category.image_path ?? '')
    setCoverPath(category.cover_path ?? '')
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingCategory(null)
    setFormStatus('1')
    setImagePath('')
    setCoverPath('')
    setFormError(null)
    setIsFormOpen(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()

    if (!title) {
      setFormError('Category Name is required.')
      return
    }

    setFormError(null)
    saveCategory.mutate({
      title,
      image_path: imagePath,
      cover_path: coverPath,
      is_active: formStatus === '1',
    })
  }

  return (
    <>
      <MasterPageHeader
        title="Categories"
        description="Manage global product categories used during store onboarding."
        actions={canCreate ? (
          <button className="primary-button is-compact" type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Category
          </button>
        ) : null}
      />

      <MasterFilterBar
        searchLabel="Search categories"
        searchPlaceholder="Search categories..."
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
            <h3>Category Directory</h3>
            <p>Showing paginated category records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(category) => category.id}
          emptyState={
            <span className="master-empty-state">
              <Package aria-hidden="true" size={30} />
              No categories found
            </span>
          }
          isLoading={categories.isLoading}
          minWidth={980}
        />

        {categories.isError ? (
          <div className="master-error">
            Categories could not be loaded. Confirm the backend is running and your admin session is
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
          <section className="store-form-modal" role="dialog" aria-modal="true" aria-labelledby="category-form-title">
            <div className="modal-header">
              <div>
                <h3 id="category-form-title">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              </div>
              <button type="button" className="secondary-button" onClick={closeForm}>
                Close
              </button>
            </div>

            <form className="store-form" onSubmit={handleSubmit}>
              <FormSection title="Category Information" columns={2}>
                <label className="form-field">
                  <FieldLabel label="Category Name" required />
                  <input name="title" maxLength={255} defaultValue={editingCategory?.title ?? ''} />
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
                  <FieldLabel label="Category Cover" />
                  <AdminFilePicker
                    name="cover_path"
                    label="Category cover"
                    value={coverPath}
                    onChange={setCoverPath}
                  />
                </label>
              </FormSection>

              {formError ? <div className="form-error">{formError}</div> : null}

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

function FormSection({
  title,
  columns = 2,
  children,
}: {
  title: string
  columns?: 1 | 2 | 3
  children: React.ReactNode
}) {
  return (
    <section className="store-form-section">
      <h4>{title}</h4>
      <div className="form-grid" data-columns={columns}>
        {children}
      </div>
    </section>
  )
}

function CategoryImagePreview({ src, alt }: { src: string | null; alt: string }) {
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

function toCategoryPayload(values: CategoryFormValues) {
  return {
    title: values.title,
    image_path: nullableString(values.image_path),
    cover_path: nullableString(values.cover_path),
    is_active: values.is_active,
  }
}

function nullableString(value: string) {
  return value.trim() === '' ? null : value.trim()
}

function assetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `/${path.replace(/^\/+/, '')}`
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    : 'Never'
}
