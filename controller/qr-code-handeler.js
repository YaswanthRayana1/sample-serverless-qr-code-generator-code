//package imports
const bcrypt = require('bcryptjs');
const QRCode = require("qrcode")
const { GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { GetObjectCommand, PutObjectCommand, GetSignedUrlCommand } = require("@aws-sdk/client-s3");
const { Readable } = require('stream');
const { SendRawEmailCommand } = require('@aws-sdk/client-ses');
const { Upload } = require("@aws-sdk/lib-storage")
const{
    getSignedUrl,
    S3RequestPresigner,
  } = require("@aws-sdk/s3-request-presigner");


const hashsalt= bcrypt.genSaltSync(10)


//file imports 
const {dynamoDb,s3Client,sesClient} = require("../awsClients.js");
const { log } = require('console');


// generate QR code
const generateQRCode = async (url) => {
    const qrCodeDataURL = await QRCode.toDataURL(url);
    const base64Data = qrCodeDataURL.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, 'base64');
};


// check if a url already exist for thee given url by the same user if so return that email iss sent
const checkIfQRExists = async (email, url) => {
    const hashedurl= bcrypt.hashSync(url,hashsalt)
    const params = {
        TableName: "Product",
        Key: {
            "url": { S: hashedurl }
        }
    };
    try{
        const response = await dynamoDb.send(new GetItemCommand(params));
        console.log("file in db ");
        return (response.Item && response.Item.url && response.Item.url.S == hashedurl) ? response.Item.signedUrl.S : null;
    }catch(err){
       console.log(err);
       throw new Error(err);
    }
};



// upload object to an S3 bcucket 
const uploadToS3AndGetSignedUrl = async (dataBuffer, filename, email, url) => {

   
   const bucketParams = {
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        Body: dataBuffer,
        ContentType: 'image/png',
        Region: 'us-east-1'
    };

    try {
        await s3Client.send(new PutObjectCommand(bucketParams));
    } catch (error) {
        throw new Error(error)
    }
    const urlParams = {
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        Expires: 3600
    };
    const command = new GetObjectCommand({ Bucket:  process.env.S3_BUCKET, Key: filename});
     
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};



const saveInDynamoDb = async (email,url,signedUrl)=>{
    const hashedurl= bcrypt.hashSync(url,hashsalt); 
    const dynamoParams = {
        TableName: "Product",
        Item: {
            "email": { S: email },
            "url": { S: hashedurl },
            "signedUrl": { S: signedUrl }
        }
    };
   
   return  await dynamoDb.send(new PutItemCommand(dynamoParams));

}




const verifyAndSendEmail = async (givenEmail, imagebuffer, signedUrl) => {
    const email = givenEmail;
    const imageBuffer = imagebuffer;
   // console.log(email,imagebuffer,signedUrl,process.env.FROM_EMAIL);
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
    console.log(rawEmail);
    const params = {
        RawMessage: {
            Data: rawEmail
        }
    };

    try {
        console.log(params);
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
        const existingQRUrl = await checkIfQRExists(email, url);
        if (existingQRUrl) {
            return res.status(200).json({
                message: "QR Code already present",
                url: existingQRUrl
            });
        }
        const dataBuffer = await generateQRCode(url);
        const filename = url.split("://")[1].replace("/", "_") + ".png";      
        const signedUrl = await uploadToS3AndGetSignedUrl(dataBuffer, filename, email, url);
        if(signedUrl){
          await saveInDynamoDb(email,url,signedUrl);
          console.log("signed url- "+signedUrl)
          let emailSentStatus=await verifyAndSendEmail(email,dataBuffer,signedUrl)
          console.log(emailSentStatus);
        }
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


module.exports = qrCodeHandeler