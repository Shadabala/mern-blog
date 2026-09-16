import { z } from 'zod';

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Category name cannot be empty'),
        lang: z.string().optional(),
        slug: z.string().optional(),
        parent_id: z.string().nullable().optional(),
        order_level: z.union([z.number(), z.string()]).optional(),
        banner: z.string().optional(),
        icon: z.string().optional(),
        cover_image: z.string().optional(),
        meta_title: z.string().optional(),
        meta_description: z.string().optional()
    })
});

export const updateCategorySchema = z.object({
    body: z.object({
        name: z.string().optional(),
        lang: z.string().optional(),
        slug: z.string().optional(),
        parent_id: z.string().nullable().optional(),
        order_level: z.union([z.number(), z.string()]).optional(),
        banner: z.string().optional(),
        icon: z.string().optional(),
        cover_image: z.string().optional(),
        meta_title: z.string().optional(),
        meta_description: z.string().optional()
    })
});
