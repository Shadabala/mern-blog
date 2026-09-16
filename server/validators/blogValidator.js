import { z } from 'zod';

export const createBlogSchema = z.object({
    body: z.object({
        title: z.union([z.string().trim().min(1, 'Title cannot be empty'), z.record(z.any())]),
        category_id: z.union([z.string(), z.record(z.any())]).optional().nullable(),
        slug: z.string().optional(),
        banner: z.string().optional(),
        short_description: z.union([z.string(), z.record(z.any())]).optional(),
        description: z.union([z.string(), z.record(z.any())]).optional(),
        meta_title: z.string().optional(),
        meta_img: z.string().optional(),
        meta_description: z.string().optional(),
        meta_keywords: z.string().optional(),
        status: z.union([z.number(), z.string(), z.boolean()]).optional(),
        lang: z.string().optional()
    }).passthrough()
});

export const updateBlogSchema = z.object({
    body: z.object({
        title: z.union([z.string().trim().min(1, 'Title cannot be empty'), z.record(z.any())]).optional(),
        category_id: z.union([z.string(), z.record(z.any())]).optional().nullable(),
        slug: z.string().optional(),
        banner: z.string().optional(),
        short_description: z.union([z.string(), z.record(z.any())]).optional(),
        description: z.union([z.string(), z.record(z.any())]).optional(),
        meta_title: z.string().optional(),
        meta_img: z.string().optional(),
        meta_description: z.string().optional(),
        meta_keywords: z.string().optional(),
        status: z.union([z.number(), z.string(), z.boolean()]).optional(),
        lang: z.string().optional()
    }).passthrough()
});

// Backward compatibility
export const createPostSchema = createBlogSchema;
export const updatePostSchema = updateBlogSchema;
