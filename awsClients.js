const { SESClient } = require('@aws-sdk/client-ses');
const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

module.exports.sesClient = new SESClient({
    region: 'us-east-1'
});


module.exports.dynamoDb = new DynamoDBClient({
    region: "us-east-1",
    //   endpoint: "http://localhost:4566",
});


module.exports.s3Client = new S3Client({
    //  endpoint: "http://localhost:4566", // Pointing to LocalStack
    // region: "us-east-1",
    //  forcePathStyle: true,
    //  credentials: {
    //       accessKeyId: "test", // Anything, as it's not validated
    //      secretAccessKey: "test" // Anything, as it's not validated
    //   },
});

