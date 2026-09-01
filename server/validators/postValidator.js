import { z } from 'zod';

export const createPostSchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Title is required' }).trim().min(1, 'Title cannot be empty'),
        description: z.string({ required_error: 'Description is required' }).trim().min(1, 'Description cannot be empty'),
        picture: z.string().optional(),
        username: z.string().optional(),
        categories: z.union([z.string(), z.array(z.string())]).optional(),
        createdDate: z.string().optional()
    })
});

export const updatePostSchema = z.object({
    body: z.object({
        title: z.string().trim().min(1, 'Title cannot be empty').optional(),
        description: z.string().trim().min(1, 'Description cannot be empty').optional(),
        picture: z.string().optional(),
        categories: z.union([z.string(), z.array(z.string())]).optional()
    })
});
