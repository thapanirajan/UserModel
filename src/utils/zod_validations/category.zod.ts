import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.
        string()
        .min(1, "Name is required"),
})

export const updateCategorySchema = z.object({
    name: z
        .string()
        .min(1, "Name is required").optional()
})


// infer -> extract equivalent TypeScript type from it.
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;