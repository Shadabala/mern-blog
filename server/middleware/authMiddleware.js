import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check Authorization Bearer Header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        } 
        // 2. Fallback to HttpOnly Cookie
        else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token || token === "null" || token === "undefined") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized! Access token missing. Please login first."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_SECRET_KEY
        );

        const user = await User.findById(decoded.userId || decoded._id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found. Please login again."
            });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact administration."
            });
        }

        req.user = user;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                code: "TOKEN_EXPIRED",
                message: "Access token expired. Please login again."
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again."
        });
    }
};

/**
 * Optional Authentication Middleware
 * Identifies the user if token is valid; does not block or error if missing
 */
export const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token && token !== "null" && token !== "undefined") {
            const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
            const user = await User.findById(decoded.userId || decoded._id).select("-password");
            if (user && user.status !== 'blocked') {
                req.user = user;
            }
        }
    } catch {
        // Silently continue for optional authentication
    }
    next();
};

/**
 * Role-Based Access Control Guard
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'staff')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Authentication required."
            });
        }

        const userRole = req.user.role || req.user.user_type || 'user';

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden! Access denied for role: ${userRole}. Required role: ${roles.join(' or ')}.`
            });
        }

        next();
    };
};