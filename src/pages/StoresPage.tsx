import { Edit3, Plus, Store, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useMemo, useState } from 'react'
import {
  MasterDataTable,
  MasterFilterBar,
  MasterPageHeader,
  MasterPagination,
  type MasterTableColumn,
} from '../components/master'
import { StatusPill } from '../components/StatusPill'
import { api } from '../lib/api'
import {
  normalizePaginationMeta,
  toApiListParams,
  type PaginatedResponse,
  type PaginationMeta,
} from '../lib/apiTypes'

type StoreRow = {
  id: number
  title: string
  email: string | null
  country_code: string | null
  mobile: string | null
  full_address: string | null
  pincode: string | null
  rating: string | number | null
  delivery_charge: string | number | null
  minimum_order_amount: string | number | null
  commission_percent: string | number | null
  opens_at: string | null
  closes_at: string | null
  is_pickup_enabled: boolean
  registration_status: string | null
  is_active: boolean
  zone?: {
    id: number
    title: string
  } | null
}

type StoreFormValues = {
  title: string
  email: string
  password?: string
  country_code: string
  mobile: string
  full_address: string
  pincode: string
  delivery_charge: string
  minimum_order_amount: string
  commission_percent: string
  opens_at: string
  closes_at: string
  is_pickup_enabled: boolean
  is_active: boolean
}

