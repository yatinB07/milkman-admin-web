import { Edit3, ImageIcon, PackageOpen, Plus, Trash2 } from 'lucide-react'
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
import { AdminFilePicker } from '../components/forms/AdminFilePicker'
import { AdminSelect, type AdminSelectOption } from '../components/forms/AdminSelect'
import { AdminTextarea } from '../components/forms/AdminTextarea'
import { StatusPill } from '../components/StatusPill'
import { api } from '../lib/api'
import {
  normalizePaginationMeta,
  toApiListParams,
  type PaginatedResponse,
  type PaginationMeta,
} from '../lib/apiTypes'

type ProductRow = {
  id: number
  store_id: number
  store_category_id: number
  title: string
  image_path: string | null
  description: string | null
  is_active: boolean
  store?: { id: number; title: string } | null
  store_category?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

type StoreOption = { id: number; title: string }
type StoreCategoryOption = { id: number; store_id: number; title: string }
type OptionsApiResponse<T> = { data: T[] }
type ProductsApiResponse = {
  data: ProductRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}

type ProductFormValues = {
  store_id: string
  store_category_id: string
  title: string
  image_path: string
  description: string
  is_active: boolean
}

type ProductListRow = ProductRow & { serialNumber: number }

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

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formStoreId, setFormStoreId] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formStatus, setFormStatus] = useState('1')
  const [imagePath, setImagePath] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const products = useQuery<PaginatedResponse<ProductRow>>({
    queryKey: ['admin-products', search, page],
    queryFn: async () => {
      const response = await api.get<ProductsApiResponse>('/api/v1/admin/products', {
        params: toApiListParams({ page, perPage: 10, search }),
      })

      return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
    },
    retry: false,
  })

  const stores = useQuery<StoreOption[]>({
    queryKey: ['admin-product-store-options'],
    queryFn: async () => {
      const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
        params: toApiListParams({ perPage: 100 }),
      })

      return response.data.data
    },
    retry: false,
  })

  const storeCategories = useQuery<StoreCategoryOption[]>({
    queryKey: ['admin-product-store-category-options'],
    queryFn: async () => {
      const response = await api.get<OptionsApiResponse<StoreCategoryOption>>('/api/v1/admin/store-categories', {
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

  const categoryOptions = useMemo(
    () =>
      storeCategories.data
        ?.filter((category) => !formStoreId || String(category.store_id) === formStoreId)
        .map((category) => ({ label: category.title, value: String(category.id) })) ?? [],
    [formStoreId, storeCategories.data],
  )

  const saveProduct = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = toProductPayload(values)

      if (editingProduct) {
        const response = await api.put<{ data: ProductRow }>(
          `/api/v1/admin/products/${editingProduct.id}`,
          payload,
        )
        return response.data.data
      }

      const response = await api.post<{ data: ProductRow }>('/api/v1/admin/products', payload)
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      closeForm()
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data as { errors?: Record<string, string[]> }
        setFormError(
          data.errors?.store_id?.[0] ??
            data.errors?.store_category_id?.[0] ??
            data.errors?.title?.[0] ??
            'Check required fields.',
        )
        return
      }

      setFormError('Product could not be saved.')
    },
  })

  const deleteProduct = useMutation({
    mutationFn: async (product: ProductRow) => {
      await api.delete(`/api/v1/admin/products/${product.id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })

  const apiRows = products.data?.data ?? []
  const filteredRows =
    status === 'all' ? apiRows : apiRows.filter((product) => product.is_active === (status === 'active'))
  const meta = products.data?.meta ?? defaultMeta
  const rows: ProductListRow[] = filteredRows.map((product, index) => ({
    ...product,
    serialNumber: (meta.from || 1) + index,
  }))

  const columns = useMemo<MasterTableColumn<ProductListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (product) => product.serialNumber, width: '90px' },
      {
        key: 'image',
        header: 'Image',
        align: 'center',
        render: (product) => <ProductImagePreview src={product.image_path} alt={`${product.title} image`} />,
      },
      {
        key: 'title',
        header: 'Product',
        render: (product) => (
          <span className="stacked-cell">
            <strong>{product.title}</strong>
            <small>#{product.id}</small>
          </span>
        ),
      },
      { key: 'store', header: 'Store', render: (product) => product.store?.title ?? `Store #${product.store_id}` },
      {
        key: 'category',
        header: 'Category',
        render: (product) => product.store_category?.title ?? `Category #${product.store_category_id}`,
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (product) => (
          <StatusPill tone={product.is_active ? 'success' : 'danger'}>
            {product.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      { key: 'updated', header: 'Updated', render: (product) => formatDate(product.updated_at) },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (product) => (
          <span className="row-actions">
            <button
              type="button"
              aria-label="Edit product"
              data-tooltip="Edit product"
              title="Edit product"
              onClick={() => openEditForm(product)}
            >
              <Edit3 aria-hidden="true" size={16} />
            </button>
            <button
              type="button"
              aria-label="Delete product"
              data-tooltip="Delete product"
              title="Delete product"
              onClick={() => {
                if (window.confirm(`Delete ${product.title}?`)) deleteProduct.mutate(product)
              }}
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </span>
        ),
      },
    ],
    [deleteProduct],
  )

  function openCreateForm() {
    setEditingProduct(null)
    setFormStoreId('')
    setFormCategoryId('')
    setFormStatus('1')
    setImagePath('')
    setDescription('')
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(product: ProductRow) {
    setEditingProduct(product)
    setFormStoreId(String(product.store_id))
    setFormCategoryId(String(product.store_category_id))
    setFormStatus(product.is_active ? '1' : '0')
    setImagePath(product.image_path ?? '')
    setDescription(product.description ?? '')
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingProduct(null)
    setFormStoreId('')
    setFormCategoryId('')
    setFormStatus('1')
    setImagePath('')
    setDescription('')
    setFormError(null)
    setIsFormOpen(false)
  }

  function handleStoreChange(storeId: string) {
    setFormStoreId(storeId)
    setFormCategoryId('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()

    if (!formStoreId || !formCategoryId || !title) {
      setFormError('Store, Category, and Product Title are required.')
      return
    }

    setFormError(null)
    saveProduct.mutate({
      store_id: formStoreId,
      store_category_id: formCategoryId,
      title,
      image_path: imagePath,
      description,
      is_active: formStatus === '1',
    })
  }

  return (
    <>
      <MasterPageHeader
        title="Products"
        description="Manage store products before adding variants and gallery images."
        actions={
          <button className="primary-button is-compact" type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Product
          </button>
        }
      />

      <MasterFilterBar
        searchLabel="Search products"
        searchPlaceholder="Search products..."
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
              { label: 'All products', value: 'all' },
              { label: 'Publish', value: 'active' },
              { label: 'Unpublish', value: 'inactive' },
            ],
          },
        ]}
      />

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Product Directory</h3>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(product) => product.id}
          emptyState={
            <span className="master-empty-state">
              <PackageOpen aria-hidden="true" size={30} />
              No products found
            </span>
          }
          isLoading={products.isLoading}
          minWidth={1040}
        />

        {products.isError ? <div className="master-error">Products could not be loaded.</div> : null}

        <MasterPagination meta={meta} onPageChange={setPage} />
      </section>

      {isFormOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="store-form-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="modal-header">
              <div>
                <h3 id="product-form-title">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              </div>
              <button type="button" className="secondary-button" onClick={closeForm}>
                Close
              </button>
            </div>

            <form className="store-form" onSubmit={handleSubmit}>
              <FormSection title="Product Information" columns={2}>
                <label className="form-field">
                  <FieldLabel label="Store" required />
                  <AdminSelect
                    options={storeOptions}
                    placeholder="Search and select store"
                    value={formStoreId}
                    onChange={handleStoreChange}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Product Category" required />
                  <AdminSelect
                    options={categoryOptions}
                    placeholder={formStoreId ? 'Search and select category' : 'Select store first'}
                    value={formCategoryId}
                    onChange={setFormCategoryId}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Product Title" required />
                  <input name="title" maxLength={255} defaultValue={editingProduct?.title ?? ''} />
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

              <FormSection title="Media And Description" columns={2}>
                <label className="form-field">
                  <FieldLabel label="Product Image" />
                  <AdminFilePicker
                    name="image_path"
                    label="Product image"
                    value={imagePath}
                    onChange={setImagePath}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Product Description" />
                  <AdminTextarea
                    name="description"
                    value={description}
                    maxLength={1200}
                    placeholder="Enter product description"
                    helpText="Shown in product details"
                    onChange={setDescription}
                  />
                </label>
              </FormSection>

              {formError ? <div className="form-error">{formError}</div> : null}
              {stores.isError || storeCategories.isError ? (
                <div className="form-error">Store or category options could not be loaded.</div>
              ) : null}

              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button className="primary-button is-compact" type="submit" disabled={saveProduct.isPending}>
                  {saveProduct.isPending ? 'Saving...' : editingProduct ? 'Save Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
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

function ProductImagePreview({ src, alt }: { src: string | null; alt: string }) {
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

function toProductPayload(values: ProductFormValues) {
  return {
    store_id: Number(values.store_id),
    store_category_id: Number(values.store_category_id),
    title: values.title,
    image_path: values.image_path.trim() || null,
    description: values.description.trim() || null,
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
