
const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.createSuperAdmin = async (req, res, next) => {
    let client;
    let transactionStarted = false;

    try {
        // 1. Protect this endpoint with a private setup secret.
        const expectedSecret = process.env.SUPER_ADMIN_SETUP_SECRET;
        const providedSecret = req.get("x-setup-secret");

        if (
            !expectedSecret ||
            !providedSecret ||
            Buffer.byteLength(expectedSecret) !==
                Buffer.byteLength(providedSecret) ||
            !crypto.timingSafeEqual(
                Buffer.from(expectedSecret),
                Buffer.from(providedSecret)
            )
        ) {
            return res.status(403).json({
                success: false,
                message: "Forbidden"
            });
        }

        // 2. Validate request data.
        const { full_name, email, password } = req.body || {};

        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !full_name.trim() ||
            !email.trim() ||
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid full_name, email and password are required. Password must be at least 8 characters and no more than 72 UTF-8 bytes."
            });
        }

        const name = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (
            name.length > 150 ||
            normalizedEmail.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid name and email"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        client = await pool.connect();
        await client.query("BEGIN");
        transactionStarted = true;

        // Prevent two simultaneous requests from creating
        // multiple initial SUPER_ADMIN accounts.
        await client.query(
            "SELECT pg_advisory_xact_lock($1, $2)",
            [72841, 1]
        );

        // 3. Allow initial setup only if no SUPER_ADMIN exists.
        const existingAdmin = await client.query(`
            SELECT 1
            FROM vidya.user_master u
            JOIN vidya.role_master r
              ON r.role_id = u.default_role_id
            WHERE UPPER(r.role_name) = 'SUPER_ADMIN'
            LIMIT 1
        `);

        if (existingAdmin.rowCount > 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message: "SUPER_ADMIN setup has already been completed"
            });
        }

        // 4. Retrieve the SUPER_ADMIN role.
        const roleResult = await client.query(`
            SELECT role_id
            FROM vidya.role_master
            WHERE UPPER(role_name) = 'SUPER_ADMIN'
              AND is_active = TRUE
            LIMIT 1
        `);

        if (roleResult.rowCount === 0) {
            const error = new Error(
                "Active SUPER_ADMIN role is not configured"
            );
            error.status = 500;
            throw error;
        }

        const roleId = roleResult.rows[0].role_id;

        // 5. Create the platform administrator.
        const userResult = await client.query(`
            INSERT INTO vidya.user_master
                (full_name, email, password_hash, default_role_id)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, full_name, email,
                      default_role_id, is_active, created_at
        `, [name, normalizedEmail, passwordHash, roleId]);

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "SUPER_ADMIN created successfully",
            data: userResult.rows[0]
        });

    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch {
                console.error("Transaction rollback failed");
            }
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "This email is already registered"
            });
        }

        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    } finally {
        if (client) client.release();
    }
};

// GET /api/super-admin/tenants
// List all tenants with their stats and active subscriptions
exports.getAllTenants = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                tm.tenant_id,
                tm.tenant_name,
                tm.tenant_code,
                tm.tenant_type,
                tm.email,
                tm.mobile_no,
                tm.is_active,
                tm.created_at,
                s.subscription_id,
                s.status AS subscription_status,
                s.starts_at AS subscription_starts_at,
                s.ends_at AS subscription_ends_at,
                p.plan_id,
                p.plan_name,
                p.billing_interval,
                p.limits,
                COUNT(DISTINCT tum.user_id) FILTER (WHERE tum.is_active = TRUE) AS active_members_count
            FROM vidya.tenant_master tm
            LEFT JOIN vidya.subscription_master s
              ON s.tenant_id = tm.tenant_id
             AND s.status = 'ACTIVE'
             AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP)
            LEFT JOIN vidya.subscription_plan_master p
              ON p.plan_id = s.plan_id
            LEFT JOIN vidya.tenant_user_mapping tum
              ON tum.tenant_id = tm.tenant_id
            GROUP BY tm.tenant_id, s.subscription_id, p.plan_id
            ORDER BY tm.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            message: "Tenants retrieved successfully",
            count: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/super-admin/users
// List platform users with pagination and filtering
exports.getAllUsers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const offset = (page - 1) * limit;

        const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM vidya.user_master`);
        const total = countResult.rows[0].total;

        const result = await pool.query(`
            SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.mobile_no,
                u.is_active,
                u.email_verified,
                u.last_login_at,
                u.created_at,
                r.role_name AS default_role
            FROM vidya.user_master u
            LEFT JOIN vidya.role_master r
              ON r.role_id = u.default_role_id
            ORDER BY u.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        return res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/super-admin/tenants/:tenantId/subscription
// Super Admin manually assigns or overrides a subscription plan for an organization
exports.assignTenantSubscription = async (req, res, next) => {
    let client;
    try {
        const { tenantId } = req.params;
        const { plan_id, duration_days } = req.body || {};

        if (!plan_id) {
            return res.status(400).json({
                success: false,
                message: "plan_id is required"
            });
        }

        client = await pool.connect();
        await client.query("BEGIN");

        // Verify tenant
        const tenantResult = await client.query(
            `SELECT tenant_id, tenant_name FROM vidya.tenant_master WHERE tenant_id = $1`,
            [tenantId]
        );
        if (tenantResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Tenant not found"
            });
        }

        // Verify plan
        const planResult = await client.query(
            `SELECT plan_id, plan_name, plan_scope FROM vidya.subscription_plan_master WHERE plan_id = $1 AND is_active = TRUE`,
            [plan_id]
        );
        if (planResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Active subscription plan not found"
            });
        }

        const plan = planResult.rows[0];
        if (plan.plan_scope !== "TENANT") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Plan must have TENANT scope"
            });
        }

        // Mark previous active subscriptions as EXPIRED
        await client.query(
            `UPDATE vidya.subscription_master
             SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
             WHERE tenant_id = $1 AND status = 'ACTIVE'`,
            [tenantId]
        );

        // Calculate ends_at if duration_days is provided
        const endsAt = duration_days && Number.isInteger(duration_days) && duration_days > 0
            ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000)
            : null;

        const subResult = await client.query(
            `INSERT INTO vidya.subscription_master
                (plan_id, tenant_id, status, starts_at, ends_at)
             VALUES ($1, $2, 'ACTIVE', CURRENT_TIMESTAMP, $3)
             RETURNING subscription_id, plan_id, tenant_id, status, starts_at, ends_at`,
            [plan.plan_id, tenantId, endsAt]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: `Subscription plan ${plan.plan_name} assigned successfully`,
            data: subResult.rows[0]
        });

    } catch (error) {
        if (client) await client.query("ROLLBACK");
        next(error);
    } finally {
        if (client) client.release();
    }
};

