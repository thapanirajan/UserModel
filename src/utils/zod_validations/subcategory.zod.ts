import { z } from "zod";

export const createSubCategorySchema = z.object({
    name: z
        .string()
        .min(1, "name is requried")
})

export const updateSubcategorySchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .optional(),
});

export type CreateSubCategoryInput = z.infer<typeof createSubCategorySchema>;
export type UpdateSubCategoryInput = z.infer<typeof updateSubcategorySchema>;