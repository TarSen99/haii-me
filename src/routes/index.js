const app = require('express')();
const UserRouter = require('./v1.0/UserRouter.js') 
const GeneralRouter = require('./v1.0/GeneralRouter.js') 
const RequestRouter = require('./v1.0/RequestRouter.js') 

const VERSION = '1.0'

app.use(`/api/${VERSION}/users`, UserRouter)
app.use(`/api/${VERSION}/general`, GeneralRouter)
app.use(`/api/${VERSION}/requests`, RequestRouter)

module.exports = app;
