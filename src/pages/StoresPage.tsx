import { ArrowLeft, Banknote, Edit3, History, ImageIcon, Plus, Store, Trash2 } from 'lucide-react'
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
import { ConfirmDialog, type ConfirmDialogOptions } from '../components/common/ConfirmDialog'
import { AdminFilePicker } from '../components/forms/AdminFilePicker'
import { AdminMultiSelect, AdminSelect, type AdminSelectOption } from '../components/forms/AdminSelect'
import { AdminTextarea } from '../components/forms/AdminTextarea'
import { StatusPill } from '../components/StatusPill'
import { StoreLocationMap } from '../components/maps/StoreLocationMap'
import { api } from '../lib/api'
import {
  normalizePaginationMeta,
  toApiListParams,
  type PaginatedResponse,
  type PaginationMeta,
} from '../lib/apiTypes'
import { getModuleActionPermission } from '../routes/adminModules'
import { adminStore } from '../store/adminStore'

type StoreRow = {
  id: number
  title: string
  zone_id: number | null
  image_path: string | null
  cover_image_path: string | null
  rating: string | number | null
  slogan: string | null
  slogan_title: string | null
  language_code: string | null
  category_reference: string | null
  email: string | null
  country_code: string | null
  mobile: string | null
  full_address: string | null
  pincode: string | null
  landmark: string | null
  short_description: string | null
  content_description: string | null
  latitude: string | number | null
  longitude: string | number | null
  store_charge: string | number | null
  delivery_charge: string | number | null
  minimum_order_amount: string | number | null
  commission_percent: string | number | null
  opens_at: string | null
  closes_at: string | null
  is_pickup_enabled: boolean
  is_active: boolean
  registration_status: string | number | null
  charge_type: string | number | null
  unit_kilometers: string | number | null
  unit_price: string | number | null
  additional_price: string | number | null
  bank_name: string | null
  ifsc_code: string | null
  receipt_name: string | null
  account_number: string | null
  paypal_id: string | null
  upi_id: string | null
  cancel_policy: string | null
  zone?: {
    id: number
    title: string
  } | null
}

type StoreFormValues = {
  title: string
  image_path: string
  cover_image_path: string
  rating: string
  language_code: string
  mobile: string
  slogan: string
  slogan_title: string
  opens_at: string
  closes_at: string
  is_pickup_enabled: boolean
  is_active: boolean
  short_description: string
  content_description: string
  cancel_policy: string
  email: string
  password?: string
  category_reference: string
  full_address: string
  pincode: string
  landmark: string
  zone_id: string
  latitude: string
  longitude: string
  charge_type: string
  delivery_charge: string
  unit_kilometers: string
  unit_price: string
  additional_price: string
  store_charge: string
  minimum_order_amount: string
  commission_percent: string
  bank_name: string
  ifsc_code: string
  receipt_name: string
  account_number: string
  paypal_id: string
  upi_id: string
}

type SelectOption = {
  id: number
  title: string
}

type StoreListRow = StoreRow & {
  serialNumber: number
}

type StoresApiResponse = {
  data: StoreRow[]
  meta: Parameters<typeof normalizePaginationMeta>[0]
}

type OptionsApiResponse = {
  data: SelectOption[]
}

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  from: 0,
  lastPage: 1,
  perPage: 10,
  to: 0,
  total: 0,
}

const publishOptions: AdminSelectOption[] = [
  { label: 'Publish', value: '1' },
  { label: 'Unpublish', value: '0' },
]

const pickupOptions: AdminSelectOption[] = [
  { label: 'Yes', value: '1' },
  { label: 'No', value: '0' },
]

const chargeTypeOptions: AdminSelectOption[] = [
  { label: 'Fixed Charge', value: '1' },
  { label: 'Dynamic Charge', value: '2' },
]

type StoreFormTabId = 'basic' | 'media' | 'login' | 'categories' | 'address' | 'service' | 'payout'
type StoreValidationField = {
  name: keyof StoreFormValues
  label: string
  tab: StoreFormTabId
  when?: (values: StoreFormValues, isEditing: boolean) => boolean
}

