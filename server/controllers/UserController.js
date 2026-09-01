import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Token from '../models/Token.js';
import User from '../models/User.js';

dotenv.config();

export const singupUser = async (request, response) => {
    try {
        const { name, username, email, password } = request.body;
        const errors = {};

        // Name
        if (!name) {
            errors.name = ["The name field is required."];
        } else if (name.trim().length < 2) {
            errors.name = ["The name must be at least 2 characters."];
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            errors.email = ["The email field is required."];
        } else if (email.trim().length < 2) {
            errors.email = ["The email must be at least 2 characters."];
        }
        else if (!emailRegex.test(email)) {
            errors.email = ["The email must be a valid email."];
        }

        if (!username) {
            errors.username = ["The username field is required."];
        } else if (username.trim().length < 2) {
            errors.username = ["The username must be at least 2 characters."];
        }

        if (!password) {
            errors.password = ["The password field is required."];
        } else if (password.trim().length < 6) {
            errors.password = ["The password must be at least 6 characters."];
        }
        // Return all validation errors
        if (Object.keys(errors).length > 0) {
            return response.status(422).json({
                message: "The given data was invalid.",
                errors
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser) {
            return response.status(422).json({
                msg: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(request.body.password, 10);

        const newUser = new User({
            username: request.body.username,
            name: request.body.name,
            email: request.body.email,
            password: hashedPassword
        });
        await newUser.save();

        return response.status(200).json({ msg: 'Signup successful' });
    } catch (error) {
        console.error('Signup error:', error.message);
        return response.status(500).json({
            msg: 'Error while signing up user',
            error: error.message
        });
    }
};

export const loginUser = async (request, response) => {
    const { username, email, password } = request.body;

    if ((!username && !email) || !password) {
        return response.status(400).json({
            msg: 'Username or email and password are required'
        });
    }

    const user = await User.findOne({
        $or: [
            { username: username },
            { email: username }
        ]
    });

    if (!user) {
        return response.status(400).json({ msg: 'User not found' });
    }

    try {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const payload = {
                userId: user._id.toString(),
                name: user.name,
                username: user.username,
                email: user.email
            };

            const accessToken = jwt.sign(
                payload,
                process.env.ACCESS_SECRET_KEY,
                { expiresIn: '15m' }
            );
            const refreshToken = jwt.sign(
                payload,
                process.env.REFRESH_SECRET_KEY,
                { expiresIn: '7d' }
            );

            const newToken = new Token({ token: refreshToken });
            await newToken.save();

            const isProduction = process.env.NODE_ENV === 'production';

            // Set HttpOnly Cookies
            response.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            response.status(200).json({
                accessToken: accessToken,
                refreshToken: refreshToken,
                name: user.name,
                username: user.username,
                email: user.email
            });

        } else {
            response.status(400).json({ msg: 'Password does not match' });
        }
    } catch (error) {
        console.error("Login error:", error);
        response.status(500).json({ msg: 'Error while logging in the user' });
    }
};

export const logoutUser = async (request, response) => {
    try {
        const refreshToken = request.cookies?.refreshToken || request.body?.token;

        if (refreshToken) {
            await Token.deleteOne({ token: refreshToken });
        }

        const isProduction = process.env.NODE_ENV === 'production';

        response.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict'
        });

        response.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict'
        });

        return response.status(200).json({
            msg: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error.message);
        return response.status(500).json({
            msg: 'Error while logging out user',
            error: error.message
        });
    }
};

export const refreshToken = async (request, response) => {
    try {
        const refreshTokenFromCookie = request.cookies?.refreshToken || request.body?.token;

        if (!refreshTokenFromCookie) {
            return response.status(401).json({ msg: 'Refresh token is required' });
        }

        const tokenDoc = await Token.findOne({ token: refreshTokenFromCookie });
        if (!tokenDoc) {
            return response.status(403).json({ msg: 'Refresh token is invalid or expired' });
        }

        jwt.verify(refreshTokenFromCookie, process.env.REFRESH_SECRET_KEY, (err, user) => {
            if (err) {
                return response.status(403).json({ msg: 'Refresh token validation failed' });
            }

            const payload = {
                userId: user.userId || user._id,
                name: user.name,
                username: user.username,
                email: user.email
            };

            const newAccessToken = jwt.sign(
                payload,
                process.env.ACCESS_SECRET_KEY,
                { expiresIn: '15m' }
            );

            const isProduction = process.env.NODE_ENV === 'production';

            response.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            return response.status(200).json({
                accessToken: newAccessToken,
                msg: 'Token refreshed successfully'
            });
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        return response.status(500).json({ msg: 'Error refreshing token' });
    }
};

export const getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

