export type ListQuery = {
  page?: number
  perPage?: number
  search?: string
  filters?: Record<string, string | number | boolean | undefined>
}

export type PaginationMeta = {
  currentPage: number
  from: number | null
  lastPage: number
  perPage: number
  to: number | null
  total: number
}

export type PaginatedResponse<Item> = {
  data: Item[]
  meta: PaginationMeta
}

type ApiPaginationMeta = {
  current_page?: number
  currentPage?: number
  from: number | null
  last_page?: number
  lastPage?: number
  per_page?: number
  perPage?: number
  to: number | null
  total: number
}

export function toApiListParams(query: ListQuery) {
  return {
    page: query.page,
    per_page: query.perPage,
    search: query.search,
    ...query.filters,
  }
}

export function normalizePaginationMeta(meta: ApiPaginationMeta): PaginationMeta {
  return {
    currentPage: meta.current_page ?? meta.currentPage ?? 1,
    from: meta.from,
    lastPage: meta.last_page ?? meta.lastPage ?? 1,
    perPage: meta.per_page ?? meta.perPage ?? 15,
    to: meta.to,
    total: meta.total,
  }
}

export function emptyPaginationMeta(perPage: number): PaginationMeta {
  return {
    currentPage: 1,
    from: 0,
    lastPage: 1,
    perPage,
    to: 0,
    total: 0,
  }
}
