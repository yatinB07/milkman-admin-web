import { ArrowLeft } from 'lucide-react'
import { type InputHTMLAttributes, type ReactNode, useState } from 'react'
import { useForm, useWatch, type UseFormRegister } from 'react-hook-form'
import { Button, Input } from '../../components/common'
import { FilePickerField } from '../../components/forms/FilePickerField'
import { MultiSelectField, SelectField, type SelectFieldOption } from '../../components/forms/SelectField'
import { RichTextField } from '../../components/forms/RichTextField'
import { FieldLabel } from '../../components/forms/FormLayout'
import { StoreLocationMap } from '../../components/maps/StoreLocationMap'
import { publishStatusSelectOptions, yesNoSelectOptions } from '../../lib/filterOptions'
import { dirtyFormCaptureProps, dirtyFormStore } from '../../store/dirtyFormStore'
import {
  splitCategoryReference,
  storeFormTabs,
  storeValidationFields,
  toStoreFormDefaults,
  validateStoreFieldErrors,
} from './storeService'
import type { StoreFormErrors, StoreFormTabId, StoreFormValues, StoreRow } from './storeTypes'

type StoreFormProps = {
  store: StoreRow | null
  categoryOptions: SelectFieldOption[]
  zoneOptions: SelectFieldOption[]
  formErrors: StoreFormErrors
  optionError: boolean
  isSaving: boolean
  activeTab: StoreFormTabId
  onActiveTabChange: (tab: StoreFormTabId) => void
  onFormErrorsChange: (errors: StoreFormErrors) => void
  onCancel: () => void
  onSubmit: (values: StoreFormValues) => void
}

