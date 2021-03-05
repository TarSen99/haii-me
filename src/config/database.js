const Sequelize = require('sequelize')
const config = require('config')

const DB_CONFIG = config.get('database')

const sequelize = new Sequelize(DB_CONFIG.database, DB_CONFIG.username, DB_CONFIG.password, {
  dialect: DB_CONFIG.dialect,
  storage: DB_CONFIG.storage,
  logging: DB_CONFIG.logging
})

module.exports = sequelize;