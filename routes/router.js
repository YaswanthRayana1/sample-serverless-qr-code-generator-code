const router = require("express").Router()
const middleware = require('../middlewares');
const controller = require("../controller")



router.get("/home", async (req, res) => {
    console.log("Hit Homepage")
    res.status(200).json({
        message: 'Home Page'
    });
})


router.post("/signup", middleware.sanitizeAndVerifyEmail, controller.signup )
router.post("/login", middleware.sanitizeAndVerifyEmail, controller.login )
router.post('/generate-qr', middleware.jwtMiddleware, controller.qrCodeHandeler);

module.exports=router