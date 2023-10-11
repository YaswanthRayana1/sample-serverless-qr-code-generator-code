const bcrypt = require('bcryptjs');
const dynamoDb= require("../dbClient.js");

const qrCodeHandeler = async (req, res) => {
    try {
        const url = req.body.url;
        //authentication and redirect 
        // Generate QR code
        const qrCodeDataURL = await QRCode.toDataURL(url);

        // Logic for storing in S3 and updating DynamoDB can be added here.

        // Return success response
        res.status(200).json({
            message: 'QR code generated successfully',
            data: qrCodeDataURL
        });
    } catch (error) {
        console.error(error);
        res.status(501).json({
            message:
                'Failed to generate QR code'
        });
    }
}

module.exports=qrCodeHandeler