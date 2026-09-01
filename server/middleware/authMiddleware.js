import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        let token;

        // Check Authorization Bearer Header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
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