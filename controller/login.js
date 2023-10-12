const bcrypt = require('bcryptjs');
const {dynamoDb} = require("../awsClients.js");
const { QueryCommand } = require("@aws-sdk/client-dynamodb");
const jwt = require("jsonwebtoken")

const loginhandeler = async (req, res) => {

    const { email, password } = req.body;
    if (!email || !password){
        res.status(404).json({message:"credential errors"})
    }
    const params = {
        TableName: "User",
        KeyConditionExpression: "email = :emailValue",
        ExpressionAttributeValues: {
            ":emailValue": { S: email }
        }
    };

    try {
        const command = new QueryCommand(params);
        const result = await dynamoDb.send(command);
        console.log("checkpoint start ")
        console.log(result,result.Items[0].email, password)
        console.log("checkpoint end ")
        // Check if user exists
        if (result.Items && result.Items.length === 1) {
            const user = result.Items[0];
            console.log(user)
            // Compare the password with the hashed password in the database
            const isMatch = bcrypt.compare(password, user.password.S);
            if (isMatch) {
                // If passwords match, generate a JWT
                const token = jwt.sign({ email: user.email }, process.env.SECRET_KEY, {
                    expiresIn: '1h'
                });
                return res.status(200).json({ success: true, token });
            }
        }

        // If any step fails, return a failed login
        return res.status(400).json({ success: false, message: "Failed login" });
    } catch (error) {
        res.json({ message: error });
        console.log(error)
    }
}

module.exports = loginhandeler