const storeFormTabs: Array<{ id: StoreFormTabId; label: string }> = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'media', label: 'Media' },
  { id: 'login', label: 'Login' },
  { id: 'categories', label: 'Categories' },
  { id: 'address', label: 'Address' },
  { id: 'service', label: 'Service' },
  { id: 'payout', label: 'Payout' },
]

const storeValidationFields: StoreValidationField[] = [
  { name: 'title', label: 'Store Name', tab: 'basic' },
  { name: 'rating', label: 'Rating', tab: 'basic' },
  { name: 'mobile', label: 'Mobile number', tab: 'basic' },
  { name: 'slogan', label: 'Slogan Title', tab: 'basic' },
  { name: 'slogan_title', label: 'Slogan Subtitle', tab: 'basic' },
  { name: 'opens_at', label: 'Store Open Time', tab: 'basic' },
  { name: 'closes_at', label: 'Store Close Time', tab: 'basic' },
  { name: 'short_description', label: 'Tags', tab: 'basic' },
  { name: 'content_description', label: 'Short Description', tab: 'basic' },
  { name: 'cancel_policy', label: 'Cancel Policy', tab: 'basic' },
  { name: 'image_path', label: 'Store Logo', tab: 'media' },
  { name: 'cover_image_path', label: 'Store Cover Image', tab: 'media' },
  { name: 'email', label: 'Email Address', tab: 'login' },
  { name: 'password', label: 'Password', tab: 'login', when: (_values, isEditing) => !isEditing },
  { name: 'category_reference', label: 'Store Category', tab: 'categories' },
  { name: 'full_address', label: 'Full Address', tab: 'address' },
  { name: 'pincode', label: 'Pincode', tab: 'address' },
  { name: 'landmark', label: 'Landmark', tab: 'address' },
  { name: 'zone_id', label: 'Select Zone', tab: 'address' },
  { name: 'latitude', label: 'Latitude', tab: 'address' },
  { name: 'longitude', label: 'Longitude', tab: 'address' },
  { name: 'charge_type', label: 'Service Charge Type', tab: 'service' },
  {
    name: 'delivery_charge',
    label: 'Service Charge',
    tab: 'service',
    when: (values) => values.charge_type === '1',
  },
  {
    name: 'unit_kilometers',
    label: 'Base Service Distance',
    tab: 'service',
    when: (values) => values.charge_type === '2',
  },
  {
    name: 'unit_price',
    label: 'Base Service Charge',
    tab: 'service',
    when: (values) => values.charge_type === '2',
  },
  {
    name: 'additional_price',
    label: 'Extra Service Charge',
    tab: 'service',
    when: (values) => values.charge_type === '2',
  },
  { name: 'store_charge', label: 'Store Charge', tab: 'service' },
  { name: 'minimum_order_amount', label: 'Min.Order Price', tab: 'service' },
  { name: 'commission_percent', label: 'Commission Rate', tab: 'service' },
  { name: 'bank_name', label: 'Bank Name', tab: 'payout' },
  { name: 'ifsc_code', label: 'Bank Code/IFSC', tab: 'payout' },
  { name: 'receipt_name', label: 'Recipient Name', tab: 'payout' },
  { name: 'account_number', label: 'Account Number', tab: 'payout' },
  { name: 'paypal_id', label: 'Paypal ID', tab: 'payout' },
  { name: 'upi_id', label: 'UPI ID', tab: 'payout' },
]

