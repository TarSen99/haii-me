const User = require('@/models/user/User');
const {
  PaginationWrapper,
  PaginationFormatter,
} = require('@/helpers/Pagination.js');

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

const getCelebrities = async (req, res, next) => {
  const { page = DEFAULT_PAGE, perPage = DEFAULT_PER_PAGE, category = null } = req.query;

  const schema = {
    where: {
      spendMoney: true,
      signUpStep: 3,
      ...(category && ({
        category
      }))
    },
  };

  const itemsCount = await User.count(schema);

  const pagination = new PaginationWrapper()
    .setPage(page)
    .setLimit(perPage)
    .setCount(itemsCount)
    .build();  

  const rows = await User.findAll({
    ...schema,
    offset: pagination.getSkippedItemsCount(),
    limit: pagination.getPerPage(),
  });

  const edited = rows.map((celebrity) => {
    const newObj = celebrity.toJSON();

    delete newObj.password;
    delete newObj.email;
    delete newObj.signUpStep;
    delete newObj.activationToken;

    return newObj;
  });

  return res.status(200).json({
    celebrities: edited,
    pagination: new PaginationFormatter(pagination),
  });
};

module.exports = getCelebrities;
