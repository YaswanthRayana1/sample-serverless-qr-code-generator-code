//package imports
const bcrypt = require('bcryptjs');
const QRCode = require("qrcode")
const { GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { GetObjectCommand, PutObjectCommand, GetSignedUrlCommand } = require("@aws-sdk/client-s3");
const { Readable } = require('stream');
const { SendRawEmailCommand } = require('@aws-sdk/client-ses');
const { Upload } = require("@aws-sdk/lib-storage")

//file imports 
const {dynamoDb,s3Client,sesClient} = require("../awsClients.js")


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
const uploadToS3AndGetSignedUrl = async (dataBuffer, filename, email, url) => {
   // console.log('Bucket Name:', Readable.from(dataBuffer));

   const bucketParams = {
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        Body: dataBuffer,
        ContentType: 'image/png'
    };

    const uploader = new Upload({
        client: s3Client,
        params: bucketParams
    });

    try {
        await s3Client.send(new PutObjectCommand(bucketParams));
     //    await uploader.done();
    } catch (error) {
        throw error
    }


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

    return await s3Client.send(new GetSignedUrlCommand(urlParams));
};
const saveInDynamoDb = async (email,filename,url,signedUrl)=>{
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
   
   return  await ddbClient.send(new PutItemCommand(dynamoParams));

}
const verifyAndSendEmail = async (givenEmail, imagebuffer, signedUrl) => {
    const email = givenEmail;
    const imageBuffer = imagebuffer;

    // Compose the raw email with the image attachment
    const rawEmail = `From: ${process.env.FROM_EMAIL}
To: ${email}
Subject: Your Image
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="NextPart"

--NextPart
Content-Type: text/plain

Please see the attached image. You can also view it [here](${signedUrl}).

--NextPart
Content-Type: image/png; name="image.png"
Content-Disposition: attachment; filename="image.png"
Content-Transfer-Encoding: base64
Content-ID: <myimagecid>

${imageBuffer.toString('base64')}

--NextPart--`;

    const params = {
        RawMessage: {
            Data: rawEmail
        }
    };

    try {
        await sesClient.send(new SendRawEmailCommand(params));
        return { statusCode: 200, body: 'Email sent successfully', previewUrl: signedUrl };
    } catch (error) {
        console.error('Error sending email:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
}
const qrCodeHandeler = async (req, res) => {
    try {
        const url = req.body.url;
        const email = req.body.jwtContent.email.S;
       if (!url || !email){
         res.status(400).json({
            message:"Invalid Input"
         })
       }
       console.log(1);
        const existingQRUrl = await checkIfQRExists(email, url);
        if (existingQRUrl) {
            return res.status(200).json({
                message: "QR Code already present",
                url: existingQRUrl
            });
        }
        console.log(2);
        const dataBuffer = await generateQRCode(url);
        console.log(3);
        const filename = url.split("://")[1].replace("/", "_") + ".png";
        console.log(4);        
        const signedUrl = await uploadToS3AndGetSignedUrl(dataBuffer, filename, email, url);
        console.log(signedUrl)
        const savedTuple=await saveInDynamoDb (email,filename,url,signedUrl)
        console.log(5);
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