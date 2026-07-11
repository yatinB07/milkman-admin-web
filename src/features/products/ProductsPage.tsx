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
import { Button, toast } from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import type { PaginationMeta } from '../../lib/apiTypes'
import { getModuleActionPermission } from '../../routes/adminModules'
import { adminStore, useAdminStore } from '../../store/adminStore'
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

type ProductFormErrors = Partial<Record<'store_id' | 'store_category_id' | 'title', string>>

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

export function ProductsPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formStoreId, setFormStoreId] = useState('')
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { product: ProductRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('products', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('products', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('products', 'delete'))

  const products = useQuery({
    queryKey: ['admin-products', search, page, listPerPage],
    queryFn: () => listProducts({ page, perPage: listPerPage, search }),
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
      toast.success(editingProduct ? 'Product updated successfully.' : 'Product created successfully.')
      closeForm()
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data as { errors?: Record<string, string[]> }
        setFormErrors({
          store_id: data.errors?.store_id?.[0],
          store_category_id: data.errors?.store_category_id?.[0],
          title: data.errors?.title?.[0],
        })
        return
      }

      toast.error('Product could not be saved.')
    },
  })

  const removeProduct = useMutation({
    mutationFn: async (product: ProductRow) => deleteProduct(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Product deleted successfully.')
    },
    onError: () => {
      toast.error('Product could not be deleted. Try again.')
    },
  })

  const apiRows = products.data?.data ?? []
  const filteredRows =
    status === 'all' ? apiRows : apiRows.filter((product) => product.is_active === (status === 'active'))
  const meta = products.data?.meta ?? { ...defaultMeta, perPage: listPerPage }
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
            {canUpdate ? (
              <button
                type="button"
                aria-label="Edit product"
                data-tooltip="Edit product"
                title="Edit product"
                onClick={() => openEditForm(product)}
              >
                <Edit3 aria-hidden="true" size={16} />
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                aria-label="Delete product"
                data-tooltip="Delete product"
                title="Delete product"
                onClick={() => {
                  setConfirmDelete({
                    title: 'Delete product',
                    message: `Delete ${product.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    product,
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
    setEditingProduct(null)
    setFormStoreId('')
    setFormErrors({})
    setIsFormOpen(true)
  }

  function openEditForm(product: ProductRow) {
    setEditingProduct(product)
    setFormStoreId(String(product.store_id))
    setFormErrors({})
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingProduct(null)
    setFormStoreId('')
    setFormErrors({})
    setIsFormOpen(false)
  }

  function handleSubmit(values: ProductFormValues) {
    const nextErrors: ProductFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      store_category_id: values.store_category_id ? undefined : 'Product Category is required.',
      title: values.title ? undefined : 'Product Title is required.',
    }

    if (nextErrors.store_id || nextErrors.store_category_id || nextErrors.title) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveProduct.mutate(values)
  }

  return (
    <>
      <MasterPageHeader
        title="Products"
        description="Manage store products before adding variants and gallery images."
        actions={canCreate ? (
          <Button variant="primary" size="compact" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Product
          </Button>
        ) : null}
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
          <section className="store-form-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="modal-header">
              <div>
                <h3 id="product-form-title">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              </div>
              <Button variant="secondary" onClick={closeForm}>
                Close
              </Button>
            </div>

            <ProductForm
              product={editingProduct}
              storeOptions={storeOptions}
              categoryOptions={categoryOptions}
              formErrors={formErrors}
              optionError={stores.isError || storeCategories.isError}
              isSaving={saveProduct.isPending}
              onStoreChange={setFormStoreId}
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
            removeProduct.mutate(confirmDelete.product)
          }
          setConfirmDelete(null)
        }}
      />
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
