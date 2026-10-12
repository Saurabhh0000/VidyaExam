
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication token is required"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Invalid authentication header"
        });
    }

    if (!process.env.JWT_SECRET) {
        return next(new Error("JWT_SECRET is not configured"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).json({
                success: false,
                message:
                    error.name === "TokenExpiredError"
                        ? "Token has expired. Please log in again."
                        : "Invalid authentication token"
            });
        }

        req.user = {
            user_id: decoded.sub,
            email: decoded.email,
            role: decoded.role
        };

        next();
    });
}

// Restrict endpoints to specified roles.
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource"
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRoles
};
