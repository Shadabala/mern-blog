import { z } from 'zod';

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Category name cannot be empty'),
        lang: z.string().optional()
    })
});

export const updateCategorySchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Category name cannot be empty'),
        lang: z.string().optional()
    })
});
