import { z } from 'zod';

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Role Name is required' }).trim().min(2, 'Role Name must be at least 2 characters'),
        permissions: z.array(z.string()).default([]),
        description: z.string().optional()
    })
});

export const updateRoleSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, 'Role Name must be at least 2 characters').optional(),
        permissions: z.array(z.string()).optional(),
        description: z.string().optional()
    })
});
