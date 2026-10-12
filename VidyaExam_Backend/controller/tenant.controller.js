
const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

exports.registerTenant = async (req, res, next) => {
    let client;
    let transactionStarted = false;

    try {
        const {
            tenant_name,
            tenant_code,
            tenant_type,
            tenant_email,
            tenant_mobile,
            address,
            admin_full_name,
            admin_email,
            admin_mobile,
            admin_password
        } = req.body || {};

        // 1. Validate required fields
        if (
            typeof tenant_name !== "string" ||
            typeof tenant_code !== "string" ||
            typeof tenant_type !== "string" ||
            typeof admin_full_name !== "string" ||
            typeof admin_email !== "string" ||
            typeof admin_password !== "string" ||
            !tenant_name.trim() ||
            !tenant_code.trim() ||
            !admin_full_name.trim() ||
            !admin_email.trim() ||
            !admin_password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Organization name, code, type and administrator name, email and password are required"
            });
        }

        const organizationName = tenant_name.trim();
        const tenantCode = tenant_code.trim().toUpperCase();
        const adminName = admin_full_name.trim();
        const adminEmail = admin_email.trim().toLowerCase();

        const organizationEmail =
            typeof tenant_email === "string" && tenant_email.trim()
                ? tenant_email.trim().toLowerCase()
                : null;

        const organizationMobile =
            typeof tenant_mobile === "string" && tenant_mobile.trim()
                ? tenant_mobile.trim()
                : null;

        const adminMobile =
            typeof admin_mobile === "string" && admin_mobile.trim()
                ? admin_mobile.trim()
                : null;

        const organizationAddress =
            typeof address === "string" && address.trim()
                ? address.trim()
                : null;

        // 2. Validate tenant type
        const allowedTypes = [
            "COACHING_INSTITUTE",    // Govt exam academies, IT bootcamps, test-prep centers
            "EDUCATIONAL_INSTITUTE", // Schools, Colleges, Universities
            "CORPORATE",             // Companies / Tech firms assessing candidates
            "SCHOOL",
            "COLLEGE",
            "OTHER"
        ];


        if (!allowedTypes.includes(tenant_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid tenant type"
            });
        }

        // 3. Validate lengths and formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            organizationName.length > 200 ||
            tenantCode.length > 50 ||
            !/^[A-Z0-9_-]+$/.test(tenantCode) ||
            adminName.length > 150 ||
            adminEmail.length > 255 ||
            !emailRegex.test(adminEmail) ||
            admin_password.length < 8 ||
            Buffer.byteLength(admin_password, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide valid organization and administrator details. Password must be at least 8 characters and no more than 72 UTF-8 bytes."
            });
        }

        if (
            (organizationEmail && organizationEmail.length > 255) ||
            (organizationMobile && organizationMobile.length > 15) ||
            (adminMobile && adminMobile.length > 15)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email or mobile number exceeds the allowed length"
            });
        }

        // Hash the password before storing it
        const passwordHash = await bcrypt.hash(admin_password, 12);

        // 4. Acquire a PostgreSQL client and start transaction
        client = await pool.connect();

        await client.query("BEGIN");
        transactionStarted = true;

        // 5. Retrieve the shared ADMIN role UUID
        const roleResult = await client.query(
            `SELECT role_id
             FROM vidya.role_master
             WHERE UPPER(role_name) = 'ADMIN'
               AND is_active = TRUE
             LIMIT 1`
        );

        if (roleResult.rows.length === 0) {
            const error = new Error(
                "An active ADMIN role is not configured"
            );
            error.status = 500;
            throw error;
        }

        const adminRoleId = roleResult.rows[0].role_id;

        // 6. Create the organization
        const tenantResult = await client.query(
            `INSERT INTO vidya.tenant_master
                (
                    tenant_name,
                    tenant_code,
                    tenant_type,
                    email,
                    mobile_no,
                    address
                )
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING
                tenant_id,
                tenant_name,
                tenant_code,
                tenant_type,
                email,
                mobile_no,
                created_at`,
            [
                organizationName,
                tenantCode,
                tenant_type,
                organizationEmail,
                organizationMobile,
                organizationAddress
            ]
        );

        const tenant = tenantResult.rows[0];

        // 7. Create administrator with the shared ADMIN role UUID
        const userResult = await client.query(
            `INSERT INTO vidya.user_master
                (
                    full_name,
                    email,
                    mobile_no,
                    password_hash,
                    default_role_id
                )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING
                user_id,
                full_name,
                email,
                mobile_no,
                default_role_id,
                is_active,
                created_at`,
            [
                adminName,
                adminEmail,
                adminMobile,
                passwordHash,
                adminRoleId
            ]
        );

        const admin = userResult.rows[0];

        // 8. Link administrator to the organization
        // Use the SAME ADMIN UUID from role_master.
        await client.query(
            `INSERT INTO vidya.tenant_user_mapping
                (
                    tenant_id,
                    user_id,
                    role_id
                )
             VALUES ($1, $2, $3)`,
            [
                tenant.tenant_id,
                admin.user_id,
                adminRoleId
            ]
        );

        // 9. Assign the tenant's FREE subscription
        const freePlanResult = await client.query(
            `SELECT plan_id
             FROM vidya.subscription_plan_master
             WHERE plan_name = 'FREE'
               AND plan_scope = 'TENANT'
               AND billing_interval = 'FREE'
               AND is_active = TRUE
             LIMIT 1`
        );

        if (freePlanResult.rows.length === 0) {
            const error = new Error(
                "An active FREE tenant subscription plan is not configured"
            );
            error.status = 500;
            throw error;
        }

        const freePlanId = freePlanResult.rows[0].plan_id;

        await client.query(
            `INSERT INTO vidya.subscription_master
                (
                    plan_id,
                    tenant_id,
                    status,
                    starts_at
                )
             VALUES ($1, $2, 'ACTIVE', CURRENT_TIMESTAMP)`,
            [
                freePlanId,
                tenant.tenant_id
            ]
        );

        // 10. Commit all changes together
        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Organization registered successfully",
            data: {
                tenant,
                administrator: {
                    ...admin,
                    // Never return the password or password hash.
                    default_role_id: admin.default_role_id
                },
                role: "ADMIN",
                subscription: {
                    plan_name: "FREE",
                    plan_scope: "TENANT",
                    status: "ACTIVE"
                }
            }
        });

    } catch (error) {
        // Roll back organization, user, mapping and subscription together
        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Transaction rollback failed:",
                    rollbackError.message
                );
            }
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message:
                    "Organization code, administrator email, or mobile number is already registered"
            });
        }

        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        console.error("Tenant registration error:", error.message);
        return next(error);

    } finally {
        // Release the client even when an error occurs
        if (client) {
            client.release();
        }
    }
};


