import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Token from '../models/Token.js';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import sendEmail from '../utils/sendEmail.js';
import Mail, { ResetPasswordMail } from '../emails/Mail.js';

dotenv.config();

export const singupUser = async (request, response) => {
    try {
        const { name, username, email, password } = request.body;

        let finalUsername = username ? username.trim() : "";
        if (!finalUsername) {
            const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
            let candidate = emailPrefix || 'user';
            let counter = 1;
            while (await User.findOne({ username: candidate })) {
                candidate = `${emailPrefix}${counter}`;
                counter++;
            }
            finalUsername = candidate;
        }

        const existingUser = await User.findOne({
            $or: [
                { username: finalUsername },
                { email: email }
            ]
        });

        if (existingUser) {
            return response.status(422).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: finalUsername,
            name: name,
            email: email,
            password: hashedPassword
        });
        await newUser.save();

        return response.status(200).json({ success: true, message: 'Signup successful' });
    } catch (error) {
        console.error('Signup error:', error.message);
        return response.status(500).json({
            success: false,
            message: 'Error while signing up user',
            error: error.message
        });
    }
};

export const loginUser = async (request, response) => {
    const { username, email, password } = request.body;
    const loginIdentifier = username || email;

    if (!loginIdentifier || !password) {
        return response.status(400).json({
            success: false,
            message: 'Email or username and password are required'
        });
    }

    try {
        const user = await User.findOne({
            $or: [
                { username: loginIdentifier },
                { email: loginIdentifier }
            ]
        }).select('+password').populate('role_id');

        if (!user) {
            return response.status(400).json({ success: false, message: 'User not found' });
        }

        if (user.status === 'blocked') {
            return response.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact system administration.'
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Check if Two-Factor Authentication is enabled
            if (user.twoFactorEnabled) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                user.twoFactorOtp = otp;
                user.twoFactorOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
                await user.save();

                try {
                    await sendEmail({
                        to: user.email,
                        subject: 'Your 2FA Login Verification Code',
                        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Security Verification</h2>
                            <p>Hello ${user.name},</p>
                            <p>Your 2-Factor Authentication code is:</p>
                            <h1 style="color: #4f46e5; letter-spacing: 4px; font-size: 32px;">${otp}</h1>
                            <p>This code expires in 5 minutes. If you did not attempt to log in, please secure your account immediately.</p>
                        </div>`
                    });
                } catch (emailErr) {
                    console.warn('[2FA] Email notification failed (dev mode fallback):', emailErr.message);
                }
                console.log(`[2FA OTP for ${user.email}]: ${otp}`);

                return response.status(200).json({
                    success: true,
                    twoFactorRequired: true,
                    userId: user._id,
                    email: user.email,
                    cooldownSeconds: 60,
                    message: 'Two-factor verification code sent to your email.'
                });
            }

            user.lastLoginAt = new Date();
            await user.save();

            try {
                await LoginHistory.create({
                    user: user._id,
                    ipAddress: request.ip || request.headers['x-forwarded-for'] || '127.0.0.1',
                    deviceInfo: request.headers['user-agent'] || 'Web Browser'
                });
            } catch (logErr) {
                console.error("Login history logging error:", logErr);
            }

            const userRole = user.role || user.user_type || 'user';
            let permissions = [];
            if (userRole === 'admin') {
                permissions = ['*'];
            } else if (userRole === 'staff' && user.role_id?.permissions) {
                permissions = user.role_id.permissions;
            }

            const payload = {
                userId: user._id.toString(),
                name: user.name,
                username: user.username,
                email: user.email,
                role: userRole,
                role_id: user.role_id?._id || user.role_id || null
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
            const sameSiteSetting = isProduction ? 'strict' : 'lax';

            // Set HttpOnly Cookies
            response.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: sameSiteSetting,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: sameSiteSetting,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return response.status(200).json({
                success: true,
                message: 'Login successful',
                accessToken: accessToken,
                refreshToken: refreshToken,
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone || '',
                    role: userRole,
                    role_id: user.role_id,
                    permissions,
                    status: user.status
                }
            });

        } else {
            return response.status(400).json({ success: false, message: 'Invalid password. Please try again.' });
        }
    } catch (error) {
        console.error("Login error:", error);
        return response.status(500).json({ success: false, message: 'Error while logging in user', error: error.message });
    }
};

/**
 * Verify 2FA OTP Code
 */
export const verifyTwoFactor = async (request, response) => {
    try {
        const { userId, email, otp } = request.body;

        const query = userId ? { _id: userId } : { email: (email || '').trim().toLowerCase() };
        const user = await User.findOne(query).select('+password');

        if (!user) {
            return response.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.status === 'blocked') {
            return response.status(403).json({ success: false, message: 'Your account is blocked' });
        }

        if (!user.twoFactorOtp || user.twoFactorOtp !== otp.trim()) {
            return response.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        if (!user.twoFactorOtpExpires || new Date() > user.twoFactorOtpExpires) {
            return response.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
        }

        // Clear OTP after successful verification
        user.twoFactorOtp = null;
        user.twoFactorOtpExpires = null;
        user.lastLoginAt = new Date();
        await user.save();

        try {
            await LoginHistory.create({
                user: user._id,
                ipAddress: request.ip || request.headers['x-forwarded-for'] || '127.0.0.1',
                deviceInfo: request.headers['user-agent'] || 'Web Browser'
            });
        } catch (logErr) {
            console.error("Login history error:", logErr);
        }

        const userRole = user.role || user.user_type || 'user';
        let permissions = [];
        if (userRole === 'admin') {
            permissions = ['*'];
        } else if (userRole === 'staff' && user.role_id?.permissions) {
            permissions = user.role_id.permissions;
        }

        const payload = {
            userId: user._id.toString(),
            name: user.name,
            username: user.username,
            email: user.email,
            role: userRole,
            role_id: user.role_id?._id || user.role_id || null
        };

        const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET_KEY, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET_KEY, { expiresIn: '7d' });

        const newToken = new Token({ token: refreshToken });
        await newToken.save();

        const isProduction = process.env.NODE_ENV === 'production';
        const sameSiteSetting = isProduction ? 'strict' : 'lax';

        response.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: sameSiteSetting,
            maxAge: 15 * 60 * 1000
        });

        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: sameSiteSetting,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return response.status(200).json({
            success: true,
            message: '2FA Verification successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone || '',
                role: userRole,
                role_id: user.role_id,
                permissions,
                status: user.status
            }
        });
    } catch (error) {
        console.error('2FA verification error:', error);
        return response.status(500).json({ success: false, message: 'Failed to verify 2FA code', error: error.message });
    }
};

/**
 * Resend 2FA OTP Code
 */
export const resendTwoFactorOtp = async (request, response) => {
    try {
        const { userId, email } = request.body;
        const query = userId ? { _id: userId } : { email: (email || '').trim().toLowerCase() };
        const user = await User.findOne(query);

        if (!user) {
            return response.status(404).json({ success: false, message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorOtp = otp;
        user.twoFactorOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: 'New 2FA Verification Code',
                html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>New Security Verification Code</h2>
                    <p>Hello ${user.name},</p>
                    <p>Your new 2-Factor Authentication code is:</p>
                    <h1 style="color: #4f46e5; letter-spacing: 4px; font-size: 32px;">${otp}</h1>
                    <p>This code expires in 5 minutes.</p>
                </div>`
            });
        } catch (emailErr) {
            console.warn('[2FA Resend] Email notification failed (dev mode fallback):', emailErr.message);
        }
        console.log(`[2FA Resend OTP for ${user.email}]: ${otp}`);

        return response.status(200).json({
            success: true,
            message: 'A new verification code has been sent to your email.',
            cooldownSeconds: 60
        });
    } catch (error) {
        console.error('Resend 2FA OTP error:', error);
        return response.status(500).json({ success: false, message: 'Failed to resend code', error: error.message });
    }
};

export const logoutUser = async (request, response) => {
    try {
        const refreshToken = request.cookies?.refreshToken || request.body?.token;

        if (refreshToken) {
            await Token.deleteOne({ token: refreshToken });
        }

        const isProduction = process.env.NODE_ENV === 'production';
        const sameSiteSetting = isProduction ? 'strict' : 'lax';

        response.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: sameSiteSetting
        });

        response.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: sameSiteSetting
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

export const forgetPassword = async (request, response) => {
    try {
        const { email } = request.body;

        const user = await User.findOne({ email });
        if (!user) {
            return response.status(404).json({ success: false, message: 'User not found with this email' });
        }

        // Generate 6-digit numeric OTP and 10-minute expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetOtp = otp;
        user.resetOtpExpires = resetOtpExpires;
        await user.save();

        // Send OTP email via Mailable template
        await Mail.to(user.email).send(ResetPasswordMail({
            name: user.name || user.username,
            otp
        }));

        return response.status(200).json({
            success: true,
            message: 'OTP sent to your email successfully',
            email: user.email
        });
    } catch (error) {
        console.error("Forget password error:", error);
        return response.status(500).json({ success: false, message: 'Error sending OTP email', error: error.message });
    }
};

export const verifyOtp = async (request, response) => {
    try {
        const { email, otp } = request.body;

        const user = await User.findOne({ email });
        if (!user) {
            return response.status(404).json({ success: false, message: 'User not found with this email' });
        }

        // Verify OTP code
        if (!user.resetOtp || user.resetOtp !== otp.toString().trim()) {
            return response.status(400).json({ success: false, message: 'Invalid OTP code' });
        }

        // Verify OTP expiration
        if (!user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
            return response.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        return response.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return response.status(500).json({ success: false, message: 'Error verifying OTP code', error: error.message });
    }
};

export const forgetPasswordReset = async (request, response) => {
    try {
        const {
            email,
            otp,
            password,
            new_password,
            newPassword,
            confirm_password,
            confirmPassword
        } = request.body;

        const finalPassword = password || new_password || newPassword;
        const finalConfirmPassword = confirm_password || confirmPassword;

        const user = await User.findOne({ email });
        if (!user) {
            return response.status(404).json({ success: false, message: 'User not found with this email' });
        }

        // Verify OTP code
        if (!user.resetOtp || user.resetOtp !== otp.toString().trim()) {
            return response.status(400).json({ success: false, message: 'Invalid OTP code' });
        }

        // Verify OTP expiration
        if (!user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
            return response.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Hash new password and clear OTP fields
        const hashedPassword = await bcrypt.hash(finalPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = null;
        user.resetOtpExpires = null;
        await user.save();

        return response.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        console.error("Forget password reset error:", error);
        return response.status(500).json({ success: false, message: 'Error while resetting password', error: error.message });
    }
};

export const resetPassword = async (request, response) => {
    try {
        const {
            old_password,
            oldPassword,
            current_password,
            currentPassword,
            password,
            new_password,
            newPassword
        } = request.body;

        const oldPass = old_password || oldPassword || current_password || currentPassword;
        const newPass = password || new_password || newPassword;

        if (!oldPass || !newPass) {
            return response.status(400).json({ success: false, message: 'Current password and new password are required' });
        }

        // Get logged in user from protect middleware
        const userId = request.user?._id || request.user?.userId;
        const user = await User.findById(userId).select('+password');

        if (!user) {
            return response.status(404).json({ success: false, message: 'User account not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            return response.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Update to new hashed password
        user.password = await bcrypt.hash(newPass, 10);
        await user.save();

        return response.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error("Protected reset password error:", error);
        return response.status(500).json({ success: false, message: 'Error updating password', error: error.message });
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
            const sameSiteSetting = isProduction ? 'strict' : 'lax';

            response.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: sameSiteSetting,
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
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const userRole = req.user.role || req.user.user_type || 'user';
        let permissions = [];
        if (userRole === 'admin') {
            permissions = ['*'];
        } else if (userRole === 'staff' && req.user.role_id?.permissions) {
            permissions = req.user.role_id.permissions;
        }

        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                _id: req.user._id,
                name: req.user.name,
                username: req.user.username,
                email: req.user.email,
                phone: req.user.phone || '',
                role: userRole,
                role_id: req.user.role_id,
                permissions,
                status: req.user.status,
                twoFactorEnabled: req.user.twoFactorEnabled || false,
                purchased_categories: req.user.purchased_categories || []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

