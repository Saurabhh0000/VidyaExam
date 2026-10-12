
const { pool } = require("../config/db");

// GET /api/subscriptions/plans

exports.getSubscriptionPlans = async (req, res) => {
    try {
        const query = `
            SELECT
                plan_id,
                plan_name,
                plan_scope,
                billing_interval,
                price_amount,
                currency,
                features,
                limits
            FROM vidya.subscription_plan_master
            WHERE is_active = TRUE
            ORDER BY
                CASE plan_scope
                    WHEN 'INDIVIDUAL' THEN 1
                    WHEN 'TENANT' THEN 2
                    ELSE 3
                END,
                CASE plan_name
                    WHEN 'FREE' THEN 1
                    WHEN 'BASIC' THEN 2
                    WHEN 'PREMIUM' THEN 3
                    ELSE 4
                END,
                CASE billing_interval
                    WHEN 'FREE' THEN 1
                    WHEN 'MONTHLY' THEN 2
                    WHEN 'YEARLY' THEN 3
                    ELSE 4
                END;
        `;

        const result = await pool.query(query);

        // Group plans by audience for easier frontend rendering
        const plans = {
            individual: result.rows.filter(
                plan => plan.plan_scope === "INDIVIDUAL"
            ),
            tenant: result.rows.filter(
                plan => plan.plan_scope === "TENANT"
            )
        };

        return res.status(200).json({
            success: true,
            message: "Subscription plans fetched successfully",
            count: result.rows.length,
            data: plans
        });

    } catch (error) {
        console.error("Get subscription plans error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch subscription plans"
        });
    }
};
