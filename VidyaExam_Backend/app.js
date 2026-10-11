
const express = require("express");
const cors = require("cors");

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
const userRoutes = require("./routes/user.routes");
const tenantRoutes = require("./routes/tenant.routes");
const superAdminRoutes = require("./routes/super-admin.routes");
const subscriptionRoutes = require("./routes/subscription.routes");


app.use(cors(corsOptions));




// Parse JSON requests
app.use(express.json());

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
app.use("/api/users", userRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
// Register your API routes above this line.



module.exports = app;
