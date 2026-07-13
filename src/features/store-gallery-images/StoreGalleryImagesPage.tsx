import { Edit3, ImagePlus, Images, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { readFieldErrors } from '../../lib/validationErrors'
import { getModuleActionPermission } from '../../routes/adminModules'
import { navigateToHash, parseCrudFormRoute, useHashPath } from '../../routes/hashRouting'
import { adminStore, useAdminStore } from '../../store/adminStore'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { StoreGalleryImageForm } from './StoreGalleryImageForm'
import {
  createStoreGalleryImage,
  deleteStoreGalleryImage,
  getStoreGalleryImage,
  listStoreGalleryImages,
  listStoreGalleryImageStores,
  updateStoreGalleryImage,
} from './storeGalleryImageRepository'
import { toStoreGalleryImagePayload, toStoreSelectOptions } from './storeGalleryImageService'
import type { StoreGalleryImageFormValues, StoreGalleryImageListRow, StoreGalleryImageRow } from './storeGalleryImageTypes'

type StoreGalleryImageFormErrors = Partial<Record<'store_id' | 'image_path', string>>

export function StoreGalleryImagesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/store-gallery-images')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingImage, setEditingImage] = useState<StoreGalleryImageRow | null>(null)
  const [formErrors, setFormErrors] = useState<StoreGalleryImageFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { image: StoreGalleryImageRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('store-gallery-images', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('store-gallery-images', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('store-gallery-images', 'delete'))

  const images = useQuery({
    queryKey: ['admin-store-gallery-images', search, status, page, listPerPage],
    queryFn: () => listStoreGalleryImages({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-store-gallery-image-store-options'],
    queryFn: listStoreGalleryImageStores,
    retry: false,
  })

  const routeImage = useQuery({
    queryKey: ['admin-store-gallery-image', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getStoreGalleryImage(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingImage = formRoute?.mode === 'edit' ? routeImage.data ?? editingImage : editingImage
  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])

  const saveImage = useMutation({
    mutationFn: async (values: StoreGalleryImageFormValues) => {
      const payload = toStoreGalleryImagePayload(values)

      return currentEditingImage ? updateStoreGalleryImage(currentEditingImage.id, payload) : createStoreGalleryImage(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-store-gallery-images'] })
      toast.success(currentEditingImage ? 'Store gallery image updated successfully.' : 'Store gallery image created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      const errors = readFieldErrors<keyof StoreGalleryImageFormErrors>(error, ['store_id', 'image_path'])

      if (errors.store_id || errors.image_path) {
        setFormErrors(errors)
        return
      }

      toast.error('Store gallery image could not be saved.')
    },
  })

  const removeImage = useMutation({
    mutationFn: async (image: StoreGalleryImageRow) => deleteStoreGalleryImage(image.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-store-gallery-images'] })
      toast.success('Store gallery image deleted successfully.')
    },
    onError: () => {
      toast.error('Store gallery image could not be deleted. Try again.')
    },
  })

  const apiRows = images.data?.data ?? []
  const meta = images.data?.meta ?? emptyPaginationMeta(listPerPage)
  const rows: StoreGalleryImageListRow[] = apiRows.map((image, index) => ({
    ...image,
    serialNumber: serialNumber(meta, index),
  }))

  const columns = useMemo<MasterTableColumn<StoreGalleryImageListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (image) => image.serialNumber, width: '90px' },
      {
        key: 'image',
        header: 'Image',
        align: 'center',
        render: (image) => <TableImagePreview src={image.image_path} alt={`Store gallery image #${image.id}`} />,
      },
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
                label: 'Edit store gallery image',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(image),
              },
              canDelete && {
                label: 'Delete store gallery image',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete store gallery image',
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
    setFormErrors({})
    navigateToHash('/store-gallery-images/create')
  }

  function openEditForm(image: StoreGalleryImageRow) {
    dirtyFormStore.reset()
    setEditingImage(image)
    setFormErrors({})
    navigateToHash(`/store-gallery-images/edit/${image.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingImage(null)
    setFormErrors({})
    navigateToHash('/store-gallery-images')
  }

  function handleSubmit(values: StoreGalleryImageFormValues) {
    const nextErrors: StoreGalleryImageFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      image_path: values.image_path.trim() ? undefined : 'Store Gallery Image is required.',
    }

    if (nextErrors.store_id || nextErrors.image_path) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveImage.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingImage && routeImage.isLoading) {
      return <PageSkeleton label="Loading store gallery image" />
    }

    if (formRoute.mode === 'edit' && !currentEditingImage) {
      return (
        <RecordLoadError
          title="Edit Store Gallery Image"
          description="The requested store gallery image could not be loaded."
          message="Store gallery image could not be loaded. Check the record or try again."
          backLabel="Back to Store Gallery Images"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingImage ? 'Edit Store Gallery Image' : 'Add Store Gallery Image'}
          description="Manage store gallery images from the live Laravel admin API."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Store Gallery Images
            </Button>
          }
        />

        <section className="data-panel">
          <StoreGalleryImageForm
            image={currentEditingImage}
            storeOptions={storeOptions}
            formErrors={formErrors}
            optionError={stores.isError}
            isSaving={saveImage.isPending}
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
        title="Store Gallery Images"
        description="Manage store gallery images used across catalog screens."
        actions={
          canCreate ? (
            <Button variant="primary" size="compact" onClick={openCreateForm}>
              <ImagePlus aria-hidden="true" size={17} />
              Add Store Gallery Image
            </Button>
          ) : null
        }
      />

      <MasterFilterBar
        searchLabel="Search store gallery images"
        searchPlaceholder="Search store gallery images..."
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
            options: publishStatusFilterOptions('All store gallery images'),
          },
        ]}
      />

      {images.isError ? <ListLoadError message="Store gallery images could not be loaded. Try again." /> : null}

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Store Gallery Image Directory</h3>
            <p>Manage paginated store gallery image records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(image) => image.id}
          emptyState={
            <span className="master-empty-state">
              <Images aria-hidden="true" size={30} />
              No store gallery images found
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
