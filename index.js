const express = require('express');
const serverlessHttp = require('serverless-http');
const app = express();
const router= require("./routes/router.js")
const dotenv = require('dotenv');

dotenv.config({ path: `./.env.dev` });

app.use(express.json());

app.use(router)

module.exports.handler = serverlessHttp(app);