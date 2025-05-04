import { Request, Response } from 'express';
import { SubcategoryService } from '../service/subcategory.service';
import { ICreateSubcategoryRequest, IUpdateSubcategoryRequest, ISubcategoryIdParams } from '../interface/subcategory.interface';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createSubCategorySchema } from '../utils/zod_validations/subcategory.zod';
import { updateCategorySchema } from '../utils/zod_validations/category.zod';

export class SubcategoryController {
    private subcategoryService: SubcategoryService;

    constructor() {
        this.subcategoryService = new SubcategoryService();
    }



    /**
     * @desc Creates a new subcategory under a specified category.
     *       Validates the request body using Zod, ensures the user is authenticated,
     *       and associates the new subcategory with the provided category ID and user ID.
     * @return Returns the created subcategory object on success, or error details if validation or authentication fails.
     */
    async createSubcategory(req: AuthRequest<{ categoryId: number }, {}, ICreateSubcategoryRequest>, res: Response): Promise<void> {
        try {
            const parsed = createSubCategorySchema.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ success: false, errors: parsed.error.errors });
                return;
            }

            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const categoryId = req.params.categoryId;
            if (isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            const subcategory = await this.subcategoryService.createSubcategory(parsed.data, categoryId, user.id);
            res.status(201).json({ success: true, data: subcategory });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }



    /**
    * @desc Retrieves all subcategories belonging to a given category.
    *       The category ID is validated from the request parameters.
    *       Useful for listing subcategories under a specific category for frontend display or filtering.
    * @return Returns an array of subcategory objects or an error message if the category ID is invalid or an internal error occurs.
    */
    async getSubcategories(req: Request<{ categoryId: number }>, res: Response): Promise<void> {
        try {
            const categoryId = req.params.categoryId;
            if (isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            const subcategories = await this.subcategoryService.getSubcategories(categoryId);
            res.status(200).json({ success: true, data: subcategories });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }



    /**
     * @desc Fetches a single subcategory by its ID and parent category ID.
     *       Ensures both IDs are valid and checks for the existence of the subcategory.
     *       Ideal for displaying detailed information about a specific subcategory.
     * @return Returns the found subcategory object or a 404 error if not found, or validation errors for bad IDs.
     */
    async getSubcategoryById(req: Request<ISubcategoryIdParams>, res: Response): Promise<void> {
        try {
            const { id, categoryId } = req.params;
            if (isNaN(id) || isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid subcategory or category ID' });
                return;
            }

            const subcategory = await this.subcategoryService.getSubcategoryById(id, categoryId);
            if (!subcategory) {
                res.status(404).json({ success: false, message: 'Subcategory not found' });
                return;
            }

            res.status(200).json({ success: true, data: subcategory });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }



    /**
     * @desc Updates an existing subcategory’s information such as name or description.
     *       Validates the request body using Zod and checks the user’s authentication and ownership.
     *       Ensures subcategory and category IDs are correct before proceeding.
     * @return Returns the updated subcategory object, or appropriate error messages for validation/auth/ownership issues.
     */
    async updateSubcategory(req: AuthRequest<ISubcategoryIdParams, {}, IUpdateSubcategoryRequest>, res: Response): Promise<void> {
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

            const { id, categoryId } = req.params;
            if (isNaN(id) || isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid subcategory or category ID' });
                return;
            }

            const subcategory = await this.subcategoryService.updateSubcategory(id, parsed.data, categoryId, user.id);
            if (!subcategory) {
                res.status(404).json({ success: false, message: 'Subcategory not found' });
                return;
            }

            res.status(200).json({ success: true, data: subcategory });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }



    /**
     * @desc Deletes a subcategory identified by its ID and the parent category ID.
     *       Requires authentication and ensures the user is the owner of the subcategory.
     *       Used to manage and clean up subcategory records when no longer needed.
     * @return Returns a success message with 204 status code upon successful deletion, or appropriate errors otherwise.
     */
    async deleteSubcategory(req: AuthRequest<ISubcategoryIdParams>, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { id, categoryId } = req.params;
            if (isNaN(id) || isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid subcategory or category ID' });
                return;
            }

            await this.subcategoryService.deleteSubcategory(id, categoryId, user.id);
            res.status(204).json({ success: true, message: 'Subcategory deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}