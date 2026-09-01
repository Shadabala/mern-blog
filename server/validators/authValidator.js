import { z } from 'zod';

// Helper for required string fields
const requiredString = (message, minLen = 1, minMsg = message) =>
    z.preprocess(
        (val) => (val === undefined || val === null ? '' : String(val).trim()),
        z.string().min(1, message).min(minLen, minMsg)
    );

// Helper for required email fields
const requiredEmail = (message = 'Email is required', invalidMsg = 'Invalid email address') =>
    z.preprocess(
        (val) => (val === undefined || val === null ? '' : String(val).trim()),
        z.string().min(1, message).email(invalidMsg)
    );

// Helper for OTP validation
const otpSchema = z.preprocess(
    (val) => (val === undefined || val === null ? '' : String(val).trim()),
    z.string().min(1, 'OTP code is required').regex(/^\d{6}$/, 'OTP must be a 6-digit code')
);

export const signupSchema = z.object({
    body: z.object({
        name: requiredString('Name is required', 2, 'Name must be at least 2 characters'),
        username: requiredString('Username is required', 3, 'Username must be at least 3 characters'),
        email: requiredEmail('Email is required', 'Invalid email address'),
        password: requiredString('Password is required', 6, 'Password must be at least 6 characters'),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        username: z.string().optional(),
        email: z.string().optional(),
        password: requiredString('Password is required')
    }).refine((data) => (data.username && String(data.username).trim().length > 0) || (data.email && String(data.email).trim().length > 0), {
        message: 'Username or Email is required',
        path: ['username']
    })
});

export const forgetPasswordSchema = z.object({
    body: z.object({
        email: requiredEmail('Email is required', 'Invalid email address')
    })
});

export const verifyOtpSchema = z.object({
    body: z.object({
        email: requiredEmail('Email is required', 'Invalid email address'),
        otp: otpSchema
    })
});

export const forgetPasswordResetSchema = z.object({
    body: z.object({
        email: requiredEmail('Email is required', 'Invalid email address'),
        otp: otpSchema,
        password: requiredString('Password is required', 6, 'Password must be at least 6 characters'),
        confirm_password: requiredString('Confirm password is required'),
    }).refine((data) => data.password === data.confirm_password, {
        message: 'Password and confirm password do not match',
        path: ['confirm_password']
    })
});

export const changePasswordSchema = z.object({
    body: z.object({
        old_password: requiredString('Current password is required'),
        password: requiredString('New password is required', 6, 'Password must be at least 6 characters'),
        confirm_password: requiredString('Confirm password is required'),
    }).refine((data) => data.password === data.confirm_password, {
        message: 'Password and confirm password do not match',
        path: ['confirm_password']
    })
});