type StoresApiResponse = {
  data: StoreRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

export function StoresPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingStore, setEditingStore] = useState<StoreRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const stores = useQuery<PaginatedResponse<StoreRow>>({
    queryKey: ['admin-stores', search, page],
    queryFn: async () => {
      const response = await api.get<StoresApiResponse>('/api/v1/admin/stores', {
        params: toApiListParams({
          page,
          perPage: 10,
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

  const saveStore = useMutation({
    mutationFn: async (values: StoreFormValues) => {
      const payload = toStorePayload(values, Boolean(editingStore))

      if (editingStore) {
        const response = await api.put<{ data: StoreRow }>(
          `/api/v1/admin/stores/${editingStore.id}`,
          payload,
        )

        return response.data.data
      }

      const response = await api.post<{ data: StoreRow }>('/api/v1/admin/stores', payload)

      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      closeForm()
    },
    onError: () => {
      setFormError('Store could not be saved. Check the documented required fields and try again.')
    },
  })

  const deleteStore = useMutation({
    mutationFn: async (store: StoreRow) => {
      await api.delete(`/api/v1/admin/stores/${store.id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
    },
  })

  const columns = useMemo<MasterTableColumn<StoreRow>[]>(
    () => [
      {
        key: 'store',
        header: 'Store Name',
        render: (store) => (
          <div className="store-cell">
            <span>{store.title.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{store.title}</strong>
              <small>#{store.id}</small>
            </div>
          </div>
        ),
        width: '260px',
      },
      {
        key: 'contact',
        header: 'Contact',
        render: (store) => (
          <span className="stacked-cell">
            <strong>{store.email ?? 'No email'}</strong>
            <small>
              {[store.country_code, store.mobile].filter(Boolean).join(' ') || 'No mobile'}
            </small>
          </span>
        ),
      },
      {
        key: 'zone',
        header: 'Zone',
        render: (store) => store.zone?.title ?? 'Unassigned',
      },
      {
        key: 'rating',
        header: 'Rating',
        align: 'center',
        render: (store) => store.rating ?? '0.0',
      },
      {
        key: 'fees',
        header: 'Fees',
        align: 'right',
        render: (store) => (
          <span className="stacked-cell is-right">
            <strong>{formatCurrency(store.delivery_charge)}</strong>
            <small>{store.commission_percent ?? 0}% commission</small>
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (store) => (
          <StatusPill tone={store.is_active ? 'success' : 'danger'}>
            {store.is_active ? 'Active' : 'Inactive'}
          </StatusPill>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (store) => (
          <span className="row-actions">
            <button type="button" aria-label="Edit store" onClick={() => openEditForm(store)}>
              <Edit3 aria-hidden="true" size={16} />
            </button>
            <button
              type="button"
              aria-label="Delete store"
              onClick={() => {
                if (window.confirm(`Delete ${store.title}?`)) {
                  deleteStore.mutate(store)
                }
              }}
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </span>
        ),
      },
    ],
    [deleteStore],
  )

  const apiRows = stores.data?.data ?? []
  const rows =
    status === 'all'
      ? apiRows
      : apiRows.filter((store) => store.is_active === (status === 'active'))
  const meta = stores.data?.meta ?? defaultMeta

  function openCreateForm() {
    setEditingStore(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(store: StoreRow) {
    setEditingStore(store)
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingStore(null)
    setFormError(null)
    setIsFormOpen(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    saveStore.mutate({
      title: String(form.get('title') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      country_code: String(form.get('country_code') ?? ''),
      mobile: String(form.get('mobile') ?? ''),
      full_address: String(form.get('full_address') ?? ''),
      pincode: String(form.get('pincode') ?? ''),
      delivery_charge: String(form.get('delivery_charge') ?? ''),
      minimum_order_amount: String(form.get('minimum_order_amount') ?? ''),
      commission_percent: String(form.get('commission_percent') ?? ''),
      opens_at: String(form.get('opens_at') ?? ''),
      closes_at: String(form.get('closes_at') ?? ''),
      is_pickup_enabled: form.get('is_pickup_enabled') === 'on',
      is_active: form.get('is_active') === 'on',
    })
  }

  return (
    <>
      <MasterPageHeader
        title="Stores"
        description="Manage partner stores, operating status, charges, and zone assignments."
        actions={
          <button className="primary-button is-compact" type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Register New Store
          </button>
        }
      />

      <MasterFilterBar
        searchLabel="Search stores"
        searchPlaceholder="Search stores, emails, or locations..."
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
              { label: 'All stores', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
      />

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Partner Directory</h3>
            <p>Showing stores from the live Laravel admin API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(store) => store.id}
          emptyState={
            <span className="master-empty-state">
              <Store aria-hidden="true" size={30} />
              No stores found
            </span>
          }
          isLoading={stores.isLoading}
          minWidth={1080}
        />

        {stores.isError ? (
          <div className="master-error">
            Stores could not be loaded. Confirm the backend is running and your admin session is
            valid.
          </div>
        ) : null}

        <MasterPagination meta={meta} onPageChange={setPage} />
      </section>

      {isFormOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="store-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-form-title"
          >
            <div className="modal-header">
              <div>
                <h3 id="store-form-title">
                  {editingStore ? 'Edit Store' : 'Register New Store'}
                </h3>
                <p>
                  Uses the documented StoreRequest and UpdateStoreRequest contract from
                  /docs/api.json.
                </p>
              </div>
              <button type="button" className="secondary-button" onClick={closeForm}>
                Close
              </button>
            </div>

            <form className="store-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Store Name</span>
                  <input
                    name="title"
                    required
                    maxLength={255}
                    defaultValue={editingStore?.title ?? ''}
                  />
                </label>

                <label className="form-field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    defaultValue={editingStore?.email ?? ''}
                  />
                </label>

                <label className="form-field">
                  <span>Password</span>
                  <input
                    name="password"
                    type="password"
                    required={!editingStore}
                    minLength={8}
                    placeholder={editingStore ? 'Leave blank to keep current' : 'Minimum 8 chars'}
                  />
                </label>

                <label className="form-field">
                  <span>Country Code</span>
                  <input
                    name="country_code"
                    maxLength={8}
                    defaultValue={editingStore?.country_code ?? ''}
                  />
                </label>

                <label className="form-field">
                  <span>Mobile</span>
                  <input name="mobile" maxLength={32} defaultValue={editingStore?.mobile ?? ''} />
                </label>

                <label className="form-field">
                  <span>Pincode</span>
                  <input
                    name="pincode"
                    maxLength={32}
                    defaultValue={editingStore?.pincode ?? ''}
                  />
                </label>

                <label className="form-field is-wide">
                  <span>Full Address</span>
                  <textarea name="full_address" defaultValue={editingStore?.full_address ?? ''} />
                </label>

                <label className="form-field">
                  <span>Delivery Charge</span>
                  <input
                    name="delivery_charge"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingStore?.delivery_charge ?? ''}
                  />
                </label>

                <label className="form-field">
                  <span>Minimum Order</span>
                  <input
                    name="minimum_order_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingStore?.minimum_order_amount ?? ''}
                  />
                </label>

                <label className="form-field">
                  <span>Commission %</span>
                  <input
                    name="commission_percent"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingStore?.commission_percent ?? ''}
                  />
                </label>

                <label className="form-field">
                  <span>Opens At</span>
                  <input name="opens_at" type="time" defaultValue={toTimeInput(editingStore?.opens_at)} />
                </label>

                <label className="form-field">
                  <span>Closes At</span>
                  <input
                    name="closes_at"
                    type="time"
                    defaultValue={toTimeInput(editingStore?.closes_at)}
                  />
                </label>
              </div>

              <div className="toggle-grid">
                <label className="toggle-row">
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked={editingStore?.is_active ?? true}
                  />
                  <span>Active store</span>
                </label>

                <label className="toggle-row">
                  <input
                    name="is_pickup_enabled"
                    type="checkbox"
                    defaultChecked={editingStore?.is_pickup_enabled ?? true}
                  />
                  <span>Pickup enabled</span>
                </label>
              </div>

              {formError ? <div className="form-error">{formError}</div> : null}

              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button className="primary-button is-compact" type="submit" disabled={saveStore.isPending}>
                  {saveStore.isPending ? 'Saving...' : editingStore ? 'Update Store' : 'Create Store'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}

function toStorePayload(values: StoreFormValues, isEditing: boolean) {
  const payload: Record<string, string | number | boolean | null> = {
    title: values.title,
    email: values.email,
    country_code: nullableString(values.country_code),
    mobile: nullableString(values.mobile),
    full_address: nullableString(values.full_address),
    pincode: nullableString(values.pincode),
    delivery_charge: nullableNumber(values.delivery_charge),
    minimum_order_amount: nullableNumber(values.minimum_order_amount),
    commission_percent: nullableNumber(values.commission_percent),
    opens_at: toApiTime(values.opens_at),
    closes_at: toApiTime(values.closes_at),
    is_pickup_enabled: values.is_pickup_enabled,
    is_active: values.is_active,
  }

  if (!isEditing || values.password) {
    payload.password = values.password ?? ''
  }

  return payload
}

function nullableString(value: string) {
  return value.trim() === '' ? null : value.trim()
}

function nullableNumber(value: string) {
  return value === '' ? null : Number(value)
}

function toApiTime(value: string) {
  return value ? `${value}:00` : null
}

function toTimeInput(value?: string | null) {
  return value ? value.slice(0, 5) : ''
}

function formatCurrency(value: string | number | null) {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isNaN(amount) ? 0 : amount)
}
