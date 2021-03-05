require('module-alias/register')
require('dotenv').config()
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { addCategories } = require('@/services/AddCategories.js')

sequelize.sync()
.then(() => {
  addCategories()
})

app.listen(3000, () => {
  console.log('App is running at http://localhost:3000 `');
});
