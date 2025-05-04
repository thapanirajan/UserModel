import { Request, Response } from 'express';
import { CategoryService } from '../service/category.service';
import { ICreateCategoryRequest, IUpdateCategoryRequest, ICategoryIdParams } from '../interface/category.interface';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createCategorySchema, updateCategorySchema } from '../utils/zod_validations/category.zod';

export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }


    /**
     * @desc Validates request body and creates a new category for the authenticated user.
     *       Requires a non-empty 'name' field. User must be authenticated.
     * @returns 201 Created with category data on success
     *          400 Bad Request if validation fails
     *          401 Unauthorized if user is not authenticated
     *          500 Internal Server Error on server failure
     */
    async createCategory(req: AuthRequest<{}, {}, ICreateCategoryRequest>, res: Response): Promise<void> {
        try {
            const parsed = createCategorySchema.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ success: false, errors: parsed.error.errors });
                return;
            }

            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const category = await this.categoryService.createCategory(parsed.data, user.id);
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }




    /**
     * @desc Fetches and returns all categories available in the system.
     *       No authentication required.
     * @returns 200 OK with array of categories on success
     *          500 Internal Server Error on failure
     */
    async getCategories(req: Request, res: Response): Promise<void> {
        try {
            const categories = await this.categoryService.getCategories();
            res.status(200).json({ success: true, data: categories });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }




    /**
    * @desc Retrieves a specific category by its ID.
    *       Ensures the ID is a valid number.
    * @returns 200 OK with category data if found
    *          400 Bad Request if ID is invalid
    *          404 Not Found if category does not exist
    *          500 Internal Server Error on server error
    */
    async getCategoryById(req: Request<ICategoryIdParams>, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            const category = await this.categoryService.getCategoryById(id);
            if (!category) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }

            res.status(200).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }





    /**
     * @desc Validates input and updates a specific category by its ID for the authenticated user.
     *       Requires user authentication and a valid ID. 'name' is optional but must be a non-empty string if provided.
     * @returns 200 OK with updated category data on success
     *          400 Bad Request if validation fails or ID is invalid
     *          401 Unauthorized if user is not logged in
     *          404 Not Found if category does not exist
     *          500 Internal Server Error on server failure
     */
    async updateCategory(req: AuthRequest<ICategoryIdParams, {}, IUpdateCategoryRequest>, res: Response): Promise<void> {
        try {
            const parsed = updateCategorySchema.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ success: false, errors: parsed.error.errors });
                return;
            }
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const id = req.params.id;
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            const category = await this.categoryService.updateCategory(id, parsed.data, user.id);
            if (!category) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }

            res.status(200).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }




    /**
     * @desc Deletes a category by its ID, ensuring the authenticated user is the owner.
     *       ID must be valid. User must be authenticated.
     * @returns 204 No Content on successful deletion
     *          400 Bad Request if ID is invalid
     *          401 Unauthorized if user is not logged in
     *          500 Internal Server Error on failure
     */
    async deleteCategory(req: AuthRequest<ICategoryIdParams>, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const id = req.params.id;
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            await this.categoryService.deleteCategory(id, user.id);
            res.status(204).json({ success: true, message: 'Category deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

}