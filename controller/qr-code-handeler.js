const bcrypt = require('bcryptjs');
const dynamoDb = require("../dbClient.js");
const { GetItemCommand , PutItemCommand} = require("@aws-sdk/client-dynamodb");
const QRCode = require("qrcode")
const { GetObjectCommand, PutObjectCommand, GetSignedUrlCommand } = require("@aws-sdk/client-s3");
const { Readable } = require('stream');
const s3Client = require("../s3Client.js")


// generate QR code
const generateQRCode = async (url) => {
    const qrCodeDataURL = await QRCode.toDataURL(url);
    const base64Data = qrCodeDataURL.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, 'base64');
};
// check if a url already exist for thee given url by the same user if so return that email iss sent
const checkIfQRExists = async (email, url) => {
    const params = {
        TableName: "Product",
        Key: {
            "email": { S: email }
        }
    };

    const response = await dynamoDb.send(new GetItemCommand(params));
    return (response.Item && response.Item.url && response.Item.url.S === url) ? response.Item.Itemurl.S : null;
};
// upload object to an S3 bcucket 
const uploadToS3AndGetSignedUrl = async (dataBuffer, filename) => {
    const bucketParams = {
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        Body: Readable.from(dataBuffer),
        ContentType: 'image/png'
    };

    await s3Client.send(new PutObjectCommand(bucketParams));

    const urlParams = {
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        Expires: 3600
    };

    const dynamoParams = {
        TableName: "Product",
        Item: {
            "email": { S: email },  
            "url": { S: url }, 
            "signedUrl": { S: signedUrl }
        }
    };

    await ddbClient.send(new PutItemCommand(dynamoParams));

    return await s3Client.send(new GetSignedUrlCommand(urlParams));
};

const qrCodeHandeler = async (req, res) => {
    try {
        const url = req.body.url;
        const email = req.body.jwtContent;

        const existingQRUrl = await checkIfQRExists(email, url);
        if (existingQRUrl) {
            return res.status(200).json({
                message: "QR Code already present",
                url: existingQRUrl
            });
        }

        const dataBuffer = await generateQRCode(url);
        const filename = url.split("://")[1].replace("/", "_") + ".png";
        const signedUrl = await uploadToS3AndGetSignedUrl(dataBuffer, filename);

        res.status(200).json({
            message: 'QR code generated and uploaded successfully',
            signedUrl: signedUrl
        });
    } catch (error) {
        console.error("Error in qrCodeHandeler", error);
        res.status(501).json({
            message: 'Failed to generate QR code and store in S3.'
        });
    }
};
// see if something can be done of the ttl in dynamodb for 
// the signed url as it expires after sometime resulting in stale data 

module.exports = qrCodeHandeler