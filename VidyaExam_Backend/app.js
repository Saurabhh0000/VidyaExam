
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Secure HTTP Headers
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// Parse JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route imports
const userRoutes = require("./routes/user.routes");
const tenantRoutes = require("./routes/tenant.routes");
const superAdminRoutes = require("./routes/super-admin.routes");
const subscriptionRoutes = require("./routes/subscription.routes");

// Root API
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "VidyaExam API is running successfully"
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "UP",
        timestamp: new Date().toISOString()
    });
});

// Mount Routes
app.use("/api/users", userRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// 404 Not Found Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

module.exports = app;

