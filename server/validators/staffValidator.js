import { z } from 'zod';

export const createStaffSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
        email: z.string({ required_error: 'Email is required' }).email('Invalid email address').trim().toLowerCase(),
        password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
        phone: z.string().optional(),
        role_id: z.string({ required_error: 'Role is required' }).min(1, 'Role is required'),
        status: z.enum(['active', 'blocked']).optional()
    })
});

export const updateStaffSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
        email: z.string().email('Invalid email address').trim().toLowerCase().optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
        phone: z.string().optional(),
        role_id: z.string().optional(),
        status: z.enum(['active', 'blocked']).optional()
    })
});
