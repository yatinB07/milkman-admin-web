import { ArrowLeft } from 'lucide-react'
import { type FormEvent, type InputHTMLAttributes, type MouseEvent, type ReactNode, useState } from 'react'
import { Button, Input } from '../../components/common'
import { AdminFilePicker } from '../../components/forms/AdminFilePicker'
import { AdminMultiSelect, AdminSelect, type AdminSelectOption } from '../../components/forms/AdminSelect'
import { AdminTextarea } from '../../components/forms/AdminTextarea'
import { FieldLabel } from '../../components/forms/FormLayout'
import { StoreLocationMap } from '../../components/maps/StoreLocationMap'
import {
  splitCategoryReference,
  storeFormTabs,
  storeValidationFields,
  stringifyValue,
  toTimeInput,
  validateStoreFieldErrors,
} from './storeService'
import type { StoreFormErrors, StoreFormTabId, StoreFormValues, StoreRow } from './storeTypes'

type StoreFormProps = {
  store: StoreRow | null
  categoryOptions: AdminSelectOption[]
  zoneOptions: AdminSelectOption[]
  formErrors: StoreFormErrors
  optionError: boolean
  isSaving: boolean
  activeTab: StoreFormTabId
  onActiveTabChange: (tab: StoreFormTabId) => void
  onFormErrorsChange: (errors: StoreFormErrors) => void
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
  formErrors,
  optionError,
  isSaving,
  activeTab,
  onActiveTabChange,
  onFormErrorsChange,
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
  const [maxStepIndex, setMaxStepIndex] = useState(0)
  const activeStepIndex = Math.max(
    0,
    storeFormTabs.findIndex((step) => step.id === activeTab),
  )
  const isFirstStep = activeStepIndex === 0
  const isLastStep = activeStepIndex === storeFormTabs.length - 1
  const activeStep = storeFormTabs[activeStepIndex]

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
    const validation = validateStoreFieldErrors(values, Boolean(store))

    onFormErrorsChange(validation.errors)

    if (validation.firstTab) {
      onActiveTabChange(validation.firstTab)
      return
    }

    onSubmit(values)
  }

  function handlePreviousStep() {
    if (isFirstStep) return

    onActiveTabChange(storeFormTabs[activeStepIndex - 1].id)
  }

  function handleNextStep(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form

    if (!form || isLastStep) return

    const values = buildValues(new FormData(form))
    const validation = validateStoreFieldErrors(values, Boolean(store))
    const currentErrors = stepErrors(validation.errors, activeTab)

    onFormErrorsChange({ ...clearStepErrors(formErrors, activeTab), ...currentErrors })

    if (Object.keys(currentErrors).length > 0) return

    const nextStepIndex = activeStepIndex + 1
    setMaxStepIndex((current) => Math.max(current, nextStepIndex))
    onActiveTabChange(storeFormTabs[nextStepIndex].id)
  }

  function handleStepClick(index: number) {
    if (index > maxStepIndex) return

    onActiveTabChange(storeFormTabs[index].id)
  }

  return (
    <section className="store-form-page" aria-labelledby="store-form-title">
      <div className="store-form-page-header">
        <div className="store-form-title-block">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft aria-hidden="true" size={16} />
            Stores
          </Button>
          <h2 id="store-form-title">{store ? 'Edit Store' : 'Add Store'}</h2>
        </div>
        <div className="store-form-page-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <form id="store-admin-form" className="store-form" noValidate onSubmit={handleSubmit}>
        <div className="store-form-steps" aria-label="Store form steps">
          {storeFormTabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'store-form-step is-active' : 'store-form-step'}
              aria-current={activeTab === tab.id ? 'step' : undefined}
              disabled={index > maxStepIndex}
              onClick={() => handleStepClick(index)}
            >
              <span>{index + 1}</span>
              <strong>{tab.label}</strong>
            </button>
          ))}
        </div>

        <div className="store-step-panels">
          <StepPanel id="basic" activeTab={activeTab}>
            <StoreFormSection title="Store Information">
              <StoreInputField
                name="title"
                label="Store Name"
                required
                maxLength={255}
                defaultValue={store?.title ?? ''}
                error={formErrors.title}
              />

              <label className="form-field">
                <FieldLabel label="Store Status" required />
                <AdminSelect isSearchable={false} options={publishOptions} value={formIsActive} onChange={setFormIsActive} />
              </label>

              <StoreInputField
                name="rating"
                label="Rating"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={store?.rating ?? ''}
                error={formErrors.rating}
              />

              <StoreInputField
                name="language_code"
                label="Certificate/License Code"
                maxLength={12}
                defaultValue={store?.language_code ?? ''}
              />

              <StoreInputField
                name="mobile"
                label="Mobile number"
                required
                maxLength={32}
                defaultValue={store?.mobile ?? ''}
                error={formErrors.mobile}
              />

              <StoreInputField
                name="slogan"
                label="Slogan Title"
                required
                maxLength={255}
                defaultValue={store?.slogan ?? ''}
                error={formErrors.slogan}
              />

              <StoreInputField
                name="slogan_title"
                label="Slogan Subtitle"
                required
                maxLength={255}
                defaultValue={store?.slogan_title ?? ''}
                error={formErrors.slogan_title}
              />

              <StoreInputField
                name="opens_at"
                label="Store Open Time"
                required
                type="time"
                defaultValue={toTimeInput(store?.opens_at)}
                error={formErrors.opens_at}
              />

              <StoreInputField
                name="closes_at"
                label="Store Close Time"
                required
                type="time"
                defaultValue={toTimeInput(store?.closes_at)}
                error={formErrors.closes_at}
              />

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
                <Input
                  name="short_description"
                  aria-invalid={Boolean(formErrors.short_description)}
                  defaultValue={store?.short_description ?? ''}
                />
                <FieldError message={formErrors.short_description} />
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
                <FieldError message={formErrors.content_description} />
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
                <FieldError message={formErrors.cancel_policy} />
              </label>
            </StoreFormSection>
          </StepPanel>

          <StepPanel id="media" activeTab={activeTab}>
            <StoreFormSection title="Store Media" columns={2}>
              <label className="form-field">
                <FieldLabel label="Store Logo" required />
                <AdminFilePicker name="image_path" required label="Store logo" value={logoPath} onChange={setLogoPath} />
                <FieldError message={formErrors.image_path} />
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
                <FieldError message={formErrors.cover_image_path} />
              </label>
            </StoreFormSection>
          </StepPanel>

          <StepPanel id="login" activeTab={activeTab}>
            <StoreFormSection title="Store Login Information" columns={2}>
              <StoreInputField
                name="email"
                label="Email Address"
                required
                type="email"
                maxLength={255}
                defaultValue={store?.email ?? ''}
                error={formErrors.email}
              />

              <StoreInputField
                name="password"
                label="Password"
                required={!store}
                type="password"
                minLength={8}
                placeholder={store ? 'Leave blank to keep current' : 'Minimum 8 chars'}
                error={formErrors.password}
              />
            </StoreFormSection>
          </StepPanel>

          <StepPanel id="categories" activeTab={activeTab}>
            <StoreFormSection title="Store Category Information" columns={1}>
              <label className="form-field">
                <FieldLabel label="Store Category" required />
                <AdminMultiSelect
                  options={categoryOptions}
                  placeholder="Search and select store categories"
                  values={formCategoryIds}
                  onChange={setFormCategoryIds}
                  hasError={Boolean(formErrors.category_reference || optionError)}
                />
                <FieldError message={formErrors.category_reference ?? (optionError ? 'Zone or category options could not be loaded.' : undefined)} />
              </label>
            </StoreFormSection>
          </StepPanel>

          <StepPanel id="address" activeTab={activeTab}>
            <StoreFormSection title="Store Address Information" columns={2}>
              <StoreInputField
                name="full_address"
                label="Full Address"
                required
                wide
                defaultValue={store?.full_address ?? ''}
                error={formErrors.full_address}
              />

              <StoreInputField
                name="pincode"
                label="Pincode"
                required
                maxLength={32}
                defaultValue={store?.pincode ?? ''}
                error={formErrors.pincode}
              />

              <StoreInputField
                name="landmark"
                label="Landmark"
                required
                maxLength={255}
                defaultValue={store?.landmark ?? ''}
                error={formErrors.landmark}
              />

              <label className="form-field">
                <FieldLabel label="Select Zone" required />
                <AdminSelect
                  options={zoneOptions}
                  placeholder="Search and select zone"
                  value={formZoneId}
                  onChange={setFormZoneId}
                  hasError={Boolean(formErrors.zone_id || optionError)}
                />
                <FieldError message={formErrors.zone_id ?? (optionError ? 'Zone or category options could not be loaded.' : undefined)} />
              </label>

              <label className="form-field">
                <FieldLabel label="Latitude" required />
                <Input
                  name="latitude"
                  type="number"
                  step="0.0000001"
                  aria-invalid={Boolean(formErrors.latitude)}
                  value={location.latitude}
                  onChange={(event) => {
                    setLocation((current) => ({ ...current, latitude: event.target.value }))
                  }}
                />
                <FieldError message={formErrors.latitude} />
              </label>

              <label className="form-field">
                <FieldLabel label="Longitude" required />
                <Input
                  name="longitude"
                  type="number"
                  step="0.0000001"
                  aria-invalid={Boolean(formErrors.longitude)}
                  value={location.longitude}
                  onChange={(event) => {
                    setLocation((current) => ({ ...current, longitude: event.target.value }))
                  }}
                />
                <FieldError message={formErrors.longitude} />
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
          </StepPanel>

          <StepPanel id="service" activeTab={activeTab}>
            <StoreFormSection title="Select Service Charge Type">
              <label className="form-field is-wide">
                <FieldLabel label="Service Charge Type" required />
                <AdminSelect
                  isSearchable={false}
                  options={chargeTypeOptions}
                  value={formChargeType}
                  onChange={setFormChargeType}
                  hasError={Boolean(formErrors.charge_type)}
                />
                <FieldError message={formErrors.charge_type} />
              </label>

              <StoreInputField
                name="delivery_charge"
                label="Service Charge"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={store?.delivery_charge ?? ''}
                error={formErrors.delivery_charge}
              />

              <StoreInputField
                name="unit_kilometers"
                label="Base Service Distance"
                required
                type="number"
                min="0"
                defaultValue={store?.unit_kilometers ?? ''}
                error={formErrors.unit_kilometers}
              />

              <StoreInputField
                name="unit_price"
                label="Base Service Charge"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={store?.unit_price ?? ''}
                error={formErrors.unit_price}
              />

              <StoreInputField
                name="additional_price"
                label="Extra Service Charge"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={store?.additional_price ?? ''}
                error={formErrors.additional_price}
              />
            </StoreFormSection>

            <StoreFormSection title="Store Service Information">
              <StoreInputField
                name="store_charge"
                label="Store Charge (Packing/Extra)"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={store?.store_charge ?? ''}
                error={formErrors.store_charge}
              />

              <StoreInputField
                name="minimum_order_amount"
                label="Min.Order Price"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={store?.minimum_order_amount ?? ''}
                error={formErrors.minimum_order_amount}
              />
            </StoreFormSection>

            <StoreFormSection title="Store Admin Commission" columns={1}>
              <StoreInputField
                name="commission_percent"
                label="Commission Rate %"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={store?.commission_percent ?? ''}
                error={formErrors.commission_percent}
              />
            </StoreFormSection>
          </StepPanel>

          <StepPanel id="payout" activeTab={activeTab}>
            <StoreFormSection title="Store Payout Information" columns={2}>
              <StoreInputField
                name="bank_name"
                label="Bank Name"
                required
                maxLength={255}
                defaultValue={store?.bank_name ?? ''}
                error={formErrors.bank_name}
              />

              <StoreInputField
                name="ifsc_code"
                label="Bank Code/IFSC"
                required
                maxLength={64}
                defaultValue={store?.ifsc_code ?? ''}
                error={formErrors.ifsc_code}
              />

              <StoreInputField
                name="receipt_name"
                label="Recipient Name"
                required
                maxLength={255}
                defaultValue={store?.receipt_name ?? ''}
                error={formErrors.receipt_name}
              />

              <StoreInputField
                name="account_number"
                label="Account Number"
                required
                maxLength={64}
                defaultValue={store?.account_number ?? ''}
                error={formErrors.account_number}
              />

              <StoreInputField
                name="paypal_id"
                label="Paypal ID"
                required
                maxLength={255}
                defaultValue={store?.paypal_id ?? ''}
                error={formErrors.paypal_id}
              />

              <StoreInputField
                name="upi_id"
                label="UPI ID"
                required
                maxLength={255}
                defaultValue={store?.upi_id ?? ''}
                error={formErrors.upi_id}
              />
            </StoreFormSection>
          </StepPanel>
        </div>

        <div className="store-form-sticky-actions">
          <span className="store-step-status">
            Step {activeStepIndex + 1} of {storeFormTabs.length}: {activeStep.label}
          </span>
          <Button variant="secondary" onClick={isFirstStep ? onCancel : handlePreviousStep}>
            {isFirstStep ? 'Cancel' : 'Previous'}
          </Button>
          {isLastStep ? (
            <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : store ? 'Save Store' : 'Create Store'}
            </Button>
          ) : (
            <Button variant="primary" size="compact" onClick={handleNextStep}>
              Next
            </Button>
          )}
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

type StoreInputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  error?: string
  label: string
  name: keyof StoreFormValues
  required?: boolean
  wide?: boolean
}

function StoreInputField({ error, label, name, required = false, wide = false, ...props }: StoreInputFieldProps) {
  return (
    <label className={wide ? 'form-field is-wide' : 'form-field'}>
      {required ? <FieldLabel label={label} required /> : <span>{label}</span>}
      <Input name={name} aria-invalid={Boolean(error)} {...props} />
      <FieldError message={error} />
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? <small className="field-error">{message}</small> : null
}

function stepErrors(errors: StoreFormErrors, tab: StoreFormTabId) {
  return Object.fromEntries(
    storeValidationFields
      .filter((field) => field.tab === tab && errors[field.name])
      .map((field) => [field.name, errors[field.name]]),
  ) as StoreFormErrors
}

function clearStepErrors(errors: StoreFormErrors, tab: StoreFormTabId) {
  const nextErrors = { ...errors }

  storeValidationFields
    .filter((field) => field.tab === tab)
    .forEach((field) => {
      delete nextErrors[field.name]
    })

  return nextErrors
}

function StepPanel({
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
      className={isActive ? 'store-step-panel is-active' : 'store-step-panel'}
    >
      {children}
    </div>
  )
}
