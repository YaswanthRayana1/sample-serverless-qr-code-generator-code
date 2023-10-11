const express = require('express');
const serverlessHttp = require('serverless-http');
const app = express();
const router= require("./routes/router.js")

app.use(express.json());

app.use(router)

module.exports.handler = serverlessHttp(app);