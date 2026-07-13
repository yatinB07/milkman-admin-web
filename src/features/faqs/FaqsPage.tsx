import { Edit3, HelpCircle, Trash2 } from 'lucide-react'
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
import { FaqForm } from './FaqForm'
import { createFaq, deleteFaq, getFaq, listFaqs, listFaqStores, updateFaq } from './faqRepository'
import { toFaqPayload, toStoreSelectOptions } from './faqService'
import type { FaqFormValues, FaqListRow, FaqRow } from './faqTypes'

type FaqFormErrors = Partial<Record<'store_id' | 'question' | 'answer', string>>

export function FaqsPage() {
  const { listPerPage } = useAdminStore()
  const queryClient = useQueryClient()
  const activePath = useHashPath()
  const formRoute = parseCrudFormRoute(activePath, '/faqs')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editingFaq, setEditingFaq] = useState<FaqRow | null>(null)
  const [formErrors, setFormErrors] = useState<FaqFormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState<(ConfirmDialogOptions & { faq: FaqRow }) | null>(null)
  const canCreate = adminStore.can(getModuleActionPermission('faqs', 'create'))
  const canUpdate = adminStore.can(getModuleActionPermission('faqs', 'update'))
  const canDelete = adminStore.can(getModuleActionPermission('faqs', 'delete'))

  const faqs = useQuery({
    queryKey: ['admin-faqs', search, status, page, listPerPage],
    queryFn: () => listFaqs({ page, perPage: listPerPage, search, status }),
    retry: false,
  })

  const stores = useQuery({
    queryKey: ['admin-faq-store-options'],
    queryFn: listFaqStores,
    retry: false,
  })

  const routeFaq = useQuery({
    queryKey: ['admin-faq', formRoute?.mode === 'edit' ? formRoute.id : null],
    queryFn: () => getFaq(formRoute?.mode === 'edit' ? formRoute.id : 0),
    enabled: formRoute?.mode === 'edit',
    retry: false,
  })

  const currentEditingFaq = formRoute?.mode === 'edit' ? routeFaq.data ?? editingFaq : editingFaq
  const storeOptions = useMemo(() => toStoreSelectOptions(stores.data), [stores.data])

  const saveFaq = useMutation({
    mutationFn: async (values: FaqFormValues) => {
      const payload = toFaqPayload(values)

      return currentEditingFaq ? updateFaq(currentEditingFaq.id, payload) : createFaq(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-faqs'] })
      toast.success(currentEditingFaq ? 'FAQ updated successfully.' : 'FAQ created successfully.')
      closeForm(true)
    },
    onError: (error) => {
      const errors = readFieldErrors<keyof FaqFormErrors>(error, ['store_id', 'question', 'answer'])

      if (errors.store_id || errors.question || errors.answer) {
        setFormErrors(errors)
        return
      }

      toast.error('FAQ could not be saved.')
    },
  })

  const removeFaq = useMutation({
    mutationFn: async (faq: FaqRow) => deleteFaq(faq.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-faqs'] })
      toast.success('FAQ deleted successfully.')
    },
    onError: () => {
      toast.error('FAQ could not be deleted. Try again.')
    },
  })

  const meta = faqs.data?.meta ?? emptyPaginationMeta(listPerPage)
  const rows: FaqListRow[] = (faqs.data?.data ?? []).map((faq, index) => ({
    ...faq,
    serialNumber: serialNumber(meta, index),
  }))

  const columns = useMemo<MasterTableColumn<FaqListRow>[]>(
    () => [
      { key: 'serial', header: 'Sr No.', render: (faq) => faq.serialNumber, width: '90px' },
      { key: 'question', header: 'Question', render: (faq) => faq.question },
      { key: 'store', header: 'Store', render: (faq) => faq.store?.title ?? `Store #${faq.store_id}` },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (faq) => (
          <StatusPill tone={faq.is_active ? 'success' : 'danger'}>
            {faq.is_active ? 'Publish' : 'Unpublish'}
          </StatusPill>
        ),
      },
      { key: 'updated', header: 'Updated', render: (faq) => formatDate(faq.updated_at) },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (faq) => (
          <RowActionMenu
            actions={[
              canUpdate && {
                label: 'Edit FAQ',
                icon: <Edit3 aria-hidden="true" size={16} />,
                onSelect: () => openEditForm(faq),
              },
              canDelete && {
                label: 'Delete FAQ',
                icon: <Trash2 aria-hidden="true" size={16} />,
                tone: 'danger',
                onSelect: () => {
                  setConfirmDelete({
                    title: 'Delete FAQ',
                    message: `Delete "${faq.question}"? This can be restored only from the backend.`,
                    confirmLabel: 'Delete',
                    faq,
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
    setEditingFaq(null)
    setFormErrors({})
    navigateToHash('/faqs/create')
  }

  function openEditForm(faq: FaqRow) {
    dirtyFormStore.reset()
    setEditingFaq(faq)
    setFormErrors({})
    navigateToHash(`/faqs/edit/${faq.id}`)
  }

  function closeForm(force = false) {
    if (force !== true && !dirtyFormStore.confirmDiscard()) return

    dirtyFormStore.reset()
    setEditingFaq(null)
    setFormErrors({})
    navigateToHash('/faqs')
  }

  function handleSubmit(values: FaqFormValues) {
    const nextErrors: FaqFormErrors = {
      store_id: values.store_id ? undefined : 'Store is required.',
      question: values.question.trim() ? undefined : 'Question is required.',
      answer: values.answer.trim() ? undefined : 'Answer is required.',
    }

    if (nextErrors.store_id || nextErrors.question || nextErrors.answer) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    saveFaq.mutate(values)
  }

  if (formRoute) {
    if (formRoute.mode === 'edit' && !currentEditingFaq && routeFaq.isLoading) {
      return <PageSkeleton label="Loading FAQ" />
    }

    if (formRoute.mode === 'edit' && !currentEditingFaq) {
      return (
        <RecordLoadError
          title="Edit FAQ"
          description="The requested FAQ could not be loaded."
          message="FAQ could not be loaded. Check the record or try again."
          backLabel="Back to FAQs"
          onBack={() => closeForm(true)}
        />
      )
    }

    return (
      <>
        <MasterPageHeader
          title={currentEditingFaq ? 'Edit FAQ' : 'Add FAQ'}
          description="Manage store FAQs from the live Laravel admin API."
          actions={
            <Button variant="secondary" size="compact" onClick={() => closeForm()}>
              Back to FAQs
            </Button>
          }
        />

        <section className="data-panel">
          <FaqForm
            faq={currentEditingFaq}
            storeOptions={storeOptions}
            formErrors={formErrors}
            optionError={stores.isError}
            isSaving={saveFaq.isPending}
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
        title="FAQs"
        description="Manage store FAQ content used by customer help screens."
        actions={
          canCreate ? (
            <Button variant="primary" size="compact" onClick={openCreateForm}>
              <HelpCircle aria-hidden="true" size={17} />
              Add FAQ
            </Button>
          ) : null
        }
      />

      <MasterFilterBar
        searchLabel="Search FAQs"
        searchPlaceholder="Search FAQs or stores..."
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
            options: publishStatusFilterOptions('All FAQs'),
          },
        ]}
      />

      {faqs.isError ? <ListLoadError message="FAQs could not be loaded. Try again." /> : null}

      <section className="data-panel">
        <div className="data-panel-header">
          <div>
            <h3>FAQ Directory</h3>
            <p>Manage FAQ records from the backend API.</p>
          </div>
        </div>

        <MasterDataTable
          columns={columns}
          rows={rows}
          getRowKey={(faq) => faq.id}
          emptyState={
            <span className="master-empty-state">
              <HelpCircle aria-hidden="true" size={30} />
              No FAQs found
            </span>
          }
          isLoading={faqs.isLoading}
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
          removeFaq.mutate(confirmDelete.faq)
          setConfirmDelete(null)
        }}
      />
    </>
  )
}
