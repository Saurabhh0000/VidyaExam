
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
