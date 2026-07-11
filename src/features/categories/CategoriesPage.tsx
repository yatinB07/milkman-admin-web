import { Edit3, ImageIcon, Package, Plus, Trash2 } from 'lucide-react'
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
import { Button, PageSkeleton, RecordLoadError, RowActionMenu, toast } from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import type { PaginationMeta } from '../../lib/apiTypes'
import { getModuleActionPermission } from '../../routes/adminModules'
import { navigateToHash, useHashPath } from '../../routes/hashRouting'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { CategoryForm } from './CategoryForm'
import {
  createCategory,
  deleteCategory as removeCategory,
  getCategory,
  listCategories,
  updateCategory,
} from './categoryRepository'
import { toCategoryPayload } from './categoryService'
import type { CategoryFormValues, CategoryListRow, CategoryRow } from './categoryTypes'

type CategoryFormErrors = Partial<Record<'title', string>>

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

export function CategoriesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCategoryFormRoute(activePath)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { category: CategoryRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('categories', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('categories', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('categories', 'delete'))

  const categories = useQuery({
    queryKey: ['admin-categories', search, status, page, listPerPage],
    queryFn: () => listCategories({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const routeCategory = useQuery({
    queryKey: ['admin-category', formRoute?.mode === 'edit' ? formRoute.categoryId : null],
    queryFn: () => getCategory(formRoute?.mode === 'edit' ? formRoute.categoryId : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingCategory = formRoute?.mode === 'edit'
    ? routeCategory.data ?? editingCategory
    : editingCategory

  const saveCategory = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const payload = toCategoryPayload(values)

      return currentEditingCategory ? updateCategory(currentEditingCategory.id, payload) : createCategory(payload)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-store-category-options'] }),
      ])
      toast.success(currentEditingCategory ? 'Category updated successfully.' : 'Category created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data as { errors?: Record<string, string[]> }
        setFormErrors({ title: errors.errors?.title?.[0] ?? 'Category Name is required.' })
        return
      }

      toast.error('Category could not be saved. Check the required fields and try again.')
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (category: CategoryRow) => removeCategory(category.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-store-category-options'] }),
      ])
      toast.success('Category deleted successfully.')
    },
    onError: () => {
      toast.error('Category could not be deleted. Try again.')
    },
  })

  const apiRows = categories.data?.data ?? []
  const meta = categories.data?.meta ?? { ...defaultMeta, perPage: listPerPage }
  const rows: CategoryListRow[] = apiRows.map((category, index) => ({
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
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit category',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(category),
              },
              canDelete && {
                label: 'Delete category',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete category',
                    message: `Delete ${category.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    category,
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
    setEditingCategory(null)
    setFormErrors({})
    navigateToHash('/categories/create')
  }

  function openEditForm(category: CategoryRow) {
    dirtyFormStore.reset()
    setEditingCategory(category)
    setFormErrors({})
    navigateToHash(`/categories/edit/${category.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingCategory(null)
    setFormErrors({})
    navigateToHash('/categories')
  }

  function handleSubmit(values: CategoryFormValues) {
    if (!values.title) {
      setFormErrors({ title: 'Category Name is required.' })
      return
    }

    setFormErrors({})
    saveCategory.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingCategory && routeCategory.isLoading) {
      return <PageSkeleton label="Loading category" />
    }

    if (formRoute.mode === 'edit' && !currentEditingCategory) {
      return (
        <RecordLoadError
          title="Edit Category"
          description="The requested category could not be loaded."
          message="Category could not be loaded. Check the record or try again."
          backLabel="Back to Categories"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingCategory ? 'Edit Category' : 'Add Category'}
          description="Manage global category images, cover, and status."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Categories
            </Button>
          }
        />
        <section className="data-panel">
          <CategoryForm
            category={currentEditingCategory}
            formErrors={formErrors}
            isSaving={saveCategory.isPending}
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
        title="Categories"
        description="Manage global product categories used during store onboarding."
        actions={canCreate ? (
          <Button variant="primary" size="compact" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Category
          </Button>
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

function parseCategoryFormRoute(path: string) {
  if (path === '/categories/create') return { mode: 'create' as const }

  const editMatch = path.match(/^\/categories\/edit\/(\d+)$/)

  if (editMatch) return { mode: 'edit' as const, categoryId: Number(editMatch[1]) }

  return null
}
