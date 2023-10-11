const bcrypt = require('bcryptjs');
const dynamoDb= require("../dbClient.js");
const { QueryCommand } = require("@aws-sdk/client-dynamodb");

const loginhandeler= async (req, res)=>{
    
    const { email, password } = req.body;
    
    const params = {
        TableName: "USER",
        KeyConditionExpression: 'email = :emailValue',
        ExpressionAttributeValues: {
            ':emailValue': email
        }
    };

    try {
        const command = new QueryCommand(params);
        const result = await dynamoDbClient.send(command);

        // Check if user exists
        if (result.Items && result.Items.length === 1) {
            const user = result.Items[0];

            // Compare the password with the hashed password in the database
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                // If passwords match, generate a JWT
                const token = jwt.sign({ email: user.email }, JWT_SECRET, {
                    expiresIn: '1h'
                });
                return res.status(200).json({ success: true, token });
            }
        }
        
        // If any step fails, return a failed login
        return res.status(400).json({ success: false, message: "Failed login" });
    }catch (error) {
        res.json({message: error});
        throw new Error('Error during login');
    }
    }

module.exports= loginhandeler