const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const dynamoDb = new DynamoDBClient({
    region: "localhost",
    endpoint: "http://localhost:8000"
});
module.exports = dynamoDb;