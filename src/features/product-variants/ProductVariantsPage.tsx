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
import { StatusPill } from '../../components/StatusPill'
import type { PaginationMeta } from '../../lib/apiTypes'
import { ProductVariantForm } from './ProductVariantForm'
import {
  createProductVariant,
  deleteProductVariant,
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
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [stockStatus, setStockStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingVariant, setEditingVariant] = useState<ProductVariantRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formStoreId, setFormStoreId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const variants = useQuery({
    queryKey: ['admin-product-variants', search, page],
    queryFn: () => listProductVariants({ page, perPage: 10, search }),
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

  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])
  const productOptions = useMemo(
    () => toProductSelectOptions(products.data, formStoreId),
    [formStoreId, products.data],
  )

  const saveVariant = useMutation({
    mutationFn: async (values: ProductVariantFormValues) => {
      const payload = toProductVariantPayload(values)

      return editingVariant ? updateProductVariant(editingVariant.id, payload) : createProductVariant(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] })
      closeForm()
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data as { errors?: Record<string, string[]> }
        setFormError(
          data.errors?.store_id?.[0] ??
            data.errors?.product_id?.[0] ??
            data.errors?.title?.[0] ??
            data.errors?.normal_price?.[0] ??
            data.errors?.subscribe_price?.[0] ??
            'Check required fields.',
        )
        return
      }

      setFormError('Product variant could not be saved.')
    },
  })

  const removeVariant = useMutation({
    mutationFn: async (variant: ProductVariantRow) => deleteProductVariant(variant.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] })
    },
  })

  const apiRows = variants.data?.data ?? []
  const filteredRows =
    stockStatus === 'all'
      ? apiRows
      : apiRows.filter((variant) => variant.is_out_of_stock === (stockStatus === 'out-of-stock'))
  const meta = variants.data?.meta ?? defaultMeta
  const rows: ProductVariantListRow[] = filteredRows.map((variant, index) => ({
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
          <span className="row-actions">
            <button
              type="button"
              aria-label="Edit product variant"
              data-tooltip="Edit product variant"
              title="Edit product variant"
              onClick={() => openEditForm(variant)}
            >
              <Edit3 aria-hidden="true" size={16} />
            </button>
            <button
              type="button"
              aria-label="Delete product variant"
              data-tooltip="Delete product variant"
              title="Delete product variant"
              onClick={() => {
                if (window.confirm(`Delete ${variant.title}?`)) removeVariant.mutate(variant)
              }}
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </span>
        ),
      },
    ],
    [removeVariant],
  )

  function openCreateForm() {
    setEditingVariant(null)
    setFormStoreId('')
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(variant: ProductVariantRow) {
    setEditingVariant(variant)
    setFormStoreId(String(variant.store_id))
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingVariant(null)
    setFormStoreId('')
    setFormError(null)
    setIsFormOpen(false)
  }

  function handleSubmit(values: ProductVariantFormValues) {
    if (!values.store_id || !values.product_id || !values.title || !values.normal_price || !values.subscribe_price) {
      setFormError('Store, Product, Type, Price, and Subscription Price are required.')
      return
    }

    setFormError(null)
    saveVariant.mutate(values)
  }

  return (
    <>
      <MasterPageHeader
        title="Product Variants"
        description="Manage product prices, discounts, stock, and subscription availability."
        actions={
          <button className="primary-button is-compact" type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Variant
          </button>
        }
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

        <MasterPagination meta={meta} onPageChange={setPage} />
      </section>

      {isFormOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="store-form-modal" role="dialog" aria-modal="true" aria-labelledby="variant-form-title">
            <div className="modal-header">
              <div>
                <h3 id="variant-form-title">{editingVariant ? 'Edit Product Variant' : 'Add Product Variant'}</h3>
              </div>
              <button type="button" className="secondary-button" onClick={closeForm}>
                Close
              </button>
            </div>

            <ProductVariantForm
              variant={editingVariant}
              storeOptions={storeOptions}
              productOptions={productOptions}
              formError={formError}
              optionError={stores.isError || products.isError}
              isSaving={saveVariant.isPending}
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
