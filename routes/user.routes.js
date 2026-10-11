
const express = require("express");
const router = express.Router();

const { createUser, loginUser } = require("../controller/user.controller");

const { authenticateToken } = require("../middleware/auth.middleware");

// Public endpoints
router.post("/register", createUser);
router.post("/login", loginUser);

// Example protected endpoint
router.get("/profile", authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Authenticated successfully",
        user: req.user
    });
});

module.exports = router;
