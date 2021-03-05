class Pagination {
  constructor(perPage, currentPage, count) {
    this._perPage = perPage
    this._currentPage = currentPage
    this._totalPages = Math.max(Math.ceil(count / perPage), 1)
    this.count = count
  }

  getCurrentPage() {
    return Math.min(this._currentPage, this._totalPages)
  }

  getSkippedItemsCount() {
    return Math.max(0, this.getPerPage() * (this.getCurrentPage() - 1))
  }

  getPerPage() {
    return this._perPage
  }

  getTotalPages() {
    return this._totalPages
  }
}

const MAX_LIMIT = 100
const MIN_LIMIT = 1
const MIN_PAGE_VALUE = 1

class PaginationWrapper {
  setPage(page) {
    this.page = Math.max(MIN_PAGE_VALUE, +page || 0)

    return this
  }

  setLimit(limit) {
    this.limit = Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, +limit || 0))

    return this
  }

  setCount(count) {
    this.count = count || 0

    return this
  }

  build() {
    return new Pagination(this.limit, this.page, this.count, this)
  }
}

class PaginationFormatter {
  constructor(pagination) {
    this.pagination = pagination

    return this.format()
  }

  format() {
    return {
      current_page: this.pagination.getCurrentPage(),
      per_page: this.pagination.getPerPage(),
      total_pages: this.pagination.getTotalPages(),
      count: this.pagination.count
    }
  }
}

module.exports = {
  PaginationWrapper,
  PaginationFormatter
}