export function StoresPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingStore, setEditingStore] = useState<StoreRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [location, setLocation] = useState({ latitude: '', longitude: '' })
  const [formIsActive, setFormIsActive] = useState('1')
  const [formPickupStatus, setFormPickupStatus] = useState('1')
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([])
  const [formZoneId, setFormZoneId] = useState('')
  const [formChargeType, setFormChargeType] = useState('1')
  const [logoPath, setLogoPath] = useState('')
  const [coverPath, setCoverPath] = useState('')
  const [contentDescription, setContentDescription] = useState('')
  const [cancelPolicy, setCancelPolicy] = useState('')
  const [activeStoreTab, setActiveStoreTab] = useState<StoreFormTabId>('basic')
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { store: StoreRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('stores', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('stores', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('stores', 'delete'))

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

  const zones = useQuery<SelectOption[]>({
    queryKey: ['admin-store-zone-options'],
    queryFn: async () => {
      const response = await api.get<OptionsApiResponse>('/api/v1/admin/zones', {
        params: toApiListParams({ perPage: 100 }),
      })

      return response.data.data
    },
    retry: false,
  })

  const categories = useQuery<SelectOption[]>({
    queryKey: ['admin-store-category-options'],
    queryFn: async () => {
      const response = await api.get<OptionsApiResponse>('/api/v1/admin/categories', {
        params: toApiListParams({ perPage: 100 }),
      })

      return response.data.data
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
    onError: (error) => {
      const validationError = extractStoreApiValidationError(error)

      if (validationError) {
        setActiveStoreTab(validationError.tab)
        setFormError(validationError.message)
        return
      }

      setFormError('Store could not be saved. Check the required fields and try again.')
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

  const apiRows = stores.data?.data ?? []
  const filteredRows =
    status === 'all'
      ? apiRows
      : apiRows.filter((store) => store.is_active === (status === 'active'))
  const meta = stores.data?.meta ?? defaultMeta
  const rows: StoreListRow[] = filteredRows.map((store, index) => ({
    ...store,
    serialNumber: serialNumber(meta, index),
  }))
  const categoryOptions = useMemo(() => toSelectOptions(categories.data), [categories.data])
  const zoneOptions = useMemo(() => toSelectOptions(zones.data), [zones.data])

  const columns = useMemo<MasterTableColumn<StoreListRow>[]>(
    () => [
      {
        key: 'serial',
        header: 'Sr No.',
        render: (store) => store.serialNumber,
        width: '90px',
      },
      {
        key: 'store_name',
        header: 'Store Name',
        render: (store) => (
          <span className="stacked-cell">
            <strong>{store.title}</strong>
            <small>{store.zone?.title ?? 'No zone selected'}</small>
          </span>
        ),
      },
      {
        key: 'store_image',
        header: 'Store Image',
        align: 'center',
        render: (store) => <StoreImagePreview src={store.image_path} alt={`${store.title} logo`} />,
      },
      {
        key: 'cover_image',
        header: 'Store Cover Image',
        align: 'center',
        render: (store) => (
          <StoreImagePreview src={store.cover_image_path} alt={`${store.title} cover`} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (store) => (
          <StatusPill tone={store.is_active ? 'success' : 'danger'}>
            {store.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (store) => (
          <span className="row-actions">
            {canUpdate ? (
              <button
                type="button"
                aria-label="Edit store"
                data-tooltip="Edit store"
                title="Edit store"
                onClick={() => openEditForm(store)}
              >
                <Edit3 aria-hidden="true" size={16} />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Add received cash"
              data-tooltip="Add received cash"
              title="Add received cash"
              onClick={() => {
                window.alert('Received cash workflow will use the Cash Collections API in the next store slice.')
              }}
            >
              <Banknote aria-hidden="true" size={16} />
            </button>
            <button
              type="button"
              aria-label="View cash log"
              data-tooltip="View cash log"
              title="View cash log"
              onClick={() => {
                window.alert('Cash log workflow will use the Cash Collections API in the next store slice.')
              }}
            >
              <History aria-hidden="true" size={16} />
            </button>
            {canDelete ? (
              <button
                type="button"
                aria-label="Delete store"
                data-tooltip="Delete store"
                title="Delete store"
                onClick={() => {
                  setConfirmDelete({
                    title: 'Delete store',
                    message: `Delete ${store.title}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    store,
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
    setEditingStore(null)
    setFormError(null)
    setLocation({ latitude: '', longitude: '' })
    setFormIsActive('1')
    setFormPickupStatus('1')
    setFormCategoryIds([])
    setFormZoneId('')
    setFormChargeType('1')
    setLogoPath('')
    setCoverPath('')
    setContentDescription('')
    setCancelPolicy('')
    setActiveStoreTab('basic')
    setIsFormOpen(true)
  }

  function openEditForm(store: StoreRow) {
    setEditingStore(store)
    setFormError(null)
    setLocation({
      latitude: stringifyValue(store.latitude),
      longitude: stringifyValue(store.longitude),
    })
    setFormIsActive(store.is_active === false ? '0' : '1')
    setFormPickupStatus(store.is_pickup_enabled === false ? '0' : '1')
    setFormCategoryIds(splitCategoryReference(store.category_reference))
    setFormZoneId(stringifyValue(store.zone_id))
    setFormChargeType(String(store.charge_type ?? '1'))
    setLogoPath(store.image_path ?? '')
    setCoverPath(store.cover_image_path ?? '')
    setContentDescription(store.content_description ?? '')
    setCancelPolicy(store.cancel_policy ?? '')
    setActiveStoreTab('basic')
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingStore(null)
    setFormError(null)
    setIsFormOpen(false)
  }

  function validateStoreForm(form: FormData) {
    const values = {
      title: String(form.get('title') ?? ''),
      image_path: logoPath,
      cover_image_path: coverPath,
      rating: String(form.get('rating') ?? ''),
      language_code: String(form.get('language_code') ?? ''),
      mobile: String(form.get('mobile') ?? ''),
      slogan: String(form.get('slogan') ?? ''),
      slogan_title: String(form.get('slogan_title') ?? ''),
      opens_at: String(form.get('opens_at') ?? ''),
      closes_at: String(form.get('closes_at') ?? ''),
      is_pickup_enabled: formPickupStatus === '1',
      is_active: formIsActive === '1',
      short_description: String(form.get('short_description') ?? ''),
      content_description: contentDescription,
      cancel_policy: cancelPolicy,
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      category_reference: formCategoryIds.join(','),
      full_address: String(form.get('full_address') ?? ''),
      pincode: String(form.get('pincode') ?? ''),
      landmark: String(form.get('landmark') ?? ''),
      zone_id: formZoneId,
      latitude: location.latitude,
      longitude: location.longitude,
      charge_type: formChargeType,
      delivery_charge: String(form.get('delivery_charge') ?? ''),
      unit_kilometers: String(form.get('unit_kilometers') ?? ''),
      unit_price: String(form.get('unit_price') ?? ''),
      additional_price: String(form.get('additional_price') ?? ''),
      store_charge: String(form.get('store_charge') ?? ''),
      minimum_order_amount: String(form.get('minimum_order_amount') ?? ''),
      commission_percent: String(form.get('commission_percent') ?? ''),
      bank_name: String(form.get('bank_name') ?? ''),
      ifsc_code: String(form.get('ifsc_code') ?? ''),
      receipt_name: String(form.get('receipt_name') ?? ''),
      account_number: String(form.get('account_number') ?? ''),
      paypal_id: String(form.get('paypal_id') ?? ''),
      upi_id: String(form.get('upi_id') ?? ''),
    } satisfies StoreFormValues

    for (const field of storeValidationFields) {
      if (field.when && !field.when(values, Boolean(editingStore))) {
        continue
      }

      if (!String(values[field.name] ?? '').trim()) {
        return {
          message: `${field.label} is required. Complete the ${tabLabel(field.tab)} tab before continuing.`,
          tab: field.tab,
        }
      }
    }

    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const validationError = validateStoreForm(form)

    if (validationError) {
      setActiveStoreTab(validationError.tab)
      setFormError(validationError.message)
      return
    }

    setFormError(null)
    saveStore.mutate({
      title: String(form.get('title') ?? ''),
      image_path: logoPath,
      cover_image_path: coverPath,
      rating: String(form.get('rating') ?? ''),
      language_code: String(form.get('language_code') ?? ''),
      mobile: String(form.get('mobile') ?? ''),
      slogan: String(form.get('slogan') ?? ''),
      slogan_title: String(form.get('slogan_title') ?? ''),
      opens_at: String(form.get('opens_at') ?? ''),
      closes_at: String(form.get('closes_at') ?? ''),
      is_pickup_enabled: formPickupStatus === '1',
      is_active: formIsActive === '1',
      short_description: String(form.get('short_description') ?? ''),
      content_description: contentDescription,
      cancel_policy: cancelPolicy,
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      category_reference: formCategoryIds.join(','),
      full_address: String(form.get('full_address') ?? ''),
      pincode: String(form.get('pincode') ?? ''),
      landmark: String(form.get('landmark') ?? ''),
      zone_id: formZoneId,
      latitude: location.latitude,
      longitude: location.longitude,
      charge_type: formChargeType,
      delivery_charge: String(form.get('delivery_charge') ?? ''),
      unit_kilometers: String(form.get('unit_kilometers') ?? ''),
      unit_price: String(form.get('unit_price') ?? ''),
      additional_price: String(form.get('additional_price') ?? ''),
      store_charge: String(form.get('store_charge') ?? ''),
      minimum_order_amount: String(form.get('minimum_order_amount') ?? ''),
      commission_percent: String(form.get('commission_percent') ?? ''),
      bank_name: String(form.get('bank_name') ?? ''),
      ifsc_code: String(form.get('ifsc_code') ?? ''),
      receipt_name: String(form.get('receipt_name') ?? ''),
      account_number: String(form.get('account_number') ?? ''),
      paypal_id: String(form.get('paypal_id') ?? ''),
      upi_id: String(form.get('upi_id') ?? ''),
    })
  }

  if (isFormOpen) {
    return (
      <section className="store-form-page" aria-labelledby="store-form-title">
        <div className="store-form-page-header">
          <div className="store-form-title-block">
            <button type="button" className="ghost-button" onClick={closeForm}>
              <ArrowLeft aria-hidden="true" size={16} />
              Stores
            </button>
            <h2 id="store-form-title">{editingStore ? 'Edit Store' : 'Add Store'}</h2>
          </div>
          <div className="store-form-page-actions">
            <button className="secondary-button" type="button" onClick={closeForm}>
              Cancel
            </button>
            <button
              className="primary-button is-compact"
              type="submit"
              form="store-admin-form"
              disabled={saveStore.isPending}
            >
              {saveStore.isPending ? 'Saving...' : editingStore ? 'Save Store' : 'Create Store'}
            </button>
          </div>
        </div>

        <form id="store-admin-form" className="store-form" noValidate onSubmit={handleSubmit}>
          {formError ? <div className="form-error">{formError}</div> : null}
          {zones.isError || categories.isError ? (
            <div className="form-error">Zone or category options could not be loaded.</div>
          ) : null}

          <div className="store-form-tabs" role="tablist" aria-label="Store form sections">
            {storeFormTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className={activeStoreTab === tab.id ? 'store-form-tab is-active' : 'store-form-tab'}
                aria-selected={activeStoreTab === tab.id}
                aria-controls={`store-panel-${tab.id}`}
                id={`store-tab-${tab.id}`}
                onClick={() => setActiveStoreTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="store-tab-panels">
            <TabPanel id="basic" activeTab={activeStoreTab}>
              <FormSection title="Store Information">
                <label className="form-field">
                  <FieldLabel label="Store Name" required />
                  <input name="title" maxLength={255} defaultValue={editingStore?.title ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Store Status" required />
                  <AdminSelect
                    isSearchable={false}
                    options={publishOptions}
                    value={formIsActive}
                    onChange={setFormIsActive}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Rating" required />
                  <input
                    name="rating"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingStore?.rating ?? ''}
                  />
                </label>

                <label className="form-field">
                  <span>Certificate/License Code</span>
                  <input name="language_code" maxLength={12} defaultValue={editingStore?.language_code ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Mobile number" required />
                  <input name="mobile" maxLength={32} defaultValue={editingStore?.mobile ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Slogan Title" required />
                  <input name="slogan" maxLength={255} defaultValue={editingStore?.slogan ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Slogan Subtitle" required />
                  <input
                    name="slogan_title"
                    maxLength={255}
                    defaultValue={editingStore?.slogan_title ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Store Open Time" required />
                  <input name="opens_at" type="time" defaultValue={toTimeInput(editingStore?.opens_at)} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Store Close Time" required />
                  <input
                    name="closes_at"
                    type="time"
                    defaultValue={toTimeInput(editingStore?.closes_at)}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Store Pickup Status" required />
                  <AdminSelect
                    isSearchable={false}
                    options={pickupOptions}
                    value={formPickupStatus}
                    onChange={setFormPickupStatus}
                  />
                </label>

                <label className="form-field is-wide">
                  <FieldLabel label="Tags" required />
                  <input
                    name="short_description"
                    defaultValue={editingStore?.short_description ?? ''}
                  />
                </label>

                <label className="form-field is-wide">
                  <FieldLabel label="Short Description" required />
                  <AdminTextarea
                    name="content_description"
                    placeholder="Write the store description shown to customers"
                    value={contentDescription}
                    onChange={setContentDescription}
                    helpText="Plain text shown on the customer-facing store details."
                  />
                </label>

                <label className="form-field is-wide">
                  <FieldLabel label="Cancel Policy" required />
                  <AdminTextarea
                    name="cancel_policy"
                    placeholder="Write the cancellation policy for this store"
                    value={cancelPolicy}
                    onChange={setCancelPolicy}
                    helpText="Plain text policy customers can read before ordering."
                  />
                </label>
              </FormSection>
            </TabPanel>

            <TabPanel id="media" activeTab={activeStoreTab}>
              <FormSection title="Store Media" columns={2}>
                <label className="form-field">
                  <FieldLabel label="Store Logo" required />
                  <AdminFilePicker
                    name="image_path"
                    required
                    label="Store logo"
                    value={logoPath}
                    onChange={setLogoPath}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Store Cover Image" required />
                  <AdminFilePicker
                    name="cover_image_path"
                    required
                    label="Store cover image"
                    value={coverPath}
                    onChange={setCoverPath}
                  />
                </label>
              </FormSection>
            </TabPanel>

            <TabPanel id="login" activeTab={activeStoreTab}>
              <FormSection title="Store Login Information" columns={2}>
                <label className="form-field">
                  <FieldLabel label="Email Address" required />
                  <input
                    name="email"
                    type="email"
                    maxLength={255}
                    defaultValue={editingStore?.email ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Password" required={!editingStore} />
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder={editingStore ? 'Leave blank to keep current' : 'Minimum 8 chars'}
                  />
                </label>
              </FormSection>
            </TabPanel>

            <TabPanel id="categories" activeTab={activeStoreTab}>
              <FormSection title="Store Category Information" columns={1}>
                <label className="form-field">
                  <FieldLabel label="Store Category" required />
                  <AdminMultiSelect
                    options={categoryOptions}
                    placeholder="Search and select store categories"
                    values={formCategoryIds}
                    onChange={setFormCategoryIds}
                  />
                </label>
              </FormSection>
            </TabPanel>

            <TabPanel id="address" activeTab={activeStoreTab}>
              <FormSection title="Store Address Information" columns={2}>
                <label className="form-field is-wide">
                  <FieldLabel label="Full Address" required />
                  <input
                    name="full_address"
                    defaultValue={editingStore?.full_address ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Pincode" required />
                  <input name="pincode" maxLength={32} defaultValue={editingStore?.pincode ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Landmark" required />
                  <input name="landmark" maxLength={255} defaultValue={editingStore?.landmark ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Select Zone" required />
                  <AdminSelect
                    options={zoneOptions}
                    placeholder="Search and select zone"
                    value={formZoneId}
                    onChange={setFormZoneId}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Latitude" required />
                  <input
                    name="latitude"
                    type="number"
                    step="0.0000001"
                    value={location.latitude}
                    onChange={(event) => {
                      setLocation((current) => ({ ...current, latitude: event.target.value }))
                    }}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Longitude" required />
                  <input
                    name="longitude"
                    type="number"
                    step="0.0000001"
                    value={location.longitude}
                    onChange={(event) => {
                      setLocation((current) => ({ ...current, longitude: event.target.value }))
                    }}
                  />
                </label>

                <div className="form-field is-wide">
                  <FieldLabel label="Store Location Map" required />
                  <StoreLocationMap
                    latitude={location.latitude}
                    longitude={location.longitude}
                    onChange={(point) => {
                      setLocation({
                        latitude: point.lat.toFixed(7),
                        longitude: point.lng.toFixed(7),
                      })
                    }}
                  />
                </div>
              </FormSection>
            </TabPanel>

            <TabPanel id="service" activeTab={activeStoreTab}>
              <FormSection title="Select Service Charge Type">
                <label className="form-field is-wide">
                  <FieldLabel label="Service Charge Type" required />
                  <AdminSelect
                    isSearchable={false}
                    options={chargeTypeOptions}
                    value={formChargeType}
                    onChange={setFormChargeType}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Service Charge" required />
                  <input
                    name="delivery_charge"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={editingStore?.delivery_charge ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Base Service Distance" required />
                  <input
                    name="unit_kilometers"
                    type="number"
                    min="0"
                    required
                    defaultValue={editingStore?.unit_kilometers ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Base Service Charge" required />
                  <input
                    name="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={editingStore?.unit_price ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Extra Service Charge" required />
                  <input
                    name="additional_price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={editingStore?.additional_price ?? ''}
                  />
                </label>
              </FormSection>

              <FormSection title="Store Service Information">
                <label className="form-field">
                  <FieldLabel label="Store Charge (Packing/Extra)" required />
                  <input
                    name="store_charge"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingStore?.store_charge ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Min.Order Price" required />
                  <input
                    name="minimum_order_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingStore?.minimum_order_amount ?? ''}
                  />
                </label>
              </FormSection>

              <FormSection title="Store Admin Commission" columns={1}>
                <label className="form-field">
                  <FieldLabel label="Commission Rate %" required />
                  <input
                    name="commission_percent"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingStore?.commission_percent ?? ''}
                  />
                </label>
              </FormSection>
            </TabPanel>

            <TabPanel id="payout" activeTab={activeStoreTab}>
              <FormSection title="Store Payout Information" columns={2}>
                <label className="form-field">
                  <FieldLabel label="Bank Name" required />
                  <input name="bank_name" maxLength={255} defaultValue={editingStore?.bank_name ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Bank Code/IFSC" required />
                  <input name="ifsc_code" maxLength={64} defaultValue={editingStore?.ifsc_code ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="Recipient Name" required />
                  <input
                    name="receipt_name"
                    maxLength={255}
                    defaultValue={editingStore?.receipt_name ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Account Number" required />
                  <input
                    name="account_number"
                    maxLength={64}
                    defaultValue={editingStore?.account_number ?? ''}
                  />
                </label>

                <label className="form-field">
                  <FieldLabel label="Paypal ID" required />
                  <input name="paypal_id" maxLength={255} defaultValue={editingStore?.paypal_id ?? ''} />
                </label>

                <label className="form-field">
                  <FieldLabel label="UPI ID" required />
                  <input name="upi_id" maxLength={255} defaultValue={editingStore?.upi_id ?? ''} />
                </label>
              </FormSection>
            </TabPanel>
          </div>

          <div className="store-form-sticky-actions">
            <button className="secondary-button" type="button" onClick={closeForm}>
              Cancel
            </button>
            <button className="primary-button is-compact" type="submit" disabled={saveStore.isPending}>
              {saveStore.isPending ? 'Saving...' : editingStore ? 'Save Store' : 'Create Store'}
            </button>
          </div>
        </form>
      </section>
    )
  }

  return (
    <>
      <MasterPageHeader
        title="Stores"
        description="Manage store onboarding, addresses, service fees, payout details, and status."
        actions={canCreate ? (
          <button className="primary-button is-compact" type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={17} />
            Add Store
          </button>
        ) : null}
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
              { label: 'Publish', value: 'active' },
              { label: 'Unpublish', value: 'inactive' },
            ],
          },
        ]}
      />

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Store Management</h3>
            <p>Showing paginated store records from the backend API.</p>
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
          minWidth={980}
        />

        {stores.isError ? (
          <div className="master-error">
            Stores could not be loaded. Confirm the backend is running and your admin session is
            valid.
          </div>
        ) : null}

        <MasterPagination meta={meta} onPageChange={setPage} />
      </section>
      <ConfirmDialog
        options={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteStore.mutate(confirmDelete.store)
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
  columns = 3,
  children,
}: {
  title: string
  columns?: 1 | 2 | 3
  children: ReactNode
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

function TabPanel({
  id,
  activeTab,
  children,
}: {
  id: StoreFormTabId
  activeTab: StoreFormTabId
  children: ReactNode
}) {
  const isActive = id === activeTab

  return (
    <div
      id={`store-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`store-tab-${id}`}
      className={isActive ? 'store-tab-panel is-active' : 'store-tab-panel'}
    >
      {children}
    </div>
  )
}

function extractStoreApiValidationError(error: unknown) {
  if (!isAxiosError(error) || error.response?.status !== 422) {
    return null
  }

  const responseData = error.response.data as {
    message?: string
    errors?: Record<string, string[]>
  }
  const errors = responseData.errors

  if (!errors) {
    return null
  }

  for (const field of storeValidationFields) {
    const fieldErrors = errors[field.name]

    if (fieldErrors?.length) {
      return {
        message: `${fieldErrors[0]} Complete the ${tabLabel(field.tab)} tab before continuing.`,
        tab: field.tab,
      }
    }
  }

  const firstErrorKey = Object.keys(errors)[0]
  const firstMessage = firstErrorKey ? errors[firstErrorKey]?.[0] : responseData.message

  if (!firstMessage) {
    return null
  }

  return {
    message: firstMessage,
    tab: 'basic' as StoreFormTabId,
  }
}

function tabLabel(tab: StoreFormTabId) {
  return storeFormTabs.find((item) => item.id === tab)?.label ?? 'current'
}

function StoreImagePreview({ src, alt }: { src: string | null; alt: string }) {
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

function toStorePayload(values: StoreFormValues, isEditing: boolean) {
  const payload: Record<string, string | number | boolean | null> = {
    title: values.title,
    zone_id: nullableNumber(values.zone_id),
    image_path: values.image_path,
    cover_image_path: values.cover_image_path,
    rating: nullableNumber(values.rating),
    slogan: values.slogan,
    slogan_title: values.slogan_title,
    language_code: nullableString(values.language_code),
    category_reference: values.category_reference,
    email: values.email,
    country_code: null,
    mobile: values.mobile,
    full_address: values.full_address,
    pincode: values.pincode,
    landmark: values.landmark,
    short_description: values.short_description,
    content_description: values.content_description,
    latitude: nullableNumber(values.latitude),
    longitude: nullableNumber(values.longitude),
    store_charge: nullableNumber(values.store_charge),
    delivery_charge: nullableNumber(values.delivery_charge),
    minimum_order_amount: nullableNumber(values.minimum_order_amount),
    commission_percent: nullableNumber(values.commission_percent),
    opens_at: toApiTime(values.opens_at),
    closes_at: toApiTime(values.closes_at),
    is_pickup_enabled: values.is_pickup_enabled,
    is_active: values.is_active,
    registration_status: 1,
    charge_type: nullableNumber(values.charge_type),
    unit_kilometers: nullableNumber(values.unit_kilometers),
    unit_price: nullableNumber(values.unit_price),
    additional_price: nullableNumber(values.additional_price),
    bank_name: values.bank_name,
    ifsc_code: values.ifsc_code,
    receipt_name: values.receipt_name,
    account_number: values.account_number,
    paypal_id: values.paypal_id,
    upi_id: values.upi_id,
    cancel_policy: values.cancel_policy,
  }

  if (!isEditing || values.password) {
    payload.password = values.password ?? ''
  }

  return payload
}

function splitCategoryReference(value?: string | null) {
  return value
    ? value
        .split(',')
        .map((category) => category.trim())
        .filter(Boolean)
    : []
}

function toSelectOptions(options?: SelectOption[]): AdminSelectOption[] {
  return options?.map((option) => ({ label: option.title, value: String(option.id) })) ?? []
}

function serialNumber(meta: PaginationMeta, index: number) {
  return (meta.from || 1) + index
}

function stringifyValue(value: string | number | null) {
  return value === null ? '' : String(value)
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

function assetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `/${path.replace(/^\/+/, '')}`
}
