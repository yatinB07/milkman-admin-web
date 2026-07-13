import { Edit3, ImagePlus, Images, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useMemo, useState } from 'react'
import {
  Button,
  ListLoadError,
  PageSkeleton,
  RecordLoadError,
  RowActionMenu,
  TableImagePreview,
  toast,
} from '../../components/common'
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
import { getModuleActionPermission } from '../../routes/adminModules'
import { navigateToHash, parseCrudFormRoute, useHashPath } from '../../routes/hashRouting'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { ProductImageForm } from './ProductImageForm'
import {
  createProductImage,
  deleteProductImage,
  getProductImage,
  listProductImageProducts,
  listProductImages,
  listProductImageStores,
  updateProductImage,
} from './productImageRepository'
import { toProductImagePayload, toProductSelectOptions, toStoreSelectOptions } from './productImageService'
import type { ProductImageFormValues, ProductImageListRow, ProductImageRow } from './productImageTypes'

type ProductImageFormErrors = Partial<Record<'store_id' | 'product_id' | 'image_path', string>>

export function ProductImagesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/product-images')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingImage, setEditingImage] = useState<ProductImageRow | null>(null)
  const [formStoreId, setFormStoreId] = useState('')
  const [formErrors, setFormErrors] = useState<ProductImageFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { image: ProductImageRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('product-images', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('product-images', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('product-images', 'delete'))

  const images = useQuery({
    queryKey: ['admin-product-images', search, status, page, listPerPage],
    queryFn: () => listProductImages({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-product-image-store-options'],
    queryFn: listProductImageStores,
    retry: false,
  })

  const products = useQuery({
    queryKey: ['admin-product-image-product-options'],
    queryFn: listProductImageProducts,
    retry: false,
  })

  const routeImage = useQuery({
    queryKey: ['admin-product-image', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getProductImage(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingImage = formRoute?.mode === 'edit' ? routeImage.data ?? editingImage : editingImage
  const selectedFormStoreId = formStoreId || (currentEditingImage ? String(currentEditingImage.store_id) : '')
  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])
  const productOptions = useMemo(
    () => toProductSelectOptions(products.data, selectedFormStoreId),
    [products.data, selectedFormStoreId],
  )

  const saveImage = useMutation({
    mutationFn: async (values: ProductImageFormValues) => {
      const payload = toProductImagePayload(values)

      return currentEditingImage ? updateProductImage(currentEditingImage.id, payload) : createProductImage(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-product-images'] })
      toast.success(currentEditingImage ? 'Product image updated successfully.' : 'Product image created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data as { errors?: Record<string, string[]> }
        setFormErrors({
          store_id: data.errors?.store_id?.[0],
          product_id: data.errors?.product_id?.[0],
          image_path: data.errors?.image_path?.[0],
        })
        return
      }

      toast.error('Product image could not be saved.')
    },
  })

  const removeImage = useMutation({
    mutationFn: async (image: ProductImageRow) => deleteProductImage(image.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-product-images'] })
      toast.success('Product image deleted successfully.')
    },
    onError: () => {
      toast.error('Product image could not be deleted. Try again.')
    },
  })

  const apiRows = images.data?.data ?? []
  const meta = images.data?.meta ?? emptyPaginationMeta(listPerPage)
  const rows: ProductImageListRow[] = apiRows.map((image, index) => ({
    ...image,
    serialNumber: serialNumber(meta, index),
  }))

  const columns = useMemo<MasterTableColumn<ProductImageListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (image) => image.serialNumber, width: '90px' },
      {
        key: 'image',
        header: 'Image',
        align: 'center',
        render: (image) => <TableImagePreview src={image.image_path} alt={`Product image #${image.id}`} />,
      },
      { key: 'product', header: 'Product', render: (image) => image.product?.title ?? `Product #${image.product_id}` },
      { key: 'store', header: 'Store', render: (image) => image.store?.title ?? `Store #${image.store_id}` },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (image) => (
          <StatusPill tone={image.is_active ? 'success' : 'danger'}>
            {image.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      { key: 'updated', header: 'Updated', render: (image) => formatDate(image.updated_at) },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (image) => (
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit product image',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(image),
              },
              canDelete && {
                label: 'Delete product image',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete product image',
                    message: `Delete image #${image.id}? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    image,
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
    setEditingImage(null)
    setFormStoreId('')
    setFormErrors({})
    navigateToHash('/product-images/create')
  }

  function openEditForm(image: ProductImageRow) {
    dirtyFormStore.reset()
    setEditingImage(image)
    setFormStoreId(String(image.store_id))
    setFormErrors({})
    navigateToHash(`/product-images/edit/${image.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingImage(null)
    setFormStoreId('')
    setFormErrors({})
    navigateToHash('/product-images')
  }

  function handleSubmit(values: ProductImageFormValues) {
    const nextErrors: ProductImageFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      product_id: values.product_id ? undefined : 'Product is required.',
      image_path: values.image_path.trim() ? undefined : 'Product Image is required.',
    }

    if (nextErrors.store_id || nextErrors.product_id || nextErrors.image_path) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveImage.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingImage && routeImage.isLoading) {
      return <PageSkeleton label="Loading product image" />
    }

    if (formRoute.mode === 'edit' && !currentEditingImage) {
      return (
        <RecordLoadError
          title="Edit Product Image"
          description="The requested product image could not be loaded."
          message="Product image could not be loaded. Check the record or try again."
          backLabel="Back to Product Images"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingImage ? 'Edit Product Image' : 'Add Product Image'}
          description="Manage product gallery images from the live Laravel admin API."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Product Images
            </Button>
          }
        />

        <section className="data-panel">
          <ProductImageForm
            image={currentEditingImage}
            storeOptions={storeOptions}
            productOptions={productOptions}
            formErrors={formErrors}
            optionError={stores.isError || products.isError}
            isSaving={saveImage.isPending}
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
        title="Product Images"
        description="Manage product gallery images used across catalog screens."
        actions={
          canCreate ? (
            <Button variant="primary" size="compact" onClick={openCreateForm}>
              <ImagePlus aria-hidden="true" size={17} />
              Add Product Image
            </Button>
          ) : null
        }
      />

      <MasterFilterBar
        searchLabel="Search product images"
        searchPlaceholder="Search product images..."
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
            options: publishStatusFilterOptions('All product images'),
          },
        ]}
      />

      {images.isError ? <ListLoadError message="Product images could not be loaded. Try again." /> : null}

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Product Image Directory</h3>
            <p>Manage paginated product image records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(image) => image.id}
          emptyState={
            <span className="master-empty-state">
              <Images aria-hidden="true" size={30} />
              No product images found
            </span>
          }
          isLoading={images.isLoading}
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
          removeImage.mutate(confirmDelete.image)
          setConfirmDelete(null)
        }}
      />
    </>
  )
}
