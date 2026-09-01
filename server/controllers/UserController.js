import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Token from '../models/Token.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import Mail, { ResetPasswordMail } from '../emails/Mail.js';

dotenv.config();

export const singupUser = async (request, response) => {
    try {
        const { name, username, email, password } = request.body;

        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser) {
            return response.status(422).json({
                success: false,
                message: 'Username or email already exists'
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

        // Get logged in user from protect middleware
        const userId = request.user?._id || request.user?.userId;
        const user = await User.findById(userId);

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

