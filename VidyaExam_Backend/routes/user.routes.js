
const express = require("express");
const router = express.Router();

const { createUser, loginUser } = require("../controller/user.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rate-limiter.middleware");

// Public endpoints
router.post("/register", authLimiter, createUser);
router.post("/login", authLimiter, loginUser);


// Example protected endpoint
router.get("/profile", authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Authenticated successfully",
        user: req.user
    });
});

module.exports = router;
