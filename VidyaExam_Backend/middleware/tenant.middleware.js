
const { pool } = require("../config/db");

exports.requireTenantRole = (...allowedRoles) => {
    const roles = allowedRoles.map(role => role.toUpperCase());

    return async (req, res, next) => {
        try {
            const { tenantId } = req.params;
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            // Validate tenant UUID before querying PostgreSQL.
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            if (!tenantId || !uuidRegex.test(tenantId)) {
                return res.status(400).json({
                    success: false,
                    message: "A valid tenant ID is required"
                });
            }

            if (roles.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: "Tenant permissions are not configured"
                });
            }

            // Platform SUPER_ADMIN has full access to all tenant endpoints
            if (req.user?.role === "SUPER_ADMIN") {
                const tenantCheck = await pool.query(
                    `SELECT tenant_id, tenant_name, is_active
                     FROM vidya.tenant_master
                     WHERE tenant_id = $1
                     LIMIT 1`,
                    [tenantId]
                );

                if (tenantCheck.rowCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Organization not found"
                    });
                }

                req.tenantMembership = {
                    tenant_id: tenantCheck.rows[0].tenant_id,
                    tenant_name: tenantCheck.rows[0].tenant_name,
                    user_id: userId,
                    role_name: "SUPER_ADMIN",
                    is_super_admin: true
                };

                return next();
            }

            const result = await pool.query(

                `SELECT
                    tum.tenant_id,
                    tum.user_id,
                    tum.role_id,
                    rm.role_name,
                    tm.tenant_name
                 FROM vidya.tenant_user_mapping tum
                 JOIN vidya.tenant_master tm
                   ON tm.tenant_id = tum.tenant_id
                 JOIN vidya.role_master rm
                   ON rm.role_id = tum.role_id
                 JOIN vidya.user_master um
                   ON um.user_id = tum.user_id
                 WHERE tum.tenant_id = $1
                   AND tum.user_id = $2
                   AND tum.is_active = TRUE
                   AND tm.is_active = TRUE
                   AND rm.is_active = TRUE
                   AND um.is_active = TRUE
                   AND UPPER(rm.role_name) = ANY($3::text[])
                 LIMIT 1`,
                [tenantId, userId, roles]
            );

            if (result.rowCount === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to access this organization"
                });
            }

            // Store verified membership for the controller.
            req.tenantMembership = result.rows[0];

            next();

        } catch (error) {
            next(error);
        }
    };
};
