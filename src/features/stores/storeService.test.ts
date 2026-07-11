import { describe, expect, it } from 'vitest'
import { validateStoreFieldErrors } from './storeService'
import type { StoreFormValues } from './storeTypes'

const validStore: StoreFormValues = {
  title: 'Demo Milk Store',
  image_path: 'images/store/logo.png',
  cover_image_path: 'images/store/cover.png',
  rating: '4.5',
  language_code: '',
  mobile: '+919999999999',
  slogan: 'Fresh daily',
  slogan_title: 'Milk at your door',
  opens_at: '08:00',
  closes_at: '20:00',
  is_pickup_enabled: true,
  is_active: true,
  short_description: 'milk,grocery',
  content_description: 'Fresh milk and grocery delivery.',
  cancel_policy: 'Cancel before dispatch.',
  email: 'store@example.com',
  password: 'password123',
  category_reference: '1,2',
  full_address: 'Main Road',
  pincode: '395006',
  landmark: 'Near market',
  zone_id: '1',
  latitude: '21.1702',
  longitude: '72.8311',
  charge_type: '1',
  delivery_charge: '20',
  unit_kilometers: '',
  unit_price: '',
  additional_price: '',
  store_charge: '5',
  minimum_order_amount: '100',
  commission_percent: '10',
  bank_name: 'Demo Bank',
  ifsc_code: 'DEMO0001',
  receipt_name: 'Demo Store',
  account_number: '123456789',
  paypal_id: 'demo@paypal.test',
  upi_id: 'demo@upi',
}

describe('validateStoreFieldErrors', () => {
  it('returns the first invalid step with inline field errors', () => {
    const result = validateStoreFieldErrors({ ...validStore, title: '', mobile: '' }, false)

    expect(result.firstTab).toBe('basic')
    expect(result.errors.title).toBe('Store Name is required.')
    expect(result.errors.mobile).toBe('Mobile number is required.')
  })

  it('does not require password when editing an existing store', () => {
    const result = validateStoreFieldErrors({ ...validStore, password: '' }, true)

    expect(result.firstTab).toBeNull()
    expect(result.errors.password).toBeUndefined()
  })

  it('requires dynamic charge fields only for dynamic charge type', () => {
    const result = validateStoreFieldErrors(
      {
        ...validStore,
        charge_type: '2',
        delivery_charge: '',
        unit_kilometers: '',
        unit_price: '',
        additional_price: '',
      },
      false,
    )

    expect(result.firstTab).toBe('service')
    expect(result.errors.delivery_charge).toBeUndefined()
    expect(result.errors.unit_kilometers).toBe('Base Service Distance is required.')
    expect(result.errors.unit_price).toBe('Base Service Charge is required.')
    expect(result.errors.additional_price).toBe('Extra Service Charge is required.')
  })
})
