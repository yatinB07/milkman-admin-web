import { Edit3, PackageCheck, Plus, Trash2 } from 'lucide-react'
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
import { Button, RowActionMenu, toast } from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import type { PaginationMeta } from '../../lib/apiTypes'
import { getModuleActionPermission } from '../../routes/adminModules'
import { navigateToHash, useHashPath } from '../../routes/hashRouting'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { ProductVariantForm } from './ProductVariantForm'
import {
  createProductVariant,
  deleteProductVariant,
  getProductVariant,
  listProductVariants,
  listVariantProducts,
  listVariantStores,
  updateProductVariant,
} from './productVariantRepository'
import {
  formatMoney,
  toProductSelectOptions,
  toProductVariantPayload,
  toStoreSelectOptions,
} from './productVariantService'
import type { ProductVariantFormValues, ProductVariantListRow, ProductVariantRow } from './productVariantTypes'

type ProductVariantFormErrors = Partial<
  Record<'store_id' | 'product_id' | 'title' | 'discount' | 'normal_price' | 'subscribe_price', string>
>

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

const stockFilterOptions = [
  { label: 'All variants', value: 'all' },
  { label: 'In stock', value: 'in-stock' },
  { label: 'Out of stock', value: 'out-of-stock' },
]

export function ProductVariantsPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseProductVariantFormRoute(activePath)
  const [search, setSearch] = useState('')
  const [stockStatus, setStockStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingVariant, setEditingVariant] = useState<ProductVariantRow | null>(null)
  const [formStoreId, setFormStoreId] = useState('')
  const [formErrors, setFormErrors] = useState<ProductVariantFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<
    (ConfirmDialogOptions & { variant: ProductVariantRow }) | null
  >(null)
  const canCreate = adminStore.can(getModuleActionPermission('product-variants', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('product-variants', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('product-variants', 'delete'))

  const variants = useQuery({
    queryKey: ['admin-product-variants', search, stockStatus, page, listPerPage],
    queryFn: () => listProductVariants({ page, perPage: listPerPage, search, stockStatus }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-product-variant-store-options'],
    queryFn: listVariantStores,
    retry: false,
  })

  const products = useQuery({
    queryKey: ['admin-product-variant-product-options'],
    queryFn: listVariantProducts,
    retry: false,
  })

  const routeVariant = useQuery({
    queryKey: ['admin-product-variant', formRoute?.mode === 'edit' ? formRoute.variantId : null],
    queryFn: () => getProductVariant(formRoute?.mode === 'edit' ? formRoute.variantId : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingVariant = formRoute?.mode === 'edit' ? routeVariant.data ?? editingVariant : editingVariant
  const selectedFormStoreId = formStoreId || (currentEditingVariant ? String(currentEditingVariant.store_id) : '')

  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])
  const productOptions = useMemo(
    () => toProductSelectOptions(products.data, selectedFormStoreId),
    [products.data, selectedFormStoreId],
  )

  const saveVariant = useMutation({
    mutationFn: async (values: ProductVariantFormValues) => {
      const payload = toProductVariantPayload(values)

      return currentEditingVariant
        ? updateProductVariant(currentEditingVariant.id, payload)
        : createProductVariant(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] })
      toast.success(currentEditingVariant ? 'Product variant updated successfully.' : 'Product variant created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data as { errors?: Record<string, string[]> }
        setFormErrors({
          store_id: data.errors?.store_id?.[0],
          product_id: data.errors?.product_id?.[0],
          title: data.errors?.title?.[0],
          discount: data.errors?.discount?.[0],
          normal_price: data.errors?.normal_price?.[0],
          subscribe_price: data.errors?.subscribe_price?.[0],
        })
        return
      }

      toast.error('Product variant could not be saved.')
    },
  })

  const removeVariant = useMutation({
    mutationFn: async (variant: ProductVariantRow) => deleteProductVariant(variant.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] })
      toast.success('Product variant deleted successfully.')
    },
    onError: () => {
      toast.error('Product variant could not be deleted. Try again.')
    },
  })

  const apiRows = variants.data?.data ?? []
  const meta = variants.data?.meta ?? { ...defaultMeta, perPage: listPerPage }
  const rows: ProductVariantListRow[] = apiRows.map((variant, index) => ({
    ...variant,
    serialNumber: (meta.from || 1) + index,
  }))

  const columns = useMemo<MasterTableColumn<ProductVariantListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (variant) => variant.serialNumber, width: '90px' },
      { key: 'product', header: 'Product', render: (variant) => variant.product?.title ?? `Product #${variant.product_id}` },
      { key: 'title', header: 'Type', render: (variant) => variant.title },
      { key: 'normal_price', header: 'Price', render: (variant) => formatMoney(variant.normal_price) },
      { key: 'subscribe_price', header: 'Sub. Price', render: (variant) => formatMoney(variant.subscribe_price) },
      { key: 'discount', header: 'Discount', render: (variant) => `${variant.discount ?? 0}%` },
      {
        key: 'subscription_required',
        header: 'Subscription',
        align: 'center',
        render: (variant) => (
          <StatusPill tone={variant.is_subscription_required ? 'success' : 'danger'}>
            {variant.is_subscription_required ? 'Yes' : 'No'}
          </StatusPill>
        ),
      },
      {
        key: 'stock',
        header: 'Stock',
        align: 'center',
        render: (variant) => (
          <StatusPill tone={variant.is_out_of_stock ? 'danger' : 'success'}>
            {variant.is_out_of_stock ? 'Out Of Stock' : 'In Stock'}
          </StatusPill>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (variant) => (
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit product variant',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(variant),
              },
              canDelete && {
                label: 'Delete product variant',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete product variant',
                    message: `Delete ${variant.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    variant,
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
    setEditingVariant(null)
    setFormStoreId('')
    setFormErrors({})
    navigateToHash('/product-variants/create')
  }

  function openEditForm(variant: ProductVariantRow) {
    dirtyFormStore.reset()
    setEditingVariant(variant)
    setFormStoreId(String(variant.store_id))
    setFormErrors({})
    navigateToHash(`/product-variants/edit/${variant.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingVariant(null)
    setFormStoreId('')
    setFormErrors({})
    navigateToHash('/product-variants')
  }

  function handleSubmit(values: ProductVariantFormValues) {
    const nextErrors: ProductVariantFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      product_id: values.product_id ? undefined : 'Product is required.',
      title: values.title ? undefined : 'Product Type is required.',
      discount: values.discount ? undefined : 'Discount is required.',
      normal_price: values.normal_price ? undefined : 'Product Price is required.',
      subscribe_price: values.subscribe_price ? undefined : 'Subscription Price is required.',
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveVariant.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingVariant && routeVariant.isLoading) {
      return <MasterPageHeader title="Edit Product Variant" description="Loading product variant..." />
    }

    if (formRoute.mode === 'edit' && !currentEditingVariant) {
      return (
        <>
          <MasterPageHeader
            title="Edit Product Variant"
            description="The requested product variant could not be loaded."
            actions={
              <Button variant="secondary" size="compact" onClick={() => closeForm(true)}>
                Back to Product Variants
              </Button>
            }
          />
          <div className="master-error">Product variant could not be loaded. Check the record or try again.</div>
        </>
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingVariant ? 'Edit Product Variant' : 'Add Product Variant'}
          description="Manage product price, subscription price, discount, and stock status."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Product Variants
            </Button>
          }
        />
        <section className="data-panel">
          <ProductVariantForm
            variant={currentEditingVariant}
            storeOptions={storeOptions}
            productOptions={productOptions}
            formErrors={formErrors}
            optionError={stores.isError || products.isError}
            isSaving={saveVariant.isPending}
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
        title="Product Variants"
        description="Manage product prices, discounts, stock, and subscription availability."
        actions={canCreate ? (
          <Button variant="primary" size="compact" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Variant
          </Button>
        ) : null}
      />

      <MasterFilterBar
        searchLabel="Search product variants"
        searchPlaceholder="Search variants..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        filters={[
          {
            label: 'Stock',
            value: stockStatus,
            onChange: (value) => {
              setStockStatus(value)
              setPage(1)
            },
            options: stockFilterOptions,
          },
        ]}
      />

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Variant Directory</h3>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(variant) => variant.id}
          emptyState={
            <span className="master-empty-state">
              <PackageCheck aria-hidden="true" size={30} />
              No product variants found
            </span>
          }
          isLoading={variants.isLoading}
          minWidth={1120}
        />

        {variants.isError ? <div className="master-error">Product variants could not be loaded.</div> : null}

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
            removeVariant.mutate(confirmDelete.variant)
          }
          setConfirmDelete(null)
        }}
      />
    </>
  )
}

function parseProductVariantFormRoute(path: string) {
  if (path === '/product-variants/create') return { mode: 'create' as const }

  const editMatch = path.match(/^\/product-variants\/edit\/(\d+)$/)

  if (editMatch) return { mode: 'edit' as const, variantId: Number(editMatch[1]) }

  return null
}
