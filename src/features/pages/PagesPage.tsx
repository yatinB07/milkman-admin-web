import { Edit3, FileText, Trash2 } from 'lucide-react'
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
import { PageForm } from './PageForm'
import { createPage, deletePage, getPage, listPages, updatePage } from './pageRepository'
import { toPagePayload } from './pageService'
import type { PageFormValues, PageListRow, PageRow } from './pageTypes'

type PageFormErrors = Partial<Record<'title' | 'description', string>>

export function PagesPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/pages')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingPage, setEditingPage] = useState<PageRow | null>(null)
  const [formErrors, setFormErrors] = useState<PageFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { page: PageRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('pages', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('pages', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('pages', 'delete'))

  const pages = useQuery({
    queryKey: ['admin-pages', search, status, page, listPerPage],
    queryFn: () => listPages({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const routePage = useQuery({
    queryKey: ['admin-page', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getPage(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingPage = formRoute?.mode === 'edit' ? routePage.data ?? editingPage : editingPage

  const savePage = useMutation({
    mutationFn: async (values: PageFormValues) => {
      const payload = toPagePayload(values)

      return currentEditingPage ? updatePage(currentEditingPage.id, payload) : createPage(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success(currentEditingPage ? 'Page updated successfully.' : 'Page created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      const errors = readFieldErrors<keyof PageFormErrors>(error, ['title', 'description'])

      if (errors.title || errors.description) {
        setFormErrors(errors)
        return
      }

      toast.error('Page could not be saved.')
    },
  })

  const removePage = useMutation({
    mutationFn: async (page: PageRow) => deletePage(page.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success('Page deleted successfully.')
    },
    onError: () => {
      toast.error('Page could not be deleted. Try again.')
    },
  })

  const meta = pages.data?.meta ?? emptyPaginationMeta(listPerPage)
  const rows: PageListRow[] = (pages.data?.data ?? []).map((item, index) => ({
    ...item,
    serialNumber: serialNumber(meta, index),
  }))

  const columns = useMemo<MasterTableColumn<PageListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (item) => item.serialNumber, width: '90px' },
      { key: 'title', header: 'Title', render: (item) => item.title },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (item) => (
          <StatusPill tone={item.is_active ? 'success' : 'danger'}>
            {item.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      { key: 'updated', header: 'Updated', render: (item) => formatDate(item.updated_at) },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (item) => (
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit page',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(item),
              },
              canDelete && {
                label: 'Delete page',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete page',
                    message: `Delete "${item.title}"? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    page: item,
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
    setEditingPage(null)
    setFormErrors({})
    navigateToHash('/pages/create')
  }

  function openEditForm(item: PageRow) {
    dirtyFormStore.reset()
    setEditingPage(item)
    setFormErrors({})
    navigateToHash(`/pages/edit/${item.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingPage(null)
    setFormErrors({})
    navigateToHash('/pages')
  }

  function handleSubmit(values: PageFormValues) {
    const nextErrors: PageFormErrors = {
      title: values.title.trim() ? undefined : 'Title is required.',
      description: values.description.trim() ? undefined : 'Description is required.',
    }

    if (nextErrors.title || nextErrors.description) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    savePage.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingPage && routePage.isLoading) {
      return <PageSkeleton label="Loading page" />
    }

    if (formRoute.mode === 'edit' && !currentEditingPage) {
      return (
        <RecordLoadError
          title="Edit Page"
          description="The requested page could not be loaded."
          message="Page could not be loaded. Check the record or try again."
          backLabel="Back to Pages"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingPage ? 'Edit Page' : 'Add Page'}
          description="Manage static app pages from the live Laravel admin API."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to Pages
            </Button>
          }
        />

        <section className="data-panel">
          <PageForm
            page={currentEditingPage}
            formErrors={formErrors}
            isSaving={savePage.isPending}
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
        title="Pages"
        description="Manage static page content for customer and store apps."
        actions={
          canCreate ? (
            <Button variant="primary" size="compact" onClick={openCreateForm}>
              <FileText aria-hidden="true" size={17} />
              Add Page
            </Button>
          ) : null
        }
      />

      <MasterFilterBar
        searchLabel="Search pages"
        searchPlaceholder="Search pages..."
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
            options: publishStatusFilterOptions('All pages'),
          },
        ]}
      />

      {pages.isError ? <ListLoadError message="Pages could not be loaded. Try again." /> : null}

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>Page Directory</h3>
            <p>Manage page records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(item) => item.id}
          emptyState={
            <span className="master-empty-state">
              <FileText aria-hidden="true" size={30} />
              No pages found
            </span>
          }
          isLoading={pages.isLoading}
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
          removePage.mutate(confirmDelete.page)
          setConfirmDelete(null)
        }}
      />
    </>
  )
}
