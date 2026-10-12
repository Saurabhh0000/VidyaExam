
const express = require("express");
const router = express.Router();

const {
    createSuperAdmin,
    getAllTenants,
    getAllUsers,
    assignTenantSubscription
} = require("../controller/super-admin.controller");
const { authenticateToken, authorizeRoles } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rate-limiter.middleware");

// Initial Setup Endpoint
router.post("/createSuperAdmin", authLimiter, createSuperAdmin);

// Super Admin Management Endpoints
router.get("/tenants", authenticateToken, authorizeRoles("SUPER_ADMIN"), getAllTenants);
router.get("/users", authenticateToken, authorizeRoles("SUPER_ADMIN"), getAllUsers);
router.post("/tenants/:tenantId/subscription", authenticateToken, authorizeRoles("SUPER_ADMIN"), assignTenantSubscription);

module.exports = router;

