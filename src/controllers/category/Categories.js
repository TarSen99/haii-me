const Category = require('@/models/category/Category.js');

const {
  PaginationWrapper,
  PaginationFormatter,
} = require('@/helpers/Pagination.js');

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

const getCategories = async (req, res, next) => {
  const {
    page = DEFAULT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    category = null,
  } = req.query;

  const itemsCount = await Category.count({});

  const pagination = new PaginationWrapper()
    .setPage(page)
    .setLimit(perPage)
    .setCount(itemsCount)
    .build();

  const rows = await Category.findAll({
    offset: pagination.getSkippedItemsCount(),
    limit: pagination.getPerPage(),
  });

  return res.status(200).json({
    categories: rows,
    pagination: new PaginationFormatter(pagination),
  });
};

module.exports = {
  getCategories,
};
