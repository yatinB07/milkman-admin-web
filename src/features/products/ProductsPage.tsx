import { Edit3, PackageOpen, Plus, Trash2 } from 'lucide-react'
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
import {
  Button,
  ListLoadError,
  PageSkeleton,
  RecordLoadError,
  RowActionMenu,
  TableImagePreview,
  toast,
} from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import { emptyPaginationMeta } from '../../lib/apiTypes'
import { formatAdminDate } from '../../lib/formatters'
import { getModuleActionPermission } from '../../routes/adminModules'
import { navigateToHash, parseCrudFormRoute, useHashPath } from '../../routes/hashRouting'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { ProductForm } from './ProductForm'
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  listProductStoreCategories,
  listProductStores,
  updateProduct,
} from './productRepository'
import { toProductPayload, toStoreCategorySelectOptions, toStoreSelectOptions } from './productService'
import type { ProductFormValues, ProductListRow, ProductRow } from './productTypes'

type ProductFormErrors = Partial<Record<'store_id' | 'store_category_id' | 'title', string>>

export function ProductsPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/products')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)
  const [formStoreId, setFormStoreId] = useState('')
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { product: ProductRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('products', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('products', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('products', 'delete'))

  const products = useQuery({
    queryKey: ['admin-products', search, status, page, listPerPage],
    queryFn: () => listProducts({ page, perPage: listPerPage, search, status }),
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

  const routeProduct = useQuery({
    queryKey: ['admin-product', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getProduct(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingProduct = formRoute?.mode === 'edit' ? routeProduct.data ?? editingProduct : editingProduct
  const selectedFormStoreId = formStoreId || (currentEditingProduct ? String(currentEditingProduct.store_id) : '')

  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])
  const categoryOptions = useMemo(
    () => toStoreCategorySelectOptions(storeCategories.data, selectedFormStoreId),
    [selectedFormStoreId, storeCategories.data],
  )

  const saveProduct = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = toProductPayload(values)

      return currentEditingProduct ? updateProduct(currentEditingProduct.id, payload) : createProduct(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success(currentEditingProduct ? 'Product updated successfully.' : 'Product created successfully.')
      closeForm(true)
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
  const meta = products.data?.meta ?? emptyPaginationMeta(listPerPage)
  const rows: ProductListRow[] = apiRows.map((product, index) => ({
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
        render: (product) => <TableImagePreview src={product.image_path} alt={`${product.title} image`} />,
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
      { key: 'updated', header: 'Updated', render: (product) => formatAdminDate(product.updated_at) },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (product) => (
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit product',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(product),
              },
              canDelete && {
                label: 'Delete product',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete product',
                    message: `Delete ${product.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    product,
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
    setEditingProduct(null)
    setFormStoreId('')
    setFormErrors({})
    navigateToHash('/products/create')
  }

  function openEditForm(product: ProductRow) {
    dirtyFormStore.reset()
    setEditingProduct(product)
    setFormStoreId(String(product.store_id))
    setFormErrors({})
    navigateToHash(`/products/edit/${product.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingProduct(null)
    setFormStoreId('')
    setFormErrors({})
    navigateToHash('/products')
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

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingProduct && routeProduct.isLoading) {
      return <PageSkeleton label="Loading product" />
    }

    if (formRoute.mode === 'edit' && !currentEditingProduct) {
      return (
        <RecordLoadError
          title="Edit Product"
          description="The requested product could not be loaded."
          message="Product could not be loaded. Check the record or try again."
          backLabel="Back to Products"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingProduct ? 'Edit Product' : 'Add Product'}
          description="Manage product title, category, image, status, and description."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Products
            </Button>
          }
        />
        <section className="data-panel">
          <ProductForm
            product={currentEditingProduct}
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
      </>
    )
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

        {products.isError ? <ListLoadError message="Products could not be loaded." /> : null}

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
            removeProduct.mutate(confirmDelete.product)
          }
          setConfirmDelete(null)
        }}
      />
    </>
  )
}
