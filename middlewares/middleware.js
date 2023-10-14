const jwt = require('jsonwebtoken');
require('dotenv').config()
const validator =require("validator")

const jwtMiddleware = (req, res, next) => {
    // Extract JWT token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
     console.log("middleware")
    if (!token) {
        return res.redirect('/signup');  // Redirect to signup page if JWT not found
    }

    try {
        // Decrypt or verify JWT
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        
        // Append decrypted JWT to req.body
        req.body.jwtContent = decoded;
        console.log(req.body.jwtContent)
        
        next();  // Continue to the next middleware or route handler
    } catch (error) {
        console.error('Invalid JWT', error);
        return res.redirect('/signup');  // Redirect to signup page if JWT is invalid
    }
};

function sanitizeAndVerifyEmail(req, res, next) {
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({ error: "Email field is required" });
    }

    // Sanitize email
    const sanitizedEmail = validator.normalizeEmail(email);

    // Validate email
    if (!validator.isEmail(sanitizedEmail)) {
        return res.status(400).json({ error: "Invalid Email " });
    }

    // Replace the email in request body with sanitized email
    req.body.email = sanitizedEmail;

    next();  // Move to next middleware or route handler
}


module.exports = {jwtMiddleware, sanitizeAndVerifyEmail};