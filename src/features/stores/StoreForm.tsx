import { ArrowLeft } from 'lucide-react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { AdminFilePicker } from '../../components/forms/AdminFilePicker'
import { AdminMultiSelect, AdminSelect, type AdminSelectOption } from '../../components/forms/AdminSelect'
import { AdminTextarea } from '../../components/forms/AdminTextarea'
import { FieldLabel } from '../../components/forms/FormLayout'
import { StoreLocationMap } from '../../components/maps/StoreLocationMap'
import {
  splitCategoryReference,
  storeFormTabs,
  stringifyValue,
  toTimeInput,
  validateStoreValues,
} from './storeService'
import type { StoreFormTabId, StoreFormValues, StoreRow } from './storeTypes'

type StoreFormProps = {
  store: StoreRow | null
  categoryOptions: AdminSelectOption[]
  zoneOptions: AdminSelectOption[]
  formError: string | null
  optionError: boolean
  isSaving: boolean
  activeTab: StoreFormTabId
  onActiveTabChange: (tab: StoreFormTabId) => void
  onFormError: (message: string | null) => void
  onCancel: () => void
  onSubmit: (values: StoreFormValues) => void
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

export function StoreForm({
  store,
  categoryOptions,
  zoneOptions,
  formError,
  optionError,
  isSaving,
  activeTab,
  onActiveTabChange,
  onFormError,
  onCancel,
  onSubmit,
}: StoreFormProps) {
  const [location, setLocation] = useState({
    latitude: stringifyValue(store?.latitude ?? null),
    longitude: stringifyValue(store?.longitude ?? null),
  })
  const [formIsActive, setFormIsActive] = useState(store?.is_active === false ? '0' : '1')
  const [formPickupStatus, setFormPickupStatus] = useState(store?.is_pickup_enabled === false ? '0' : '1')
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>(splitCategoryReference(store?.category_reference))
  const [formZoneId, setFormZoneId] = useState(stringifyValue(store?.zone_id ?? null))
  const [formChargeType, setFormChargeType] = useState(String(store?.charge_type ?? '1'))
  const [logoPath, setLogoPath] = useState(store?.image_path ?? '')
  const [coverPath, setCoverPath] = useState(store?.cover_image_path ?? '')
  const [contentDescription, setContentDescription] = useState(store?.content_description ?? '')
  const [cancelPolicy, setCancelPolicy] = useState(store?.cancel_policy ?? '')

  function buildValues(form: FormData): StoreFormValues {
    return {
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
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = buildValues(new FormData(event.currentTarget))
    const validationError = validateStoreValues(values, Boolean(store))

    if (validationError) {
      onActiveTabChange(validationError.tab)
      onFormError(validationError.message)
      return
    }

    onFormError(null)
    onSubmit(values)
  }

  return (
    <section className="store-form-page" aria-labelledby="store-form-title">
      <div className="store-form-page-header">
        <div className="store-form-title-block">
          <button type="button" className="ghost-button" onClick={onCancel}>
            <ArrowLeft aria-hidden="true" size={16} />
            Stores
          </button>
          <h2 id="store-form-title">{store ? 'Edit Store' : 'Add Store'}</h2>
        </div>
        <div className="store-form-page-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button is-compact" type="submit" form="store-admin-form" disabled={isSaving}>
            {isSaving ? 'Saving...' : store ? 'Save Store' : 'Create Store'}
          </button>
        </div>
      </div>

      <form id="store-admin-form" className="store-form" noValidate onSubmit={handleSubmit}>
        {formError ? <div className="form-error">{formError}</div> : null}
        {optionError ? <div className="form-error">Zone or category options could not be loaded.</div> : null}

        <div className="store-form-tabs" role="tablist" aria-label="Store form sections">
          {storeFormTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={activeTab === tab.id ? 'store-form-tab is-active' : 'store-form-tab'}
              aria-selected={activeTab === tab.id}
              aria-controls={`store-panel-${tab.id}`}
              id={`store-tab-${tab.id}`}
              onClick={() => onActiveTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="store-tab-panels">
          <TabPanel id="basic" activeTab={activeTab}>
            <StoreFormSection title="Store Information">
              <label className="form-field">
                <FieldLabel label="Store Name" required />
                <input name="title" maxLength={255} defaultValue={store?.title ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Store Status" required />
                <AdminSelect isSearchable={false} options={publishOptions} value={formIsActive} onChange={setFormIsActive} />
              </label>

              <label className="form-field">
                <FieldLabel label="Rating" required />
                <input name="rating" type="number" min="0" step="0.01" defaultValue={store?.rating ?? ''} />
              </label>

              <label className="form-field">
                <span>Certificate/License Code</span>
                <input name="language_code" maxLength={12} defaultValue={store?.language_code ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Mobile number" required />
                <input name="mobile" maxLength={32} defaultValue={store?.mobile ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Slogan Title" required />
                <input name="slogan" maxLength={255} defaultValue={store?.slogan ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Slogan Subtitle" required />
                <input name="slogan_title" maxLength={255} defaultValue={store?.slogan_title ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Store Open Time" required />
                <input name="opens_at" type="time" defaultValue={toTimeInput(store?.opens_at)} />
              </label>

              <label className="form-field">
                <FieldLabel label="Store Close Time" required />
                <input name="closes_at" type="time" defaultValue={toTimeInput(store?.closes_at)} />
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
                <input name="short_description" defaultValue={store?.short_description ?? ''} />
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
            </StoreFormSection>
          </TabPanel>

          <TabPanel id="media" activeTab={activeTab}>
            <StoreFormSection title="Store Media" columns={2}>
              <label className="form-field">
                <FieldLabel label="Store Logo" required />
                <AdminFilePicker name="image_path" required label="Store logo" value={logoPath} onChange={setLogoPath} />
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
            </StoreFormSection>
          </TabPanel>

          <TabPanel id="login" activeTab={activeTab}>
            <StoreFormSection title="Store Login Information" columns={2}>
              <label className="form-field">
                <FieldLabel label="Email Address" required />
                <input name="email" type="email" maxLength={255} defaultValue={store?.email ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Password" required={!store} />
                <input name="password" type="password" minLength={8} placeholder={store ? 'Leave blank to keep current' : 'Minimum 8 chars'} />
              </label>
            </StoreFormSection>
          </TabPanel>

          <TabPanel id="categories" activeTab={activeTab}>
            <StoreFormSection title="Store Category Information" columns={1}>
              <label className="form-field">
                <FieldLabel label="Store Category" required />
                <AdminMultiSelect
                  options={categoryOptions}
                  placeholder="Search and select store categories"
                  values={formCategoryIds}
                  onChange={setFormCategoryIds}
                />
              </label>
            </StoreFormSection>
          </TabPanel>

          <TabPanel id="address" activeTab={activeTab}>
            <StoreFormSection title="Store Address Information" columns={2}>
              <label className="form-field is-wide">
                <FieldLabel label="Full Address" required />
                <input name="full_address" defaultValue={store?.full_address ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Pincode" required />
                <input name="pincode" maxLength={32} defaultValue={store?.pincode ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Landmark" required />
                <input name="landmark" maxLength={255} defaultValue={store?.landmark ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Select Zone" required />
                <AdminSelect options={zoneOptions} placeholder="Search and select zone" value={formZoneId} onChange={setFormZoneId} />
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
            </StoreFormSection>
          </TabPanel>

          <TabPanel id="service" activeTab={activeTab}>
            <StoreFormSection title="Select Service Charge Type">
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
                <input name="delivery_charge" type="number" min="0" step="0.01" required defaultValue={store?.delivery_charge ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Base Service Distance" required />
                <input name="unit_kilometers" type="number" min="0" required defaultValue={store?.unit_kilometers ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Base Service Charge" required />
                <input name="unit_price" type="number" min="0" step="0.01" required defaultValue={store?.unit_price ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Extra Service Charge" required />
                <input name="additional_price" type="number" min="0" step="0.01" required defaultValue={store?.additional_price ?? ''} />
              </label>
            </StoreFormSection>

            <StoreFormSection title="Store Service Information">
              <label className="form-field">
                <FieldLabel label="Store Charge (Packing/Extra)" required />
                <input name="store_charge" type="number" min="0" step="0.01" defaultValue={store?.store_charge ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Min.Order Price" required />
                <input name="minimum_order_amount" type="number" min="0" step="0.01" defaultValue={store?.minimum_order_amount ?? ''} />
              </label>
            </StoreFormSection>

            <StoreFormSection title="Store Admin Commission" columns={1}>
              <label className="form-field">
                <FieldLabel label="Commission Rate %" required />
                <input name="commission_percent" type="number" min="0" step="0.01" defaultValue={store?.commission_percent ?? ''} />
              </label>
            </StoreFormSection>
          </TabPanel>

          <TabPanel id="payout" activeTab={activeTab}>
            <StoreFormSection title="Store Payout Information" columns={2}>
              <label className="form-field">
                <FieldLabel label="Bank Name" required />
                <input name="bank_name" maxLength={255} defaultValue={store?.bank_name ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Bank Code/IFSC" required />
                <input name="ifsc_code" maxLength={64} defaultValue={store?.ifsc_code ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Recipient Name" required />
                <input name="receipt_name" maxLength={255} defaultValue={store?.receipt_name ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Account Number" required />
                <input name="account_number" maxLength={64} defaultValue={store?.account_number ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="Paypal ID" required />
                <input name="paypal_id" maxLength={255} defaultValue={store?.paypal_id ?? ''} />
              </label>

              <label className="form-field">
                <FieldLabel label="UPI ID" required />
                <input name="upi_id" maxLength={255} defaultValue={store?.upi_id ?? ''} />
              </label>
            </StoreFormSection>
          </TabPanel>
        </div>

        <div className="store-form-sticky-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button is-compact" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : store ? 'Save Store' : 'Create Store'}
          </button>
        </div>
      </form>
    </section>
  )
}

function StoreFormSection({
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