exports.createTenantUser = async (req, res, next) => {
    let client;
    let transactionStarted = false;

    try {
        const { tenantId } = req.params;

        const {
            full_name,
            email,
            mobile_no,
            password,
            role_name
        } = req.body || {};

        // 1. Validate role
        if (
            typeof role_name !== "string" ||
            !["TEACHER", "STUDENT"].includes(
                role_name.trim().toUpperCase()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "role_name must be TEACHER or STUDENT"
            });
        }

        const roleName = role_name.trim().toUpperCase();

        // 2. Validate required fields
        if (
            typeof full_name !== "string" ||
            !full_name.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "full_name and email are required"
            });
        }

        const name = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        const mobile =
            typeof mobile_no === "string" && mobile_no.trim()
                ? mobile_no.trim()
                : null;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            name.length > 150 ||
            normalizedEmail.length > 255 ||
            !emailRegex.test(normalizedEmail) ||
            (mobile && mobile.length > 15)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid user details"
            });
        }

        // 3. Validate tenant UUID
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!tenantId || !uuidRegex.test(tenantId)) {
            return res.status(400).json({
                success: false,
                message: "A valid tenant ID is required"
            });
        }

        // 4. Start transaction
        client = await pool.connect();

        await client.query("BEGIN");
        transactionStarted = true;

        // Lock this tenant row to serialize user additions
        // and reduce the risk of exceeding plan limits concurrently.
        const tenantResult = await client.query(
            `SELECT tenant_id
             FROM vidya.tenant_master
             WHERE tenant_id = $1
               AND is_active = TRUE
             FOR UPDATE`,
            [tenantId]
        );

        if (tenantResult.rowCount === 0) {
            const error = new Error(
                "Tenant not found or inactive"
            );
            error.status = 404;
            throw error;
        }

        // 5. Retrieve the shared role UUID
        const roleResult = await client.query(
            `SELECT role_id
             FROM vidya.role_master
             WHERE UPPER(role_name) = $1
               AND is_active = TRUE
             LIMIT 1`,
            [roleName]
        );

        if (roleResult.rowCount === 0) {
            const error = new Error(
                `Active ${roleName} role is not configured`
            );
            error.status = 500;
            throw error;
        }

        const roleId = roleResult.rows[0].role_id;

        // 6. Retrieve the tenant's current subscription and plan limits
        const subscriptionResult = await client.query(
            `SELECT
                s.subscription_id,
                s.status,
                s.starts_at,
                s.ends_at,
                p.plan_id,
                p.plan_name,
                p.limits
             FROM vidya.subscription_master s
             JOIN vidya.subscription_plan_master p
               ON p.plan_id = s.plan_id
             WHERE s.tenant_id = $1
               AND s.status = 'ACTIVE'
               AND p.plan_scope = 'TENANT'
               AND p.is_active = TRUE
               AND s.starts_at <= CURRENT_TIMESTAMP
               AND (
                   s.ends_at IS NULL
                   OR s.ends_at > CURRENT_TIMESTAMP
               )
             ORDER BY s.starts_at DESC
             LIMIT 1
             FOR SHARE OF s`,
            [tenantId]
        );

        if (subscriptionResult.rowCount === 0) {
            const error = new Error(
                "This organization has no active subscription. Please select a plan."
            );
            error.status = 403;
            throw error;
        }

        const subscription = subscriptionResult.rows[0];

        // Map role names to plan limit keys
        const limitKey =
            roleName === "TEACHER" ? "teachers" : "students";

        const limits = subscription.limits;

        if (
            !limits ||
            typeof limits !== "object" ||
            Array.isArray(limits) ||
            !Object.prototype.hasOwnProperty.call(limits, limitKey)
        ) {
            const error = new Error(
                `The ${subscription.plan_name} plan has no configured ${limitKey} limit`
            );
            error.status = 500;
            throw error;
        }

        const maxUsers = limits[limitKey];

        // -1 means unlimited. Otherwise require a non-negative integer.
        if (
            !Number.isInteger(maxUsers) ||
            maxUsers < -1
        ) {
            const error = new Error(
                `Invalid ${limitKey} limit in the subscription plan`
            );
            error.status = 500;
            throw error;
        }

        // 7. Find an existing account
        const existingResult = await client.query(
            `SELECT
                user_id,
                full_name,
                email,
                mobile_no,
                default_role_id,
                is_active
             FROM vidya.user_master
             WHERE email = $1
             FOR UPDATE`,
            [normalizedEmail]
        );

        let user;
        let accountCreated = false;
        let membershipAlreadyActive = false;

        if (existingResult.rowCount > 0) {
            user = existingResult.rows[0];

            if (!user.is_active) {
                const error = new Error(
                    "This user account is inactive"
                );
                error.status = 403;
                throw error;
            }

            // Check whether this exact role membership already exists.
            const membershipCheck = await client.query(
                `SELECT mapping_id
                 FROM vidya.tenant_user_mapping
                 WHERE tenant_id = $1
                   AND user_id = $2
                   AND role_id = $3
                   AND is_active = TRUE
                 LIMIT 1`,
                [tenantId, user.user_id, roleId]
            );

            membershipAlreadyActive =
                membershipCheck.rowCount > 0;

            // Do not change default_role_id on existing accounts.
        }

        // 8. Enforce subscription limits only when adding a new
        // membership or reactivating an inactive membership.
        let currentCount = 0;

        if (!membershipAlreadyActive) {
            const countResult = await client.query(
                `SELECT COUNT(DISTINCT um.user_id)::int AS total
                 FROM vidya.tenant_user_mapping tum
                 JOIN vidya.user_master um
                   ON um.user_id = tum.user_id
                 JOIN vidya.role_master rm
                   ON rm.role_id = tum.role_id
                 WHERE tum.tenant_id = $1
                   AND tum.is_active = TRUE
                   AND um.is_active = TRUE
                   AND UPPER(rm.role_name) = $2`,
                [tenantId, roleName]
            );

            currentCount = countResult.rows[0].total;

            if (
                maxUsers !== -1 &&
                currentCount >= maxUsers
            ) {
                const error = new Error(
                    `Your ${subscription.plan_name} plan allows a maximum of ${maxUsers} ${limitKey}. Current usage: ${currentCount}. Please upgrade your subscription.`
                );

                error.status = 403;
                error.code = "PLAN_LIMIT_REACHED";
                throw error;
            }
        }

        // 9. Create a new account if the email does not exist
        if (!user) {
            if (
                typeof password !== "string" ||
                password.length < 8 ||
                Buffer.byteLength(password, "utf8") > 72
            ) {
                const error = new Error(
                    "For a new account, password must be at least 8 characters and no more than 72 UTF-8 bytes"
                );
                error.status = 400;
                throw error;
            }

            const passwordHash = await bcrypt.hash(password, 12);

            const userResult = await client.query(
                `INSERT INTO vidya.user_master
                    (
                        full_name,
                        email,
                        mobile_no,
                        password_hash,
                        default_role_id
                    )
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING
                    user_id,
                    full_name,
                    email,
                    mobile_no,
                    default_role_id,
                    is_active,
                    created_at`,
                [
                    name,
                    normalizedEmail,
                    mobile,
                    passwordHash,
                    roleId
                ]
            );

            user = userResult.rows[0];
            accountCreated = true;
        }

        // 10. Create or reactivate tenant membership
        const mappingResult = await client.query(
            `INSERT INTO vidya.tenant_user_mapping
                (tenant_id, user_id, role_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (tenant_id, user_id, role_id)
             DO UPDATE SET
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
             RETURNING
                mapping_id,
                tenant_id,
                user_id,
                role_id,
                is_active`,
            [tenantId, user.user_id, roleId]
        );

        // 11. Commit
        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(accountCreated ? 201 : 200).json({
            success: true,
            message: accountCreated
                ? `${roleName} account created and added to tenant`
                : `Existing user added to tenant as ${roleName}`,
            data: {
                user,
                membership: mappingResult.rows[0],
                role_name: roleName,
                account_created: accountCreated,
                subscription: {
                    plan_name: subscription.plan_name,
                    limit: maxUsers === -1 ? "UNLIMITED" : maxUsers,
                    current_count: currentCount,
                    limit_key: limitKey
                }
            }
        });

    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Transaction rollback failed:",
                    rollbackError.message
                );
            }
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Email or mobile number is already registered"
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Invalid tenant, user, or role reference"
            });
        }

        if (error.code === "PLAN_LIMIT_REACHED") {
            return res.status(403).json({
                success: false,
                code: error.code,
                message: error.message
            });
        }

        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        console.error("Create tenant user error:", error.message);
        return next(error);

    } finally {
        if (client) {
            client.release();
        }
    }
};