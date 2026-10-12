const rateLimit = require("express-rate-limit");

// General limiter for public API endpoints (e.g. 100 requests per 15 minutes)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes."
    }
});

// Stricter limiter for sensitive auth/login endpoints (e.g. 10 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts from this IP, please try again after 15 minutes."
    }
});

module.exports = {
    globalLimiter,
    authLimiter
};
