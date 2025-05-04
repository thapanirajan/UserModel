import { z } from "zod";


export const createProductSchema = z.object({
    name: z
        .string()
        .min(1, "name is product naem is required"),

    description: z
        .string()
        .min(1, 'Description is required'),

    price: z
        .number()
        .positive('Price must be positive'),

    stock: z
        .number()
        .int().min(0, 'Stock cannot be negative'),
})



export const updateProductSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required').optional(),
    description: z
        .string()
        .min(1, 'Description is required').optional(),
    price: z
        .number()
        .positive('Price must be positive').optional(),
    stock: z
        .number()
        .int().min(0, 'Stock cannot be negative').optional(),
});


export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
