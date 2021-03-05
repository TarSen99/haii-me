const Category = require('@/models/category/Category.js');

const CATEGORIES = [
  'Bloggers',
  'Actors',
  'Athlets',
  'Musicians',
  'Comedians',
  'Models',
];

const addCategories = () => {
  Category.findAll().then((res) => {
    if (res.length) {
      return;
    }

    const currCategories = CATEGORIES.map((item) => {
      return {
        name: item,
      };
    });

    return Category.bulkCreate(currCategories);
  });
};

module.exports = { addCategories };
