import { Edit3, ImageIcon, PackageOpen, Plus, Trash2 } from 'lucide-react'
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
import { StatusPill } from '../../components/StatusPill'
import type { PaginationMeta } from '../../lib/apiTypes'
import { ProductForm } from './ProductForm'
import {
  createProduct,
  deleteProduct,
  listProducts,
  listProductStoreCategories,
  listProductStores,
  updateProduct,
} from './productRepository'
import { toProductPayload, toStoreCategorySelectOptions, toStoreSelectOptions } from './productService'
import type { ProductFormValues, ProductListRow, ProductRow } from './productTypes'

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formStoreId, setFormStoreId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const products = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => listProducts({ page, perPage: 10, search }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-product-store-options'],
    queryFn: listProductStores,
    retry: false,
  })

  const storeCategories = useQuery({
    queryKey: ['admin-product-store-category-options'],
    queryFn: listProductStoreCategories,
    retry: false,
  })

  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])
  const categoryOptions = useMemo(
    () => toStoreCategorySelectOptions(storeCategories.data, formStoreId),
    [formStoreId, storeCategories.data],
  )

  const saveProduct = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = toProductPayload(values)

      return editingProduct ? updateProduct(editingProduct.id, payload) : createProduct(payload)
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

  const removeProduct = useMutation({
    mutationFn: async (product: ProductRow) => deleteProduct(product.id),
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
                if (window.confirm(`Delete ${product.title}?`)) removeProduct.mutate(product)
              }}
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </span>
        ),
      },
    ],
    [removeProduct],
  )

  function openCreateForm() {
    setEditingProduct(null)
    setFormStoreId('')
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(product: ProductRow) {
    setEditingProduct(product)
    setFormStoreId(String(product.store_id))
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingProduct(null)
    setFormStoreId('')
    setFormError(null)
    setIsFormOpen(false)
  }

  function handleSubmit(values: ProductFormValues) {
    if (!values.store_id || !values.store_category_id || !values.title) {
      setFormError('Store, Category, and Product Title are required.')
      return
    }

    setFormError(null)
    saveProduct.mutate(values)
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

            <ProductForm
              product={editingProduct}
              storeOptions={storeOptions}
              categoryOptions={categoryOptions}
              formError={formError}
              optionError={stores.isError || storeCategories.isError}
              isSaving={saveProduct.isPending}
              onStoreChange={setFormStoreId}
              onCancel={closeForm}
              onSubmit={handleSubmit}
            />
          </section>
        </div>
      ) : null}
    </>
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

function assetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `/${path.replace(/^\/+/, '')}`
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    : 'Never'
}
