
const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST /api/users/register
exports.createUser = async (req, res, next) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const { full_name, email, mobile_no, password } = req.body;

        // 1. Required-field validation
        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !full_name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required"
            });
        }

        const name = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        const mobile =
            mobile_no == null || mobile_no === ""
                ? null
                : typeof mobile_no === "string"
                    ? mobile_no.trim()
                    : null;

        // 2. Validate input
        if (
            name.length > 150 ||
            normalizedEmail.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72 ||
            (mobile_no != null && mobile_no !== "" && !mobile) ||
            (mobile && mobile.length > 15)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide valid user details. Password must be at least 8 characters and no more than 72 UTF-8 bytes."
            });
        }

        // 3. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 4. Start transaction
        await client.query("BEGIN");
        transactionStarted = true;

        // 5. Get active STUDENT role
        const roleResult = await client.query(
            `SELECT role_id
             FROM vidya.role_master
             WHERE UPPER(role_name) = $1
               AND is_active = TRUE
             LIMIT 1`,
            ["STUDENT"]
        );

        if (roleResult.rows.length === 0) {
            const error = new Error(
                "Active STUDENT role is not configured"
            );
            error.status = 500;
            throw error;
        }

        const roleId = roleResult.rows[0].role_id;

        // 6. Find the active FREE individual subscription plan
        const planResult = await client.query(
            `SELECT plan_id, plan_name, plan_scope,
                    billing_interval, limits, features
             FROM vidya.subscription_plan_master
             WHERE plan_scope = 'INDIVIDUAL'
               AND plan_name = 'FREE'
               AND billing_interval = 'FREE'
               AND is_active = TRUE
             LIMIT 1`
        );

        if (planResult.rows.length === 0) {
            const error = new Error(
                "Active FREE individual subscription plan is not configured"
            );
            error.status = 500;
            throw error;
        }

        const freePlan = planResult.rows[0];

        // 7. Create student account
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
                email_verified,
                created_at`,
            [
                name,
                normalizedEmail,
                mobile,
                passwordHash,
                roleId
            ]
        );

        const user = userResult.rows[0];

        // 8. Assign FREE individual subscription
        const subscriptionResult = await client.query(
            `INSERT INTO vidya.subscription_master
                (
                    plan_id,
                    user_id,
                    tenant_id,
                    status,
                    starts_at
                )
             VALUES ($1, $2, NULL, 'ACTIVE', CURRENT_TIMESTAMP)
             RETURNING
                subscription_id,
                plan_id,
                user_id,
                status,
                starts_at,
                ends_at`,
            [
                freePlan.plan_id,
                user.user_id
            ]
        );

        const subscription = subscriptionResult.rows[0];

        // 9. Commit only after both inserts succeed
        await client.query("COMMIT");
        transactionStarted = false;

        // 10. Send response
        return res.status(201).json({
            success: true,
            message: "User registered successfully with FREE individual plan",
            data: {
                ...user,
                role: "STUDENT",
                subscription: {
                    subscription_id: subscription.subscription_id,
                    plan_id: freePlan.plan_id,
                    plan_name: freePlan.plan_name,
                    plan_scope: freePlan.plan_scope,
                    billing_interval: freePlan.billing_interval,
                    status: subscription.status,
                    starts_at: subscription.starts_at,
                    ends_at: subscription.ends_at,
                    limits: freePlan.limits,
                    features: freePlan.features
                }
            }
        });

    } catch (error) {
        // Roll back user and subscription together
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Registration rollback failed:",
                    rollbackError.message
                );
            }
        }

        // Duplicate email/mobile
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Email or mobile number is already registered"
            });
        }

        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        return next(error);

    } finally {
        client.release();
    }
};


// POST /api/users/login
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validate required fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Fetch user and active tenant memberships
        const result = await pool.query(
            `SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.password_hash,
                u.default_role_id,
                u.is_active,
                r.role_name AS default_role,
                r.is_active AS role_is_active,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'tenant_id', tm.tenant_id,
                                'tenant_name', tm.tenant_name,
                                'tenant_code', tm.tenant_code,
                                'role_id', tr.role_id,
                                'role_name', tr.role_name
                            )
                            ORDER BY tm.tenant_name
                        )
                        FROM vidya.tenant_user_mapping tum
                        JOIN vidya.tenant_master tm
                          ON tm.tenant_id = tum.tenant_id
                        JOIN vidya.role_master tr
                          ON tr.role_id = tum.role_id
                        WHERE tum.user_id = u.user_id
                          AND tum.is_active = TRUE
                          AND tm.is_active = TRUE
                          AND tr.is_active = TRUE
                    ),
                    '[]'::json
                ) AS memberships
             FROM vidya.user_master u
             LEFT JOIN vidya.role_master r
               ON r.role_id = u.default_role_id
             WHERE u.email = $1
             LIMIT 1`,
            [normalizedEmail]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 3. Verify password
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Check account status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        // 5. Validate default role if configured
        if (
            user.default_role_id &&
            (!user.default_role || user.role_is_active !== true)
        ) {
            return res.status(403).json({
                success: false,
                message: "Your default role is inactive or unavailable"
            });
        }

        // 6. Fetch active individual subscription
        const individualResult = await pool.query(
            `SELECT
                s.subscription_id,
                s.status,
                s.starts_at,
                s.ends_at,
                p.plan_id,
                p.plan_name,
                p.plan_scope,
                p.billing_interval,
                p.price_amount,
                p.currency,
                p.features,
                p.limits
             FROM vidya.subscription_master s
             JOIN vidya.subscription_plan_master p
               ON p.plan_id = s.plan_id
             WHERE s.user_id = $1
               AND s.tenant_id IS NULL
               AND s.status = 'ACTIVE'
               AND p.plan_scope = 'INDIVIDUAL'
               AND p.is_active = TRUE
               AND s.starts_at <= CURRENT_TIMESTAMP
               AND (
                   s.ends_at IS NULL
                   OR s.ends_at > CURRENT_TIMESTAMP
               )
             ORDER BY s.starts_at DESC
             LIMIT 1`,
            [user.user_id]
        );

        const individualSubscription =
            individualResult.rows[0] || null;

        // 7. Fetch active subscriptions for all tenant memberships
        const tenantResult = await pool.query(
            `SELECT
                tm.tenant_id,
                tm.tenant_name,
                tm.tenant_code,
                rm.role_id,
                rm.role_name,

                s.subscription_id,
                s.status AS subscription_status,
                s.starts_at,
                s.ends_at,

                p.plan_id,
                p.plan_name,
                p.plan_scope,
                p.billing_interval,
                p.price_amount,
                p.currency,
                p.features,
                p.limits

             FROM vidya.tenant_user_mapping tum

             JOIN vidya.tenant_master tm
               ON tm.tenant_id = tum.tenant_id

             JOIN vidya.role_master rm
               ON rm.role_id = tum.role_id

             LEFT JOIN vidya.subscription_master s
               ON s.tenant_id = tm.tenant_id
              AND s.user_id IS NULL
              AND s.status = 'ACTIVE'
              AND s.starts_at <= CURRENT_TIMESTAMP
              AND (
                  s.ends_at IS NULL
                  OR s.ends_at > CURRENT_TIMESTAMP
              )

             LEFT JOIN vidya.subscription_plan_master p
               ON p.plan_id = s.plan_id
              AND p.plan_scope = 'TENANT'
              AND p.is_active = TRUE

             WHERE tum.user_id = $1
               AND tum.is_active = TRUE
               AND tm.is_active = TRUE
               AND rm.is_active = TRUE

             ORDER BY tm.tenant_name`,
            [user.user_id]
        );

        // 8. Format tenant memberships with their subscriptions
        const tenantSubscriptions = tenantResult.rows.map(row => ({
            tenant_id: row.tenant_id,
            tenant_name: row.tenant_name,
            tenant_code: row.tenant_code,
            role_id: row.role_id,
            role_name: row.role_name,

            subscription: row.subscription_id && row.plan_id
                ? {
                    subscription_id: row.subscription_id,
                    plan_id: row.plan_id,
                    plan_name: row.plan_name,
                    plan_scope: row.plan_scope,
                    billing_interval: row.billing_interval,
                    price_amount: row.price_amount,
                    currency: row.currency,
                    status: row.subscription_status,
                    starts_at: row.starts_at,
                    ends_at: row.ends_at,
                    features: row.features,
                    limits: row.limits
                }
                : null
        }));

        // 9. Convenient subscription property:
        // Individual plan if present; otherwise tenant plan
        // when the user belongs to exactly one tenant.
        const subscription =
            individualSubscription ||
            (
                tenantSubscriptions.length === 1
                    ? tenantSubscriptions[0].subscription
                    : null
            );

        // 10. Validate JWT configuration
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

        // 11. Generate JWT
        const token = jwt.sign(
            {
                email: user.email,
                role: user.default_role || null,
                default_role_id: user.default_role_id || null
            },
            process.env.JWT_SECRET,
            {
                subject: user.user_id,
                expiresIn
            }
        );

        // 12. Update last login
        await pool.query(
            `UPDATE vidya.user_master
             SET last_login_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [user.user_id]
        );

        // 13. Return response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            expiresIn,

            data: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                default_role_id: user.default_role_id,
                default_role: user.default_role,

                memberships: user.memberships,

                // Convenient field for individual users
                // or users belonging to exactly one tenant.
                subscription,

                // Explicitly separated subscription information
                individual_subscription: individualSubscription,
                tenant_subscriptions: tenantSubscriptions
            }
        });

    } catch (error) {
        return next(error);
    }
};

