import { BadgePercent, Edit3, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Button, ListLoadError, PageSkeleton, RecordLoadError, RowActionMenu, toast } from '../../components/common'
import { ConfirmDialog, type ConfirmDialogOptions } from '../../components/common/ConfirmDialog'
import { StatusPill } from '../../components/StatusPill'
import {
  MasterDataTable,
  MasterFilterBar,
  MasterPageHeader,
  MasterPagination,
  type MasterTableColumn,
} from '../../components/master'
import { emptyPaginationMeta } from '../../lib/apiTypes'
import { publishStatusFilterOptions } from '../../lib/filterOptions'
import { formatDate, serialNumber } from '../../lib/formatters'
import { readFieldErrors } from '../../lib/validationErrors'
import { getModuleActionPermission } from '../../routes/adminModules'
import { navigateToHash, parseCrudFormRoute, useHashPath } from '../../routes/hashRouting'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { CouponForm } from './CouponForm'
import {
  createCoupon,
  deleteCoupon,
  getCoupon,
  listCoupons,
  listCouponStores,
  updateCoupon,
} from './couponRepository'
import { toCouponPayload, toStoreSelectOptions } from './couponService'
import type { CouponFormValues, CouponListRow, CouponRow } from './couponTypes'

type CouponFormErrors = Partial<
  Record<'store_id' | 'title' | 'code' | 'minimum_amount' | 'value' | 'expires_at', string>
>

export function CouponsPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/coupons')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingCoupon, setEditingCoupon] = useState<CouponRow | null>(null)
  const [formErrors, setFormErrors] = useState<CouponFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { coupon: CouponRow }) | null>(
    null,
  )
  const canCreate = adminStore.can(getModuleActionPermission('coupons', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('coupons', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('coupons', 'delete'))

  const coupons = useQuery({
    queryKey: ['admin-coupons', search, status, page, listPerPage],
    queryFn: () => listCoupons({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-coupon-option-store-options'],
    queryFn: listCouponStores,
    retry: false,
  })

  const routeOption = useQuery({
    queryKey: ['admin-coupon-option', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getCoupon(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingCoupon = formRoute?.mode === 'edit' ? routeOption.data ?? editingCoupon : editingCoupon
  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])

  const saveOption = useMutation({
    mutationFn: async (values: CouponFormValues) => {
      const payload = toCouponPayload(values)

      return currentEditingCoupon ? updateCoupon(currentEditingCoupon.id, payload) : createCoupon(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success(currentEditingCoupon ? 'Coupon updated successfully.' : 'Coupon created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      const errors = readFieldErrors<keyof CouponFormErrors>(error, [
        'store_id',
        'title',
        'code',
        'minimum_amount',
        'value',
        'expires_at',
      ])

      if (errors.store_id || errors.title || errors.code || errors.minimum_amount || errors.value || errors.expires_at) {
        setFormErrors(errors)
        return
      }

      toast.error('Coupon could not be saved.')
    },
  })

  const removeOption = useMutation({
    mutationFn: async (option: CouponRow) => deleteCoupon(option.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Coupon deleted successfully.')
    },
    onError: () => {
      toast.error('Coupon could not be deleted. Try again.')
    },
  })

  const apiRows = coupons.data?.data ?? []
  const meta = coupons.data?.meta ?? emptyPaginationMeta(listPerPage)
  const rows: CouponListRow[] = apiRows.map((coupon, index) => ({
    ...coupon,
    serialNumber: serialNumber(meta, index),
  }))

  const columns = useMemo<MasterTableColumn<CouponListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (coupon) => coupon.serialNumber, width: '90px' },
      { key: 'title', header: 'Title', render: (coupon) => coupon.title },
      { key: 'code', header: 'Code', render: (coupon) => coupon.code },
      { key: 'store', header: 'Store', render: (coupon) => coupon.store?.title ?? `Store #${coupon.store_id}` },
      {
        key: 'value',
        header: 'Value',
        align: 'center',
        render: (coupon) => coupon.value,
      },
      {
        key: 'expires_at',
        header: 'Expires',
        render: (coupon) => coupon.expires_at ?? 'No expiry',
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (coupon) => (
          <StatusPill tone={coupon.is_active ? 'success' : 'danger'}>
            {coupon.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      { key: 'updated', header: 'Updated', render: (coupon) => formatDate(coupon.updated_at) },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (coupon) => (
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit coupon',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(coupon),
              },
              canDelete && {
                label: 'Delete coupon',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete coupon',
                    message: `Delete "${coupon.title}"? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    coupon,
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
    setEditingCoupon(null)
    setFormErrors({})
    navigateToHash('/coupons/create')
  }

  function openEditForm(coupon: CouponRow) {
    dirtyFormStore.reset()
    setEditingCoupon(coupon)
    setFormErrors({})
    navigateToHash(`/coupons/edit/${coupon.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingCoupon(null)
    setFormErrors({})
    navigateToHash('/coupons')
  }

  function handleSubmit(values: CouponFormValues) {
    const minimumAmount = Number(values.minimum_amount)
    const couponValue = Number(values.value)
    const nextErrors: CouponFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      title: values.title.trim() ? undefined : 'Title is required.',
      code: values.code.trim() ? undefined : 'Code is required.',
      minimum_amount:
        values.minimum_amount.trim() && Number.isFinite(minimumAmount) && minimumAmount >= 0
          ? undefined
          : 'Minimum amount must be 0 or greater.',
      value:
        values.value.trim() && Number.isFinite(couponValue) && couponValue >= 0
          ? undefined
          : 'Coupon value must be 0 or greater.',
    }

    if (nextErrors.store_id || nextErrors.title || nextErrors.code || nextErrors.minimum_amount || nextErrors.value) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveOption.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingCoupon && routeOption.isLoading) {
      return <PageSkeleton label="Loading coupon" />
    }

    if (formRoute.mode === 'edit' && !currentEditingCoupon) {
      return (
        <RecordLoadError
          title="Edit Coupon"
          description="The requested coupon could not be loaded."
          message="Coupon could not be loaded. Check the record or try again."
          backLabel="Back to Coupons"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingCoupon ? 'Edit Coupon' : 'Add Coupon'}
          description="Manage store coupons from the live Laravel admin API."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Coupons
            </Button>
          }
        />

        <section className="data-panel">
          <CouponForm
            coupon={currentEditingCoupon}
            storeOptions={storeOptions}
            formErrors={formErrors}
            optionError={stores.isError}
            isSaving={saveOption.isPending}
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
        title="Coupons"
        description="Manage store coupon offers used during checkout."
        actions={
          canCreate ? (
            <Button variant="primary" size="compact" onClick={openCreateForm}>
              <BadgePercent aria-hidden="true" size={17} />
              Add Coupon
            </Button>
          ) : null
        }
      />

      <MasterFilterBar
        searchLabel="Search coupons"
        searchPlaceholder="Search coupons or stores..."
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
            options: publishStatusFilterOptions('All coupons'),
          },
        ]}
      />

      {coupons.isError ? <ListLoadError message="Coupons could not be loaded. Try again." /> : null}

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Coupon Directory</h3>
            <p>Manage coupon records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(option) => option.id}
          emptyState={
            <span className="master-empty-state">
              <BadgePercent aria-hidden="true" size={30} />
              No coupons found
            </span>
          }
          isLoading={coupons.isLoading}
        />

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
          if (!confirmDelete) return
          removeOption.mutate(confirmDelete.coupon)
          setConfirmDelete(null)
        }}
      />
    </>
  )
}