const chargeTypeOptions: SelectFieldOption[] = [
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
  const { control, getValues, handleSubmit: submitForm, register, setValue } = useForm<StoreFormValues>({
    defaultValues: toStoreFormDefaults(store),
  })
  const [maxStepIndex, setMaxStepIndex] = useState(0)
  const watchedValues = useWatch({ control })
  const formIsActive = watchedValues.is_active ? '1' : '0'
  const formPickupStatus = watchedValues.is_pickup_enabled ? '1' : '0'
  const formCategoryIds = splitCategoryReference(watchedValues.category_reference)
  const formZoneId = watchedValues.zone_id ?? ''
  const formChargeType = watchedValues.charge_type ?? '1'
  const logoPath = watchedValues.image_path ?? ''
  const coverPath = watchedValues.cover_image_path ?? ''
  const contentDescription = watchedValues.content_description ?? ''
  const cancelPolicy = watchedValues.cancel_policy ?? ''
  const location = {
    latitude: watchedValues.latitude ?? '',
    longitude: watchedValues.longitude ?? '',
  }
  const activeStepIndex = Math.max(
    0,
    storeFormTabs.findIndex((step) => step.id === activeTab),
  )
  const isFirstStep = activeStepIndex === 0
  const isLastStep = activeStepIndex === storeFormTabs.length - 1
  const activeStep = storeFormTabs[activeStepIndex]

  function setFormValue(name: keyof StoreFormValues, value: string | boolean) {
    setValue(name, value as never, { shouldDirty: true })
    dirtyFormStore.markDirty()
  }

  function handleValidSubmit(values: StoreFormValues) {
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

  function handleNextStep() {
    if (isLastStep) return

    const values = getValues()
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

      <form
        id="store-admin-form"
        className="admin-form"
        noValidate
        {...dirtyFormCaptureProps}
        onSubmit={submitForm(handleValidSubmit)}
      >
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
                error={formErrors.title}
                register={register}
              />

              <label className="form-field">
                <FieldLabel label="Store Status" required />
                <SelectField
                  isSearchable={false}
                  options={publishStatusSelectOptions}
                  value={formIsActive}
                  onChange={(value) => setFormValue('is_active', value === '1')}
                />
              </label>

              <StoreInputField
                name="rating"
                label="Rating"
                required
                type="number"
                min="0"
                step="0.01"
                error={formErrors.rating}
                register={register}
              />

              <StoreInputField
                name="language_code"
                label="Certificate/License Code"
                maxLength={12}
                register={register}
              />

              <StoreInputField
                name="mobile"
                label="Mobile number"
                required
                maxLength={32}
                error={formErrors.mobile}
                register={register}
              />

              <StoreInputField
                name="slogan"
                label="Slogan Title"
                required
                maxLength={255}
                error={formErrors.slogan}
                register={register}
              />

              <StoreInputField
                name="slogan_title"
                label="Slogan Subtitle"
                required
                maxLength={255}
                error={formErrors.slogan_title}
                register={register}
              />

              <StoreInputField
                name="opens_at"
                label="Store Open Time"
                required
                type="time"
                error={formErrors.opens_at}
                register={register}
              />

              <StoreInputField
                name="closes_at"
                label="Store Close Time"
                required
                type="time"
                error={formErrors.closes_at}
                register={register}
              />

              <label className="form-field">
                <FieldLabel label="Store Pickup Status" required />
                <SelectField
                  isSearchable={false}
                  options={yesNoSelectOptions}
                  value={formPickupStatus}
                  onChange={(value) => setFormValue('is_pickup_enabled', value === '1')}
                />
              </label>

              <label className="form-field is-wide">
                <FieldLabel label="Tags" required />
                <Input aria-invalid={Boolean(formErrors.short_description)} {...register('short_description')} />
                <FieldError message={formErrors.short_description} />
              </label>

              <label className="form-field is-wide">
                <FieldLabel label="Short Description" required />
                <RichTextField
                  name="content_description"
                  placeholder="Write the store description shown to customers"
                  value={contentDescription}
                  onChange={(value) => setFormValue('content_description', value)}
                  helpText="Plain text shown on the customer-facing store details."
                />
                <FieldError message={formErrors.content_description} />
              </label>

              <label className="form-field is-wide">
                <FieldLabel label="Cancel Policy" required />
                <RichTextField
                  name="cancel_policy"
                  placeholder="Write the cancellation policy for this store"
                  value={cancelPolicy}
                  onChange={(value) => setFormValue('cancel_policy', value)}
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
                <FilePickerField
                  name="image_path"
                  required
                  directory="stores"
                  label="Store logo"
                  value={logoPath}
                  onChange={(value) => setFormValue('image_path', value)}
                />
                <FieldError message={formErrors.image_path} />
              </label>

              <label className="form-field">
                <FieldLabel label="Store Cover Image" required />
                <FilePickerField
                  name="cover_image_path"
                  required
                  directory="stores"
                  label="Store cover image"
                  value={coverPath}
                  onChange={(value) => setFormValue('cover_image_path', value)}
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
                error={formErrors.email}
                register={register}
              />

              <StoreInputField
                name="password"
                label="Password"
                required={!store}
                type="password"
                minLength={8}
                placeholder={store ? 'Leave blank to keep current' : 'Minimum 8 chars'}
                error={formErrors.password}
                register={register}
              />
            </StoreFormSection>
          </StepPanel>

          <StepPanel id="categories" activeTab={activeTab}>
            <StoreFormSection title="Store Category Information" columns={1}>
              <label className="form-field">
                <FieldLabel label="Store Category" required />
                <MultiSelectField
                  ariaLabel="Store category"
                  inputId="store-category"
                  options={categoryOptions}
                  placeholder="Search and select store categories"
                  values={formCategoryIds}
                  onChange={(values) => setFormValue('category_reference', values.join(','))}
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
                error={formErrors.full_address}
                register={register}
              />

              <StoreInputField
                name="pincode"
                label="Pincode"
                required
                maxLength={32}
                error={formErrors.pincode}
                register={register}
              />

              <StoreInputField
                name="landmark"
                label="Landmark"
                required
                maxLength={255}
                error={formErrors.landmark}
                register={register}
              />

              <label className="form-field">
                <FieldLabel label="Select Zone" required />
                <SelectField
                  options={zoneOptions}
                  placeholder="Search and select zone"
                  value={formZoneId}
                  onChange={(value) => setFormValue('zone_id', value)}
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
                    setFormValue('latitude', event.target.value)
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
                    setFormValue('longitude', event.target.value)
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
                    setFormValue('latitude', point.lat.toFixed(7))
                    setFormValue('longitude', point.lng.toFixed(7))
                  }}
                />
              </div>
            </StoreFormSection>
          </StepPanel>

          <StepPanel id="service" activeTab={activeTab}>
            <StoreFormSection title="Select Service Charge Type">
              <label className="form-field is-wide">
                <FieldLabel label="Service Charge Type" required />
                <SelectField
                  isSearchable={false}
                  options={chargeTypeOptions}
                  value={formChargeType}
                  onChange={(value) => setFormValue('charge_type', value)}
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
                error={formErrors.delivery_charge}
                register={register}
              />

              <StoreInputField
                name="unit_kilometers"
                label="Base Service Distance"
                required
                type="number"
                min="0"
                error={formErrors.unit_kilometers}
                register={register}
              />

              <StoreInputField
                name="unit_price"
                label="Base Service Charge"
                required
                type="number"
                min="0"
                step="0.01"
                error={formErrors.unit_price}
                register={register}
              />

              <StoreInputField
                name="additional_price"
                label="Extra Service Charge"
                required
                type="number"
                min="0"
                step="0.01"
                error={formErrors.additional_price}
                register={register}
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
                error={formErrors.store_charge}
                register={register}
              />

              <StoreInputField
                name="minimum_order_amount"
                label="Min.Order Price"
                required
                type="number"
                min="0"
                step="0.01"
                error={formErrors.minimum_order_amount}
                register={register}
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
                error={formErrors.commission_percent}
                register={register}
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
                error={formErrors.bank_name}
                register={register}
              />

              <StoreInputField
                name="ifsc_code"
                label="Bank Code/IFSC"
                required
                maxLength={64}
                error={formErrors.ifsc_code}
                register={register}
              />

              <StoreInputField
                name="receipt_name"
                label="Recipient Name"
                required
                maxLength={255}
                error={formErrors.receipt_name}
                register={register}
              />

              <StoreInputField
                name="account_number"
                label="Account Number"
                required
                maxLength={64}
                error={formErrors.account_number}
                register={register}
              />

              <StoreInputField
                name="paypal_id"
                label="Paypal ID"
                required
                maxLength={255}
                error={formErrors.paypal_id}
                register={register}
              />

              <StoreInputField
                name="upi_id"
                label="UPI ID"
                required
                maxLength={255}
                error={formErrors.upi_id}
                register={register}
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
    <section className="admin-form-section">
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
  register: UseFormRegister<StoreFormValues>
  required?: boolean
  wide?: boolean
}

function StoreInputField({ error, label, name, register, required = false, wide = false, ...props }: StoreInputFieldProps) {
  return (
    <label className={wide ? 'form-field is-wide' : 'form-field'}>
      {required ? <FieldLabel label={label} required /> : <span>{label}</span>}
      <Input aria-invalid={Boolean(error)} {...props} {...register(name)} />
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
