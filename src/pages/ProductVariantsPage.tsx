import { Edit3, PackageCheck, Plus, Trash2 } from 'lucide-react'
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
import { AdminSelect, type AdminSelectOption } from '../components/forms/AdminSelect'
import { StatusPill } from '../components/StatusPill'
import { api } from '../lib/api'
import {
  normalizePaginationMeta,
  toApiListParams,
  type PaginatedResponse,
  type PaginationMeta,
} from '../lib/apiTypes'

type ProductVariantRow = {
  id: number
  store_id: number
  product_id: number
  title: string
  subscribe_price: string | number
  normal_price: string | number
  discount: string | number | null
  is_out_of_stock: boolean
  is_subscription_required: boolean
  store?: { id: number; title: string } | null
  product?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}

type StoreOption = { id: number; title: string }
type ProductOption = { id: number; store_id: number; title: string }
type OptionsApiResponse<T> = { data: T[] }
type ProductVariantsApiResponse = {
  data: ProductVariantRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}

type ProductVariantFormValues = {
  store_id: string
  product_id: string
  title: string
  normal_price: string
  subscribe_price: string
  discount: string
  is_out_of_stock: boolean
  is_subscription_required: boolean
}

type ProductVariantListRow = ProductVariantRow & { serialNumber: number }

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

const yesNoOptions: AdminSelectOption[] = [
  { label: 'Yes', value: '1' },
  { label: 'No', value: '0' },
]

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
  const [formProductId, setFormProductId] = useState('')
  const [formStock, setFormStock] = useState('0')
  const [formSubscriptionRequired, setFormSubscriptionRequired] = useState('1')
  const [formError, setFormError] = useState<string | null>(null)

  const variants = useQuery<PaginatedResponse<ProductVariantRow>>({
    queryKey: ['admin-product-variants', search, page],
    queryFn: async () => {
      const response = await api.get<ProductVariantsApiResponse>('/api/v1/admin/product-variants', {
        params: toApiListParams({ page, perPage: 10, search }),
      })

      return { data: response.data.data, meta: normalizePaginationMeta(response.data.meta) }
    },
    retry: false,
  })

  const stores = useQuery<StoreOption[]>({
    queryKey: ['admin-product-variant-store-options'],
    queryFn: async () => {
      const response = await api.get<OptionsApiResponse<StoreOption>>('/api/v1/admin/stores', {
        params: toApiListParams({ perPage: 100 }),
      })

      return response.data.data
    },
    retry: false,
  })

  const products = useQuery<ProductOption[]>({
    queryKey: ['admin-product-variant-product-options'],
    queryFn: async () => {
      const response = await api.get<OptionsApiResponse<ProductOption>>('/api/v1/admin/products', {
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

  const productOptions = useMemo(
    () =>
      products.data
        ?.filter((product) => !formStoreId || String(product.store_id) === formStoreId)
        .map((product) => ({ label: product.title, value: String(product.id) })) ?? [],
    [formStoreId, products.data],
  )

  const saveVariant = useMutation({
    mutationFn: async (values: ProductVariantFormValues) => {
      const payload = toProductVariantPayload(values)

      if (editingVariant) {
        const response = await api.put<{ data: ProductVariantRow }>(
          `/api/v1/admin/product-variants/${editingVariant.id}`,
          payload,
        )
        return response.data.data
      }

      const response = await api.post<{ data: ProductVariantRow }>('/api/v1/admin/product-variants', payload)
      return response.data.data
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

  const deleteVariant = useMutation({
    mutationFn: async (variant: ProductVariantRow) => {
      await api.delete(`/api/v1/admin/product-variants/${variant.id}`)
    },
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
                if (window.confirm(`Delete ${variant.title}?`)) deleteVariant.mutate(variant)
              }}
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </span>
        ),
      },
    ],
    [deleteVariant],
  )

  function openCreateForm() {
    setEditingVariant(null)
    setFormStoreId('')
    setFormProductId('')
    setFormStock('0')
    setFormSubscriptionRequired('1')
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(variant: ProductVariantRow) {
    setEditingVariant(variant)
    setFormStoreId(String(variant.store_id))
    setFormProductId(String(variant.product_id))
    setFormStock(variant.is_out_of_stock ? '1' : '0')
    setFormSubscriptionRequired(variant.is_subscription_required ? '1' : '0')
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingVariant(null)
    setFormStoreId('')
    setFormProductId('')
    setFormStock('0')
    setFormSubscriptionRequired('1')
    setFormError(null)
    setIsFormOpen(false)
  }

  function handleStoreChange(storeId: string) {
    setFormStoreId(storeId)
    setFormProductId('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values: ProductVariantFormValues = {
      store_id: formStoreId,
      product_id: formProductId,
      title: String(form.get('title') ?? '').trim(),
      normal_price: String(form.get('normal_price') ?? '').trim(),
      subscribe_price: String(form.get('subscribe_price') ?? '').trim(),
      discount: String(form.get('discount') ?? '0').trim(),
      is_out_of_stock: formStock === '1',
      is_subscription_required: formSubscriptionRequired === '1',
    }

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

            <form className="store-form" onSubmit={handleSubmit}>
              <FormSection title="Variant Information" columns={2}>
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
                  <FieldLabel label="Product" required />
                  <AdminSelect
                    options={productOptions}
                    placeholder={formStoreId ? 'Search and select product' : 'Select store first'}
                    value={formProductId}
                    onChange={setFormProductId}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Product Type" required />
                  <input name="title" maxLength={255} defaultValue={editingVariant?.title ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Discount %" required />
                  <input
                    name="discount"
                    type="number"
                    min="0"
                    step="any"
                    defaultValue={editingVariant?.discount ?? 0}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Product Price" required />
                  <input
                    name="normal_price"
                    type="number"
                    min="0"
                    step="any"
                    defaultValue={editingVariant?.normal_price ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Subscription Price" required />
                  <input
                    name="subscribe_price"
                    type="number"
                    min="0"
                    step="any"
                    defaultValue={editingVariant?.subscribe_price ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Out Of Stock?" required />
                  <AdminSelect
                    isSearchable={false}
                    options={yesNoOptions}
                    value={formStock}
                    onChange={setFormStock}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Subscription Required?" required />
                  <AdminSelect
                    isSearchable={false}
                    options={yesNoOptions}
                    value={formSubscriptionRequired}
                    onChange={setFormSubscriptionRequired}
                  />
                </label>
              </FormSection>

              {formError ? <div className="form-error">{formError}</div> : null}
              {stores.isError || products.isError ? (
                <div className="form-error">Store or product options could not be loaded.</div>
              ) : null}

              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button className="primary-button is-compact" type="submit" disabled={saveVariant.isPending}>
                  {saveVariant.isPending ? 'Saving...' : editingVariant ? 'Save Variant' : 'Add Variant'}
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

function toProductVariantPayload(values: ProductVariantFormValues) {
  return {
    store_id: Number(values.store_id),
    product_id: Number(values.product_id),
    title: values.title,
    normal_price: Number(values.normal_price),
    subscribe_price: Number(values.subscribe_price),
    discount: Number(values.discount || 0),
    is_out_of_stock: values.is_out_of_stock,
    is_subscription_required: values.is_subscription_required,
  }
}

function formatMoney(value: string | number) {
  return Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })
}
