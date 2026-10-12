
const express = require("express");
const router = express.Router();

const { registerTenant } = require("../controller/tenant.controller");

const { createTenantUser } = require("../controller/tenant.controller");

const { authenticateToken } = require("../middleware/auth.middleware");

const { requireTenantRole } = require("../middleware/tenant.middleware");


router.post("/registerTenant", registerTenant);

// Tenant ADMIN creates a teacher or student
router.post( "/:tenantId/createTenantUser", authenticateToken, requireTenantRole("ADMIN"), createTenantUser);


module.exports = router;
